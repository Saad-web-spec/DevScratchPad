import { describe, expect, it } from "vitest";
import {
  getCliFormatSlug,
  getPowershellHeredocCommand,
  isCustomizedFromPreset,
  resolveActivePresetSlug,
  resolveTargetInstallFile,
  selectCliCommand,
  type ActivePresetSlugInput,
  type CliTab,
  type CustomizationInput,
} from "../cliInstall";
import { MCP_PRESETS, PRESETS, type InstallCommands, type OutputFormat } from "../ruleGenerator";
import { SLUG_ALIASES } from "../presetRegistry";

const preset = (id: string) => {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`missing preset ${id}`);
  return found;
};

describe("getCliFormatSlug", () => {
  it.each<[OutputFormat, string]>([
    ["cursor_mdc", "cursor-rules"],
    ["skill_md", "claude-skills"],
    ["claude_md", "claude-md"],
    ["agents_md", "agents-md"],
    ["mcp_json", "mcp-config"],
    ["windsurf_cascade", "windsurf-rules"],
    ["copilot_instructions", "copilot-instructions"],
    ["openai_instructions", "openai-instructions"],
    ["gemini_prompts", "gemini-prompts"],
    ["cursorignore", "cursorignore"],
    ["claudeignore", "claudeignore"],
    ["llms_txt", "llms-txt"],
    ["architecture_md", "architecture-md"],
    ["prd_md", "prd-md"],
    ["design_md", "design-md"],
    ["task_md", "task-md"],
    ["memory_md", "memory-md"],
  ])("%s -> /api/raw/%s/...", (format, slug) => {
    expect(getCliFormatSlug(format)).toBe(slug);
  });
});

describe("resolveActivePresetSlug", () => {
  const base: ActivePresetSlugInput = {
    format: "cursor_mdc",
    formatSlug: "cursor-rules",
    mcpPresetId: "filesystem",
    mcpServerName: "filesystem",
    selectedPresetId: "nextjs-pro",
    skillName: "my-skill",
  };

  it("uses the MCP preset, then the server name, then filesystem for MCP configs", () => {
    expect(resolveActivePresetSlug({ ...base, format: "mcp_json", mcpPresetId: "github" })).toBe("github");
    expect(resolveActivePresetSlug({ ...base, format: "mcp_json", mcpPresetId: "", mcpServerName: "custom" })).toBe("custom");
    expect(resolveActivePresetSlug({ ...base, format: "mcp_json", mcpPresetId: "", mcpServerName: "" })).toBe("filesystem");
  });

  it("keeps the spoke page's slug while its preset is still selected", () => {
    expect(resolveActivePresetSlug({ ...base, initialPresetId: "nextjs-pro", initialPresetSlug: "legacy-slug" })).toBe("legacy-slug");
    expect(resolveActivePresetSlug({ ...base, initialPresetId: "react-spa", initialPresetSlug: "legacy-slug" })).toBe("nextjs-15");
  });

  it("uses the matching route's slug for the format", () => {
    expect(resolveActivePresetSlug(base)).toBe("nextjs-15");
    expect(resolveActivePresetSlug({ ...base, format: "skill_md", formatSlug: "claude-skills", selectedPresetId: "claude-auditor" })).toBe("codebase-auditor");
  });

  it("falls back to the preset's canonical slug, then the skill name, then 'rule'", () => {
    const nextjs = preset("nextjs-pro");
    expect(resolveActivePresetSlug({ ...base, format: "windsurf_cascade", formatSlug: "windsurf-rules" })).toBe(SLUG_ALIASES[nextjs.slug] || nextjs.slug);
    expect(resolveActivePresetSlug({ ...base, selectedPresetId: "unknown" })).toBe("my-skill");
    expect(resolveActivePresetSlug({ ...base, selectedPresetId: "unknown", skillName: "" })).toBe("rule");
  });
});

