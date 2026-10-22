/**
 * Workflows for people who are not developers, as the connector handles them: a graph opened from a
 * starter id, a link or its source, run in a chat with run_graph, and kept as a link (nothing is
 * stored on a server). Shared by the connector's run_graph and save_workflow tools.
 */
import { decodeShareHash } from "./graphShare";
import { MAX_SOURCE_LENGTH } from "./graphSkill";
import { CONNECTOR_TEMPLATES, type Blueprint } from "./graphTemplates";

export interface ResolvedWorkflow {
  source: string;
  /** Set when the workflow is a starter graph. */
  starter?: Blueprint;
}

/** Reads a workflow given as a starter id, a Skill Graph link (or its `#g=` part), or graph.skill.md text. */
export function resolveWorkflow(value: unknown): ResolvedWorkflow | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "workflow is required: a starter id (list_graph_templates lists them), a Skill Graph link, or the graph.skill.md text." };
  }
  const text = value.trim();
  const starter = CONNECTOR_TEMPLATES.find((blueprint) => blueprint.id === text);
  if (starter) return { source: starter.source, starter };
  // A link carries the graph after #g= (or the older #graph=); anything with a frontmatter line is the source itself.
  const at = text.search(/#(?:g|graph)=/);
  if (at !== -1) {
    const shared = decodeShareHash(text.slice(at));
    if (shared) return { source: shared.source };
    return { error: "This Skill Graph link could not be read: it may have been cut off. The whole link is needed, including everything after #g=." };
  }
  if (/^---\s*$/m.test(text)) {
    if (text.length > MAX_SOURCE_LENGTH) return { error: `The workflow is too large (${text.length.toLocaleString("en-US")} characters; the limit is ${MAX_SOURCE_LENGTH.toLocaleString("en-US")}).` };
    return { source: value };
  }
  return {
    error: `"${text.slice(0, 60)}" is not a starter id, a Skill Graph link or graph.skill.md text. Starter ids: ${CONNECTOR_TEMPLATES.map((blueprint) => blueprint.id).join(", ")}.`,
  };
}

/** What a person pastes into a chat to run a saved workflow again. */
export function workflowPrompt(name: string, link: string, request?: string): string {
  const what = request && request.trim() ? request.trim() : "(say what it should work on)";
  return [`Run my Skill Graph workflow "${name}" with run_graph.`, `Workflow: ${link}`, `Request: ${what}`].join("\n");
}
