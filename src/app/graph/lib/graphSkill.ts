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
  /** `code` nodes: the shell command to run. `{{refs}}` in it become paths of files holding those outputs. */
  run?: string;
  /** A command that must exit 0 once the node is done, so a program (not only a model) decides it passed. */
  check?: string;
  /** Blast radius of the node's work. Unset means contained. */
  risk?: RiskLane;
  /** The node's prompt template (the body of its `## @node:` section). */
  prompt: string;
}

export type ContractFormat = "json" | "markdown" | "text";

/** What a payload on an edge must look like, so the agent can check every handoff. */
export interface Contract {
  format: ContractFormat;
  description: string;
}

export const CONTRACT_FORMATS: readonly ContractFormat[] = ["json", "markdown", "text"];

/** Claude Code tool names offered in the editor; MCP tools (`mcp__server__tool`) are also accepted. */
export const KNOWN_TOOLS: readonly string[] = ["Read", "Grep", "Glob", "Edit", "Write", "Bash", "WebSearch", "WebFetch"];

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

  const { name, description, topology, contracts: rawContracts, spec: _spec, ...extraFrontmatter } = data;
  void _spec;
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
      run: typeof raw.run === "string" && raw.run.trim() ? raw.run.trim() : undefined,
      check: typeof raw.check === "string" && raw.check.trim() ? raw.check.trim() : undefined,
      risk: typeof raw.risk === "string" && (RISK_LANES as readonly string[]).includes(raw.risk) ? (raw.risk as RiskLane) : undefined,
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
      contracts[contractName] = { format, description: typeof entry.description === "string" ? entry.description.trim() : typeof raw === "string" ? raw.trim() : "" };
    }
  }

  return {
    graph: {
      name: typeof name === "string" ? name : "",
      description: typeof description === "string" ? description : "",
      nodes,
      edges,
      contracts,
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
    if (group) group.tos.push(edge.to);
    else byFrom.set(key, { from: edge.from, tos: [edge.to], contract: edge.contract });
  }

  const merged = new Map<string, { froms: string[]; tos: string[]; contract?: string }>();
  for (const group of byFrom.values()) {
    const key = `${[...group.tos].sort().join("\u0001")}\u0000${group.contract ?? ""}`;
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

/** Serializes the graph back to a Graph SKILL.md (frontmatter topology + one section per node). */
export function serializeGraphSkill(graph: SkillGraph): string {
  const frontmatter: Record<string, unknown> = {
    name: graph.name,
    description: graph.description,
    spec: SPEC_VERSION,
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
        if (node.run) entry.run = node.run;
        if (node.check) entry.check = node.check;
        if (node.risk) entry.risk = node.risk;
        return entry;
      }),
      edges: groupEdges(graph.edges),
    },
  };
  if (Object.keys(graph.contracts).length > 0) {
    frontmatter.contracts = Object.fromEntries(
      Object.entries(graph.contracts).map(([contractName, contract]) => [
        contractName,
        contract.description ? { format: contract.format, description: contract.description } : { format: contract.format },
      ])
    );
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

/** References a node reads: its prompt plus, for `code` nodes, its command. */
export function nodeRefs(node: GraphNode): TemplateRef[] {
  return extractTemplateRefs(node.run ? `${node.prompt}\n${node.run}` : node.prompt);
}

/** Group aliases: `{{workers.output}}` means every node of type `worker`. */
export function groupAlias(type: NodeType): string {
  return `${type}s`;
}

export function resolveGroup(graph: SkillGraph, head: string): GraphNode[] {
  return graph.nodes.filter((node) => groupAlias(node.type) === head);
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

/** True when the node's agent may change files (it lists Edit or Write). */
export function writesFiles(node: GraphNode): boolean {
  return (node.tools ?? []).some((tool) => tool === "Edit" || tool === "Write");
}

/** True when a program, not a model, can fail this node: it has a `check`, or it is a `code` node. */
export function hasCommandCheck(node: GraphNode): boolean {
  return node.check !== undefined || (node.type === "code" && node.run !== undefined);
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
  return wantsJsonOutput(graph, node) && successorsOf(graph, node.id).length > 1;
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
    if (ref.head === "goal") continue;
    if (ref.head === "inputs") {
      total += 1;
      continue;
    }
    const group = ids.has(ref.head) ? [] : resolveGroup(graph, ref.head);
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
      if (ref.head === "goal" || ref.head === "inputs") continue;
      const isNode = ids.has(ref.head);
      const group = isNode ? [] : resolveGroup(graph, ref.head);
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
      if (!KNOWN_TOOLS.includes(tool) && !tool.startsWith("mcp__")) {
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

  issues.push(...validateFlow(graph), ...validateReliability(graph));
  return issues;
}

/** Which direct predecessors a node names in its prompt or command (null: it names none, so it reads them all). */
function readPredecessors(graph: SkillGraph, node: GraphNode): Set<string> | null {
  const preds = predecessorsOf(graph, node.id);
  const read = new Set<string>();
  let explicit = false;
  for (const ref of nodeRefs(node)) {
    if (ref.head === "goal") continue;
    explicit = true;
    if (ref.head === "inputs") preds.forEach((id) => read.add(id));
    else if (graph.nodes.some((n) => n.id === ref.head)) read.add(ref.head);
    else resolveGroup(graph, ref.head).forEach((member) => read.add(member.id));
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
    if (steps.length >= 4 && waves.every((wave) => wave.length <= 1)) {
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
    tools: type === "verifier" ? ["Read", "Grep", "Glob"] : undefined,
    gate: type === "verifier" ? "Every claim cites concrete evidence." : undefined,
    onFail: type === "verifier" ? "retry" : undefined,
    run: type === "code" ? "npm test" : undefined,
    prompt: NEW_NODE_PROMPTS[type],
  };
  const edges = after && type !== "input" ? [...graph.edges, { from: after, to: id }] : graph.edges;
  return { graph: { ...graph, nodes: [...graph.nodes, node], edges }, id };
}

export function removeNode(graph: SkillGraph, id: string): SkillGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== id),
    edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
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
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({ ...node, id: node.id === id ? nextId : node.id, prompt: rewrite(node.prompt), ...(node.run ? { run: rewrite(node.run) } : {}) })),
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
    // A group alias is only safe when every node of that type feeds this step.
    if (members.length > 1 && members.length === resolveGroup(graph, groupAlias(type)).length) {
      inputs.push({ ref: `{{${groupAlias(type)}.output}}`, label: `The outputs of all ${members.length} ${groupAlias(type)}` });
    }
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
export const NODE_HEIGHT = 88;
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
}

/** Layered layout: layers by longest path, siblings ordered by the barycenter of their neighbours. */
export function layoutGraph(graph: SkillGraph, direction: LayoutDirection = "LR"): GraphLayout {
  const layers = computeLayers(graph);
  const columns: string[][] = [];
  for (const node of graph.nodes) (columns[layers.get(node.id) ?? 0] ??= []).push(node.id);
  const dense = columns.filter((column): column is string[] => Array.isArray(column));

  const rowOf = new Map<string, number>();
  dense.forEach((column) => column.forEach((id, index) => rowOf.set(id, index)));

  const sweep = (column: string[], neighbours: (id: string) => string[]) => {
    const score = (id: string): number => {
      const ns = neighbours(id).filter((n) => rowOf.has(n));
      return ns.length === 0 ? (rowOf.get(id) as number) : ns.reduce((sum, n) => sum + (rowOf.get(n) as number), 0) / ns.length;
    };
    column.sort((a, b) => score(a) - score(b));
    column.forEach((id, index) => rowOf.set(id, index));
  };
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < dense.length; i += 1) sweep(dense[i], (id) => predecessorsOf(graph, id));
    for (let i = dense.length - 2; i >= 0; i -= 1) sweep(dense[i], (id) => successorsOf(graph, id));
  }

  // Lay out along a "flow" axis (layers) and a "cross" axis (siblings), then map them to x/y.
  const gaps = LAYOUT_GAPS[direction];
  const flowSize = direction === "LR" ? NODE_WIDTH : NODE_HEIGHT;
  const crossSize = direction === "LR" ? NODE_HEIGHT : NODE_WIDTH;
  const widest = Math.max(1, ...dense.map((column) => column.length));
  const crossExtent = widest * crossSize + (widest - 1) * gaps.sibling;
  const flowExtent = Math.max(1, dense.length) * flowSize + Math.max(0, dense.length - 1) * gaps.layer;

  const positions = new Map<string, NodeLayout>();
  dense.forEach((column, layerIndex) => {
    const columnExtent = column.length * crossSize + (column.length - 1) * gaps.sibling;
    const start = (crossExtent - columnExtent) / 2;
    column.forEach((id, row) => {
      const flow = layerIndex * (flowSize + gaps.layer);
      const cross = start + row * (crossSize + gaps.sibling);
      positions.set(id, direction === "LR" ? { x: flow, y: cross } : { x: cross, y: flow });
    });
  });

  return direction === "LR"
    ? { direction, positions, width: flowExtent, height: crossExtent }
    : { direction, positions, width: crossExtent, height: flowExtent };
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
