/**
 * Exported kits against the rest of the product: every file `devscratchpad audit` reads must clear
 * the score the CLI's own docs suggest for CI, scoped tool permissions must not warn, and the plan
 * must name steps by the ids a gate's verdict uses.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "../graphTemplates";
import { baseToolName, parseGraphSkill, updateNode, validateGraph, type SkillGraph } from "../graphSkill";
import { buildClaudeOrchestrator, buildExportKit, buildSubagent } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const CLI = path.resolve(__dirname, "../../../../../cli/bin/devscratchpad.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skill-graph-audit-"));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

interface AuditReport {
  passed: boolean;
  files: { path: string; score: number; issues: string[] }[];
}

describe("exported kits pass devscratchpad audit", () => {
  it.each(BLUEPRINTS.map((blueprint) => [blueprint.id, blueprint.source] as const))("%s scores 85 or more in every file", (id, source) => {
    const dir = path.join(tmp, id);
    for (const file of buildExportKit(load(source))) {
      const full = path.join(dir, file.path);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, file.content);
    }
    let output: string;
    try {
      output = execFileSync(process.execPath, [CLI, "audit", dir, "--min-score", "85", "--json"], { encoding: "utf8" });
    } catch (error) {
      output = String((error as { stdout?: string }).stdout ?? "");
    }
    const report = JSON.parse(output) as AuditReport;
    expect(report.files.length).toBeGreaterThan(2);
    expect(report.files.filter((file) => file.score < 85)).toEqual([]);
    expect(report.passed).toBe(true);
  });
});

describe("scoped tool permissions", () => {
  it("validates the tool before the parenthesis", () => {
    expect(baseToolName("Bash(git diff:*)")).toBe("Bash");
    expect(baseToolName("Read")).toBe("Read");
    const graph = updateNode(load(DEFAULT_GRAPH_SKILL), "worker_gaps", { tools: ["Read", "Bash(git diff:*)", "Edit(src/**)", "MultiEdit"] });
    expect(validateGraph(graph).filter((issue) => issue.code === "unknown-tool")).toEqual([]);
  });

  it("still warns about a tool Claude Code does not have, scoped or not", () => {
    const graph = updateNode(load(DEFAULT_GRAPH_SKILL), "worker_gaps", { tools: ["Teleport(home)"] });
    expect(validateGraph(graph).some((issue) => issue.code === "unknown-tool")).toBe(true);
  });
});

describe("step ids in the compiled kit", () => {
  const graph = load(DEFAULT_GRAPH_SKILL);

  it("names every step by its id in the plan, so a gate's `- <node id>:` line maps to one step", () => {
    const skill = buildClaudeOrchestrator(graph);
    for (const node of graph.nodes) if (node.type !== "input") expect(skill).toContain(`(\`${node.id}\`) →`);
    expect(skill).toContain("the output of WORKER 1: Research (`worker_research`)");
  });

  it("tells each step the ids of the outputs it reads, group aliases included", () => {
    const subagent = (id: string) => buildSubagent(graph, graph.nodes.find((node) => node.id === id)!);
    expect(subagent("verifier")).toContain("the outputs of the workers (`worker_research`, `worker_compare`, `worker_check`, `worker_gaps`, in your task message)");
    expect(subagent("merger")).toContain('the output of "VERIFIER (Fresh Context)" (`verifier`, in your task message)');
  });
});
