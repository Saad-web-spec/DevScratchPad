/**
 * Graph SKILL.md (`spec: skill-graph/1`): the single source of truth for the /graph studio.
 *
 * A Graph SKILL.md is a normal Markdown skill file whose frontmatter also describes how the work is
 * split: a `topology` (nodes + edges), named `contracts` for what travels along each edge, and per-node
 * agent settings (fresh context, tools, model tier, verification gates). The body holds one
 * `## @node: <id>` section per node with that node's prompt.
 *
 * Agents do not run this file directly: the studio compiles it into an orchestrating skill plus one
 * subagent per node (see graphExport.ts). This module parses, validates, serializes and lays it out.
 * It is pure (no DOM, no network).
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

/**
 * `code` runs a shell command instead of a model (merge, dedupe, diff, tests): deterministic work
 * should not cost tokens or vary between runs. `approval` is a human checkpoint: the agent stops and
 * asks the user before anything after it runs.
 */
export type NodeType = "input" | "orchestrator" | "worker" | "verifier" | "synthesizer" | "agent" | "code" | "approval";

export const NODE_TYPES: readonly NodeType[] = ["input", "orchestrator", "worker", "verifier", "synthesizer", "agent", "code", "approval"];

/** Node types the agent carries out itself, without a subagent (and without a model prompt). */
export function runsWithoutSubagent(type: NodeType): boolean {
  return type === "input" || type === "code" || type === "approval";
}

/** Format version written into every file so agents and tools can recognise a graph skill. */
export const SPEC_VERSION = "skill-graph/1";
/** Written instead of `/1` when a graph uses a field that changes what an output is (`handoff`, `foreach`). */
export const SPEC_VERSION_2 = "skill-graph/2";
export const KNOWN_SPEC_VERSIONS: readonly string[] = [SPEC_VERSION, SPEC_VERSION_2];

/** How a step's output reaches the steps after it: pasted into their task, or saved to a file whose path they get. */
export type HandoffMode = "inline" | "file";

/** Runs of a `foreach` step that may run at once when `max_parallel` is unset, and the most it may be set to. */
export const DEFAULT_MAX_PARALLEL = 4;
export const MAX_PARALLEL_CAP = 16;

/** Probing runs 2 to 4 candidates of a step; each one costs a full run of it. */
export const PROBE_MIN = 2;
export const PROBE_MAX = 4;
/** An approach hint is one line written into the candidate's task. */
export const MAX_PROBE_HINT_LENGTH = 200;

export type GateFailure = "retry" | "stop";

/**
 * Blast radius of a step, which decides how it is gated (not how confident the model is):
 * `contained` is reversible and local, `wide` is reversible but touches a lot (needs a command check),
 * `irreversible` is hard to undo (migrations, deletions, publishing, money) and needs a human approval first.
 */
export type RiskLane = "contained" | "wide" | "irreversible";

export const RISK_LANES: readonly RiskLane[] = ["contained", "wide", "irreversible"];

/** Retries a gate or check gets when `max_retries` is unset. */
export const DEFAULT_MAX_RETRIES = 1;
/** Past about three attempts the plan, not the work, is usually what is wrong. */
export const RETRY_CAP = 3;

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  /** When true the node must only ever see the payloads on its incoming edges (no shared history). */
  isolatedContext: boolean;
  /** Model tier for the agent that runs the node (`haiku`, `sonnet`, `opus`, `fable`, or a model id); unset inherits. */
  model?: string;
  /** Tools the node's agent may use (least privilege). Unset means the agent's defaults. */
  tools?: string[];
  /** Force JSON output for this node. Inferred from the outgoing edges' contracts when unset. */
  outputFormat?: "json" | "text";
  /** Pass criteria a verifier checks. The node must end its answer with `GATE: PASS` or `GATE: FAIL`. */
  gate?: string;
  /** What the orchestrator does when the gate fails: re-run the upstream nodes, or stop and report. */
  onFail?: GateFailure;
  /** How many times a failed gate or check may re-run the work (default 1). */
  maxRetries?: number;
  /** Where a failed gate, check or code step restarts: an upstream model step (unset: the direct predecessors). */
  retryTarget?: string;
  /** `code` nodes: the shell command to run. `{{refs}}` in it become paths of files holding those outputs. */
  run?: string;
  /** A command that must exit 0 once the node is done, so a program (not only a model) decides it passed. */
  check?: string;
  /** Blast radius of the node's work. Unset means contained. */
  risk?: RiskLane;
  /** How this node's output is handed on; unset follows the graph's `handoff`. */
  handoff?: HandoffMode;
  /** Fan-out: run once per item of a JSON array, `<node>` (its output is the array) or `<node>.<key>`. */
  foreach?: string;
  /** Fan-out runs that may run at once (default 4, at most 16). */
  maxParallel?: number;
  /** Fan-out: stop and report instead of starting more runs than this. */
  maxItems?: number;
  /** Probing: run this many candidates of the step side by side, and keep the best (2 to 4). */
  probe?: number;
  /** One approach hint per candidate, in order; candidates without one use their own approach. */
  probeHints?: string[];
  /** The node's prompt template (the body of its `## @node:` section). */
  prompt: string;
}

export type ContractFormat = "json" | "markdown" | "text";

/** What a payload on an edge must look like, so the agent can check every handoff. */
export interface Contract {
  format: ContractFormat;
  description: string;
  /** JSON contracts: top-level keys a payload must have, checked by a generated `node -e` command. */
  required?: string[];
  /** A command that must exit 0 on the payload; `{{payload}}` becomes the path of the file holding it. */
  check?: string;
}

/** Key names a `required` list may hold; they are written into a shell command, so nothing else gets through. */
export const CONTRACT_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

/** The experience file: lessons from earlier runs, fed to each step and updated by a reflect step after the run. */
export interface ExperienceSettings {
  maxLessons: number;
}

export const DEFAULT_MAX_LESSONS = 20;
export const MAX_LESSONS_CAP = 50;

/** Node ids the experience file needs for itself: `experience.md` and `EXPERIENCE.md` are one file on Windows and macOS, and `reflect` is its step. */
export const EXPERIENCE_RESERVED_IDS: readonly string[] = ["experience", "reflect"];

export const CONTRACT_FORMATS: readonly ContractFormat[] = ["json", "markdown", "text"];

/** Claude Code tool names offered in the editor; MCP tools (`mcp__server__tool`) are also accepted. */
export const KNOWN_TOOLS: readonly string[] = ["Read", "Grep", "Glob", "Edit", "Write", "Bash", "WebSearch", "WebFetch"];

/** Every tool name the validator accepts: the editor's list plus Claude Code tools it does not offer as chips. */
const VALID_TOOL_NAMES: readonly string[] = [...KNOWN_TOOLS, "MultiEdit", "NotebookEdit", "TodoWrite", "LS", "Task", "Agent", "Skill"];

/** The tool a permission entry grants: `Bash(git diff:*)` is the Bash tool, scoped to one command. */
export function baseToolName(tool: string): string {
  const paren = tool.indexOf("(");
  return paren === -1 ? tool : tool.slice(0, paren);
}

/** Claude Code subagent model aliases; unset (`inherit`) runs the step on the parent session's model. */
export const MODEL_TIERS: readonly string[] = ["haiku", "sonnet", "opus", "fable"];

export interface GraphEdge {
  from: string;
  to: string;
  /** Name of the contract the payload on this edge follows (e.g. `findings_array`). */
  contract?: string;
}

export interface SkillGraph {
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Named payload contracts referenced by edges. */
  contracts: Record<string, Contract>;
  /** Set when the skill learns from its runs (`experience:` in the frontmatter). */
  experience?: ExperienceSettings;
  /** Default handoff for every step's output (unset: inline). */
  handoff?: HandoffMode;
  /** The `spec:` value as read, so an unknown version can be reported. Saving writes the version the graph needs. */
  specVersion?: string;
  /** Where the user placed each card on the canvas (`layout.positions`); unset means the automatic layout. */
  positions?: Record<string, NodeLayout>;
  /** Markdown between the frontmatter and the first `## @node:` section. */
  preamble: string;
  /** Frontmatter keys other than name/description/topology, kept so a round trip loses nothing. */
  extraFrontmatter: Record<string, unknown>;
}

export type IssueSeverity = "error" | "warning";

export interface GraphIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  nodeId?: string;
}

export interface ParseResult {
  /** Null only when the file cannot be read at all (no frontmatter or invalid YAML). */
  graph: SkillGraph | null;
  /** Fatal problem that prevented a graph from being built. */
  fatal: string | null;
}

const NODE_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
/**
 * `model` and `tools` are written verbatim into subagent frontmatter, so they are held to a strict
 * shape: a value with a line break could inject extra keys (permissionMode, hooks, mcpServers).
 * Tools may carry a one-line permission pattern, e.g. `Bash(git diff:*)`, without commas: the field
 * is a comma-separated list, so `Read(x), Bash(*)` would smuggle in a second tool. The exporter also
 * quotes any value that is not plain YAML (`[x]`, `a: b`, `x #y`).
 */
export const MODEL_PATTERN = /^[A-Za-z0-9._:[\]-]+$/;
export const TOOL_PATTERN = /^[A-Za-z0-9_-]+(\([^\x00-\x1f,]*\))?$/;

/**
 * Size limits. Real skills sit far below them; they stop a hostile file or share link (YAML aliases
 * can turn a few bytes into a node-by-node edge matrix) from freezing the page.
 */
export const MAX_SOURCE_LENGTH = 500_000;
export const MAX_NODES = 200;
export const MAX_EDGES = 2_000;
const NODE_SECTION_PATTERN = /^##[ \t]+@node:[ \t]*([^\s]+)[ \t]*$/;
const FRONTMATTER_PATTERN = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function isValidNodeId(id: string): boolean {
  return NODE_ID_PATTERN.test(id);
}

/** Lowercase, hyphenated slug (Claude Code skill and agent names allow only letters, digits and hyphens). */
export function toSlug(value: string, fallback = "skill-graph"): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? fallback : slug.slice(0, 64);
}

const DEFAULT_PREAMBLE = "# Node Prompts & Edge Contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringList(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function asNodeType(value: unknown): NodeType {
  return typeof value === "string" && (NODE_TYPES as readonly string[]).includes(value) ? (value as NodeType) : "agent";
}

