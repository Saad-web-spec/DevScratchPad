/**
 * Turns real graphs into unlabelled H2 and H4 rows, so a trained sg-sem run can be tried on them with
 * `python -m sgsem.tryout` (ml/sg-sem/sgsem/tryout.py): every starter the studio and the connector offer, plus any
 * graph files given on the command line. The rows are built by the same serializers the connector would use.
 *
 * Run: npx vite-node scripts/semantic/tryout.ts [my-graph.md ...] [--out ml/sg-sem/tryout]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseGraphSkill, type SkillGraph } from "../../src/app/graph/lib/graphSkill";
import { CONNECTOR_TEMPLATES } from "../../src/app/graph/lib/graphTemplates";
import { edgeCandidates, gateInput, missingInputInput } from "../../src/app/graph/lib/semanticInput";

interface Row {
  head: "h2" | "h4";
  seed: string;
  split: "tryout";
  source: string;
  text_a: string;
  text_b: string;
  features: number[];
  label: 0;
  note: string;
  node: string;
  candidate?: string;
  group?: string;
}

function rowsOf(graph: SkillGraph, seed: string, source: string): Row[] {
  const rows: Row[] = [];
  for (const node of graph.nodes) {
    if (node.type !== "input" && node.type !== "code" && node.type !== "approval") {
      for (const candidate of edgeCandidates(graph, node)) {
        const pair = missingInputInput(graph, node, candidate);
        rows.push({ head: "h2", seed, split: "tryout", source, text_a: pair.textA, text_b: pair.textB, features: pair.features, label: 0, note: `${node.id} ← ${candidate.id}`, node: node.id, candidate: candidate.id, group: node.id });
      }
    }
    const gate = gateInput(graph, node);
    if (gate) rows.push({ head: "h4", seed, split: "tryout", source, text_a: gate.textA, text_b: gate.textB, features: gate.features, label: 0, note: node.gate ?? "", node: node.id });
  }
  return rows;
}

function main(): void {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  const outDir = outAt >= 0 ? args[outAt + 1] : "ml/sg-sem/tryout";
  const files = args.filter((arg, i) => arg !== "--out" && i !== outAt + 1);

  const graphs: { seed: string; source: string; text: string }[] = [
    ...CONNECTOR_TEMPLATES.map((blueprint) => ({ seed: blueprint.id, source: "starter", text: blueprint.source })),
    ...files.map((file) => ({ seed: basename(file), source: "file", text: readFileSync(file, "utf8") })),
  ];
  const rows: Row[] = [];
  for (const { seed, source, text } of graphs) {
    const graph = parseGraphSkill(text).graph;
    if (!graph) {
      console.warn(`${seed}: does not parse, skipped`);
      continue;
    }
    rows.push(...rowsOf(graph, seed, source));
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "examples.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  const count = (head: string) => rows.filter((row) => row.head === head).length;
  console.log(`tryout: ${graphs.length} graphs, ${count("h2")} H2 pairs, ${count("h4")} gates → ${join(outDir, "examples.jsonl")}`);
}

main();
