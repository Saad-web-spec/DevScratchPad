/**
 * The Skill Graph connector's tools: what Claude can do with the studio through MCP.
 *
 * Every tool is read-only and stateless. A graph comes in as `graph.skill.md` text, is checked or
 * compiled in memory, and goes back as text or as a studio link with the graph in the URL hash.
 * Nothing is stored or logged, so this module has no I/O; the route handler only moves JSON.
 */
import { buildCursorRule, buildExportKit, buildSingleFileSkill, toSlug } from "./graphExport";
import { buildPlan } from "./graphPlan";
import { graphFormatReference } from "./graphReference";
import { MAX_HASH_LENGTH, SHARE_URL_SOFT_LIMIT, encodeShareHash } from "./graphShare";
import { MAX_SOURCE_LENGTH, findOrphanSections, parseGraphSkill, runsWithoutSubagent, validateGraph, type GraphIssue, type SkillGraph } from "./graphSkill";
import { BLUEPRINTS } from "./graphTemplates";

export interface ToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface ConnectorTool {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
  annotations: ToolAnnotations;
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export interface ConnectorContext {
  /** Absolute URL of the studio page, e.g. https://www.devscratchpad.tech/graph. */
  studioUrl: string;
}

/** None of the tools change anything anywhere, so every one is annotated the same way. */
function readOnly(title: string): ToolAnnotations {
  return { title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
}

const SOURCE_PROPERTY = {
  type: "string",
  description: "The full graph.skill.md text: YAML frontmatter with topology and contracts, then one ## @node: <id> section per step.",
  maxLength: MAX_SOURCE_LENGTH,
};

export const COMPILE_TARGETS = ["claude_code_kit", "single_skill", "cursor_rule"] as const;
type CompileTarget = (typeof COMPILE_TARGETS)[number];

export const CONNECTOR_TOOLS: readonly ConnectorTool[] = [
  {
    name: "get_graph_format",
    title: "Get the graph skill format",
    description:
      "Returns the Skill Graph file format (graph.skill.md): node types, node fields, edges and contracts, prompt references, the rules the checker enforces, design guidance and a complete example. Use it before writing or editing a graph skill.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: readOnly("Get the graph skill format"),
  },
  {
    name: "list_graph_templates",
    title: "List starter graphs",
    description: "Lists the starter graphs (blueprints) in Skill Graph, each with an id, a title and a one-line summary. Use it to find a starting point close to the workflow the user wants.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: readOnly("List starter graphs"),
  },
  {
    name: "get_graph_template",
    title: "Get a starter graph",
    description: "Returns the full graph.skill.md source of one starter graph, by the id that list_graph_templates gives.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "The starter graph's id, e.g. ship-a-change.", enum: BLUEPRINTS.map((blueprint) => blueprint.id) } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: readOnly("Get a starter graph"),
  },
  {
    name: "validate_graph",
    title: "Check a graph",
    description:
      "Checks a graph.skill.md with the Skill Graph checker. Returns the errors (which block compiling) and warnings, each with how to fix it, and the stage plan: which steps run in which order and which run in parallel. Nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY }, required: ["source"], additionalProperties: false },
    annotations: readOnly("Check a graph"),
  },
  {
    name: "compile_graph",
    title: "Compile a graph into agent files",
    description:
      "Compiles a graph.skill.md that has no errors into the files an agent runs. claude_code_kit (default): the orchestrating SKILL.md, one Claude Code subagent per model step, the graph source, a Cursor rule and a README. single_skill: one self-orchestrating SKILL.md for agents without subagents. cursor_rule: a Cursor rule. Returns each file's path and content; nothing is written or stored. Returns the checker's errors instead if the graph has any.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        target: { type: "string", enum: [...COMPILE_TARGETS], description: "What to produce. Defaults to claude_code_kit.", default: "claude_code_kit" },
      },
      required: ["source"],
      additionalProperties: false,
    },
    annotations: readOnly("Compile a graph into agent files"),
  },
  {
    name: "open_graph_in_studio",
    title: "Get a studio link for a graph",
    description:
      "Returns a link that opens a graph.skill.md in the Skill Graph studio (devscratchpad.tech/graph), where the user sees it as a graph, walks through the plan, edits it and exports it. The graph is compressed into the part of the link after #, which browsers do not send to a server, so nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY }, required: ["source"], additionalProperties: false },
    annotations: readOnly("Get a studio link for a graph"),
  },
];

