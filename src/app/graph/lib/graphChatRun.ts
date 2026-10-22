/**
 * run_graph: a whole refereed run in one or two calls, for the Claude app. The first call returns every
 * step's instructions at once; Claude does the steps in order and reports all the answers in the next
 * call, keyed by step id. The same referee as start_run / advance_run (graphRun.ts) checks each answer
 * in turn, so a run where every check passes ends on that call with the final answer. A step that fails
 * its check comes back with why, and only the steps that must be redone are asked for again.
 *
 * Wording is for chat: steps are named in plain English (Checker, Repeat for each), tools are named as
 * the chat has them (web search, connected apps), and every answer carries a short progress readout.
 * Stateless like the rest of the connector: the run object carries the state, and answers are not kept.
 */
import { compiledPrompt, judgePrompt, probeCandidates } from "./graphExport";
import { PLAIN_DOING, PLAIN_TYPE, plainStepName, plainTools, plainTraits } from "./graphPlainLabels";
import { MAX_LESSONS_SOURCE } from "./graphLessons";
import { LOOP_HEADING, experiencePath, ledgerPath } from "./graphPlan";
import { createRun, feedRun, loadRun, parseVerdict, renderRunTask, runTooLarge, splitLoopAnswer, type RunContext, type RunState, type RunTask } from "./graphRun";
import { LOOP_DONE_MARKER, LOOP_NOTE_HEADING, analyzeIsolation, foreachSource, jsonKeysFor, nodeRefs, predecessorsOf, successorsOf, topologicalOrder, type GraphNode } from "./graphSkill";
import { resolveWorkflow } from "./graphWorkflow";

/** Above this, further tasks and steps are listed by name instead of in full, so a reply stays readable in a chat. */
const MAX_SHEET_CHARS = 45_000;
/** Most tasks a run may have open at once in a chat (a repeat-for-each step opens one per entry). */
const MAX_OPEN_TASKS = 100;
const MAX_ANSWER_KEYS = 300;
const MAX_FINAL_CHARS = 60_000;
/** feedRun takes at most this many outputs per call. */
const FEED_CHUNK = 100;

export type ChatRunStatus = RunState["status"];

export interface ChatRunResult {
  text: string;
  data: Record<string, unknown>;
}