/** Splits the body into the preamble and the prompt of each `## @node:` section. Fenced code is skipped. */
function splitSections(body: string): { preamble: string; sections: Map<string, string> } {
  const lines = body.split(/\r?\n/);
  const sections = new Map<string, string>();
  const preambleLines: string[] = [];
  let currentId: string | null = null;
  let buffer: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    if (currentId !== null) sections.set(currentId, buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of lines) {
    const fenceMatch = /^[ \t]*(```+|~~~+)/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
    }
    const sectionMatch = fence === null ? NODE_SECTION_PATTERN.exec(line) : null;
    if (sectionMatch) {
      flush();
      currentId = sectionMatch[1];
      continue;
    }
    if (currentId === null) preambleLines.push(line);
    else buffer.push(line);
  }
  flush();
  return { preamble: preambleLines.join("\n").trim(), sections };
}

/**
 * `experience:` alone, `experience: true` or a mapping turns learning on; `false` or a missing key
 * leaves it off. `max_lessons` is clamped to 1..MAX_LESSONS_CAP.
 */
function parseExperience(raw: unknown): ExperienceSettings | undefined {
  if (raw === undefined || raw === false) return undefined;
  const entry = isRecord(raw) ? raw : {};
  const max = typeof entry.max_lessons === "number" && Number.isFinite(entry.max_lessons) ? Math.round(entry.max_lessons) : DEFAULT_MAX_LESSONS;
  return { maxLessons: Math.max(1, Math.min(MAX_LESSONS_CAP, max)) };
}

/** Canvas coordinates are kept within this range, so a hand-edited or hostile file cannot push a card off to infinity. */
const MAX_COORDINATE = 100_000;

/** `layout: { positions: { plan: "300, 40" } }`; a `[300, 40]` pair is read too. Anything malformed is skipped. */
function parsePositions(raw: unknown): Record<string, NodeLayout> | undefined {
  if (!isRecord(raw) || !isRecord(raw.positions)) return undefined;
  const positions: Record<string, NodeLayout> = {};
  for (const [id, value] of Object.entries(raw.positions)) {
    if (!NODE_ID_PATTERN.test(id)) continue;
    const pair = typeof value === "string" ? value.split(",").map((part) => Number(part.trim())) : Array.isArray(value) ? value.map(Number) : [];
    if (pair.length !== 2 || !pair.every((n) => Number.isFinite(n) && Math.abs(n) <= MAX_COORDINATE)) continue;
    positions[id] = { x: Math.round(pair[0]), y: Math.round(pair[1]) };
  }
  return Object.keys(positions).length > 0 ? positions : undefined;
}

function asHandoff(value: unknown): HandoffMode | undefined {
  return value === "file" || value === "inline" ? value : undefined;
}

/** A whole number of at least 1, clamped to `cap` when one is given; anything else is unset. */
function asCount(value: unknown, cap?: number): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return undefined;
  return cap === undefined ? value : Math.min(cap, value);
}

/** 2 to 4 candidates; `probe: 1`, `false` or anything else means no probing. */
function asProbe(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < PROBE_MIN) return undefined;
  return Math.min(PROBE_MAX, value);
}

/** Hints are single lines (they are written into a task), trimmed and capped. */
function asProbeHints(value: unknown): string[] | undefined {
  const hints = asStringList(value)
    .map((hint) => hint.replace(/\s+/g, " ").trim().slice(0, MAX_PROBE_HINT_LENGTH))
    .filter(Boolean);
  return hints.length > 0 ? hints : undefined;
}

/** Parses a Graph SKILL.md. Structural problems are reported by `validateGraph`, not thrown. */
export function parseGraphSkill(source: string): ParseResult {
  if (source.length > MAX_SOURCE_LENGTH) return { graph: null, fatal: `The file is too large (over ${MAX_SOURCE_LENGTH.toLocaleString("en-US")} characters).` };
  const match = FRONTMATTER_PATTERN.exec(source);
  if (!match) return { graph: null, fatal: "Missing YAML frontmatter. Start the file with --- and a topology block." };

  let data: unknown;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : "invalid YAML";
    return { graph: null, fatal: `Frontmatter is not valid YAML: ${reason}` };
  }
  if (!isRecord(data)) return { graph: null, fatal: "Frontmatter must be a YAML mapping." };

  const { name, description, topology, contracts: rawContracts, experience: rawExperience, handoff: rawHandoff, layout: rawLayout, spec, ...extraFrontmatter } = data;
  const topologyRecord = isRecord(topology) ? topology : {};
  const { preamble, sections } = splitSections(source.slice(match[0].length));

  const nodes: GraphNode[] = [];
  const rawNodes = Array.isArray(topologyRecord.nodes) ? topologyRecord.nodes : [];
  if (rawNodes.length > MAX_NODES) return { graph: null, fatal: `The graph has more than ${MAX_NODES} nodes.` };
  for (const raw of rawNodes) {
    if (!isRecord(raw) || typeof raw.id !== "string") continue;
    const id = raw.id;
    const outputFormat = raw.output_format === "json" || raw.output_format === "text" ? raw.output_format : undefined;
    const tools = asStringList(raw.tools).map((tool) => tool.trim()).filter(Boolean);
    nodes.push({
      id,
      type: asNodeType(raw.type),
      label: typeof raw.label === "string" && raw.label.trim() ? raw.label : id,
      isolatedContext: raw.isolated_context === true,
      model: typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : undefined,
      tools: Array.isArray(raw.tools) || typeof raw.tools === "string" ? tools : undefined,
      outputFormat,
      gate: typeof raw.gate === "string" && raw.gate.trim() ? raw.gate.trim() : undefined,
      onFail: raw.on_fail === "retry" || raw.on_fail === "stop" ? raw.on_fail : undefined,
      maxRetries: typeof raw.max_retries === "number" && Number.isInteger(raw.max_retries) && raw.max_retries >= 0 ? raw.max_retries : undefined,
      retryTarget: typeof raw.retry_target === "string" && raw.retry_target.trim() ? raw.retry_target.trim() : undefined,
      run: typeof raw.run === "string" && raw.run.trim() ? raw.run.trim() : undefined,
      check: typeof raw.check === "string" && raw.check.trim() ? raw.check.trim() : undefined,
      risk: typeof raw.risk === "string" && (RISK_LANES as readonly string[]).includes(raw.risk) ? (raw.risk as RiskLane) : undefined,
      handoff: asHandoff(raw.handoff),
      foreach: typeof raw.foreach === "string" && raw.foreach.trim() ? raw.foreach.trim() : undefined,
      maxParallel: asCount(raw.max_parallel, MAX_PARALLEL_CAP),
      maxItems: asCount(raw.max_items),
      probe: asProbe(raw.probe),
      probeHints: asProbeHints(raw.probe_hints),
      prompt: sections.get(id) ?? "",
    });
  }

  const edges: GraphEdge[] = [];
  const rawEdges = Array.isArray(topologyRecord.edges) ? topologyRecord.edges : [];
  for (const raw of rawEdges) {
    if (!isRecord(raw)) continue;
    const contract = typeof raw.contract === "string" && raw.contract.trim() ? raw.contract.trim() : undefined;
    const froms = asStringList(raw.from);
    const tos = asStringList(raw.to);
    if (edges.length + froms.length * tos.length > MAX_EDGES) return { graph: null, fatal: `The graph has more than ${MAX_EDGES} edges.` };
    for (const from of froms) {
      for (const to of tos) edges.push({ from, to, contract });
    }
  }

  const contracts: Record<string, Contract> = {};
  if (isRecord(rawContracts)) {
    for (const [contractName, raw] of Object.entries(rawContracts)) {
      if (!isUsableContractName(contractName)) continue;
      const entry = isRecord(raw) ? raw : {};
      const format = typeof entry.format === "string" && (CONTRACT_FORMATS as readonly string[]).includes(entry.format) ? (entry.format as ContractFormat) : "markdown";
      const contract: Contract = { format, description: typeof entry.description === "string" ? entry.description.trim() : typeof raw === "string" ? raw.trim() : "" };
      // Kept even when malformed, so the validator can say what is wrong instead of the key vanishing.
      const required = [...new Set(asStringList(entry.required).map((key) => key.trim()).filter(Boolean))];
      if (required.length > 0) contract.required = required;
      if (typeof entry.check === "string" && entry.check.trim()) contract.check = entry.check.trim();
      contracts[contractName] = contract;
    }
  }

  return {
    graph: {
      name: typeof name === "string" ? name : "",
      description: typeof description === "string" ? description : "",
      nodes,
      edges,
      contracts,
      experience: parseExperience(rawExperience),
      handoff: asHandoff(rawHandoff),
      specVersion: typeof spec === "string" ? spec.trim() : spec === undefined ? undefined : String(spec),
      positions: parsePositions(rawLayout),
      preamble,
      extraFrontmatter,
    },
    fatal: null,
  };
}

/** Collapses pairwise edges into the compact `from: [..] / to: [..]` form used by the spec. */
function groupEdges(edges: GraphEdge[]): { from: string | string[]; to: string | string[]; contract?: string }[] {
  const byFrom = new Map<string, { from: string; tos: string[]; contract?: string }>();
  for (const edge of edges) {
    const key = `${edge.from}\u0000${edge.contract ?? ""}`;
    const group = byFrom.get(key);
    // A repeated edge carries nothing new; writing it twice would read back as `to: [b, b]`.
    if (group) {
      if (!group.tos.includes(edge.to)) group.tos.push(edge.to);
    } else byFrom.set(key, { from: edge.from, tos: [edge.to], contract: edge.contract });
  }

  // Sources merge only when their targets match in order, so reading the file back keeps every edge's order.
  const merged = new Map<string, { froms: string[]; tos: string[]; contract?: string }>();
  for (const group of byFrom.values()) {
    const key = `${group.tos.join("\u0001")}\u0000${group.contract ?? ""}`;
    const existing = merged.get(key);
    if (existing) existing.froms.push(group.from);
    else merged.set(key, { froms: [group.from], tos: group.tos, contract: group.contract });
  }

  return [...merged.values()].map((group) => {
    const entry: { from: string | string[]; to: string | string[]; contract?: string } = {
      from: group.froms.length === 1 ? group.froms[0] : group.froms,
      to: group.tos.length === 1 ? group.tos[0] : group.tos,
    };
    if (group.contract) entry.contract = group.contract;
    return entry;
  });
}

/** `skill-graph/2` once a field that changes what an output is appears, so graphs that use none keep diffing cleanly as `/1`. */
export function specVersionFor(graph: SkillGraph): string {
  const usesV2 = graph.handoff !== undefined || graph.nodes.some((node) => node.handoff !== undefined || node.foreach !== undefined);
  return usesV2 ? SPEC_VERSION_2 : SPEC_VERSION;
}

/** How a node's output reaches its consumers. The goal and an approval's answer are always passed inline. */
export function handoffOf(graph: SkillGraph, node: GraphNode): HandoffMode {
  if (node.type === "input" || node.type === "approval") return "inline";
  return node.handoff ?? graph.handoff ?? "inline";
}

export interface ForeachSource {
  /** Id of the step whose JSON holds the list. */
  node: string;
  /** Top-level key of that JSON holding the array; empty when the whole output is the array. */
  key: string;
}

/** Where a fan-out step's list comes from, or null when it is not a fan-out step. */
export function foreachSource(node: GraphNode): ForeachSource | null {
  if (!node.foreach) return null;
  const dot = node.foreach.indexOf(".");
  return dot === -1 ? { node: node.foreach, key: "" } : { node: node.foreach.slice(0, dot), key: node.foreach.slice(dot + 1) };
}

/** `files` from PLAN's JSON, or the JSON array PLAN returns, in the words of the plan. */
export function foreachListName(source: ForeachSource): string {
  return source.key ? `\`${source.key}\`` : "the JSON array";
}

/** Serializes the graph back to a Graph SKILL.md (frontmatter topology + one section per node). */
export function serializeGraphSkill(graph: SkillGraph): string {
  const frontmatter: Record<string, unknown> = {
    name: graph.name,
    description: graph.description,
    spec: specVersionFor(graph),
    ...(graph.handoff ? { handoff: graph.handoff } : {}),
    ...(graph.experience ? { experience: { max_lessons: graph.experience.maxLessons } } : {}),
    ...graph.extraFrontmatter,
    topology: {
      nodes: graph.nodes.map((node) => {
        const entry: Record<string, unknown> = { id: node.id, type: node.type, label: node.label };
        if (node.isolatedContext) entry.isolated_context = true;
        if (node.model) entry.model = node.model;
        if (node.tools) entry.tools = node.tools;
        if (node.outputFormat) entry.output_format = node.outputFormat;
        if (node.gate) entry.gate = node.gate;
        if (node.onFail) entry.on_fail = node.onFail;
        if (node.maxRetries !== undefined) entry.max_retries = node.maxRetries;
        if (node.retryTarget) entry.retry_target = node.retryTarget;
        if (node.run) entry.run = node.run;
        if (node.check) entry.check = node.check;
        if (node.risk) entry.risk = node.risk;
        if (node.handoff) entry.handoff = node.handoff;
        if (node.foreach) entry.foreach = node.foreach;
        if (node.maxParallel !== undefined) entry.max_parallel = node.maxParallel;
        if (node.maxItems !== undefined) entry.max_items = node.maxItems;
        if (node.probe !== undefined) entry.probe = node.probe;
        if (node.probeHints && node.probeHints.length > 0) entry.probe_hints = node.probeHints;
        return entry;
      }),
      edges: groupEdges(graph.edges),
    },
  };
  if (Object.keys(graph.contracts).length > 0) {
    frontmatter.contracts = Object.fromEntries(
      Object.entries(graph.contracts).map(([contractName, contract]) => {
        const entry: Record<string, unknown> = { format: contract.format };
        if (contract.description) entry.description = contract.description;
        if (contract.required && contract.required.length > 0) entry.required = contract.required;
        if (contract.check) entry.check = contract.check;
        return [contractName, entry];
      })
    );
  }

  // Last in the frontmatter: it is the studio's, not the agent's, and changes whenever a card moves.
  const placed = graph.nodes.filter((node) => graph.positions?.[node.id] !== undefined);
  if (placed.length > 0) {
    frontmatter.layout = {
      positions: Object.fromEntries(
        placed.map((node) => {
          const { x, y } = (graph.positions as Record<string, NodeLayout>)[node.id];
          return [node.id, `${Math.round(x)}, ${Math.round(y)}`];
        })
      ),
    };
  }

  const yaml = stringifyYaml(frontmatter, { lineWidth: 0, flowCollectionPadding: false }).trimEnd();
  const parts = [`---\n${yaml}\n---`, graph.preamble || DEFAULT_PREAMBLE];
  for (const node of graph.nodes) {
    if (runsWithoutSubagent(node.type) && node.prompt.trim() === "") continue;
    parts.push(`## @node: ${node.id}\n${node.prompt.trim()}`);
  }
  return `${parts.join("\n\n")}\n`;
}

/* ------------------------------------------------------------------ templates */

export interface TemplateRef {
  /** Raw text between the braces, e.g. `splitter.worker_research`. */
  raw: string;
  /** First path segment: `goal`, `inputs`, a node id or a group alias such as `workers`. */
  head: string;
  /** Remaining path after the first dot (may be empty). */
  path: string;
}

const TEMPLATE_PATTERN = /\{\{\s*([A-Za-z0-9_.\-[\]]+?)\s*\}\}/g;

/** Every `{{...}}` reference in a prompt, in order of appearance (duplicates removed). */
export function extractTemplateRefs(prompt: string): TemplateRef[] {
  const seen = new Set<string>();
  const refs: TemplateRef[] = [];
  for (const match of prompt.matchAll(TEMPLATE_PATTERN)) {
    const raw = match[1];
    if (seen.has(raw)) continue;
    seen.add(raw);
    const dot = raw.indexOf(".");
    refs.push({ raw, head: dot === -1 ? raw : raw.slice(0, dot), path: dot === -1 ? "" : raw.slice(dot + 1) });
  }
  return refs;
}

/** In a fan-out step, `{{item}}` is the item the run handles (it shadows a node named `item`). */
export function isItemRef(node: GraphNode, head: string): boolean {
  return head === "item" && node.foreach !== undefined;
}

/** References a node reads: its prompt plus, for `code` nodes, its command. */
export function nodeRefs(node: GraphNode): TemplateRef[] {
  return extractTemplateRefs(node.run ? `${node.prompt}\n${node.run}` : node.prompt);
}

/** Group aliases: `{{workers.output}}` means every node of type `worker`. */
export function groupAlias(type: NodeType): string {
  return `${type}s`;
}

/**
 * The nodes a group alias stands for. Read by a step, it means the nodes of that type the step reads
 * from: its direct predecessors of the type, else its upstream ones, else every node of the type (so
 * the validator can say which of them runs after or beside it). `{{inputs}}` and `{{goal}}` are
 * keywords, never aliases (`input` nodes would otherwise group as `inputs`).
 */
export function resolveGroup(graph: SkillGraph, head: string, consumer?: GraphNode): GraphNode[] {
  if (head === "inputs" || head === "goal") return [];
  const all = graph.nodes.filter((node) => groupAlias(node.type) === head);
  if (!consumer) return all;
  const preds = new Set(predecessorsOf(graph, consumer.id));
  const direct = all.filter((node) => preds.has(node.id));
  if (direct.length > 0) return direct;
  const ancestors = ancestorsOf(graph, consumer.id);
  const upstream = all.filter((node) => ancestors.has(node.id));
  return upstream.length > 0 ? upstream : all;
}

/* ------------------------------------------------------------------ topology */

/**
 * Neighbours skip edges whose other end is not a node (a half-typed id in the Markdown): the
 * validator reports those edges itself, and everything else may then assume each id resolves.
 */
export function predecessorsOf(graph: SkillGraph, id: string): string[] {
  return graph.edges.filter((edge) => edge.to === id && graph.nodes.some((node) => node.id === edge.from)).map((edge) => edge.from);
}

export function successorsOf(graph: SkillGraph, id: string): string[] {
  return graph.edges.filter((edge) => edge.from === id && graph.nodes.some((node) => node.id === edge.to)).map((edge) => edge.to);
}

/** All transitive ancestors of a node. */
export function ancestorsOf(graph: SkillGraph, id: string): Set<string> {
  const result = new Set<string>();
  const stack = [...predecessorsOf(graph, id)];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (result.has(current)) continue;
    result.add(current);
    stack.push(...predecessorsOf(graph, current));
  }
  return result;
}

/** All transitive descendants of a node. */
export function descendantsOf(graph: SkillGraph, id: string): Set<string> {
  const result = new Set<string>();
  const stack = [...successorsOf(graph, id)];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (result.has(current)) continue;
    result.add(current);
    stack.push(...successorsOf(graph, current));
  }
  return result;
}

