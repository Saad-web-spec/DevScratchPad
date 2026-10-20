/**
 * The connector feedback round: shorter links, nothing lost when a link opens, prompt-quality checks,
 * a dry run, clearer compiled prompts, drafting from an outline and non-code starter graphs.
 */
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { CONNECTOR_TOOLS, callConnectorTool } from "../graphConnector";
import { draftGraph } from "../graphDraft";
import { buildClaudeOrchestrator, buildSubagent } from "../graphExport";
import { MAX_RECENT_GRAPHS, readRecentGraphs, rememberGraph } from "../graphRecent";
import { decodeShareHash, encodeLegacyShareHash, encodeShareHash } from "../graphShare";
import { SHARE_DICTIONARIES, SHARE_DICTIONARY_WINDOW } from "../graphShareDictionary";
import { dryRunGraph } from "../graphSimulate";
import { parseGraphSkill, updateContract, updateNode, validateGraph, type SkillGraph } from "../graphSkill";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";

const context = { studioUrl: "https://www.devscratchpad.tech/graph/studio" };

/** SHA-256 (first 16 hex digits) of each frozen share dictionary. */
const PINNED_DICTIONARY_DIGESTS: string[] = [
  "7e959aebba318068",
  "e2abbca919ebb720",
  "ae46fb04dac85126",
  "283f9621f2808250",
  "ea35a9571cb65f93",
  "f29ae819a06febee",
  "6cea2c3e21eac612",
  "e25f608a3bfac215",
  "ef6f43c7a9fc30bf",
  "4b7f64e0f7141a6e",
  "a97bdc082c8d57f7",
];

function load(source = DEFAULT_GRAPH_SKILL): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
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

const RECEIPT_OUTLINE = {
  name: "receipt-scanner",
  description: "Turns a receipt into checked expense data.",
  input_label: "RECEIPT",
  steps: [
    { id: "plan", type: "orchestrator", task: "Read the receipt and give each extractor its part: the header fields and the line items." },
    { id: "header", type: "worker", task: "Extract the merchant, date and total.", after: ["plan"], returns: "a JSON object with merchant, date and total", keys: ["merchant", "date", "total"] },
    { id: "items", type: "worker", task: "Extract every line item with its name and price.", after: ["plan"], returns: "a JSON object with an items array", keys: ["items"] },
    { id: "verify", type: "verifier", task: "Check the extracted data against the receipt.", after: ["header", "items"], gate: "The item prices add up to the total, and the date is a real date." },
    { id: "report", type: "synthesizer", task: "Write the expense entry as a Markdown table plus the total.", after: ["verify"], tools: ["Read"] },
  ],
};

describe("share links", () => {
  it("round-trips through the dictionary format and still opens old LZ links", () => {
    for (const source of [DEFAULT_GRAPH_SKILL, ...BLUEPRINTS.map((blueprint) => blueprint.source), "---\nname: ü 日本\n---\n"]) {
      const hash = encodeShareHash({ source });
      expect(hash.startsWith("#g=")).toBe(true);
      expect(decodeShareHash(hash)?.source).toBe(source);
    }
    expect(decodeShareHash(encodeLegacyShareHash({ source: DEFAULT_GRAPH_SKILL }))?.source).toBe(DEFAULT_GRAPH_SKILL);
  });

  it("makes links far shorter than plain compression", () => {
    const draft = draftGraph(RECEIPT_OUTLINE) as { source: string };
    const plain = (source: string) => deflateRawSync(Buffer.from(source), { level: 9 }).toString("base64url").length;
    // A fresh graph shares the format's keys and phrases with the general dictionary.
    expect(encodeShareHash(draft).length).toBeLessThan(plain(draft.source) * 0.75);
    // A graph edited from a starter costs only its changes.
    const edited = BLUEPRINTS.find((blueprint) => blueprint.id === "design-an-app")!.source.replace("APP IDEA", "RECEIPT SCANNER APP");
    expect(encodeShareHash({ source: edited }).length).toBeLessThan(120);
  });

  it("refuses garbage, unknown dictionaries and links that inflate past the size cap", () => {
    expect(decodeShareHash("#g=Anot*base64")).toBeNull();
    expect(decodeShareHash("#g=AAAAA")).toBeNull();
    expect(decodeShareHash("#g=zAAAA")).toBeNull();
    const bomb = encodeShareHash({ source: "a".repeat(600_000) });
    expect(bomb.length).toBeLessThan(2_000);
    expect(decodeShareHash(bomb)).toBeNull();
  });

  it("never changes a dictionary, since old links depend on it byte for byte", () => {
    const digests = SHARE_DICTIONARIES.map((text) => createHash("sha256").update(text).digest("hex").slice(0, 16));
    expect(digests).toEqual(PINNED_DICTIONARY_DIGESTS);
    for (const text of SHARE_DICTIONARIES) expect(text.length).toBeLessThanOrEqual(SHARE_DICTIONARY_WINDOW);
  });
});

