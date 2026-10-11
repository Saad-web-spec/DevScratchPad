import type { OutputFormat } from "./ruleGenerator";
import { generateSafeSlug } from "./slugUtils";

/** Where one generated file is downloaded to and where it belongs in a repository. */
export interface ExportTarget {
  /** File name used for a single-file download. */
  downloadName: string;
  /** Path relative to the repository root. Also the path inside the AI kit ZIP. */
  repoPath: string;
  mimeType: string;
}

const MARKDOWN = "text/markdown;charset=utf-8;";
const PLAIN = "text/plain;charset=utf-8;";
const JSON_MIME = "application/json;charset=utf-8;";

/** Every format, in the order files are written to the AI kit ZIP. */
export const EXPORT_FORMATS: readonly OutputFormat[] = [
  "cursor_mdc",
  "skill_md",
  "claude_md",
  "agents_md",
  "mcp_json",
  "windsurf_cascade",
  "copilot_instructions",
  "openai_instructions",
  "gemini_prompts",
  "cursorignore",
  "claudeignore",
  "llms_txt",
  "architecture_md",
  "prd_md",
  "design_md",
  "task_md",
  "memory_md",
];

/** POSIX-safe slug for file and folder names derived from the skill name. */
export function toFileSlug(skillName: string): string {
  const posixSafe = (skillName || "ai-rule").replace(/[^a-zA-Z0-9._-]/g, "-");
  return generateSafeSlug(posixSafe).replace(/[^a-zA-Z0-9._-]/g, "-") || "ai-rule";
}

export function getExportTarget(format: OutputFormat, skillName: string): ExportTarget {
  const slug = toFileSlug(skillName);
  switch (format) {
    case "cursor_mdc":
      return { downloadName: `${slug}.mdc`, repoPath: `.cursor/rules/${slug}.mdc`, mimeType: MARKDOWN };
    case "skill_md":
      return { downloadName: "SKILL.md", repoPath: `.claude/skills/${slug}/SKILL.md`, mimeType: MARKDOWN };
    case "claude_md":
      return { downloadName: "CLAUDE.md", repoPath: "CLAUDE.md", mimeType: MARKDOWN };
    case "agents_md":
      return { downloadName: "AGENTS.md", repoPath: "AGENTS.md", mimeType: MARKDOWN };
    case "mcp_json":
      // Claude Code reads project-scoped MCP servers from .mcp.json in the repository root
      return { downloadName: "claude_desktop_config.json", repoPath: ".mcp.json", mimeType: JSON_MIME };
    case "windsurf_cascade":
      return { downloadName: `${slug}.md`, repoPath: `.windsurf/rules/${slug}.md`, mimeType: MARKDOWN };
    case "copilot_instructions":
      return { downloadName: "copilot-instructions.md", repoPath: ".github/copilot-instructions.md", mimeType: MARKDOWN };
    case "openai_instructions":
      return { downloadName: "openai-custom-instructions.md", repoPath: "prompts/openai-custom-instructions.md", mimeType: MARKDOWN };
    case "gemini_prompts":
      return { downloadName: "gemini-system-instructions.json", repoPath: "prompts/gemini-system-instructions.json", mimeType: JSON_MIME };
    case "cursorignore":
      return { downloadName: ".cursorignore", repoPath: ".cursorignore", mimeType: PLAIN };
    case "claudeignore":
      return { downloadName: ".claudeignore", repoPath: ".claudeignore", mimeType: PLAIN };
    case "llms_txt":
      return { downloadName: "llms.txt", repoPath: "llms.txt", mimeType: PLAIN };
    case "architecture_md":
      return { downloadName: "ARCHITECTURE.md", repoPath: "ARCHITECTURE.md", mimeType: MARKDOWN };
    case "prd_md":
      return { downloadName: "PRD.md", repoPath: "PRD.md", mimeType: MARKDOWN };
    case "design_md":
      return { downloadName: "DESIGN.md", repoPath: "DESIGN.md", mimeType: MARKDOWN };
    case "task_md":
      return { downloadName: "TASK.md", repoPath: "TASK.md", mimeType: MARKDOWN };
    case "memory_md":
      return { downloadName: "MEMORY.md", repoPath: "MEMORY.md", mimeType: MARKDOWN };
  }
}
