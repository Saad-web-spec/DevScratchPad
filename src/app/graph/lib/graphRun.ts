/**
 * The run referee behind the connector's start_run and advance_run tools: Claude does each step of a
 * graph, hands the outputs back, and this decides what happens next, in code instead of in prose. It
 * checks JSON outputs against their contracts, reads gate verdicts and loop markers, counts retries and
 * loop iterations, expands fan-out lists, keeps the failure log and the loop notes, and stops a run
 * that runs out of tries.
 *
 * Nothing is stored: the whole run lives in a small plain-JSON object that goes back and forth with
 * every call. It holds no outputs (Claude has them); a task names where each input is by task id. The
 * graph travels as its compact studio-link hash. The same run object and outputs always give the same
 * answer, so the tools stay read-only and idempotent.
 */
import { agentName, compiledPrompt, judgeAgentName, judgePrompt, probeCandidates, reflectAgentName, reflectPrompt } from "./graphExport";
import { parseLessons } from "./graphLessons";
import { LESSONS_HEADING, LOOP_HEADING, compileRun, contractChecks, experiencePath, ledgerPath, loopEndWords, payloadFiles, payloadPath, redoableSteps } from "./graphPlan";
import { MAX_HASH_LENGTH, decodeShareHash, encodeShareHash } from "./graphShare";
import {
  CONTRACT_KEY_PATTERN,
  DEFAULT_MAX_RETRIES,
  LOOP_DONE_MARKER,
  LOOP_NOTE_HEADING,
  analyzeIsolation,
  descendantsOf,
  foreachSource,
  getContract,
  isKeyedJson,
  jsonKeysFor,
  jsonOutputKeys,
  nodeRefs,
  parseGraphSkill,
  predecessorsOf,
  retryPath,
  runsWithoutSubagent,
  successorsOf,
  topologicalOrder,
  validateGraph,
  wantsJsonOutput,
  type GraphNode,
  type SkillGraph,
} from "./graphSkill";

export const RUN_VERSION = 1;

export type TaskKind = "work" | "item" | "candidate" | "judge" | "check" | "contract" | "command" | "approval" | "reflect";

export interface RunTask {
  /** Unique among the run's tasks, e.g. `implement`, `implement/try2`, `review_file/item3`, `plan/B`. */
  id: string;
  step: string;
  kind: TaskKind;
  /** Fan-out item index, or probe candidate index. */
  index?: number;
  /** Loop iteration this task is. */
  iteration?: number;
  /** For check, contract and command tasks: what to run. */
  command?: string;
  /** For contract tasks: which contract, and which of its checks (in order). */
  contract?: string;
  /** Why the step is re-run, handed to it under `### Feedback`. */
  feedback?: string;
  /** Check tasks of a loop that ends on its check: the step's own `GATE: FAIL`, acted on once the check passes. */
  verdictFailed?: string;
}

export interface RunState {
  v: number;
  /** The graph, as the `#g=` hash of a studio link. */
  graph: string;
  /** First line of the user's request, for the ledger heading. */
  goal: string;
  status: "running" | "reflecting" | "done" | "stopped";
  stopReason?: string;
  /** Steps whose output is accepted. */
  done: string[];
  /** Where each accepted step's output is, in words (a task id and what to cut). */
  refs: Record<string, string>;
  pending: RunTask[];
  /** Times the step's work was issued; drives the `/tryN` suffix so a stale answer cannot be taken for a new one. */
  attempts: Record<string, number>;
  /** Retries used by the step whose gate, check or command failed. */
  retries: Record<string, number>;
  /** Contract re-runs used per step (one is allowed). */
  contractRetries: Record<string, number>;
  /** Loop iteration of each loop step. */
  iterations: Record<string, number>;
  /** This run's loop notes per loop step, in iteration order. */
  notes: Record<string, string[]>;
  /** Why a step is re-run, waiting to be handed to its next task. */
  feedback: Record<string, string>;
  /** Fan-out: how many items each fan-out step got, and their values when they are small. */
  items: Record<string, number>;
  itemData: Record<string, string[]>;
  /** Fan-out item indexes received, or probe candidates received and kept. */
  received: Record<string, number[]>;
  kept: Record<string, number[]>;
  /** Lessons handed to each step (their lines), when learning is on. */
  lessons: Record<string, string[]>;
  /** Whether the run started with an EXPERIENCE.md. */
  hadExperience: boolean;
  /** Failure log for the reflect step: failed checks, gate failures, retries, loop iterations. */
  log: string[];
}

export interface RunOutput {
  task: string;
  output?: string;
  exit_code?: number;
  approved?: boolean;
}

export interface RunAnswer {
  state: RunState;
  text: string;
  /** Tasks Claude has to do next, rendered. */
  tasks: { id: string; step: string; kind: TaskKind }[];
}

/** Caps that keep the run object small enough to pass back on every call. */
const MAX_LOG = 60;
const MAX_LOG_LINE = 300;
const MAX_FEEDBACK = 1_500;
const MAX_NOTE = 600;
const MAX_GOAL = 120;
const MAX_ITEM_DATA = 4_000;
export const MAX_RUN_STATE_CHARS = 40_000;
const MAX_OUTPUT_CHARS = 500_000;
const MAX_OUTPUTS_PER_CALL = 100;
/** Lines of command output a failing check or command hands back as the reason. */
const TAIL_LINES = 40;

interface Ctx {
  graph: SkillGraph;
  byId: Map<string, GraphNode>;
  state: RunState;
  events: string[];
  issued: RunTask[];
}

/* ------------------------------------------------------------------ text helpers */

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function tail(text: string, lines = TAIL_LINES): string {
  return text.split(/\r?\n/).slice(-lines).join("\n").trim();
}

function log(ctx: Ctx, line: string): void {
  ctx.state.log.push(cap(line.replace(/\s+/g, " ").trim(), MAX_LOG_LINE));
  if (ctx.state.log.length > MAX_LOG) ctx.state.log.splice(0, ctx.state.log.length - MAX_LOG);
}

function label(node: GraphNode): string {
  return `${node.label.replace(/^[\d\s&.]+/, "").trim() || node.id} (\`${node.id}\`)`;
}

export interface Verdict {
  pass: boolean;
  /** The answer above the verdict line. */
  work: string;
  /** The lines after the verdict line (what is wrong, per step). */
  lines: string;
  /** Step ids the redo lines name. */
  named: string[];
}

/** Reads the last `GATE: PASS` / `GATE: FAIL` line of an answer, or null when there is none. */
export function parseVerdict(text: string): Verdict | null {
  const lines = text.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const match = /^\s*(?:\*\*)?GATE:\s*(PASS|FAIL)\b/i.exec(lines[i]);
    if (!match) continue;
    const after = lines.slice(i + 1).join("\n").trim();
    const named = [...new Set([...after.matchAll(/^\s*[-*]\s*`?([A-Za-z][A-Za-z0-9_-]*)`?\s*:/gm)].map((m) => m[1]))];
    return { pass: match[1].toUpperCase() === "PASS", work: lines.slice(0, i).join("\n").trim(), lines: after, named };
  }
  return null;
}

