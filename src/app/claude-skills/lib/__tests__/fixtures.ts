import {
  PRESETS,
  buildRuleContent,
  getDefaultPrdValues,
  getDefaultDesignValues,
  getDefaultTaskValues,
  getDefaultMemoryValues,
  type OutputFormat,
  type SkillPreset,
} from "../ruleGenerator";

export const ALL_FORMATS: OutputFormat[] = [
  "skill_md",
  "claude_md",
  "cursor_mdc",
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

export const GOVERNANCE_FORMATS: OutputFormat[] = ["prd_md", "design_md", "task_md", "memory_md"];
export const IGNORE_FORMATS: OutputFormat[] = ["cursorignore", "claudeignore"];

// The studio's "Full Shield" profile (ClaudeSkillsClient ignoreCategories initial state)
export const STUDIO_DEFAULT_IGNORE_CATEGORIES = ["secrets", "dependencies", "build", "media", "logs", "ide", "database", "fixtures"];

// Mirrors the studio's buildContent: preset fields plus governance defaults derived from the same preset
export function buildFromPreset(preset: SkillPreset, targetFormat: OutputFormat): string {
  return buildRuleContent({
    targetFormat,
    skillName: preset.slug,
    skillTitle: preset.title,
    description: preset.description,
    role: preset.role,
    framework: preset.framework,
    language: preset.language,
    styling: preset.styling,
    database: preset.database,
    philosophy: preset.philosophy,
    behaviors: preset.behaviors,
    conventions: preset.conventions,
    procedures: preset.procedures,
    customDirectives: preset.customDirectives,
    exampleGood: preset.exampleGood,
    exampleBad: preset.exampleBad,
    mcpServerName: "github",
    mcpCommand: "npx",
    mcpArgs: "-y\n@modelcontextprotocol/server-github",
    mcpEnvKey: "GITHUB_PERSONAL_ACCESS_TOKEN",
    mcpEnvValue: "${GITHUB_PERSONAL_ACCESS_TOKEN}",
    ...getDefaultPrdValues(preset),
    ...getDefaultDesignValues(preset),
    ...getDefaultTaskValues(preset),
    ...getDefaultMemoryValues(preset),
    ignoreCategories: STUDIO_DEFAULT_IGNORE_CATEGORIES,
    customIgnoreRules: "",
  });
}

export { PRESETS };
