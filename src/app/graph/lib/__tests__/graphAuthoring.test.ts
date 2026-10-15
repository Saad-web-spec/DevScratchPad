import { describe, expect, it } from "vitest";
import { BLUEPRINTS } from "../graphTemplates";
import { parseGraphSkill, promptInputs, setEdgeContract, validateGraph, type SkillGraph } from "../graphSkill";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const SIMPLE = `---
name: simple
description: Demo.
topology:
  nodes:
    - id: goal
      type: input
    - id: plan
      type: orchestrator
      output_format: json
    - id: research
      type: worker
    - id: review
      type: worker
    - id: verify
      type: verifier
  edges:
    - from: goal
      to: plan
    - from: plan
      to: [research, review]
    - from: [research, review]
      to: verify
---

## @node: plan
Plan it.

## @node: research
Research it.

## @node: review
Review it.

## @node: verify
Verify it.
`;

describe("naming a contract on an edge", () => {
  const graph = load(SIMPLE);

  it("defines the contract, as JSON when the name says so", () => {
    const next = setEdgeContract(graph, "plan", "research", "tasks_json");
    expect(next.contracts.tasks_json).toEqual({ format: "json", description: "" });
    expect(validateGraph(next).filter((issue) => issue.code === "contract-undefined")).toEqual([]);
  });

  it("does not leave the half-typed names behind", () => {
    let next = graph;
    for (const typed of ["f", "fi", "fin", "findings"]) next = setEdgeContract(next, "research", "verify", typed);
    expect(Object.keys(next.contracts)).toEqual(["findings"]);
    expect(next.contracts.findings.format).toBe("markdown");
  });

  it("keeps a contract that another edge still uses or that has a description", () => {
    let next = setEdgeContract(graph, "research", "verify", "findings");
    next = setEdgeContract(next, "review", "verify", "findings");
    next = setEdgeContract(next, "research", "verify", "other");
    expect(next.contracts.findings).toBeDefined();
    const described = { ...next, contracts: { ...next.contracts, other: { format: "markdown" as const, description: "Kept." } } };
    expect(setEdgeContract(described, "research", "verify", "").contracts.other).toBeDefined();
  });
});

describe("prompt inputs offered in the editor", () => {
  const graph = load(SIMPLE);
  const refs = (id: string) => promptInputs(graph, graph.nodes.find((node) => node.id === id)!).map((input) => input.ref);

  it("offers the goal, the whole upstream output and this step's part of a JSON output", () => {
    expect(refs("research")).toEqual(["{{goal}}", "{{plan.output}}", "{{plan.research}}"]);
  });

  it("offers a group shortcut only when every node of that type feeds the step", () => {
    expect(refs("verify")).toEqual(["{{goal}}", "{{research.output}}", "{{review.output}}", "{{workers.output}}", "{{inputs}}"]);
  });

  it("never offers anything that would break a fresh context or fail validation", () => {
    for (const blueprint of BLUEPRINTS) {
      const source = load(blueprint.source);
      for (const node of source.nodes) {
        if (node.type === "input") continue;
        const withAll = { ...source, nodes: source.nodes.map((n) => (n.id === node.id ? { ...n, prompt: `${n.prompt}\n${promptInputs(source, n).map((input) => input.ref).join("\n")}` } : n)) };
        const problems = validateGraph(withAll).filter((issue) => issue.nodeId === node.id && ["unknown-ref", "ref-not-upstream", "isolation-leak"].includes(issue.code));
        expect(problems).toEqual([]);
      }
    }
  });
});
