/**
 * Execution plan for a graph skill, computed without running anything.
 *
 * The agent (Claude Code, Cursor, ...) executes the graph; this module describes what it will do:
 * the stages it runs (nodes in one stage run in parallel), and for each node the exact context its
 * subagent receives — its prompt with references resolved to placeholders, plus the payloads on its
 * incoming edges. The same per-node instructions are compiled into the exported subagent files, so the
 * preview in the studio and the files the agent reads never drift apart.
 */
import {
  contractFormat,
  executionWaves,
  extractTemplateRefs,
  predecessorsOf,
  resolveGroup,
  toSlug,
  getContract,
  isKeyedJson,
  wantsJsonOutput,
  type GraphNode,
  type SkillGraph,
} from "./graphSkill";

export interface ContextSource {
  id: string;
  /** True when the material arrives through an incoming edge (or is the goal). */
  direct: boolean;
}

export interface ContextPreview {
  /** The node's instructions as its subagent will read them. */
  system: string;
  /** The task message the orchestrator hands over: the incoming payloads the prompt does not already embed. */
  user: string;
  sources: ContextSource[];
}

export interface PlanStage {
  /** 1-based stage number. */
  number: number;
  nodes: GraphNode[];
}

const TEMPLATE_PATTERN = /\{\{\s*([A-Za-z0-9_.\-[\]]+?)\s*\}\}/g;

function labelOf(graph: SkillGraph, id: string): string {
  return graph.nodes.find((node) => node.id === id)?.label ?? id;
}

/** Stages the agent runs in order; every node in a stage can start at the same time. */
export function buildPlan(graph: SkillGraph): PlanStage[] {
  return executionWaves(graph)
    .map((wave) => wave.filter((node) => node.type !== "input"))
    .filter((wave) => wave.length > 0)
    .map((nodes, index) => ({ number: index + 1, nodes }));
}

/** Rough token count (about four characters per token) for sizing what an agent loads. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Where the agent saves a node's output so a `code` step's command can read it. */
export function payloadPath(graph: SkillGraph, id: string): string {
  const node = graph.nodes.find((n) => n.id === id);
  const ext = node && node.type !== "input" && wantsJsonOutput(graph, node) ? "json" : "md";
  return `.skill-graph/${toSlug(graph.name)}/${id}.${ext}`;
}

/** Node ids a `{{...}}` reference stands for (the goal resolves to the input node). */
function refSources(graph: SkillGraph, node: GraphNode, head: string): string[] {
  if (head === "goal") return graph.nodes.filter((n) => n.type === "input").map((n) => n.id);
  if (head === "inputs") return predecessorsOf(graph, node.id);
  if (graph.nodes.some((n) => n.id === head)) return [head];
  return resolveGroup(graph, head).map((member) => member.id);
}

/** A `code` node's command with every `{{ref}}` replaced by the path of the file holding that output. */
export function compileRun(graph: SkillGraph, node: GraphNode): string {
  return (node.run ?? "").replace(TEMPLATE_PATTERN, (full, raw: string) => {
    const head = raw.split(".")[0];
    const sources = refSources(graph, node, head);
    return sources.length > 0 ? sources.map((id) => payloadPath(graph, id)).join(" ") : full;
  });
}

/** Outputs a `code` node's command reads, in the files the agent must write before running it. */
export function payloadFiles(graph: SkillGraph, node: GraphNode): { id: string; path: string }[] {
  const ids = new Set<string>();
  for (const ref of extractTemplateRefs(node.run ?? "")) refSources(graph, node, ref.head).forEach((id) => ids.add(id));
  return [...ids].map((id) => ({ id, path: payloadPath(graph, id) }));
}

/**
 * Lines appended to a node's prompt: what to return, how to treat its context, its checks and its
 * blast radius. Shared by the context preview and the exported subagent files.
 */
export function nodeInstructions(graph: SkillGraph, node: GraphNode): string[] {
  const lines: string[] = [];
  const outgoing = graph.edges.filter((edge) => edge.from === node.id && edge.contract);
  const contracts = [...new Set(outgoing.map((edge) => edge.contract as string))];
  if (wantsJsonOutput(graph, node)) {
    const keyed = graph.edges.filter((edge) => edge.from === node.id).map((edge) => `\`${edge.to}\``);
    lines.push(
      keyed.length > 1
        ? `Return a single JSON object with one key per downstream node (${keyed.join(", ")}). No prose and no code fences.`
        : "Return a single valid JSON value. No prose and no code fences."
    );
  }
  for (const name of contracts) {
    const contract = getContract(graph, name);
    const format = contractFormat(graph, name);
    lines.push(`Your output must follow the \`${name}\` contract (${format})${contract?.description ? `: ${contract.description}` : "."}`);
  }
  if (node.isolatedContext) {
    lines.push("You start with a fresh context. Use only what is in this task; anything else is unavailable to you.");
  }
  if (node.check) {
    // Scoped Bash (`Bash(npm test:*)`) can run the check too.
    const canRun = node.tools === undefined || node.tools.some((tool) => tool === "Bash" || tool.startsWith("Bash("));
    lines.push(`A program checks your work: \`${node.check}\` must exit with code 0.${canRun ? " Run it yourself before you answer and fix what fails." : ""}`);
  }
  if (node.risk === "irreversible") lines.push("This step is hard to undo. Do exactly what the task says and nothing more, and list every action you took.");
  else if (node.risk === "wide") lines.push("This step reaches widely. Keep every change inside the scope of the task.");
  if (node.gate) {
    lines.push(`Gate: ${node.gate}`);
    lines.push(
      "End your answer with `GATE: PASS`, or with `GATE: FAIL` followed by one line per step that must redo work: `- <node id>: <what is wrong> | evidence: <file, line, quote or output> | redo: <exactly what to change>`. Name only the steps that failed."
    );
  }
  return lines;
}