describe("recent graphs", () => {
  const draft = (name: string) => DEFAULT_GRAPH_SKILL.replace("name: parallel-system-audit", `name: ${name}`);

  it("keeps the replaced draft first, once, and at most a few", () => {
    let list = rememberGraph([], draft("a"), 1);
    list = rememberGraph(list, draft("b"), 2);
    list = rememberGraph(list, draft("a"), 3);
    expect(list.map((entry) => [entry.name, entry.savedAt])).toEqual([
      ["a", 3],
      ["b", 2],
    ]);
    for (let index = 0; index < 20; index++) list = rememberGraph(list, draft(`n${index}`), 10 + index);
    expect(list).toHaveLength(MAX_RECENT_GRAPHS);
  });

  it("skips empty drafts and shipped graphs, and drops malformed stored entries", () => {
    expect(rememberGraph([], "  ", 1)).toEqual([]);
    expect(rememberGraph([], DEFAULT_GRAPH_SKILL, 1, [DEFAULT_GRAPH_SKILL])).toEqual([]);
    expect(readRecentGraphs([{ name: "x", source: "s", savedAt: 1 }, { name: 1 }, null, "x"])).toEqual([{ name: "x", source: "s", savedAt: 1 }]);
    expect(readRecentGraphs({})).toEqual([]);
  });
});

describe("prompt-quality checks", () => {
  it("flags a verifier without a gate and a vague gate", () => {
    const graph = load();
    expect(codes(updateNode(graph, "verifier", { gate: undefined, onFail: undefined, maxRetries: undefined }), "verifier")).toContain("verifier-no-gate");
    expect(codes(updateNode(graph, "verifier", { gate: "Looks good." }), "verifier")).toContain("gate-vague");
  });

  it("flags prompts too short to act on, with no word on what to return, or that never name their inputs", () => {
    const graph = load();
    expect(codes(updateNode(graph, "merger", { prompt: "Merge.\n\n{{verifier.output}}" }), "merger")).toContain("prompt-too-short");
    expect(codes(updateNode(graph, "merger", { prompt: "Combine the verified findings below with care and attention.\n\n{{verifier.output}}" }), "merger")).toContain("prompt-no-output");
    expect(codes(updateNode(graph, "merger", { prompt: "Combine the verified findings into one clear, actionable report." }), "merger")).toContain("prompt-no-inputs");
  });

  it("flags keys a step reads that its source never returns", () => {
    const graph = load();
    const required = updateContract(graph, "subtask_json", { format: "json", description: "Tasks.", required: ["worker_research"] });
    expect(codes(required, "worker_compare")).toContain("ref-key-not-in-contract");
    expect(codes(required, "worker_research")).not.toContain("ref-key-not-in-contract");
    const markdown = updateNode(graph, "merger", { prompt: "Write the report from the kept claims.\n\n{{verifier.claims}}" });
    expect(codes(markdown, "merger")).toContain("ref-key-not-json");
  });

  it("keeps every starter graph free of them, written without YAML anchors", () => {
    for (const blueprint of BLUEPRINTS) {
      expect(validateGraph(load(blueprint.source)), blueprint.id).toEqual([]);
      expect(blueprint.source, blueprint.id).not.toMatch(/[&*]a\d/);
    }
  });
});

describe("compiled prompts", () => {
  it("tells each step where in its task message an input is", () => {
    const graph = load();
    expect(buildSubagent(graph, graph.nodes.find((node) => node.id === "verifier")!)).toContain("Original goal: the user's request (under `### goal` in your task message)");
    expect(buildSubagent(graph, graph.nodes.find((node) => node.id === "worker_research")!)).toContain("your task (under `### splitter` in your task message)");
    expect(buildClaudeOrchestrator(graph)).toContain("handed on under `### goal`");
  });

  it("cuts a gate's verdict off before the next step or the user sees it", () => {
    const skill = buildClaudeOrchestrator(load());
    expect(skill).toContain("Cut the verdict off before you hand the output on or return it");
    expect(buildClaudeOrchestrator(load(SHIP_CHANGE_GRAPH_SKILL))).not.toContain("without its `GATE:` verdict");
    const draft = draftGraph({ ...RECEIPT_OUTLINE, steps: [{ id: "work", type: "worker", task: "Do the work and return a list of results." }, { id: "check", type: "verifier", task: "Check the work.", after: ["work"], gate: "Every result is backed by the request." }] });
    if ("error" in draft) throw new Error(draft.error);
    expect(buildClaudeOrchestrator(load(draft.source))).toContain("Return the output of **CHECK** to the user as it is, without its `GATE:` verdict (tell the user it passed).");
  });
});

