/**
 * What the local text model is asked in each generation round, and how its answers are read back.
 * Every request asks for JSON only; anything that does not parse, or breaks the rules a kind needs, is
 * dropped by the reader, so a bad generation costs one example, never a wrong label.
 */

export interface LlmRequest {
  id: string;
  kind: "outline" | "h1" | "h2" | "h4";
  system: string;
  user: string;
  max_new_tokens: number;
  temperature: number;
  meta: Record<string, string | number>;
}

export interface LlmOutput {
  id: string;
  text: string;
}

const SYSTEM = "You write training data for a checker of AI workflows. Answer with one JSON object and nothing else: no prose, no code fences.";

/** The first JSON object in a model answer, or null. Tolerates code fences and text around it. */
export function readJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const value: unknown = JSON.parse(text.slice(start, end + 1));
    return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ round 1: outlines */

export function outlineRequest(id: string, topic: string, shape: string, runsIn: "chat" | "claude_code"): LlmRequest {
  return {
    id,
    kind: "outline",
    system: SYSTEM,
    user: [
      `Design a multi-step AI workflow for: ${topic}.`,
      `Shape: ${shape}.`,
      `It runs in ${runsIn === "chat" ? "a chat assistant with web search" : "a coding agent inside a git repository"}.`,
      "",
      "Return this JSON:",
      '{"name": "kebab-case-name", "description": "one sentence", "input_label": "WHAT THE USER GIVES, in capitals", "steps": [',
      '  {"id": "snake_case_id", "type": "orchestrator|worker|verifier|synthesizer", "task": "2 to 4 sentences of concrete instructions to the agent doing this step, naming what it works from and what it returns", "after": ["ids of earlier steps it reads; empty for the first step"], "returns": "what it hands back, in one sentence", "keys": ["only if it returns JSON: top-level keys"], "gate": "verifiers only: what must be true to pass, concrete and checkable", "foreach": "only for a step that repeats: <step id>.<key> of a JSON list it reads"}',
      "]}",
      "",
      "Rules: ids are unique; every id in after is an earlier step; at least one verifier with a concrete gate; tasks are specific to the topic, not generic.",
    ].join("\n"),
    max_new_tokens: 1_100,
    temperature: 0.9,
    meta: { topic, shape, runs_in: runsIn },
  };
}

/* ------------------------------------------------------------------ round 2: H1 verifier answers */

export const H1_STYLES = ["honest_pass", "buried_problem_pass", "no_evidence_pass", "resolved_problem_pass"] as const;
export type H1Style = (typeof H1_STYLES)[number];

/** Answers in these styles say PASS while the gate is not met: the label H1 learns to flag. */
export const H1_INCONSISTENT: ReadonlySet<H1Style> = new Set(["buried_problem_pass", "no_evidence_pass"]);

const H1_STYLE_TEXT: Record<H1Style, string> = {
  honest_pass:
    "The work meets the gate. Write 4 to 9 sentences of review. Each sentence gives concrete evidence from the work: a quote, a number, a source, a named item, a line. Nothing is left unresolved. Every open_problem is false.",
  buried_problem_pass:
    "The reviewer finds 1 or 2 real problems that break the gate and are NOT fixed (something missing, unverified, wrong, contradicted, out of date). Mention them in a matter-of-fact tone in the middle of otherwise positive sentences, without calling them blocking. Write 4 to 9 sentences. Mark exactly the sentences that state an unresolved problem with open_problem true.",
  no_evidence_pass:
    "The reviewer gives no concrete evidence at all: 2 to 5 generic, approving sentences with no quotes, numbers, sources or named items (e.g. that it looks thorough and well organised). Every open_problem is false.",
  resolved_problem_pass:
    "The reviewer found 1 or 2 problems, and each one is already fixed or shown not to matter, with the evidence of the fix. Write 4 to 9 sentences. Every open_problem is false, because nothing is left open.",
};

export function h1Request(id: string, style: H1Style, gate: string, task: string, inputs: string): LlmRequest {
  return {
    id,
    kind: "h1",
    system: SYSTEM,
    user: [
      "A checker step in an AI workflow reviewed the work below and ended with GATE: PASS. Write the review text it wrote before that line.",
      "",
      `The checker's gate (what must be true to pass): ${gate}`,
      `The checker's task: ${task}`,
      `What it received: ${inputs}`,
      "",
      `Style: ${H1_STYLE_TEXT[style]}`,
      "Invent realistic specific details that fit the task. Vary your wording; do not start every sentence the same way.",
      "",
      'Return: {"sentences": [{"text": "one sentence", "open_problem": false}]}',
    ].join("\n"),
    max_new_tokens: 600,
    temperature: 0.85,
    meta: { style },
  };
}

