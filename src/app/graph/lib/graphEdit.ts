/**
 * Edits a graph skill by operations instead of by rewriting the file: set a step's fields, connect two
 * steps, define a contract, rename a step. The connector's edit_graph tool, so Claude changes one field
 * with a few hundred characters and the serializer, not Claude, writes the YAML.
 *
 * Operations apply in order and all or nothing: the first one that cannot apply is reported, and the
 * source comes back unchanged. Field values go through the parser's own normalization (`nodeFromEntry`).
 */
import {
  CONTRACT_FORMATS,
  NODE_TYPES,
  addEdge,
  descendantsOf,
  getContract,
  isUsableContractName,
  isValidNodeId,
  nodeFromEntry,
  nodeToEntry,
  parseGraphSkill,
  removeEdge,
  removeNode,
  renameNode,
  serializeGraphSkill,
  setEdgeContract,
  updateContract,
  updateEdge,
  DEFAULT_MAX_LESSONS,
  LOOP_ITERATIONS_CAP,
  MAX_LESSONS_CAP,
  type ContractFormat,
  type GraphNode,
  type SkillGraph,
} from "./graphSkill";

export const MAX_EDIT_OPERATIONS = 100;

export const EDIT_OPERATIONS = ["set_step", "remove_step", "rename_step", "set_prompt", "connect", "disconnect", "set_contract", "remove_contract", "set_skill"] as const;

/** Step fields an edit may set, in the file's own names. `null` removes a field. */
export const STEP_FIELDS = [
  "type",
  "label",
  "model",
  "tools",
  "isolated_context",
  "output_format",
  "gate",
  "on_fail",
  "max_retries",
  "retry_target",
  "run",
  "check",
  "risk",
  "handoff",
  "foreach",
  "max_parallel",
  "max_items",
  "probe",
  "probe_hints",
  "loop",
] as const;

export interface EditResult {
  source: string;
  graph: SkillGraph;
  /** One line per operation, saying what it did. */
  applied: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Sets fields on a step, creating it when it does not exist. Returns what is wrong as a string. */
function setStep(graph: SkillGraph, op: Record<string, unknown>): { graph: SkillGraph; line: string } | string {
  const id = str(op.id);
  if (!id || !isValidNodeId(id)) return "id must start with a letter and use only letters, digits, _ or -.";
  const fields = op.fields === undefined ? {} : op.fields;
  if (!isRecord(fields)) return "fields must be an object of step fields, e.g. {\"model\": \"opus\", \"check\": \"npm test\"}.";
  // A misnamed key (patch, changes, set…) would otherwise apply nothing and still read as a success.
  if (op.fields === undefined && op.after === undefined && graph.nodes.some((node) => node.id === id)) {
    const stray = Object.keys(op).filter((key) => key !== "op" && key !== "id");
    return `set_step on "${id}" changes nothing: put the changes under fields${stray.length > 0 ? ` (not ${stray.join(", ")})` : ""}, e.g. {"op": "set_step", "id": "${id}", "fields": {"model": "opus"}}.`;
  }
  const unknown = Object.keys(fields).filter((key) => !(STEP_FIELDS as readonly string[]).includes(key) && key !== "prompt");
  if (unknown.length > 0) return `unknown field${unknown.length === 1 ? "" : "s"} ${unknown.join(", ")}. Step fields: ${STEP_FIELDS.join(", ")}, prompt.`;
  if (fields.type === null) return "type cannot be cleared; every step has one.";
  if (fields.type !== undefined && !(NODE_TYPES as readonly unknown[]).includes(fields.type)) return `type must be one of ${NODE_TYPES.join(", ")}.`;
  if (fields.label === null || fields.label === "") return "label cannot be empty; clear it with the step's id, or leave it out.";

  const existing = graph.nodes.find((node) => node.id === id);
  if (!existing && (fields.type === undefined || fields.type === null)) return `there is no step "${id}"; to add it, give fields.type (and after: the steps it reads from).`;
  const entry: Record<string, unknown> = existing ? nodeToEntry(existing) : { id };
  for (const [key, value] of Object.entries(fields)) {
    if (key === "prompt") continue;
    if (value === null) delete entry[key];
    else entry[key] = value;
  }
  if (fields.prompt !== undefined && fields.prompt !== null && typeof fields.prompt !== "string") return "prompt must be text.";
  const prompt = typeof fields.prompt === "string" ? fields.prompt.trim() : fields.prompt === null ? "" : (existing?.prompt ?? "");
  const node = nodeFromEntry(entry, prompt);

  // A value the parser cannot read would vanish silently; say so instead.
  const written = nodeToEntry(node);
  const dropped = Object.entries(fields).filter(([key, value]) => key !== "prompt" && value !== null && written[key] === undefined && !(key === "isolated_context" && value === false));
  if (dropped.length > 0) return `${dropped.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ")} ${dropped.length === 1 ? "is not a value it can take" : "are not values they can take"}. get_graph_format lists each field's values.`;
  // The parser caps numbers from hand-written files; an edit asking for more is refused, not quietly capped.
  const capped = Object.entries(fields).filter(([key, value]) => typeof value === "number" && typeof written[key] === "number" && written[key] !== value);
  if (capped.length > 0) return `${capped.map(([key, value]) => `${key}: ${String(value)} is out of range (the most it takes is ${String(written[key])})`).join(", ")}.`;
  const loopAsked = isRecord(fields.loop) ? fields.loop.max_iterations : undefined;
  const loopWritten = isRecord(written.loop) ? written.loop.max_iterations : undefined;
  if (typeof loopAsked === "number" && loopWritten !== loopAsked) return `loop.max_iterations: ${String(loopAsked)} is out of range (1 to ${String(loopWritten ?? LOOP_ITERATIONS_CAP)}).`;

  let next: SkillGraph = existing ? { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? node : n)) } : { ...graph, nodes: [...graph.nodes, node] };
  const after = op.after;
  if (after !== undefined) {
    if (!Array.isArray(after) || after.some((item) => typeof item !== "string")) return "after must be a list of step ids.";
    for (const from of after as string[]) {
      const problem = connectProblem(next, from, id);
      if (problem) return problem;
      next = addEdge(next, from, id);
    }
  }
  const changed = Object.keys(fields);
  return { graph: next, line: existing ? `set ${changed.join(", ") || "nothing"} on ${id}` : `added ${node.type} step ${id}${Array.isArray(after) && after.length > 0 ? ` after ${(after as string[]).join(", ")}` : ""}` };
}

