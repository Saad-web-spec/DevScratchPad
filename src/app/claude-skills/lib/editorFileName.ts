import type { OutputFormat } from "./ruleGenerator";

/**
 * File name shown in the editor tab, the download button tooltip, and the mobile action bar.
 * Not derived from getExportTarget(): it mixes bare download names (SKILL.md, copilot-instructions.md)
 * with repository paths (.cursor/rules/<slug>.mdc), and its slug keeps the skill name's case with a
 * "rule" fallback, so reusing either export field would change the displayed text.
 */
export function getEditorFileName(format: OutputFormat, skillName: string): string {
  const safeSkill = (skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-");
  if (format === "skill_md") return "SKILL.md";
  if (format === "claude_md") return "CLAUDE.md";
  if (format === "cursor_mdc") return `.cursor/rules/${safeSkill}.mdc`;
  if (format === "mcp_json") return "claude_desktop_config.json";
  if (format === "agents_md") return "AGENTS.md";
  if (format === "windsurf_cascade") return `.windsurf/rules/${safeSkill}.md`;
  if (format === "copilot_instructions") return "copilot-instructions.md";
  if (format === "openai_instructions") return "openai-custom-instructions.md";
  if (format === "gemini_prompts") return "gemini-system-instructions.json";
  if (format === "cursorignore") return ".cursorignore";
  if (format === "claudeignore") return ".claudeignore";
  if (format === "llms_txt") return "llms.txt";
  if (format === "architecture_md") return "ARCHITECTURE.md";
  if (format === "prd_md") return "PRD.md";
  if (format === "design_md") return "DESIGN.md";
  if (format === "task_md") return "TASK.md";
  if (format === "memory_md") return "MEMORY.md";
  return "AGENTS.md";
}
