/**
 * Loops and gates: code steps, command checks, blast-radius lanes, approvals, structured correction
 * returns, and the edge/parallelism checks that keep a graph from being a chain of "and then".
 */
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, DEFAULT_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import { addEdge, addNode, parseGraphSkill, renameNode, serializeGraphSkill, updateNode, validateGraph, type GraphNode, type SkillGraph } from "../graphSkill";
import { buildExportKit, buildSingleFileSkill, loadBudget } from "../graphExport";
import { buildPlan, compileRun, payloadFiles, previewNodeContext } from "../graphPlan";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id) as GraphNode;
const codes = (graph: SkillGraph) => validateGraph(graph).map((issue) => issue.code);
const issue = (graph: SkillGraph, code: string) => validateGraph(graph).find((i) => i.code === code);

describe("spec: code steps, checks, risk and approvals", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);

  it("parses run, check, risk and the new node types", () => {
    expect(nodeOf(ship, "diff")).toMatchObject({ type: "code", run: "git diff --stat && git diff" });
    expect(nodeOf(ship, "implement")).toMatchObject({ check: "npm test", risk: "wide", onFail: "retry", maxRetries: 2 });
    expect(nodeOf(ship, "approve").type).toBe("approval");
    expect(nodeOf(ship, "publish").risk).toBe("irreversible");
  });

  it("ignores an unknown risk lane", () => {
    const graph = load(BLANK_GRAPH_SKILL.replace("type: worker", "type: worker\n      risk: catastrophic"));
    expect(nodeOf(graph, "work").risk).toBeUndefined();
  });

  it("round-trips the new fields", () => {
    const again = load(serializeGraphSkill(ship));
    expect(again.nodes).toEqual(ship.nodes);
    expect(again.edges).toEqual(ship.edges);
  });

  it("does not require a prompt section for code or approval steps", () => {
    const graph = updateNode(ship, "approve", { prompt: "" });
    expect(serializeGraphSkill(graph)).not.toContain("## @node: approve");
    expect(codes(graph)).not.toContain("missing-prompt");
  });

  it("renames a node inside a code step's command", () => {
    let graph = updateNode(ship, "diff", { run: "node merge.mjs {{implement}}" });
    graph = renameNode(graph, "implement", "edit");
    expect(nodeOf(graph, "diff").run).toBe("node merge.mjs {{edit}}");
  });

  it("adds a code node with a default command", () => {
    const { graph, id } = addNode(load(BLANK_GRAPH_SKILL), "code", "work");
    expect(nodeOf(graph, id)).toMatchObject({ type: "code", run: "npm test", prompt: "" });
  });
});

describe("validation: edges must carry data", () => {
  it("warns about an edge the target never reads", () => {
    const graph = addEdge(load(DEFAULT_GRAPH_SKILL), "splitter", "merger");
    const found = issue(graph, "unread-edge");
    expect(found?.severity).toBe("warning");
    expect(found?.nodeId).toBe("merger");
    expect(found?.message).toContain('"splitter"');
  });

  it("does not warn when the target names no input (it reads them all) or reads {{inputs}}", () => {
    const graph = load(BLANK_GRAPH_SKILL);
    expect(codes(updateNode(graph, "answer", { prompt: "Write the answer." }))).not.toContain("unread-edge");
    expect(codes(updateNode(addEdge(load(DEFAULT_GRAPH_SKILL), "splitter", "merger"), "merger", { prompt: "Merge {{inputs}}" }))).not.toContain("unread-edge");
  });

  it("does not warn about waiting on an approval or a command step", () => {
    expect(codes(load(SHIP_CHANGE_GRAPH_SKILL))).not.toContain("unread-edge");
  });

  it("flags a long chain with nothing in parallel, but not a short one", () => {
    let graph = load(BLANK_GRAPH_SKILL);
    expect(codes(graph)).not.toContain("no-parallelism");
    graph = addNode(graph, "agent", "answer").graph;
    graph = addNode(graph, "agent", "node").graph;
    expect(codes(graph)).toContain("no-parallelism");
  });

  it("warns when parallel steps can both edit files", () => {
    const graph = updateNode(updateNode(load(DEFAULT_GRAPH_SKILL), "worker_check", { tools: ["Read", "Edit"] }), "worker_gaps", { tools: ["Write"] });
    expect(issue(graph, "parallel-writers")?.message).toMatch(/worker_check.*worker_gaps/);
  });
});

describe("validation: loops, lanes and approvals", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);

  it("accepts the ship-a-change blueprint with no issues", () => {
    expect(validateGraph(ship)).toEqual([]);
  });

  it("requires a command on a code step", () => {
    expect(issue(updateNode(ship, "diff", { run: undefined }), "missing-run")?.severity).toBe("error");
  });

  it("checks {{refs}} inside commands like prompt references", () => {
    expect(codes(updateNode(ship, "diff", { run: "cat {{ghost}}" }))).toContain("unknown-ref");
    expect(codes(updateNode(ship, "diff", { run: "cat {{gate}}" }))).toContain("ref-not-upstream");
  });

  it("blocks an irreversible step with no approval before it", () => {
    const graph = updateNode(ship, "approve", { type: "agent", prompt: "Summarise." });
    expect(issue(graph, "irreversible-unapproved")?.severity).toBe("error");
  });

  it("warns about retrying an irreversible step and about retries past the cap", () => {
    expect(codes(updateNode(ship, "publish", { onFail: "retry" }))).toContain("irreversible-retry");
    expect(codes(updateNode(ship, "gate", { maxRetries: 5 }))).toContain("retry-cap");
    expect(codes(updateNode(ship, "gate", { maxRetries: 3 }))).not.toContain("retry-cap");
  });

  it("warns when wide work has no command check anywhere after it", () => {
    let graph = updateNode(ship, "implement", { check: undefined, onFail: undefined });
    graph = updateNode(graph, "diff", { type: "agent", run: undefined, prompt: "Describe the change." });
    expect(codes(graph)).toContain("wide-without-check");
  });

  it("warns when a model alone judges file changes", () => {
    let graph = updateNode(ship, "implement", { check: undefined, onFail: undefined, risk: undefined });
    graph = updateNode(graph, "diff", { type: "agent", run: undefined, prompt: "Describe the change." });
    expect(issue(graph, "gate-without-check")?.nodeId).toBe("gate");
    expect(codes(load(DEFAULT_GRAPH_SKILL))).not.toContain("gate-without-check");
  });

  it("warns when an approval guards nothing risky", () => {
    expect(codes(updateNode(ship, "publish", { risk: undefined }))).toContain("approval-guards-nothing");
  });

  it("accepts retry on a node whose own command check loops it", () => {
    expect(codes(ship)).not.toContain("retry-without-gate");
  });
});