const FILE_WRITING_TOOLS: readonly string[] = ["Edit", "Write", "MultiEdit", "NotebookEdit"];

/**
 * True when the node's agent may change files: it lists a file-writing tool (scoped ones too), or
 * it is a model step with no tools list, which Claude Code reads as "inherit every tool".
 */
export function writesFiles(node: GraphNode): boolean {
  if (runsWithoutSubagent(node.type)) return false;
  if (node.tools === undefined || node.tools.length === 0) return true;
  return node.tools.some((tool) => FILE_WRITING_TOOLS.includes(baseToolName(tool)));
}

/** True when a program, not a model, can fail this node: it has a `check`, or it is a `code` node. */
export function hasCommandCheck(node: GraphNode): boolean {
  return node.check !== undefined || (node.type === "code" && node.run !== undefined);
}

/** Steps a `retry_target` may name: model steps upstream of the node (code, approval and input steps have nothing to redo). */
export function retryTargetOptions(graph: SkillGraph, node: GraphNode): GraphNode[] {
  const ancestors = ancestorsOf(graph, node.id);
  return graph.nodes.filter((n) => ancestors.has(n.id) && !runsWithoutSubagent(n.type));
}

/**
 * What a failure re-runs when the node has a usable `retry_target`: the target, then every step
 * between it and the node, in graph order. Null when the target is unset or not upstream.
 */
export function retryPath(graph: SkillGraph, node: GraphNode): GraphNode[] | null {
  const target = node.retryTarget;
  if (!target || !ancestorsOf(graph, node.id).has(target)) return null;
  const between = descendantsOf(graph, target);
  const upstream = ancestorsOf(graph, node.id);
  const order = topologicalOrder(graph) ?? graph.nodes.map((n) => n.id);
  return order.flatMap((id) => {
    const step = graph.nodes.find((n) => n.id === id);
    return step && (id === target || (between.has(id) && upstream.has(id))) ? [step] : [];
  });
}

/** True when a failure of the node re-runs work: a gate, a check or a code step set to retry. */
export function retriesOnFail(node: GraphNode): boolean {
  return node.onFail === "retry" && (node.gate !== undefined || hasCommandCheck(node));
}