/** Splits a loop step's answer into its work, its loop note and whether it said it is done. */
export function splitLoopAnswer(text: string): { work: string; note: string; done: boolean } {
  const lines = text.split(/\r?\n/);
  const done = lines.some((line) => line.trim().toUpperCase() === LOOP_DONE_MARKER);
  const kept = lines.filter((line) => line.trim().toUpperCase() !== LOOP_DONE_MARKER);
  const heading = kept.findIndex((line) => line.trim().toLowerCase() === LOOP_NOTE_HEADING.toLowerCase());
  if (heading === -1) return { work: kept.join("\n").trim(), note: "", done };
  // The note runs to the verdict line, if any, which stays with the work for the gate to read.
  const verdictAt = kept.findIndex((line, index) => index > heading && /^\s*(?:\*\*)?GATE:\s*(PASS|FAIL)\b/i.test(line));
  const end = verdictAt === -1 ? kept.length : verdictAt;
  const note = kept.slice(heading + 1, end).join("\n").trim();
  const work = [...kept.slice(0, heading), ...kept.slice(end)].join("\n").trim();
  return { work, note, done };
}

/** Parses a JSON answer, allowing one surrounding code fence. */
export function parseJsonAnswer(text: string): { value: unknown } | { error: string } {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed);
  try {
    return { value: JSON.parse(fenced ? fenced[1] : trimmed) };
  } catch (error) {
    return { error: `it is not valid JSON (${error instanceof Error ? error.message.split("\n")[0] : "parse error"})` };
  }
}

/* ------------------------------------------------------------------ the run object */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown, max = 500): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, max) : [];
}

/**
 * Maps keyed by step id have no prototype, so a step named `constructor` or `toString` reads as unset
 * instead of as an inherited function (the checker refuses such ids too, but the run object is client data).
 */
function dict<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function numberMap(value: unknown): Record<string, number> {
  const out = dict<number>();
  if (!isRecord(value)) return out;
  for (const [key, entry] of Object.entries(value)) if (key !== "__proto__" && typeof entry === "number" && Number.isFinite(entry) && entry >= 0) out[key] = Math.floor(entry);
  return out;
}

function stringMap(value: unknown, max: number): Record<string, string> {
  const out = dict<string>();
  if (!isRecord(value)) return out;
  for (const [key, entry] of Object.entries(value)) if (key !== "__proto__" && typeof entry === "string") out[key] = cap(entry, max);
  return out;
}

function listMap<T>(value: unknown, read: (item: unknown) => T | null): Record<string, T[]> {
  const out = dict<T[]>();
  if (!isRecord(value)) return out;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "__proto__" || !Array.isArray(entry)) continue;
    out[key] = entry.slice(0, 1_000).map(read).filter((item): item is T => item !== null);
  }
  return out;
}

const TASK_KINDS: readonly TaskKind[] = ["work", "item", "candidate", "judge", "check", "contract", "command", "approval", "reflect"];

function readTask(raw: unknown): RunTask | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.step !== "string" || !(TASK_KINDS as readonly unknown[]).includes(raw.kind)) return null;
  const task: RunTask = { id: cap(raw.id, 140), step: cap(raw.step, 64), kind: raw.kind as TaskKind };
  if (typeof raw.index === "number" && Number.isInteger(raw.index) && raw.index >= 0) task.index = raw.index;
  if (typeof raw.iteration === "number" && Number.isInteger(raw.iteration) && raw.iteration >= 1) task.iteration = raw.iteration;
  if (typeof raw.command === "string") task.command = cap(raw.command, 4_000);
  if (typeof raw.contract === "string") task.contract = cap(raw.contract, 100);
  if (typeof raw.feedback === "string") task.feedback = cap(raw.feedback, MAX_FEEDBACK);
  if (typeof raw.verdictFailed === "string") task.verdictFailed = cap(raw.verdictFailed, MAX_FEEDBACK);
  return task;
}

/** Reads a run object Claude passed back. Every field is re-checked: the object is client data. */
export function readRunState(raw: unknown): RunState | { error: string } {
  if (!isRecord(raw)) return { error: "run must be the run object from the last start_run or advance_run answer." };
  if (raw.v !== RUN_VERSION) return { error: `This run object is from another version (v ${String(raw.v)}). Start the run again with start_run.` };
  if (typeof raw.graph !== "string" || raw.graph.length > MAX_HASH_LENGTH) return { error: "The run object has no graph. Pass the run object exactly as the last answer gave it." };
  const status = raw.status === "running" || raw.status === "reflecting" || raw.status === "done" || raw.status === "stopped" ? raw.status : null;
  if (!status) return { error: "The run object has no valid status. Pass it exactly as the last answer gave it." };
  return {
    v: RUN_VERSION,
    graph: raw.graph,
    goal: typeof raw.goal === "string" ? cap(raw.goal, MAX_GOAL) : "",
    status,
    ...(typeof raw.stopReason === "string" ? { stopReason: cap(raw.stopReason, MAX_LOG_LINE * 2) } : {}),
    done: stringList(raw.done),
    refs: stringMap(raw.refs, 400),
    pending: (Array.isArray(raw.pending) ? raw.pending : []).slice(0, 500).map(readTask).filter((task): task is RunTask => task !== null),
    attempts: numberMap(raw.attempts),
    retries: numberMap(raw.retries),
    contractRetries: numberMap(raw.contractRetries),
    iterations: numberMap(raw.iterations),
    notes: listMap(raw.notes, (item) => (typeof item === "string" ? cap(item, MAX_NOTE + 40) : null)),
    feedback: stringMap(raw.feedback, MAX_FEEDBACK),
    items: numberMap(raw.items),
    itemData: listMap(raw.itemData, (item) => (typeof item === "string" ? cap(item, MAX_ITEM_DATA) : null)),
    received: listMap(raw.received, (item) => (typeof item === "number" && Number.isInteger(item) && item >= 0 ? item : null)),
    kept: listMap(raw.kept, (item) => (typeof item === "number" && Number.isInteger(item) && item >= 0 ? item : null)),
    lessons: listMap(raw.lessons, (item) => (typeof item === "string" ? cap(item, 400) : null)),
    hadExperience: raw.hadExperience === true,
    log: stringList(raw.log, MAX_LOG).map((line) => cap(line, MAX_LOG_LINE)),
  };
}

function loadGraph(hash: string): { graph: SkillGraph } | { error: string } {
  const shared = decodeShareHash(hash.startsWith("#") ? hash : `#${hash}`);
  if (!shared) return { error: "The run's graph could not be read; the run object may have been cut or changed. Start the run again with start_run." };
  const parsed = parseGraphSkill(shared.source);
  if (!parsed.graph) return { error: `The run's graph could not be read: ${parsed.fatal ?? "unknown problem"}.` };
  return { graph: parsed.graph };
}

/* ------------------------------------------------------------------ scheduling */

