/**
 * What an exported kit lets the agent do: the commands it runs and the steps with shell, edit, MCP or
 * unlimited tool access. Shown before a graph that came from a link is exported (studio and download page).
 */
import { runsWithoutSubagent, type SkillGraph } from "./graphSkill";

export interface GraphPermissions {
  commands: { id: string; command: string }[];
  /** Step ids with shell access (Bash). */
  shell: string[];
  /** Step ids that edit or write files. */
  writers: string[];
  /** MCP tool names, deduplicated. */
  mcp: string[];
  /** Model steps without a tools list: their subagent inherits every tool. */
  unlimited: string[];
}

export function summarizePermissions(graph: SkillGraph): GraphPermissions {
  return {
    commands: graph.nodes.flatMap((node) => [node.run, node.check].filter((command): command is string => Boolean(command)).map((command) => ({ id: node.id, command }))),
    shell: graph.nodes.filter((node) => node.tools?.some((tool) => tool === "Bash" || tool.startsWith("Bash("))).map((node) => node.id),
    writers: graph.nodes.filter((node) => node.tools?.some((tool) => tool === "Edit" || tool === "Write")).map((node) => node.id),
    mcp: [...new Set(graph.nodes.flatMap((node) => (node.tools ?? []).filter((tool) => tool.startsWith("mcp__"))))],
    // A subagent without a tools list (or an empty one) inherits every tool: shell, edits and MCP included.
    unlimited: graph.nodes.filter((node) => !runsWithoutSubagent(node.type) && (node.tools === undefined || node.tools.length === 0)).map((node) => node.id),
  };
}

/** True when the kit can run commands, use the shell, edit files, call MCP tools or use every tool. */
export function hasPermissions(permissions: GraphPermissions): boolean {
  return Object.values(permissions).some((list) => list.length > 0);
}