/** Kahn topological order over known nodes. Returns null when the graph contains a cycle. */
export function topologicalOrder(graph: SkillGraph): string[] | null {
  const ids = new Set(graph.nodes.map((node) => node.id));
  const indegree = new Map<string, number>();
  for (const id of ids) indegree.set(id, 0);
  const validEdges = graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  for (const edge of validEdges) indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);

  const queue = graph.nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    order.push(id);
    for (const edge of validEdges) {
      if (edge.from !== id) continue;
      const remaining = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, remaining);
      if (remaining === 0) queue.push(edge.to);
    }
  }
  return order.length === ids.size ? order : null;
}

/** Longest-path layer (column) of each node; nodes in the same layer can run in parallel. */
export function computeLayers(graph: SkillGraph): Map<string, number> {
  const layers = new Map<string, number>();
  const order = topologicalOrder(graph) ?? graph.nodes.map((node) => node.id);
  for (const id of order) {
    const preds = predecessorsOf(graph, id).filter((pred) => layers.has(pred));
    layers.set(id, preds.length === 0 ? 0 : Math.max(...preds.map((pred) => layers.get(pred) as number)) + 1);
  }
  return layers;
}

/** Nodes grouped by layer, in execution waves. */
export function executionWaves(graph: SkillGraph): GraphNode[][] {
  const layers = computeLayers(graph);
  const waves: GraphNode[][] = [];
  for (const node of graph.nodes) {
    const layer = layers.get(node.id) ?? 0;
    (waves[layer] ??= []).push(node);
  }
  return waves.filter((wave): wave is GraphNode[] => Array.isArray(wave));
}

/** True when the node should return JSON (explicit setting, or an outgoing edge contract mentions json). */
export function wantsJsonOutput(graph: SkillGraph, node: GraphNode): boolean {
  if (node.outputFormat) return node.outputFormat === "json";
  return graph.edges.some((edge) => edge.from === node.id && edge.contract !== undefined && contractFormat(graph, edge.contract) === "json");
}

/**
 * A JSON output is keyed by target node id only when it feeds more than one step (each then gets
 * its own slice); with a single target it is one unkeyed value. Plan, export and the editor share this.
 */
export function isKeyedJson(graph: SkillGraph, node: GraphNode): boolean {
  return wantsJsonOutput(graph, node) && new Set(successorsOf(graph, node.id)).size > 1;
}

/**
 * Which keys of a keyed JSON output a step receives, or null for the whole output. A prompt that
 * names `{{source.output}}` gets everything, one that names `{{source.key}}` gets those keys, and a
 * prompt that names neither gets the key matching its own id.
 */
export function jsonKeysFor(graph: SkillGraph, source: GraphNode, consumer: GraphNode): string[] | null {
  if (!isKeyedJson(graph, source)) return null;
  const refs = nodeRefs(consumer)
    .filter((ref) => ref.head === source.id && !isItemRef(consumer, ref.head))
    .map((ref) => ref.path);
  // A fan-out step reads its list as if its prompt named `{{source.key}}`.
  const list = foreachSource(consumer);
  if (list?.node === source.id) refs.push(list.key);
  if (refs.length === 0) return [consumer.id];
  if (refs.some((path) => path === "" || path === "output")) return null;
  return [...new Set(refs.map((path) => path.split(".")[0]))];
}

/** The keys a keyed JSON output must contain: every key its steps read (none when all read it whole). */
export function jsonOutputKeys(graph: SkillGraph, node: GraphNode): string[] {
  const keys = new Set<string>();
  for (const id of new Set(successorsOf(graph, node.id))) {
    const consumer = graph.nodes.find((n) => n.id === id);
    if (consumer) jsonKeysFor(graph, node, consumer)?.forEach((key) => keys.add(key));
  }
  return [...keys];
}

/**
 * A contract the graph defines. Own properties only: `graph.contracts` is a plain object, so names
 * such as `constructor` or `toString` would otherwise resolve to Object.prototype members.
 */
export function getContract(graph: SkillGraph, name: string): Contract | undefined {
  return Object.hasOwn(graph.contracts, name) ? graph.contracts[name] : undefined;
}

/** `__proto__` cannot be a key of a plain object without replacing its prototype. */
export function isUsableContractName(name: string): boolean {
  return name !== "__proto__";
}

/** The format a contract gets when only its name is known: JSON when the name says so. */
export function inferredFormat(name: string): ContractFormat {
  return /json/i.test(name) ? "json" : "markdown";
}

/** Format of a named contract; an undefined contract counts as JSON when its name says so. */
export function contractFormat(graph: SkillGraph, name: string): ContractFormat {
  return getContract(graph, name)?.format ?? inferredFormat(name);
}

export function updateContract(graph: SkillGraph, name: string, contract: Contract | null): SkillGraph {
  if (!isUsableContractName(name)) return graph;
  const contracts = { ...graph.contracts };
  if (contract) contracts[name] = contract;
  else delete contracts[name];
  return { ...graph, contracts };
}

/** Renames a contract and every edge that uses it. */
export function renameContract(graph: SkillGraph, name: string, nextName: string): SkillGraph {
  if (name === nextName || !getContract(graph, name) || !isUsableContractName(nextName)) return graph;
  const contracts = Object.fromEntries(Object.entries(graph.contracts).map(([key, value]) => [key === name ? nextName : key, value]));
  return { ...graph, contracts, edges: graph.edges.map((edge) => (edge.contract === name ? { ...edge, contract: nextName } : edge)) };
}

/* ------------------------------------------------------------------ isolation */

export interface IsolationReport {
  nodeId: string;
  /** Distinct upstream references in the prompt (the goal is always allowed). */
  totalRefs: number;
  /** References that do not come in through a direct incoming edge. */
  leakedRefs: string[];
  /** 0 to 100: share of upstream references that bypass the node's incoming edges. */
  biasPercent: number;
}

/**
 * Static check of what a node can see. A reference counts as clean only when the node it reads
 * from is a direct predecessor (or the goal); anything else is context that bypasses the edges.
 */
export function analyzeIsolation(graph: SkillGraph, node: GraphNode): IsolationReport {
  const preds = new Set(predecessorsOf(graph, node.id));
  const ids = new Set(graph.nodes.map((n) => n.id));
  const leaked: string[] = [];
  let total = 0;

  for (const ref of nodeRefs(node)) {
    if (ref.head === "goal" || isItemRef(node, ref.head)) continue;
    if (ref.head === "inputs") {
      total += 1;
      continue;
    }
    const group = ids.has(ref.head) ? [] : resolveGroup(graph, ref.head, node);
    const sources = ids.has(ref.head) ? [ref.head] : group.map((n) => n.id);
    if (sources.length === 0) continue;
    total += 1;
    if (sources.some((source) => !preds.has(source))) leaked.push(ref.raw);
  }

  return {
    nodeId: node.id,
    totalRefs: total,
    leakedRefs: leaked,
    biasPercent: total === 0 ? 0 : Math.round((leaked.length / total) * 100),
  };
}

/* ------------------------------------------------------------------ validation */

