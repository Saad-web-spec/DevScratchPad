/**
 * Drafts a graph skill from a plain outline: a name, what it is for, and its steps, each with what it
 * does and which steps it reads from. The connector's draft_graph tool: Claude turns the user's goal
 * into the outline, and this writes the graph.skill.md format (frontmatter, edges, contracts, prompts
 * with references), so a first graph needs no knowledge of the format.
 */
import {
  DEFAULT_MAX_ITERATIONS,
  LOOP_ITERATIONS_CAP,
  LOOP_UNTILS,
  MAX_PROBE_HINT_LENGTH,
  MODEL_PATTERN,
  PROBE_MAX,
  PROBE_MIN,
  RISK_LANES,
  TOOL_PATTERN,
  CONTRACT_KEY_PATTERN,
  DEFAULT_MAX_LESSONS,
  isValidNodeId,
  serializeGraphSkill,
  type Contract,
  type GraphEdge,
  type GraphNode,
  type HandoffMode,
  type LoopSettings,
  type NodeType,
  type RiskLane,
  type SkillGraph,
} from "./graphSkill";

export const DRAFT_STEP_TYPES = ["orchestrator", "worker", "verifier", "synthesizer", "agent", "code", "approval"] as const;
type DraftStepType = (typeof DRAFT_STEP_TYPES)[number];

/** The input node every draft starts from; steps with no `after` read it. */
export const DRAFT_INPUT_ID = "request";
export const MAX_DRAFT_STEPS = 50;
/** A fan-out step without max_items stops and asks past this many items. */
export const DRAFT_MAX_ITEMS = 20;
const MAX_ITEMS_CAP = 1_000;
const MAX_TEXT = 4_000;
const FOREACH_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)?$/;
/** Told to a drafted verifier that feeds later steps, since they see only what it returns. */
const PASS_ON = "The steps after you see only what you return: hand on the checked work itself, corrected where needed, together with your notes.";

/**
 * Tools a model step gets when the outline names none, by where the workflow runs. Both sets only read;
 * a step gets more only when the outline asks for them. A chat has no files or shell, but it has web search.
 */
