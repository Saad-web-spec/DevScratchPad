import { describe, expect, it } from "vitest";
import { findSectionLineRange } from "../sectionLocator";
import {
  getDefaultDesignValues,
  getDefaultMemoryValues,
  getDefaultPrdValues,
  getDefaultTaskValues,
  type OutputFormat,
} from "../ruleGenerator";
import { PRESETS, buildFromPreset } from "./fixtures";

const preset = PRESETS[0];

// Field keys the studio form emits for each format family (see data-section / setActiveFieldKey in ClaudeSkillsClient)
const GOVERNANCE_FIELDS: Record<string, Record<string, string>> = {
  prd_md: getDefaultPrdValues(preset),
  design_md: getDefaultDesignValues(preset),
  task_md: getDefaultTaskValues(preset),
  memory_md: getDefaultMemoryValues(preset),
};

const STANDARD_FORMATS: OutputFormat[] = [
  "skill_md",
  "claude_md",
  "cursor_mdc",
  "agents_md",
  "windsurf_cascade",
  "copilot_instructions",
  "openai_instructions",
];

const STANDARD_FIELDS = ["skillTitle", "description", "techStack", "procedures", "customDirectives", "conventions", "behaviors"];

function firstMeaningfulLine(value: string): string {
  return (
    value
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 8 && !/^[#|>*-]+$/.test(l)) ?? ""
  );
}

function expectValidRange(content: string, fieldKey: string, format: OutputFormat) {
  const range = findSectionLineRange(content, fieldKey, format);
  const lineCount = content.split("\n").length;
  expect(range, `${format}/${fieldKey} not located`).not.toBeNull();
  expect(range!.startLine).toBeGreaterThanOrEqual(1);
  expect(range!.endLine).toBeGreaterThanOrEqual(range!.startLine);
  expect(range!.endLine).toBeLessThanOrEqual(lineCount);
  return range!;
}

describe("findSectionLineRange", () => {
  it("returns null for empty input", () => {
    expect(findSectionLineRange("", "procedures", "skill_md")).toBeNull();
    expect(findSectionLineRange("# x", null, "skill_md")).toBeNull();
  });

  for (const [format, fields] of Object.entries(GOVERNANCE_FIELDS)) {
    describe(format, () => {
      const content = buildFromPreset(preset, format as OutputFormat);
      const lines = content.split("\n");
      for (const [fieldKey, value] of Object.entries(fields)) {
        it(`marks the lines containing ${fieldKey}`, () => {
          const range = expectValidRange(content, fieldKey, format as OutputFormat);
          const needle = firstMeaningfulLine(value);
          const marked = lines.slice(range.startLine - 1, range.endLine).join("\n");
          expect(marked, `${fieldKey} range L${range.startLine}-${range.endLine}`).toContain(needle);
        });
      }
    });
  }

  for (const format of STANDARD_FORMATS) {
    describe(format, () => {
      const content = buildFromPreset(preset, format);
      for (const fieldKey of STANDARD_FIELDS) {
        it(`locates ${fieldKey}`, () => {
          expectValidRange(content, fieldKey, format);
        });
      }

      it("marks the procedures text itself", () => {
        const range = expectValidRange(content, "procedures", format);
        const marked = content.split("\n").slice(range.startLine - 1, range.endLine).join("\n");
        expect(marked).toContain(firstMeaningfulLine(preset.procedures).replace(/^\d+\.\s*/, ""));
      });
    });
  }

  for (const format of ["cursorignore", "claudeignore"] as OutputFormat[]) {
    it(`locates ignore categories in ${format}`, () => {
      const content = buildFromPreset(preset, format);
      for (const key of ["secrets", "dependencies", "build", "logs"]) {
        expectValidRange(content, key, format);
      }
    });
  }

  it("locates the MCP server block", () => {
    expectValidRange(buildFromPreset(preset, "mcp_json"), "mcpConfig", "mcp_json");
  });
});

describe("findSectionLineRange field narrowing", () => {
  const content = ["# Title", "", "## Project Context", "Audit codebases for health.", "", "**Role**: Auditor", "**Tech Stack**: Next"].join("\n");

  it("narrows to the line holding the field value", () => {
    const range = findSectionLineRange(content, "description", "cursor_mdc", "Audit codebases for health.");
    expect(range?.startLine).toBe(4);
    expect(range?.endLine).toBe(4);
  });

  it("falls back to the whole section when the value is not found", () => {
    const whole = findSectionLineRange(content, "description", "cursor_mdc");
    const range = findSectionLineRange(content, "description", "cursor_mdc", "text that is absent");
    expect(range).toEqual(whole);
  });
});
