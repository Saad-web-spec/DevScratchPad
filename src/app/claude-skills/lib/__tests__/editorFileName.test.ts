import { describe, expect, it } from "vitest";
import { getEditorFileName } from "../editorFileName";
import type { OutputFormat } from "../ruleGenerator";

describe("getEditorFileName", () => {
  it.each<[OutputFormat, string]>([
    ["skill_md", "SKILL.md"],
    ["claude_md", "CLAUDE.md"],
    ["cursor_mdc", ".cursor/rules/My-Skill.mdc"],
    ["mcp_json", "claude_desktop_config.json"],
    ["agents_md", "AGENTS.md"],
    ["windsurf_cascade", ".windsurf/rules/My-Skill.md"],
    ["copilot_instructions", "copilot-instructions.md"],
    ["openai_instructions", "openai-custom-instructions.md"],
    ["gemini_prompts", "gemini-system-instructions.json"],
    ["cursorignore", ".cursorignore"],
    ["claudeignore", ".claudeignore"],
    ["llms_txt", "llms.txt"],
    ["architecture_md", "ARCHITECTURE.md"],
    ["prd_md", "PRD.md"],
    ["design_md", "DESIGN.md"],
    ["task_md", "TASK.md"],
    ["memory_md", "MEMORY.md"],
  ])("%s -> %s", (format, name) => {
    expect(getEditorFileName(format, "My Skill")).toBe(name);
  });

  it("falls back to 'rule' and replaces unsafe characters without lowercasing", () => {
    expect(getEditorFileName("cursor_mdc", "")).toBe(".cursor/rules/rule.mdc");
    expect(getEditorFileName("windsurf_cascade", "A/B c.d_e")).toBe(".windsurf/rules/A-B-c.d_e.md");
  });
});
