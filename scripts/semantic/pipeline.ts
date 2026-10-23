/**
 * sg-sem training data pipeline (SKILL_GRAPH_SEMANTIC_MODEL_SPEC.md §7). Runs our real graph library, so the
 * examples are built by the same code the connector runs. Text that needs a language model (outlines,
 * verifier answers, plain-word phrases, gates) is written by a local open model on Colab between the steps:
 *
 *   round1   → round1.requests.jsonl                      (outlines to draft, one per topic and shape)
 *   [Colab]  → round1.outputs.jsonl
 *   round2   → seeds.jsonl, round2.requests.jsonl         (starters + valid drafted graphs; H1, H2, H4 text jobs)
 *   [Colab]  → round2.outputs.jsonl
 *   assemble → examples.jsonl, stats.json, samples.md     (labelled examples, split by seed graph)
 *
 *   mock --in X.requests.jsonl --out X.outputs.jsonl      (stand-in answers, to test the pipeline without a GPU)
 *
 * Run: npx vite-node scripts/semantic/pipeline.ts <command> --out <dir> [options]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { draftGraph } from "../../src/app/graph/lib/graphDraft";
import { editGraph } from "../../src/app/graph/lib/graphEdit";
import { parseGraphSkill, predecessorsOf, runsWithoutSubagent, validateGraph, foreachSource, nodeRefs, getContract, type GraphNode, type SkillGraph } from "../../src/app/graph/lib/graphSkill";
import { CONNECTOR_TEMPLATES } from "../../src/app/graph/lib/graphTemplates";
import { SEMANTIC_INPUT_VERSION, TASK_PREFIX, contractInput, gateInput, missingInputInput, taskText, verdictInput } from "../../src/app/graph/lib/semanticInput";
import {
  H1_BURIED,
  H1_INCONSISTENT,
  H1_STYLES,
  H4_LABELS,
  h1Request,
  h2Request,
  h2WeaveRequest,
  h4Request,
  outlineRequest,
  readH1,
  readH2,
  readH2Weave,
  readH4,
  readJson,
  type H1Style,
  type LlmOutput,
  type LlmRequest,
} from "./llmPrompts";
import { CODE_TOPICS, EVERYDAY_TOPICS, OUTLINE_SHAPES } from "./topics";

/* ------------------------------------------------------------------ small helpers */

function args(): { command: string; flags: Record<string, string> } {
  const [command = "", ...rest] = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i].startsWith("--")) {
      flags[rest[i].slice(2)] = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[i + 1] : "true";
      if (flags[rest[i].slice(2)] !== "true") i += 1;
    }
  }
  return { command, flags };
}

function readJsonl<T>(path: string, required = false): T[] {
  if (!existsSync(path)) {
    if (required) throw new Error(`${path} does not exist: run the step before this one first.`);
    return [];
  }
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T);
}

function writeJsonl(path: string, rows: unknown[]): void {
  writeFileSync(path, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length > 0 ? "\n" : ""), "utf8");
}