/** Which direct predecessors a prompt already embeds through `{{...}}`, so they are not repeated in the task. */
function embeddedPredecessors(graph: SkillGraph, node: GraphNode): Set<string> {
  const preds = new Set(predecessorsOf(graph, node.id));
  const covered = new Set<string>();
  for (const ref of extractTemplateRefs(node.prompt)) {
    if (ref.head === "goal") {
      const input = graph.nodes.find((n) => n.type === "input");
      if (input) covered.add(input.id);
    } else if (ref.head === "inputs") {
      preds.forEach((id) => covered.add(id));
    } else if (preds.has(ref.head)) {
      covered.add(ref.head);
    } else {
      resolveGroup(graph, ref.head).forEach((member) => covered.add(member.id));
    }
  }
  return covered;
}

/** What the node's subagent will receive, with upstream outputs shown as ⟨placeholders⟩. */
export function previewNodeContext(graph: SkillGraph, node: GraphNode): ContextPreview {
  if (node.type === "code") {
    const files = payloadFiles(graph, node);
    return {
      system: `Runs without a model:\n$ ${compileRun(graph, node)}`,
      user: files.length > 0 ? files.map((file) => `${file.path} ← ⟨output of ${file.id}⟩`).join("\n") : "No inputs saved; the command works on the repository as it is.",
      sources: files.map((file) => ({ id: file.id, direct: predecessorsOf(graph, node.id).includes(file.id) || graph.nodes.some((n) => n.id === file.id && n.type === "input") })),
    };
  }
  if (node.type === "approval") {
    const preds = predecessorsOf(graph, node.id);
    return {
      system: node.prompt.trim() || "Ask the user to approve before the run continues.",
      user: preds.length > 0 ? preds.map((id) => `### Shown to the user: ${labelOf(graph, id)}\n⟨output of ${id}⟩`).join("\n\n") : "Proceed with your instructions.",
      sources: preds.map((id) => ({ id, direct: true })),
    };
  }
  const preds = new Set(predecessorsOf(graph, node.id));
  const input = graph.nodes.find((n) => n.type === "input");
  const sources = new Map<string, boolean>();
  const note = (id: string) => sources.set(id, preds.has(id) || id === input?.id);

  const prompt = node.prompt.replace(TEMPLATE_PATTERN, (full, raw: string) => {
    const dot = raw.indexOf(".");
    const head = dot === -1 ? raw : raw.slice(0, dot);
    const path = dot === -1 ? "" : raw.slice(dot + 1);
    if (head === "goal") {
      if (input) note(input.id);
      return "⟨goal⟩";
    }
    if (head === "inputs") {
      return [...preds].map((id) => (note(id), `⟨output of ${id}⟩`)).join("\n");
    }
    if (graph.nodes.some((n) => n.id === head)) {
      note(head);
      return path === "" || path === "output" ? `⟨output of ${head}⟩` : `⟨${head}.${path}⟩`;
    }
    const group = resolveGroup(graph, head);
    if (group.length > 0) {
      group.forEach((member) => note(member.id));
      return group.map((member) => `### Output from ${member.label}\n⟨output of ${member.id}⟩`).join("\n\n");
    }
    return full;
  });

  const embedded = embeddedPredecessors(graph, node);
  const blocks: string[] = [];
  for (const sourceId of preds) {
    if (embedded.has(sourceId)) continue;
    const edge = graph.edges.find((e) => e.from === sourceId && e.to === node.id);
    note(sourceId);
    // A JSON source keyed by node id hands each target only its own slice (keyed only when it feeds several steps).
    const source = graph.nodes.find((n) => n.id === sourceId);
    const slice = source && isKeyedJson(graph, source) ? `⟨${sourceId}.${node.id}⟩` : `⟨output of ${sourceId}⟩`;
    blocks.push(`### Input from ${labelOf(graph, sourceId)}${edge?.contract ? ` (contract: ${edge.contract})` : ""}\n${slice}`);
  }

  const instructions = nodeInstructions(graph, node);
  return {
    system: instructions.length > 0 ? `${prompt.trim()}\n\n${instructions.join("\n")}` : prompt.trim(),
    user: blocks.length > 0 ? blocks.join("\n\n") : "Proceed with your instructions.",
    sources: [...sources.entries()].map(([id, direct]) => ({ id, direct })),
  };
}
