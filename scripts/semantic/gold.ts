/**
 * Builds the sg-sem gold set (SKILL_GRAPH_SEMANTIC_MODEL_SPEC.md §8.2): hand-written graphs, verifier answers,
 * missing-input cases and gates in ml/sg-sem/gold/*.json, turned into examples.jsonl by the same serializers
 * the training data and the connector use. Nothing here comes from the text generator.
 *
 *   ml/sg-sem/gold/graphs.json   outlines for draftGraph, on topics outside the training topics
 *   ml/sg-sem/gold/h1.json       verifier answers per gold verifier, with document and sentence labels
 *   ml/sg-sem/gold/h2.json       edges to cut; the task still names the data in plain words (the span)
 *   ml/sg-sem/gold/h4.json       gates per gold verifier, by label
 *
 * Run: npx vite-node scripts/semantic/gold.ts [--out ml/sg-sem/gold]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { draftGraph } from "../../src/app/graph/lib/graphDraft";
import { parseGraphSkill, validateGraph, type GraphNode, type SkillGraph } from "../../src/app/graph/lib/graphSkill";
import { TASK_PREFIX, gateInput, missingInputInput, verdictInput } from "../../src/app/graph/lib/semanticInput";
import { H4_LABELS } from "./llmPrompts";
import type { Example } from "./pipeline";

const GOLD = "ml/sg-sem/gold";

interface Outline {
  name: string;
  steps: { id: string; after: string[]; [key: string]: unknown }[];
  [key: string]: unknown;
}

interface GoldExample extends Omit<Example, "split" | "source"> {
  split: "gold";
  source: "gold";
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(GOLD, name), "utf8")) as T;
}

/** Drafts an outline and parses the result; throws on a draft error or a checker error, so a bad gold graph is noticed. */
function graphOf(outline: Outline, label: string): SkillGraph {
  const draft = draftGraph(outline);
  if ("error" in draft) throw new Error(`${label}: draft failed: ${draft.error}`);
  const graph = parseGraphSkill(draft.source).graph;
  if (!graph) throw new Error(`${label}: the draft does not parse`);
  const errors = validateGraph(graph).filter((issue) => issue.severity === "error");
  if (errors.length > 0) throw new Error(`${label}: checker errors: ${errors.map((issue) => issue.message).join(" | ")}`);
  return graph;
}

function nodeOf(graph: SkillGraph, id: string, label: string): GraphNode {
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`${label}: no step "${id}"`);
  return node;
}

function main(): void {
  const outDir = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : GOLD;
  const outlines = readJson<Outline[]>("graphs.json");
  const graphs = new Map(outlines.map((outline) => [outline.name, graphOf(outline, outline.name)]));
  const examples: GoldExample[] = [];
  const base = (seed: string) => ({ seed, split: "gold" as const, source: "gold" as const });

  // H1: hand-written verifier answers. The sentence count must match the labels, or the labels are off by one.
  for (const entry of readJson<{ graph: string; step: string; answers: { note: string; label: number; sentences: number[]; text: string }[] }[]>("h1.json")) {
    const graph = graphs.get(entry.graph);
    if (!graph) throw new Error(`h1: no graph "${entry.graph}"`);
    const node = nodeOf(graph, entry.step, `h1 ${entry.graph}`);
    for (const answer of entry.answers) {
      const pair = verdictInput(graph, node, answer.text);
      if (!pair) throw new Error(`h1 ${entry.graph}/${entry.step} "${answer.note}": no verdict line or no gate`);
      if (pair.sentences.length !== answer.sentences.length) {
        throw new Error(`h1 ${entry.graph}/${entry.step} "${answer.note}": ${pair.sentences.length} sentences found, ${answer.sentences.length} labels given:\n${pair.sentences.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`);
      }
      examples.push({ head: "h1", ...base(entry.graph), text_a: pair.textA, text_b: pair.textB, features: pair.features, label: answer.label, sentences: answer.sentences, note: answer.note });
    }
  }

  // H2 negatives: every model step as written. Positives: one edge cut, the task naming the data in plain words.
  for (const [name, graph] of graphs) {
    for (const node of graph.nodes) {
      if (node.type === "input" || node.type === "code" || node.type === "approval") continue;
      const pair = missingInputInput(graph, node);
      examples.push({ head: "h2", ...base(name), text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 0, note: `as written ${node.id}` });
    }
  }
  for (const cut of readJson<{ cuts: { graph: string; step: string; cut: string; phrase: string }[] }>("h2.json").cuts) {
    const outline = outlines.find((o) => o.name === cut.graph);
    if (!outline) throw new Error(`h2: no graph "${cut.graph}"`);
    const step = outline.steps.find((s) => s.id === cut.step);
    if (!step || !step.after.includes(cut.cut)) throw new Error(`h2 ${cut.graph}/${cut.step}: "${cut.cut}" is not one of its inputs`);
    const variant: Outline = { ...outline, steps: outline.steps.map((s) => (s.id === cut.step ? { ...s, after: s.after.filter((id) => id !== cut.cut) } : s)) };
    const graph = graphOf(variant, `h2 ${cut.graph}/${cut.step} without ${cut.cut}`);
    const pair = missingInputInput(graph, nodeOf(graph, cut.step, `h2 ${cut.graph}`));
    const at = pair.textA.indexOf(cut.phrase, TASK_PREFIX.length);
    if (at === -1) throw new Error(`h2 ${cut.graph}/${cut.step}: the task does not contain "${cut.phrase}":\n  ${pair.textA}`);
    examples.push({ head: "h2", ...base(cut.graph), text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 1, span: [at, at + cut.phrase.length], note: `cut ${cut.cut}` });
  }

  // H4: the gold verifiers' own gates (checkable) and hand-written gates by label.
  for (const entry of readJson<({ graph: string; step: string } & Record<(typeof H4_LABELS)[number], string[]>)[]>("h4.json")) {
    const graph = graphs.get(entry.graph);
    if (!graph) throw new Error(`h4: no graph "${entry.graph}"`);
    const node = nodeOf(graph, entry.step, `h4 ${entry.graph}`);
    const own = gateInput(graph, node);
    if (own) examples.push({ head: "h4", ...base(entry.graph), text_a: own.textA, text_b: own.textB, features: own.features, label: 0, note: "own gate" });
    for (const label of H4_LABELS) {
      for (const gate of entry[label]) {
        const pair = gateInput(graph, { ...node, gate });
        if (!pair) throw new Error(`h4 ${entry.graph}/${entry.step}: no gate input`);
        examples.push({ head: "h4", ...base(entry.graph), text_a: pair.textA, text_b: pair.textB, features: pair.features, label: H4_LABELS.indexOf(label), note: label });
      }
    }
  }

  writeFileSync(join(outDir, "examples.jsonl"), examples.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  const counts: Record<string, Record<string, number>> = {};
  for (const example of examples) {
    counts[example.head] ??= {};
    counts[example.head][`label${example.label}`] = (counts[example.head][`label${example.label}`] ?? 0) + 1;
  }
  console.log(`gold: ${graphs.size} graphs, ${examples.length} examples → ${join(outDir, "examples.jsonl")}`);
  console.log(JSON.stringify(counts));
}

main();