interface Reply {
  output?: string;
  exit_code?: number;
  approved?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * One answer as Claude may write it: the text, true/false for an approval, {output, exit_code, approved},
 * or, for a step that returns JSON, the JSON itself as an object or array (`json`), which is taken as its text.
 */
function toReply(value: unknown, json = false): Reply | null {
  if (typeof value === "string") return { output: value };
  if (typeof value === "boolean") return { approved: value };
  if (json && (Array.isArray(value) || (isRecord(value) && !("output" in value) && !("exit_code" in value) && !("approved" in value)))) return { output: JSON.stringify(value) };
  if (!isRecord(value)) return null;
  const reply: Reply = {};
  if (typeof value.output === "string") reply.output = value.output;
  if (typeof value.exit_code === "number" && Number.isFinite(value.exit_code)) reply.exit_code = Math.trunc(value.exit_code);
  if (typeof value.approved === "boolean") reply.approved = value.approved;
  return Object.keys(reply).length > 0 ? reply : null;
}

/* ------------------------------------------------------------------ answer keys */

/** The key a task's answer goes under, as the run tells Claude: a step id, or `step/check`-style for the extras. */
function answerKey(ctx: RunContext, task: RunTask): string {
  switch (task.kind) {
    case "item": {
      // All items open at once: one list under the step. One item sent back alone: its own key.
      const open = ctx.state.pending.filter((other) => other.step === task.step && other.kind === "item").length;
      return open === (ctx.state.items[task.step] ?? 0) ? task.step : `${task.step}/item${task.index ?? 0}`;
    }
    case "candidate": {
      const open = ctx.state.pending.filter((other) => other.step === task.step && other.kind === "candidate").length;
      const node = ctx.byId.get(task.step);
      if (!node) return task.step;
      return open === (node.probe ?? 0) ? task.step : `${task.step}/${probeCandidates(node)[task.index ?? 0]?.letter ?? "A"}`;
    }
    case "judge":
      return `${task.step}/judge`;
    case "check":
      return `${task.step}/check`;
    case "contract":
      return `${task.step}/contract${(task.index ?? 0) + 1}`;
    case "reflect":
      return "reflect";
    default:
      return task.step;
  }
}

/** Where a task's answer may be in `answers`: its exact task id, its answer key, or its entry in a list under the step. */
function findAnswer(ctx: RunContext, task: RunTask, answers: Record<string, unknown>, used: Set<string>): { reply: Reply; mark: string } | null {
  const json = task.kind === "work" || task.kind === "item" || task.kind === "candidate" || task.kind === "judge";
  const tryKey = (key: string): { reply: Reply; mark: string } | null => {
    if (used.has(key) || !Object.hasOwn(answers, key)) return null;
    const reply = toReply(answers[key], json);
    return reply ? { reply, mark: key } : null;
  };
  const exact = tryKey(task.id);
  if (exact) return exact;
  if (task.kind === "item" || task.kind === "candidate") {
    const node = ctx.byId.get(task.step);
    const own = task.kind === "item" ? `${task.step}/item${task.index ?? 0}` : `${task.step}/${node ? (probeCandidates(node)[task.index ?? 0]?.letter ?? "A") : "A"}`;
    const single = tryKey(own);
    if (single) return single;
    const list = answers[task.step];
    const mark = `${task.step}#${task.index ?? 0}`;
    // One entry, answered as a plain answer instead of a list of one.
    if (!Array.isArray(list)) return task.kind === "item" && (task.index ?? 0) === 0 && ctx.state.items[task.step] === 1 ? tryKey(task.step) : null;
    if (used.has(mark) || used.has(task.step)) return null;
    const reply = toReply(list[task.index ?? 0], true);
    return reply ? { reply, mark } : null;
  }
  return tryKey(answerKey(ctx, task)) ?? (task.kind === "work" || task.kind === "command" || task.kind === "approval" ? tryKey(task.step) : null);
}

/* ------------------------------------------------------------------ wording */

function order(ctx: RunContext): GraphNode[] {
  const ids = topologicalOrder(ctx.graph) ?? ctx.graph.nodes.map((node) => node.id);
  return ids.map((id) => ctx.byId.get(id)).filter((node): node is GraphNode => node !== undefined && node.type !== "input");
}

function stepTitle(ctx: RunContext, node: GraphNode): string {
  const steps = order(ctx);
  return `Step ${steps.indexOf(node) + 1} of ${steps.length}: ${plainStepName(node)} (${PLAIN_TYPE[node.type]})`;
}

/** Where a step's answer is, in chat terms: Claude's own earlier answer, without what the referee cut off. */
function chatRef(ctx: RunContext, id: string): string {
  const node = ctx.byId.get(id);
  if (!node || node.type === "input") return "the user's request, word for word";
  if (node.type === "approval") return `what the user said at step \`${id}\``;
  if (node.type === "code") return `what the command of step \`${id}\` printed`;
  if (node.foreach) return `the list of your answers to step \`${id}\`, one per entry, in order${node.gate ? " (each without its GATE line)" : ""}`;
  if (node.probe) {
    const kept = ctx.state.kept[id] ?? [];
    const letters = probeCandidates(node).map((candidate) => candidate.letter);
    return kept.length === 1
      ? `your answer to step \`${id}\` that passed its checks (approach ${letters[kept[0]] ?? "A"})`
      : `your final answer to step \`${id}\` (the chosen answer after the judge's \`---\` line)`;
  }
  const cuts: string[] = [];
  if (node.loop) cuts.push(`its \`${LOOP_NOTE_HEADING}\` section${node.loop.until === "done" ? ` and the \`${LOOP_DONE_MARKER}\` line` : ""}`);
  if (node.gate) cuts.push("its `GATE:` line and what follows it");
  return `your latest answer to step \`${id}\`${cuts.length > 0 ? `, without ${cuts.join(" or ")}` : ""}`;
}

/** What goes under each heading of a model step's task, in chat terms (mirrors messageParts in graphRun). */
function inputLines(ctx: RunContext, node: GraphNode, task: RunTask | null): string[] {
  const parts: string[] = [];
  const list = foreachSource(node);
  const seen = new Set<string>();
  const input = ctx.graph.nodes.find((n) => n.type === "input");
  for (const id of predecessorsOf(ctx.graph, node.id)) {
    if (seen.has(id)) continue;
    seen.add(id);
    const source = ctx.byId.get(id);
    if (!source) continue;
    if (list?.node === id) {
      const where = `${list.key ? `the \`${list.key}\` list in ` : ""}${chatRef(ctx, id)}`;
      if (task?.kind === "item") {
        const data = ctx.state.itemData[node.id]?.[task.index ?? 0];
        parts.push(data !== undefined ? `\`### item\`: entry ${(task.index ?? 0) + 1} of ${where}:\n\n${data}` : `\`### item\`: entry ${(task.index ?? 0) + 1} of ${where}.`);
      } else parts.push(`\`### item\`: one entry of ${where}. Do this step once per entry.`);
      const others = [...new Set(nodeRefs(node).filter((ref) => ref.head === id && ref.path !== "" && ref.path !== "output").map((ref) => ref.path.split(".")[0]))].filter((key) => key !== list.key);
      if (others.length > 0) parts.push(`\`### ${id}\`: only the ${others.map((key) => `\`${key}\``).join(" and ")} value${others.length === 1 ? "" : "s"} of the JSON in ${chatRef(ctx, id)}.`);
      continue;
    }
    const keys = jsonKeysFor(ctx.graph, source, node);
    parts.push(`\`### ${id}\`: ${keys ? `only the ${keys.map((key) => `\`${key}\``).join(" and ")} value${keys.length === 1 ? "" : "s"} of the JSON in ${chatRef(ctx, id)}` : chatRef(ctx, id)}.`);
  }
  if (input && !seen.has(input.id) && /\{\{\s*goal\s*\}\}/.test(node.prompt)) parts.unshift(`\`### ${input.id}\`: the user's request, word for word.`);
  for (const leak of analyzeIsolation(ctx.graph, node).leakedRefs) {
    const head = leak.split(".")[0];
    if (!seen.has(head) && ctx.byId.get(head)) {
      seen.add(head);
      parts.push(`\`### ${head}\`: ${chatRef(ctx, head)}.`);
    }
  }
  const lessons = ctx.state.lessons[node.id];
  if (lessons && lessons.length > 0) parts.push(`Lessons from earlier runs:\n\n${lessons.join("\n")}`);
  if (task?.kind === "candidate") {
    const candidates = probeCandidates(node);
    if (answerKey(ctx, task) === node.id) {
      parts.push(`\`### Approach\`, one per answer in your list, in this order: ${candidates.map((candidate, index) => `${index + 1}. ${candidate.hint ?? "your own best approach"}`).join("; ")}.`);
    } else parts.push(`\`### Approach\` (${candidates[task.index ?? 0]?.letter ?? "A"}): ${candidates[task.index ?? 0]?.hint ?? "Your own best approach."}`);
  }
  let feedbackShown = false;
  if (node.loop && (task === null || task.kind === "work")) {
    const iteration = task?.iteration ?? 1;
    const notes = ctx.state.notes[node.id] ?? [];
    const lines = [`\`${LOOP_HEADING}\`: try ${iteration} of at most ${node.loop.maxIterations}`];
    if (node.loop.ledger) lines.push(`- notes so far: ${notes.length > 0 ? `\n\n${notes.join("\n")}` : `none in this run (the file \`${ledgerPath(ctx.graph, node.id)}\` holds earlier runs' notes, if the user has it)`}`);
    if (iteration > 1) {
      lines.push("- your previous answer: your last answer to this step");
      if (task?.feedback) {
        lines.push(`- why it goes on: ${task.feedback}`);
        feedbackShown = true;
      }
    }
    parts.push(lines.join("\n"));
  }
  if (task?.feedback && !feedbackShown) parts.push(`\`### Feedback\` (why this is redone):\n\n${task.feedback}`);
  return parts;
}