describe("dry run", () => {
  it("walks every stage with the sample request and counts the subagent calls", () => {
    const run = dryRunGraph(load(), "Audit our login flow");
    expect(run.text).toContain('Request (`goal`): "Audit our login flow"');
    expect(run.text).toContain('Receives: the request "Audit our login flow"');
    expect(run.text).toContain("Stage 2 (4 steps at the same time)");
    expect(run.text).toContain("Gate: Every kept claim cites concrete evidence");
    expect(run.text).toContain("Result: every handoff lines up.");
    expect(run.subagentCalls).toBe(7);
  });

  it("shows a problem at the step it would hit", () => {
    const broken = updateNode(load(), "merger", { prompt: "Write the report from the kept claims.\n\n{{verifier.claims}}" });
    const run = dryRunGraph(broken, "");
    const merger = run.text.slice(run.text.indexOf("(`merger`)"));
    expect(merger).toContain("[ref-key-not-json]");
    expect(run.warnings).toBeGreaterThan(0);
  });
});

describe("draft_graph", () => {
  it("writes a valid graph from an outline, with a keyed split and checked contracts", () => {
    const draft = draftGraph(RECEIPT_OUTLINE);
    if ("error" in draft) throw new Error(draft.error);
    const graph = load(draft.source);
    expect(validateGraph(graph)).toEqual([]);
    expect(graph.nodes.find((node) => node.id === "header")?.prompt).toContain("{{plan.header}}");
    expect(graph.contracts.header_output).toMatchObject({ format: "json", required: ["merchant", "date", "total"] });
    expect(graph.nodes.find((node) => node.id === "verify")).toMatchObject({ isolatedContext: true, onFail: "retry", tools: ["Read", "Grep", "Glob"] });
    expect(draft.notes[0]).toContain("plan, header, items, verify: no tools were given");
  });

  it("explains what is wrong with an outline", () => {
    expect(draftGraph({ ...RECEIPT_OUTLINE, steps: [{ id: "1x", type: "worker", task: "x" }] })).toMatchObject({ error: expect.stringContaining("steps[0].id") });
    expect(draftGraph({ ...RECEIPT_OUTLINE, steps: [{ id: "a", type: "worker", task: "Do it.", after: ["ghost"] }] })).toMatchObject({ error: expect.stringContaining('"ghost"') });
    expect(draftGraph({ ...RECEIPT_OUTLINE, steps: [{ id: "a", type: "input", task: "x" }] })).toMatchObject({ error: expect.stringContaining("type") });
    expect(draftGraph({ name: "x", description: "y", steps: [] })).toMatchObject({ error: expect.stringContaining("steps") });
  });

  it("gives a verifier without a gate a general one and says so", () => {
    const draft = draftGraph({ ...RECEIPT_OUTLINE, steps: [{ id: "work", type: "worker", task: "Do the work and return a list of results." }, { id: "check", type: "verifier", task: "Check the work.", after: ["work"] }] });
    if ("error" in draft) throw new Error(draft.error);
    expect(load(draft.source).nodes.find((node) => node.id === "check")?.gate).toBeTruthy();
    expect(draft.notes.some((note) => note.startsWith("check: no gate"))).toBe(true);
  });
});

describe("connector tools", () => {
  it("offers drafting and a dry run, read-only like the rest", () => {
    for (const name of ["draft_graph", "dry_run_graph"]) {
      expect(CONNECTOR_TOOLS.find((tool) => tool.name === name)?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    }
  });

  it("draft_graph returns the checked source and a studio link", () => {
    const result = call("draft_graph", RECEIPT_OUTLINE);
    expect(result.isError).toBe(false);
    expect(result.text).toMatch(/^Drafted "receipt-scanner": 4 stages, 5 subagents \(0 errors, 0 warnings\)/);
    expect(result.text).toContain("[Open receipt-scanner in Skill Graph](https://www.devscratchpad.tech/graph/studio#g=");
    expect(result.text).toContain("Source (graph.skill.md):\n\n---\nname: receipt-scanner");
    expect(call("draft_graph", { name: "x" }).isError).toBe(true);
  });

  it("dry_run_graph walks the plan; compile_graph points at the zip download", () => {
    expect(call("dry_run_graph", { source: DEFAULT_GRAPH_SKILL, sample: "Audit login" }).text).toContain("Stage 4");
    expect(call("dry_run_graph", { source: "no frontmatter" }).isError).toBe(true);
    expect(call("compile_graph", { source: DEFAULT_GRAPH_SKILL }).text).toContain("Export → Claude Code + Cursor kit (.zip)");
  });

  it("lists the non-code starter graphs", () => {
    const list = call("list_graph_templates", {}).text;
    for (const id of ["research-report", "write-an-article", "analyze-a-dataset", "design-an-app"]) expect(list).toContain(`- ${id}:`);
  });
});
