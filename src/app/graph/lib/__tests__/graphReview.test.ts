/** Regression tests for the findings of the independent review of the /graph studio. */
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { parseGraphSkill, promptInputs, setEdgeContract, updateContract, validateGraph, type SkillGraph } from "../graphSkill";
import { buildClaudeOrchestrator, buildExportKit, buildSubagent, handOff, loadBudget } from "../graphExport";
import { buildPlan, nodeInstructions, previewNodeContext } from "../graphPlan";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

/** goal → plan → worker, with optional extra node YAML for the worker and extra edges. */
function graphWith({ worker = "", nodes = "", edges = "", contracts = "" }: { worker?: string; nodes?: string; edges?: string; contracts?: string } = {}): string {
  return `---
name: demo
description: Demo.
topology:
  nodes:
    - id: goal
      type: input
    - id: plan
      type: orchestrator
    - id: w
      type: worker
${worker}
${nodes}
  edges:
    - from: goal
      to: plan
    - from: plan
      to: w
${edges}
${contracts}
---

## @node: plan
Plan {{goal}}.

## @node: w
Do it.
`;
}

const frontmatterOf = (file: string) => parseYaml(file.split("---")[1]) as Record<string, unknown>;

describe("an edge from a node that does not exist (a half-typed id)", () => {
  const graph = load(graphWith({ edges: "    - from: pla\n      to: w" }));
  const worker = graph.nodes.find((node) => node.id === "w")!;

  it("is reported, and nothing that renders the plan or the inspector throws", () => {
    expect(validateGraph(graph).some((issue) => issue.code === "edge-unknown-node")).toBe(true);
    expect(() => buildPlan(graph)).not.toThrow();
    expect(() => loadBudget(graph)).not.toThrow();
    expect(() => handOff(graph, worker)).not.toThrow();
    expect(() => previewNodeContext(graph, worker)).not.toThrow();
    expect(() => buildClaudeOrchestrator(graph)).not.toThrow();
  });
});

describe("subagent file names", () => {
  it("rejects two ids that export to the same file", () => {
    const graph = load(graphWith({ nodes: "    - id: W\n      type: worker" }));
    expect(validateGraph(graph).some((issue) => issue.code === "agent-name-collision" && issue.severity === "error")).toBe(true);
  });

  it("leaves distinct ids alone", () => {
    const graph = load(graphWith());
    expect(new Set(buildExportKit(graph).map((file) => file.path)).size).toBe(buildExportKit(graph).length);
  });
});

describe("tools and model in exported frontmatter", () => {
  it("rejects a comma inside a tool pattern (it would add a second tool)", () => {
    const graph = load(graphWith({ worker: '      tools: ["Read(x), Bash(*)"]' }));
    expect(validateGraph(graph).some((issue) => issue.code === "bad-tool")).toBe(true);
  });

  it("writes values that are not plain YAML as quoted strings", () => {
    const graph = load(graphWith({ worker: '      tools: [Read, "Bash(echo a: b #c)"]\n      model: "[x]"' }));
    const worker = graph.nodes.find((node) => node.id === "w")!;
    const frontmatter = frontmatterOf(buildSubagent(graph, worker));
    expect(frontmatter.tools).toBe("Read, Bash(echo a: b #c)");
    expect(frontmatter.model).toBe("[x]");
  });

  it("keeps ordinary values plain", () => {
    const graph = load(graphWith({ worker: "      tools: [Read, Grep]\n      model: claude-opus-5-5" }));
    const file = buildSubagent(graph, graph.nodes.find((node) => node.id === "w")!);
    expect(file).toContain("tools: Read, Grep\n");
    expect(file).toContain("model: claude-opus-5-5\n");
  });
});

describe("gate failure default", () => {
  it("stops when on_fail is unset, as the inspector and plan panel show", () => {
    const graph = load(graphWith({ worker: "      gate: Cites evidence." }));
    const plan = buildClaudeOrchestrator(graph);
    expect(plan).toContain("On `GATE: FAIL`: stop and show the user the gate result.");
    expect(plan).not.toContain("re-run only the steps it names");
  });
});

describe("contracts", () => {
  it("keeps a contract the user gave its own format when the edge is renamed past it", () => {
    let graph = load(graphWith({ contracts: "contracts:\n  report:\n    format: text" }));
    graph = setEdgeContract(graph, "plan", "w", "report");
    graph = setEdgeContract(graph, "plan", "w", "report2");
    expect(graph.contracts.report).toEqual({ format: "text", description: "" });
  });

  it("does not treat Object built-ins as defined contracts", () => {
    const graph = load(graphWith({ edges: "      contract: constructor" }).replace("    - from: plan\n      to: w\n\n      contract: constructor", "    - from: plan\n      to: w\n      contract: constructor"));
    expect(graph.edges.find((edge) => edge.from === "plan")?.contract).toBe("constructor");
    expect(validateGraph(graph).some((issue) => issue.code === "contract-undefined")).toBe(true);
    expect(setEdgeContract(graph, "plan", "w", "constructor").contracts).toHaveProperty("constructor", { format: "markdown", description: "" });
  });

  it("refuses __proto__ as a contract name", () => {
    const graph = load(graphWith());
    const next = updateContract(graph, "__proto__", { format: "json", description: "" });
    expect(Object.getPrototypeOf(next.contracts)).toBe(Object.prototype);
    expect(Object.keys(next.contracts)).not.toContain("__proto__");
  });
});

describe("insert input and checks", () => {
  it("offers a JSON part only when the source feeds several steps (otherwise it is one unkeyed value)", () => {
    const single = load(graphWith({ worker: "", nodes: "", edges: "" }).replace("    - id: plan\n      type: orchestrator", "    - id: plan\n      type: orchestrator\n      output_format: json"));
    const worker = single.nodes.find((node) => node.id === "w")!;
    expect(promptInputs(single, worker).map((input) => input.ref)).not.toContain("{{plan.w}}");
    expect(previewNodeContext(single, worker).user).not.toContain("⟨plan.w⟩");
  });

  it("tells a step with scoped Bash to run its own check", () => {
    const graph = load(graphWith({ worker: '      tools: [Read, "Bash(npm test:*)"]\n      check: npm test' }));
    const lines = nodeInstructions(graph, graph.nodes.find((node) => node.id === "w")!);
    expect(lines.join("\n")).toContain("Run it yourself");
  });
});