export const DRAFT_RUNS_IN = ["chat", "claude_code"] as const;
const DEFAULT_TOOLS: Record<(typeof DRAFT_RUNS_IN)[number], readonly string[]> = {
  chat: ["WebSearch", "WebFetch"],
  claude_code: ["Read", "Grep", "Glob"],
};
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
  /** Orchestrators: hand each step it feeds its own task (true), or the same output to all (false). */
  split?: boolean;
  foreach?: string;
  maxItems?: number;
  probe?: number;
  probeHints?: string[];
  check?: string;
  loop?: LoopSettings;
  maxRetries?: number;
  retryTarget?: string;
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
  const split = raw.split;
  if (split !== undefined && typeof split !== "boolean") return `${where}.split must be true or false.`;
  if (split !== undefined && type !== "orchestrator") return `${where}.split only applies to an orchestrator.`;
  if (split === true && keys && keys.length > 0) return `${where}: a split orchestrator returns one key per step it feeds, so it cannot also have keys. Drop keys, or set split: false.`;
  if (split === true && format !== undefined && format !== "json") return `${where}: a split orchestrator returns JSON, one key per step it feeds; drop format or set it to json.`;
  const modelStep = type !== "code" && type !== "approval";
  const foreach = text(raw.foreach, 130);
  if (raw.foreach !== undefined && (!foreach || !FOREACH_PATTERN.test(foreach))) return `${where}.foreach must be <step> or <step>.<key>, e.g. plan.files: the step whose JSON list this step runs over.`;
  if (foreach && !modelStep) return `${where}: only model steps can fan out (foreach); a ${type} step cannot.`;
  const maxItems = raw.max_items;
  if (maxItems !== undefined && (!Number.isInteger(maxItems) || (maxItems as number) < 1 || (maxItems as number) > MAX_ITEMS_CAP)) return `${where}.max_items must be a whole number from 1 to ${MAX_ITEMS_CAP}.`;
  if (maxItems !== undefined && !foreach) return `${where}.max_items only applies to a step with foreach.`;
  const probe = raw.probe;
  if (probe !== undefined && (!Number.isInteger(probe) || (probe as number) < PROBE_MIN || (probe as number) > PROBE_MAX)) return `${where}.probe must be a whole number from ${PROBE_MIN} to ${PROBE_MAX}.`;
  if (probe !== undefined && !modelStep) return `${where}: only model steps can be probed; a ${type} step cannot.`;
  if (probe !== undefined && foreach) return `${where}: a step cannot both fan out and be probed (every item would run ${probe as number} times). Use one or the other.`;
  const probeHints = strings(raw.probe_hints)?.map((hint) => hint.replace(/\s+/g, " ").slice(0, MAX_PROBE_HINT_LENGTH));
  if (probeHints && probe === undefined) return `${where}.probe_hints only applies to a probed step; set probe as well.`;
  if (probeHints && probeHints.length > (probe as number)) return `${where} has ${probeHints.length} probe_hints for ${probe as number} candidates; give at most one per candidate.`;
  const check = text(raw.check, 400);
  if (raw.check !== undefined && !check) return `${where}.check must be a shell command, e.g. npm test.`;
  if (check && !modelStep) return `${where}: a ${type} step has no check; for a code step, its command is the task.`;
  const loop = readLoop(raw.loop);
  if (typeof loop === "string") return `${where}.loop ${loop}`;
  if (loop && !modelStep) return `${where}: only model steps can loop; a ${type} step cannot.`;
  if (loop?.until === "check" && !check) return `${where}: loops until its check passes, so it needs check (e.g. npm test).`;
  if (loop?.until === "gate" && !raw.gate && type !== "verifier") return `${where}: loops until its gate passes, so it needs gate: what must be true for the work to pass.`;
  if (loop && probe !== undefined) return `${where}: a step cannot both loop and be probed (every iteration would run ${probe as number} candidates). Use one or the other.`;
  if (loop && foreach) return `${where}: a step cannot both fan out and loop. Loop a step after the fan-out instead.`;
  if (loop && risk === "irreversible") return `${where}: an irreversible step cannot loop; one approval would cover every iteration.`;
  const maxRetries = raw.max_retries;
  if (maxRetries !== undefined && (!Number.isInteger(maxRetries) || (maxRetries as number) < 0 || (maxRetries as number) > 3)) return `${where}.max_retries must be a whole number from 0 to 3.`;
  const retryTarget = text(raw.retry_target, 64);
  if (raw.retry_target !== undefined && (!retryTarget || !isValidNodeId(retryTarget))) return `${where}.retry_target must be the id of a step before it.`;
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
    split: split as boolean | undefined,
    foreach,
    maxItems: maxItems as number | undefined,
    probe: probe as number | undefined,
    probeHints,
    check,
    loop,
    maxRetries: maxRetries as number | undefined,
    retryTarget,
  };
}

/** `loop: "check"` or `{until, max_iterations, ledger}`; returns what is wrong as a string. */
function readLoop(raw: unknown): LoopSettings | undefined | string {
  if (raw === undefined) return undefined;
  const until = typeof raw === "string" ? raw : isRecord(raw) ? raw.until : undefined;
  if (typeof until !== "string" || !(LOOP_UNTILS as readonly string[]).includes(until)) return `must say what ends it: until check, gate or done.`;
  const entry = isRecord(raw) ? raw : {};
  const max = entry.max_iterations;
  if (max !== undefined && (!Number.isInteger(max) || (max as number) < 1 || (max as number) > LOOP_ITERATIONS_CAP)) return `max_iterations must be a whole number from 1 to ${LOOP_ITERATIONS_CAP}.`;
  if (entry.ledger !== undefined && typeof entry.ledger !== "boolean") return "ledger must be true or false.";
  return { until: until as LoopSettings["until"], maxIterations: (max as number | undefined) ?? DEFAULT_MAX_ITERATIONS, ledger: entry.ledger !== false };
}

