/**
 * The one serializer of sg-sem, the Skill Graph semantic checker model (SKILL_GRAPH_SEMANTIC_MODEL_SPEC.md):
 * it turns a graph, a step, a contract or a verifier's answer into the text pair and the 16 numbers the
 * model reads. The training data builder (scripts/semantic) and the connector's inference use this same
 * code, so the text the model trained on and the text it sees live cannot drift apart.
 *
 * Changing what any function here writes changes the model's input: retrain, or the model reads text it
 * never saw. `__tests__/semanticInput.test.ts` pins the output for that reason.
 */
import { PLAIN_TYPE } from "./graphPlainLabels";
import { parseVerdict } from "./graphRun";
import {
  NODE_TYPES,
  foreachSource,
  getContract,
  jsonKeysFor,
  nodeRefs,
  predecessorsOf,
  successorsOf,
  type GraphNode,
  type SkillGraph,
} from "./graphSkill";

/** Bump when the serialized text or features change; the model manifest records the version it was trained on. */
export const SEMANTIC_INPUT_VERSION = 1;

/** Tokens added to the encoder's vocabulary; their embeddings are learned in fine-tuning. */
export const SEM_SPECIAL_TOKENS = ["[H1]", "[H2]", "[H3]", "[H4]", "[GATE]", "[TASK]", "[INPUT]", "[CONTRACT]", "[READS]", "[VERDICT]", "[SEN]"] as const;

export const FEATURE_COUNT = 16;

/** Character caps, so text stays near the model's 384-token window (about 4 characters per token). */
const MAX_GATE = 400;
const MAX_TASK = 1_600;
const MAX_INPUT_LINE = 240;
const MAX_INPUTS = 8;
const MAX_BODY = 1_500;
const MAX_SENTENCES = 40;
const MAX_CONTRACT = 500;
const MAX_READS = 600;
const MAX_PRODUCER_TASK = 500;

export interface SemanticPair {
  textA: string;
  textB: string;
  features: number[];
}

export interface VerdictPair extends SemanticPair {
  /** The answer's sentences, in order, as they appear after each `[SEN]` in textB. */
  sentences: string[];
  verdict: "PASS" | "FAIL";
}

/* ------------------------------------------------------------------ text helpers */

/** One line, no runs of spaces. */
function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Keeps the start and the end of a long text; the middle of a task is the least informative part. */
function capMiddle(text: string, max: number): string {
  if (text.length <= max) return text;
  const half = Math.floor((max - 3) / 2);
  return `${text.slice(0, half).trimEnd()} … ${text.slice(text.length - half).trimStart()}`;
}

/**
 * Splits an answer into sentences: one per line or list item, and lines into sentences at ". " before a
 * capital, digit or quote. Markdown markers (bullets, numbers, headings, bold) are dropped.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw
      .replace(/^\s*(?:[-*+]|\d+[.)]|#{1,6})\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (line === "" || /^[-=*_|:\s]+$/.test(line)) continue;
    for (const part of line.split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9])/)) {
      const sentence = flat(part);
      if (sentence.length > 1) out.push(sentence);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ graph facts */

