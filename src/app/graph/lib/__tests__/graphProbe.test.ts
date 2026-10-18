/**
 * Probing: several candidates of a read-only step run side by side with different approaches,
 * contract checks drop the broken ones, and a fresh-context judge keeps the best.
 */
import { describe, expect, it } from "vitest";
import { REVIEW_EACH_FILE_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import { addNode, hasSideEffects, parseGraphSkill, renameNode, serializeGraphSkill, specVersionFor, updateNode, validateGraph, type GraphNode, type SkillGraph } from "../graphSkill";
import { nodeInstructions, previewNodeContext } from "../graphPlan";
import { buildClaudeOrchestrator, buildExportKit, buildJudgeSubagent, buildSingleFileSkill, judgePrompt, loadBudget, probeCandidates } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id) as GraphNode;
const codes = (graph: SkillGraph) => validateGraph(graph).map((issue) => issue.code);
const ship = load(SHIP_CHANGE_GRAPH_SKILL);
const probed = updateNode(ship, "plan", { probe: 3, probeHints: ["The smallest change that works.", "Reuse existing helpers wherever possible."] });

describe("probe: parsing", () => {
  it("round-trips, clamps to 2..4, and keeps hints on one line", () => {
    expect(load(serializeGraphSkill(probed)).nodes).toEqual(probed.nodes);
    const source = serializeGraphSkill(probed);
    expect(nodeOf(load(source.replace("probe: 3", "probe: 9")), "plan").probe).toBe(4);
    expect(nodeOf(load(source.replace("probe: 3", "probe: 1")), "plan").probe).toBeUndefined();
    const multiline = load(source.replace("- The smallest change that works.", '- "Line one\\n  line two"'));
    expect(nodeOf(multiline, "plan").probeHints?.[0]).toBe("Line one line two");
  });

  it("is an additive skill-graph/1 field", () => {
    expect(specVersionFor(probed)).toBe("skill-graph/1");
  });
});

describe("probe: validation", () => {
  it("accepts a read-only step", () => {
    expect(validateGraph(probed)).toEqual(validateGraph(ship));
  });

  it("refuses steps that can change files, run shell commands or reach widely", () => {
    expect(codes(updateNode(ship, "implement", { probe: 2 }))).toContain("probe-side-effects");
    expect(codes(updateNode(ship, "plan", { probe: 2, tools: ["Read", "Bash"] }))).toContain("probe-side-effects");
    expect(codes(updateNode(ship, "plan", { probe: 2, tools: ["Read", "Bash(git diff:*)"] }))).not.toContain("probe-side-effects");
    expect(codes(updateNode(ship, "plan", { probe: 2, tools: undefined }))).toContain("probe-side-effects");
    expect(hasSideEffects(nodeOf(ship, "plan"))).toBe(false);
    expect(hasSideEffects(nodeOf(ship, "publish"))).toBe(true);
  });

  it("refuses probing a fan-out step or a command, and flags unused or extra hints", () => {
    const review = load(REVIEW_EACH_FILE_GRAPH_SKILL);
    expect(codes(updateNode(review, "review_file", { probe: 2 }))).toContain("probe-foreach");
    expect(codes(updateNode(ship, "diff", { probe: 2 }))).toContain("probe-not-model");
    expect(codes(updateNode(ship, "plan", { probeHints: ["x"] }))).toContain("probe-hints-unused");
    expect(codes(updateNode(ship, "plan", { probe: 2, probeHints: ["a", "b", "c"] }))).toContain("probe-hints-extra");
  });

  it("keeps a node from taking the judge's file name", () => {
    const { graph, id } = addNode(probed, "worker", "plan");
    expect(codes(renameNode(graph, id, "plan-judge"))).toContain("agent-name-collision");
  });
});

describe("probe: compiled plan", () => {
  it("starts the candidates together, checks them, and hands the survivors to the judge", () => {
    const skill = buildClaudeOrchestrator(probed);
    expect(skill).toContain("(`plan`) → subagent `ship-a-change-plan` · probe: 3 candidates");
    expect(skill).toContain("Probe: start 3 candidates of this step at once (one message, 3 subagent calls)");
    expect(skill).toContain("    - A: The smallest change that works.\n    - B: Reuse existing helpers wherever possible.\n    - C: Your own best approach.");
    expect(skill).toContain("Judge: hand subagent `ship-a-change-plan-judge` (fresh context) the same hand-off and the surviving candidates");
    expect(skill).toContain("This step's output is what the judge returns after its `---` line.");
    expect(skill).toContain("Add every candidate that failed a check, with its error, to the failure log.");
    expect(skill).toContain("Candidates of a probed step never see each other's answers");
    expect(buildClaudeOrchestrator(ship)).not.toContain("Probe:");
  });

  it("tells each candidate it is one of several, and shows its approach in the preview", () => {
    expect(nodeInstructions(probed, nodeOf(probed, "plan")).join("\n")).toContain("You are one of several candidates for this step");
    expect(previewNodeContext(probed, nodeOf(probed, "plan")).user).toContain("### Approach\n⟨one candidate's approach hint, of 3⟩");
  });

  it("compiles a read-only judge that sees the task but not the candidates' own instructions", () => {
    const judge = buildJudgeSubagent(probed, nodeOf(probed, "plan"));
    expect(judge).toContain("name: ship-a-change-plan-judge\n");
    expect(judge).toContain("tools: Read, Grep, Glob\nmodel: sonnet");
    expect(judge).toContain("> Read the code this request touches");
    expect(judgePrompt(probed, nodeOf(probed, "plan"))).not.toContain("You are one of several candidates");
    expect(judge).toContain("a line `CHOSEN: <letter>` (A, B, C, or `combined A+B`)");
    expect(probeCandidates(nodeOf(probed, "plan")).map((c) => c.hint)).toEqual(["The smallest change that works.", "Reuse existing helpers wherever possible.", null]);
  });

  it("ships the judge in the kit, the single-file skill and the load budget", () => {
    expect(buildExportKit(probed).some((file) => file.path === ".claude/agents/ship-a-change-plan-judge.md")).toBe(true);
    expect(buildSingleFileSkill(probed)).toContain("### Judge for PLAN (`plan` judge)");
    expect(buildSingleFileSkill(probed)).toContain("Probe: do this step 3 times as separate passes");
    expect(loadBudget(probed).perNode.some((entry) => entry.id === "plan-judge")).toBe(true);
  });
});
