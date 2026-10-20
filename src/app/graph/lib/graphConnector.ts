/**
 * The Skill Graph connector's tools: what Claude can do with the studio through MCP.
 *
 * Every tool is read-only and stateless. A graph comes in as `graph.skill.md` text, is checked or
 * compiled in memory, and goes back as text or as a studio link with the graph in the URL hash.
 * Nothing is stored or logged, so this module has no I/O; the route handler only moves JSON.
 */
import { DRAFT_INPUT_ID, DRAFT_STEP_TYPES, MAX_DRAFT_STEPS, draftGraph } from "./graphDraft";
import { buildCursorRule, buildExportKit, buildSingleFileSkill, toSlug } from "./graphExport";
import { buildPlan } from "./graphPlan";
import { graphFormatReference } from "./graphReference";
import { MAX_HASH_LENGTH, SHARE_URL_SOFT_LIMIT, encodeShareHash } from "./graphShare";
import { dryRunGraph } from "./graphSimulate";
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
  /** Absolute URL of the studio page, e.g. https://www.devscratchpad.tech/graph/studio. */
  studioUrl: string;
  /** Absolute URL of the kit download page, e.g. https://www.devscratchpad.tech/graph/download. */
  downloadUrl?: string;
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
    name: "draft_graph",
    title: "Draft a graph from an outline",
    description:
      "Writes a graph.skill.md from a plain outline of the workflow: a name, what it is for, and its steps, each with what it does and which steps it reads from. Fills in the format: the input node, edges, contracts, prompts that reference their inputs, read-only tools and model tiers. Returns the source, the checker's result and what it filled in. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short skill name, e.g. receipt-scanner.", maxLength: 64 },
        description: { type: "string", description: "What the skill does and when to use it, in a sentence.", maxLength: 600 },
        input_label: { type: "string", description: "What the user hands in, e.g. RECEIPT PHOTO OR TEXT. Defaults to REQUEST.", maxLength: 80 },
        steps: {
          type: "array",
          minItems: 1,
          maxItems: MAX_DRAFT_STEPS,
          description: `The steps. A step with no after reads the user's request (the input "${DRAFT_INPUT_ID}"); steps that read the same steps run in parallel.`,
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique id: a letter, then letters, digits, _ or -. E.g. extract_items.", maxLength: 64 },
              type: {
                type: "string",
                enum: [...DRAFT_STEP_TYPES],
                description:
                  "orchestrator splits work (feeding several steps, it hands each its own task), worker does one task, verifier checks work in a fresh context against a gate, synthesizer merges results, agent is a general step, code runs a shell command without a model, approval asks the user.",
              },
              task: { type: "string", description: "What the step does, as instructions to its agent. For code: the shell command. For approval: what to ask the user.", maxLength: 4000 },
              label: { type: "string", description: "Display name on the canvas. Defaults to the id.", maxLength: 80 },
              after: { type: "array", items: { type: "string" }, description: "Ids of the steps whose output this step reads. Empty or missing: it reads the request." },
              returns: { type: "string", description: "What the step hands back, e.g. 'a JSON object with merchant, date, total and items'. Becomes the contract on its outgoing edges.", maxLength: 600 },
              format: { type: "string", enum: ["json", "markdown", "text"], description: "Format of what it returns. Defaults to json when keys are given, else markdown." },
              keys: { type: "array", items: { type: "string" }, description: "JSON only: top-level keys a valid output must have; a command checks them on every run." },
              gate: { type: "string", description: "Verifiers: what must be true for the work to pass, e.g. 'every total equals the sum of its items'.", maxLength: 600 },
              on_fail: { type: "string", enum: ["retry", "stop"], description: "When the gate or command fails: re-run the work before it, or stop. Verifiers default to retry once." },
              tools: { type: "array", items: { type: "string" }, description: "Claude Code tools the step may use, e.g. Read, Grep, WebSearch, WebFetch, Edit, Bash. Defaults to Read, Grep, Glob." },
              model: { type: "string", description: "haiku, sonnet, opus or fable. Defaults: verifier opus, other model steps sonnet." },
              fresh_context: { type: "boolean", description: "Run in a fresh context that sees only its inputs. Defaults to true for verifiers." },
              risk: { type: "string", enum: ["contained", "wide", "irreversible"], description: "Blast radius. Irreversible steps need an approval step before them." },
            },
            required: ["id", "type", "task"],
            additionalProperties: false,
          },
        },
      },
      required: ["name", "description", "steps"],
      additionalProperties: false,
    },
    annotations: readOnly("Draft a graph from an outline"),
  },
  {
    name: "validate_graph",
    title: "Check a graph",
    description:
      "Checks a graph.skill.md with the Skill Graph checker. Returns the errors (which block compiling) and warnings, each with how to fix it, and the stage plan: which steps run in which order and which run in parallel. Besides the wiring, it flags weak prompts: a verifier without a gate, a vague gate, a prompt that never says what to return or never names its inputs, and keys a step reads that its source never returns. Nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY }, required: ["source"], additionalProperties: false },
    annotations: readOnly("Check a graph"),
  },
  {
    name: "dry_run_graph",
    title: "Dry-run a graph",
    description:
      "Walks a graph's plan with a sample request, without running a model: for each step, what it receives, what it must return, what checks it, where a failure sends the run, and any problem the checker finds at that step. Use it to test a graph before installing it. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        sample: { type: "string", description: "A sample request, as a user would give it, e.g. 'Scan this receipt: Coffee 3.50, Bagel 2.25, total 5.75'.", maxLength: 4000 },
      },
      required: ["source"],
      additionalProperties: false,
    },
    annotations: readOnly("Dry-run a graph"),
  },
  {
    name: "compile_graph",
    title: "Compile a graph into agent files",
    description:
      "Compiles a graph.skill.md that has no errors into the files an agent runs. claude_code_kit (default): the orchestrating SKILL.md, one Claude Code subagent per model step, the graph source, a Cursor rule and a README. single_skill: one self-orchestrating SKILL.md for agents without subagents. cursor_rule: a Cursor rule. Returns each file's path and content, and for the kit a link that downloads every file as one .zip; nothing is written or stored. Returns the checker's errors instead if the graph has any.",
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
      "Returns a link that opens a graph.skill.md in the Skill Graph studio (devscratchpad.tech/graph/studio), where the user sees it as a graph, walks through the plan, edits it and exports it. The graph is compressed into the part of the link after #, which browsers do not send to a server, so nothing is stored.",
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
    "Start from the closest starter graph if one fits, or draft one from an outline of the steps. Check it until it has no errors or warnings, and dry-run it with a realistic sample request. Then give me the studio link, explain the stages in a few lines, and tell me how to install the compiled files.",
  ].join("\n");
}