export function validateGraph(graph: SkillGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const ids = new Set<string>();

  for (const node of graph.nodes) {
    if (!NODE_ID_PATTERN.test(node.id)) {
      issues.push({
        severity: "error",
        code: "bad-id",
        nodeId: node.id,
        message: `Node id "${node.id}" must start with a letter and use only letters, digits, _ or -.`,
      });
    }
    if (ids.has(node.id)) {
      issues.push({ severity: "error", code: "duplicate-id", nodeId: node.id, message: `Node id "${node.id}" is used more than once.` });
    }
    ids.add(node.id);
  }

  // Each subagent file is named after a slug of the node id, so ids that only differ in case or in
  // _ versus - (review_a, review-a) would export to one file and one step would run the other's prompt.
  const fileNames = new Map<string, string>();
  for (const node of graph.nodes) {
    if (runsWithoutSubagent(node.type) || ids.size < graph.nodes.length) continue;
    const slug = toSlug(node.id, "node");
    const other = fileNames.get(slug);
    if (other !== undefined) {
      issues.push({
        severity: "error",
        code: "agent-name-collision",
        nodeId: node.id,
        message: `"${other}" and "${node.id}" would export to the same subagent file. Rename one so they differ by more than case, _ or -.`,
      });
    } else fileNames.set(slug, node.id);
  }

  if (graph.nodes.length === 0) {
    issues.push({ severity: "error", code: "no-nodes", message: "The topology has no nodes." });
    return issues;
  }

  const seenEdges = new Set<string>();
  for (const edge of graph.edges) {
    const key = `${edge.from}->${edge.to}`;
    if (!ids.has(edge.from)) {
      issues.push({ severity: "error", code: "edge-unknown-node", message: `Edge ${key}: "${edge.from}" is not a node.` });
      continue;
    }
    if (!ids.has(edge.to)) {
      issues.push({ severity: "error", code: "edge-unknown-node", message: `Edge ${key}: "${edge.to}" is not a node.` });
      continue;
    }
    if (edge.from === edge.to) {
      issues.push({ severity: "error", code: "self-loop", nodeId: edge.from, message: `Node "${edge.from}" has an edge to itself.` });
    }
    if (seenEdges.has(key)) {
      issues.push({ severity: "warning", code: "duplicate-edge", message: `Edge ${key} is declared more than once.` });
    }
    seenEdges.add(key);
  }

  if (topologicalOrder(graph) === null) {
    issues.push({ severity: "error", code: "cycle", message: "The graph has a cycle. Skill graphs must be acyclic (a DAG)." });
  }

  const inputs = graph.nodes.filter((node) => node.type === "input");
  if (inputs.length === 0) {
    issues.push({ severity: "error", code: "no-input", message: 'Add a node with type "input"; it carries the goal into the graph.' });
  }

  for (const node of graph.nodes) {
    const preds = predecessorsOf(graph, node.id);
    if (node.type === "input" && preds.length > 0) {
      issues.push({ severity: "error", code: "input-has-parent", nodeId: node.id, message: `Input node "${node.id}" cannot have incoming edges.` });
    }
    if (node.type === "code" && !node.run) {
      issues.push({ severity: "error", code: "missing-run", nodeId: node.id, message: `Code node "${node.id}" has no command. Set run: (e.g. npm test).` });
    }
    if (node.type !== "input") {
      if (!runsWithoutSubagent(node.type) && node.prompt.trim() === "") {
        issues.push({
          severity: "error",
          code: "missing-prompt",
          nodeId: node.id,
          message: `Node "${node.id}" has no prompt. Add a "## @node: ${node.id}" section.`,
        });
      }
      if (preds.length === 0) {
        issues.push({ severity: "error", code: "no-inputs", nodeId: node.id, message: `Node "${node.id}" has no incoming edge, so it would never receive data.` });
      }
    }

    const ancestors = ancestorsOf(graph, node.id);
    for (const ref of nodeRefs(node)) {
      if (ref.head === "goal" || ref.head === "inputs" || isItemRef(node, ref.head)) continue;
      if (ref.head === "item" && !ids.has("item")) {
        issues.push({
          severity: "error",
          code: "item-outside-foreach",
          nodeId: node.id,
          message: `{{item}} in "${node.id}" only means something in a fan-out step. Set foreach: on it, or remove the reference.`,
        });
        continue;
      }
      const isNode = ids.has(ref.head);
      const group = isNode ? [] : resolveGroup(graph, ref.head, node);
      if (!isNode && group.length === 0) {
        issues.push({ severity: "error", code: "unknown-ref", nodeId: node.id, message: `{{${ref.raw}}} in "${node.id}" does not match any node.` });
        continue;
      }
      const sources = isNode ? [ref.head] : group.map((n) => n.id);
      const unreachable = sources.filter((source) => !ancestors.has(source));
      if (unreachable.length > 0) {
        issues.push({
          severity: "error",
          code: "ref-not-upstream",
          nodeId: node.id,
          message: `{{${ref.raw}}} in "${node.id}" reads from ${unreachable.join(", ")}, which runs after or beside it.`,
        });
      }
    }

    if (node.isolatedContext) {
      const report = analyzeIsolation(graph, node);
      if (report.leakedRefs.length > 0) {
        issues.push({
          severity: "warning",
          code: "isolation-leak",
          nodeId: node.id,
          message: `"${node.id}" is marked isolated_context but reads ${report.leakedRefs.map((r) => `{{${r}}}`).join(", ")} outside its incoming edges.`,
        });
      }
    }
  }

  // Contracts: every edge contract should be defined so the agent knows what a valid handoff looks like.
  const undefinedContracts = new Set(graph.edges.flatMap((edge) => (edge.contract && !getContract(graph, edge.contract) ? [edge.contract] : [])));
  for (const contract of undefinedContracts) {
    issues.push({
      severity: "warning",
      code: "contract-undefined",
      message: `Contract "${contract}" is used on an edge but not defined under contracts:, so agents cannot check that handoff.`,
    });
  }
  for (const [contractName, contract] of Object.entries(graph.contracts)) {
    if (contract.required && contract.required.length > 0) {
      if (contract.format !== "json") {
        issues.push({
          severity: "warning",
          code: "required-not-json",
          message: `Contract "${contractName}" lists required keys but is ${contract.format}. Only JSON payloads have keys; set format: json or remove required.`,
        });
      }
      const bad = contract.required.filter((key) => !CONTRACT_KEY_PATTERN.test(key));
      if (bad.length > 0) {
        issues.push({
          severity: "error",
          code: "contract-bad-key",
          message: `Contract "${contractName}" has required keys that are not plain names (${bad.map((key) => `"${key}"`).join(", ")}). Use letters, digits, _ or -.`,
        });
      }
    }
    if (contract.check && !/\{\{\s*payload\s*\}\}/.test(contract.check)) {
      issues.push({
        severity: "warning",
        code: "contract-check-no-payload",
        message: `The check on contract "${contractName}" never reads {{payload}}, so it does not look at the payload. Put {{payload}} where the file path goes.`,
      });
    }
  }
  for (const node of graph.nodes) {
    if (node.outputFormat !== "text") continue;
    const jsonEdge = graph.edges.find((edge) => edge.from === node.id && edge.contract && contractFormat(graph, edge.contract) === "json");
    if (jsonEdge) {
      issues.push({
        severity: "error",
        code: "format-mismatch",
        nodeId: node.id,
        message: `"${node.id}" outputs text but its edge to "${jsonEdge.to}" uses the JSON contract "${jsonEdge.contract}".`,
      });
    }
  }

  // Agent settings
  for (const node of graph.nodes) {
    if (node.tools && node.tools.length === 0 && node.type !== "input") {
      issues.push({
        severity: "warning",
        code: "empty-tools",
        nodeId: node.id,
        message: `"${node.id}" has an empty tools list. Claude Code reads that as "inherit every tool"; list the tools it needs (e.g. Read).`,
      });
    }
    if (node.model && !MODEL_PATTERN.test(node.model)) {
      issues.push({
        severity: "error",
        code: "bad-model",
        nodeId: node.id,
        message: `"${node.id}" has an invalid model. Use haiku, sonnet, opus, fable or a model id (letters, digits, . _ : - only, on one line).`,
      });
    }
    for (const tool of node.tools ?? []) {
      if (!TOOL_PATTERN.test(tool)) {
        issues.push({
          severity: "error",
          code: "bad-tool",
          nodeId: node.id,
          message: `"${node.id}" lists an invalid tool name. Tool names use letters, digits, _ and - (optionally a one-line pattern in parentheses).`,
        });
        continue;
      }
      const base = baseToolName(tool);
      if (!VALID_TOOL_NAMES.includes(base) && !base.startsWith("mcp__")) {
        issues.push({ severity: "warning", code: "unknown-tool", nodeId: node.id, message: `"${node.id}" lists the tool "${tool}", which Claude Code does not know.` });
      }
    }
    if (node.onFail === "retry" && !node.gate && !hasCommandCheck(node)) {
      issues.push({ severity: "warning", code: "retry-without-gate", nodeId: node.id, message: `"${node.id}" says on_fail: retry but has no gate to check.` });
    }
    if (node.gate && predecessorsOf(graph, node.id).length === 0) {
      issues.push({ severity: "warning", code: "gate-without-input", nodeId: node.id, message: `"${node.id}" has a gate but no upstream work to verify.` });
    }
  }

  const sinks = graph.nodes.filter((node) => successorsOf(graph, node.id).length === 0 && node.type !== "input");
  if (sinks.length === 0 && graph.nodes.some((node) => node.type !== "input")) {
    issues.push({ severity: "warning", code: "no-sink", message: "No node is at the end of the graph, so there is no final answer." });
  }

  issues.push(...validateFlow(graph), ...validateReliability(graph), ...validateExperience(graph), ...validateFanOutAndHandoffs(graph), ...validateProbing(graph));
  if (graph.specVersion !== undefined && !KNOWN_SPEC_VERSIONS.includes(graph.specVersion)) {
    issues.push({
      severity: "warning",
      code: "unknown-spec",
      message: `spec: ${graph.specVersion} is not a version this studio knows (${KNOWN_SPEC_VERSIONS.join(", ")}). It is read as the newest one, and saving writes the version the graph needs.`,
    });
  }
  return issues;
}

/**
 * True when running the step twice could change the repository or the world: it may edit files,
 * run unscoped shell commands, or is marked wide or irreversible. Probing needs steps without them.
 */
export function hasSideEffects(node: GraphNode): boolean {
  if (writesFiles(node) || (node.risk !== undefined && node.risk !== "contained")) return true;
  return (node.tools ?? []).some((tool) => tool === "Bash" || tool === "PowerShell");
}

/** Probed steps run several candidates side by side, so they must leave no trace a second candidate would trip over. */
function validateProbing(graph: SkillGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const slugs = new Map(graph.nodes.map((node) => [toSlug(node.id, "node"), node.id]));
  for (const node of graph.nodes) {
    if (node.probe === undefined) {
      if (node.probeHints) issues.push({ severity: "warning", code: "probe-hints-unused", nodeId: node.id, message: `"${node.id}" has probe_hints but no probe:, so they are ignored.` });
      continue;
    }
    if (runsWithoutSubagent(node.type)) {
      issues.push({ severity: "error", code: "probe-not-model", nodeId: node.id, message: `"${node.id}" is a ${node.type} step; only model steps can be probed. Remove probe.` });
      continue;
    }
    if (hasSideEffects(node)) {
      issues.push({
        severity: "error",
        code: "probe-side-effects",
        nodeId: node.id,
        message: `"${node.id}" can change files or run shell commands, so its candidates would overwrite each other. Probe a step that only reads (a plan, a review, research), or limit its tools to Read, Grep, Glob and scoped Bash.`,
      });
    }
    if (node.foreach) {
      issues.push({ severity: "error", code: "probe-foreach", nodeId: node.id, message: `"${node.id}" fans out and is probed, so every item would run ${node.probe} times. Use one or the other.` });
    }
    if (node.probeHints && node.probeHints.length > node.probe) {
      issues.push({
        severity: "warning",
        code: "probe-hints-extra",
        nodeId: node.id,
        message: `"${node.id}" has ${node.probeHints.length} approach hints for ${node.probe} candidates; the extra ones are never used.`,
      });
    }
    const judge = slugs.get(`${toSlug(node.id, "node")}-judge`);
    if (judge) {
      issues.push({ severity: "error", code: "agent-name-collision", nodeId: judge, message: `"${judge}" would export to the same file as the judge of the probed step "${node.id}". Rename one.` });
    }
  }
  return issues;
}

/** True when the node's agent can open a file: it has Read, or no tools list (every tool). */
function canReadFiles(node: GraphNode): boolean {
  return node.tools === undefined || node.tools.length === 0 || node.tools.some((tool) => baseToolName(tool) === "Read");
}