describe("resolveTargetInstallFile", () => {
  const base = {
    format: "cursor_mdc" as OutputFormat,
    formatSlug: "cursor-rules",
    presetSlug: "nextjs-15",
    selectedPresetId: "nextjs-pro",
    isManuallyEdited: false,
    skillName: "My Skill",
  };

  it("uses the preset route's target file while the content is unedited", () => {
    expect(resolveTargetInstallFile(base)).toBe(".cursor/rules/nextjs-15.mdc");
  });

  it("derives the path from the skill name once edited, keeping its case", () => {
    expect(resolveTargetInstallFile({ ...base, isManuallyEdited: true })).toBe(".cursor/rules/My-Skill.mdc");
  });

  it.each<[OutputFormat, string]>([
    ["skill_md", ".claude/skills/x.y/SKILL.md"],
    ["claude_md", "CLAUDE.md"],
    ["mcp_json", "claude_desktop_config.json"],
    ["agents_md", "AGENTS.md"],
    ["windsurf_cascade", ".windsurf/rules/x.y.md"],
    ["copilot_instructions", ".github/copilot-instructions.md"],
    ["openai_instructions", "prompts/openai-custom-instructions.md"],
    ["gemini_prompts", "prompts/gemini-system-instructions.json"],
    ["cursorignore", ".cursorignore"],
    ["claudeignore", ".claudeignore"],
    ["llms_txt", "llms.txt"],
    ["architecture_md", "ARCHITECTURE.md"],
    ["prd_md", "PRD.md"],
    ["design_md", "DESIGN.md"],
    ["task_md", "TASK.md"],
    ["memory_md", "MEMORY.md"],
  ])("%s without a route -> %s", (format, path) => {
    expect(resolveTargetInstallFile({ ...base, format, formatSlug: "no-route", presetSlug: "none", selectedPresetId: "none", skillName: "x.y" })).toBe(path);
  });

  it("falls back to the preset slug, then 'skill', when there is no skill name", () => {
    const input = { ...base, format: "skill_md" as OutputFormat, formatSlug: "no-route", selectedPresetId: "none", skillName: "" };
    expect(resolveTargetInstallFile(input)).toBe(".claude/skills/nextjs-15/SKILL.md");
    expect(resolveTargetInstallFile({ ...input, presetSlug: "" })).toBe(".claude/skills/skill/SKILL.md");
  });
});

describe("getPowershellHeredocCommand", () => {
  it("creates the directory and writes the trimmed content with Windows separators", () => {
    expect(getPowershellHeredocCommand(".cursor/rules/a.mdc", "\n# Rule\n")).toBe(
      'New-Item -ItemType Directory -Force -Path ".cursor\\rules"; @\'\n# Rule\n\'@ | Set-Content -Path ".cursor\\rules\\a.mdc" -Encoding UTF8'
    );
  });

  it("skips the directory for root files and escapes lines that would end the here-string", () => {
    expect(getPowershellHeredocCommand("CLAUDE.md", "a\n'@ b")).toBe(
      "@'\na\n '@ b\n'@ | Set-Content -Path \"CLAUDE.md\" -Encoding UTF8"
    );
  });
});

describe("selectCliCommand", () => {
  const commands: InstallCommands = { bash: "BASH", powershell: "PS", wget: "WGET", cliRunner: "RUNNER", targetDir: "", targetFile: "f" };
  const set = { commands, heredocCommand: "HEREDOC", powershellHeredoc: "PS-HEREDOC" };

  it.each<[CliTab, string]>([
    ["bash", "BASH"],
    ["powershell", "PS"],
    ["wget", "WGET"],
    ["cli", "RUNNER"],
    ["heredoc", "HEREDOC"],
  ])("preset stream: %s -> %s", (tab, expected) => {
    expect(selectCliCommand(tab, false, set)).toBe(expected);
  });

  it("falls back to bash when there is no CLI runner", () => {
    expect(selectCliCommand("cli", false, { ...set, commands: { ...commands, cliRunner: undefined } })).toBe("BASH");
  });

  it.each<[CliTab, string]>([
    ["bash", "HEREDOC"],
    ["powershell", "PS-HEREDOC"],
    ["wget", "HEREDOC"],
    ["cli", "HEREDOC"],
    ["heredoc", "HEREDOC"],
  ])("customized content: %s -> %s", (tab, expected) => {
    expect(selectCliCommand(tab, true, set)).toBe(expected);
  });
});