function nodeById(graph: SkillGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

function uniquePreds(graph: SkillGraph, node: GraphNode): GraphNode[] {
  return [...new Set(predecessorsOf(graph, node.id))].map((id) => nodeById(graph, id)).filter((n): n is GraphNode => n !== undefined);
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Keys the steps after `node` read from it that its contracts do not require. */
function unrequiredReads(graph: SkillGraph, node: GraphNode): number {
  const required = new Set<string>();
  for (const edge of graph.edges.filter((e) => e.from === node.id && e.contract)) for (const key of getContract(graph, edge.contract as string)?.required ?? []) required.add(key);
  const read = new Set<string>();
  for (const id of new Set(successorsOf(graph, node.id))) {
    const consumer = nodeById(graph, id);
    if (!consumer) continue;
    for (const ref of nodeRefs(consumer)) if (ref.head === node.id && ref.path !== "" && ref.path !== "output") read.add(ref.path.split(".")[0]);
  }
  return [...read].filter((key) => !required.has(key)).length;
}

/** The 16 graph facts of a step (spec §5), each scaled to 0–1. `verdictFound` is set for H1 only. */
export function featuresFor(graph: SkillGraph, node: GraphNode, verdictFound = false): number[] {
  const preds = uniquePreds(graph, node);
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const jsonInputs = incoming.filter((edge) => edge.contract && getContract(graph, edge.contract)?.format === "json").length;
  const outgoing = graph.edges.find((edge) => edge.from === node.id && edge.contract);
  const outContract = outgoing?.contract ? getContract(graph, outgoing.contract) : undefined;
  const formats = ["json", "markdown", "text"];
  const features = [
    NODE_TYPES.indexOf(node.type) / (NODE_TYPES.length - 1),
    node.isolatedContext ? 1 : 0,
    node.gate ? 1 : 0,
    clamp01(words(node.gate ?? "") / 40),
    node.onFail === "retry" ? 1 : 0,
    node.foreach ? 1 : 0,
    node.loop ? 1 : 0,
    clamp01(words(node.prompt) / 400),
    clamp01(preds.length / 10),
    incoming.length > 0 ? jsonInputs / incoming.length : 0,
    preds.length > 0 && preds.every((pred) => pred.type === "input") ? 1 : 0,
    outContract ? Math.max(0, formats.indexOf(outContract.format)) / 2 : 0,
    clamp01((outContract?.required?.length ?? 0) / 10),
    clamp01(unrequiredReads(graph, node) / 10),
    clamp01(new Set(successorsOf(graph, node.id)).size / 10),
    verdictFound ? 1 : 0,
  ];
  return features.map((value) => Math.round(value * 10_000) / 10_000);
}

/** What one input of a step carries, in one line: `[INPUT] id · Role · what it is`. */
function inputLine(graph: SkillGraph, source: GraphNode, consumer: GraphNode): string {
  if (source.type === "input") return `[INPUT] ${source.id} · ${PLAIN_TYPE.input} · ${flat(source.label) || "the user's request"}`;
  if (source.type === "approval") return `[INPUT] ${source.id} · ${PLAIN_TYPE.approval} · the user's answer to: ${cap(flat(source.prompt), 120)}`;
  const edge = graph.edges.find((e) => e.from === source.id && e.to === consumer.id && e.contract);
  const contract = edge?.contract ? getContract(graph, edge.contract) : undefined;
  const keys = jsonKeysFor(graph, source, consumer);
  const what = contract?.description ? flat(contract.description) : `${flat(source.label)}: ${cap(flat(source.prompt), 160)}`;
  const list = consumer.foreach && foreachSource(consumer)?.node === source.id ? " (one entry per run)" : "";
  return cap(`[INPUT] ${source.id} · ${PLAIN_TYPE[source.type]} · ${what}${keys ? ` · keys read: ${keys.join(", ")}` : ""}${list}`, MAX_INPUT_LINE);
}

function inputsText(graph: SkillGraph, node: GraphNode): string {
  const lines = uniquePreds(graph, node).slice(0, MAX_INPUTS).map((pred) => inputLine(graph, pred, node));
  return lines.length > 0 ? lines.join(" ") : "[INPUT] none";
}

/* ------------------------------------------------------------------ the four heads */

/**
 * H1: a verifier's answer, its gate and its verdict. The body keeps its last sentences (the verdict's
 * reasons sit at the end); null when the answer has no `GATE:` line or the step has no gate.
 */
export function verdictInput(graph: SkillGraph, node: GraphNode, answer: string): VerdictPair | null {
  if (!node.gate) return null;
  const verdict = parseVerdict(answer);
  if (!verdict) return null;
  const all = splitSentences([verdict.work, verdict.lines].filter(Boolean).join("\n"));
  const kept: string[] = [];
  let size = 0;
  for (let i = all.length - 1; i >= 0 && kept.length < MAX_SENTENCES; i -= 1) {
    const sentence = cap(all[i], 400);
    if (size + sentence.length > MAX_BODY && kept.length > 0) break;
    kept.unshift(sentence);
    size += sentence.length + 6;
  }
  const label = verdict.pass ? "PASS" : "FAIL";
  return {
    textA: `[H1] [GATE] ${cap(flat(node.gate), MAX_GATE)}`,
    textB: `${kept.map((sentence) => `[SEN] ${sentence}`).join(" ")} [VERDICT] ${label}`.trim(),
    features: featuresFor(graph, node, true),
    sentences: kept,
    verdict: label,
  };
}

/** The prefix of an H2 textA; a span offset in the training data counts from the start of textA. */
export const TASK_PREFIX = "[H2] [TASK] ";

/** The task text H2 reads: the step's prompt on one line, start and end kept. */
export function taskText(node: GraphNode): string {
  return capMiddle(flat(node.prompt), MAX_TASK);
}

/** H2: a step's task, and what each of its inputs carries. */
export function missingInputInput(graph: SkillGraph, node: GraphNode): SemanticPair {
  return { textA: `${TASK_PREFIX}${taskText(node)}`, textB: inputsText(graph, node), features: featuresFor(graph, node) };
}

/**
 * H3: a contract's description, against the task of the step that produces it and what the steps after
 * its edges read. A description can only contradict something that is written down; without the
 * producer's task, a step that reads the whole output gives the model nothing to compare with.
 */
export function contractInput(graph: SkillGraph, name: string): SemanticPair | null {
  const contract = getContract(graph, name);
  if (!contract) return null;
  const edges = graph.edges.filter((edge) => edge.contract === name);
  if (edges.length === 0) return null;
  const reads: string[] = [];
  for (const edge of edges) {
    const consumer = nodeById(graph, edge.to);
    if (!consumer) continue;
    const refs = [...new Set(nodeRefs(consumer).filter((ref) => ref.head === edge.from).map((ref) => `{{${ref.raw}}}`))];
    const list = foreachSource(consumer)?.node === edge.from ? `, once per entry of ${consumer.foreach}` : "";
    reads.push(`${consumer.id} reads ${refs.length > 0 ? refs.join(" ") : "the whole output"}${list}`);
  }
  const source = nodeById(graph, edges[0].from);
  const made = source ? `[TASK] ${source.id} · ${PLAIN_TYPE[source.type]} · ${cap(taskText(source), MAX_PRODUCER_TASK)} ` : "";
  return {
    textA: `[H3] [CONTRACT] ${name} · ${contract.format} · ${cap(flat(contract.description), MAX_CONTRACT)}`,
    textB: `${made}[READS] ${cap([...new Set(reads)].join(" · "), MAX_READS)} · required: ${contract.required && contract.required.length > 0 ? contract.required.join(", ") : "none"}`,
    features: source ? featuresFor(graph, source) : new Array<number>(FEATURE_COUNT).fill(0),
  };
}

/** H4: a gate, and the inputs a checker would decide it from. Null for a step without a gate. */
export function gateInput(graph: SkillGraph, node: GraphNode): SemanticPair | null {
  if (!node.gate) return null;
  return { textA: `[H4] [GATE] ${cap(flat(node.gate), MAX_GATE)}`, textB: inputsText(graph, node), features: featuresFor(graph, node) };
}