function nodeOf(ctx: Ctx, id: string): GraphNode | undefined {
  return ctx.byId.get(id);
}

function isDone(ctx: Ctx, id: string): boolean {
  return ctx.state.done.includes(id) || nodeOf(ctx, id)?.type === "input";
}

function suffix(ctx: Ctx, step: string): string {
  const attempt = ctx.state.attempts[step] ?? 1;
  return attempt > 1 ? `/try${attempt}` : "";
}

function issue(ctx: Ctx, task: RunTask): void {
  ctx.state.pending.push(task);
  ctx.issued.push(task);
}

function stop(ctx: Ctx, reason: string): void {
  if (ctx.state.status !== "running") return;
  ctx.state.stopReason = cap(reason, MAX_LOG_LINE * 2);
  ctx.events.push(`Stopped: ${reason}`);
  ctx.state.pending = [];
  if (ctx.graph.experience) startReflect(ctx);
  else ctx.state.status = "stopped";
}

function markDone(ctx: Ctx, id: string, ref: string): void {
  if (!ctx.state.done.includes(id)) ctx.state.done.push(id);
  ctx.state.refs[id] = cap(ref, 400);
  ctx.events.push(`${id}: accepted.`);
  // A fan-out step's own output is the array of its item answers, so a step that fans out over it has one item per answer.
  const node = nodeOf(ctx, id);
  if (!node?.foreach) return;
  for (const next of new Set(successorsOf(ctx.graph, id))) {
    const consumer = nodeOf(ctx, next);
    const list = consumer ? foreachSource(consumer) : null;
    if (!consumer || !list || list.node !== id) continue;
    if (list.key) {
      stop(ctx, `${next} fans out over ${consumer.foreach}, but ${id} returns a JSON array (one entry per item), which has no \`${list.key}\` key. Use foreach: ${id}.`);
      return;
    }
    ctx.state.items[next] = ctx.state.items[id] ?? 0;
    delete ctx.state.itemData[next];
  }
}

/** Starts the work of a step whose inputs are all accepted. */
function startStep(ctx: Ctx, node: GraphNode): void {
  const { state } = ctx;
  state.attempts[node.id] = (state.attempts[node.id] ?? 0) + 1;
  const feedback = state.feedback[node.id];
  delete state.feedback[node.id];
  const base = `${node.id}${suffix(ctx, node.id)}`;
  if (node.type === "approval") return issue(ctx, { id: base, step: node.id, kind: "approval" });
  if (node.type === "code") return issue(ctx, { id: base, step: node.id, kind: "command", command: compileRun(ctx.graph, node), ...(feedback ? { feedback } : {}) });
  if (node.foreach) {
    const count = state.items[node.id];
    if (count === undefined) return stop(ctx, `${node.id} fans out over ${node.foreach}, but that list was never read. Re-run the step that returns it.`);
    if (count === 0) return markDone(ctx, node.id, "an empty JSON array `[]` (its list had no items)");
    if (node.maxItems !== undefined && count > node.maxItems) return stop(ctx, `${node.id} would start ${count} runs, over its max_items of ${node.maxItems}. Ask the user whether to go on, then raise max_items or narrow the list.`);
    state.received[node.id] = [];
    for (let index = 0; index < count; index += 1) issue(ctx, { id: `${base}/item${index}`, step: node.id, kind: "item", index, ...(feedback ? { feedback } : {}) });
    return;
  }
  if (node.probe) {
    state.received[node.id] = [];
    state.kept[node.id] = [];
    probeCandidates(node).forEach((candidate, index) => issue(ctx, { id: `${base}/${candidate.letter}`, step: node.id, kind: "candidate", index, ...(feedback ? { feedback } : {}) }));
    return;
  }
  const iteration = node.loop ? (state.iterations[node.id] = (state.iterations[node.id] ?? 0) + 1) : undefined;
  issue(ctx, { id: base, step: node.id, kind: "work", ...(iteration ? { iteration } : {}), ...(feedback ? { feedback } : {}) });
}

/** Issues every step whose inputs are accepted; finishes the run when nothing is left. */
function schedule(ctx: Ctx): void {
  for (let guard = 0; guard < 10 && ctx.state.status === "running"; guard += 1) {
    const before = ctx.state.done.length;
    const order = topologicalOrder(ctx.graph) ?? [];
    for (const id of order) {
      if (ctx.state.status !== "running") return;
      const node = nodeOf(ctx, id);
      if (!node || node.type === "input" || isDone(ctx, id) || ctx.state.pending.some((task) => task.step === id)) continue;
      if (!predecessorsOf(ctx.graph, id).every((pred) => isDone(ctx, pred))) continue;
      startStep(ctx, node);
    }
    // An empty fan-out is accepted at once, which can make more steps ready; go round again.
    if (ctx.state.done.length === before) break;
  }
  if (ctx.state.status !== "running" || ctx.state.pending.length > 0) return;
  const steps = ctx.graph.nodes.filter((node) => node.type !== "input");
  if (steps.every((node) => isDone(ctx, node.id))) {
    if (ctx.graph.experience) startReflect(ctx);
    else ctx.state.status = "done";
  } else stop(ctx, "No step can start, but the run is not finished. The graph may have changed; start the run again.");
}

function startReflect(ctx: Ctx): void {
  ctx.state.status = "reflecting";
  ctx.state.pending = [];
  issue(ctx, { id: "reflect", step: "reflect", kind: "reflect" });
}

/* ------------------------------------------------------------------ failures */

/** Model steps that feed `node` directly: what a failed command sends back to. */
function modelPreds(ctx: Ctx, node: GraphNode): string[] {
  return [...new Set(predecessorsOf(ctx.graph, node.id))].filter((id) => {
    const pred = nodeOf(ctx, id);
    return pred !== undefined && !runsWithoutSubagent(pred.type);
  });
}

/** Drops the outputs of `targets` and everything after them, so they run again with their feedback. */
function invalidate(ctx: Ctx, targets: string[], feedback: Record<string, string>): boolean {
  const { state } = ctx;
  const affected = new Set(targets);
  for (const target of targets) descendantsOf(ctx.graph, target).forEach((id) => affected.add(id));
  for (const id of affected) {
    const node = nodeOf(ctx, id);
    if (node?.risk === "irreversible" && state.done.includes(id)) {
      stop(ctx, `Re-running ${targets.join(", ")} would re-run ${id}, which is irreversible and already ran. Stopping instead.`);
      return false;
    }
  }
  state.done = state.done.filter((id) => !affected.has(id));
  state.pending = state.pending.filter((task) => !affected.has(task.step));
  for (const id of affected) {
    delete state.refs[id];
    delete state.received[id];
    delete state.kept[id];
    // A loop restarts at iteration 1; its notes stay, so it picks up where it was.
    if (nodeOf(ctx, id)?.loop) state.iterations[id] = 0;
  }
  for (const target of targets) state.feedback[target] = cap(feedback[target] ?? "", MAX_FEEDBACK);
  return true;
}