describe("isCustomizedFromPreset", () => {
  // The form fields isCustomizedFromPreset compares, as filled in by a preset
  const formFieldsOf = (p: (typeof PRESETS)[number]) => ({
    skillTitle: p.title,
    description: p.description,
    role: p.role,
    framework: p.framework,
    language: p.language,
    styling: p.styling,
    database: p.database,
    philosophy: p.philosophy,
    procedures: p.procedures,
    customDirectives: p.customDirectives,
    exampleGood: p.exampleGood,
    exampleBad: p.exampleBad,
  });
  const filesystem = MCP_PRESETS[0];
  const base: CustomizationInput = {
    format: "cursor_mdc",
    isManuallyEdited: false,
    ignoreCategories: ["secrets", "dependencies", "build", "media", "logs", "ide", "database", "fixtures"],
    ignorePreset: "full_shield",
    customIgnoreRules: "",
    mcpPresetId: filesystem.id,
    mcpServerName: filesystem.name,
    mcpCommand: filesystem.command,
    mcpArgs: filesystem.args.join("\n"),
    mcpEnvKey: "",
    mcpEnvValue: "",
    selectedPresetId: "nextjs-pro",
    fallbackPreset: preset("claude-auditor"),
    ...formFieldsOf(preset("nextjs-pro")),
  };

  it("is false for an untouched preset and true once any compared field changes", () => {
    expect(isCustomizedFromPreset(base)).toBe(false);
    expect(isCustomizedFromPreset({ ...base, isManuallyEdited: true })).toBe(true);
    expect(isCustomizedFromPreset({ ...base, skillTitle: "Other" })).toBe(true);
    expect(isCustomizedFromPreset({ ...base, exampleBad: "" })).toBe(true);
  });

  it("compares against the fallback preset when the selected id is unknown", () => {
    expect(isCustomizedFromPreset({ ...base, selectedPresetId: "unknown" })).toBe(true);
    expect(isCustomizedFromPreset({ ...base, selectedPresetId: "unknown", ...formFieldsOf(preset("claude-auditor")) })).toBe(false);
  });

  it("checks ignore files against the Full Shield profile, in any order", () => {
    const ignore = { ...base, format: "cursorignore" as OutputFormat, skillTitle: "irrelevant" };
    expect(isCustomizedFromPreset(ignore)).toBe(false);
    expect(isCustomizedFromPreset({ ...ignore, ignoreCategories: [...ignore.ignoreCategories].reverse() })).toBe(false);
    expect(isCustomizedFromPreset({ ...ignore, ignoreCategories: ["secrets"] })).toBe(true);
    expect(isCustomizedFromPreset({ ...ignore, customIgnoreRules: "  " })).toBe(false);
    expect(isCustomizedFromPreset({ ...ignore, customIgnoreRules: "!keep" })).toBe(true);
    expect(isCustomizedFromPreset({ ...ignore, ignorePreset: "custom" })).toBe(true);
  });

  it("checks MCP configs against their preset's defaults", () => {
    const mcp = { ...base, format: "mcp_json" as OutputFormat, skillTitle: "irrelevant" };
    expect(isCustomizedFromPreset(mcp)).toBe(false);
    expect(isCustomizedFromPreset({ ...mcp, mcpArgs: "-y" })).toBe(true);
    const github = MCP_PRESETS.find((m) => m.id === "github");
    if (!github) throw new Error("missing github MCP preset");
    const githubDefaults = {
      mcpPresetId: github.id,
      mcpServerName: github.name,
      mcpCommand: github.command,
      mcpArgs: github.args.join("\n"),
      mcpEnvKey: Object.keys(github.env)[0],
      mcpEnvValue: Object.values(github.env)[0],
    };
    expect(isCustomizedFromPreset({ ...mcp, ...githubDefaults })).toBe(false);
    expect(isCustomizedFromPreset({ ...mcp, ...githubDefaults, mcpEnvValue: "ghp_literal" })).toBe(true);
  });
});
