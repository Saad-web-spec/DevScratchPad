/**
 * Pure helpers behind the editor toolbar's CLI install popover: which preset the raw install endpoint
 * (/api/raw/<formatSlug>/<presetSlug>) should stream, where the file lands in the repository, and which
 * command each popover tab shows.
 */

import { FORMAT_TO_URL_SLUG, PRESET_ROUTES, SLUG_ALIASES } from "./presetRegistry";
import { MCP_PRESETS, PRESETS, type InstallCommands, type OutputFormat, type SkillPreset } from "./ruleGenerator";

/** Tabs of the CLI install popover. */
export type CliTab = "bash" | "powershell" | "wget" | "heredoc" | "cli";

/** Format slug used by the raw install endpoint. */
export function getCliFormatSlug(format: OutputFormat): string {
  return FORMAT_TO_URL_SLUG[format] || "cursor-rules";
}

export interface ActivePresetSlugInput {
  format: OutputFormat;
  /** getCliFormatSlug(format) */
  formatSlug: string;
  mcpPresetId: string;
  mcpServerName: string;
  selectedPresetId: string;
  initialPresetId?: string;
  initialPresetSlug?: string;
  skillName: string;
}

/** Preset slug for the raw install endpoint: the MCP preset, the spoke page's own slug, or the selected preset's canonical slug. */
export function resolveActivePresetSlug({
  format,
  formatSlug,
  mcpPresetId,
  mcpServerName,
  selectedPresetId,
  initialPresetId,
  initialPresetSlug,
  skillName,
}: ActivePresetSlugInput): string {
  if (format === "mcp_json") {
    return mcpPresetId || mcpServerName || "filesystem";
  }
  if (initialPresetSlug && selectedPresetId === initialPresetId) {
    return initialPresetSlug;
  }
  const matchedRoute = PRESET_ROUTES.find(
    (r) => (r.presetId === selectedPresetId || r.presetSlug === selectedPresetId) && r.formatSlug === formatSlug
  );
  if (matchedRoute) return matchedRoute.presetSlug;

  const matchedPreset = PRESETS.find((p) => p.id === selectedPresetId);
  if (matchedPreset) {
    return SLUG_ALIASES[matchedPreset.slug] || matchedPreset.slug;
  }
  return skillName || "rule";
}

export interface TargetInstallFileInput {
  format: OutputFormat;
  /** getCliFormatSlug(format) */
  formatSlug: string;
  /** resolveActivePresetSlug(...) */
  presetSlug: string;
  selectedPresetId: string;
  isManuallyEdited: boolean;
  skillName: string;
}

/**
 * Repository path the install commands write to (shown as "Target:" in the popover).
 * Unedited presets use their route's target file; otherwise the path is derived from the skill name.
 * This is not getExportTarget().repoPath: the MCP file name and the slug normalization differ.
 */