describe("compiled plan", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);
  const files = buildExportKit(ship);
  const skill = files.find((f) => f.path.endsWith("/SKILL.md"))!.content;

  it("runs code steps and approvals itself, without subagent files", () => {
    const agents = files.filter((f) => f.path.startsWith(".claude/agents/")).map((f) => f.path);
    expect(agents).toHaveLength(6);
    expect(agents.some((p) => p.endsWith("-diff.md") || p.endsWith("-approve.md"))).toBe(false);
    expect(skill).toContain("**COLLECT DIFF** → you run a command with Bash (no subagent, no model)");
    expect(skill).toContain("Run: `git diff --stat && git diff`");
    expect(skill).toContain("**APPROVE PULL REQUEST** → you ask the user (no subagent)");
    expect(skill).toContain("Continue only on an explicit yes.");
    expect(loadBudget(ship).perNode).toHaveLength(6);
  });

  it("loops a step on its command check", () => {
    expect(skill).toContain("Check: when it returns, run `npm test` with Bash. Exit code 0 passes.");
    expect(skill).toContain("re-run this step with its previous answer and the last 40 lines of output (at most 2 times)");
    expect(skill).toContain("Wide reach: nothing after it starts until its check passes.");
  });

  it("sends back only the failed steps and never retries irreversible work", () => {
    expect(skill).toContain("re-run only the steps it names");
    expect(skill).toContain("never redo a whole stage");
    expect(skill).toContain("Hard to undo: run it only after the approval before it said yes, and never re-run it automatically.");
    const gate = files.find((f) => f.path.endsWith("-gate.md"))!.content;
    expect(gate).toContain("| evidence: <file, line, quote or output> | redo: <exactly what to change>");
    const publish = files.find((f) => f.path.endsWith("-publish.md"))!.content;
    expect(publish).toContain("This step is hard to undo.");
  });

  it("tells a checked subagent to run its own check when it has Bash", () => {
    const implement = files.find((f) => f.path.endsWith("-implement.md"))!.content;
    expect(implement).toContain("`npm test` must exit with code 0. Run it yourself before you answer");
  });

  it("leaves code and approval steps out of the single-file prompts", () => {
    const single = buildSingleFileSkill(ship);
    expect(single).not.toContain("(`diff`)\n");
    expect(single).not.toContain("(`approve`)\n");
    expect(single).not.toContain("{{");
  });

  it("stages the two reviewers in parallel after the diff", () => {
    const stages = buildPlan(ship).map((stage) => stage.nodes.map((n) => n.id));
    expect(stages).toEqual([["plan"], ["implement"], ["diff"], ["review_correctness", "review_security"], ["gate"], ["approve"], ["publish"]]);
  });
});

describe("code step inputs", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);

  it("turns {{refs}} in a command into saved files", () => {
    const graph = updateNode(ship, "diff", { run: "node merge.mjs {{implement}} {{goal}}" });
    const diff = nodeOf(graph, "diff");
    expect(compileRun(graph, diff)).toBe("node merge.mjs .skill-graph/ship-a-change/implement.md .skill-graph/ship-a-change/goal.md");
    expect(payloadFiles(graph, diff).map((f) => f.id)).toEqual(["implement", "goal"]);
    const skill = buildExportKit(graph).find((f) => f.path.endsWith("/SKILL.md"))!.content;
    expect(skill).toContain("First save: the output of IMPLEMENT (loops on tests) → `.skill-graph/ship-a-change/implement.md`; the user's goal → `.skill-graph/ship-a-change/goal.md`.");
  });

  it("expands a group reference to every member's file and uses .json for JSON outputs", () => {
    const graph = load(DEFAULT_GRAPH_SKILL);
    const { graph: withCode, id } = addNode(graph, "code", "verifier");
    const merged = updateNode(withCode, id, { run: "cat {{splitter}}" });
    expect(compileRun(merged, nodeOf(merged, id))).toBe("cat .skill-graph/parallel-system-audit/splitter.json");
    const grouped = updateNode(withCode, id, { run: "cat {{workers}}" });
    expect(compileRun(grouped, nodeOf(grouped, id)).split(" ")).toHaveLength(5);
  });

  it("previews what a code step runs and what an approval shows", () => {
    const code = previewNodeContext(ship, nodeOf(ship, "diff"));
    expect(code.system).toContain("$ git diff --stat && git diff");
    expect(code.user).toContain("No inputs saved");
    const approval = previewNodeContext(ship, nodeOf(ship, "approve"));
    expect(approval.user).toContain("Shown to the user: GATE (Fresh Context)");
  });
});