/**
 * A gate, check or command failed. Retry by the node's rules (its named steps, its retry target, or
 * itself), within max_retries; otherwise stop.
 */
function fail(ctx: Ctx, node: GraphNode, mode: "gate" | "self" | "command", reason: string, named: string[] = []): void {
  const { state } = ctx;
  log(ctx, `${node.id}: ${reason}`);
  const max = node.maxRetries ?? DEFAULT_MAX_RETRIES;
  const used = state.retries[node.id] ?? 0;
  if (node.onFail !== "retry" || node.risk === "irreversible") return stop(ctx, `${node.id} failed (on_fail: stop): ${reason}`);
  if (used >= max) return stop(ctx, `${node.id} failed again after ${used} ${used === 1 ? "retry" : "retries"}: ${reason}`);
  const path = retryPath(ctx.graph, node);
  let targets: string[];
  if (mode === "gate") {
    const allowed = new Set(redoableSteps(ctx.graph, node).map((step) => step.id));
    targets = named.filter((id) => allowed.has(id));
    if (targets.length === 0) targets = path ? [path[0].id] : modelPreds(ctx, node);
  } else if (mode === "self") targets = path ? [path[0].id] : [node.id];
  else targets = path ? [path[0].id] : modelPreds(ctx, node);
  if (targets.length === 0) return stop(ctx, `${node.id} failed and nothing before it can redo the work: ${reason}`);
  state.retries[node.id] = used + 1;
  log(ctx, `retry ${used + 1}/${max} of ${node.id}: re-running ${targets.join(", ")}`);
  ctx.events.push(`${node.id} failed; re-running ${targets.join(", ")} (retry ${used + 1} of ${max}).`);
  const feedback = Object.fromEntries(
    targets.map((id) => [id, `${id === node.id ? "Your previous answer failed" : `${node.id} sent this work back`}: ${reason}\nYour previous answer is the output of your last task; fix what is named here and keep the rest.`])
  );
  invalidate(ctx, targets, feedback);
}

/** A loop that has not ended: run the next iteration, or stop at the cap. */
function loopAgain(ctx: Ctx, node: GraphNode, reason: string): void {
  const loop = node.loop;
  if (!loop) return;
  const iteration = ctx.state.iterations[node.id] ?? 1;
  log(ctx, `${node.id} iteration ${iteration} did not end the loop: ${reason}`);
  if (iteration >= loop.maxIterations) return stop(ctx, `${node.id} ran ${iteration} iterations without ${loopEndWords(node).replace(/`/g, "")}. Last: ${reason}`);
  ctx.state.feedback[node.id] = cap(`Iteration ${iteration} did not end the loop: ${reason}`, MAX_FEEDBACK);
  ctx.events.push(`${node.id}: iteration ${iteration} did not end the loop; starting iteration ${iteration + 1}.`);
  startStep(ctx, node);
}

/** The output does not match its contract: re-run the step (or the one item or candidate) once with the problem, then stop. */
function contractRetry(ctx: Ctx, node: GraphNode, problem: string, task?: RunTask): void {
  const single = task !== undefined && (task.kind === "item" || task.kind === "candidate");
  const key = single ? `${node.id}/${task.kind}${task.index ?? 0}` : node.id;
  const used = ctx.state.contractRetries[key] ?? 0;
  log(ctx, `${key}: ${problem}`);
  if (used >= 1) return stop(ctx, `${key} still does not match its contract after a re-run: ${problem}`);
  ctx.state.contractRetries[key] = used + 1;
  ctx.events.push(`${key}: ${problem}; re-running it once with the problem.`);
  const feedback = `Your previous answer did not match what this step must return: ${problem}. Answer again in the required format.`;
  // A single fan-out item or candidate is re-issued alone; anything else restarts the step.
  if (single) {
    ctx.state.received[node.id] = (ctx.state.received[node.id] ?? []).filter((index) => index !== task.index);
    issue(ctx, { ...task, id: `${task.id.replace(/\/fix$/, "")}/fix`, feedback });
    return;
  }
  ctx.state.feedback[node.id] = feedback;
  if (node.loop) {
    // The rejected answer's note was already taken; the re-run is the same iteration, not the next.
    if (task?.kind === "work") ctx.state.notes[node.id]?.pop();
    ctx.state.iterations[node.id] = Math.max(0, (ctx.state.iterations[node.id] ?? 1) - 1);
  }
  startStep(ctx, node);
}

/* ------------------------------------------------------------------ checks on an output */

/** Contract keys a JSON output must have, and the lists of fan-out steps it feeds. */
function checkShape(ctx: Ctx, node: GraphNode, text: string): string | null {
  if (!wantsJsonOutput(ctx.graph, node)) return null;
  const parsed = parseJsonAnswer(text);
  if ("error" in parsed) return parsed.error;
  const value = parsed.value;
  const contracts = [...new Set(ctx.graph.edges.filter((edge) => edge.from === node.id && edge.contract).map((edge) => edge.contract as string))];
  const required = new Set<string>(isKeyedJson(ctx.graph, node) ? jsonOutputKeys(ctx.graph, node) : []);
  for (const name of contracts) {
    const contract = getContract(ctx.graph, name);
    if (contract?.format === "json") (contract.required ?? []).filter((key) => CONTRACT_KEY_PATTERN.test(key)).forEach((key) => required.add(key));
  }
  if (required.size > 0) {
    if (!isRecord(value)) return `it must be a JSON object with the keys ${[...required].join(", ")}`;
    const missing = [...required].filter((key) => !Object.hasOwn(value, key));
    if (missing.length > 0) return `its JSON lacks the key${missing.length === 1 ? "" : "s"} ${missing.join(", ")}`;
  }
  // Lists the fan-out steps after it will run over, read now while the output is here.
  for (const id of new Set(successorsOf(ctx.graph, node.id))) {
    const consumer = nodeOf(ctx, id);
    const list = consumer ? foreachSource(consumer) : null;
    if (!consumer || !list || list.node !== node.id) continue;
    const items = list.key ? (isRecord(value) ? value[list.key] : undefined) : value;
    if (!Array.isArray(items)) return list.key ? `its \`${list.key}\` must be a JSON array (${id} runs once per entry)` : `it must be a JSON array (${id} runs once per entry)`;
    ctx.state.items[id] = items.length;
    const data = items.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
    if (data.join("").length <= MAX_ITEM_DATA) ctx.state.itemData[id] = data;
    else delete ctx.state.itemData[id];
  }
  return null;
}

