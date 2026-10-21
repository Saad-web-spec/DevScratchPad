import { describe, expect, it, vi } from "vitest";
import { CONNECTOR_TOOLS, MAX_COMPILE_RESULT_CHARS, callConnectorTool } from "../graphConnector";
import { buildExportKit } from "../graphExport";
import { INVALID_PARAMS, METHOD_NOT_FOUND, SUPPORTED_PROTOCOL_VERSIONS, handleBody, handleMessage } from "../mcpProtocol";
import { decodeShareHash, encodeLegacyShareHash } from "../graphShare";
import { parseGraphSkill, validateGraph, type SkillGraph } from "../graphSkill";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "../graphTemplates";

const context = { studioUrl: "https://www.devscratchpad.tech/graph/studio" };

function call(name: string, args: Record<string, unknown> = {}) {
  const result = callConnectorTool(name, args, context);
  if (!result) throw new Error(`no tool ${name}`);
  return { text: result.content.map((block) => block.text).join("\n\n"), blocks: result.content, isError: result.isError === true };
}

function rpc(method: string, params?: Record<string, unknown>, id: number | string = 1) {
  return handleMessage({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }, context);
}

const CYCLIC = DEFAULT_GRAPH_SKILL.replace("    - from: verifier\n      to: merger", "    - from: merger\n      to: splitter\n    - from: verifier\n      to: merger");