function connectProblem(graph: SkillGraph, from: string, to: string): string | null {
  const source = graph.nodes.find((node) => node.id === from);
  const target = graph.nodes.find((node) => node.id === to);
  if (!source) return `there is no step "${from}".`;
  if (!target) return `there is no step "${to}".`;
  if (from === to) return "a step cannot feed itself; to repeat a step, set loop on it.";
  if (target.type === "input") return `"${to}" is the input; nothing feeds it.`;
  if (descendantsOf(graph, to).has(from)) return `"${from}" runs after "${to}", so this edge would make a cycle. To send work back, give the later step on_fail: retry and retry_target.`;
  return null;
}

function setContract(graph: SkillGraph, op: Record<string, unknown>): { graph: SkillGraph; line: string } | string {
  const name = str(op.name);
  if (!name || !isUsableContractName(name)) return "name is required: the contract's name, e.g. findings_json.";
  const previous = getContract(graph, name);
  const format = op.format === undefined ? (previous?.format ?? "markdown") : op.format;
  if (typeof format !== "string" || !(CONTRACT_FORMATS as readonly string[]).includes(format)) return `format must be one of ${CONTRACT_FORMATS.join(", ")}.`;
  if (op.required !== undefined && op.required !== null && (!Array.isArray(op.required) || op.required.some((key) => typeof key !== "string"))) return "required must be a list of key names.";
  if (op.check !== undefined && op.check !== null && typeof op.check !== "string") return "check must be a shell command with {{payload}} where the file path goes.";
  const description = op.description === undefined ? (previous?.description ?? "") : typeof op.description === "string" ? op.description.trim() : "";
  const required = op.required === null ? undefined : Array.isArray(op.required) ? (op.required as string[]).map((key) => key.trim()).filter(Boolean) : previous?.required;
  const check = op.check === null ? undefined : typeof op.check === "string" ? op.check.trim() || undefined : previous?.check;
  return {
    graph: updateContract(graph, name, { format: format as ContractFormat, description, ...(required && required.length > 0 ? { required } : {}), ...(check ? { check } : {}) }),
    line: `${previous ? "updated" : "defined"} contract ${name} (${format})`,
  };
}

function setSkill(graph: SkillGraph, op: Record<string, unknown>): { graph: SkillGraph; line: string } | string {
  const next = { ...graph };
  const changed: string[] = [];
  if (op.name !== undefined) {
    const name = str(op.name);
    if (!name) return "name must be text.";
    next.name = name.slice(0, 64);
    changed.push("name");
  }
  if (op.description !== undefined) {
    if (typeof op.description !== "string") return "description must be text.";
    next.description = op.description.trim();
    changed.push("description");
  }
  if (op.handoff !== undefined) {
    if (op.handoff !== null && op.handoff !== "inline" && op.handoff !== "file") return "handoff must be inline, file or null.";
    next.handoff = op.handoff === "file" ? "file" : op.handoff === "inline" ? "inline" : undefined;
    changed.push("handoff");
  }
  if (op.experience !== undefined) {
    if (op.experience !== null && typeof op.experience !== "boolean" && !(typeof op.experience === "number" && Number.isInteger(op.experience))) {
      return "experience must be true, false, or the most lessons to keep (1 to 50).";
    }
    next.experience =
      op.experience === true ? { maxLessons: graph.experience?.maxLessons ?? DEFAULT_MAX_LESSONS } : typeof op.experience === "number" ? { maxLessons: Math.max(1, Math.min(MAX_LESSONS_CAP, op.experience)) } : undefined;
    changed.push("experience");
  }
  if (changed.length === 0) return "give at least one of name, description, handoff, experience.";
  return { graph: next, line: `set ${changed.join(", ")} on the skill` };
}

