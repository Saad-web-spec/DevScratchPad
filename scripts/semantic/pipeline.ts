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
  H1_INCONSISTENT,
  H1_STYLES,
  H4_LABELS,
  h1Request,
  h2Request,
  h4Request,
  outlineRequest,
  readH1,
  readH2,
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

function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
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

/** Every example of one seed graph lands in the same split, so the test never holds a graph seen in training. */
export function splitOf(seed: string): "train" | "dev" | "test" {
  const bucket = hash(`split:${seed}`) % 10;
  return bucket === 0 ? "test" : bucket === 1 ? "dev" : "train";
}

function load(source: string): SkillGraph | null {
  return parseGraphSkill(source).graph;
}

function errorsOf(source: string): number {
  const graph = load(source);
  return graph ? validateGraph(graph).filter((issue) => issue.severity === "error").length : 1;
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

function seedsFrom(out: string): { seeds: Seed[]; drafted: number; rejected: Record<string, number> } {
  const seeds: Seed[] = CONNECTOR_TEMPLATES.map((template) => ({ seed: template.id, origin: "starter", source: template.source }));
  const requests = new Map(readJsonl<LlmRequest>(join(out, "round1.requests.jsonl")).map((request) => [request.id, request]));
  const rejected: Record<string, number> = { json: 0, draft: 0, errors: 0, duplicate: 0 };
  let drafted = 0;
  const names = new Set(seeds.map((seed) => seed.seed));
  for (const output of readJsonl<LlmOutput>(join(out, "round1.outputs.jsonl"))) {
    const outline = readJson(output.text);
    const request = requests.get(output.id);
    if (!outline || !request) {
      rejected.json += 1;
      continue;
    }
    const draft = draftGraph({ ...outline, runs_in: request.meta.runs_in });
    if ("error" in draft) {
      rejected.draft += 1;
      continue;
    }
    if (errorsOf(draft.source) > 0) {
      rejected.errors += 1;
      continue;
    }
    const name = `draft-${output.id}`;
    if (names.has(name)) {
      rejected.duplicate += 1;
      continue;
    }
    names.add(name);
    seeds.push({ seed: name, origin: "draft", source: draft.source });
    drafted += 1;
  }
  return { seeds, drafted, rejected };
}

/** A step whose prompt reads `pred` and has another input too: removing that edge leaves it working on less. */
function h2Candidates(graph: SkillGraph): { node: GraphNode; pred: GraphNode; ref: string }[] {
  const out: { node: GraphNode; pred: GraphNode; ref: string }[] = [];
  for (const node of modelSteps(graph)) {
    const preds = [...new Set(predecessorsOf(graph, node.id))].map((id) => graph.nodes.find((n) => n.id === id)).filter((n): n is GraphNode => n !== undefined);
    if (preds.length < 2) continue;
    const list = foreachSource(node);
    for (const pred of preds) {
      if (pred.type === "input" || runsWithoutSubagent(pred.type) || list?.node === pred.id) continue;
      const ref = nodeRefs(node).find((r) => r.head === pred.id);
      if (ref) out.push({ node, pred, ref: ref.raw });
    }
  }
  return out;
}

export function round2(out: string, h1Samples: number): void {
  const { seeds, drafted, rejected } = seedsFrom(out);
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
          requests.push({ ...request, meta: { ...request.meta, seed: seed.seed, node: node.id } });
        }
      }
      const gates = h4Request(`${seed.seed}::h4::${node.id}`, task, inputs);
      requests.push({ ...gates, meta: { seed: seed.seed, node: node.id } });
    }
    for (const { node, pred, ref } of h2Candidates(graph).slice(0, 4)) {
      const request = h2Request(`${seed.seed}::h2::${node.id}::${pred.id}`, taskText(node).slice(0, 900), ref, describeStep(graph, pred));
      requests.push({ ...request, meta: { ...request.meta, seed: seed.seed, node: node.id, pred: pred.id } });
    }
  }
  writeJsonl(join(out, "round2.requests.jsonl"), requests);
  const kinds = requests.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.kind]: (acc[r.kind] ?? 0) + 1 }), {});
  console.log(`round2: ${seeds.length} seeds (${drafted} drafted; rejected ${JSON.stringify(rejected)}), ${requests.length} requests ${JSON.stringify(kinds)}`);
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
  const seeds = new Map(readJsonl<Seed>(join(out, "seeds.jsonl")).map((seed) => [seed.seed, seed]));
  const requests = new Map(readJsonl<LlmRequest>(join(out, "round2.requests.jsonl")).map((request) => [request.id, request]));
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

  for (const output of readJsonl<LlmOutput>(join(out, "round2.outputs.jsonl"))) {
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
      if (!answer) {
        drop(`h1-unreadable-${style}`);
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
      if (style === "buried_problem_pass" && !sentences.includes(1)) {
        drop("h1-flag-lost");
        continue;
      }
      examples.push({ head: "h1", ...base, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: H1_INCONSISTENT.has(style) ? 1 : 0, sentences, source: "llm", note: style });
      continue;
    }

    if (request.kind === "h2") {
      const phrase = readH2(output.text);
      const pred = String(request.meta.pred);
      if (!phrase) {
        drop("h2-unreadable");
        continue;
      }
      const source = seeds.get(seed)?.source ?? "";
      const pattern = new RegExp(`\\{\\{\\s*${pred}(?:\\.[^}]*)?\\s*\\}\\}`, "g");
      const rewritten = node.prompt.replace(pattern, phrase);
      if (rewritten === node.prompt) {
        drop("h2-no-ref");
        continue;
      }
      const kept = editGraph(source, [{ op: "set_prompt", id: node.id, prompt: rewritten }]);
      const cut = editGraph(source, [
        { op: "set_prompt", id: node.id, prompt: rewritten },
        { op: "disconnect", from: pred, to: node.id },
      ]);
      if ("error" in kept || "error" in cut || errorsOf(kept.source) > 0 || errorsOf(cut.source) > 0) {
        drop("h2-checker-error");
        continue;
      }
      const keptGraph = load(kept.source) as SkillGraph;
      const cutGraph = load(cut.source) as SkillGraph;
      const keptNode = keptGraph.nodes.find((n) => n.id === node.id) as GraphNode;
      const cutNode = cutGraph.nodes.find((n) => n.id === node.id) as GraphNode;
      const positive = missingInputInput(cutGraph, cutNode);
      const at = positive.textA.indexOf(phrase, TASK_PREFIX.length);
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
      for (const gate of readH4(output.text)) {
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
    const sentences =
      style === "honest_pass"
        ? good.map((text) => ({ text, open_problem: false }))
        : style === "buried_problem_pass"
          ? [good[0], bad[Math.floor(r() * 2)], good[1]].map((text) => ({ text, open_problem: bad.includes(text) }))
          : style === "no_evidence_pass"
            ? [{ text: "Everything looks thorough and well organised.", open_problem: false }, { text: "The work meets the requirements.", open_problem: false }]
            : [good[0], fixed[0], good[2]].map((text) => ({ text, open_problem: false }));
    return JSON.stringify({ sentences });
  }
  if (request.kind === "h2") return JSON.stringify({ phrase: `the results of the earlier ${String(request.meta.ref).split(".")[0].replace(/_/g, " ")} step` });
  return JSON.stringify({
    gates: [
      { text: "Every total equals the sum of its line items.", label: "checkable" },
      { text: "Each claim cites a source that is in the inputs.", label: "checkable" },
      { text: "No two items contradict each other on price or date.", label: "checkable" },
      { text: "Every item has a price and the plan feels balanced.", label: "partly" },
      { text: "All dates are listed and the tone is friendly.", label: "partly" },
      { text: "The result is excellent.", label: "not" },
      { text: "The user will be happy with it.", label: "not" },
      { text: "It is better than what competitors would do next year.", label: "not" },
    ],
  });
}

export function mock(input: string, output: string): void {
  const requests = readJsonl<LlmRequest>(input);
  writeJsonl(output, requests.map((request) => ({ id: request.id, text: mockAnswer(request) })));
  console.log(`mock: ${requests.length} answers → ${output}`);
}

/* ------------------------------------------------------------------ entry */

// vite-node drops the script path from argv (argv[1] is vite-node itself); a test that imports this file runs under vitest instead.
const isMain = process.argv[1] !== undefined && /(?:vite-node\.mjs|pipeline\.ts)$/.test(process.argv[1]);
if (isMain) {
  const { command, flags } = args();
  const out = flags.out ?? "ml/sg-sem/.data";
  mkdirSync(out, { recursive: true });
  if (command === "round1") round1(out, Number(flags["per-topic"] ?? 4));
  else if (command === "round2") round2(out, Number(flags["h1-samples"] ?? 2));
  else if (command === "assemble") assemble(out);
  else if (command === "mock") mock(flags.in ?? "", flags.output ?? "");
  else {
    console.error("usage: pipeline.ts round1|round2|assemble --out <dir> | mock --in <requests.jsonl> --output <outputs.jsonl>");
    process.exitCode = 1;
  }
}