/** The step and key a fan-out step's `foreach` names. */
function listOf(step: DraftStep): { from: string; key: string } | null {
  if (!step.foreach) return null;
  const dot = step.foreach.indexOf(".");
  return dot === -1 ? { from: step.foreach, key: "" } : { from: step.foreach.slice(0, dot), key: step.foreach.slice(dot + 1) };
}

function listing(ids: string[]): string {
  return ids.length <= 1 ? (ids[0] ?? "") : `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}`;
}

/** Builds the draft, or returns what is wrong with the outline. */
export function draftGraph(args: Record<string, unknown>): DraftResult | { error: string } {
  const name = text(args.name, 64);
  if (!name) return { error: "name is required: a short skill name, e.g. receipt-scanner." };
  const description = text(args.description, 600);
  if (!description) return { error: "description is required: what the skill does and when to use it, in a sentence." };
  const handoff = args.handoff;
  if (handoff !== undefined && handoff !== "inline" && handoff !== "file") return { error: "handoff must be inline (outputs pasted into the next step's task) or file (saved to files the next steps read)." };
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
    if (step.retryTarget && !ids.has(step.retryTarget)) return { error: `Step "${step.id}" restarts at "${step.retryTarget}", which is not a step. Use the id of a step that runs before it.` };
  }
  const experience = args.experience;
  if (experience !== undefined && typeof experience !== "boolean") return { error: "experience must be true (learn from failed checks between runs) or false." };
  const runsIn = args.runs_in ?? "chat";
  if (runsIn !== "chat" && runsIn !== "claude_code") return { error: "runs_in must be chat (the Claude app) or claude_code (a repository)." };
  const defaultTools = DEFAULT_TOOLS[runsIn];

  const notes: string[] = [];
  const readOnlySteps: string[] = [];
  const parents = (step: DraftStep) => (step.after.length > 0 ? [...new Set(step.after)] : [DRAFT_INPUT_ID]);
  const childrenOf = (id: string) => steps.filter((step) => parents(step).includes(id));
  const childCount = (id: string) => childrenOf(id).length;
  const byId = new Map(steps.map((step) => [step.id, step]));

  // A fan-out step runs over a JSON list that a step it reads returns.
  for (const step of steps) {
    const list = listOf(step);
    if (!list) continue;
    if (!step.after.includes(list.from)) return { error: `Step "${step.id}" fans out over "${step.foreach}", so "${list.from}" must be in its after.` };
    const source = byId.get(list.from);
    if (!source) return { error: `Step "${step.id}" fans out over the request, which is plain text. Add a step that turns it into a JSON list, and fan out over that.` };
    if (source.type === "code" || source.type === "approval") return { error: `Step "${step.id}" fans out over "${list.from}", a ${source.type} step. Fan out over a model step that returns a JSON list.` };
    if (source.format && source.format !== "json") return { error: `Step "${step.id}" fans out over "${list.from}", which returns ${source.format}; a fan-out needs a JSON list. Set its format to json.` };
    if (list.key && source.keys && !source.keys.includes(list.key)) return { error: `Step "${step.id}" fans out over "${step.foreach}", but "${list.from}" has no "${list.key}" among its keys (${source.keys.join(", ")}).` };
  }

  // An orchestrator that feeds several steps hands each its own task (JSON keyed by step id), unless the
  // outline says what it returns: then it is data, and every step it feeds reads the whole of it.
  const splitting = new Set(
    steps
      .filter((step) => step.type === "orchestrator" && childCount(step.id) > 1 && (step.split ?? (!step.keys && !step.returns && (step.format === undefined || step.format === "json"))))
      .map((step) => step.id)
  );
  for (const step of steps) {
    const list = listOf(step);
    if (list && !list.key && splitting.has(list.from)) {
      return { error: `Step "${step.id}" fans out over all of "${list.from}", but "${list.from}" hands each step it feeds its own key. Use foreach: ${list.from}.<key>, or set split: false on "${list.from}".` };
    }
  }
  /** The key of a split orchestrator's JSON a step reads: its list when it fans out over it, else its task. */
  const sliceKey = (step: DraftStep, from: string) => {
    const list = listOf(step);
    return list?.from === from ? list.key : step.id;
  };

  const contracts: Record<string, Contract> = {};
  const contractOf = new Map<string, string>();
  for (const step of steps) {
    // A contract lives on edges; the last step says what it returns in its prompt instead.
    if (step.type === "approval" || childCount(step.id) === 0) continue;
    const listKeys = steps.flatMap((child) => {
      const list = listOf(child);
      return list?.from === step.id ? [list.key] : [];
    });
    if (splitting.has(step.id)) {
      const children = childrenOf(step.id);
      const keys = [...new Set(children.map((child) => sliceKey(child, step.id)))];
      const tasks = children.filter((child) => sliceKey(child, step.id) === child.id).map((child) => child.id);
      const lists = children.filter((child) => sliceKey(child, step.id) !== child.id).map((child) => `${sliceKey(child, step.id)} is the JSON list ${child.id} runs over`);
      const shape = [tasks.length > 0 ? `${listing(tasks)} ${tasks.length === 1 ? "gets its" : "each get their"} own task in one or two sentences` : "", ...lists].filter(Boolean).join("; ");
      contracts[`${step.id}_tasks`] = {
        format: "json",
        description: `${step.returns ? `${step.returns.replace(/\.$/, "")}. ` : ""}One key per step it feeds (${keys.join(", ")}): ${shape}.`,
        required: keys,
      };
      contractOf.set(step.id, `${step.id}_tasks`);
    } else if (step.returns || step.format || step.keys || listKeys.length > 0) {
      const format = listKeys.length > 0 ? "json" : (step.format ?? (step.keys && step.keys.length > 0 ? "json" : "markdown"));
      const required = step.keys && step.keys.length > 0 ? step.keys : [...new Set(listKeys.filter(Boolean))];
      const listDescription =
        required.length > 0
          ? `A JSON object whose ${listing(required)} ${required.length === 1 ? "is the list" : "are the lists"} the steps after it run over, one entry per item.`
          : "A JSON array, one entry per item the step after it runs over.";
      contracts[`${step.id}_output`] = {
        format,
        description: step.returns ?? (listKeys.length > 0 ? listDescription : `The output of ${step.label ?? labelFor(step.id)}.`),
        ...(format === "json" && required.length > 0 ? { required } : {}),
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
    node.tools = step.tools && step.tools.length > 0 ? step.tools : [...defaultTools];
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
    const list = listOf(step);
    if (list) {
      node.foreach = step.foreach;
      node.maxItems = step.maxItems ?? DRAFT_MAX_ITEMS;
      if (step.maxItems === undefined) notes.push(`${step.id}: fans out over at most ${DRAFT_MAX_ITEMS} items, then stops and asks; set max_items to change that.`);
    }
    if (step.probe) node.probe = step.probe;
    if (step.probeHints && step.probeHints.length > 0) node.probeHints = step.probeHints;
    if (step.check) {
      node.check = step.check;
      if (!step.loop && !node.onFail) notes.push(`${step.id}: has a check but no loop or on_fail, so a failing check stops the run. Set loop: {until: check} to have it fix its own work.`);
    }
    if (step.loop) {
      node.loop = step.loop;
      if (step.loop.until === "gate" && !node.gate) node.gate = DEFAULT_GATE;
    }
    if (step.maxRetries !== undefined && node.onFail === "retry") node.maxRetries = step.maxRetries;
    if (step.retryTarget) {
      node.retryTarget = step.retryTarget;
      if (node.onFail !== "retry") notes.push(`${step.id}: has retry_target but does not retry (no gate or check with on_fail: retry), so it is never used.`);
    }

    // The prompt names every input with a reference, so the compiled step knows where each one is.
    const sections = [step.task];
    if (step.returns && !contractOf.has(step.id)) sections.push(`Return ${step.returns.replace(/^return\s+/i, "")}`);
    // The work a verifier checks reaches later steps only through what the verifier returns.
    if (verifier && childCount(step.id) > 0 && !step.returns) sections.push(PASS_ON);
    const readsRequest = parents(step).includes(DRAFT_INPUT_ID);
    if (readsRequest || verifier) sections.push(`The request:\n{{goal}}`);
    for (const from of parents(step)) {
      if (from === DRAFT_INPUT_ID) continue;
      const parent = byId.get(from) as DraftStep;
      const parentLabel = parent.label ?? labelFor(from);
      if (list?.from === from) sections.push(`Your item, one entry of ${list.key ? `${list.key} from` : "the list from"} ${parentLabel}:\n{{item}}`);
      else sections.push(splitting.has(from) ? `Your task:\n{{${from}.${step.id}}}` : `${parentLabel}:\n{{${from}}}`);
    }
    node.prompt = sections.join("\n\n");
    nodes.push(node);
  }

  for (const id of splitting) {
    notes.push(`${id}: hands ${listing(childrenOf(id).map((child) => child.id))} each its own task (JSON keyed by step id). If they should all read the same data instead, give ${id} keys or returns, or set split: false.`);
  }
  // A step that reads only verifiers sees the work they checked only as far as they hand it on.
  for (const step of steps) {
    if (step.type === "code" || step.type === "approval") continue;
    const sources = parents(step).filter((id) => id !== DRAFT_INPUT_ID && byId.get(id)?.type !== "approval");
    const verifiers = sources.map((id) => byId.get(id) as DraftStep).filter((parent) => parent.type === "verifier");
    if (sources.length === 0 || verifiers.length < sources.length) continue;
    const work = [...new Set(verifiers.flatMap((parent) => parents(parent)))].filter((id) => id !== DRAFT_INPUT_ID && !sources.includes(id) && byId.get(id)?.type !== "approval");
    if (work.length === 0) continue;
    const told = verifiers.every((parent) => !parent.returns);
    const names = listing(verifiers.map((parent) => parent.id));
    notes.push(
      `${step.id}: reads only ${names}, so ${listing(work)} reach${work.length === 1 ? "es" : ""} it only through what ${names} return${verifiers.length === 1 ? "s" : ""}${told ? " (a drafted verifier is told to hand the checked work on)" : "; make sure that includes what it needs"}. If ${step.id} needs ${work.length === 1 ? "that work" : "their work"} as it is, add ${work.length === 1 ? "it" : "them"} to its after.`
    );
  }

  if (readOnlySteps.length > 0) {
    notes.unshift(`${readOnlySteps.join(", ")}: no tools were given, so ${readOnlySteps.length === 1 ? "it gets" : "they get"} ${defaultTools.join(", ")} (${runsIn === "chat" ? "web search, for a chat" : "read-only file tools, for Claude Code"}). Add what a step needs, e.g. ${runsIn === "chat" ? "Read for files shared in the chat" : "WebSearch, Edit or Bash"}.`);
  }
  const graph: SkillGraph = {
    name,
    description,
    nodes,
    edges,
    contracts,
    ...(handoff ? { handoff: handoff as HandoffMode } : {}),
    ...(experience === true ? { experience: { maxLessons: DEFAULT_MAX_LESSONS } } : {}),
    preamble: "# Node Prompts & Edge Contracts",
    extraFrontmatter: {},
  };
  return { source: serializeGraphSkill(graph), notes };
}