/** FNV-1a, for stable splits and seeded choices. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** A deterministic random number generator per key (mulberry32). */
function rng(key: string): () => number {
  let a = hash(key);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The request with a short hash of its prompt added to its id. Answers are kept by id across runs, so when a
 * prompt changes, its requests get new ids and are asked again instead of reusing answers to the old prompt.
 */
function keyedByPrompt(request: LlmRequest): LlmRequest {
  return { ...request, id: `${request.id}@${hash(`${request.system}\n${request.user}`).toString(36)}` };
}

/** Every example of one seed graph lands in the same split, so the test never holds a graph seen in training. */
export function splitOf(seed: string): "train" | "dev" | "test" {
  const bucket = hash(`split:${seed}`) % 10;
  return bucket === 0 ? "test" : bucket === 1 ? "dev" : "train";
}

function load(source: string): SkillGraph | null {
  return parseGraphSkill(source).graph;
}

function errorsOf(source: string): number {
  return errorMessages(source).length;
}

function errorMessages(source: string): string[] {
  const graph = load(source);
  return graph ? validateGraph(graph).filter((issue) => issue.severity === "error").map((issue) => issue.message) : ["does not parse"];
}

/** An error message with its ids and numbers taken out, so the same mistake counts as one reason. */
function reasonOf(message: string): string {
  return message.replace(/"[^"]*"/g, "…").replace(/\d+/g, "N").slice(0, 120);
}

/**
 * Drops the optional fields a text model copies from the template with no value ("foreach": "",
 * "keys": [], "gate": null): the drafter reads those as wrong values and rejects the whole outline.
 * A step that fans out over an earlier step's list also gets that step in its after, which the model forgets.
 */
export function cleanOutline(outline: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(outline.steps)) return outline;
  const empty = (value: unknown) => value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);
  const earlier = new Set<string>();
  const steps = outline.steps.map((step: unknown) => {
    if (typeof step !== "object" || step === null || Array.isArray(step)) return step;
    const clean: Record<string, unknown> = Object.fromEntries(Object.entries(step).filter(([key, value]) => key === "after" || !empty(value)));
    const from = typeof clean.foreach === "string" ? clean.foreach.split(".")[0] : "";
    if (earlier.has(from) && Array.isArray(clean.after) && !clean.after.includes(from)) clean.after = [...clean.after, from];
    if (typeof clean.id === "string") earlier.add(clean.id);
    return clean;
  });
  return { ...outline, steps };
}

/** Model steps: the ones with a prompt an agent follows. */
function modelSteps(graph: SkillGraph): GraphNode[] {
  return graph.nodes.filter((node) => node.type !== "input" && !runsWithoutSubagent(node.type));
}

/** The inputs line of a step, without the model's markers, for a text-model prompt. */
function inputsForPrompt(graph: SkillGraph, node: GraphNode): string {
  return missingInputInput(graph, node).textB.replace(/\[INPUT\]\s*/g, "\n- ").trim();
}

function describeStep(graph: SkillGraph, node: GraphNode): string {
  const edge = graph.edges.find((e) => e.from === node.id && e.contract);
  const contract = edge?.contract ? getContract(graph, edge.contract) : undefined;
  return `${node.label || node.id}: ${contract?.description ?? taskText(node).slice(0, 240)}`;
}

/* ------------------------------------------------------------------ records */

export interface Seed {
  seed: string;
  origin: "starter" | "draft";
  source: string;
  /** Drafted seeds: the cleaned outline `source` was drafted from, so a step can be drafted again with other text or inputs. */
  outline?: Record<string, unknown>;
}

export interface Example {
  head: "h1" | "h2" | "h3" | "h4";
  seed: string;
  split: "train" | "dev" | "test";
  text_a: string;
  text_b: string;
  features: number[];
  label: number;
  /** H1: one 0/1 per [SEN] in text_b, in order. */
  sentences?: number[];
  /** H2 positives: [start, end) character offsets in text_a of the words that name the missing data. */
  span?: [number, number];
  source: "llm" | "mutation" | "starter";
  /** What produced it, for error analysis (style, mutation kind, gate label). */
  note: string;
}

/* ------------------------------------------------------------------ round 1 */

export function round1(out: string, perPair: number): void {
  const requests: LlmRequest[] = [];
  const topics = [...EVERYDAY_TOPICS.map((t) => [t, "chat"] as const), ...CODE_TOPICS.map((t) => [t, "claude_code"] as const)];
  for (const [topicIndex, [topic, runsIn]] of topics.entries()) {
    const random = rng(`shapes:${topic}`);
    const shapes = [...OUTLINE_SHAPES].sort(() => random() - 0.5).slice(0, perPair);
    shapes.forEach((shape, index) => requests.push(outlineRequest(`outline-${topicIndex}-${index}`, topic, shape, runsIn)));
  }
  writeJsonl(join(out, "round1.requests.jsonl"), requests);
  console.log(`round1: ${requests.length} outline requests → ${join(out, "round1.requests.jsonl")}`);
}

/* ------------------------------------------------------------------ round 2 */