/** After the shape: the step's check command, then its contracts' commands, then accept. */
function continueChecks(ctx: Ctx, node: GraphNode, ref: string, from: "check" | number, verdictFailed?: string): void {
  const base = `${node.id}${suffix(ctx, node.id)}`;
  if (from === "check" && node.check && !runsWithoutSubagent(node.type)) {
    issue(ctx, { id: `${base}/check`, step: node.id, kind: "check", command: node.check, feedback: ref, ...(verdictFailed ? { verdictFailed } : {}) });
    return;
  }
  const commands = contractChecks(ctx.graph, node).flatMap((check) => {
    const contract = getContract(ctx.graph, check.contract);
    return contract?.check ? [{ contract: check.contract, command: contract.check.replace(/\{\{\s*payload\s*\}\}/g, check.path) }] : [];
  });
  const index = from === "check" ? 0 : from;
  if (index < commands.length) {
    issue(ctx, { id: `${base}/contract${index + 1}`, step: node.id, kind: "contract", index, contract: commands[index].contract, command: commands[index].command, feedback: ref });
    return;
  }
  markDone(ctx, node.id, ref);
}

/** A model step's answer: loop note and marker, gate verdict, contract shape, then the checks. */
function onWork(ctx: Ctx, node: GraphNode, task: RunTask, text: string, ref: string): void {
  let body = text;
  let doneMarker = false;
  const cuts: string[] = [];
  if (node.loop) {
    const split = splitLoopAnswer(body);
    body = split.work;
    doneMarker = split.done;
    if (split.note) {
      const notes = (ctx.state.notes[node.id] ??= []);
      const iteration = ctx.state.iterations[node.id] ?? notes.length + 1;
      // A loop that a later gate sent back starts again at 1; say so, so the ledger reads in order.
      const restarted = iteration === 1 && notes.length > 0 ? " (restarted after a retry)" : "";
      notes.push(cap(`## Iteration ${iteration}${restarted}\n${split.note}`, MAX_NOTE + 40));
      if (notes.length > node.loop.maxIterations * 2) notes.splice(0, notes.length - node.loop.maxIterations * 2);
    }
    cuts.push(`its \`${LOOP_NOTE_HEADING}\` section`);
    if (node.loop.until === "done") cuts.push(`the \`${LOOP_DONE_MARKER}\` line`);
  }
  let verdictFailed: string | undefined;
  if (node.gate) {
    const verdict = parseVerdict(body);
    if (!verdict) return contractRetry(ctx, node, "it did not end with a `GATE: PASS` or `GATE: FAIL` line", task);
    body = verdict.work;
    cuts.push("its `GATE:` verdict and the lines after it");
    if (!verdict.pass) {
      const reason = `GATE: FAIL. ${verdict.lines || "(no reasons given)"}`;
      if (node.loop?.until === "gate") return loopAgain(ctx, node, reason);
      // A loop that ends on its check acts on the check first; the verdict counts once the check passes.
      if (node.loop?.until === "check" && node.check) verdictFailed = reason;
      else return fail(ctx, node, "gate", reason, verdict.named);
    }
  }
  if (node.loop?.until === "done" && !doneMarker) return loopAgain(ctx, node, `it did not end with ${LOOP_DONE_MARKER}`);
  const shape = checkShape(ctx, node, body);
  if (shape) return contractRetry(ctx, node, shape, task);
  continueChecks(ctx, node, cuts.length > 0 ? `${ref}, without ${cuts.join(" and ")}` : ref, "check", verdictFailed);
}

/* ------------------------------------------------------------------ taking an answer */

function take(ctx: Ctx, task: RunTask, answer: RunOutput): void {
  const node = task.kind === "reflect" ? undefined : nodeOf(ctx, task.step);
  const text = typeof answer.output === "string" ? answer.output : "";
  if (task.kind === "reflect") {
    ctx.state.status = ctx.state.stopReason ? "stopped" : "done";
    ctx.state.refs.reflect = `the output of task \`${task.id}\``;
    ctx.events.push("reflect: the new EXPERIENCE.md is ready.");
    return;
  }
  if (!node) return;
  const exit = answer.exit_code;
  switch (task.kind) {
    case "approval":
      // A missing flag is not a "no": the run waits until the answer says approved true or false.
      if (answer.approved === undefined) return requeue(ctx, task, "needs approved: true (only on the user's explicit yes) or false");
      if (answer.approved) return markDone(ctx, node.id, `the user's answer at task \`${task.id}\``);
      log(ctx, `${node.id}: the user did not approve`);
      return stop(ctx, `The user did not approve at ${node.id}.`);
    case "command": {
      if (typeof exit !== "number") return requeue(ctx, task, "needs exit_code (and output: everything it printed)");
      if (exit !== 0) return fail(ctx, node, "command", `\`${task.command ?? node.run ?? ""}\` exited ${exit}:\n${tail(text)}`);
      // What it printed is the step's output: it is checked like a model step's, and it may be a list.
      const shape = checkShape(ctx, node, text);
      if (shape) return contractRetry(ctx, node, `what it printed does not match its contract: ${shape}`);
      return continueChecks(ctx, node, `what the command of task \`${task.id}\` printed`, 0);
    }
    case "check": {
      if (typeof exit !== "number") return requeue(ctx, task, "needs exit_code (and output: its last lines)");
      const ref = task.feedback ?? `the output of task \`${node.id}\``;
      if (exit === 0) {
        // A loop that ended on its check still has to pass the gate it judged itself by.
        if (task.verdictFailed) {
          log(ctx, `${node.id}: ${task.verdictFailed}`);
          return stop(ctx, `${node.id} passed its check but failed its gate: ${task.verdictFailed}`);
        }
        return continueChecks(ctx, node, ref, 0);
      }
      const reason = `\`${task.command ?? node.check ?? ""}\` exited ${exit}:\n${tail(text)}`;
      if (node.loop?.until === "check") return loopAgain(ctx, node, reason);
      // A loop that ended on its gate runs its check once; a failure there stops, as the plan says.
      if (node.loop?.until === "gate") {
        log(ctx, `${node.id}: ${reason}`);
        return stop(ctx, `${node.id} ended its loop, but its check ${reason}`);
      }
      if (node.gate) return fail(ctx, node, "gate", `the check ${reason}`);
      return fail(ctx, node, "self", reason);
    }
    case "contract": {
      if (typeof exit !== "number") return requeue(ctx, task, "needs exit_code (and output: its last lines)");
      const ref = task.feedback ?? `the output of task \`${node.id}\``;
      if (exit === 0) return continueChecks(ctx, node, ref, (task.index ?? 0) + 1);
      return contractRetry(ctx, node, `the check of contract \`${task.contract ?? ""}\` (\`${task.command ?? ""}\`) exited ${exit}: ${tail(text, 10)}`);
    }
    case "work":
      return onWork(ctx, node, task, text, `the output of task \`${task.id}\``);
    case "item": {
      if (node.gate) {
        const verdict = parseVerdict(text);
        if (!verdict) return contractRetry(ctx, node, `item ${task.index} did not end with a \`GATE:\` line`, task);
        if (!verdict.pass) {
          const key = `${node.id}/item${task.index}`;
          const used = ctx.state.retries[key] ?? 0;
          log(ctx, `${key}: GATE: FAIL. ${verdict.lines}`);
          if (node.onFail !== "retry" || used >= (node.maxRetries ?? DEFAULT_MAX_RETRIES)) return stop(ctx, `${key} failed its gate: ${cap(verdict.lines, 300)}`);
          ctx.state.retries[key] = used + 1;
          issue(ctx, { ...task, id: `${task.id.replace(/\/retry\d+$/, "")}/retry${used + 1}`, feedback: `Your previous answer failed the gate: ${verdict.lines}` });
          return;
        }
      }
      const received = (ctx.state.received[node.id] ??= []);
      if (!received.includes(task.index ?? 0)) received.push(task.index ?? 0);
      if (received.length < (ctx.state.items[node.id] ?? 0)) return;
      return continueChecks(ctx, node, `a JSON array of the answers of the \`${node.id}\` item tasks, in item order${node.gate ? " (each without its verdict)" : ""}`, "check");
    }
    case "candidate": {
      let body = text;
      let ok = true;
      if (node.gate) {
        const verdict = parseVerdict(body);
        ok = verdict?.pass === true;
        if (verdict) body = verdict.work;
      }
      const shape = ok ? checkShape(ctx, node, body) : "it failed its gate";
      if (shape) log(ctx, `${task.id}: dropped, ${shape}`);
      const received = (ctx.state.received[node.id] ??= []);
      if (!received.includes(task.index ?? 0)) received.push(task.index ?? 0);
      if (!shape) (ctx.state.kept[node.id] ??= []).push(task.index ?? 0);
      if (received.length < (node.probe ?? 0)) return;
      const kept = ctx.state.kept[node.id] ?? [];
      const letters = probeCandidates(node).map((candidate) => candidate.letter);
      if (kept.length === 0) return contractRetry(ctx, node, "every candidate failed its checks");
      if (kept.length === 1) return continueChecks(ctx, node, `the answer of task \`${node.id}${suffix(ctx, node.id)}/${letters[kept[0]]}\``, "check");
      issue(ctx, { id: `${node.id}${suffix(ctx, node.id)}/judge`, step: node.id, kind: "judge" });
      return;
    }
    case "judge": {
      const at = text.search(/^---\s*$/m);
      if (at === -1) return contractRetry(ctx, node, "the judge did not put a `---` line before the final answer");
      const body = text.slice(at).replace(/^---\s*$/m, "").trim();
      const shape = checkShape(ctx, node, body);
      if (shape) return contractRetry(ctx, node, `the judge's answer: ${shape}`);
      return continueChecks(ctx, node, `what task \`${task.id}\` returned after its \`---\` line`, "check");
    }
  }
}