/** A prompt the user can pick in Claude to start a workflow from their project. */
export const CONNECTOR_PROMPTS = [
  {
    name: "design_workflow",
    title: "Design a workflow for my project",
    description: "Plan a multi-agent workflow for a project or task, check it, and open it in the Skill Graph studio.",
    arguments: [{ name: "project", description: "What the project or task is, in a sentence or two.", required: true }],
  },
] as const;

export function promptMessage(name: string, args: Record<string, unknown>): string | null {
  if (name !== "design_workflow") return null;
  const project = typeof args.project === "string" && args.project.trim() ? args.project.trim() : "(describe the project here)";
  return [
    "Design a multi-agent workflow for this project with Skill Graph:",
    "",
    project,
    "",
    "Read the graph format, start from the closest starter graph if one fits, and check the graph until it has no errors. Then give me the studio link, explain the stages in a few lines, and tell me how to install the compiled files.",
  ].join("\n");
}

export const SERVER_INSTRUCTIONS =
  "Skill Graph designs multi-agent workflows as graph skills (graph.skill.md) and compiles them into Claude Code subagents or Cursor rules. A typical session: get_graph_format, then list_graph_templates and get_graph_template for a starting point, write the graph, validate_graph until it has no errors, open_graph_in_studio so the user can review it, and compile_graph for the files to install. All tools are read-only and nothing is stored.";

/* ------------------------------------------------------------------ helpers */

function text(value: string, isError = false): ToolResult {
  return isError ? { content: [{ type: "text", text: value }], isError: true } : { content: [{ type: "text", text: value }] };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Reads the `source` argument, or explains what is wrong with it. */
function readSource(args: Record<string, unknown>): { source: string } | { error: string } {
  const source = args.source;
  if (typeof source !== "string" || source.trim() === "") return { error: "source is required: pass the full graph.skill.md text. get_graph_format describes it." };
  if (source.length > MAX_SOURCE_LENGTH) return { error: `source is too large (${source.length.toLocaleString("en-US")} characters; the limit is ${MAX_SOURCE_LENGTH.toLocaleString("en-US")}).` };
  return { source };
}

interface Checked {
  graph: SkillGraph | null;
  fatal: string | null;
  errors: GraphIssue[];
  warnings: GraphIssue[];
}

/** The same checks the studio runs: the validator plus prompt sections that match no node. */
function check(source: string): Checked {
  const parsed = parseGraphSkill(source);
  if (!parsed.graph) return { graph: null, fatal: parsed.fatal, errors: [], warnings: [] };
  const orphans = findOrphanSections(source, parsed.graph).map(
    (id): GraphIssue => ({ severity: "warning", code: "orphan-section", message: `"## @node: ${id}" matches no node, so its prompt is ignored. Fix the id, or add a node "${id}".` })
  );
  const issues = [...validateGraph(parsed.graph), ...orphans];
  return { graph: parsed.graph, fatal: null, errors: issues.filter((issue) => issue.severity === "error"), warnings: issues.filter((issue) => issue.severity === "warning") };
}

function issueLines(issues: GraphIssue[]): string[] {
  return issues.map((issue) => `- [${issue.code}]${issue.nodeId ? ` step ${issue.nodeId}:` : ""} ${issue.message}`);
}

function planLines(graph: SkillGraph): { lines: string[]; stages: number; subagents: number } {
  const plan = buildPlan(graph);
  const subagents = plan.reduce((sum, stage) => sum + stage.nodes.filter((node) => !runsWithoutSubagent(node.type)).length, 0);
  const lines = plan.map((stage) => {
    const steps = stage.nodes.map((node) => `${node.id} (${[node.type, node.model].filter(Boolean).join(", ")})`).join(", ");
    return `${stage.number}. ${steps}${stage.nodes.length > 1 ? " — in parallel" : ""}`;
  });
  return { lines, stages: plan.length, subagents };
}

function fatalMessage(fatal: string | null): string {
  return `The file could not be read: ${fatal ?? "unknown problem"}. It must start with --- and valid YAML frontmatter, and close it with another ---.`;
}

/* ------------------------------------------------------------------ tools */

function validateTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const result = check(input.source);
  if (!result.graph) return text(fatalMessage(result.fatal));

  const { lines, stages, subagents } = planLines(result.graph);
  const counts = `${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}`;
  const summary =
    result.errors.length === 0
      ? `Valid: ${plural(stages, "stage")}, ${plural(subagents, "subagent")} (${counts}). It can be compiled.`
      : `Not valid yet (${counts}). Errors block compiling; fix them and check again.`;
  return text(
    [
      summary,
      ...(result.errors.length ? ["", "Errors:", ...issueLines(result.errors)] : []),
      ...(result.warnings.length ? ["", "Warnings:", ...issueLines(result.warnings)] : []),
      "",
      "Plan (stages run in order; steps in one stage run at the same time):",
      ...(lines.length ? lines : ["(no steps after the input yet)"]),
    ].join("\n")
  );
}

function compileTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const target = args.target ?? "claude_code_kit";
  if (typeof target !== "string" || !(COMPILE_TARGETS as readonly string[]).includes(target)) {
    return text(`target must be one of ${COMPILE_TARGETS.join(", ")}.`, true);
  }
  const result = check(input.source);
  if (!result.graph) return text(fatalMessage(result.fatal), true);
  if (result.errors.length > 0) {
    return text([`The graph has ${plural(result.errors.length, "error")}, so it cannot be compiled yet:`, ...issueLines(result.errors)].join("\n"), true);
  }

  const graph = result.graph;
  const slug = toSlug(graph.name);
  const files =
    (target as CompileTarget) === "single_skill"
      ? [{ path: `.claude/skills/${slug}/SKILL.md`, content: buildSingleFileSkill(graph) }]
      : (target as CompileTarget) === "cursor_rule"
        ? [{ path: `.cursor/rules/${slug}.mdc`, content: buildCursorRule(graph) }]
        : buildExportKit(graph);
  const intro = [
    `Compiled "${graph.name || slug}" into ${plural(files.length, "file")}. Save each one at its path, relative to the repository root:`,
    ...files.map((file) => `- ${file.path}`),
    "",
    target === "cursor_rule" ? "Cursor picks the rule up from .cursor/rules/." : `Then ask Claude Code to use the ${slug} skill, or invoke it by name.`,
  ].join("\n");
  return { content: [{ type: "text", text: intro }, ...files.map((file) => ({ type: "text" as const, text: `File: ${file.path}\n\n${file.content}` }))] };
}

function openTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const hash = encodeShareHash({ source: input.source });
  if (hash.length > MAX_HASH_LENGTH) {
    return text("This graph is too large to fit in a link. Use compile_graph for the files, or save the source as graph.skill.md and open it in the studio with Open file.", true);
  }
  const url = `${context.studioUrl}${hash}`;
  const result = check(input.source);
  const status = !result.graph
    ? "The studio will show why the file cannot be read."
    : result.errors.length > 0
      ? `The graph still has ${plural(result.errors.length, "error")}; the studio lists them under Issues.`
      : "The graph is valid.";
  return text(
    [
      `Studio link: ${url}`,
      "",
      status,
      "Opening it shows the graph on a canvas with its plan, and replaces the graph saved in that browser (Ctrl+Z on the canvas brings the old one back).",
      ...(url.length > SHARE_URL_SOFT_LIMIT ? ["The link is long; some chat apps may cut it off, so open it directly in a browser."] : []),
    ].join("\n")
  );
}

/** Runs a tool. Returns null for a tool that does not exist, so the caller can answer with a protocol error. */
export function callConnectorTool(name: string, rawArgs: unknown, context: ConnectorContext): ToolResult | null {
  const args = typeof rawArgs === "object" && rawArgs !== null && !Array.isArray(rawArgs) ? (rawArgs as Record<string, unknown>) : {};
  switch (name) {
    case "get_graph_format":
      return text(graphFormatReference());
    case "list_graph_templates":
      return text(
        [
          "Starter graphs (pass the id to get_graph_template):",
          ...BLUEPRINTS.map((blueprint) => {
            const steps = parseGraphSkill(blueprint.source).graph?.nodes.length ?? 0;
            return `- ${blueprint.id}: ${blueprint.title}, ${plural(steps, "step")}. ${blueprint.hint}.`;
          }),
        ].join("\n")
      );
    case "get_graph_template": {
      const blueprint = BLUEPRINTS.find((item) => item.id === args.id);
      if (!blueprint) return text(`Unknown starter graph id. Use one of: ${BLUEPRINTS.map((item) => item.id).join(", ")}.`, true);
      return text(`${blueprint.title}: ${blueprint.hint}.\n\n${blueprint.source}`);
    }
    case "validate_graph":
      return validateTool(args);
    case "compile_graph":
      return compileTool(args);
    case "open_graph_in_studio":
      return openTool(args, context);
    default:
      return null;
  }
}