/** How to report a task's answer, for the line under its title. */
function reportLine(ctx: RunContext, node: GraphNode, task: RunTask | null): string {
  const key = task ? answerKey(ctx, task) : node.id;
  if (node.type === "approval") return `Report under \`${key}\`: true only if the user said yes, otherwise false.`;
  if (node.type === "code" || task?.kind === "check" || task?.kind === "contract") return `Report under \`${key}\`: {"exit_code": <number>, "output": "<what it printed>"}.`;
  if ((task === null && node.foreach) || (task?.kind === "item" && key === node.id)) return `Report under \`${key}\`: a list with one answer per entry, in order.`;
  if (task?.kind === "candidate" && key === node.id) return `Report under \`${key}\`: a list with one answer per approach, in order.`;
  return `Report under \`${key}\`: the step's whole answer.`;
}

/** One step's instructions, in chat terms. `task` is null for a step that is not open yet (the sheet's later steps). */
function renderStep(ctx: RunContext, node: GraphNode, task: RunTask | null): string {
  const title = `### ${stepTitle(ctx, node)}`;
  if (task?.kind === "judge") {
    const letters = probeCandidates(node).map((candidate) => candidate.letter);
    const kept = ctx.state.kept[node.id] ?? [];
    return [
      title,
      reportLine(ctx, node, task),
      `Pick the best of your answers to ${plainStepName(node)}: ${kept.length} of ${node.probe ?? kept.length} passed their checks. Fresh eyes: judge them as if someone else wrote them, from the inputs below; where the instructions say to check claims against files, use the inputs and web search instead.`,
      "",
      "Instructions:",
      "",
      judgePrompt(ctx.graph, node),
      "",
      "Its inputs (each under its heading):",
      "",
      ...inputLines(ctx, node, { ...task, kind: "work" }).filter((part) => !part.startsWith(`\`${LOOP_HEADING}`)).map((part) => `- ${part}`),
      ...kept.map((index) => `- \`### Candidate ${letters[index]}\`: entry ${index + 1} of your list of answers to step \`${node.id}\` (or your answer under \`${node.id}/${letters[index]}\`).`),
      "",
      "End with the CHOSEN line, then a `---` line, then the chosen answer as it is.",
    ].join("\n");
  }
  if (task?.kind === "reflect") return [title, reportLine(ctx, node, task), "", renderRunTask(ctx, task)].join("\n");
  if (node.type === "approval") {
    const show = predecessorsOf(ctx.graph, node.id).map((id) => chatRef(ctx, id));
    return [
      title,
      reportLine(ctx, node, task),
      "",
      `Stop here and ask the user. Show them ${show.join("; ") || "what has been done so far"}, then ask: ${node.prompt.trim().replace(/\s+/g, " ") || "May I go on?"} Wait for their reply before going on.`,
    ].join("\n");
  }
  if (node.type === "code" || task?.kind === "check" || task?.kind === "contract") {
    const command = task?.command ?? node.run ?? node.check ?? "";
    return [
      title,
      reportLine(ctx, node, task),
      "",
      `This step runs a command: \`${command}\`. A chat cannot run it: ask the user to run it and paste what it prints, or run the workflow in Claude Code. ${task?.kind === "contract" || task?.kind === "check" ? "It checks the answer above it." : ""}`.trim(),
      ...(task?.feedback && task.kind === "command" ? ["", `\`### Feedback\` (why this is redone):\n\n${task.feedback}`] : []),
    ].join("\n");
  }
  const fresh = node.isolatedContext
    ? "Fresh eyes: answer only from the inputs listed below, and judge them as if someone else wrote them. In a chat every step runs in this one conversation, so this is on you."
    : null;
  const pending = task === null && !ctx.state.pending.some((other) => other.step === node.id) && node.probe
    ? `Try several: the run asks for ${node.probe} candidate answers and a judge when it gets here.`
    : null;
  return [
    title,
    reportLine(ctx, node, task),
    `${plainTraits(node).replace(/\.$/, "")}. ${plainTools(node)}`,
    ...(fresh ? [fresh] : []),
    ...(pending ? [pending] : []),
    "",
    "Instructions:",
    "",
    compiledPrompt(ctx.graph, node),
    "",
    "Its inputs (each under its heading):",
    "",
    ...inputLines(ctx, node, task).map((part) => `- ${part}`),
  ].join("\n");
}

