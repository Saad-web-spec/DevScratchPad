/**
 * The second connector feedback round: a drafted orchestrator that contradicted its own contract, a
 * checker that missed it, a final step that never got the work its verifier checked, a dry run that
 * only proved the wiring, and the draft fields and tools that were missing.
 */
import { describe, expect, it } from "vitest";
import { CONNECTOR_TOOLS, callConnectorTool } from "../graphConnector";
import { DRAFT_MAX_ITEMS, draftGraph } from "../graphDraft";
import { contractChecks } from "../graphPlan";
import { dryRunGraph } from "../graphSimulate";
import { parseGraphSkill, updateContract, validateGraph, type SkillGraph } from "../graphSkill";
import { BLUEPRINTS } from "../graphTemplates";

const context = { studioUrl: "https://www.devscratchpad.tech/graph/studio" };

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

function draft(args: Record<string, unknown>) {
  const result = draftGraph(args);
  if ("error" in result) throw new Error(result.error);
  return { ...result, graph: load(result.source) };
}

function codes(graph: SkillGraph, nodeId?: string): string[] {
  return validateGraph(graph)
    .filter((issue) => nodeId === undefined || issue.nodeId === nodeId)
    .map((issue) => issue.code);
}

function call(name: string, args: Record<string, unknown>) {
  const result = callConnectorTool(name, args, context);
  if (!result) throw new Error(`no tool ${name}`);
  return { text: result.content.map((block) => block.text).join("\n\n"), isError: result.isError === true };
}

/** The outline from the report: a parser, two judges, an auditor and a step that totals the scores. */
const PANEL_OUTLINE = {
  name: "hire-panel",
  description: "Scores job candidates with a panel of judges.",
  steps: [
    { id: "parse_candidates", type: "orchestrator", task: "Parse the candidate submissions into a list.", returns: "a JSON object with a candidates array, each with name and answer", keys: ["candidates"] },
    { id: "judge_correctness", type: "worker", task: "Score each candidate's correctness 1-10 and return a score table.", after: ["parse_candidates"] },
    { id: "judge_clarity", type: "worker", task: "Score each candidate's clarity 1-10 and return a score table.", after: ["parse_candidates"] },
    { id: "auditor", type: "verifier", task: "Audit the judges' score tables for bias and write notes.", after: ["judge_correctness", "judge_clarity"], gate: "every score has a one-line justification from the answer" },
    { id: "final", type: "synthesizer", task: "Total each candidate's scores across judges and rank them.", after: ["auditor"] },
  ],
};

/** What draft_graph used to write for that outline: keys dropped, judges reading task keys the contract never mentions. */
const OLD_PANEL_DRAFT = `---
name: hire-panel
description: Scores job candidates with a panel of judges.
spec: skill-graph/1
topology:
  nodes:
    - { id: request, type: input, label: REQUEST }
    - { id: parse_candidates, type: orchestrator, label: PARSE CANDIDATES, model: sonnet, tools: [Read, Grep, Glob] }
    - { id: judge_correctness, type: worker, label: JUDGE CORRECTNESS, model: sonnet, tools: [Read, Grep, Glob] }
    - { id: judge_clarity, type: worker, label: JUDGE CLARITY, model: sonnet, tools: [Read, Grep, Glob] }
    - { id: auditor, type: verifier, label: AUDITOR, isolated_context: true, model: opus, tools: [Read, Grep, Glob], gate: every score has a one-line justification from the answer, on_fail: retry, max_retries: 1 }
    - { id: final, type: synthesizer, label: FINAL, model: sonnet, tools: [Read, Grep, Glob] }
  edges:
    - { from: request, to: parse_candidates }
    - { from: parse_candidates, to: [judge_correctness, judge_clarity], contract: parse_candidates_tasks }
    - { from: [judge_correctness, judge_clarity], to: auditor }
    - { from: auditor, to: final }
contracts:
  parse_candidates_tasks:
    format: json
    description: a JSON object with a candidates array, each with name and answer
---
# Node Prompts & Edge Contracts

## @node: parse_candidates
Parse the candidate submissions into a list.

The request:
{{goal}}

## @node: judge_correctness
Score each candidate's correctness 1-10 and return a score table.

Your task:
{{parse_candidates.judge_correctness}}

## @node: judge_clarity
Score each candidate's clarity 1-10 and return a score table.

Your task:
{{parse_candidates.judge_clarity}}

## @node: auditor
Audit the judges' score tables for bias and write notes.

The request:
{{goal}}

JUDGE CORRECTNESS:
{{judge_correctness}}

JUDGE CLARITY:
{{judge_clarity}}

## @node: final
Total each candidate's scores across judges and rank them.

AUDITOR:
{{auditor}}
`;