/** An answer that is missing what the task needs goes back on the list with the reason. */
function requeue(ctx: Ctx, task: RunTask, why: string): void {
  ctx.state.pending.push(task);
  ctx.events.push(`${task.id}: ${why}; it is still open.`);
}

/* ------------------------------------------------------------------ rendering a task */

function sourceRef(ctx: Ctx, id: string): string {
  const node = nodeOf(ctx, id);
  if (node?.type === "input") return "the user's request, word for word";
  return ctx.state.refs[id] ?? `the output of \`${id}\``;
}

/** What goes under each heading of a model task's message. */
function messageParts(ctx: Ctx, node: GraphNode, task: RunTask): string[] {
  const parts: string[] = [];
  const list = foreachSource(node);
  const seen = new Set<string>();
  const input = ctx.graph.nodes.find((n) => n.type === "input");
  for (const id of predecessorsOf(ctx.graph, node.id)) {
    if (seen.has(id)) continue;
    seen.add(id);
    const source = nodeOf(ctx, id);
    if (!source) continue;
    if (list?.node === id && task.kind === "item") {
      const data = ctx.state.itemData[node.id]?.[task.index ?? 0];
      const where = `entry ${task.index} (counting from 0) of ${list.key ? `the \`${list.key}\` array in ` : "the JSON array that is "}${sourceRef(ctx, id)}`;
      parts.push(data !== undefined ? `\`### item\`: ${where}:\n\n${data}` : `\`### item\`: ${where}.`);
      // Other keys of the same JSON the prompt names (`{{scope.focus}}`) go to every run too.
      const others = [...new Set(nodeRefs(node).filter((ref) => ref.head === id && ref.path !== "" && ref.path !== "output").map((ref) => ref.path.split(".")[0]))].filter((key) => key !== list.key);
      if (others.length > 0) parts.push(`\`### ${id}\`: only the ${others.map((key) => `\`${key}\``).join(" and ")} value${others.length === 1 ? "" : "s"} of the JSON in ${sourceRef(ctx, id)}.`);
      continue;
    }
    const keys = jsonKeysFor(ctx.graph, source, node);
    const what = keys ? `only the ${keys.map((key) => `\`${key}\``).join(" and ")} value${keys.length === 1 ? "" : "s"} of the JSON in ${sourceRef(ctx, id)}` : sourceRef(ctx, id);
    parts.push(`\`### ${id}\`: ${what}.`);
  }
  if (input && !seen.has(input.id) && /\{\{\s*goal\s*\}\}/.test(node.prompt)) parts.unshift(`\`### ${input.id}\`: the user's request, word for word.`);
  for (const leak of analyzeIsolation(ctx.graph, node).leakedRefs) {
    const head = leak.split(".")[0];
    if (!seen.has(head) && nodeOf(ctx, head)) {
      seen.add(head);
      parts.push(`\`### ${head}\`: ${sourceRef(ctx, head)}.`);
    }
  }
  const lessons = ctx.state.lessons[node.id];
  if (lessons && lessons.length > 0) parts.push(`\`${LESSONS_HEADING}\`:\n\n${lessons.join("\n")}`);
  if (task.kind === "candidate") {
    const candidate = probeCandidates(node)[task.index ?? 0];
    parts.push(`\`### Approach\`: ${candidate?.hint ?? "Your own best approach."}`);
  }
  let feedbackShown = false;
  if (node.loop && task.kind === "work") {
    const notes = ctx.state.notes[node.id] ?? [];
    const iteration = task.iteration ?? 1;
    const lines = [`\`${LOOP_HEADING}\`: iteration ${iteration} of ${node.loop.maxIterations}`];
    if (node.loop.ledger) {
      lines.push(`- the ledger: the file \`${ledgerPath(ctx.graph, node.id)}\` if you have it (notes from earlier runs), then this run's notes${notes.length > 0 ? `:\n\n# Run: ${ctx.state.goal || "this run"}\n${notes.join("\n")}` : " (none yet)"}`);
    }
    if (iteration > 1) {
      // The previous iteration is the previous attempt of this step; its answer is what Claude reported for it.
      const attempt = ctx.state.attempts[node.id] ?? 1;
      const previous = attempt > 2 ? `${node.id}/try${attempt - 1}` : node.id;
      lines.push(`- your previous answer: the output of task \`${previous}\``);
      if (task.feedback) {
        lines.push(`- ${node.loop.until === "check" ? "the last output of the check" : "why the loop went on"}: ${task.feedback}`);
        feedbackShown = true;
      }
    }
    parts.push(lines.join("\n"));
  }
  if (task.feedback && !feedbackShown) parts.push(`\`### Feedback\`:\n\n${task.feedback}`);
  return parts;
}

