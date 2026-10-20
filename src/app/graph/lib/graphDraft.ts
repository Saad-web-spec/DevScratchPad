/**
 * Drafts a graph skill from a plain outline: a name, what it is for, and its steps, each with what it
 * does and which steps it reads from. The connector's draft_graph tool: Claude turns the user's goal
 * into the outline, and this writes the graph.skill.md format (frontmatter, edges, contracts, prompts
 * with references), so a first graph needs no knowledge of the format.
 */
import {
  MODEL_PATTERN,
  RISK_LANES,
  TOOL_PATTERN,
  CONTRACT_KEY_PATTERN,
  isValidNodeId,
  serializeGraphSkill,
  type Contract,
  type GraphEdge,
  type GraphNode,
  type NodeType,
  type RiskLane,
  type SkillGraph,
} from "./graphSkill";

export const DRAFT_STEP_TYPES = ["orchestrator", "worker", "verifier", "synthesizer", "agent", "code", "approval"] as const;
type DraftStepType = (typeof DRAFT_STEP_TYPES)[number];

/** The input node every draft starts from; steps with no `after` read it. */
export const DRAFT_INPUT_ID = "request";
export const MAX_DRAFT_STEPS = 50;
const MAX_TEXT = 4_000;

/** Read-only tools: a step gets more only when the outline asks for them. */
const DEFAULT_TOOLS: readonly string[] = ["Read", "Grep", "Glob"];
const DEFAULT_MODEL: Record<DraftStepType, string | undefined> = {
  orchestrator: "sonnet",
  worker: "sonnet",
  verifier: "opus",
  synthesizer: "sonnet",
  agent: "sonnet",
  code: undefined,
  approval: undefined,
};
const DEFAULT_GATE = "Every requirement in the request is met, and every claim is backed by the inputs.";

interface DraftStep {
  id: string;
  type: DraftStepType;
  label?: string;
  task: string;
  after: string[];
  returns?: string;
  format?: "json" | "markdown" | "text";
  keys?: string[];
  gate?: string;
  onFail?: "retry" | "stop";
  tools?: string[];
  model?: string;
  freshContext?: boolean;
  risk?: RiskLane;
}

export interface DraftResult {
  source: string;
  /** What the draft filled in that the outline did not say, so the user can check it. */
  notes: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max = MAX_TEXT): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : undefined;
}

function strings(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim()) : undefined;
}

function labelFor(id: string): string {
  return id.replace(/[_-]+/g, " ").toUpperCase();
}

/** Reads one step of the outline, or says what is wrong with it. */
function readStep(raw: unknown, index: number): DraftStep | string {
  const where = `steps[${index}]`;
  if (!isRecord(raw)) return `${where} must be an object with id, type and task.`;
  const id = text(raw.id, 64);
  if (!id || !isValidNodeId(id)) return `${where}.id must start with a letter and use only letters, digits, _ or - (got ${JSON.stringify(raw.id ?? null)}).`;
  if (id === DRAFT_INPUT_ID) return `${where}.id: "${DRAFT_INPUT_ID}" is the input every draft starts from; pick another id.`;
  const type = raw.type;
  if (typeof type !== "string" || !(DRAFT_STEP_TYPES as readonly string[]).includes(type)) return `${where}.type must be one of ${DRAFT_STEP_TYPES.join(", ")}.`;
  const task = text(raw.task);
  if (!task) return `${where}.task is required: what the step does (for a code step, the command to run).`;
  const format = raw.format;
  if (format !== undefined && format !== "json" && format !== "markdown" && format !== "text") return `${where}.format must be json, markdown or text.`;
  const keys = strings(raw.keys);
  if (keys?.some((key) => !CONTRACT_KEY_PATTERN.test(key))) return `${where}.keys must be plain names (letters, digits, _ or -).`;
  const tools = strings(raw.tools);
  if (tools?.some((tool) => !TOOL_PATTERN.test(tool))) return `${where}.tools has an invalid tool name. Use Claude Code tool names such as Read, Grep, WebSearch or Bash.`;
  const model = text(raw.model, 80);
  if (model && !MODEL_PATTERN.test(model)) return `${where}.model must be haiku, sonnet, opus, fable or a model id.`;
  const risk = raw.risk;
  if (risk !== undefined && !(RISK_LANES as readonly unknown[]).includes(risk)) return `${where}.risk must be one of ${RISK_LANES.join(", ")}.`;
  const onFail = raw.on_fail;
  if (onFail !== undefined && onFail !== "retry" && onFail !== "stop") return `${where}.on_fail must be retry or stop.`;
  return {
    id,
    type: type as DraftStepType,
    label: text(raw.label, 80),
    task,
    after: strings(raw.after) ?? [],
    returns: text(raw.returns, 600),
    format: format as DraftStep["format"],
    keys,
    gate: text(raw.gate, 600),
    onFail: onFail as DraftStep["onFail"],
    tools,
    model,
    freshContext: typeof raw.fresh_context === "boolean" ? raw.fresh_context : undefined,
    risk: risk as RiskLane | undefined,
  };
}

