/**
 * `skill-graph/2`: fan-out steps (`foreach`) that run once per item of a list, and file handoffs
 * that pass an output on as a path instead of re-typing it.
 */
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, REVIEW_EACH_FILE_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import {
  SPEC_VERSION,
  SPEC_VERSION_2,
  handoffOf,
  parseGraphSkill,
  promptInputs,
  removeNode,
  renameNode,
  serializeGraphSkill,
  specVersionFor,
  updateNode,
  validateGraph,
  type GraphNode,
  type SkillGraph,
} from "../graphSkill";
import { nodeInstructions, payloadPath, previewNodeContext } from "../graphPlan";
import { buildClaudeOrchestrator, buildExportKit, buildSingleFileSkill, buildSubagent, handOff } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id) as GraphNode;
const codes = (graph: SkillGraph) => validateGraph(graph).map((issue) => issue.code);
const review = load(REVIEW_EACH_FILE_GRAPH_SKILL);
/** The blueprint with every output handed on inline, to look at fan-out alone. */
const inline = { ...review, handoff: undefined };

describe("spec version", () => {
  it("writes /2 only when a /2 field is used", () => {
    expect(specVersionFor(review)).toBe(SPEC_VERSION_2);
    expect(serializeGraphSkill(review)).toContain("spec: skill-graph/2");
    expect(specVersionFor(load(SHIP_CHANGE_GRAPH_SKILL))).toBe(SPEC_VERSION);
    expect(specVersionFor(updateNode(inline, "review_file", { foreach: undefined, maxParallel: undefined, maxItems: undefined }))).toBe(SPEC_VERSION);
  });

  it("warns on a version it does not know", () => {
    expect(codes(load(BLANK_GRAPH_SKILL.replace("spec: skill-graph/1", "spec: skill-graph/9")))).toContain("unknown-spec");
    expect(codes(review)).not.toContain("unknown-spec");
  });

  it("round-trips the new fields", () => {
    const again = load(serializeGraphSkill(review));
    expect(again.nodes).toEqual(review.nodes);
    expect(again.handoff).toBe("file");
    expect(nodeOf(again, "review_file")).toMatchObject({ foreach: "scope.files", maxParallel: 6, maxItems: 40 });
  });

  it("clamps max_parallel and ignores non-numbers", () => {
    const graph = load(REVIEW_EACH_FILE_GRAPH_SKILL.replace("max_parallel: 6", "max_parallel: 99").replace("max_items: 40", "max_items: lots"));
    expect(nodeOf(graph, "review_file")).toMatchObject({ maxParallel: 16, maxItems: undefined });
  });
});

describe("foreach", () => {
  it("is a clean graph in the blueprint, and fan-out counts as parallel work", () => {
    expect(validateGraph(review)).toEqual([]);
  });

  it("compiles one run per item, a cap, and a collected array", () => {
    const skill = buildClaudeOrchestrator(inline);
    expect(skill).toContain("(`review_file`) → subagent `review-each-file-review-file` · fresh context · one run per item, up to 6 at a time");
    expect(skill).toContain("Take the list: the `files` array in the JSON of LIST THE FILES (`scope`). If it is not an array, stop and report. If it is empty, skip this step: its output is `[]`.");
    expect(skill).toContain("If the list has more than 40 items, stop before starting any run");
    expect(skill).toContain("Output: a JSON array of the runs' results, in item order.");
    expect(skill).toContain("Each run of a fan-out step gets only its own item");
    expect(buildSingleFileSkill(inline)).toContain("Do this step once per item, as separate passes.");
  });

  it("hands each run its item plus any other key the prompt names", () => {
    expect(handOff(inline, nodeOf(inline, "review_file"))).toEqual([
      "its item: one entry of `files` from the JSON of LIST THE FILES (`scope`)",
      "the `focus` value from the JSON of LIST THE FILES (`scope`)",
    ]);
    const preview = previewNodeContext(inline, nodeOf(inline, "review_file"));
    expect(preview.system).toContain("File: ⟨item⟩");
    expect(preview.user).toBe("### Your item (one entry of scope.files)\n⟨item⟩");
  });

  it("tells a run it returns one entry of the contract, and writes {{item}} as plain words", () => {
    const agent = buildSubagent(inline, nodeOf(inline, "review_file"));
    expect(agent).toContain("File: your item (in your task message)");
    expect(agent).toContain("Your result is one entry of the `file_reviews` contract (json), which the orchestrator collects from every run");
    expect(agent).toContain("You handle one item of a list (`files` from `scope`)");
    expect(agent).toContain('purpose is: the `focus` value from "LIST THE FILES" (in your task message)');
  });

  it("saves a fan-out output as JSON and offers {{item}} in the prompt menu", () => {
    expect(payloadPath(inline, "review_file")).toBe(".skill-graph/review-each-file/review_file.json");
    expect(promptInputs(inline, nodeOf(inline, "review_file"))[0]).toEqual({ ref: "{{item}}", label: "This run's item from the list" });
    expect(promptInputs(inline, nodeOf(inline, "merge")).some((input) => input.ref === "{{item}}")).toBe(false);
  });

  it("follows a rename of its source", () => {
    expect(nodeOf(renameNode(review, "scope", "list"), "review_file").foreach).toBe("list.files");
  });

  it("rejects a source that is missing, not connected, not JSON or the wrong kind of step", () => {
    expect(codes(updateNode(review, "review_file", { foreach: "nope.files" }))).toContain("foreach-source-unknown");
    expect(codes(updateNode(review, "merge", { foreach: "scope.files" }))).toContain("foreach-source-unknown");
    expect(codes(updateNode(review, "scope", { outputFormat: undefined }))).not.toContain("foreach-source-not-json");
    const text = { ...review, contracts: { ...review.contracts, file_list: { format: "markdown" as const, description: "" } } };
    expect(codes(updateNode(text, "scope", { outputFormat: undefined }))).toContain("foreach-source-not-json");
    expect(codes(removeNode(review, "scope"))).toContain("foreach-source-unknown");
  });

  it("flags irreversible fan-out, missing caps, parallel writers and {{item}} outside a fan-out", () => {
    expect(codes(updateNode(review, "review_file", { risk: "irreversible" }))).toContain("foreach-irreversible");
    expect(codes(updateNode(review, "review_file", { maxItems: undefined }))).toContain("foreach-no-cap");
    expect(codes(updateNode(review, "review_file", { tools: ["Read", "Edit"] }))).toContain("foreach-parallel-writers");
    expect(codes(updateNode(review, "review_file", { tools: ["Read", "Edit"], maxParallel: 1 }))).not.toContain("foreach-parallel-writers");
    expect(codes(updateNode(review, "merge", { prompt: "Merge {{item}}" }))).toContain("item-outside-foreach");
    expect(codes(updateNode(review, "merge", { maxItems: 3 }))).toContain("fanout-settings-unused");
  });
});