/* ------------------------------------------------------------------ progress */

interface StepProgress {
  step: string;
  name: string;
  role: string;
  state: "done" | "now" | "redo" | "repeat" | "waiting" | "stopped";
  note?: string;
}

/**
 * Task kinds whose `feedback` means the step was sent back. Check and contract tasks carry the step's
 * answer reference in that field instead, so a step waiting on its check is not a redo.
 */
const REDO_KINDS: ReadonlySet<RunTask["kind"]> = new Set(["work", "item", "candidate", "command"]);

/** The step a stopped run stopped at: the unfinished step its reason names first (reasons start with the step), else the first unfinished one. */
function stoppedStep(ctx: RunContext): string | undefined {
  const { state } = ctx;
  if (!state.stopReason) return undefined;
  const reason = state.stopReason;
  const unfinished = order(ctx).filter((node) => !state.done.includes(node.id));
  let best: { id: string; at: number } | undefined;
  for (const node of unfinished) {
    const at = reason.search(new RegExp(`(?<![\\w-])${node.id.replace(/[-]/g, "\\-")}(?![\\w-])`));
    if (at !== -1 && (!best || at < best.at)) best = { id: node.id, at };
  }
  return best?.id ?? unfinished[0]?.id;
}

function progress(ctx: RunContext): StepProgress[] {
  const { state } = ctx;
  const stoppedAt = stoppedStep(ctx);
  return order(ctx).map((node) => {
    const base = { step: node.id, name: plainStepName(node), role: PLAIN_TYPE[node.type] };
    if (state.done.includes(node.id)) return { ...base, state: "done" };
    const tasks = state.pending.filter((task) => task.step === node.id);
    // A loop's next try carries "Iteration N did not end the loop" as its feedback: the step repeats, nothing sent it back.
    const again = tasks.find((task) => task.kind === "work" && (task.iteration ?? 1) > 1);
    if (again && node.loop) return { ...base, state: "repeat", note: `try ${again.iteration} of ${node.loop.maxIterations}${again.feedback ? `: ${firstLine(again.feedback.replace(/^Iteration \d+ did not end the loop:\s*/, ""), 200)}` : ""}` };
    const sentBack = tasks.find((task) => task.feedback && REDO_KINDS.has(task.kind))?.feedback;
    if (tasks.length > 0) return { ...base, state: sentBack ? "redo" : "now", ...(sentBack ? { note: plainReason(ctx, sentBack) } : {}) };
    if (node.id === stoppedAt) return { ...base, state: "stopped", note: state.stopReason };
    return { ...base, state: "waiting" };
  });
}