/** Builds the draft, or returns what is wrong with the outline. */
export function draftGraph(args: Record<string, unknown>): DraftResult | { error: string } {
  const name = text(args.name, 64);
  if (!name) return { error: "name is required: a short skill name, e.g. receipt-scanner." };
  const description = text(args.description, 600);
  if (!description) return { error: "description is required: what the skill does and when to use it, in a sentence." };
  if (!Array.isArray(args.steps) || args.steps.length === 0) return { error: "steps is required: at least one step, each with id, type and task." };
  if (args.steps.length > MAX_DRAFT_STEPS) return { error: `A draft can have at most ${MAX_DRAFT_STEPS} steps.` };

  const steps: DraftStep[] = [];
  for (const [index, raw] of args.steps.entries()) {
    const step = readStep(raw, index);
    if (typeof step === "string") return { error: step };
    if (steps.some((other) => other.id === step.id)) return { error: `Two steps have the id "${step.id}". Step ids must be unique.` };
    steps.push(step);
  }
  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    const unknown = step.after.filter((id) => id !== DRAFT_INPUT_ID && !ids.has(id));
    if (unknown.length > 0) return { error: `Step "${step.id}" reads from ${unknown.map((id) => `"${id}"`).join(", ")}, which ${unknown.length === 1 ? "is not a step" : "are not steps"}. Use the ids of other steps, or leave after empty to read the request.` };
  }

  const notes: string[] = [];
  const readOnlySteps: string[] = [];
  const parents = (step: DraftStep) => (step.after.length > 0 ? [...new Set(step.after)] : [DRAFT_INPUT_ID]);
  const childCount = (id: string) => steps.filter((step) => parents(step).includes(id)).length;
  const byId = new Map(steps.map((step) => [step.id, step]));
  // An orchestrator that feeds several steps hands each its own task: JSON keyed by step id.
  const splits = (step: DraftStep) => step.type === "orchestrator" && childCount(step.id) > 1 && (step.format === undefined || step.format === "json");

  const contracts: Record<string, Contract> = {};
  const contractOf = new Map<string, string>();
  for (const step of steps) {
    // A contract lives on edges; the last step says what it returns in its prompt instead.
    if (step.type === "approval" || childCount(step.id) === 0) continue;
    if (splits(step)) {
      contracts[`${step.id}_tasks`] = { format: "json", description: step.returns ?? "One key per step id; each value is that step's task in one or two sentences." };
      contractOf.set(step.id, `${step.id}_tasks`);
    } else if (step.returns || step.format || step.keys) {
      const format = step.format ?? (step.keys && step.keys.length > 0 ? "json" : "markdown");
      contracts[`${step.id}_output`] = {
        format,
        description: step.returns ?? `The output of ${step.label ?? labelFor(step.id)}.`,
        ...(format === "json" && step.keys && step.keys.length > 0 ? { required: step.keys } : {}),
      };
      contractOf.set(step.id, `${step.id}_output`);
    }
  }

  const nodes: GraphNode[] = [{ id: DRAFT_INPUT_ID, type: "input", label: text(args.input_label, 80) ?? "REQUEST", isolatedContext: false, prompt: "" }];
  const edges: GraphEdge[] = [];
  for (const step of steps) {
    for (const from of parents(step)) edges.push({ from, to: step.id, ...(contractOf.has(from) ? { contract: contractOf.get(from) } : {}) });
    const label = step.label ?? labelFor(step.id);
    const node: GraphNode = { id: step.id, type: step.type as NodeType, label, isolatedContext: false, prompt: "" };
    if (step.risk) node.risk = step.risk;
    if (step.type === "code") {
      node.run = step.task;
      if (step.onFail) node.onFail = step.onFail;
      nodes.push(node);
      continue;
    }
    if (step.type === "approval") {
      node.prompt = step.task;
      nodes.push(node);
      continue;
    }

    node.model = step.model ?? DEFAULT_MODEL[step.type];
    node.tools = step.tools && step.tools.length > 0 ? step.tools : [...DEFAULT_TOOLS];
    if (!step.tools || step.tools.length === 0) readOnlySteps.push(step.id);
    const verifier = step.type === "verifier";
    node.isolatedContext = step.freshContext ?? verifier;
    if (verifier || step.gate) {
      node.gate = step.gate ?? DEFAULT_GATE;
      if (!step.gate) notes.push(`${step.id}: no gate was given, so it got a general one; say what must be true for this work to pass.`);
      const reworkable = parents(step).some((id) => {
        const parent = byId.get(id);
        return parent !== undefined && parent.type !== "code" && parent.type !== "approval";
      });
      node.onFail = step.onFail ?? (reworkable ? "retry" : "stop");
      if (node.onFail === "retry") node.maxRetries = 1;
    } else if (step.onFail) node.onFail = step.onFail;
    if (step.format === "text" || (step.format === "json" && !contractOf.has(step.id))) node.outputFormat = step.format;

    // The prompt names every input with a reference, so the compiled step knows where each one is.
    const sections = [step.task];
    if (step.returns && !contractOf.has(step.id)) sections.push(`Return ${step.returns.replace(/^return\s+/i, "")}`);
    const readsRequest = parents(step).includes(DRAFT_INPUT_ID);
    if (readsRequest || verifier) sections.push(`The request:\n{{goal}}`);
    for (const from of parents(step)) {
      if (from === DRAFT_INPUT_ID) continue;
      const parent = byId.get(from) as DraftStep;
      sections.push(splits(parent) ? `Your task:\n{{${from}.${step.id}}}` : `${parent.label ?? labelFor(from)}:\n{{${from}}}`);
    }
    node.prompt = sections.join("\n\n");
    nodes.push(node);
  }

  if (readOnlySteps.length > 0) {
    notes.unshift(`${readOnlySteps.join(", ")}: no tools were given, so ${readOnlySteps.length === 1 ? "it gets" : "they get"} ${DEFAULT_TOOLS.join(", ")} (read-only). Add what a step needs, e.g. WebSearch, Edit or Bash.`);
  }
  const graph: SkillGraph = { name, description, nodes, edges, contracts, preamble: "# Node Prompts & Edge Contracts", extraFrontmatter: {} };
  return { source: serializeGraphSkill(graph), notes };
}
