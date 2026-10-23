/**
 * The semantic checker at run time (spec §6, §9): the gate head (H4) of the sg-sem model, run in the connector's
 * function on every gate of a graph, in memory. It answers whether a gate can be decided from the step's inputs
 * (checkable / partly / not), and a step whose gate reads as "not" above the model's threshold gets the warning
 * `semantic-gate-uncheckable` in place of the word-count rule `gate-vague`.
 *
 * The model files live in models/sg-sem (traced into the function by next.config.ts): the int8 ONNX graph,
 * vocab.txt and a manifest with the threshold and temperature chosen on the training run's dev split. It is loaded
 * once per function instance, lazily on the first call, and runs single-threaded, so the same gate always scores
 * the same. Every call has a time budget; when the model is not loaded or runs over, the caller gets null and
 * the connector answers exactly as it does without the model. Nothing about a graph is logged.
 *
 * Server only (reads files, loads the ONNX runtime): never import this from a client component.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gateInput, FEATURE_COUNT, SEMANTIC_INPUT_VERSION } from "./semanticInput";
import { WordPieceTokenizer } from "./semanticTokenizer";
import { parseGraphSkill, type SkillGraph } from "./graphSkill";

export const GATE_LABELS = ["checkable", "partly", "not"] as const;
export type GateLabel = (typeof GATE_LABELS)[number];

/** What the model said about one gate. `gate` is the step's gate text as parsed, so a verdict is applied only to that very gate. */
export interface GateVerdict {
  step: string;
  gate: string;
  label: GateLabel;
  /** p(not checkable), calibrated: the confidence a warning shows. */
  score: number;
  /** Above the model's threshold: the connector warns. */
  flagged: boolean;
}

/** Time a tool call may spend on the model, loading included; past it, the connector answers without it. */
export const SEMANTIC_BUDGET_MS = 1_500;

const MODEL_DIR = process.env.SG_SEM_MODEL_DIR ?? join(process.cwd(), "models", "sg-sem");
const MANIFEST = "sg-sem-h4-1.json";

interface Manifest {
  name: string;
  version: number;
  input_version: number;
  model: string;
  sha256: string;
  vocab: string;
  max_len: number;
  inputs: [string, string, string, string];
  output: string;
  labels: GateLabel[];
  temperature: number;
  threshold: number;
}

type Ort = typeof import("onnxruntime-web");

interface Runtime {
  ort: Ort;
  session: import("onnxruntime-web").InferenceSession;
  tokenizer: WordPieceTokenizer;
  manifest: Manifest;
}

let loading: Promise<Runtime | null> | undefined;

/** Reads the manifest, the vocabulary and the model, checks the model's hash, and opens one session. */
async function load(): Promise<Runtime | null> {
  const started = Date.now();
  try {
    const manifest = JSON.parse(await readFile(join(MODEL_DIR, MANIFEST), "utf8")) as Manifest;
    if (manifest.input_version !== SEMANTIC_INPUT_VERSION) {
      throw new Error(`model trained on input version ${manifest.input_version}, serializer is ${SEMANTIC_INPUT_VERSION}`);
    }
    const [vocab, bytes] = await Promise.all([readFile(join(MODEL_DIR, manifest.vocab), "utf8"), readFile(join(MODEL_DIR, manifest.model))]);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== manifest.sha256) throw new Error("model file does not match its manifest");
    const ort = await import("onnxruntime-web");
    ort.env.wasm.numThreads = 1;
    ort.env.logLevel = "error";
    const session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], graphOptimizationLevel: "all", intraOpNumThreads: 1 });
    // A timing only, never anything about a graph: how long a fresh instance takes to be ready.
    console.info(`[skill-graph-mcp] semantic model ready in ${Date.now() - started} ms`);
    return { ort, session, tokenizer: new WordPieceTokenizer(vocab), manifest };
  } catch (error) {
    // Logged once per instance; the connector keeps working without the model.
    console.warn(`[skill-graph-mcp] semantic model unavailable (${error instanceof Error ? error.message : typeof error})`);
    return null;
  }
}