/**
 * Why a step was sent back, in plain words: who found it, and each thing to fix, from the referee's
 * feedback ("fact_check sent this work back: GATE: FAIL. - research: … | evidence: … | redo: …").
 */
function plainReason(ctx: RunContext, feedback: string): string {
  const who = /^([A-Za-z][\w-]*) sent this work back:/.exec(feedback)?.[1];
  const finder = who && ctx.byId.get(who) ? plainStepName(ctx.byId.get(who) as GraphNode) : null;
  const items = [...feedback.matchAll(/(?:^|\s)[-*]\s+`?[A-Za-z][\w-]*`?\s*:\s*([^\n]+)/g)].map((match) => {
    const parts = match[1].split(/\s*\|\s*/);
    const fix = parts.find((part) => /^redo:/i.test(part))?.replace(/^redo:\s*/i, "");
    return `${parts[0].trim()}${fix ? ` (fix: ${fix.trim()})` : ""}`;
  });
  if (items.length > 0) return firstLine(`${finder ?? "The check"} found: ${items.join("; ")}`, 400);
  const body = feedback
    .replace(/^[A-Za-z][\w-]* sent this work back:\s*/, "")
    .replace(/^Your previous answer (?:failed|did not match what this step must return):\s*/, "")
    .replace(/\n?Your previous answer is the output of your last task[^\n]*/, "")
    .replace(/\s*Answer again in the required format\.\s*$/, "");
  return firstLine(`${finder ? `${finder} found: ` : ""}${body}`, 400);
}

/** A referee event in plain words where it has a known shape; others pass through. */
function plainEvent(ctx: RunContext, event: string): string {
  const name = (id: string) => (ctx.byId.get(id) ? plainStepName(ctx.byId.get(id) as GraphNode) : id);
  const retry = /^([\w-]+) failed; re-running (.+) \(retry (\d+) of (\d+)\)\.$/.exec(event);
  if (retry) {
    const targets = retry[2].split(/,\s*/).map(name).join(" and ");
    return `${name(retry[1])} sent ${targets} back to fix (try ${Number(retry[3]) + 1} of ${Number(retry[4]) + 1}).`;
  }
  const contract = /^([\w/-]+): (.+); re-running it once with the problem\.$/.exec(event);
  if (contract) return `${name(contract[1].split("/")[0])} did not come back in the expected format (${contract[2]}); it runs once more.`;
  return firstLine(event, 400);
}

function firstLine(text: string, max = 220): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

const MARK: Record<StepProgress["state"], string> = { done: "✓", now: "▸", redo: "↻", repeat: "↻", waiting: "·", stopped: "✕" };

function progressLines(ctx: RunContext, steps: StepProgress[]): string[] {
  const total = steps.length;
  const stopped = steps.findIndex((step) => step.state === "stopped");
  const current = stopped !== -1 ? stopped : steps.findIndex((step) => step.state !== "done");
  const node = current === -1 ? undefined : ctx.byId.get(steps[current].step);
  const stopLine = `Stopped${stopped !== -1 ? ` at step ${stopped + 1} of ${total} (${steps[stopped].name})` : ""}: ${ctx.state.stopReason ?? "see the notes below"}`;
  const head =
    ctx.state.status === "done"
      ? `Done: all ${total} steps passed their checks.`
      : ctx.state.status === "stopped"
        ? stopLine
        : ctx.state.status === "reflecting"
          ? ctx.state.stopReason
            ? `${stopLine.replace(/\.?$/, ".")} One last task: learning from this run.`
            : "All steps ran; one last task: learning from this run."
          : node
            ? `Step ${current + 1} of ${total}: ${steps[current].name}, ${steps[current].state === "redo" ? "fixing what the check found" : steps[current].state === "repeat" ? `going round again (${steps[current].note?.split(":")[0] ?? "another try"})` : PLAIN_DOING[node.type]}.`
            : `${total} steps.`;
  const lines = steps.map((step, index) => {
    const label = { done: "done", now: "next", redo: "sent back to fix", repeat: "repeating", waiting: "waiting", stopped: "stopped" }[step.state];
    const why = step.note && step.state === "redo" ? `. Why: ${step.note}` : step.note && step.state === "repeat" ? ` (${step.note})` : "";
    return `${MARK[step.state]} ${index + 1}. ${step.name} (${step.role}): ${label}${why}`;
  });
  return [`Progress: ${head}`, ...lines];
}

/* ------------------------------------------------------------------ the final answer */