export function resolveTargetInstallFile({
  format,
  formatSlug,
  presetSlug,
  selectedPresetId,
  isManuallyEdited,
  skillName,
}: TargetInstallFileInput): string {
  const matchedRoute = PRESET_ROUTES.find(
    (r) => (r.presetSlug === presetSlug || r.presetId === selectedPresetId) && r.formatSlug === formatSlug
  );
  if (matchedRoute && !isManuallyEdited) {
    return matchedRoute.targetFile;
  }

  const safeSkill = (skillName || presetSlug || "skill").replace(/[^a-zA-Z0-9._-]/g, "-");
  if (format === "skill_md") return `.claude/skills/${safeSkill}/SKILL.md`;
  if (format === "claude_md") return "CLAUDE.md";
  if (format === "cursor_mdc") return `.cursor/rules/${safeSkill}.mdc`;
  if (format === "mcp_json") return "claude_desktop_config.json";
  if (format === "agents_md") return "AGENTS.md";
  if (format === "windsurf_cascade") return `.windsurf/rules/${safeSkill}.md`;
  if (format === "copilot_instructions") return ".github/copilot-instructions.md";
  if (format === "openai_instructions") return "prompts/openai-custom-instructions.md";
  if (format === "gemini_prompts") return "prompts/gemini-system-instructions.json";
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

/** PowerShell here-string that writes `content` to `targetFile`, creating its directory first. */
export function getPowershellHeredocCommand(targetFile: string, content: string): string {
  const lastSlash = targetFile.lastIndexOf("/");
  const targetDir = lastSlash !== -1 ? targetFile.substring(0, lastSlash) : "";
  const winDir = targetDir.replace(/\//g, "\\");
  const winFile = targetFile.replace(/\//g, "\\");
  const mkdirPs = winDir ? `New-Item -ItemType Directory -Force -Path "${winDir}"; ` : "";
  // A line starting with '@ would close the here-string early
  const safeContent = content.trim().replace(/\n'@/g, "\n '@");
  return `${mkdirPs}@'\n${safeContent}\n'@ | Set-Content -Path "${winFile}" -Encoding UTF8`;
}

export interface CliCommandSet {
  commands: InstallCommands;
  heredocCommand: string;
  powershellHeredoc: string;
}

/**
 * Command shown in the popover for the active tab. Customized content cannot be fetched from the
 * preset stream, so it only offers the heredoc (Bash) and PowerShell here-string variants.
 */
export function selectCliCommand(
  tab: CliTab,
  isCustomEdited: boolean,
  { commands, heredocCommand, powershellHeredoc }: CliCommandSet
): string {
  if (isCustomEdited) {
    if (tab === "powershell") return powershellHeredoc;
    return heredocCommand;
  }
  switch (tab) {
    case "powershell":
      return commands.powershell;
    case "wget":
      return commands.wget;
    case "cli":
      return commands.cliRunner || commands.bash;
    case "heredoc":
      return heredocCommand;
    case "bash":
    default:
      return commands.bash;
  }
}

/** Ignore categories enabled by the default Full Shield profile. */
const FULL_SHIELD_CATEGORIES = ["secrets", "dependencies", "build", "media", "logs", "ide", "database", "fixtures"];

export interface CustomizationInput {
  format: OutputFormat;
  isManuallyEdited: boolean;
  ignoreCategories: string[];
  ignorePreset: string;
  customIgnoreRules: string;
  mcpPresetId: string;
  mcpServerName: string;
  mcpCommand: string;
  mcpArgs: string;
  mcpEnvKey: string;
  mcpEnvValue: string;
  selectedPresetId: string;
  /** Used when selectedPresetId matches no preset */
  fallbackPreset: SkillPreset;
  skillTitle: string;
  description: string;
  role: string;
  framework: string;
  language: string;
  styling: string;
  database: string;
  philosophy: string;
  procedures: string;
  customDirectives: string;
  exampleGood: string;
  exampleBad: string;
}

/** Whether the active output differs from its preset, in which case the preset stream cannot reproduce it. */
export function isCustomizedFromPreset(input: CustomizationInput): boolean {
  if (input.isManuallyEdited) return true;
  if (input.format === "cursorignore" || input.format === "claudeignore") {
    const defaultCategories = FULL_SHIELD_CATEGORIES;
    const isCategoriesDefault =
      input.ignoreCategories.length === defaultCategories.length &&
      defaultCategories.every((cat) => input.ignoreCategories.includes(cat));
    return !isCategoriesDefault || input.customIgnoreRules.trim() !== "" || input.ignorePreset !== "full_shield";
  }
  if (input.format === "mcp_json") {
    const defaultMcp = MCP_PRESETS.find((p) => p.id === input.mcpPresetId) || MCP_PRESETS[0];
    const defaultArgs = defaultMcp.args.join("\n");
    const defaultEnvKey = Object.keys(defaultMcp.env)[0] || "";
    const defaultEnvVal = Object.values(defaultMcp.env)[0] || "";
    return (
      input.mcpServerName !== defaultMcp.name ||
      input.mcpCommand !== defaultMcp.command ||
      input.mcpArgs !== defaultArgs ||
      input.mcpEnvKey !== defaultEnvKey ||
      input.mcpEnvValue !== defaultEnvVal
    );
  }
  const currentPreset = PRESETS.find((p) => p.id === input.selectedPresetId) || input.fallbackPreset;
  return (
    input.skillTitle !== currentPreset.title ||
    input.description !== currentPreset.description ||
    input.role !== currentPreset.role ||
    input.framework !== currentPreset.framework ||
    input.language !== currentPreset.language ||
    input.styling !== currentPreset.styling ||
    input.database !== currentPreset.database ||
    input.philosophy !== currentPreset.philosophy ||
    input.procedures !== currentPreset.procedures ||
    input.customDirectives !== currentPreset.customDirectives ||
    input.exampleGood !== currentPreset.exampleGood ||
    input.exampleBad !== currentPreset.exampleBad
  );
}
