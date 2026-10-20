/**
 * Dry run: walks a graph's plan with a sample request, without running a model, and shows what each
 * step would receive, what it must hand back, what checks it, and where a failure sends the run. Each
 * checker issue is shown at the step it would hit, so a broken handoff shows up before the first real run.
 */
import { handOff, outputSummary } from "./graphExport";
import { buildPlan, contractChecks, redoableSteps } from "./graphPlan";
import {
  DEFAULT_MAX_RETRIES,
  foreachListName,
  foreachSource,
  isKeyedJson,
  jsonOutputKeys,
  retriesOnFail,
  runsWithoutSubagent,
  successorsOf,
  validateGraph,
  type GraphIssue,
  type GraphNode,
  type SkillGraph,
} from "./graphSkill";

/** How much of the sample request each line quotes. */
const SAMPLE_PREVIEW = 160;

export interface DryRun {
  /** The walk-through as plain text, one block per step. */
  text: string;
  errors: number;
  warnings: number;
  /** Subagent calls on a run where every check passes first time (fan-out steps count once per item). */
  subagentCalls: number;
}

function quote(sample: string): string {
  const flat = sample.replace(/\s+/g, " ").trim();
  return `"${flat.length > SAMPLE_PREVIEW ? `${flat.slice(0, SAMPLE_PREVIEW - 1)}…` : flat}"`;
}

function stepTitle(node: GraphNode): string {
  const traits = [
    node.type,
    node.model,
    node.isolatedContext ? "fresh context" : null,
    node.foreach ? "fans out" : null,
    node.probe ? `${node.probe} candidates` : null,
    node.risk && node.risk !== "contained" ? `${node.risk} reach` : null,
  ].filter(Boolean);
  return `${node.label.trim() || node.id} (\`${node.id}\`): ${traits.join(", ")}`;
}

function issueLine(issue: GraphIssue): string {
  return `  ${issue.severity === "error" ? "✗ error" : "! warning"} [${issue.code}] ${issue.message}`;
}

function returnsLine(graph: SkillGraph, node: GraphNode): string {
  if (node.type === "code") return `  - Runs: \`${node.run ?? ""}\`. Its output is what it prints; exit code 0 passes.`;
  if (node.type === "approval") return "  - Asks the user. Goes on only on an explicit yes; the answer is this step's output.";
  const summary = outputSummary(graph, node);
  const keys = isKeyedJson(graph, node) ? jsonOutputKeys(graph, node) : [];
  const keyed = keys.length > 0 ? `, one key per step that reads it (${keys.map((key) => `\`${key}\``).join(", ")})` : "";
  return summary ? `  - Must return: ${summary}${keyed}.` : "  - Must return: free text (no contract on its outgoing edges, so nothing checks its shape).";
}

function checkLines(graph: SkillGraph, node: GraphNode): string[] {
  const lines: string[] = [];
  for (const check of contractChecks(graph, node)) lines.push(`  - Contract \`${check.contract}\` is checked by: ${check.commands.map((command) => `\`${command}\``).join(", ")}.`);
  if (node.check) lines.push(`  - Checked by the command \`${node.check}\` (exit code 0 passes).`);
  if (node.gate) lines.push(`  - Gate: ${node.gate.trim()} The step ends with GATE: PASS or GATE: FAIL; the verdict is cut off before its output goes on.`);
  if (lines.length === 0 && !runsWithoutSubagent(node.type)) lines.push("  - Nothing checks this step: its output goes on as it is.");
  return lines;
}

function failureLine(graph: SkillGraph, node: GraphNode): string | null {
  const fails = node.gate !== undefined || node.check !== undefined || node.type === "code";
  if (!fails) return null;
  if (!retriesOnFail(node) || node.risk === "irreversible") return "  - If it fails: the run stops and shows the user why.";
  const redo = redoableSteps(graph, node).map((step) => `\`${step.id}\``);
  const retries = node.maxRetries ?? DEFAULT_MAX_RETRIES;
  if (redo.length === 0) return "  - If it fails: nothing upstream can redo the work, so the run stops.";
  // A gate's verdict names the steps to redo; a failed command re-runs the whole retry path.
  const which = node.gate ? `the steps the verdict names (out of ${redo.join(", ")})` : redo.join(", ");
  return `  - If it fails: re-runs ${which}, at most ${retries} ${retries === 1 ? "time" : "times"}, then this step again; if it still fails, the run stops.`;
}

/** Walks the plan of `graph` with `sample` as the user's request. */
export function dryRunGraph(graph: SkillGraph, sample: string): DryRun {
  const issues = validateGraph(graph);
  const byStep = new Map<string, GraphIssue[]>();
  const general: GraphIssue[] = [];
  for (const issue of issues) {
    if (issue.nodeId && graph.nodes.some((node) => node.id === issue.nodeId)) byStep.set(issue.nodeId, [...(byStep.get(issue.nodeId) ?? []), issue]);
    else general.push(issue);
  }
  const request = sample.trim() ? quote(sample) : "(no sample given: the user's request)";
  const input = graph.nodes.find((node) => node.type === "input");
  const lines: string[] = [`Dry run of "${graph.name || "skill graph"}". No model runs: this walks the plan and checks each handoff.`, "", `Request (\`${input?.id ?? "input"}\`): ${request}`];
  for (const issue of input ? (byStep.get(input.id) ?? []) : []) lines.push(issueLine(issue));

  let subagentCalls = 0;
  for (const stage of buildPlan(graph)) {
    lines.push("", `Stage ${stage.number}${stage.nodes.length > 1 ? ` (${stage.nodes.length} steps at the same time)` : ""}`);
    for (const node of stage.nodes) {
      if (!runsWithoutSubagent(node.type)) subagentCalls += node.probe ? node.probe + 1 : 1;
      const list = foreachSource(node);
      lines.push(`- ${stepTitle(node)}`);
      if (list) lines.push(`  - Runs once per entry of ${foreachListName(list)} from \`${list.node}\`${node.maxItems ? `, at most ${node.maxItems} entries` : ""}.`);
      // The goal is the sample, so name it where the step receives it.
      lines.push(`  - Receives: ${handOff(graph, node).map((part) => (part === "the user's goal" ? `the request ${request}` : part)).join("; ")}.`);
      lines.push(returnsLine(graph, node), ...checkLines(graph, node));
      const failure = failureLine(graph, node);
      if (failure) lines.push(failure);
      const next = [...new Set(successorsOf(graph, node.id))];
      lines.push(next.length > 0 ? `  - Then hands its output to: ${next.map((id) => `\`${id}\``).join(", ")}.` : "  - Its output is the final answer.");
      for (const issue of byStep.get(node.id) ?? []) lines.push(issueLine(issue));
    }
  }
  if (general.length > 0) lines.push("", "Whole graph:", ...general.map(issueLine));

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  const fanOut = graph.nodes.some((node) => node.foreach !== undefined && !runsWithoutSubagent(node.type));
  lines.push(
    "",
    `Result: ${errors === 0 && warnings === 0 ? "every handoff lines up." : `${errors} ${errors === 1 ? "error" : "errors"} and ${warnings} ${warnings === 1 ? "warning" : "warnings"}, shown at the step they affect.`}`,
    `A run where every check passes first time makes ${subagentCalls} subagent ${subagentCalls === 1 ? "call" : "calls"}${fanOut ? " (a fan-out step counts once here; it runs once per item)" : ""}.`
  );
  return { text: lines.join("\n"), errors, warnings, subagentCalls };
}