/** The text of what a finished step returned, from this call's answers, cut the way the referee cut it. */
function cleanAnswer(node: GraphNode, text: string): string {
  let body = text;
  if (node.loop) body = splitLoopAnswer(body).work;
  if (node.gate) body = parseVerdict(body)?.work ?? body;
  return body.trim();
}

/**
 * The last steps' answers, from this call's answers. A step accepted in an earlier call, or a
 * repeat-for-each step whose entries did not all come in this call, is named instead (complete: false).
 */
function finalAnswer(ctx: RunContext, given: Map<string, string[]>, candidates: Map<string, string[]>): { text: string; complete: boolean } {
  const sinks = order(ctx).filter((node) => successorsOf(ctx.graph, node.id).length === 0);
  const parts: string[] = [];
  let complete = true;
  for (const node of sinks) {
    let texts = given.get(node.id) ?? [];
    // A probe step that kept one candidate has no judge: that candidate is its answer.
    const kept = ctx.state.kept[node.id] ?? [];
    if (texts.length === 0 && node.probe && kept.length === 1) {
      const chosen = candidates.get(node.id)?.[kept[0]];
      if (chosen !== undefined) texts = [chosen];
    }
    const expected = node.foreach ? (ctx.state.items[node.id] ?? 0) : 1;
    const whole = node.foreach ? texts.length === expected && Array.from({ length: expected }, (_, index) => texts[index]).every((text) => text !== undefined) : texts.length > 0;
    if (!whole) {
      complete = false;
      const which = node.foreach ? `your accepted answers to step \`${node.id}\`, one per entry, in order` : `your last accepted answer to step \`${node.id}\``;
      parts.push(`${sinks.length > 1 ? `**${plainStepName(node)}**: ` : ""}${which}.`);
      continue;
    }
    const body = node.foreach ? texts.map((text, index) => `${index + 1}. ${cleanAnswer(node, text)}`).join("\n\n") : cleanAnswer(node, texts[texts.length - 1]);
    parts.push(sinks.length > 1 ? `## ${plainStepName(node)}\n\n${body}` : body);
  }
  const text = parts.join("\n\n");
  return { text: text.length > MAX_FINAL_CHARS ? `${text.slice(0, MAX_FINAL_CHARS - 1)}…` : text, complete };
}

/* ------------------------------------------------------------------ the tool */

