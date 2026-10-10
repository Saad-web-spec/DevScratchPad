import { describe, expect, it } from "vitest";
import { ALL_FORMATS, PRESETS, buildFromPreset } from "./fixtures";

describe("buildRuleContent", () => {
  for (const preset of PRESETS) {
    describe(`preset ${preset.id}`, () => {
      for (const format of ALL_FORMATS) {
        it(`renders ${format} without template leaks`, () => {
          const out = buildFromPreset(preset, format);
          expect(out.trim().length).toBeGreaterThan(50);
          expect(out).not.toContain("[object Object]");
          expect(out).not.toMatch(/\bNaN\b/);
          // An interpolated missing value shows up as a bare "undefined" token at a line end or after a label
          expect(out).not.toMatch(/(?:^|[:>] ?)undefined\s*$/m);
        });
      }
    });
  }

  it("is deterministic for identical input", () => {
    for (const format of ALL_FORMATS) {
      expect(buildFromPreset(PRESETS[0], format)).toBe(buildFromPreset(PRESETS[0], format));
    }
  });

  it("emits valid JSON for JSON formats", () => {
    for (const preset of PRESETS) {
      for (const format of ["mcp_json", "gemini_prompts"] as const) {
        const out = buildFromPreset(preset, format);
        expect(() => JSON.parse(out), `${preset.id}/${format}`).not.toThrow();
      }
    }
  });

  it("never embeds a literal MCP secret value, only env references", () => {
    const parsed = JSON.parse(buildFromPreset(PRESETS[0], "mcp_json"));
    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
  });

  it("emits YAML frontmatter for cursor_mdc and skill_md", () => {
    for (const preset of PRESETS) {
      const mdc = buildFromPreset(preset, "cursor_mdc");
      expect(mdc.startsWith("---\n"), preset.id).toBe(true);
      expect(mdc).toMatch(/^globs:/m);
      expect(mdc).toMatch(/^alwaysApply:\s*(true|false)\s*$/m);

      const skill = buildFromPreset(preset, "skill_md");
      expect(skill.startsWith("---\n"), preset.id).toBe(true);
      expect(skill).toMatch(/^name:\s*\S+/m);
      expect(skill).toMatch(/^description:\s*\S+/m);
    }
  });

  it("matches the committed snapshot for the first preset", () => {
    for (const format of ALL_FORMATS) {
      expect(buildFromPreset(PRESETS[0], format)).toMatchSnapshot(format);
    }
  });
});
