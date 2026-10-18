/**
 * What moves between steps and what a failed gate sends back: steps with no tool limit count as
 * file writers, a gate may name the upstream step that wrote a change and the steps after it re-run,
 * and a prompt that asks for a whole JSON output gets it instead of its own slice.
 */
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, DEFAULT_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import { addEdge, addNode, jsonKeysFor, parseGraphSkill, updateNode, validateGraph, writesFiles, type GraphNode, type SkillGraph } from "../graphSkill";
import { nodeInstructions, previewNodeContext } from "../graphPlan";
import { buildClaudeOrchestrator, buildSubagent, handOff } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((node) => node.id === id) as GraphNode;

describe("writesFiles", () => {
  const step = (patch: Partial<GraphNode>): GraphNode => ({ id: "s", type: "worker", label: "S", isolatedContext: false, prompt: "", ...patch });

  it("counts a model step with no tools list as able to edit files, since it inherits every tool", () => {
    expect(writesFiles(step({ tools: undefined }))).toBe(true);
    expect(writesFiles(step({ tools: [] }))).toBe(true);
    expect(writesFiles(step({ tools: ["Read", "Grep", "Bash"] }))).toBe(false);
  });

  it("sees scoped and less common file-writing tools", () => {
    expect(writesFiles(step({ tools: ["Read", "Edit(src/**)"] }))).toBe(true);
    expect(writesFiles(step({ tools: ["MultiEdit"] }))).toBe(true);
    expect(writesFiles(step({ tools: ["NotebookEdit"] }))).toBe(true);
  });

  it("never counts a command, an approval or the input", () => {
    expect(writesFiles(step({ type: "code", run: "npm test" }))).toBe(false);
    expect(writesFiles(step({ type: "approval" }))).toBe(false);
    expect(writesFiles(step({ type: "input" }))).toBe(false);
  });
});

describe("new steps from the toolbar", () => {
  it("start read-only, so a fan-out built in the UI does not trip parallel-writers", () => {
    let graph = load(BLANK_GRAPH_SKILL);
    for (const type of ["orchestrator", "worker", "synthesizer", "verifier"] as const) {
      const added = addNode(graph, type, "goal");
      graph = added.graph;
      expect(nodeOf(graph, added.id).tools).toEqual(["Read", "Grep", "Glob"]);
    }
    expect(addNode(graph, "agent").graph.nodes.at(-1)?.tools).toBeUndefined();
  });

  it("warn about parallel writers once their tool limit is lifted", () => {
    const base = load(BLANK_GRAPH_SKILL);
    const first = addNode(base, "worker", "goal");
    const second = addNode(first.graph, "worker", "goal");
    let graph = addEdge(addEdge(second.graph, first.id, "answer"), second.id, "answer");
    expect(validateGraph(graph).some((issue) => issue.code === "parallel-writers")).toBe(false);
    graph = updateNode(updateNode(graph, first.id, { tools: undefined }), second.id, { tools: undefined });
    expect(validateGraph(graph).find((issue) => issue.code === "parallel-writers")?.message).toContain(first.id);
  });
});

describe("a failed gate sends work back to the step that can fix it", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);

  it("lists the upstream steps the gate may name and marks the one that edits files", () => {
    // Without a retry target the gate may name any model step upstream.
    const open = updateNode(ship, "gate", { retryTarget: undefined });
    expect(buildSubagent(open, nodeOf(open, "gate"))).toContain("Steps you can name: `plan`, `implement` (edits files), `review_correctness`, `review_security`.");
    // The template restarts at implement, so plan is no longer offered.
    const gate = buildSubagent(ship, nodeOf(ship, "gate"));
    expect(gate).toContain("Steps you can name: `implement` (edits files), `review_correctness`, `review_security`.");
    expect(gate).toContain("name the step that edits files, not the step that reported the fault");
  });

  it("re-runs every step between a re-run step and the gate, so the gate never judges a stale diff", () => {
    const skill = buildClaudeOrchestrator(ship);
    expect(skill).toContain("Then re-run, in plan order, every step between a re-run step and this one (commands too)");
    expect(skill).toContain("then the steps between them and the gate that depend on them");
  });

  it("does not mention file edits when no upstream step can make them", () => {
    const graph = load(DEFAULT_GRAPH_SKILL);
    const verifier = nodeInstructions(graph, nodeOf(graph, "verifier")).join("\n");
    expect(verifier).toContain("Steps you can name: `splitter`, `worker_research`, `worker_compare`, `worker_check`, `worker_gaps`.");
    expect(verifier).not.toContain("edits files");
  });

  it("hands the verdict to the PR step through an edge", () => {
    expect(ship.edges).toContainEqual({ from: "gate", to: "publish", contract: "verdict" });
    expect(handOff(ship, nodeOf(ship, "publish"))).toEqual(["the output of GATE (Fresh Context) (`gate`)", "the user's answer at APPROVE PULL REQUEST (`approve`)"]);
    expect(validateGraph(ship)).toEqual([]);
  });
});

describe("keyed JSON honours what a prompt asks for", () => {
  const graph = load(DEFAULT_GRAPH_SKILL);

  it("gives each worker its own key when its prompt names it", () => {
    expect(jsonKeysFor(graph, nodeOf(graph, "splitter"), nodeOf(graph, "worker_research"))).toEqual(["worker_research"]);
    expect(handOff(graph, nodeOf(graph, "worker_research"))).toContain("only the `worker_research` value from the JSON of SPLIT (`splitter`)");
  });

  it("hands the whole output to a step that reads {{splitter.output}}, and leaves its key out of the splitter's JSON", () => {
    const next = updateNode(graph, "worker_gaps", { prompt: "Find gaps across every task: {{splitter.output}}" });
    const gaps = nodeOf(next, "worker_gaps");
    expect(jsonKeysFor(next, nodeOf(next, "splitter"), gaps)).toBeNull();
    expect(handOff(next, gaps)).toContain("the output of SPLIT (`splitter`)");
    expect(previewNodeContext(next, gaps).system).toContain("⟨output of splitter⟩");
    const splitter = nodeInstructions(next, nodeOf(next, "splitter")).join("\n");
    expect(splitter).toContain("these keys (`worker_research`, `worker_compare`, `worker_check`)");
  });

  it("hands a named key that is not the step's own id", () => {
    const next = updateNode(graph, "worker_gaps", { prompt: "Find gaps in: {{splitter.worker_check}}" });
    expect(handOff(next, nodeOf(next, "worker_gaps"))).toContain("only the `worker_check` value from the JSON of SPLIT (`splitter`)");
  });

  it("asks for one plain JSON value when every step reads the whole output", () => {
    let next = graph;
    for (const id of ["worker_research", "worker_compare", "worker_check", "worker_gaps"]) next = updateNode(next, id, { prompt: "Work on: {{splitter.output}}" });
    expect(nodeInstructions(next, nodeOf(next, "splitter"))[0]).toBe("Return a single valid JSON value. No prose and no code fences.");
  });
});