/** Fan-out steps need a JSON list from a direct predecessor; file handoffs need a reader at the other end. */
function validateFanOutAndHandoffs(graph: SkillGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    const list = foreachSource(node);
    if (list) {
      const source = byId.get(list.node);
      if (runsWithoutSubagent(node.type)) {
        issues.push({ severity: "error", code: "foreach-not-model", nodeId: node.id, message: `"${node.id}" is a ${node.type} step; only model steps can fan out. Remove foreach.` });
      } else if (!source || !predecessorsOf(graph, node.id).includes(list.node)) {
        issues.push({
          severity: "error",
          code: "foreach-source-unknown",
          nodeId: node.id,
          message: `"${node.id}" fans out over "${node.foreach}", but "${list.node}" is not a step with an edge into it. Use <step>.<key> of a step connected to it.`,
        });
      } else if (source.type === "input" || source.type === "approval" || !wantsJsonOutput(graph, source)) {
        issues.push({
          severity: "error",
          code: "foreach-source-not-json",
          nodeId: node.id,
          message: `"${node.id}" fans out over "${node.foreach}", but "${list.node}" does not return JSON. Give the edge a JSON contract, or set output_format: json on "${list.node}".`,
        });
      }
      if (node.risk === "irreversible") {
        issues.push({ severity: "error", code: "foreach-irreversible", nodeId: node.id, message: `"${node.id}" is irreversible and fans out, so one approval would cover any number of hard-to-undo runs. Remove foreach, or move the irreversible work to a step after it.` });
      }
      if (node.maxItems === undefined) {
        issues.push({
          severity: "warning",
          code: "foreach-no-cap",
          nodeId: node.id,
          message: `"${node.id}" has no max_items, so a long list would start that many runs. Set max_items to stop and ask instead.`,
        });
      }
      if (writesFiles(node) && (node.maxParallel ?? DEFAULT_MAX_PARALLEL) > 1) {
        issues.push({
          severity: "warning",
          code: "foreach-parallel-writers",
          nodeId: node.id,
          message: `"${node.id}" runs up to ${node.maxParallel ?? DEFAULT_MAX_PARALLEL} copies at once and can edit files, so runs may overwrite each other. Set max_parallel: 1, or limit its tools.`,
        });
      }
    } else if (node.maxParallel !== undefined || node.maxItems !== undefined) {
      issues.push({ severity: "warning", code: "fanout-settings-unused", nodeId: node.id, message: `"${node.id}" sets max_parallel or max_items but does not fan out (no foreach:).` });
    }

    if (runsWithoutSubagent(node.type) || canReadFiles(node)) continue;
    const fileInputs = predecessorsOf(graph, node.id).filter((id) => {
      const source = byId.get(id);
      return source !== undefined && handoffOf(graph, source) === "file";
    });
    if (fileInputs.length > 0) {
      issues.push({
        severity: "error",
        code: "file-handoff-no-read",
        nodeId: node.id,
        message: `"${node.id}" gets ${fileInputs.map((id) => `"${id}"`).join(", ")} as a file but cannot use Read. Add Read to its tools, or hand those outputs on inline.`,
      });
    }
  }
  return issues;
}

/** The experience file needs evidence to learn from, and two names for itself. */
function validateExperience(graph: SkillGraph): GraphIssue[] {
  if (!graph.experience) return [];
  const issues: GraphIssue[] = [];
  for (const node of graph.nodes) {
    if (EXPERIENCE_RESERVED_IDS.includes(toSlug(node.id, "node"))) {
      issues.push({
        severity: "error",
        code: "experience-id-reserved",
        nodeId: node.id,
        message: `"${node.id}" is a name the experience file uses for itself (EXPERIENCE.md and the reflect step). Rename the node.`,
      });
    }
  }
  const contractChecks = Object.values(graph.contracts).some((contract) => contract.check || (contract.required && contract.required.length > 0));
  if (!contractChecks && !graph.nodes.some((node) => node.gate !== undefined || hasCommandCheck(node))) {
    issues.push({
      severity: "warning",
      code: "experience-no-signal",
      message: "The skill learns from failed checks, gates and code steps, and this graph has none, so it would never write a lesson. Add a check (e.g. npm test) or a gate.",
    });
  }
  return issues;
}

/** Which direct predecessors a node names in its prompt or command (null: it names none, so it reads them all). */
function readPredecessors(graph: SkillGraph, node: GraphNode): Set<string> | null {
  const preds = predecessorsOf(graph, node.id);
  const read = new Set<string>();
  // A fan-out step reads its list's source even when no prompt reference names it.
  const list = foreachSource(node);
  if (list) read.add(list.node);
  let explicit = false;
  for (const ref of nodeRefs(node)) {
    if (ref.head === "goal" || isItemRef(node, ref.head)) continue;
    explicit = true;
    if (ref.head === "inputs") preds.forEach((id) => read.add(id));
    else if (graph.nodes.some((n) => n.id === ref.head)) read.add(ref.head);
    else resolveGroup(graph, ref.head, node).forEach((member) => read.add(member.id));
  }
  return explicit ? read : null;
}

/**
 * Edges must carry data. An edge whose target names other inputs but never this one is usually only
 * "and then": it makes the target wait for nothing. A graph where every step waits on the previous
 * one gains nothing from being a graph.
 */
function validateFlow(graph: SkillGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    const read = readPredecessors(graph, node);
    if (!read) continue;
    for (const from of new Set(predecessorsOf(graph, node.id))) {
      const source = byId.get(from);
      // Waiting is the point of an edge out of an approval or a command step.
      if (!source || runsWithoutSubagent(source.type) || read.has(from)) continue;
      issues.push({
        severity: "warning",
        code: "unread-edge",
        nodeId: node.id,
        message: `"${node.id}" never reads "${from}": it names other inputs but not this one. If it only waits for "${from}", remove the edge so both can run in parallel.`,
      });
    }
  }

  if (topologicalOrder(graph) !== null) {
    const steps = graph.nodes.filter((node) => node.type !== "input");
    const waves = executionWaves(graph).map((wave) => wave.filter((node) => node.type !== "input"));
    // A fan-out step runs in parallel with itself, so a chain around one is not "no parallelism".
    if (steps.length >= 4 && waves.every((wave) => wave.length <= 1) && !steps.some((node) => node.foreach !== undefined)) {
      issues.push({
        severity: "warning",
        code: "no-parallelism",
        message: "Every step waits for the one before it, so nothing runs in parallel. If each step really reads the previous output, one agent with a command check may serve better than a graph.",
      });
    }
    for (const wave of waves) {
      const writers = wave.filter(writesFiles);
      if (writers.length < 2) continue;
      issues.push({
        severity: "warning",
        code: "parallel-writers",
        nodeId: writers[0].id,
        message: `${writers.map((n) => `"${n.id}"`).join(", ")} run in parallel and can all edit files, so they may overwrite each other. Give them separate files, or run them one after another.`,
      });
    }
  }
  return issues;
}

/**
 * Loops and gates: a check a program can fail, retries capped, and gating by blast radius
 * (wide work needs a command check, irreversible work needs a human approval before it).
 */
function validateReliability(graph: SkillGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodesOf = (ids: Set<string>) => [...ids].flatMap((id) => (byId.has(id) ? [byId.get(id) as GraphNode] : []));

  for (const node of graph.nodes) {
    if (node.maxRetries !== undefined && node.maxRetries > RETRY_CAP) {
      issues.push({
        severity: "warning",
        code: "retry-cap",
        nodeId: node.id,
        message: `"${node.id}" retries ${node.maxRetries} times. Past ${RETRY_CAP} tries the plan is usually what is wrong; stop and report instead.`,
      });
    }

    const ancestors = nodesOf(ancestorsOf(graph, node.id));
    if (node.retryTarget) {
      const target = byId.get(node.retryTarget);
      const path = retryPath(graph, node);
      if (!target || !path) {
        issues.push({
          severity: "error",
          code: "retry-target-unknown",
          nodeId: node.id,
          message: target
            ? `"${node.id}" restarts at "${node.retryTarget}" on failure, but "${node.retryTarget}" does not run before it. Pick a step upstream.`
            : `"${node.id}" restarts at "${node.retryTarget}" on failure, but there is no node with that id.`,
        });
      } else if (runsWithoutSubagent(target.type)) {
        issues.push({
          severity: "error",
          code: "retry-target-not-model",
          nodeId: node.id,
          message: `"${node.id}" restarts at "${target.id}", a ${target.type} step with no work to redo. Pick the model step that does the work.`,
        });
      } else {
        const irreversible = path.find((step) => step.risk === "irreversible");
        if (irreversible) {
          issues.push({
            severity: "error",
            code: "retry-path-irreversible",
            nodeId: node.id,
            message: `Restarting at "${target.id}" would re-run "${irreversible.id}", which is irreversible. Restart after it, or set on_fail: stop.`,
          });
        }
        const approval = path.find((step) => step.type === "approval");
        if (approval) {
          issues.push({
            severity: "warning",
            code: "retry-path-approval",
            nodeId: node.id,
            message: `Restarting at "${target.id}" passes the approval "${approval.id}", so you would be asked again on every retry.`,
          });
        }
      }
      if (!retriesOnFail(node)) {
        issues.push({
          severity: "warning",
          code: "retry-target-unused",
          nodeId: node.id,
          message: `"${node.id}" has a retry target but never retries. It needs a gate, a check or a command, and on_fail: retry.`,
        });
      }
    }
    if (node.type === "code" && node.onFail === "retry" && !retryPath(graph, node) && !predecessorsOf(graph, node.id).some((id) => byId.has(id) && !runsWithoutSubagent((byId.get(id) as GraphNode).type))) {
      issues.push({
        severity: "warning",
        code: "retry-nothing-upstream",
        nodeId: node.id,
        message: `"${node.id}" re-runs the steps before it on failure, but none of them is a subagent, so it will stop instead. Set on_fail: stop, or connect it after a subagent step.`,
      });
    }
    if (node.risk === "irreversible") {
      if (!ancestors.some((a) => a.type === "approval")) {
        issues.push({
          severity: "error",
          code: "irreversible-unapproved",
          nodeId: node.id,
          message: `"${node.id}" is irreversible but no approval step comes before it. Add an approval node upstream so a person signs off first.`,
        });
      }
      if (node.onFail === "retry") {
        issues.push({ severity: "warning", code: "irreversible-retry", nodeId: node.id, message: `"${node.id}" is irreversible; do not retry it automatically. Set on_fail: stop.` });
      }
    }
    if (node.risk === "wide" && !hasCommandCheck(node) && !nodesOf(descendantsOf(graph, node.id)).some(hasCommandCheck)) {
      issues.push({
        severity: "warning",
        code: "wide-without-check",
        nodeId: node.id,
        message: `"${node.id}" has a wide blast radius but nothing checks it with a command. Add check: (e.g. npm test) or a code step after it.`,
      });
    }
    if (node.gate && !hasCommandCheck(node) && [node, ...ancestors].some(writesFiles) && !ancestors.some(hasCommandCheck)) {
      issues.push({
        severity: "warning",
        code: "gate-without-check",
        nodeId: node.id,
        message: `"${node.id}" judges file changes with a model only. Add a check command (e.g. npm test) here or upstream so a program can fail the work too.`,
      });
    }
    if (node.type === "approval") {
      const after = nodesOf(descendantsOf(graph, node.id));
      if (after.length > 0 && !after.some((n) => n.risk === "wide" || n.risk === "irreversible")) {
        issues.push({
          severity: "warning",
          code: "approval-guards-nothing",
          nodeId: node.id,
          message: `Approval "${node.id}" pauses the run, but nothing after it is marked wide or irreversible. Move it right before the step that is hard to undo, or to the end.`,
        });
      }
    }
  }
  return issues;
}