function tooManyTasks(ctx: RunContext): { error: string } {
  const counts = new Map<string, number>();
  for (const task of ctx.state.pending) counts.set(task.step, (counts.get(task.step) ?? 0) + 1);
  const [step, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  return {
    error: `This run would open ${ctx.state.pending.length} tasks at once (step \`${step}\` repeats for ${count} entries), more than a chat can handle (${MAX_OPEN_TASKS}). Narrow the request, give that step a max_items (edit_graph), or compile the workflow and run it in Claude Code.`,
  };
}

/** run_graph: start a run, take any answers, and say what is next. */
export function runGraph(args: Record<string, unknown>): ChatRunResult | { error: string } {
  const answers = isRecord(args.answers) ? args.answers : {};
  if (Object.keys(answers).length > MAX_ANSWER_KEYS) return { error: `answers can hold at most ${MAX_ANSWER_KEYS} entries.` };
  const fresh = args.run === undefined;
  let ctx: RunContext;
  if (fresh) {
    const workflow = resolveWorkflow(args.workflow);
    if ("error" in workflow) return workflow;
    const request = typeof args.request === "string" ? args.request.slice(0, 20_000) : "";
    if (request.trim() === "") return { error: "request is required: what the user wants the workflow to do this time." };
    const experience = typeof args.experience === "string" ? args.experience.slice(0, MAX_LESSONS_SOURCE) : undefined;
    const created = createRun(workflow.source, request, experience, workflow.starter?.id);
    if ("error" in created) return created;
    ctx = created;
  } else {
    const loaded = loadRun(args.run);
    if ("error" in loaded) return loaded;
    ctx = loaded;
  }
  // Feed every answer that fits an open task, round after round, until none fits: an accepted step opens the next.
  const used = new Set<string>();
  const given = new Map<string, string[]>();
  const candidates = new Map<string, string[]>();
  for (let round = 0; round < 1_000; round += 1) {
    if (ctx.state.status === "done" || ctx.state.status === "stopped") break;
    // A repeat-for-each list without max_items can open thousands of tasks; matching and feeding them costs n².
    if (ctx.state.pending.length > MAX_OPEN_TASKS) return tooManyTasks(ctx);
    const batch: Record<string, unknown>[] = [];
    for (const task of ctx.state.pending) {
      const found = findAnswer(ctx, task, answers, used);
      if (!found) continue;
      used.add(found.mark);
      batch.push({ task: task.id, ...found.reply });
      const output = found.reply.output;
      // What a command printed is its step's answer too, so a workflow that ends on a command has a final answer.
      if (output !== undefined && (task.kind === "work" || task.kind === "item" || task.kind === "judge" || task.kind === "command")) {
        // Items keep their order; any other answer replaces what the step said before.
        const list = task.kind === "item" ? (given.get(task.step) ?? []) : [];
        if (task.kind === "item") list[task.index ?? 0] = output;
        else if (task.kind === "judge") {
          const at = output.search(/^---\s*$/m);
          list.push(at === -1 ? output : output.slice(at).replace(/^---\s*$/m, "").trim());
        } else list.push(output);
        given.set(task.step, list);
      }
      if (output !== undefined && task.kind === "candidate") {
        const list = candidates.get(task.step) ?? [];
        list[task.index ?? 0] = output;
        candidates.set(task.step, list);
      }
    }
    if (batch.length === 0) break;
    for (let at = 0; at < batch.length; at += FEED_CHUNK) feedRun(ctx, batch.slice(at, at + FEED_CHUNK));
  }
  if (ctx.state.pending.length > MAX_OPEN_TASKS) return tooManyTasks(ctx);
  if (runTooLarge(ctx.state)) return { error: "This run has grown too large to pass back and forth in a chat. Compile the workflow with compile_graph and run it in Claude Code." };

  const { state } = ctx;
  const steps = progress(ctx);
  const over = state.status === "done" || state.status === "stopped";
  const stepIds = new Set(ctx.graph.nodes.map((node) => node.id));
  const marks = [...used];
  const unused = Object.keys(answers).filter((key) => !used.has(key) && !marks.some((mark) => mark.startsWith(`${key}#`)));
  // Why each unused answer was not taken: no such step, its step is open but the value has the wrong shape, already accepted, or not reached yet.
  const stepOf = (key: string) => key.split("/")[0];
  const unknown = unused.filter((key) => !stepIds.has(stepOf(key)) && key !== "reflect");
  const known = unused.filter((key) => !unknown.includes(key));
  const misshapen = known.filter((key) => state.pending.some((task) => task.step === stepOf(key)));
  const accepted = known.filter((key) => !misshapen.includes(key) && state.done.includes(stepOf(key)));
  const later = known.filter((key) => !misshapen.includes(key) && !accepted.includes(key));

  const lines: string[] = [];
  const name = ctx.graph.name || "workflow";
  if (fresh) lines.push(`Running "${name}"${ctx.graph.description ? `: ${ctx.graph.description}` : ""}`, "");
  lines.push(...progressLines(ctx, steps));
  const events = ctx.events.filter((event) => !/: accepted\.$/.test(event));
  if (events.length > 0) lines.push("", "What the checks found:", ...events.map((event) => `- ${plainEvent(ctx, event)}`));
  if (unknown.length > 0) lines.push("", `These answer keys match no step and were ignored: ${unknown.map((key) => `\`${key}\``).join(", ")}. The keys are the step ids: ${order(ctx).map((node) => `\`${node.id}\``).join(", ")}.`);
  for (const key of misshapen) {
    const tasks = state.pending.filter((open) => open.step === stepOf(key));
    const node = ctx.byId.get(tasks[0].step) as GraphNode;
    const openKeys = [...new Set(tasks.map((open) => answerKey(ctx, open)))];
    if (key.includes("/") && !openKeys.includes(key) && !tasks.some((open) => open.id === key)) {
      lines.push("", `\`${key}\` is not open now. Open for that step: ${openKeys.map((open) => `\`${open}\``).join(", ")}.`);
    } else lines.push("", `\`${key}\` was not taken: its step is open, but the answer is not in a form it takes here. ${reportLine(ctx, node, tasks[0])}`);
  }
  if (accepted.length > 0) lines.push("", `Already accepted, so not used again: ${accepted.map((key) => `\`${key}\``).join(", ")}.`);
  if (later.length > 0 && !over) lines.push("", `Not used yet: ${later.map((key) => `\`${key}\``).join(", ")}. ${later.length === 1 ? "It comes" : "They come"} after a step that is open or being redone; send ${later.length === 1 ? "it" : "them"} again, redone on the new answer, once that step is accepted.`);

  let final: { text: string; complete: boolean } | null = null;
  if (state.status === "done" || (state.status === "reflecting" && !state.stopReason)) {
    final = finalAnswer(ctx, given, candidates);
    lines.push("", final.complete ? "Final answer (give it to the user as it is):" : "Final answer:", "", final.text);
  }
  if (state.stopReason) {
    lines.push("", "Tell the user where it stopped and why, in a sentence or two. They can run it again with a clearer or narrower request, or change the workflow (edit_graph).");
  }
  const notes = ctx.graph.nodes.filter((node) => node.loop?.ledger && (state.notes[node.id]?.length ?? 0) > 0);
  if (over && state.refs.reflect) {
    lines.push("", `Lessons: give the user the output of task \`reflect\` to keep (as \`${experiencePath(ctx.graph)}\` in a repository, or as a note), and pass it as \`experience\` the next time this workflow runs, so each step learns from this run.`);
  }
  if (over && notes.length > 0) {
    for (const node of notes) lines.push("", `Notes from step \`${node.id}\` (keep them as \`${ledgerPath(ctx.graph, node.id)}\` to hand to the next run):`, "", "```md", ...(state.notes[node.id] ?? []), "```");
  }

  const open = state.pending;
  if (open.length > 0) {
    const firstCall = fresh && Object.keys(answers).length === 0;
    lines.push(
      "",
      firstCall
        ? "How to run it: do the steps below in order; a step's inputs are your own earlier answers. Then call run_graph once with `run` (below, unchanged) and `answers`: one entry per step under its key, holding that step's whole answer. The checks run on every answer; if all pass, the reply is the final answer, and if one fails, the reply says which steps to redo and why. You may also report fewer steps at a time."
        : `Open now: ${open.length === 1 ? "one task" : `${open.length} tasks`}. Do ${open.length === 1 ? "it" : "them"}, and any later steps below, then call run_graph with \`run\` (below, unchanged) and \`answers\`.`
    );
    const openSteps = [...new Set(open.map((task) => task.step))];
    const rendered: string[] = [];
    const shown = new Set<string>();
    let size = 0;
    for (const task of open) {
      if (task.kind === "reflect") {
        // Not a step of the graph: the learning task that ends a run with experience on.
        rendered.push(["### Last task: learn from this run", "Report under `reflect`: the whole new lessons file, as text.", "", renderRunTask(ctx, task).split("\n").slice(1).join("\n")].join("\n"));
        continue;
      }
      const node = ctx.byId.get(task.step);
      if (!node) continue;
      // Fan-out items and probe candidates answered as one list: show the step once, with its first entry.
      const asList = (task.kind === "item" || task.kind === "candidate") && answerKey(ctx, task) === node.id;
      if (asList && shown.has(node.id)) continue;
      // Another task of a step already shown (an entry sent back alone) needs only its own inputs; past the budget, one line.
      const text = !shown.has(node.id)
        ? renderStep(ctx, node, task)
        : size > MAX_SHEET_CHARS
          ? `- \`${answerKey(ctx, task)}\`: ${plainStepName(node)} again, same instructions as above${task.feedback && REDO_KINDS.has(task.kind) ? `. Why: ${firstLine(plainReason(ctx, task.feedback), 160)}` : ""}.`
          : [`### ${stepTitle(ctx, node)}, again`, reportLine(ctx, node, task), "Same instructions as above, with these inputs:", "", ...inputLines(ctx, node, task).filter((part) => /^`### (item|Feedback|Approach)`/.test(part)).map((part) => `- ${part}`)].join("\n");
      shown.add(node.id);
      size += text.length;
      rendered.push(text);
    }
    const laterSteps = order(ctx).filter((node) => !state.done.includes(node.id) && !openSteps.includes(node.id));
    const laterRendered: string[] = [];
    for (const node of laterSteps) {
      const text = renderStep(ctx, node, null);
      size += text.length;
      laterRendered.push(size > MAX_SHEET_CHARS ? `### ${stepTitle(ctx, node)}\n${reportLine(ctx, node, null)} Its full instructions come once the steps before it are accepted.` : text);
    }
    lines.push("", rendered.join("\n\n"));
    if (laterRendered.length > 0) lines.push("", "Then, in order:", "", laterRendered.join("\n\n"));
    lines.push("", "Run object (pass it to run_graph as `run`, exactly as it is):", "", "```json", JSON.stringify(state), "```");
  } else if (state.status === "running" || state.status === "reflecting") {
    lines.push("", "Run object:", "", "```json", JSON.stringify(state), "```");
  }

  const tasks = open.map((task) => ({ id: task.id, step: task.step, kind: task.kind, answer_key: answerKey(ctx, task) }));
  return {
    text: lines.join("\n"),
    data: {
      status: state.status,
      progress: steps.map((step) => ({ step: step.step, name: step.name, role: step.role, state: step.state, ...(step.note ? { note: step.note } : {}) })),
      tasks,
      ...(over ? {} : { run: state }),
      ...(final ? { final_answer: final.text } : {}),
      ...(state.stopReason ? { stop_reason: state.stopReason } : {}),
      ...(unused.length > 0 ? { unused_answers: unused } : {}),
    },
  };
}