function renderTask(ctx: Ctx, task: RunTask): string {
  const node = nodeOf(ctx, task.step);
  if (task.kind === "reflect") {
    const given = Object.entries(ctx.state.lessons).map(([step, lines]) => `${step}: ${lines.map((line) => /\[L\d+\]/.exec(line)?.[0] ?? "").join(" ")}`);
    return [
      `### Task \`${task.id}\` · learn from this run (subagent \`${reflectAgentName(ctx.graph)}\` in the Claude Code kit) · fresh context`,
      "",
      "Instructions:",
      "",
      reflectPrompt(ctx.graph),
      "",
      "Task message:",
      "",
      `- \`### Current file\`: ${ctx.state.hadExperience ? "the EXPERIENCE.md passed to start_run" : "no file yet"}.`,
      `- \`### Lessons given\`: ${given.length > 0 ? given.join("; ") : "none"}.`,
      `- \`### Failure log\`:\n\n${ctx.state.log.length > 0 ? ctx.state.log.map((line) => `- ${line}`).join("\n") : "(no failures)"}`,
      "",
      `Report its whole answer as the output: it is the new \`${experiencePath(ctx.graph)}\`.`,
    ].join("\n");
  }
  if (!node) return `### Task \`${task.id}\` (unknown step)`;
  switch (task.kind) {
    case "approval": {
      const show = predecessorsOf(ctx.graph, node.id).map((id) => sourceRef(ctx, id));
      return [
        `### Task \`${task.id}\` · ask the user · ${label(node)}`,
        "",
        `Show the user: ${show.join("; ") || "what has run so far"}.${node.prompt.trim() ? ` Then ask: ${node.prompt.trim().replace(/\s+/g, " ")}` : " Then ask whether to go on."}`,
        "Report `approved: true` only on an explicit yes, with their notes as output; anything else is `approved: false`.",
      ].join("\n");
    }
    case "command":
    case "check":
    case "contract": {
      const save =
        task.kind === "command"
          ? payloadFiles(ctx.graph, node).map((file) => `\`${file.path}\` ← ${sourceRef(ctx, file.id)}`)
          : task.kind === "contract"
            ? [`\`${payloadPath(ctx.graph, node.id)}\` ← ${task.feedback ?? sourceRef(ctx, node.id)}`]
            : [];
      const what = task.kind === "command" ? `run the command step ${label(node)}` : task.kind === "check" ? `check the work of ${label(node)}` : `check the \`${task.contract}\` contract of ${label(node)}`;
      return [
        `### Task \`${task.id}\` · ${what} · no model`,
        "",
        ...(save.length > 0 ? [`First save, verbatim: ${save.join("; ")}.`] : []),
        `Run with Bash from the repository root: \`${task.command ?? ""}\``,
        task.kind === "command"
          ? "Report its `exit_code`, and everything it printed as `output` (it is this step's output). Without a shell, ask the user to run it and report the result."
          : `Report its \`exit_code\`, and its last ${TAIL_LINES} lines as \`output\`. Without a shell, ask the user to run it and report the result.`,
        ...(task.feedback && task.kind === "command" ? ["", `\`### Feedback\`:\n\n${task.feedback}`] : []),
      ].join("\n");
    }
    case "judge": {
      const letters = probeCandidates(node).map((candidate) => candidate.letter);
      const kept = (ctx.state.kept[node.id] ?? []).map((index) => letters[index]);
      return [
        `### Task \`${task.id}\` · pick the best candidate of ${label(node)} (subagent \`${judgeAgentName(ctx.graph, node)}\` in the Claude Code kit) · fresh context · tools: Read, Grep, Glob`,
        "",
        "Instructions:",
        "",
        judgePrompt(ctx.graph, node),
        "",
        "Task message:",
        "",
        ...messageParts(ctx, node, { ...task, kind: "work" }).filter((part) => !part.startsWith(`\`${LOOP_HEADING}`)).map((part) => `- ${part}`),
        ...kept.map((letter) => `- \`### Candidate ${letter}\`: the answer of task \`${node.id}${suffix(ctx, node.id)}/${letter}\`.`),
        "",
        "Report its whole answer, including the CHOSEN line and the `---` line.",
      ].join("\n");
    }
    default: {
      const traits = [
        node.type,
        node.model ? `model ${node.model}` : null,
        node.tools && node.tools.length > 0 ? `tools: ${node.tools.join(", ")}` : "all tools",
        node.isolatedContext ? "fresh context" : null,
        task.kind === "item" ? `item ${task.index}` : null,
        task.kind === "candidate" ? `candidate ${probeCandidates(node)[task.index ?? 0]?.letter ?? ""}` : null,
        task.iteration ? `iteration ${task.iteration} of ${node.loop?.maxIterations ?? task.iteration}` : null,
      ].filter(Boolean);
      return [
        `### Task \`${task.id}\` · ${label(node)} · ${traits.join(" · ")}`,
        `In Claude Code with the kit installed, this is subagent \`${agentName(ctx.graph, node)}\`; hand it the task message below.`,
        "",
        "Instructions:",
        "",
        compiledPrompt(ctx.graph, node),
        "",
        `Task message (each part under its heading, verbatim${node.isolatedContext ? "; nothing else: no notes of your own, no other step's reasoning" : ""}):`,
        "",
        ...messageParts(ctx, node, task).map((part) => `- ${part}`),
        "",
        "Report its whole answer as the output, unchanged.",
      ].join("\n");
    }
  }
}

/* ------------------------------------------------------------------ the two tools */

function summaryLine(ctx: Ctx): string {
  const steps = ctx.graph.nodes.filter((node) => node.type !== "input");
  const done = steps.filter((node) => isDone(ctx, node.id)).length;
  return `${done} of ${steps.length} steps accepted`;
}

function finalLines(ctx: Ctx): string[] {
  const { state, graph } = ctx;
  const lines: string[] = [];
  if (state.status === "done" || (state.status === "reflecting" && !state.stopReason)) {
    const sinks = graph.nodes.filter((node) => node.type !== "input" && successorsOf(graph, node.id).length === 0);
    lines.push("", `Final answer: ${sinks.map((node) => `${label(node)}: ${sourceRef(ctx, node.id)}`).join("; ")}. Give it to the user as it is.`);
  }
  const loops = graph.nodes.filter((node) => node.loop?.ledger && (state.notes[node.id]?.length ?? 0) > 0);
  if (state.status === "done" || state.status === "stopped" || state.status === "reflecting") {
    for (const node of loops) {
      lines.push("", `Append to \`${ledgerPath(graph, node.id)}\` (create it if needed), so the next run starts from it:`, "", "```md", `# Run: ${state.goal || "this run"}`, ...(state.notes[node.id] ?? []), "```");
    }
  }
  if ((state.status === "done" || state.status === "stopped") && state.refs.reflect) {
    lines.push("", `Write the output of task \`reflect\` to \`${experiencePath(graph)}\`, replacing the file (create the folder if needed).`);
  }
  return lines;
}

