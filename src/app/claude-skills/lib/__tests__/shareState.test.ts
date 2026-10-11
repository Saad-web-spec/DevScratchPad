import { describe, expect, it } from "vitest";
import { buildShareState, findClosestPreset, type ShareStateInput } from "../shareState";
import { MCP_PRESETS, PRESETS } from "../ruleGenerator";

const preset = (id: string) => {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`missing preset ${id}`);
  return found;
};

// Untouched studio state for a preset: default skill format, default filesystem MCP server, Full Shield ignore profile
const fromPreset = (id: string, overrides: Partial<ShareStateInput> = {}): ShareStateInput => {
  const p = preset(id);
  return {
    selectedPresetId: p.id,
    skillName: p.slug,
    skillTitle: p.title,
    isSlugLocked: false,
    description: p.description,
    role: p.role,
    framework: p.framework,
    language: p.language,
    styling: p.styling,
    database: p.database,
    philosophy: p.philosophy,
    behaviors: p.behaviors,
    conventions: p.conventions,
    procedures: p.procedures,
    customDirectives: p.customDirectives,
    exampleGood: p.exampleGood,
    exampleBad: p.exampleBad,
    format: "skill_md",
    globPattern: "**/*",
    alwaysApply: false,
    mcpPresetId: "filesystem",
    mcpServerName: "filesystem",
    mcpCommand: "npx",
    mcpArgs: "-y\n@modelcontextprotocol/server-filesystem\n./",
    mcpEnvKey: "",
    mcpEnvValue: "",
    ignoreCategories: ["secrets", "dependencies", "build", "media", "logs", "ide", "database", "fixtures"],
    ignorePreset: "full_shield",
    customIgnoreRules: "",
    isManuallyEdited: false,
    editorContent: "",
    ...overrides,
  };
};

describe("findClosestPreset", () => {
  it("matches the preset the content came from, even if another preset is selected", () => {
    expect(findClosestPreset(fromPreset("nextjs-pro", { selectedPresetId: "react-spa" })).id).toBe("nextjs-pro");
  });

  it("falls back to the first preset when nothing matches", () => {
    const none = "no-such-value";
    const unmatched = fromPreset("nextjs-pro", { selectedPresetId: none, skillName: none, skillTitle: none, procedures: none, description: none, exampleGood: none, exampleBad: none, framework: none, role: none });
    expect(findClosestPreset(unmatched).id).toBe(PRESETS[0].id);
  });
});

describe("buildShareState", () => {
  it("shares only the preset id for an untouched preset", () => {
    expect(buildShareState(fromPreset("nextjs-pro"))).toEqual({ selectedPresetId: "nextjs-pro" });
  });

  it("adds only the fields that differ from the closest preset, in a stable order", () => {
    const state = buildShareState(
      fromPreset("nextjs-pro", { format: "cursor_mdc", isSlugLocked: true, globPattern: "src/**/*.tsx", alwaysApply: true, skillTitle: "Custom", behaviors: ["inspect-first"] })
    );
    expect(state).toEqual({
      selectedPresetId: "nextjs-pro",
      isSlugLocked: true,
      format: "cursor_mdc",
      globPattern: "src/**/*.tsx",
      alwaysApply: true,
      skillTitle: "Custom",
      behaviors: ["inspect-first"],
    });
    expect(Object.keys(state)).toEqual(["selectedPresetId", "isSlugLocked", "format", "globPattern", "alwaysApply", "skillTitle", "behaviors"]);
  });

  it("shares an MCP preset by id when it is unmodified", () => {
    const github = MCP_PRESETS.find((m) => m.id === "github");
    if (!github) throw new Error("missing github MCP preset");
    const state = buildShareState(
      fromPreset("nextjs-pro", {
        format: "mcp_json",
        mcpPresetId: github.id,
        mcpServerName: github.name,
        mcpCommand: github.command,
        mcpArgs: github.args.join("\n"),
        mcpEnvKey: Object.keys(github.env)[0],
        mcpEnvValue: Object.values(github.env)[0],
      })
    );
    expect(state).toEqual({ selectedPresetId: "nextjs-pro", format: "mcp_json", mcpPresetId: "github" });
  });

  it("shares customized MCP fields but never the env value", () => {
    const state = buildShareState(
      fromPreset("nextjs-pro", { format: "mcp_json", mcpPresetId: "github", mcpServerName: "gh", mcpCommand: "npx", mcpArgs: "-y", mcpEnvKey: "TOKEN", mcpEnvValue: "ghp_literal_secret" })
    );
    expect(state).toMatchObject({ mcpPresetId: "github", mcpServerName: "gh", mcpCommand: "npx", mcpArgs: "-y", mcpEnvKey: "TOKEN" });
    expect(state).not.toHaveProperty("mcpEnvValue");
    expect(JSON.stringify(state)).not.toContain("ghp_literal_secret");
  });

  it("shares ignore settings only for ignore formats", () => {
    const custom = { ignoreCategories: ["secrets"], ignorePreset: "custom", customIgnoreRules: "!keep.txt" };
    expect(buildShareState(fromPreset("nextjs-pro", { ...custom, format: "cursorignore" }))).toEqual({
      selectedPresetId: "nextjs-pro",
      format: "cursorignore",
      ignoreCategories: ["secrets"],
      ignorePreset: "custom",
      customIgnoreRules: "!keep.txt",
    });
    expect(buildShareState(fromPreset("nextjs-pro", { ...custom, format: "claude_md" }))).toEqual({ selectedPresetId: "nextjs-pro", format: "claude_md" });
  });

  it("includes manual editor content only when the editor was edited", () => {
    expect(buildShareState(fromPreset("nextjs-pro", { editorContent: "draft" }))).toEqual({ selectedPresetId: "nextjs-pro" });
    expect(buildShareState(fromPreset("nextjs-pro", { editorContent: "draft", isManuallyEdited: true }))).toEqual({
      selectedPresetId: "nextjs-pro",
      isManuallyEdited: true,
      editorContent: "draft",
    });
  });
});