function applyOne(graph: SkillGraph, op: Record<string, unknown>): { graph: SkillGraph; line: string } | string {
  const has = (id: string) => graph.nodes.some((node: GraphNode) => node.id === id);
  switch (op.op) {
    case "set_step":
      return setStep(graph, op);
    case "remove_step": {
      const id = str(op.id);
      if (!id || !has(id)) return `there is no step "${String(op.id ?? "")}".`;
      return { graph: removeNode(graph, id), line: `removed ${id} and its edges` };
    }
    case "rename_step": {
      const id = str(op.id);
      const to = str(op.to);
      if (!id || !has(id)) return `there is no step "${String(op.id ?? "")}".`;
      if (!to || !isValidNodeId(to)) return "to must be a new id: a letter, then letters, digits, _ or -.";
      if (has(to)) return `"${to}" is already a step.`;
      return { graph: renameNode(graph, id, to), line: `renamed ${id} to ${to}, with every reference to it` };
    }
    case "set_prompt": {
      const id = str(op.id);
      if (!id || !has(id)) return `there is no step "${String(op.id ?? "")}".`;
      if (typeof op.prompt !== "string") return "prompt must be text.";
      const prompt = op.prompt.trim();
      return { graph: { ...graph, nodes: graph.nodes.map((node) => (node.id === id ? { ...node, prompt } : node)) }, line: `rewrote the prompt of ${id}` };
    }
    case "connect": {
      const from = str(op.from) ?? "";
      const to = str(op.to) ?? "";
      const problem = connectProblem(graph, from, to);
      if (problem) return problem;
      if (op.contract !== undefined && typeof op.contract !== "string") return "contract must be a contract name.";
      let next = addEdge(graph, from, to);
      const contract = typeof op.contract === "string" ? op.contract.trim() : "";
      if (contract) {
        if (!isUsableContractName(contract)) return `"${contract}" cannot be a contract name.`;
        next = setEdgeContract(next, from, to, contract);
      }
      return { graph: next, line: `connected ${from} → ${to}${contract ? ` with contract ${contract}` : ""}` };
    }
    case "disconnect": {
      const from = str(op.from) ?? "";
      const to = str(op.to) ?? "";
      if (!graph.edges.some((edge) => edge.from === from && edge.to === to)) return `there is no edge ${from} → ${to}.`;
      return { graph: removeEdge(graph, from, to), line: `removed the edge ${from} → ${to}` };
    }
    case "set_contract": {
      const result = setContract(graph, op);
      if (typeof result === "string") return result;
      // Optionally put it on edges in the same operation.
      if (op.on !== undefined) {
        if (!Array.isArray(op.on) || op.on.some((edge) => !isRecord(edge) || typeof edge.from !== "string" || typeof edge.to !== "string")) return "on must be a list of {from, to} edges.";
        let next = result.graph;
        for (const edge of op.on as { from: string; to: string }[]) {
          if (!next.edges.some((e) => e.from === edge.from && e.to === edge.to)) return `there is no edge ${edge.from} → ${edge.to} to put the contract on.`;
          next = updateEdge(next, edge.from, edge.to, str(op.name));
        }
        return { graph: next, line: `${result.line}, on ${(op.on as { from: string; to: string }[]).map((edge) => `${edge.from} → ${edge.to}`).join(", ")}` };
      }
      return result;
    }
    case "remove_contract": {
      const name = str(op.name);
      if (!name || !getContract(graph, name)) return `there is no contract "${String(op.name ?? "")}".`;
      const next = updateContract(graph, name, null);
      return { graph: { ...next, edges: next.edges.map((edge) => (edge.contract === name ? { ...edge, contract: undefined } : edge)) }, line: `removed contract ${name} and took it off its edges` };
    }
    case "set_skill":
      return setSkill(graph, op);
    default:
      return `op must be one of ${EDIT_OPERATIONS.join(", ")}.`;
  }
}

/** Applies the operations in order, all or nothing. */
export function editGraph(source: string, operations: unknown): EditResult | { error: string } {
  const parsed = parseGraphSkill(source);
  if (!parsed.graph) return { error: `The file could not be read: ${parsed.fatal ?? "unknown problem"}. Fix the frontmatter first, or start from draft_graph.` };
  if (!Array.isArray(operations) || operations.length === 0) return { error: "operations is required: a list of edits, e.g. [{\"op\": \"set_step\", \"id\": \"implement\", \"fields\": {\"model\": \"opus\"}}]." };
  if (operations.length > MAX_EDIT_OPERATIONS) return { error: `At most ${MAX_EDIT_OPERATIONS} operations per call.` };
  let graph = parsed.graph;
  const applied: string[] = [];
  for (const [index, op] of operations.entries()) {
    if (!isRecord(op)) return { error: `Operation ${index + 1} must be an object with op.` };
    const result = applyOne(graph, op);
    if (typeof result === "string") return { error: `Operation ${index + 1} (${String(op.op ?? "no op")}) did not apply: ${result} Nothing was changed.` };
    graph = result.graph;
    applied.push(result.line);
  }
  return { source: serializeGraphSkill(graph), graph, applied };
}
