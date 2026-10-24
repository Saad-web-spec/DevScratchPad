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

describe("SEO engine report fixes", () => {
  it("supports compact mode in draft_graph and edit_graph and accepts studio_link as source across tools", () => {
    const drafted = callConnectorTool("draft_graph", { ...PANEL_OUTLINE, compact: true }, context)!;
    const draftText = drafted.content.map((b) => b.text).join("\n\n");
    expect(draftText).toContain("Source omitted (compact: true).");
    expect(draftText).not.toContain("Source (graph.skill.md):");
    expect(drafted.structuredContent?.source).toBeUndefined();
    const link = drafted.structuredContent?.studio_link as string;
    expect(link).toMatch(/^https:\/\/www\.devscratchpad\.tech\/graph\/studio#g=/);

    // Pass studio_link directly as `source` into edit_graph with compact: true
    const edited = callConnectorTool(
      "edit_graph",
      {
        source: link,
        compact: true,
        operations: [{ op: "set_step", id: "final", fields: { model: "sonnet" } }],
      },
      context
    )!;
    expect(edited.structuredContent?.applied).toEqual(["set model on final"]);
    // A misnamed key is refused instead of reading as a successful edit that changed nothing.
    const misnamed = callConnectorTool("edit_graph", { source: link, operations: [{ op: "set_step", id: "final", patch: { model: "sonnet" } }] }, context)!;
    expect(misnamed.isError).toBe(true);
    expect(misnamed.content[0].text).toContain('set_step on "final" changes nothing: put the changes under fields (not patch)');
    const editText = edited.content.map((b) => b.text).join("\n\n");
    expect(edited.isError).not.toBe(true);
    expect(editText).toContain("Source omitted (compact: true).");
    expect(edited.structuredContent?.source).toBeUndefined();
    const editedLink = edited.structuredContent?.studio_link as string;
    expect(editedLink).toMatch(/^https:\/\/www\.devscratchpad\.tech\/graph\/studio#g=/);

    // Pass studio_link (or #g= hash) as `source` to validate_graph, dry_run_graph, and compile_graph
    const hashOnly = editedLink.slice(editedLink.indexOf("#"));
    const validated = call("validate_graph", { source: hashOnly });
    expect(validated.isError).toBe(false);
    expect(validated.text).toContain("Valid:");

    const dryRun = call("dry_run_graph", { source: editedLink, sample: "Alice: hash map." });
    expect(dryRun.isError).toBe(false);

    const compiled = call("compile_graph", { source: editedLink, target: "single_skill" });
    expect(compiled.isError).toBe(false);
    expect(compiled.text).toContain("Compiled \"hire-panel\"");
  });

  it("handles chat approval + wide export without false warnings and auto-moves risk off approval steps in draft_graph", () => {
    // Putting risk: "wide" on the approval step in draft_graph moves it to the downstream export step
    const { graph, notes } = draft({
      name: "seo-export",
      description: "Approves and exports SEO data to Google Sheets.",
      steps: [
        { id: "roadmap", type: "synthesizer", task: "Compile the SEO roadmap table.", tools: [] },
        { id: "approve_export", type: "approval", task: "Ask whether to export the SEO roadmap to Google Sheets.", after: ["roadmap"], risk: "wide" },
        { id: "sheets_export", type: "agent", task: "Export the approved SEO roadmap to Google Sheets and return the sheet link.", after: ["approve_export"], tools: ["WebSearch", "WebFetch"] },
      ],
    });
    expect(graph.nodes.find((n) => n.id === "approve_export")?.risk).toBeUndefined();
    expect(graph.nodes.find((n) => n.id === "sheets_export")?.risk).toBe("wide");
    expect(notes).toContainEqual(expect.stringContaining("approve_export: approvals only pause the run, so risk: wide was moved to sheets_export"));
    // Non-shell step with risk: "wide" guarded by an upstream approval step has 0 warnings
    expect(validateGraph(graph)).toEqual([]);

    // Non-shell chat step with risk: "wide" does not trigger wide-without-check even without an approval step
    const unguarded: SkillGraph = {
      ...graph,
      edges: [{ from: "request", to: "roadmap" }, { from: "roadmap", to: "sheets_export" }],
      nodes: graph.nodes.filter((n) => n.id !== "approve_export"),
    };
    expect(codes(unguarded, "sheets_export")).not.toContain("wide-without-check");

    // Manual approval step with risk: "wide" and no risky child explains moving risk to the action step
    const misplacedRisk: SkillGraph = {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === "approve_export" ? { ...n, risk: "wide" } : n.id === "sheets_export" ? { ...n, risk: undefined } : n
      ),
    };
    const approvalWarning = validateGraph(misplacedRisk).find((i) => i.code === "approval-guards-nothing");
    expect(approvalWarning?.message).toContain("is marked risk: wide, but an approval only pauses the run");
    expect(approvalWarning?.message).toContain("Move risk: wide to the step after");
  });

  it("assigns Read when tools: [] is passed to draft_graph and surfaces Tools per step in plan summaries", () => {
    const { graph, notes } = draft({
      name: "pure-synthesis",
      description: "Synthesizes inputs without web tools.",
      steps: [
        { id: "research", type: "worker", task: "Gather facts from the web." },
        { id: "roadmap", type: "synthesizer", task: "Merge the facts into a roadmap.", after: ["research"], tools: [] },
      ],
    });
    expect(graph.nodes.find((n) => n.id === "roadmap")?.tools).toEqual(["Read"]);
    expect(notes).toContainEqual(expect.stringContaining("roadmap: tools: [] was given, so it gets Read only"));

    const validated = call("validate_graph", { source: callConnectorTool("draft_graph", {
      name: "pure-synthesis",
      description: "Synthesizes inputs without web tools.",
      steps: [
        { id: "research", type: "worker", task: "Gather facts from the web." },
        { id: "roadmap", type: "synthesizer", task: "Merge the facts into a roadmap.", after: ["research"], tools: [] },
      ],
    }, context)!.structuredContent!.source as string });
    expect(validated.text).toContain("Tools per step: research [WebSearch, WebFetch], roadmap [Read]");
  });

  it("does not append a duplicate {{step}} block when task already references {{step.output}} and flags duplicate-input-ref", () => {
    const { graph } = draft({
      name: "no-dup-ref",
      description: "References roadmap.output inline.",
      steps: [
        { id: "roadmap", type: "synthesizer", task: "Write the 90-day SEO roadmap.", tools: [] },
        { id: "sheets_export", type: "agent", task: "Format {{roadmap.output}} as a structured multi-tab spreadsheet payload ready for export.", after: ["roadmap"] },
      ],
    });
    const exportNode = graph.nodes.find((n) => n.id === "sheets_export")!;
    expect(exportNode.prompt).toContain("{{roadmap.output}}");
    expect(exportNode.prompt).not.toContain("{{roadmap}}\n");
    expect(validateGraph(graph)).toEqual([]);

    // When raw Markdown has both {{roadmap.output}} and {{roadmap}}, validateGraph flags duplicate-input-ref
    const dupGraph: SkillGraph = {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === "sheets_export" ? { ...n, prompt: `${n.prompt}\n\nROADMAP (` + "`roadmap`" + `):\n{{roadmap}}` } : n
      ),
    };
    expect(codes(dupGraph, "sheets_export")).toContain("duplicate-input-ref");
  });

  it("replaces inline {{node.key}} with {{item}} in draft_graph fan-out steps and flags foreach-reads-whole-list in validateGraph", () => {
    const { graph, notes } = draft({
      name: "seo-fanout",
      description: "Creates briefs for each topic.",
      steps: [
        { id: "content_strategy", type: "orchestrator", task: "Choose the top blog topics.", keys: ["topics"] },
        {
          id: "brief_generator",
          type: "worker",
          task: "Write a detailed content brief for {{content_strategy.topics}}.",
          after: ["content_strategy"],
          foreach: "content_strategy.topics",
        },
      ],
    });
    const brief = graph.nodes.find((n) => n.id === "brief_generator")!;
    expect(brief.prompt).toContain("Write a detailed content brief for {{item}}.");
    expect(brief.prompt).not.toContain("{{content_strategy.topics}}");
    expect(notes).toContainEqual(expect.stringContaining("replaced {{content_strategy.topics}} (the whole list) with {{item}}"));
    expect(validateGraph(graph)).toEqual([]);

    // If edited to put {{content_strategy.topics}} back alongside {{item}}, validateGraph warns with foreach-reads-whole-list
    const wholeListGraph: SkillGraph = {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === "brief_generator"
          ? { ...n, prompt: `Write a brief for {{content_strategy.topics}} focusing on:\n{{item}}` }
          : n
      ),
    };
    expect(codes(wholeListGraph, "brief_generator")).toContain("foreach-reads-whole-list");
  });

  it("runs an end-to-end MCP session (draft -> edit -> validate -> dry_run -> run_graph -> save_workflow) for a wide chat workflow without requiring approval", async () => {
    const { handleBodyWithChecks } = await import("../mcpProtocol");
    const rpcCall = async (method: string, params: Record<string, unknown> = {}) => {
      const res = (await handleBodyWithChecks({ jsonrpc: "2.0", id: 1, method, params }, context)) as {
        result?: Record<string, unknown>;
        error?: unknown;
      };
      expect(res.error).toBeUndefined();
      return res.result!;
    };
    const toolCall = async (name: string, args: Record<string, unknown>) => {
      const res = await rpcCall("tools/call", { name, arguments: args });
      expect(res.isError).not.toBe(true);
      return res as { content: { text: string }[]; structuredContent: Record<string, unknown> };
    };

    // 1. Initialize & check tool annotations
    const init = await rpcCall("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
    expect(init.protocolVersion).toBe("2025-06-18");
    const list = (await rpcCall("tools/list")) as { tools: { name: string; annotations: Record<string, unknown> }[] };
    expect(list.tools).toHaveLength(16);
    for (const t of list.tools) {
      expect(t.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    }

    // 2. Draft workflow with risk: "wide" on sheets_export and NO approval step
    const drafted = await toolCall("draft_graph", {
      name: "skill-graph-seo-engine",
      description: "SEO strategy, fan-out content briefs, synthesis roadmap, and Google Sheets export.",
      compact: true,
      steps: [
        { id: "keyword_research", type: "worker", task: "Research target keywords and search intent and return a keyword table." },
        { id: "content_strategy", type: "orchestrator", task: "Select priority blog topics based on research.", after: ["keyword_research"], keys: ["topics"] },
        { id: "brief_generator", type: "worker", task: "Write a complete SEO content brief for {{content_strategy.topics}} and return the structured brief.", after: ["content_strategy"], foreach: "content_strategy.topics" },
        { id: "roadmap", type: "synthesizer", task: "Synthesize all verified briefs into a 90-day SEO publishing roadmap table.", after: ["brief_generator"], tools: [] },
        { id: "sheets_export", type: "agent", task: "Format {{roadmap.output}} as a multi-tab Google Sheets payload and return the sheet link.", after: ["roadmap"], risk: "wide", tools: ["WebSearch", "WebFetch"] },
      ],
    });
    expect(drafted.structuredContent.valid).toBe(true);
    expect(drafted.structuredContent.warnings).toEqual([]);
    const studioLink = drafted.structuredContent.studio_link as string;

    // 3. Edit via studio_link with compact: true
    const edited = await toolCall("edit_graph", {
      source: studioLink,
      compact: true,
      operations: [{ op: "set_step", id: "roadmap", fields: { model: "opus" } }],
    });
    expect(edited.structuredContent.valid).toBe(true);
    expect(edited.structuredContent.applied).toEqual(["set model on roadmap"]);
    expect(edited.content[0].text).toContain("roadmap (Writer: synthesizer, opus)");
    const updatedLink = edited.structuredContent.studio_link as string;

    // 4. Validate & dry_run via studio_link
    const validated = await toolCall("validate_graph", { source: updatedLink });
    expect(validated.structuredContent.valid).toBe(true);
    expect(validated.content[0].text).toContain("Tools per step:");

    const dryRun = await toolCall("dry_run_graph", { source: updatedLink, sample: "SEO for Skill Graph" });
    expect(dryRun.structuredContent.errors).toBe(0);

    // 5. Run end-to-end through run_graph without any approval interruption
    const started = await toolCall("run_graph", {
      workflow: updatedLink,
      request: "Create 90-day SEO roadmap for Skill Graph",
    });
    expect(started.structuredContent.status).toBe("running");

    const finished = await toolCall("run_graph", {
      run: started.structuredContent.run,
      answers: {
        keyword_research: "| Keyword | Intent |\n| ai agent workflow | transactional |",
        content_strategy: JSON.stringify({ topics: ["Multi-Agent DAGs", "Claude MCP Connectors"] }),
        brief_generator: [
          "Brief 1: Multi-Agent DAGs — primary keyword, H2 structure, search intent.",
          "Brief 2: Claude MCP Connectors — primary keyword, H2 structure, search intent.",
        ],
        roadmap: "| Week | Article |\n| 1 | Multi-Agent DAGs |\n| 2 | Claude MCP Connectors |",
        sheets_export: "Exported 2 tabs to Google Sheets: https://docs.google.com/spreadsheets/d/example",
      },
    });
    expect(finished.structuredContent.status).toBe("done");
    expect(finished.structuredContent.final_answer).toContain("Exported 2 tabs to Google Sheets");

    // 6. Save workflow, open in studio, compile, and round-trip studio_link
    const saved = await toolCall("save_workflow", { workflow: updatedLink, name: "Skill Graph SEO Engine" });
    expect(saved.structuredContent.name).toBe("Skill Graph SEO Engine");
    const opened = await toolCall("open_graph_in_studio", { source: updatedLink });
    expect(opened.content[0].text).toContain("https://www.devscratchpad.tech/graph/studio#g=");
    const compiled = await toolCall("compile_graph", { source: updatedLink, target: "claude_code_kit" });
    expect((compiled.structuredContent.files as unknown[]).length).toBeGreaterThanOrEqual(5);
    const roundTrip = await toolCall("read_studio_link", { link: updatedLink });
    expect(roundTrip.content[0].text).toContain("is valid (0 warnings).");
    expect(roundTrip.content[0].text).toContain("name: skill-graph-seo-engine");

    // 7. Prompts, Resources, Templates, Format, Step-by-Step Referee (start_run/advance_run), and Lessons (review_lessons/bake_lessons)
    const promptsList = (await rpcCall("prompts/list")) as { prompts: { name: string }[] };
    expect(promptsList.prompts.map((p) => p.name)).toContain("design_workflow");
    const promptMsg = (await rpcCall("prompts/get", { name: "design_workflow", arguments: { project: "SEO Engine" } })) as {
      messages: { content: { text: string } }[];
    };
    expect(promptMsg.messages[0].content.text).toContain("SEO Engine");

    const resourcesList = (await rpcCall("resources/list")) as { resources: { uri: string }[] };
    expect(resourcesList.resources.length).toBe(15);
    const formatRes = (await rpcCall("resources/read", { uri: "skill-graph://format" })) as { contents: { text: string }[] };
    expect(formatRes.contents[0].text).toContain("spec: skill-graph/1");

    const formatTool = await toolCall("get_graph_format", {});
    expect(formatTool.content[0].text).toContain("without naming the same input twice");
    expect(formatTool.content[0].text).toContain("naming the whole list `{{step.key}}` inside a `foreach` step");

    const templatesList = await toolCall("list_graph_templates", {});
    expect(templatesList.content[0].text).toContain("research-and-fact-check");
    const templateSource = await toolCall("get_graph_template", { id: "research-and-fact-check" });
    expect(templateSource.content[0].text).toContain("name: research-and-fact-check");

    // Step-by-step Claude Code referee (start_run -> advance_run)
    const codeRunStart = await toolCall("start_run", {
      source: updatedLink,
      request: "Audit Skill Graph SEO keywords",
    });
    expect(codeRunStart.structuredContent.status).toBe("running");
    const firstTask = (codeRunStart.structuredContent.tasks as { id: string }[])[0].id;
    const codeRunNext = await toolCall("advance_run", {
      run: codeRunStart.structuredContent.run,
      outputs: [{ task: firstTask, output: "| Keyword | Volume |\n| mcp workflow | 1200 |" }],
    });
    expect(codeRunNext.structuredContent.status).toBe("running");

    // Lessons review & baking (review_lessons -> bake_lessons)
    const sampleExperience = "# Lessons\n\n- [L1] keyword_research: Always include search intent column.\n  evidence: gate failed on missing intent · seen 2 · helped 2\n";
    const reviewed = await toolCall("review_lessons", { source: updatedLink, experience: sampleExperience });
    expect((reviewed.structuredContent.lessons as { step: string }[])[0].step).toBe("keyword_research");
    const baked = await toolCall("bake_lessons", { source: updatedLink, experience: sampleExperience, lessons: [1] });
    expect(baked.structuredContent.valid).toBe(true);
    expect(baked.structuredContent.baked).toEqual([1]);
  });
});


