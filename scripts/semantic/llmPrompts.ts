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
      "Rules: ids are unique; every id in after is an earlier step; at least one verifier with a concrete gate; at least one later step reads from two or more earlier steps (its after lists both); tasks are specific to the topic, not generic.",
    ].join("\n"),
    max_new_tokens: 1_100,
    temperature: 0.9,
    meta: { topic, shape, runs_in: runsIn },
  };
}

/* ------------------------------------------------------------------ round 2: H1 verifier answers */

export const H1_STYLES = ["honest_pass", "honest_number_pass", "buried_problem_pass", "buried_number_pass", "no_evidence_pass", "resolved_problem_pass"] as const;
export type H1Style = (typeof H1_STYLES)[number];

/** Answers in these styles say PASS while the gate is not met: the label H1 learns to flag. */
export const H1_INCONSISTENT: ReadonlySet<H1Style> = new Set(["buried_problem_pass", "buried_number_pass", "no_evidence_pass"]);
/** Answers that bury 1 to 3 open problems among sentences saying parts are fine. */
export const H1_BURIED: ReadonlySet<H1Style> = new Set(["buried_problem_pass", "buried_number_pass"]);

const H1_STYLE_TEXT: Record<H1Style, string> = {
  honest_pass:
    "The work meets the gate. Write 4 to 9 sentences of review. Each sentence gives concrete evidence from the work: a quoted phrase, a number, a date, a named item. Nothing is left unresolved. Every open_problem is false.",
  honest_number_pass:
    "The work meets the gate. Write 4 to 9 sentences in a terse ledger style: each sentence sets a figure, a date, a count or a quoted item against the limit or requirement it must meet, and every one is within it (the kind of sentence, from other tasks: \"Narrative: 11 pages against the 12-page limit.\" \"Equipment 18,500 against a cap of 25,000.\" \"The call closes 15 March; the cover sheet is dated 2 March.\" \"Rents: 1,100, 1,180, 1,050; budget 1,200.\"). Let the figures speak: at most one sentence may say in words that something is within its limit, and none uses the words fine, correct, meets, passes or good. Every open_problem is false.",
  buried_problem_pass:
    "The reviewer finds 1 or 2 real problems that break the gate and are NOT fixed. Write 4 to 9 sentences: most give concrete evidence that parts are fine; 1 or 2 sentences in the middle state a problem in a matter-of-fact tone, without calling it blocking. A problem sentence names the exact item and what is still wrong with it: missing, unverified, wrong, contradicted or out of date (the kind of sentence, from another task: \"The hotel line still totals 1,240 while its three nights add up to 1,310.\"). Advice or a problem that was fixed is not one. Mark exactly the problem sentences with open_problem true.",
  buried_number_pass:
    "The reviewer finds 1 or 2 real problems that break the gate and are NOT fixed, but states each one only through a number, a date, a quoted phrase or a comparison, in the same matter-of-fact tone as the other sentences (the kind of sentence, from other tasks: \"Equipment totals 27,300 against a cap of 25,000.\" or \"Day 3 lists the museum for Monday, when its page gives Tuesday to Sunday as opening days.\"). A problem sentence uses none of the words not, no, missing, wrong, fails, still, only, unverified or unclear. Write 4 to 9 sentences; the others give concrete evidence that parts are fine. Mark exactly the problem sentences with open_problem true.",
  no_evidence_pass:
    "The reviewer gives no concrete evidence at all: exactly 3 generic, approving sentences, each its own entry in the list (e.g. that it looks thorough, that it is well organised, that it follows the instructions). No digits, no quotes, no named items, no examples. Every open_problem is false.",
  resolved_problem_pass:
    "The reviewer found 1 or 2 problems, and each one is already fixed, with the evidence of the fix (the kind of sentence, from another task: \"Day 2 first listed a museum that is closed on Mondays; it was replaced with the 10:00 harbour tour, which is open.\"). The other sentences give concrete evidence: a quoted phrase, a number, a date, a named item. Write 4 to 9 sentences. Every open_problem is false, because nothing is left open.",
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

/** A sentence with something checkable in it: a digit or a quoted phrase. */
const CONCRETE = /\d|["“][^"”]{3,}["”]|(^|\s)['‘][^'’]{3,}['’](\W|$)/;
/** Words a sentence stating an open problem uses; advice ("ensure all claims are current") has none. */
const PROBLEM =
  /\b(not|no|never|none|missing|lacks?|lacking|without|unverified|unsupported|unsourced|unclear|wrong|incorrect|inaccurate|contradict\w*|conflict\w*|outdated|out of date|stale|fails?|failed|cannot|can't|couldn't|isn't|aren't|doesn't|don't|didn't|wasn't|weren't|only|still|absent|omit\w*|left out|mismatch\w*|differs?|exceeds?|broken|dead|skipped|ignores?|ignored)\b/i;
/** Words a ledger sentence uses when its figure is past the limit: an honest ledger must not contain one. */
const OVER_LIMIT = /\b(exceed\w*|over the|above the|beyond the|past the|short of|outside the|later than|after the deadline|more than the)\b/i;
/** Words a sentence about a fixed problem uses, unless negated ("no claims were dropped"). */
const FIX_WORDS = "fixed|corrected|resolved|replaced|updated|removed|dropped|swapped|changed|now";
const FIXED = new RegExp(`\\b(${FIX_WORDS})\\b`, "i");
const NOT_FIXED = new RegExp(`\\b(no|not|nothing|never|none|without)\\b(\\s+\\S+){0,4}?\\s+(${FIX_WORDS})\\b`, "i");
const statesFix = (text: string) => FIXED.test(text) && !NOT_FIXED.test(text);

/**
 * Reads an H1 answer. One whose sentences contradict the style asked for is rejected with the reason, so the
 * label always matches the text: a pass "with evidence" has concrete sentences, one "without evidence" has
 * none, a buried problem is stated as a problem (not as advice or a fix), and a resolved problem shows the fix.
 */
export function readH1(text: string, style: H1Style): H1Answer | { reject: string } {
  const json = readJson(text);
  if (!json || !Array.isArray(json.sentences)) return { reject: "json" };
  const sentences = json.sentences
    .filter((item): item is { text: string; open_problem?: unknown } => typeof item === "object" && item !== null && typeof (item as { text?: unknown }).text === "string")
    .map((item) => ({ text: item.text.replace(/\s+/g, " ").trim(), open: item.open_problem === true }))
    .filter((item) => item.text.length > 3 && !/GATE:\s*(PASS|FAIL)/i.test(item.text));
  if (sentences.length < 2 || sentences.length > 14) return { reject: "length" };
  const open = sentences.filter((item) => item.open);
  if (H1_BURIED.has(style) ? open.length < 1 || open.length > 3 : open.length > 0) return { reject: "open-count" };
  const concrete = sentences.filter((item) => CONCRETE.test(item.text)).length;
  if (style === "no_evidence_pass" && concrete > 0) return { reject: "has-evidence" };
  if ((style === "honest_pass" || style === "resolved_problem_pass") && concrete < Math.max(2, Math.ceil(sentences.length / 3))) return { reject: "no-evidence" };
  if (style === "honest_number_pass" && concrete < Math.max(3, Math.ceil((sentences.length * 2) / 3))) return { reject: "no-evidence" };
  if (style === "honest_number_pass" && sentences.some((item) => OVER_LIMIT.test(item.text))) return { reject: "over-limit" };
  if (style === "buried_problem_pass" && open.some((item) => !PROBLEM.test(item.text) || statesFix(item.text))) return { reject: "not-a-problem" };
  if (style === "buried_number_pass" && open.some((item) => !CONCRETE.test(item.text) || statesFix(item.text))) return { reject: "not-a-problem" };
  if (style === "resolved_problem_pass" && !sentences.some((item) => statesFix(item.text))) return { reject: "no-fix" };
  return { sentences };
}

/* ------------------------------------------------------------------ round 2: H2 plain-word inputs */

/**
 * H2 text job, in one of two modes. `phrase`: the step's task holds an inline `{{ref}}` to the earlier step (the
 * starters do), and the model writes the plain-word phrase that replaces it. `quote`: the task names that data in
 * words already (drafted graphs: the reference sat in a heading block the pipeline removes), and the model quotes
 * those words. Either way the words become the span the warning quotes.
 */
export function h2Request(id: string, task: string, ref: string, source: string, mode: "phrase" | "insert"): LlmRequest {
  const user =
    mode === "phrase"
      ? [
          `This instruction to an AI step contains the placeholder {{${ref}}}: it is filled in with the output of an earlier step.`,
          "",
          `Instruction: ${task}`,
          `The earlier step: ${source}`,
          "",
          `Write a short noun phrase (2 to 8 words) that names the data {{${ref}}} stands for, as a person would write it in the instruction instead of the placeholder, e.g. "the list of claims with their sources". No braces, no step ids.`,
          "",
          'Return: {"phrase": "..."}',
        ]
      : [
          "This instruction to an AI step works on the output of an earlier step, but the lines that handed that output over are gone, so it no longer says what it works on.",
          "",
          `Instruction: ${task}`,
          `The earlier step: ${source}`,
          "",
          'Write one sentence to put into the instruction that tells the step to use that data, naming the data in plain words as a person would, e.g. "Check each claim against the list of sources from the research." or "Use the scores of every criterion for the final grade." 8 to 25 words; no step ids, no braces. Also return the words of your sentence that name the data (2 to 8 words, copied exactly from the sentence).',
          "",
          'Return: {"sentence": "...", "phrase": "..."}',
        ];
  return {
    id,
    kind: "h2",
    system: SYSTEM,
    user: user.join("\n"),
    max_new_tokens: mode === "phrase" ? 60 : 120,
    temperature: 0.7,
    meta: { ref, mode },
  };
}

const cleanWords = (value: string) => value.replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");

/** The phrase of a phrase-mode H2 answer; null when there is none. */
export function readH2(text: string): string | null {
  const json = readJson(text);
  const value = json?.phrase;
  if (typeof value !== "string") return null;
  const clean = cleanWords(value);
  const words = clean.split(" ").length;
  return words >= 2 && words <= 12 && !/[{}]/.test(clean) ? clean : null;
}

/** An insert-mode H2 answer: the sentence to put into the task and the words of it that name the data; null when unusable. */
export function readH2Insert(text: string): { sentence: string; phrase: string } | null {
  const json = readJson(text);
  if (typeof json?.sentence !== "string" || typeof json?.phrase !== "string") return null;
  const sentence = cleanWords(json.sentence);
  const phrase = cleanWords(json.phrase);
  const sentenceWords = sentence.split(" ").length;
  const phraseWords = phrase.split(" ").length;
  if (sentenceWords < 6 || sentenceWords > 40 || phraseWords < 2 || phraseWords > 12 || /[{}]/.test(sentence)) return null;
  if (!sentence.toLowerCase().includes(phrase.toLowerCase())) return null;
  return { sentence: /[.!?]$/.test(sentence) ? sentence : `${sentence}.`, phrase };
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
      "Write 8 different gates for this checker. A gate is a statement of what must be true to pass, not a question (e.g. \"Every total equals the sum of its line items.\"):",
      '- 3 in "checkable": concrete and decidable from what it receives (what to compare, count, match or confirm).',
      '- 2 in "partly": one concrete part joined to a subjective or unverifiable part.',
      '- 3 in "not": only subjective or vague (about feelings, quality or the future), or needing information it does not receive.',
      "Vary the length from 3 to 30 words.",
      "",
      'Return: {"checkable": ["...", "...", "..."], "partly": ["...", "..."], "not": ["...", "...", "..."]}',
    ].join("\n"),
    max_new_tokens: 500,
    temperature: 0.9,
    meta: {},
  };
}

/** Reads the gates of an H4 answer: the list a gate is in is its label, so the text was written for that label. */
export function readH4(text: string): { text: string; label: H4Label }[] {
  const json = readJson(text);
  if (!json) return [];
  const seen = new Set<string>();
  return H4_LABELS.flatMap((label) => {
    const list = json[label];
    return (Array.isArray(list) ? list : [])
      .filter((item): item is string => typeof item === "string")
      .map((item) => ({ text: item.replace(/\s+/g, " ").trim(), label }))
      .filter((item) => item.text.length >= 8 && item.text.length <= 400 && !item.text.endsWith("?") && !seen.has(item.text.toLowerCase()) && seen.add(item.text.toLowerCase()));
  });
}
