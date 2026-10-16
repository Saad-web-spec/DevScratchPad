/**
 * Gaps between the spec and what the studio did with it: blast radius on code steps, a code step's
 * retry with nothing to re-run, and prompt sections that match no node.
 */
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL } from "../graphTemplates";
import { addEdge, addNode, findOrphanSections, parseGraphSkill, updateNode, validateGraph, type SkillGraph } from "../graphSkill";
import { buildSingleFileSkill } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

/** goal → work → <code step> → answer, with the code step patched as given. */
function withCodeStep(patch: Parameters<typeof updateNode>[2], after = "work"): { graph: SkillGraph; id: string } {
  const added = addNode(load(BLANK_GRAPH_SKILL), "code");
  let graph = updateNode(added.graph, added.id, { run: "npm publish", ...patch });
  graph = addEdge(addEdge(graph, after, added.id), added.id, "answer");
  return { graph, id: added.id };
}

describe("code steps: blast radius in the export", () => {
  it("never retries an irreversible command, even with on_fail: retry", () => {
    const { graph } = withCodeStep({ risk: "irreversible", onFail: "retry" });
    const skill = buildSingleFileSkill(graph);
    expect(skill).toContain("Hard to undo: run it only after the approval before it said yes, and never re-run it automatically.");
    expect(skill).not.toMatch(/If it exits non-zero: re-run/);
  });

  it("still re-runs upstream for a contained command", () => {
    const { graph } = withCodeStep({ onFail: "retry" });
    expect(buildSingleFileSkill(graph)).toMatch(/If it exits non-zero: re-run \*\*WORK\*\*/);
  });

  it("holds later steps until a wide command exits 0", () => {
    const { graph } = withCodeStep({ risk: "wide" });
    expect(buildSingleFileSkill(graph)).toContain("Wide reach: nothing after it starts until it exits 0.");
  });
});

describe("code steps: retry with nothing to re-run", () => {
  it("warns when no subagent step comes right before it", () => {
    const { graph, id } = withCodeStep({ onFail: "retry" }, "goal");
    expect(validateGraph(graph).find((issue) => issue.code === "retry-nothing-upstream")?.nodeId).toBe(id);
  });

  it("stays quiet when a subagent step feeds it", () => {
    const { graph } = withCodeStep({ onFail: "retry" });
    expect(validateGraph(graph).map((issue) => issue.code)).not.toContain("retry-nothing-upstream");
  });
});

describe("prompt sections that match no node", () => {
  it("names the section ids missing from the topology", () => {
    const source = `${BLANK_GRAPH_SKILL}\n## @node: wrok\nA typo'd id.\n`;
    expect(findOrphanSections(source, load(source))).toEqual(["wrok"]);
  });

  it("finds none in a clean file", () => {
    expect(findOrphanSections(BLANK_GRAPH_SKILL, load(BLANK_GRAPH_SKILL))).toEqual([]);
  });
});