describe("draft_graph: an orchestrator that returns data", () => {
  it("keeps its keys and hands every step it feeds the whole output, instead of task keys it never returns", () => {
    const { graph } = draft(PANEL_OUTLINE);
    expect(graph.contracts.parse_candidates_output).toMatchObject({ format: "json", required: ["candidates"] });
    expect(graph.contracts.parse_candidates_tasks).toBeUndefined();
    for (const id of ["judge_correctness", "judge_clarity"]) {
      const prompt = graph.nodes.find((node) => node.id === id)?.prompt ?? "";
      expect(prompt).toContain("{{parse_candidates}}");
      expect(prompt).not.toContain("{{parse_candidates.");
    }
    expect(validateGraph(graph)).toEqual([]);
  });

  it("still splits an orchestrator the outline says nothing about returning, and checks every task key", () => {
    const outline = { ...PANEL_OUTLINE, steps: PANEL_OUTLINE.steps.map((step) => (step.id === "parse_candidates" ? { id: step.id, type: step.type, task: step.task } : step)) };
    const { graph, notes } = draft(outline);
    expect(graph.contracts.parse_candidates_tasks).toMatchObject({ format: "json", required: ["judge_correctness", "judge_clarity"] });
    expect(graph.contracts.parse_candidates_tasks.description).toContain("(judge_correctness, judge_clarity)");
    expect(graph.nodes.find((node) => node.id === "judge_clarity")?.prompt).toContain("{{parse_candidates.judge_clarity}}");
    expect(notes.some((note) => note.startsWith("parse_candidates: hands judge_correctness and judge_clarity each its own task"))).toBe(true);
    expect(validateGraph(graph)).toEqual([]);
  });

  it("follows split when the outline sets it", () => {
    const steps = PANEL_OUTLINE.steps.map((step) => (step.id === "parse_candidates" ? { id: step.id, type: step.type, task: step.task, returns: "each judge's brief", split: true } : step));
    expect(draft({ ...PANEL_OUTLINE, steps }).graph.contracts.parse_candidates_tasks).toMatchObject({ required: ["judge_correctness", "judge_clarity"] });
    const shared = PANEL_OUTLINE.steps.map((step) => (step.id === "parse_candidates" ? { id: step.id, type: step.type, task: step.task, split: false } : step));
    const graph = draft({ ...PANEL_OUTLINE, steps: shared }).graph;
    expect(graph.nodes.find((node) => node.id === "judge_correctness")?.prompt).toContain("{{parse_candidates}}");
  });

  it("refuses split where it means nothing or contradicts the keys", () => {
    const at = (patch: Record<string, unknown>) => draftGraph({ ...PANEL_OUTLINE, steps: [{ ...PANEL_OUTLINE.steps[0], ...patch }, ...PANEL_OUTLINE.steps.slice(1)] });
    expect(at({ split: true })).toMatchObject({ error: expect.stringContaining("cannot also have keys") });
    expect(at({ type: "worker", split: false })).toMatchObject({ error: expect.stringContaining("split only applies to an orchestrator") });
    expect(at({ keys: undefined, split: true, format: "markdown" })).toMatchObject({ error: expect.stringContaining("returns JSON") });
  });
});