function seedsFrom(out: string): { seeds: Seed[]; drafted: number; rejected: Record<string, number>; reasons: Record<string, number> } {
  const seeds: Seed[] = CONNECTOR_TEMPLATES.map((template) => ({ seed: template.id, origin: "starter", source: template.source }));
  const requests = new Map(readJsonl<LlmRequest>(join(out, "round1.requests.jsonl"), true).map((request) => [request.id, request]));
  const rejected: Record<string, number> = { json: 0, draft: 0, errors: 0, duplicate: 0 };
  const reasons: Record<string, number> = {};
  const because = (message: string) => (reasons[reasonOf(message)] = (reasons[reasonOf(message)] ?? 0) + 1);
  let drafted = 0;
  const names = new Set(seeds.map((seed) => seed.seed));
  for (const output of readJsonl<LlmOutput>(join(out, "round1.outputs.jsonl"), true)) {
    const outline = readJson(output.text);
    const request = requests.get(output.id);
    if (!outline || !request) {
      rejected.json += 1;
      continue;
    }
    const args = { ...cleanOutline(outline), runs_in: request.meta.runs_in };
    const draft = draftGraph(args);
    if ("error" in draft) {
      rejected.draft += 1;
      because(draft.error);
      continue;
    }
    const errors = errorMessages(draft.source);
    if (errors.length > 0) {
      rejected.errors += 1;
      because(errors[0]);
      continue;
    }
    const name = `draft-${output.id}`;
    if (names.has(name)) {
      rejected.duplicate += 1;
      continue;
    }
    names.add(name);
    seeds.push({ seed: name, origin: "draft", source: draft.source, outline: args });
    drafted += 1;
  }
  return { seeds, drafted, rejected, reasons };
}

/** Matches every `{{pred}}` or `{{pred.key}}` reference. */
function refsTo(pred: string): RegExp {
  return new RegExp(`\{\{\s*${pred}(?:\.[^}]*)?\s*\}\}`, "g");
}

/**
 * The step's prompt without the heading block that named `pred` (a drafted prompt holds one per input, e.g.
 * `READ RECEIPTS:\n{{read_receipts}}`), and whether an inline `{{pred}}` reference remains in the text. The block
 * spells the step id in capitals, so a positive that kept it would teach a token match instead of a reading.
 */
function withoutInput(prompt: string, pred: string): { prompt: string; inline: boolean } {
  const block = new RegExp(`(^|\n\n)([^\n]{1,120}):\n\{\{\s*${pred}(?:\.[^}]*)?\s*\}\}(?=\n\n|$)`);
  const heading = block.exec(prompt)?.[2] ?? "";
  // Only a heading that spells the step id in capitals goes; a written one ("The claims:") stays, and its reference becomes the phrase.
  const stripped =
    /[A-Z]/.test(heading) && heading === heading.toUpperCase()
      ? prompt.replace(block, "").replace(/^\n\n/, "")
      : prompt;
  return { prompt: stripped, inline: refsTo(pred).test(stripped) };
}

/** The cleaned outline step a drafted node came from; null for a starter or a step the outline does not hold. */
function outlineStep(seed: Seed | undefined, id: string): { task: string; after: string[] } | null {
  const steps = seed?.outline?.steps;
  const step = Array.isArray(steps) ? (steps as Record<string, unknown>[]).find((s) => s.id === id) : undefined;
  if (!step || typeof step.task !== "string") return null;
  return { task: step.task, after: Array.isArray(step.after) ? step.after.filter((a): a is string => typeof a === "string") : [] };
}

/**
 * The seed drafted again with one step's task text and inputs changed, the way the gold cuts are built: the
 * drafter writes the heading blocks, and the request block for a step left with no input. Null on a draft or checker error.
 */
function redraft(seed: Seed, id: string, task: string, after: string[]): { graph: SkillGraph; node: GraphNode } | null {
  const outline = seed.outline as Record<string, unknown>;
  const steps = (outline.steps as Record<string, unknown>[]).map((step) => (step.id === id ? { ...step, task, after } : step));
  const draft = draftGraph({ ...outline, steps });
  if ("error" in draft || errorsOf(draft.source) > 0) return null;
  const graph = load(draft.source) as SkillGraph;
  const node = graph.nodes.find((n) => n.id === id);
  return node ? { graph, node } : null;
}