/** Warns about `## @node:` sections that match no node (kept separate: needs the raw source). */
export function findOrphanSections(source: string, graph: SkillGraph): string[] {
  const match = FRONTMATTER_PATTERN.exec(source);
  if (!match) return [];
  const { sections } = splitSections(source.slice(match[0].length));
  const ids = new Set(graph.nodes.map((node) => node.id));
  return [...sections.keys()].filter((id) => !ids.has(id));
}

/* ------------------------------------------------------------------ editing helpers */

export function uniqueNodeId(graph: SkillGraph, base: string): string {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

const NEW_NODE_PROMPTS: Record<NodeType, string> = {
  input: "",
  code: "",
  approval: "Show the user what will happen next and ask for a yes or no.",
  orchestrator: "You are the Orchestrator. Break the input into clear, independent tasks and return them as JSON.",
  worker: "Focus ONLY on the task you receive. Return concrete findings with evidence.",
  verifier: "You only see the raw outputs of the upstream nodes, not their reasoning. Reject unverified or weakly supported claims.",
  synthesizer: "Combine the verified findings into one clear, actionable report.",
  agent: "Describe what this node should do with its input.",
};

export function addNode(graph: SkillGraph, type: NodeType, after?: string): { graph: SkillGraph; id: string } {
  const id = uniqueNodeId(graph, type === "agent" ? "node" : type);
  const node: GraphNode = {
    id,
    type,
    label: `${type[0].toUpperCase()}${type.slice(1)}`,
    isolatedContext: type === "verifier",
    // Read-only by default, as in every blueprint; a generic agent step keeps every tool until the user limits it.
    tools: type === "verifier" || type === "orchestrator" || type === "worker" || type === "synthesizer" ? ["Read", "Grep", "Glob"] : undefined,
    gate: type === "verifier" ? "Every claim cites concrete evidence." : undefined,
    onFail: type === "verifier" ? "retry" : undefined,
    run: type === "code" ? "npm test" : undefined,
    prompt: NEW_NODE_PROMPTS[type],
  };
  const edges = after && type !== "input" ? [...graph.edges, { from: after, to: id }] : graph.edges;
  return { graph: { ...graph, nodes: [...graph.nodes, node], edges }, id };
}

function withoutKey(positions: Record<string, NodeLayout> | undefined, id: string): Record<string, NodeLayout> | undefined {
  if (!positions || !(id in positions)) return positions;
  const rest = { ...positions };
  delete rest[id];
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/** Cards snap to this grid when dragged, so hand-placed graphs line up. */
export const LAYOUT_GRID = 8;

/**
 * Places a card where the user dropped it. The first move pins every card where it is on screen,
 * so moving one card never makes the others jump to a different automatic layout.
 */
export function moveNode(graph: SkillGraph, id: string, position: NodeLayout, onScreen: Map<string, NodeLayout>): SkillGraph {
  const snap = (value: number) => Math.round(value / LAYOUT_GRID) * LAYOUT_GRID;
  const clampCoordinate = (value: number) => Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, value));
  const positions: Record<string, NodeLayout> = {};
  for (const node of graph.nodes) {
    const current = graph.positions?.[node.id] ?? onScreen.get(node.id);
    if (current) positions[node.id] = { x: Math.round(current.x), y: Math.round(current.y) };
  }
  positions[id] = { x: clampCoordinate(snap(position.x)), y: clampCoordinate(snap(position.y)) };
  return { ...graph, positions };
}

/** Back to the automatic layout. */
export function clearPositions(graph: SkillGraph): SkillGraph {
  return { ...graph, positions: undefined };
}

export function removeNode(graph: SkillGraph, id: string): SkillGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== id).map((node) => (node.retryTarget === id ? { ...node, retryTarget: undefined } : node)),
    edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
    positions: withoutKey(graph.positions, id),
  };
}

export function updateNode(graph: SkillGraph, id: string, patch: Partial<Omit<GraphNode, "id">>): SkillGraph {
  return { ...graph, nodes: graph.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)) };
}

/** Renames a node id everywhere it is used, including {{id.path}} references in prompts. */
export function renameNode(graph: SkillGraph, id: string, nextId: string): SkillGraph {
  if (id === nextId) return graph;
  const rewrite = (prompt: string) =>
    prompt.replace(TEMPLATE_PATTERN, (full, raw: string) => {
      const dot = raw.indexOf(".");
      const head = dot === -1 ? raw : raw.slice(0, dot);
      return head === id ? `{{${nextId}${dot === -1 ? "" : raw.slice(dot)}}}` : full;
    });
  const positions = graph.positions?.[id] ? { ...withoutKey(graph.positions, id), [nextId]: graph.positions[id] } : graph.positions;
  return {
    ...graph,
    positions,
    nodes: graph.nodes.map((node) => ({
      ...node,
      id: node.id === id ? nextId : node.id,
      prompt: rewrite(node.prompt),
      ...(node.run ? { run: rewrite(node.run) } : {}),
      ...(node.retryTarget === id ? { retryTarget: nextId } : {}),
      ...(foreachSource(node)?.node === id ? { foreach: `${nextId}${(node.foreach as string).slice(id.length)}` } : {}),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      from: edge.from === id ? nextId : edge.from,
      to: edge.to === id ? nextId : edge.to,
    })),
  };
}

export function addEdge(graph: SkillGraph, from: string, to: string, contract?: string): SkillGraph {
  if (from === to || graph.edges.some((edge) => edge.from === from && edge.to === to)) return graph;
  return { ...graph, edges: [...graph.edges, { from, to, contract }] };
}

/** Nodes that can feed `id` with a new edge: not itself, not already connected, and not after it (that would be a cycle). */
export function connectableSources(graph: SkillGraph, id: string): GraphNode[] {
  const target = graph.nodes.find((node) => node.id === id);
  if (!target || target.type === "input") return [];
  const preds = new Set(predecessorsOf(graph, id));
  const after = descendantsOf(graph, id);
  return graph.nodes.filter((node) => node.id !== id && !preds.has(node.id) && !after.has(node.id));
}

export function removeEdge(graph: SkillGraph, from: string, to: string): SkillGraph {
  return { ...graph, edges: graph.edges.filter((edge) => !(edge.from === from && edge.to === to)) };
}

export function updateEdge(graph: SkillGraph, from: string, to: string, contract: string | undefined): SkillGraph {
  return {
    ...graph,
    edges: graph.edges.map((edge) =>
      edge.from === from && edge.to === to ? { ...edge, contract: contract && contract.trim() ? contract.trim() : undefined } : edge
    ),
  };
}

/**
 * Names the contract on an edge and defines it if it is new (JSON when the name says so, otherwise
 * Markdown), so nobody has to write a `contracts:` entry by hand. The name is committed on every
 * keystroke, so a previous contract that was created the same way (no description) and is no longer
 * used anywhere is dropped instead of leaving "f", "fi", "fin"… behind.
 */
export function setEdgeContract(graph: SkillGraph, from: string, to: string, name: string): SkillGraph {
  const previous = graph.edges.find((edge) => edge.from === from && edge.to === to)?.contract;
  let next = updateEdge(graph, from, to, name);
  const contract = name.trim();
  if (contract && !getContract(next, contract)) next = updateContract(next, contract, { format: inferredFormat(contract), description: "" });
  // Prune only what this function would have created itself: the inferred format and no description.
  // A contract the user gave another format (say `report: text`) survives being typed past.
  const old = previous ? getContract(next, previous) : undefined;
  if (previous && previous !== contract && old && old.description === "" && old.format === inferredFormat(previous) && !next.edges.some((edge) => edge.contract === previous)) {
    next = updateContract(next, previous, null);
  }
  return next;
}

export interface PromptInput {
  /** What gets inserted, e.g. `{{plan.output}}`. */
  ref: string;
  /** Plain-language name shown in the menu. */
  label: string;
}

/**
 * What a step's prompt can pull in, for the editor's "Insert input" menu: the goal, each incoming
 * step's whole output, this step's own part of a JSON output, and group shortcuts. Only the step's
 * own inputs are offered, so an inserted reference never breaks a fresh context.
 */
export function promptInputs(graph: SkillGraph, node: GraphNode): PromptInput[] {
  const inputs: PromptInput[] = [];
  if (node.foreach) inputs.push({ ref: "{{item}}", label: "This run's item from the list" });
  if (graph.nodes.some((n) => n.type === "input")) inputs.push({ ref: "{{goal}}", label: "The user's goal" });
  const preds = predecessorsOf(graph, node.id)
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is GraphNode => n !== undefined && n.type !== "input");
  for (const pred of preds) {
    inputs.push({ ref: `{{${pred.id}.output}}`, label: `Everything ${cleanLabelText(pred.label)} returns` });
    if (isKeyedJson(graph, pred)) inputs.push({ ref: `{{${pred.id}.${node.id}}}`, label: `Only this step's part of ${cleanLabelText(pred.label)}'s JSON` });
  }
  const byType = new Map<NodeType, GraphNode[]>();
  for (const pred of preds) byType.set(pred.type, [...(byType.get(pred.type) ?? []), pred]);
  for (const [type, members] of byType) {
    // A group alias read by a step stands for the nodes of that type feeding it, so it is safe whenever several do.
    const count = new Set(members.map((member) => member.id)).size;
    if (count > 1) inputs.push({ ref: `{{${groupAlias(type)}.output}}`, label: `The outputs of all ${count} ${groupAlias(type)}` });
  }
  if (preds.length > 1) inputs.push({ ref: "{{inputs}}", label: "Everything arriving on its incoming edges" });
  return inputs;
}

/** A label as plain text for menus: no "2." numbering, and no shouting ("2. SPLIT" → "Split"). */
function cleanLabelText(label: string): string {
  const text = label.replace(/^[\d\s&.]+/, "").trim() || label;
  return text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text;
}

/* ------------------------------------------------------------------ canvas layout */

export const NODE_WIDTH = 252;
export const NODE_HEIGHT = 96;
/** Gap between layers along the flow, and between siblings inside a layer, per direction. */
/** Sized for the blueprints: cards fit a 19-character id beside its model and tool count, and the LR layer gap fits a 20-character contract pill. */
export const LAYOUT_GAPS = { LR: { layer: 164, sibling: 28 }, TB: { layer: 64, sibling: 22 } } as const;

/** LR flows left to right (wide canvases); TB flows top to bottom (narrow, portrait canvases). */
export type LayoutDirection = "LR" | "TB";

export interface NodeLayout {
  x: number;
  y: number;
}

