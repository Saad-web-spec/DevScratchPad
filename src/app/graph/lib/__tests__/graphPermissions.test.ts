import { describe, expect, it } from "vitest";
import { hasPermissions, summarizePermissions } from "../graphPermissions";
import { parseGraphSkill, type SkillGraph } from "../graphSkill";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "../graphTemplates";

function graphOf(source: string): SkillGraph {
  return parseGraphSkill(source).graph as SkillGraph;
}

describe("summarizePermissions", () => {
  it("flags only the shell step of the starting graph, and nothing in a read-only blueprint", () => {
    expect(summarizePermissions(graphOf(DEFAULT_GRAPH_SKILL))).toEqual({ commands: [], shell: ["worker_check"], writers: [], mcp: [], unlimited: [] });
    const research = BLUEPRINTS.find((blueprint) => blueprint.id === "research-report");
    expect(hasPermissions(summarizePermissions(graphOf(research?.source ?? "")))).toBe(false);
  });

  it("lists the commands, shell access and file edits of Ship a change", () => {
    const ship = BLUEPRINTS.find((blueprint) => blueprint.id === "ship-a-change");
    const permissions = summarizePermissions(graphOf(ship?.source ?? ""));
    expect(hasPermissions(permissions)).toBe(true);
    expect(permissions.commands.map((item) => item.command)).toContain("npm test");
    expect(permissions.writers).toEqual(["implement"]);
  });

  it("flags a model step without a tools list, since its subagent inherits every tool", () => {
    const graph = graphOf(DEFAULT_GRAPH_SKILL);
    const open = { ...graph, nodes: graph.nodes.map((node) => (node.type === "verifier" ? { ...node, tools: undefined } : node)) };
    const verifier = graph.nodes.find((node) => node.type === "verifier");
    expect(summarizePermissions(open).unlimited).toEqual([verifier?.id]);
  });
});
