/**
 * Plain-English names for the graph format's terms, for people who never read the format: what the
 * connector's run_graph and save_workflow say in a chat. The file format keeps its own names
 * (`type: verifier`, `foreach:`), so nothing written in a graph.skill.md changes.
 */
import type { GraphNode, NodeType } from "./graphSkill";

/** What each step type is called on screen and in chat. */
export const PLAIN_TYPE: Record<NodeType, string> = {
  input: "Your request",
  orchestrator: "Planner",
  worker: "Worker",
  verifier: "Checker",
  synthesizer: "Writer",
  agent: "Helper",
  code: "Command",
  approval: "Your OK",
};

/** What a step of each type is doing while it runs, for a progress line ("Step 2 of 4: checking"). */
export const PLAIN_DOING: Record<NodeType, string> = {
  input: "reading your request",
  orchestrator: "planning",
  worker: "working",
  verifier: "checking",
  synthesizer: "writing it up",
  agent: "working",
  code: "running a command",
  approval: "waiting for your OK",
};

/** A step's display name without the numbering blueprints put in labels ("3. WORKER 1: Research" → "Worker 1: Research"). */
export function plainStepName(node: GraphNode): string {
  const raw = node.label.replace(/^[\d\s&.]+/, "").trim() || node.id.replace(/[_-]+/g, " ");
  // Labels are often upper case on the canvas; in a sentence they read better in sentence case.
  const text = raw === raw.toUpperCase() ? raw.toLowerCase() : raw;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** One line on what a step does, in plain words: "Checker, fresh eyes, repeat for each entry of plan.items". */
export function plainTraits(node: GraphNode): string {
  const traits: string[] = [PLAIN_TYPE[node.type]];
  if (node.foreach) traits.push(`repeats for each entry of ${node.foreach}`);
  if (node.probe) traits.push(`tries ${node.probe} ways and keeps the best`);
  if (node.loop) traits.push(`repeats until ${node.loop.until === "check" ? "its check passes" : node.loop.until === "gate" ? "it passes its own rule" : "it says it is done"} (at most ${node.loop.maxIterations} times)`);
  if (node.isolatedContext && node.type !== "input") traits.push("fresh eyes");
  if (node.gate) traits.push(`pass rule: ${node.gate}`);
  return traits.join(" · ");
}

/** What a step may use, in chat terms: Claude's web search, files shared in the chat, connected apps. */
export function plainTools(node: GraphNode): string {
  const tools = node.tools;
  const uses = new Set<string>();
  const cannot = new Set<string>();
  if (tools === undefined) uses.add("any tool this chat has");
  for (const tool of tools ?? []) {
    const base = tool.replace(/\(.*$/, "");
    if (base === "WebSearch") uses.add("web search");
    else if (base === "WebFetch") uses.add("opening web pages");
    else if (base === "Read" || base === "Grep" || base === "Glob" || base === "LS") uses.add("files shared in this chat");
    else if (base === "Bash") cannot.add("running commands");
    else if (base === "Edit" || base === "Write" || base === "MultiEdit" || base === "NotebookEdit") cannot.add("editing files");
    else if (base.startsWith("mcp__")) uses.add(`the ${base.split("__")[1]?.replace(/[_-]+/g, " ") ?? "connected"} connector`);
  }
  // A connected app (Drive, Sheets, a calendar) is the user's own data in this chat; any step may use it when its task needs it.
  uses.add("the apps you have connected to this chat (for example Google Drive or Sheets) when the task needs them");
  const text = `Can use: ${[...uses].join(", ")}.`;
  return cannot.size > 0 ? `${text} In a chat it cannot do ${[...cannot].join(" or ")}; describe the change instead, and say so.` : text;
}