describe("draft_graph: what a step after a verifier gets", () => {
  it("tells a drafted verifier to hand the checked work on, and says what reaches the step after it", () => {
    const { graph, notes } = draft(PANEL_OUTLINE);
    expect(graph.nodes.find((node) => node.id === "auditor")?.prompt).toContain("hand on the checked work itself");
    expect(notes).toContainEqual(expect.stringMatching(/^final: reads only auditor, so judge_correctness and judge_clarity reach it only through what auditor returns/));
  });

  it("does not tell a verifier that is the last step, or one whose output the outline describes", () => {
    const last = draft({ ...PANEL_OUTLINE, steps: PANEL_OUTLINE.steps.slice(0, 4) }).graph;
    expect(last.nodes.find((node) => node.id === "auditor")?.prompt).not.toContain("hand on the checked work");
    const steps = PANEL_OUTLINE.steps.map((step) => (step.id === "auditor" ? { ...step, returns: "the audit notes as a Markdown list" } : step));
    const described = draft({ ...PANEL_OUTLINE, steps });
    expect(described.graph.nodes.find((node) => node.id === "auditor")?.prompt).not.toContain("hand on the checked work");
    expect(described.notes).toContainEqual(expect.stringContaining("make sure that includes what it needs"));
  });

  it("lists what each step receives, so a missing input is visible before the first run", () => {
    const result = call("draft_graph", PANEL_OUTLINE);
    expect(result.text).toContain("Check before installing: each step gets only this.");
    expect(result.text).toContain("- final: the output of AUDITOR (`auditor`)");
    expect(result.text).toContain("- judge_clarity: the output of PARSE CANDIDATES (`parse_candidates`)");
  });
});

describe("the checker on the graph the old draft wrote", () => {
  it("flags a step that reads only a verifier that writes notes", () => {
    const graph = load(OLD_PANEL_DRAFT);
    expect(codes(graph, "final")).toContain("reads-only-review");
    // Reading the work directly, or a verifier told to pass it on, clears it.
    const direct = { ...graph, edges: [...graph.edges, { from: "judge_correctness", to: "final" }, { from: "judge_clarity", to: "final" }] };
    expect(codes(direct, "final")).not.toContain("reads-only-review");
    const passOn = { ...graph, nodes: graph.nodes.map((node) => (node.id === "auditor" ? { ...node, prompt: `${node.prompt}\n\nReturn the score tables that pass along with your notes.` } : node)) };
    expect(codes(passOn, "final")).not.toContain("reads-only-review");
  });

  it("checks the task keys on every run, though the contract lists none", () => {
    const graph = load(OLD_PANEL_DRAFT);
    const source = graph.nodes.find((node) => node.id === "parse_candidates")!;
    const [check] = contractChecks(graph, source);
    expect(check.commands[0]).toContain("const k=['judge_correctness','judge_clarity'];");
  });

  it("flags a contract that requires keys no step reads, where each step reads its own key", () => {
    const graph = updateContract(load(OLD_PANEL_DRAFT), "parse_candidates_tasks", { format: "json", description: "A candidates array.", required: ["candidates"] });
    expect(codes(graph, "parse_candidates")).toContain("keyed-contract-conflict");
    const consistent = updateContract(graph, "parse_candidates_tasks", { format: "json", description: "Tasks.", required: ["judge_correctness", "judge_clarity"] });
    expect(codes(consistent)).not.toContain("keyed-contract-conflict");
  });

  it("keeps every starter graph free of the new warnings", () => {
    for (const blueprint of BLUEPRINTS) expect(codes(load(blueprint.source)), blueprint.id).toEqual([]);
  });
});

describe("dry run: what each step sees", () => {
  it("fills each prompt with the sample and the inputs, and names work that arrives only through a verifier", () => {
    const run = dryRunGraph(load(OLD_PANEL_DRAFT), "Alice: a hash map. Bob: brute force.");
    const final = run.text.slice(run.text.indexOf("(`final`)"));
    expect(final).toContain("Gets the work of `judge_correctness`, `judge_clarity` only as far as `auditor` hands it on.");
    expect(final).toContain("> ⟨output of auditor⟩");
    expect(final).toContain("[reads-only-review]");
    const parse = run.text.slice(run.text.indexOf("(`parse_candidates`)"), run.text.indexOf("(`judge_correctness`)"));
    expect(parse).toContain('> "Alice: a hash map. Bob: brute force."');
    expect(run.text).toContain("This checks the wiring, not whether each step gets the data its task needs");
  });
});