/** The step with `pred` disconnected and `prompt` set; a step left with no input reads the request. Null when the checker rejects the edit. */
function cutStep(source: string, graph: SkillGraph, node: GraphNode, pred: string, prompt: string): ReturnType<typeof missingInputInput> | null {
  const remaining = [...new Set(predecessorsOf(graph, node.id))].filter((id) => id !== pred);
  const input = graph.nodes.find((n) => n.type === "input");
  const cut = editGraph(source, [
    { op: "set_prompt", id: node.id, prompt },
    { op: "disconnect", from: pred, to: node.id },
    ...(remaining.length === 0 && input ? [{ op: "connect" as const, from: input.id, to: node.id }] : []),
  ]);
  if ("error" in cut || errorsOf(cut.source) > 0) return null;
  const cutGraph = load(cut.source) as SkillGraph;
  return missingInputInput(cutGraph, cutGraph.nodes.find((n) => n.id === node.id) as GraphNode);
}

/**
 * A step that reads `pred`: removing that edge leaves it working on less. The list a step fans out over is skipped.
 * `phrase`: an inline `{{pred}}` stays in the text and the LLM names it in plain words. `weave`: the reference was
 * only a heading block, so the LLM rewrites the step's outline task to name its inputs in words (h2WeaveRequest).
 */
function h2Candidates(graph: SkillGraph): { node: GraphNode; pred: GraphNode; ref: string; prompt: string; mode: "phrase" | "weave" }[] {
  const out: { node: GraphNode; pred: GraphNode; ref: string; prompt: string; mode: "phrase" | "weave" }[] = [];
  for (const node of modelSteps(graph)) {
    const preds = [...new Set(predecessorsOf(graph, node.id))].map((id) => graph.nodes.find((n) => n.id === id)).filter((n): n is GraphNode => n !== undefined);
    const list = foreachSource(node);
    for (const pred of preds) {
      if (pred.type === "input" || runsWithoutSubagent(pred.type) || list?.node === pred.id) continue;
      const ref = nodeRefs(node).find((r) => r.head === pred.id);
      if (!ref) continue;
      const { prompt, inline } = withoutInput(node.prompt, pred.id);
      out.push({ node, pred, ref: ref.raw, prompt, mode: inline ? "phrase" : "weave" });
    }
  }
  return out;
}

/** H2 text jobs per seed graph: 6 through minilm-4; the weave jobs make nearly all positives now. */
const H2_PER_SEED = 8;

export function round2(out: string, h1Samples: number): void {
  const { seeds, drafted, rejected, reasons } = seedsFrom(out);
  writeJsonl(join(out, "seeds.jsonl"), seeds);
  const requests: LlmRequest[] = [];
  for (const seed of seeds) {
    const graph = load(seed.source);
    if (!graph) continue;
    for (const node of modelSteps(graph)) {
      if (!node.gate) continue;
      const task = taskText(node).slice(0, 700);
      const inputs = inputsForPrompt(graph, node);
      for (const style of H1_STYLES) {
        for (let sample = 0; sample < h1Samples; sample += 1) {
          const request = h1Request(`${seed.seed}::h1::${node.id}::${style}::${sample}`, style, node.gate, task, inputs);
          requests.push(keyedByPrompt({ ...request, meta: { ...request.meta, seed: seed.seed, node: node.id } }));
        }
      }
      const gates = h4Request(`${seed.seed}::h4::${node.id}`, task, inputs);
      requests.push(keyedByPrompt({ ...gates, meta: { seed: seed.seed, node: node.id } }));
    }
    // A weave job needs the step's outline task with no reference of its own: a drafted step, not a starter.
    const usable = h2Candidates(graph).filter((c) => c.mode === "phrase" || /^[^{}]+$/.test(outlineStep(seed, c.node.id)?.task ?? "{"));
    for (const { node, pred, ref, prompt, mode } of usable.slice(0, H2_PER_SEED)) {
      const id = `${seed.seed}::h2::${node.id}::${pred.id}`;
      const reads = [...new Set(predecessorsOf(graph, node.id))].map((p) => graph.nodes.find((n) => n.id === p)).filter((n): n is GraphNode => n !== undefined && n.type !== "input");
      const request =
        mode === "phrase"
          ? h2Request(id, taskText({ ...node, prompt }).slice(0, 900), ref, describeStep(graph, pred))
          : h2WeaveRequest(id, (outlineStep(seed, node.id) as { task: string }).task.slice(0, 900), reads.map((n) => describeStep(graph, n)), pred.label || pred.id);
      requests.push(keyedByPrompt({ ...request, meta: { ...request.meta, seed: seed.seed, node: node.id, pred: pred.id } }));
    }
  }
  writeJsonl(join(out, "round2.requests.jsonl"), requests);
  const kinds = requests.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.kind]: (acc[r.kind] ?? 0) + 1 }), {});
  console.log(`round2: ${seeds.length} seeds (${drafted} drafted; rejected ${JSON.stringify(rejected)}), ${requests.length} requests ${JSON.stringify(kinds)}`);
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (top.length > 0) console.log(`why outlines were rejected:\n${top.map(([reason, count]) => `  ${count} × ${reason}`).join("\n")}`);
}