function answer(ctx: Ctx, rerender: boolean): RunAnswer {
  const { state } = ctx;
  const tasks = rerender ? state.pending : ctx.issued.filter((task) => state.pending.includes(task));
  const waiting = state.pending.filter((task) => !tasks.includes(task)).map((task) => `\`${task.id}\``);
  const head =
    state.status === "done"
      ? `Run of "${ctx.graph.name}" finished: ${summaryLine(ctx)}.`
      : state.status === "stopped"
        ? `Run of "${ctx.graph.name}" stopped: ${state.stopReason ?? "see the log"}.`
        : state.status === "reflecting"
          ? `Run of "${ctx.graph.name}" ${state.stopReason ? `stopped (${state.stopReason})` : "finished its steps"}; one task is left: learning from the run.`
          : `Run of "${ctx.graph.name}": ${summaryLine(ctx)}.`;
  const lines = [head];
  if (ctx.events.length > 0) lines.push("", "What happened:", ...ctx.events.map((event) => `- ${event}`));
  if (tasks.length > 0) {
    lines.push(
      "",
      `Next ${tasks.length === 1 ? "task" : `${tasks.length} tasks`}${tasks.length > 1 ? " (independent: run them at the same time)" : ""}. Do each one, then call advance_run with this run object and one entry per task: \`task\` (its id) and \`output\` (the answer as it is), plus \`exit_code\` for commands and checks, or \`approved\` for approvals. The referee checks each answer and says what is next.`,
      "",
      tasks.map((task) => renderTask(ctx, task)).join("\n\n")
    );
  }
  if (waiting.length > 0) lines.push("", `Still open from before: ${waiting.join(", ")}. Call advance_run with no outputs to see them again.`);
  lines.push(...finalLines(ctx));
  if (state.status === "running" || state.status === "reflecting") lines.push("", "Run object (pass it to advance_run exactly as it is):", "", "```json", JSON.stringify(state), "```");
  return { state, text: lines.join("\n"), tasks: tasks.map((task) => ({ id: task.id, step: task.step, kind: task.kind })) };
}

function context(graph: SkillGraph, state: RunState): Ctx {
  return { graph, byId: new Map(graph.nodes.map((node) => [node.id, node])), state, events: [], issued: [] };
}

/** start_run: checks the graph, sets up the run, and returns the first tasks. */
export function startRun(source: string, request: string, experience?: string): RunAnswer | { error: string } {
  const parsed = parseGraphSkill(source);
  if (!parsed.graph) return { error: `The graph could not be read: ${parsed.fatal ?? "unknown problem"}.` };
  const graph = parsed.graph;
  const errors = validateGraph(graph).filter((issue) => issue.severity === "error");
  if (errors.length > 0) return { error: `The graph has ${errors.length} error${errors.length === 1 ? "" : "s"}, so it cannot run yet:\n${errors.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n")}` };
  if (!graph.nodes.some((node) => node.type === "input")) return { error: "The graph has no input step, so there is nothing to start from." };
  const hash = encodeShareHash({ source });
  if (hash.length > MAX_HASH_LENGTH) return { error: "This graph is too large to referee in a chat. Compile it with compile_graph and run the kit in Claude Code." };
  const state: RunState = {
    v: RUN_VERSION,
    graph: hash.slice(1),
    goal: cap((request.split(/\r?\n/).find((line) => line.trim()) ?? "").trim(), MAX_GOAL),
    status: "running",
    done: [],
    refs: dict(),
    pending: [],
    attempts: dict(),
    retries: dict(),
    contractRetries: dict(),
    iterations: dict(),
    notes: dict(),
    feedback: dict(),
    items: dict(),
    itemData: dict(),
    received: dict(),
    kept: dict(),
    lessons: dict(),
    hadExperience: false,
    log: [],
  };
  if (graph.experience && experience && experience.trim()) {
    state.hadExperience = true;
    for (const lesson of parseLessons(experience)) {
      if (!graph.nodes.some((node) => node.id === lesson.step && !runsWithoutSubagent(node.type))) continue;
      (state.lessons[lesson.step] ??= []).push(cap(`- [L${lesson.number}] ${lesson.rule}`, 400));
    }
  }
  const ctx = context(graph, state);
  schedule(ctx);
  const result = answer(ctx, false);
  const intro = [
    `Started a refereed run of "${graph.name}". The referee holds no outputs: each task names, by task id, where its inputs are. It checks every answer you report (contracts, gate verdicts, loop markers, exit codes) and decides what runs next, so follow its tasks rather than the plan in SKILL.md.`,
    "",
  ].join("\n");
  return { ...result, text: `${intro}\n${result.text}` };
}

/** advance_run: takes the answers to open tasks, and returns what happens next. */
export function advanceRun(rawRun: unknown, rawOutputs: unknown): RunAnswer | { error: string } {
  const state = readRunState(rawRun);
  if ("error" in state) return state;
  const loaded = loadGraph(state.graph);
  if ("error" in loaded) return loaded;
  const ctx = context(loaded.graph, state);
  const outputs = Array.isArray(rawOutputs) ? rawOutputs.slice(0, MAX_OUTPUTS_PER_CALL) : [];
  if (state.status === "done" || state.status === "stopped") {
    return answer(ctx, true);
  }
  for (const raw of outputs) {
    if (!isRecord(raw) || typeof raw.task !== "string") {
      ctx.events.push("An output without a task id was ignored.");
      continue;
    }
    const at = state.pending.findIndex((task) => task.id === raw.task);
    if (at === -1) {
      ctx.events.push(`\`${cap(raw.task, 80)}\` is not an open task, so its output was ignored${state.done.includes(raw.task) ? " (that step is already accepted)" : ""}.`);
      continue;
    }
    const output = typeof raw.output === "string" ? raw.output.slice(0, MAX_OUTPUT_CHARS) : undefined;
    const [task] = state.pending.splice(at, 1);
    const reply: RunOutput = { task: task.id, ...(output !== undefined ? { output } : {}) };
    if (typeof raw.exit_code === "number" && Number.isFinite(raw.exit_code)) reply.exit_code = Math.trunc(raw.exit_code);
    if (typeof raw.approved === "boolean") reply.approved = raw.approved;
    const needsText = task.kind !== "approval" && task.kind !== "command" && task.kind !== "check" && task.kind !== "contract";
    if (needsText && (output === undefined || output.trim() === "")) {
      requeue(ctx, task, "has no output");
      continue;
    }
    take(ctx, task, reply);
    if (state.status !== "running" && state.status !== "reflecting") break;
  }
  if (state.status === "running") schedule(ctx);
  if (JSON.stringify(state).length > MAX_RUN_STATE_CHARS) {
    return { error: "This run has grown too large to pass back and forth in a chat. Compile the graph with compile_graph and run the kit in Claude Code." };
  }
  // When nothing new starts, show the open tasks again, so the answer always says what to do next.
  return answer(ctx, outputs.length === 0 || ctx.issued.length === 0);
}