describe("connector tools: what the directory review checks", () => {
  it("gives every tool a short name, a title and read-only annotations", () => {
    for (const tool of CONNECTOR_TOOLS) {
      expect(tool.name.length).toBeLessThanOrEqual(64);
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.annotations).toMatchObject({ title: tool.title, readOnlyHint: true, destructiveHint: false });
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("keeps every starter graph free of errors, so Claude starts from a valid graph", () => {
    for (const blueprint of BLUEPRINTS) {
      const graph = parseGraphSkill(blueprint.source).graph as SkillGraph;
      expect(validateGraph(graph).filter((issue) => issue.severity === "error"), blueprint.id).toEqual([]);
      expect(call("get_graph_template", { id: blueprint.id }).text).toContain(blueprint.source);
    }
  });
});

describe("validate_graph", () => {
  it("reports the stages and subagents the studio shows", () => {
    const result = call("validate_graph", { source: DEFAULT_GRAPH_SKILL });
    expect(result.isError).toBe(false);
    expect(result.text).toMatch(/^Valid: 4 stages, 7 subagents/);
    expect(result.text).toContain("worker_research (worker, haiku), worker_compare (worker, haiku)");
    expect(result.text).toContain("in parallel");
  });

  it("lists errors with their codes and steps", () => {
    const result = call("validate_graph", { source: CYCLIC });
    expect(result.text).toMatch(/^Not valid yet/);
    expect(result.text).toContain("[cycle]");
  });

  it("explains a file it cannot read", () => {
    expect(call("validate_graph", { source: "just some text" }).text).toContain("could not be read");
  });

  it("asks for a source when there is none", () => {
    const result = call("validate_graph", {});
    expect(result.isError).toBe(true);
    expect(result.text).toContain("source is required");
  });
});

describe("compile_graph", () => {
  it("returns every file of the Claude Code kit, each with its path", () => {
    const result = call("compile_graph", { source: DEFAULT_GRAPH_SKILL });
    const kit = buildExportKit(parseGraphSkill(DEFAULT_GRAPH_SKILL).graph as SkillGraph);
    expect(result.isError).toBe(false);
    expect(result.blocks).toHaveLength(kit.length + 1);
    expect(result.blocks[0].text).toContain(".claude/skills/parallel-system-audit/SKILL.md");
    for (const file of kit) expect(result.text).toContain(`File: ${file.path}\n\n${file.content}`);
  });

  it("compiles a single SKILL.md or a Cursor rule on request", () => {
    expect(call("compile_graph", { source: DEFAULT_GRAPH_SKILL, target: "single_skill" }).blocks[1].text).toMatch(/^File: \.claude\/skills\/parallel-system-audit\/SKILL\.md/);
    expect(call("compile_graph", { source: DEFAULT_GRAPH_SKILL, target: "cursor_rule" }).blocks[1].text).toMatch(/^File: \.cursor\/rules\/parallel-system-audit\.mdc/);
  });

  it("links the kit to the download page, which rebuilds the same files from the link", () => {
    const withDownload = { ...context, downloadUrl: "https://www.devscratchpad.tech/graph/download" };
    const result = callConnectorTool("compile_graph", { source: DEFAULT_GRAPH_SKILL }, withDownload);
    const intro = result?.content[0].text ?? "";
    const link = /\[Download the parallel-system-audit kit\]\((https:\/\/www\.devscratchpad\.tech\/graph\/download#g=[^)]+)\)/.exec(intro);
    expect(link).not.toBeNull();
    const shared = decodeShareHash(new URL(link?.[1] ?? "").hash);
    expect(shared?.source).toBe(DEFAULT_GRAPH_SKILL);
    expect(intro).toContain("(https://www.devscratchpad.tech/graph/studio#g=");
    // Only the kit gets a download link; without a download page the studio export is offered instead.
    expect(callConnectorTool("compile_graph", { source: DEFAULT_GRAPH_SKILL, target: "cursor_rule" }, withDownload)?.content[0].text).not.toContain("graph/download");
    expect(call("compile_graph", { source: DEFAULT_GRAPH_SKILL }).blocks[0].text).toContain("Export → Claude Code + Cursor kit (.zip)");
  });

  it("refuses a graph with errors, and an unknown target", () => {
    const invalid = call("compile_graph", { source: CYCLIC });
    expect(invalid.isError).toBe(true);
    expect(invalid.text).toContain("cannot be compiled yet");
    expect(call("compile_graph", { source: DEFAULT_GRAPH_SKILL, target: "zip" }).isError).toBe(true);
  });
});

describe("open_graph_in_studio", () => {
  it("returns a short-labelled studio link whose hash holds the graph", () => {
    const result = call("open_graph_in_studio", { source: DEFAULT_GRAPH_SKILL });
    const link = /Studio link: \[Open parallel-system-audit in Skill Graph\]\((\S+)\)/.exec(result.text);
    const url = link?.[1] ?? "";
    expect(url.startsWith(`${context.studioUrl}#g=`)).toBe(true);
    expect(decodeShareHash(url.slice(url.indexOf("#")))?.source).toBe(DEFAULT_GRAPH_SKILL);
    // A starter graph costs next to nothing against its own dictionary.
    expect(url.length - context.studioUrl.length).toBeLessThan(encodeLegacyShareHash({ source: DEFAULT_GRAPH_SKILL }).length / 10);
    expect(result.text).toContain("The graph is valid.");
    expect(result.text).toContain("Recent graphs");
  });

  it("still links a graph with errors, and says so", () => {
    expect(call("open_graph_in_studio", { source: CYCLIC }).text).toContain("still has");
  });
});

describe("MCP protocol", () => {
  it("negotiates the protocol version", () => {
    expect(rpc("initialize", { protocolVersion: "2025-06-18" })).toMatchObject({ result: { protocolVersion: "2025-06-18", serverInfo: { name: "skill-graph" } } });
    expect(rpc("initialize", { protocolVersion: "1999-01-01" })).toMatchObject({ result: { protocolVersion: SUPPORTED_PROTOCOL_VERSIONS[0] } });
  });

  it("answers requests and stays silent on notifications and client responses", () => {
    expect(rpc("ping")).toEqual({ jsonrpc: "2.0", id: 1, result: {} });
    expect(handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, context)).toBeNull();
    expect(handleMessage({ jsonrpc: "2.0", id: 4, result: {} }, context)).toBeNull();
    expect(handleBody([{ jsonrpc: "2.0", method: "notifications/initialized" }], context)).toBeNull();
    expect(handleBody([{ jsonrpc: "2.0", id: "a", method: "ping" }, { jsonrpc: "2.0", method: "notifications/x" }], context)).toEqual([{ jsonrpc: "2.0", id: "a", result: {} }]);
  });

  it("returns protocol errors for unknown methods and tools", () => {
    expect(rpc("sampling/createMessage")).toMatchObject({ error: { code: METHOD_NOT_FOUND } });
    expect(rpc("tools/call", { name: "delete_everything", arguments: {} })).toMatchObject({ error: { code: INVALID_PARAMS } });
    expect(handleMessage({ id: 1, method: "ping" }, context)).toMatchObject({ error: { code: -32600 } });
  });

  it("lists the tools and serves the starter prompt", () => {
    expect(rpc("tools/list")).toMatchObject({ result: { tools: CONNECTOR_TOOLS } });
    const prompt = rpc("prompts/get", { name: "design_workflow", arguments: { project: "A Next.js app with Stripe billing" } });
    expect(JSON.stringify(prompt)).toContain("A Next.js app with Stripe billing");
    expect(rpc("prompts/get", { name: "other" })).toMatchObject({ error: { code: INVALID_PARAMS } });
  });

  it("answers a tool that throws as a tool error Claude can read, logging only the tool's name", () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((message: string) => errors.push(message));
    try {
      // No context: the first studio link the tool builds throws a TypeError.
      const broken = null as unknown as typeof context;
      const response = handleMessage({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "draft_graph", arguments: { name: "x", description: "Does x.", steps: [{ id: "a", type: "worker", task: "Do the thing and return a list." }] } } }, broken);
      expect(response).toMatchObject({ id: 9, result: { isError: true } });
      expect(JSON.stringify(response)).toContain("draft_graph could not process this input");
      expect(errors).toEqual(["[skill-graph-mcp] draft_graph failed (TypeError)"]);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("compile_graph on a large graph", () => {
  function chain(steps: number): string {
    const nodes = ["    - {id: goal, type: input, label: GOAL}"];
    const edges: string[] = [];
    const prompts: string[] = [];
    for (let index = 0; index < steps; index++) {
      const from = index === 0 ? "goal" : `n${index - 1}`;
      nodes.push(`    - {id: n${index}, type: worker, label: N${index}, model: sonnet, tools: [Read]}`);
      edges.push(`    - {from: ${from}, to: n${index}}`);
      prompts.push(`## @node: n${index}\nDo step ${index} and return a list of findings.\n\n{{${from}}}`);
    }
    return `---\nname: big\ndescription: big\ntopology:\n  nodes:\n${nodes.join("\n")}\n  edges:\n${edges.join("\n")}\n---\n${prompts.join("\n\n")}\n`;
  }

  it("sends whole files up to the budget and names the rest with the download link", () => {
    const result = call("compile_graph", { source: chain(199) });
    const sentChars = result.blocks.slice(1).reduce((sum, block) => sum + block.text.length, 0);
    expect(sentChars).toBeLessThanOrEqual(MAX_COMPILE_RESULT_CHARS + 2_000);
    expect(result.blocks[1].text).toContain("File: .claude/skills/big/SKILL.md");
    expect(result.text).toMatch(/This answer holds the first \d+ files? in full; the other \d+ files \(.*\.claude\/agents\/big-n198\.md.*\) would not fit in one tool result/);
    // Every path is still listed, so nothing is silently missing.
    for (let index = 0; index < 199; index++) expect(result.text).toContain(`.claude/agents/big-n${index}.md`);
  });

  it("sends a normal kit whole", () => {
    const result = call("compile_graph", { source: chain(20) });
    expect(result.text).not.toContain("would not fit");
    // Intro, then SKILL.md, graph.skill.md, one subagent per step, the Cursor rule and the README.
    expect(result.blocks).toHaveLength(1 + 20 + 4);
  });
});