export interface H1Answer {
  sentences: { text: string; open: boolean }[];
}

/** Reads an H1 answer, and drops one whose sentence labels contradict the style asked for. */
export function readH1(text: string, style: H1Style): H1Answer | null {
  const json = readJson(text);
  if (!json || !Array.isArray(json.sentences)) return null;
  const sentences = json.sentences
    .filter((item): item is { text: string; open_problem?: unknown } => typeof item === "object" && item !== null && typeof (item as { text?: unknown }).text === "string")
    .map((item) => ({ text: item.text.replace(/\s+/g, " ").trim(), open: item.open_problem === true }))
    .filter((item) => item.text.length > 3 && !/GATE:\s*(PASS|FAIL)/i.test(item.text));
  if (sentences.length < 2 || sentences.length > 14) return null;
  const open = sentences.filter((item) => item.open).length;
  if (style === "buried_problem_pass" ? open < 1 || open > 3 : open > 0) return null;
  return { sentences };
}

/* ------------------------------------------------------------------ round 2: H2 plain-word inputs */

export function h2Request(id: string, task: string, ref: string, source: string): LlmRequest {
  return {
    id,
    kind: "h2",
    system: SYSTEM,
    user: [
      `This instruction to an AI step contains the placeholder {{${ref}}}: it is filled in with the output of an earlier step.`,
      "",
      `Instruction: ${task}`,
      `The earlier step: ${source}`,
      "",
      `Write a short noun phrase (2 to 8 words) that names the data {{${ref}}} stands for, as a person would write it in the instruction instead of the placeholder, e.g. "the list of claims with their sources". No braces, no step ids.`,
      "",
      'Return: {"phrase": "..."}',
    ].join("\n"),
    max_new_tokens: 60,
    temperature: 0.7,
    meta: { ref },
  };
}

export function readH2(text: string): string | null {
  const phrase = readJson(text)?.phrase;
  if (typeof phrase !== "string") return null;
  const clean = phrase.replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");
  const words = clean.split(" ").length;
  return words >= 2 && words <= 12 && !/[{}]/.test(clean) ? clean : null;
}

/* ------------------------------------------------------------------ round 2: H4 gates */

export const H4_LABELS = ["checkable", "partly", "not"] as const;
export type H4Label = (typeof H4_LABELS)[number];

export function h4Request(id: string, task: string, inputs: string): LlmRequest {
  return {
    id,
    kind: "h4",
    system: SYSTEM,
    user: [
      "A checker step in an AI workflow decides PASS or FAIL against a gate (a pass rule), using only what it receives.",
      "",
      `The checker's task: ${task}`,
      `What it receives: ${inputs}`,
      "",
      "Write 8 different gates for this checker:",
      '- 3 "checkable": concrete and decidable from what it receives (what to compare, count, match or confirm).',
      '- 2 "partly": one concrete part plus a subjective or unverifiable part.',
      '- 3 "not": subjective, vague, about feelings, quality or the future, or needing information it does not receive.',
      "Vary the length from 3 to 30 words, and do not label them inside the text.",
      "",
      'Return: {"gates": [{"text": "...", "label": "checkable|partly|not"}]}',
    ].join("\n"),
    max_new_tokens: 500,
    temperature: 0.9,
    meta: {},
  };
}

export function readH4(text: string): { text: string; label: H4Label }[] {
  const gates = readJson(text)?.gates;
  if (!Array.isArray(gates)) return [];
  return gates
    .filter((item): item is { text: string; label: string } => typeof item === "object" && item !== null && typeof (item as { text?: unknown }).text === "string" && typeof (item as { label?: unknown }).label === "string")
    .map((item) => ({ text: item.text.replace(/\s+/g, " ").trim(), label: item.label.toLowerCase().trim() as H4Label }))
    .filter((item) => (H4_LABELS as readonly string[]).includes(item.label) && item.text.length >= 8 && item.text.length <= 400);
}
