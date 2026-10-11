import { MCP_PRESETS, PRESETS, type OutputFormat, type SkillPreset } from "./ruleGenerator";
import type { StudioWorkspaceState } from "./stateSharing";

export interface ShareStateInput {
  selectedPresetId: string;
  skillName: string;
  skillTitle: string;
  isSlugLocked: boolean;
  description: string;
  role: string;
  framework: string;
  language: string;
  styling: string;
  database: string;
  philosophy: string;
  behaviors: string[];
  conventions: string[];
  procedures: string;
  customDirectives: string;
  exampleGood: string;
  exampleBad: string;
  format: OutputFormat;
  globPattern: string;
  alwaysApply: boolean;
  mcpPresetId: string;
  mcpServerName: string;
  mcpCommand: string;
  mcpArgs: string;
  mcpEnvKey: string;
  /** Compared against preset defaults only; never written to the share state */
  mcpEnvValue: string;
  ignoreCategories: string[];
  ignorePreset: string;
  customIgnoreRules: string;
  isManuallyEdited: boolean;
  editorContent: string;
}

/** Intelligently find the closest base preset by content score */
export function findClosestPreset(input: ShareStateInput): SkillPreset {
  const { skillName, selectedPresetId, skillTitle, procedures, description, exampleGood, exampleBad, framework, role } = input;
  return PRESETS.reduce((best, candidate) => {
    let score = 0;
    if (candidate.slug === skillName) score += 8;
    if (candidate.id === selectedPresetId) score += 4;
    if (candidate.title === skillTitle) score += 4;
    if (candidate.procedures === procedures) score += 12;
    if (candidate.description === description) score += 6;
    if (candidate.exampleGood === exampleGood) score += 6;
    if (candidate.exampleBad === exampleBad) score += 6;
    if (candidate.framework === framework) score += 2;
    if (candidate.role === role) score += 2;
    return score > best.score ? { preset: candidate, score } : best;
  }, { preset: PRESETS[0], score: -1 }).preset;
}

/** Minimal state for a share link: the closest preset plus only the fields that differ from it. */
export function buildShareState(input: ShareStateInput): Partial<StudioWorkspaceState> {
  const {
    skillName,
    skillTitle,
    isSlugLocked,
    description,
    role,
    framework,
    language,
    styling,
    database,
    philosophy,
    behaviors,
    conventions,
    procedures,
    customDirectives,
    exampleGood,
    exampleBad,
    format,
    globPattern,
    alwaysApply,
    mcpPresetId,
    mcpServerName,
    mcpCommand,
    mcpArgs,
    mcpEnvKey,
    mcpEnvValue,
    ignoreCategories,
    ignorePreset,
    customIgnoreRules,
    isManuallyEdited,
    editorContent,
  } = input;
  const bestPreset = findClosestPreset(input);

  const stateToShare: Partial<StudioWorkspaceState> = {
    selectedPresetId: bestPreset.id,
  };

  if (isSlugLocked) stateToShare.isSlugLocked = true;
  if (format !== "skill_md") stateToShare.format = format;
  if (globPattern && globPattern !== "**/*") stateToShare.globPattern = globPattern;
  if (alwaysApply) stateToShare.alwaysApply = true;

  // MCP: Only serialize if user actually modified away from defaults
  const isDefaultMcp =
    mcpPresetId === "filesystem" &&
    mcpServerName === "filesystem" &&
    mcpCommand === "npx" &&
    mcpArgs === "-y\n@modelcontextprotocol/server-filesystem\n./" &&
    !mcpEnvKey &&
    !mcpEnvValue;

  if (!isDefaultMcp) {
    if (mcpPresetId) stateToShare.mcpPresetId = mcpPresetId;
    const matchedMcp = MCP_PRESETS.find((p) => p.id === mcpPresetId);
    const isExactPresetMatch =
      matchedMcp &&
      mcpServerName === matchedMcp.name &&
      mcpCommand === matchedMcp.command &&
      mcpArgs === matchedMcp.args.join("\n") &&
      (Object.keys(matchedMcp.env).length === 0
        ? !mcpEnvKey && !mcpEnvValue
        : mcpEnvKey === Object.keys(matchedMcp.env)[0] && mcpEnvValue === matchedMcp.env[Object.keys(matchedMcp.env)[0]]);

    // Only include verbose command/args/env if customized beyond preset
    if (!isExactPresetMatch) {
      if (mcpServerName) stateToShare.mcpServerName = mcpServerName;
      if (mcpCommand) stateToShare.mcpCommand = mcpCommand;
      if (mcpArgs) stateToShare.mcpArgs = mcpArgs;
      if (mcpEnvKey) stateToShare.mcpEnvKey = mcpEnvKey;
      // SECURITY: Do not leak live API secret value in URL share
    }
  }

  // Diff against bestPreset to only store actual modifications
  if (skillName !== bestPreset.slug) stateToShare.skillName = skillName;
  if (skillTitle !== bestPreset.title) stateToShare.skillTitle = skillTitle;
  if (description !== bestPreset.description) stateToShare.description = description;
  if (role !== bestPreset.role) stateToShare.role = role;
  if (framework !== bestPreset.framework) stateToShare.framework = framework;
  if (language !== bestPreset.language) stateToShare.language = language;
  if (styling !== bestPreset.styling) stateToShare.styling = styling;
  if (database !== bestPreset.database) stateToShare.database = database;
  if (philosophy !== bestPreset.philosophy) stateToShare.philosophy = philosophy;
  if (JSON.stringify(behaviors) !== JSON.stringify(bestPreset.behaviors)) stateToShare.behaviors = behaviors;
  if (JSON.stringify(conventions) !== JSON.stringify(bestPreset.conventions)) stateToShare.conventions = conventions;
  if (procedures !== bestPreset.procedures) stateToShare.procedures = procedures;
  if (customDirectives !== bestPreset.customDirectives) stateToShare.customDirectives = customDirectives;
  if (exampleGood !== bestPreset.exampleGood) stateToShare.exampleGood = exampleGood;
  if (exampleBad !== bestPreset.exampleBad) stateToShare.exampleBad = exampleBad;

  if (format === "cursorignore" || format === "claudeignore") {
    if (ignoreCategories && ignoreCategories.length > 0) stateToShare.ignoreCategories = ignoreCategories;
    if (ignorePreset && ignorePreset !== "full_shield") stateToShare.ignorePreset = ignorePreset;
    if (customIgnoreRules) stateToShare.customIgnoreRules = customIgnoreRules;
  }

  if (isManuallyEdited) {
    stateToShare.isManuallyEdited = true;
    stateToShare.editorContent = editorContent;
  }

  return stateToShare;
}