describe("draft_graph: fan-out, probing and file handoffs", () => {
  const REVIEW_OUTLINE = {
    name: "file-review",
    description: "Reviews each changed file, then sums up.",
    steps: [
      { id: "plan", type: "orchestrator", task: "List the changed files to review.", keys: ["files"] },
      { id: "review", type: "worker", task: "Review this file and return its issues as a list.", after: ["plan"], foreach: "plan.files" },
      { id: "summary", type: "synthesizer", task: "Sum up the issues across files as a report.", after: ["review"] },
    ],
  };

  it("fans a step out over a key of a JSON list, capped by default", () => {
    const { graph, notes } = draft(REVIEW_OUTLINE);
    const review = graph.nodes.find((node) => node.id === "review")!;
    expect(review).toMatchObject({ foreach: "plan.files", maxItems: DRAFT_MAX_ITEMS });
    expect(review.prompt).toContain("{{item}}");
    expect(graph.contracts.plan_output).toMatchObject({ format: "json", required: ["files"] });
    expect(notes).toContainEqual(expect.stringContaining(`review: fans out over at most ${DRAFT_MAX_ITEMS} items`));
    expect(validateGraph(graph)).toEqual([]);
  });

  it("gives a fan-out list its own key when the orchestrator also splits", () => {
    const steps = [
      { id: "plan", type: "orchestrator", task: "Plan the review: the changed files, and the brief for the summary." },
      { id: "review", type: "worker", task: "Review this file and return its issues as a list.", after: ["plan"], foreach: "plan.files", max_items: 8 },
      { id: "summary", type: "synthesizer", task: "Sum up the issues across files as a report.", after: ["plan", "review"] },
    ];
    const { graph } = draft({ ...REVIEW_OUTLINE, steps });
    expect(graph.contracts.plan_tasks).toMatchObject({ required: ["files", "summary"] });
    expect(graph.nodes.find((node) => node.id === "review")?.maxItems).toBe(8);
    expect(validateGraph(graph)).toEqual([]);
  });

  it("probes a read-only step and hands outputs on as files", () => {
    const steps = [{ id: "plan", type: "agent", task: "Plan the change and return the plan as a numbered list.", probe: 3 }];
    const { graph } = draft({ ...REVIEW_OUTLINE, steps, handoff: "file" });
    expect(graph.nodes.find((node) => node.id === "plan")?.probe).toBe(3);
    expect(graph.handoff).toBe("file");
    expect(validateGraph(graph)).toEqual([]);
  });

  it("explains a fan-out or probe the outline gets wrong", () => {
    const step = (patch: Record<string, unknown>) => draftGraph({ ...REVIEW_OUTLINE, steps: [REVIEW_OUTLINE.steps[0], { ...REVIEW_OUTLINE.steps[1], ...patch }] });
    expect(step({ after: ["request"] })).toMatchObject({ error: expect.stringContaining('"plan" must be in its after') });
    expect(step({ foreach: "plan.missing" })).toMatchObject({ error: expect.stringContaining('has no "missing" among its keys') });
    expect(step({ foreach: "bad key!" })).toMatchObject({ error: expect.stringContaining("foreach must be") });
    expect(step({ probe: 2 })).toMatchObject({ error: expect.stringContaining("cannot both fan out and be probed") });
    expect(step({ foreach: undefined, max_items: 3 })).toMatchObject({ error: expect.stringContaining("max_items only applies") });
    expect(step({ foreach: undefined, probe: 9 })).toMatchObject({ error: expect.stringContaining("probe must be") });
    expect(draftGraph({ ...REVIEW_OUTLINE, steps: [{ id: "review", type: "worker", task: "Review it.", after: ["request"], foreach: "request" }] })).toMatchObject({
      error: expect.stringContaining("fans out over the request"),
    });
    expect(draftGraph({ ...REVIEW_OUTLINE, handoff: "disk" })).toMatchObject({ error: expect.stringContaining("handoff must be") });
  });
});

describe("read_studio_link", () => {
  it("is read-only like the rest", () => {
    expect(CONNECTOR_TOOLS.find((tool) => tool.name === "read_studio_link")?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
  });

  it("turns a studio link, or just its hash, back into the source", () => {
    const { source } = draft(PANEL_OUTLINE);
    const opened = call("open_graph_in_studio", { source }).text;
    const url = /\((https:[^)]+)\)/.exec(opened)?.[1] ?? "";
    for (const link of [url, url.slice(url.indexOf("#"))]) {
      const result = call("read_studio_link", { link });
      expect(result.isError).toBe(false);
      expect(result.text).toMatch(/^"hire-panel" is valid \(0 warnings\)\./);
      expect(result.text.endsWith(source)).toBe(true);
    }
  });

  it("explains a link that holds no graph", () => {
    expect(call("read_studio_link", { link: "https://www.devscratchpad.tech/graph/studio" }).isError).toBe(true);
    expect(call("read_studio_link", { link: "#g=Anot*base64" }).isError).toBe(true);
    expect(call("read_studio_link", {}).isError).toBe(true);
  });
});