export interface GraphLayout {
  direction: LayoutDirection;
  positions: Map<string, NodeLayout>;
  width: number;
  height: number;
  /**
   * Edges that skip layers (`diff -> gate` past the reviewers), keyed `from->to`: the centre of the
   * lane they take through each column between their ends. Other edges have no entry.
   */
  routes: Map<string, NodeLayout[]>;
  /** Top-left corner of the area the cards cover (0, 0 for the automatic layout; hand-placed cards can sit above or left of it). */
  minX: number;
  minY: number;
  /** True when the user placed the cards: edges then leave from the side that faces their target. */
  manual: boolean;
}

/** Cross-axis room a layer-skipping edge reserves in each column it passes, so it never runs through a card. */
export const ROUTE_LANE = 20;

/**
 * Layered layout: layers by longest path, siblings ordered by the barycenter of their neighbours.
 * An edge that skips layers gets a routing slot in every column it passes; the slots are sorted with
 * the cards, so the cards make room for the edge instead of the edge crossing them.
 */
export function layoutGraph(graph: SkillGraph, direction: LayoutDirection = "LR"): GraphLayout {
  const layers = computeLayers(graph);
  const columns: string[][] = [];
  for (const node of graph.nodes) (columns[layers.get(node.id) ?? 0] ??= []).push(node.id);

  // Neighbours for ordering: direct edges, or the chain of routing slots a long edge passes through.
  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    succs.set(from, [...(succs.get(from) ?? []), to]);
    preds.set(to, [...(preds.get(to) ?? []), from]);
  };
  const slots = new Map<string, string[]>();
  const ids = new Set(graph.nodes.map((node) => node.id));
  for (const edge of graph.edges) {
    const key = `${edge.from}->${edge.to}`;
    if (!ids.has(edge.from) || !ids.has(edge.to) || slots.has(key)) continue;
    const from = layers.get(edge.from) ?? 0;
    const to = layers.get(edge.to) ?? 0;
    const chain: string[] = [];
    // Node ids start with a letter, so a slot id (it starts with \u0000) never collides with one.
    for (let layer = from + 1; layer < to; layer += 1) {
      const slot = `\u0000${key}\u0000${layer}`;
      (columns[layer] ??= []).push(slot);
      chain.push(slot);
    }
    slots.set(key, chain);
    [edge.from, ...chain, edge.to].forEach((id, index, path) => index > 0 && link(path[index - 1], id));
  }
  const dense = columns.filter((column): column is string[] => Array.isArray(column));
  const isSlot = (id: string) => id.startsWith("\u0000");

  // Lay out along a "flow" axis (layers) and a "cross" axis (siblings), then map them to x/y.
  const gaps = LAYOUT_GAPS[direction];
  const flowSize = direction === "LR" ? NODE_WIDTH : NODE_HEIGHT;
  const crossSize = direction === "LR" ? NODE_HEIGHT : NODE_WIDTH;
  const sizeOf = (id: string) => (isSlot(id) ? ROUTE_LANE : crossSize);
  const extentOf = (column: string[]) => column.reduce((sum, id) => sum + sizeOf(id), 0) + Math.max(0, column.length - 1) * gaps.sibling;
  const crossExtent = Math.max(crossSize, ...dense.map(extentOf));
  const flowExtent = Math.max(1, dense.length) * flowSize + Math.max(0, dense.length - 1) * gaps.layer;

  // Cross-axis centre of every card and slot, each column centred, so columns of different sizes line up.
  const centre = new Map<string, number>();
  const place = (column: string[]) => {
    let cursor = (crossExtent - extentOf(column)) / 2;
    for (const id of column) {
      centre.set(id, cursor + sizeOf(id) / 2);
      cursor += sizeOf(id) + gaps.sibling;
    }
  };
  dense.forEach(place);

  const sweep = (column: string[], neighbours: Map<string, string[]>) => {
    const score = (id: string): number => {
      const ns = (neighbours.get(id) ?? []).filter((n) => centre.has(n));
      return ns.length === 0 ? (centre.get(id) as number) : ns.reduce((sum, n) => sum + (centre.get(n) as number), 0) / ns.length;
    };
    const scores = new Map(column.map((id) => [id, score(id)]));
    column.sort((a, b) => (scores.get(a) as number) - (scores.get(b) as number));
    place(column);
  };
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < dense.length; i += 1) sweep(dense[i], preds);
    for (let i = dense.length - 2; i >= 0; i -= 1) sweep(dense[i], succs);
  }

  const positions = new Map<string, NodeLayout>();
  const slotCentres = new Map<string, NodeLayout>();
  const toXY = (flow: number, cross: number): NodeLayout => (direction === "LR" ? { x: flow, y: cross } : { x: cross, y: flow });
  dense.forEach((column, layerIndex) => {
    const flow = layerIndex * (flowSize + gaps.layer);
    for (const id of column) {
      const cross = centre.get(id) as number;
      if (isSlot(id)) slotCentres.set(id, toXY(flow + flowSize / 2, cross));
      else positions.set(id, toXY(flow, cross - crossSize / 2));
    }
  });

  const routes = new Map<string, NodeLayout[]>();
  for (const [key, chain] of slots) if (chain.length > 0) routes.set(key, chain.map((slot) => slotCentres.get(slot) as NodeLayout));

  return direction === "LR"
    ? { direction, positions, width: flowExtent, height: crossExtent, routes, minX: 0, minY: 0, manual: false }
    : { direction, positions, width: crossExtent, height: flowExtent, routes, minX: 0, minY: 0, manual: false };
}

function overlaps(a: NodeLayout, b: NodeLayout): boolean {
  return Math.abs(a.x - b.x) < NODE_WIDTH + LAYOUT_GAPS.LR.sibling && Math.abs(a.y - b.y) < NODE_HEIGHT + LAYOUT_GAPS.LR.sibling;
}

/**
 * The layout the canvas draws: the automatic one, or the user's placement once they have moved a
 * card. A card that has no place yet (just added) goes to the right of the step it connects from,
 * or below everything, moved down until it overlaps no other card.
 */
export function canvasLayout(graph: SkillGraph, direction: LayoutDirection = "LR"): GraphLayout {
  if (!graph.positions || !graph.nodes.some((node) => graph.positions?.[node.id])) return layoutGraph(graph, direction);
  const placed = new Map<string, NodeLayout>();
  for (const node of graph.nodes) {
    const position = graph.positions[node.id];
    if (position) placed.set(node.id, position);
  }
  const order = topologicalOrder(graph) ?? graph.nodes.map((node) => node.id);
  for (const id of order) {
    if (placed.has(id)) continue;
    const from = predecessorsOf(graph, id).find((pred) => placed.has(pred));
    const all = [...placed.values()];
    const bottom = Math.max(...all.map((p) => p.y)) + NODE_HEIGHT + LAYOUT_GAPS.LR.sibling * 2;
    const left = Math.min(...all.map((p) => p.x));
    const start = from ? { x: (placed.get(from) as NodeLayout).x + NODE_WIDTH + LAYOUT_GAPS.LR.layer, y: (placed.get(from) as NodeLayout).y } : { x: left, y: bottom };
    const spot = { ...start };
    while ([...placed.values()].some((other) => overlaps(other, spot))) spot.y += NODE_HEIGHT + LAYOUT_GAPS.LR.sibling;
    placed.set(id, spot);
  }
  const all = [...placed.values()];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxX = Math.max(...all.map((p) => p.x)) + NODE_WIDTH;
  const maxY = Math.max(...all.map((p) => p.y)) + NODE_HEIGHT;
  return { direction, positions: placed, width: maxX - minX, height: maxY - minY, routes: new Map(), minX, minY, manual: true };
}

/* ------------------------------------------------------------------ source <-> node mapping */

export interface LineRange {
  start: number;
  end: number;
}

/**
 * 1-based line ranges that belong to a node: its `- id:` entry in the frontmatter and its
 * `## @node:` section in the body. Used to highlight the node in the editor and to map a cursor
 * position back to a node.
 */
export function nodeLineRanges(source: string): Map<string, LineRange[]> {
  const lines = source.split(/\r?\n/);
  const ranges = new Map<string, LineRange[]>();
  const add = (id: string, start: number, end: number) => {
    if (end < start) return;
    const list = ranges.get(id) ?? [];
    list.push({ start, end });
    ranges.set(id, list);
  };

  // Frontmatter: `- id: x` entries inside `nodes:` run until the next entry or a less indented key.
  let frontmatterEnd = -1;
  if (/^---\s*$/.test(lines[0] ?? "")) {
    for (let i = 1; i < lines.length; i += 1) {
      if (/^---\s*$/.test(lines[i])) {
        frontmatterEnd = i;
        break;
      }
    }
  }
  let current: { id: string; start: number; indent: number } | null = null;
  for (let i = 1; i < frontmatterEnd; i += 1) {
    const line = lines[i];
    const entry = /^(\s*)- id:\s*["']?([A-Za-z0-9_-]+)["']?\s*$/.exec(line);
    const indent = line.length - line.trimStart().length;
    if (entry) {
      if (current) add(current.id, current.start + 1, i);
      current = { id: entry[2], start: i, indent: entry[1].length };
      continue;
    }
    if (current && line.trim() !== "" && indent <= current.indent) {
      add(current.id, current.start + 1, i);
      current = null;
    }
  }
  if (current) add(current.id, current.start + 1, frontmatterEnd);

  // Body sections: from the heading to the line before the next section heading.
  let section: { id: string; start: number } | null = null;
  let fence: string | null = null;
  for (let i = Math.max(0, frontmatterEnd + 1); i < lines.length; i += 1) {
    const fenceMatch = /^[ \t]*(```+|~~~+)/.exec(lines[i]);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
    }
    const heading = fence === null ? NODE_SECTION_PATTERN.exec(lines[i]) : null;
    if (heading) {
      if (section) add(section.id, section.start + 1, trimTrailingBlank(lines, i - 1) + 1);
      section = { id: heading[1], start: i };
    }
  }
  if (section) add(section.id, section.start + 1, trimTrailingBlank(lines, lines.length - 1) + 1);
  return ranges;
}

function trimTrailingBlank(lines: string[], index: number): number {
  let i = index;
  while (i > 0 && lines[i].trim() === "") i -= 1;
  return i;
}

/** The node whose frontmatter entry or prompt section contains the given 1-based line. */
export function nodeAtLine(source: string, line: number): string | null {
  for (const [id, list] of nodeLineRanges(source)) {
    if (list.some((range) => line >= range.start && line <= range.end)) return id;
  }
  return null;
}