export const SERVER_INSTRUCTIONS =
  "Skill Graph designs multi-agent workflows as graph skills (graph.skill.md) and compiles them into Claude Code subagents or Cursor rules. A typical session: list_graph_templates and get_graph_template for a starting point, or draft_graph from an outline of the steps (get_graph_format documents the full format); validate_graph until it has no errors; dry_run_graph with a sample request; open_graph_in_studio so the user can review it; and compile_graph for the files to install. All tools are read-only and nothing is stored.";

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

/** A studio link with the graph compressed into the hash, or null when it is too large for one. */
function studioLink(source: string, context: ConnectorContext): string | null {
  const hash = encodeShareHash({ source });
  return hash.length > MAX_HASH_LENGTH ? null : `${context.studioUrl}${hash}`;
}

/** A link to the page that builds the kit's .zip in the browser from the graph after the #. */
function downloadLink(source: string, context: ConnectorContext): string | null {
  if (!context.downloadUrl) return null;
  const hash = encodeShareHash({ source });
  return hash.length > MAX_HASH_LENGTH ? null : `${context.downloadUrl}${hash}`;
}

/** The link as Markdown with a short label, so a chat shows a few words instead of thousands of characters. */
function markdownLink(url: string, graph: SkillGraph | null): string {
  const name = (graph?.name || "the graph").replace(/[[\]]/g, "");
  return `[Open ${name} in Skill Graph](${url})`;
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

function compileTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
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
  const url = studioLink(input.source, context);
  const zip = target === "claude_code_kit" ? downloadLink(input.source, context) : null;
  const intro = [
    `Compiled "${graph.name || slug}" into ${plural(files.length, "file")}. Save each one at its path, relative to the repository root:`,
    ...files.map((file) => `- ${file.path}`),
    "",
    target === "cursor_rule" ? "Cursor picks the rule up from .cursor/rules/." : `Then ask Claude Code to use the ${slug} skill, or invoke it by name.`,
    "",
    zip
      ? `To download every file as one .zip: [Download the ${(graph.name || slug).replace(/[[\]]/g, "")} kit](${zip}). The page lists what the kit can run before the download, and builds the .zip in the browser.${url ? ` To see or edit it first: ${markdownLink(url, graph)}.` : ""}`
      : url
        ? `To download every file at once: ${markdownLink(url, graph)}, then Export → Claude Code + Cursor kit (.zip). In the studio, Export also copies the single-file SKILL.md.`
        : "To download every file at once, save graph.skill.md, open it in the studio (devscratchpad.tech/graph/studio, Open file) and choose Export → Claude Code + Cursor kit (.zip).",
  ].join("\n");
  return { content: [{ type: "text", text: intro }, ...files.map((file) => ({ type: "text" as const, text: `File: ${file.path}\n\n${file.content}` }))] };
}

function openTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const url = studioLink(input.source, context);
  if (!url) {
    return text("This graph is too large to fit in a link. Use compile_graph for the files, or save the source as graph.skill.md and open it in the studio with Open file.", true);
  }
  const result = check(input.source);
  const status = !result.graph
    ? "The studio will show why the file cannot be read."
    : result.errors.length > 0
      ? `The graph still has ${plural(result.errors.length, "error")}; the studio lists them under Issues.`
      : "The graph is valid.";
  return text(
    [
      `Studio link: ${markdownLink(url, result.graph)}`,
      "",
      status,
      "Opening it shows the graph on a canvas with its plan. If that browser already has a graph, the studio keeps it under Recent graphs (the clock above the Markdown), so nothing is lost.",
      "To keep the graph without the link, save the source as graph.skill.md; the studio opens it with Open file.",
      ...(url.length > SHARE_URL_SOFT_LIMIT ? ["The link is long; some chat apps may cut it off, so open it directly in a browser."] : []),
    ].join("\n")
  );
}

function draftTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const draft = draftGraph(args);
  if ("error" in draft) return text(`${draft.error} draft_graph's input schema describes each field.`, true);
  const result = check(draft.source);
  if (!result.graph) return text(fatalMessage(result.fatal), true);
  const { lines, stages, subagents } = planLines(result.graph);
  const url = studioLink(draft.source, context);
  const counts = `${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}`;
  return text(
    [
      result.errors.length === 0
        ? `Drafted "${result.graph.name}": ${plural(stages, "stage")}, ${plural(subagents, "subagent")} (${counts}).`
        : `Drafted "${result.graph.name}", but it is not valid yet (${counts}). Fix the outline, or edit the source, and check again.`,
      ...(result.errors.length ? ["", "Errors:", ...issueLines(result.errors)] : []),
      ...(result.warnings.length ? ["", "Warnings:", ...issueLines(result.warnings)] : []),
      ...(draft.notes.length ? ["", "Filled in (check these):", ...draft.notes.map((note) => `- ${note}`)] : []),
      "",
      "Plan:",
      ...lines,
      ...(url ? ["", `Studio link: ${markdownLink(url, result.graph)}`] : []),
      "",
      "Source (graph.skill.md):",
      "",
      draft.source,
    ].join("\n")
  );
}

function dryRunTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const parsed = parseGraphSkill(input.source);
  if (!parsed.graph) return text(fatalMessage(parsed.fatal), true);
  const sample = typeof args.sample === "string" ? args.sample.slice(0, 4000) : "";
  return text(dryRunGraph(parsed.graph, sample).text);
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
    case "draft_graph":
      return draftTool(args, context);
    case "validate_graph":
      return validateTool(args);
    case "dry_run_graph":
      return dryRunTool(args);
    case "compile_graph":
      return compileTool(args, context);
    case "open_graph_in_studio":
      return openTool(args, context);
    default:
      return null;
  }
}