function runtime(): Promise<Runtime | null> {
  loading ??= load();
  return loading;
}

/**
 * Starts loading the model without waiting for it, and returns the load so the route can keep the function
 * alive until it ends (`after()` in route.ts): on Vercel, work left running when a response is sent is paused,
 * so a load started on `initialize` without that only advanced during later requests and was rarely ready for
 * the first check. Resolves at once when the model is already loaded.
 */
export function warmGateModel(): Promise<void> {
  return runtime().then(() => undefined);
}

function softmax(logits: Float32Array, temperature: number): number[] {
  const scaled = Array.from(logits, (value) => value / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((value) => value / sum);
}

async function scoreGate(rt: Runtime, graph: SkillGraph, node: SkillGraph["nodes"][number]): Promise<GateVerdict | null> {
  const pair = gateInput(graph, node);
  if (!pair || !node.gate) return null;
  const { ids, types } = rt.tokenizer.encode(pair.textA, pair.textB, rt.manifest.max_len);
  const length = ids.length;
  const int64 = (values: number[]) => new rt.ort.Tensor("int64", BigInt64Array.from(values, (value) => BigInt(value)), [1, length]);
  const [idsName, maskName, typesName, featsName] = rt.manifest.inputs;
  const output = await rt.session.run({
    [idsName]: int64(ids),
    [maskName]: int64(new Array<number>(length).fill(1)),
    [typesName]: int64(types),
    [featsName]: new rt.ort.Tensor("float32", Float32Array.from(pair.features.slice(0, FEATURE_COUNT)), [1, FEATURE_COUNT]),
  });
  const logits = output[rt.manifest.output].data as Float32Array;
  const probabilities = softmax(logits, rt.manifest.temperature);
  const notAt = rt.manifest.labels.indexOf("not");
  const best = probabilities.indexOf(Math.max(...probabilities));
  const score = probabilities[notAt];
  return { step: node.id, gate: node.gate, label: rt.manifest.labels[best], score: Math.round(score * 100) / 100, flagged: score >= rt.manifest.threshold };
}

/**
 * The gate verdicts for the graphs in `sources`, one gate at a time (a batch pads every gate to the longest and
 * is slower), within `budgetMs`. Null when the model is not available or not loaded in time; a graph that does
 * not parse, or a step without a gate, contributes nothing. Gates scored before the budget ran out are returned.
 *
 * On an instance where nothing has started the load yet (no `initialize` reached it), the call waits only
 * `coldWaitMs`, by default not at all: it starts the load for the next call and answers without the model, rather
 * than make Claude wait out the budget and still get no verdict (5.8 s against 2.4 s on the first preview test).
 */
export async function gateVerdicts(sources: readonly string[], budgetMs = SEMANTIC_BUDGET_MS, coldWaitMs = 0): Promise<GateVerdict[] | null> {
  const started = Date.now();
  const wait = loading === undefined ? Math.min(coldWaitMs, budgetMs) : budgetMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const rt = await Promise.race([runtime(), new Promise<null>((resolve) => (timer = setTimeout(resolve, wait, null)))]);
  clearTimeout(timer);
  if (!rt) return null;
  const verdicts: GateVerdict[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    const graph = parseGraphSkill(source).graph;
    if (!graph) continue;
    for (const node of graph.nodes) {
      if (!node.gate || seen.has(`${node.id}\n${node.gate}`)) continue;
      if (Date.now() - started > budgetMs) return verdicts;
      try {
        const verdict = await scoreGate(rt, graph, node);
        if (verdict) {
          verdicts.push(verdict);
          seen.add(`${node.id}\n${node.gate}`);
        }
      } catch (error) {
        console.warn(`[skill-graph-mcp] semantic gate check failed (${error instanceof Error ? error.name : typeof error})`);
        return verdicts;
      }
    }
  }
  return verdicts;
}