describe("file handoffs", () => {
  it("follows the graph default, a step override, and never applies to the goal or an approval", () => {
    expect(handoffOf(review, nodeOf(review, "scope"))).toBe("file");
    expect(handoffOf(review, nodeOf(review, "goal"))).toBe("inline");
    expect(handoffOf(updateNode(review, "scope", { handoff: "inline" }), nodeOf(updateNode(review, "scope", { handoff: "inline" }), "scope"))).toBe("inline");
    const ship = load(SHIP_CHANGE_GRAPH_SKILL);
    expect(handoffOf({ ...ship, handoff: "file" }, nodeOf(ship, "approve"))).toBe("inline");
  });

  it("saves each output once and hands later steps the path", () => {
    const skill = buildClaudeOrchestrator(review);
    expect(skill).toContain("Hand-off by file: save its output, verbatim, to `.skill-graph/review-each-file/merge.md`. Later steps get that path, not the text.");
    expect(skill).toContain("Hand it: the output of MERGE FINDINGS (`merge`), as the path `.skill-graph/review-each-file/merge.md`.");
    // The last step's output is the answer, so it is not saved for anyone.
    expect(skill).not.toContain("review-each-file/gate.md");
    expect(skill).toContain("save its output verbatim to its path before the next stage");
    expect(buildClaudeOrchestrator(inline)).not.toContain("Hand-off by file");
  });

  it("tells a step its inputs are files and shows the path in the preview", () => {
    expect(nodeInstructions(review, nodeOf(review, "gate")).join("\n")).toContain("Some inputs arrive as file paths");
    expect(nodeInstructions(inline, nodeOf(inline, "gate")).join("\n")).not.toContain("file paths");
    expect(previewNodeContext(review, nodeOf(review, "gate")).system).toContain(".skill-graph/review-each-file/merge.md ← ⟨output of merge⟩");
  });

  it("shows an approval the content, not a path", () => {
    const ship = { ...load(SHIP_CHANGE_GRAPH_SKILL), handoff: "file" as const };
    expect(handOff(ship, nodeOf(ship, "approve")).join("; ")).not.toContain(".skill-graph/");
    expect(handOff(ship, nodeOf(ship, "implement")).join("; ")).toContain("as the path `.skill-graph/ship-a-change/plan.md`");
  });

  it("ships the ignore file whenever a run writes working files", () => {
    expect(buildExportKit(review).some((file) => file.path === ".skill-graph/.gitignore")).toBe(true);
    expect(buildExportKit(review).find((file) => file.path === "README.md")?.content).toContain("## Working files");
    expect(buildExportKit(load(BLANK_GRAPH_SKILL)).some((file) => file.path.startsWith(".skill-graph/"))).toBe(false);
  });

  it("requires a reader at the other end", () => {
    expect(codes(updateNode(review, "merge", { tools: ["Grep"] }))).toContain("file-handoff-no-read");
    expect(codes(updateNode(inline, "merge", { tools: ["Grep"] }))).not.toContain("file-handoff-no-read");
  });
});