/* ------------------------------------------------------------------ assemble */

function normal(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Writes a verifier answer the way answers come: as bullets, numbered points or a paragraph. */
function formatAnswer(sentences: string[], key: string): string {
  const random = rng(`format:${key}`)();
  const body = random < 0.35 ? sentences.map((s) => `- ${s}`).join("\n") : random < 0.6 ? sentences.map((s, i) => `${i + 1}. ${s}`).join("\n") : sentences.join(" ");
  return `${body}\n\nGATE: PASS`;
}

function words(text: string): Set<string> {
  return new Set(normal(text).split(" ").filter((w) => w.length > 3));
}

function jaccard(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  const both = [...x].filter((w) => y.has(w)).length;
  return x.size + y.size === 0 ? 1 : both / (x.size + y.size - both);
}

export function assemble(out: string): void {
  const seeds = new Map(readJsonl<Seed>(join(out, "seeds.jsonl"), true).map((seed) => [seed.seed, seed]));
  const requests = new Map(readJsonl<LlmRequest>(join(out, "round2.requests.jsonl"), true).map((request) => [request.id, request]));
  const examples: Example[] = [];
  const dropped: Record<string, number> = {};
  const drop = (why: string) => (dropped[why] = (dropped[why] ?? 0) + 1);
  const graphs = new Map<string, SkillGraph>();
  const graphOf = (seed: string) => {
    if (!graphs.has(seed)) {
      const graph = load(seeds.get(seed)?.source ?? "");
      if (graph) graphs.set(seed, graph);
    }
    return graphs.get(seed);
  };

  for (const output of readJsonl<LlmOutput>(join(out, "round2.outputs.jsonl"), true)) {
    const request = requests.get(output.id);
    if (!request) continue;
    const seed = String(request.meta.seed);
    const graph = graphOf(seed);
    const node = graph?.nodes.find((n) => n.id === request.meta.node);
    if (!graph || !node) continue;
    const base = { seed, split: splitOf(seed) };

    if (request.kind === "h1") {
      const style = request.meta.style as H1Style;
      const answer = readH1(output.text, style);
      if ("reject" in answer) {
        drop(`h1-${style}-${answer.reject}`);
        continue;
      }
      const pair = verdictInput(graph, node, formatAnswer(answer.sentences.map((s) => s.text), output.id));
      if (!pair) {
        drop("h1-no-verdict");
        continue;
      }
      const flagged = answer.sentences.filter((s) => s.open).map((s) => normal(s.text));
      const sentences = pair.sentences.map((sentence) => {
        const piece = normal(sentence);
        return flagged.some((flag) => flag.length > 0 && (piece.includes(flag) || flag.includes(piece))) ? 1 : 0;
      });
      if (H1_BURIED.has(style) && !sentences.includes(1)) {
        drop("h1-flag-lost");
        continue;
      }
      examples.push({ head: "h1", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: H1_INCONSISTENT.has(style) ? 1 : 0, sentences, source: "llm", note: style });
      continue;
    }

    if (request.kind === "h2" && request.meta.mode === "weave") {
      /*
       * Three rows per answer, built like the gold cuts (the outline drafted again):
       *   cut      the woven task, the input gone from after: the task names data the step no longer gets (label 1)
       *   kept     the same prompt with the input still connected: identical text A, so only the list tells them apart
       *   dropped  the task without that mention, the input gone: identical input list and graph facts, so only the
       *            words of the task tell them apart (minilm-3 read the list and facts alone; see MEMORY.md)
       */
      const pred = String(request.meta.pred);
      const seedRow = seeds.get(seed);
      const step = outlineStep(seedRow, node.id);
      if (!seedRow || !step) continue;
      const answer = readH2Weave(output.text, step.task, graph.nodes.map((n) => n.id));
      if ("reject" in answer) {
        drop(`h2-weave-${answer.reject}`);
        continue;
      }
      const after = step.after.filter((id) => id !== pred);
      const cut = redraft(seedRow, node.id, answer.task, after);
      const kept = cut ? editGraph(seedRow.source, [{ op: "set_prompt", id: node.id, prompt: cut.node.prompt }]) : null;
      if (!cut || !kept || "error" in kept || errorsOf(kept.source) > 0) {
        drop("h2-checker-error");
        continue;
      }
      const positive = missingInputInput(cut.graph, cut.node);
      const at = positive.textA.toLowerCase().indexOf(answer.phrase.toLowerCase(), TASK_PREFIX.length);
      if (at === -1) {
        drop("h2-span-cut");
        continue;
      }
      const keptGraph = load(kept.source) as SkillGraph;
      const negative = missingInputInput(keptGraph, keptGraph.nodes.find((n) => n.id === node.id) as GraphNode);
      examples.push({ head: "h2", ...base, text_a: positive.textA, text_b: positive.textB, features: positive.features, label: 1, span: [at, at + answer.phrase.length], source: "llm", note: `cut ${pred}` });
      examples.push({ head: "h2", ...base, text_a: negative.textA, text_b: negative.textB, features: negative.features, label: 0, source: "llm", note: `kept ${pred}` });
      const without = redraft(seedRow, node.id, answer.without, after);
      if (without) {
        const dropped = missingInputInput(without.graph, without.node);
        examples.push({ head: "h2", ...base, text_a: dropped.textA, text_b: dropped.textB, features: dropped.features, label: 0, source: "llm", note: `dropped ${pred}` });
      } else drop("h2-dropped-checker-error");
      continue;
    }

    if (request.kind === "h2") {
      const pred = String(request.meta.pred);
      const phrase = readH2(output.text);
      if (!phrase) {
        drop("h2-unreadable");
        continue;
      }
      const source = seeds.get(seed)?.source ?? "";
      // The heading block that named the input goes and the inline reference becomes the plain-word phrase.
      const rewritten = withoutInput(node.prompt, pred).prompt.replace(refsTo(pred), phrase);
      if (rewritten === node.prompt) {
        drop("h2-no-ref");
        continue;
      }
      const kept = editGraph(source, [{ op: "set_prompt", id: node.id, prompt: rewritten }]);
      // A step left with no input reads the request, like a first step; its task still names the data it lost.
      const positive = cutStep(source, graph, node, pred, rewritten);
      if ("error" in kept || errorsOf(kept.source) > 0 || !positive) {
        drop("h2-checker-error");
        continue;
      }
      const keptGraph = load(kept.source) as SkillGraph;
      const keptNode = keptGraph.nodes.find((n) => n.id === node.id) as GraphNode;
      const at = positive.textA.toLowerCase().indexOf(phrase.toLowerCase(), TASK_PREFIX.length);
      if (at === -1) {
        drop("h2-span-cut");
        continue;
      }
      const negative = missingInputInput(keptGraph, keptNode);
      examples.push({ head: "h2", ...base, text_a: positive.textA, text_b: positive.textB, features: positive.features, label: 1, span: [at, at + phrase.length], source: "mutation", note: `cut ${pred}` });
      examples.push({ head: "h2", ...base, text_a: negative.textA, text_b: negative.textB, features: negative.features, label: 0, source: "mutation", note: `kept ${pred}` });
      continue;
    }

    if (request.kind === "h4") {
      const gates = readH4(output.text);
      if (gates.length === 0) drop("h4-unreadable");
      for (const gate of gates) {
        const pair = gateInput(graph, { ...node, gate: gate.text });
        if (!pair) continue;
        examples.push({ head: "h4", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: H4_LABELS.indexOf(gate.label), source: "llm", note: gate.label });
      }
    }
  }

  // Without a text model: H2 negatives from every step as written, H3 from contract swaps, H4 from the starters' own gates.
  for (const seed of seeds.values()) {
    const graph = graphOf(seed.seed);
    if (!graph) continue;
    const base = { seed: seed.seed, split: splitOf(seed.seed) };
    for (const node of modelSteps(graph)) {
      const pair = missingInputInput(graph, node);
      examples.push({ head: "h2", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 0, source: seed.origin === "starter" ? "starter" : "mutation", note: "as written" });
      if (seed.origin === "starter" && node.gate) {
        const gate = gateInput(graph, node);
        if (gate) examples.push({ head: "h4", ...base, text_a: gate.textA, text_b: gate.textB, features: gate.features, label: 0, source: "starter", note: "starter gate" });
      }
    }
    const names = [...new Set(graph.edges.map((edge) => edge.contract).filter((name): name is string => Boolean(name)))];
    for (const name of names) {
      const pair = contractInput(graph, name);
      if (pair) examples.push({ head: "h3", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 0, source: "mutation", note: "as written" });
    }
    let swaps = 0;
    for (const a of names) {
      for (const b of names) {
        if (a === b || swaps >= 3) continue;
        const first = getContract(graph, a);
        const second = getContract(graph, b);
        if (!first || !second || jaccard(first.description, second.description) >= 0.35) continue;
        const swapped: SkillGraph = { ...graph, contracts: { ...graph.contracts, [a]: { ...first, description: second.description } } };
        const pair = contractInput(swapped, a);
        if (!pair) continue;
        examples.push({ head: "h3", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 1, source: "mutation", note: `description of ${b}` });
        swaps += 1;
      }
    }
  }

  writeJsonl(join(out, "examples.jsonl"), examples);
  const stats: Record<string, Record<string, number>> = {};
  for (const example of examples) {
    const key = `${example.head}/${example.split}`;
    stats[key] ??= {};
    stats[key][`label${example.label}`] = (stats[key][`label${example.label}`] ?? 0) + 1;
  }
  writeFileSync(join(out, "stats.json"), JSON.stringify({ input_version: SEMANTIC_INPUT_VERSION, seeds: seeds.size, examples: examples.length, by_head_split: stats, dropped }, null, 2));
  const samples: string[] = ["# sg-sem samples", ""];
  for (const head of ["h1", "h2", "h3", "h4"] as const) {
    for (const label of [0, 1, 2]) {
      const pick = examples.filter((e) => e.head === head && e.label === label).slice(0, 3);
      for (const example of pick) {
        samples.push(`## ${head} label ${label} (${example.note}, ${example.seed})`, "", "```", example.text_a, "", example.text_b, "```", "");
        if (example.sentences) samples.push(`sentence labels: ${example.sentences.join("")}`, "");
        if (example.span) samples.push(`span: "${example.text_a.slice(example.span[0], example.span[1])}"`, "");
      }
    }
  }
  writeFileSync(join(out, "samples.md"), samples.join("\n"));
  console.log(`assemble: ${examples.length} examples from ${seeds.size} seeds; dropped ${JSON.stringify(dropped)}`);
  console.log(JSON.stringify(stats));
}

/* ------------------------------------------------------------------ mock text model */

/** Stand-in answers with the right shape, so every stage can be tested without a GPU. Not training data. */
export function mockAnswer(request: LlmRequest): string {
  const r = rng(request.id);
  if (request.kind === "outline") {
    const topic = String(request.meta.topic ?? "the task");
    return JSON.stringify({
      name: `mock-${hash(request.id) % 100000}`,
      description: `Handles ${topic}.`,
      input_label: "REQUEST",
      steps: [
        { id: "gather", type: "worker", task: `Collect the facts needed for ${topic} and return them as a numbered list with sources.`, returns: "a numbered list of facts with sources" },
        { id: "options", type: "worker", task: `List the main options for ${topic}, each with one advantage and one risk.`, returns: "a list of options with advantages and risks" },
        { id: "check", type: "verifier", task: "Check every fact against its source and every option against the facts.", after: ["gather", "options"], gate: "Every fact has a source that says it and every option uses only checked facts." },
        { id: "write", type: "synthesizer", task: "Write the final answer from the checked facts and options: {{check}} and {{gather}}.", after: ["check", "gather"] },
      ],
    });
  }
  if (request.kind === "h1") {
    const style = request.meta.style as H1Style;
    const good = ["The first claim matches the cited page, which states 5 hours.", "All 7 items list a price with a link.", "The totals add up to 1,240 as stated."];
    const bad = ["The second source could not be opened, so claim 2 is unverified.", "The budget table still leaves out the hotel tax."];
    const fixed = ["Claim 3 had a dead link; it now cites the official report, which confirms it."];
    const numbers = ["The hotel line totals 1,240 while its three nights add up to 1,310.", "Day 3 lists the museum for Monday, when its page gives Tuesday to Sunday as opening days."];
    const ledger = ["Narrative: 11 pages against the 12-page limit.", "Equipment 18,500 against a cap of 25,000.", "The call closes 15 March; the cover sheet is dated 2 March."];
    const sentences =
      style === "honest_pass"
        ? good.map((text) => ({ text, open_problem: false }))
        : style === "honest_number_pass"
          ? ledger.map((text) => ({ text, open_problem: false }))
        : style === "buried_problem_pass"
          ? [good[0], bad[Math.floor(r() * 2)], good[1]].map((text) => ({ text, open_problem: bad.includes(text) }))
          : style === "buried_number_pass"
            ? [good[0], numbers[Math.floor(r() * 2)], good[2]].map((text) => ({ text, open_problem: numbers.includes(text) }))
            : style === "no_evidence_pass"
            ? [{ text: "Everything looks thorough and well organised.", open_problem: false }, { text: "The work meets the requirements.", open_problem: false }]
            : [good[0], fixed[0], good[2]].map((text) => ({ text, open_problem: false }));
    return JSON.stringify({ sentences });
  }
  if (request.kind === "h2") {
    const phrase = `the results of the earlier ${String(request.meta.ref).split(".")[0].replace(/_/g, " ")} step`;
    if (request.meta.mode === "weave") {
      const task = /^Task: (.*)$/m.exec(request.user)?.[1] ?? "Do the work.";
      return JSON.stringify({ task: `Starting from ${phrase}, ${task}`, phrase, without: `Working carefully with everything you were handed here earlier, ${task}` });
    }
    return JSON.stringify({ phrase });
  }
  return JSON.stringify({
    checkable: ["Every total equals the sum of its line items.", "Each claim cites a source that is in the inputs.", "No two items contradict each other on price or date."],
    partly: ["Every item has a price and the plan feels balanced.", "All dates are listed and the tone is friendly."],
    not: ["The result is excellent.", "The user will be happy with it.", "It is better than what competitors would do next year."],
  });
}

export function mock(input: string, output: string): void {
  const requests = readJsonl<LlmRequest>(input, true);
  writeJsonl(output, requests.map((request) => ({ id: request.id, text: mockAnswer(request) })));
  console.log(`mock: ${requests.length} answers → ${output}`);
}

/* ------------------------------------------------------------------ entry */

// Run as a command unless a test imports this file. (vite-node drops the script path from argv, and argv[1]
// is vite-node's own path, which differs by system: `vite-node.mjs` on Windows, `.bin/vite-node` on Linux.)
const isMain = !process.env.VITEST;
if (isMain) {
  const { command, flags } = args();
  const out = flags.out ?? "ml/sg-sem/.data";
  mkdirSync(out, { recursive: true });
  if (command === "round1") round1(out, Number(flags["per-topic"] ?? 4));
  else if (command === "round2") round2(out, Number(flags["h1-samples"] ?? 3));
  else if (command === "assemble") assemble(out);
  else if (command === "mock") mock(flags.in ?? "", flags.output ?? "");
  else {
    console.error("usage: pipeline.ts round1|round2|assemble --out <dir> | mock --in <requests.jsonl> --output <outputs.jsonl>");
    process.exitCode = 1;
  }
}
