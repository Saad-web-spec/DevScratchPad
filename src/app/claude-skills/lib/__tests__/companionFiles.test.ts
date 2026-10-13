import { describe, expect, it } from "vitest";
import {
  buildClaudeSettings,
  buildCopilotPathInstructions,
  buildKiroSteering,
  buildSubagent,
  expandGlobs,
  getCompanionFiles,
  getKitCompanions,
  getSkillBundle,
  type CompanionContext,
} from "../companionFiles";
import { auditRuleQuality } from "../ruleAuditor";
import { PRESETS, buildFromPreset } from "./fixtures";
import { buildRuleContent, type OutputFormat } from "../ruleGenerator";

const reviewer = PRESETS.find((p) => p.id === "code-reviewer")!;

const ctx = (overrides: Partial<CompanionContext> = {}): CompanionContext => ({
  skillName: reviewer.slug,
  description: reviewer.description,
  procedures: reviewer.procedures,
  globPattern: "src/**/*.{ts,tsx}",
  alwaysApply: false,
  ignoreCategories: ["secrets", "dependencies"],
  customIgnoreRules: "",
  preset: reviewer,
  ...overrides,
});

describe("task presets", () => {
  const tasks = PRESETS.filter((p) => p.kind === "task");

  it("are listed apart from stack presets", () => {
    expect(tasks.map((p) => p.id)).toEqual(
      expect.arrayContaining(["claude-auditor", "security-guard", "tdd-specialist", "code-reviewer", "debugger", "commit-pr-writer", "safe-refactor", "dependency-upgrade"])
    );
  });

  it("score as production-grade skills", () => {
    for (const preset of tasks) {
      const report = auditRuleQuality({
        content: buildFromPreset(preset, "skill_md"),
        format: "skill_md",
        description: preset.description,
        exampleGood: preset.exampleGood,
        exampleBad: preset.exampleBad,
      });
      expect(report.overallScore, preset.id).toBeGreaterThanOrEqual(80);
    }
  });

  it("have descriptions that say when to use them", () => {
    for (const preset of tasks.filter((p) => p.references)) {
      expect(preset.description, preset.id).toMatch(/Use when/);
    }
  });
});

describe("getSkillBundle", () => {
  it("bundles the preset's references and the verify script", () => {
    const paths = getSkillBundle(ctx()).map((f) => f.path);
    expect(paths).toEqual(["references/review-checklist.md", "scripts/verify.sh"]);
  });

  it("keeps references while the procedures are unchanged, even after a rename", () => {
    expect(getSkillBundle(ctx({ skillName: "pr-review" })).map((f) => f.path)).toContain("references/review-checklist.md");
  });

  it("drops references once the skill is no longer that preset", () => {
    const paths = getSkillBundle(ctx({ skillName: "my-repo", procedures: "1. Imported from GitHub." })).map((f) => f.path);
    expect(paths).toEqual(["scripts/verify.sh"]);
  });

  it("ships a fail-fast verify script", () => {
    const script = getSkillBundle(ctx()).find((f) => f.path === "scripts/verify.sh")!.content;
    expect(script.startsWith("#!/usr/bin/env bash\n")).toBe(true);
    expect(script).toContain("set -euo pipefail");
    expect(script).toContain('export CI="${CI:-true}"');
  });
});

describe("SKILL.md bundled resources", () => {
  const build = (bundledFiles?: { path: string; when: string }[]) =>
    buildRuleContent({
      targetFormat: "skill_md",
      skillName: reviewer.slug,
      skillTitle: reviewer.title,
      description: reviewer.description,
      role: reviewer.role,
      framework: reviewer.framework,
      language: reviewer.language,
      styling: reviewer.styling,
      database: reviewer.database,
      philosophy: reviewer.philosophy,
      behaviors: reviewer.behaviors,
      conventions: reviewer.conventions,
      procedures: reviewer.procedures,
      customDirectives: reviewer.customDirectives,
      exampleGood: reviewer.exampleGood,
      exampleBad: reviewer.exampleBad,
      bundledFiles,
    });

  it("lists each bundled file with when to open it", () => {
    const content = build(getSkillBundle(ctx()));
    expect(content).toContain("## 9. Bundled Resources");
    expect(content).toContain("- `references/review-checklist.md`: the change touches auth");
    expect(content).toContain("- `scripts/verify.sh`: run it from the repository root");
  });

  it("has no section when nothing is bundled", () => {
    expect(build()).not.toContain("Bundled Resources");
  });

  it("quotes a description that would break YAML", () => {
    const content = buildRuleContent({ ...reviewerParams(), description: "Review PRs: find bugs" });
    expect(content).toContain('description: "Review PRs: find bugs"');
  });
});

function reviewerParams() {
  return {
    targetFormat: "skill_md" as OutputFormat,
    skillName: reviewer.slug,
    skillTitle: reviewer.title,
    description: reviewer.description,
    role: reviewer.role,
    framework: reviewer.framework,
    language: reviewer.language,
    styling: reviewer.styling,
    database: reviewer.database,
    philosophy: reviewer.philosophy,
    behaviors: reviewer.behaviors,
    conventions: reviewer.conventions,
    procedures: reviewer.procedures,
    customDirectives: reviewer.customDirectives,
    exampleGood: reviewer.exampleGood,
    exampleBad: reviewer.exampleBad,
  };
}

describe("expandGlobs", () => {
  it("expands braces and splits top-level commas", () => {
    expect(expandGlobs("src/**/*.{ts,tsx}")).toEqual(["src/**/*.ts", "src/**/*.tsx"]);
    expect(expandGlobs("app/**, lib/*.{js,mjs}")).toEqual(["app/**", "lib/*.js", "lib/*.mjs"]);
    expect(expandGlobs("**/*")).toEqual(["**/*"]);
    expect(expandGlobs("")).toEqual([]);
  });
});

describe("buildClaudeSettings", () => {
  it("turns the secrets category into Read deny rules", () => {
    const settings = JSON.parse(buildClaudeSettings(ctx()));
    expect(settings.permissions.deny).toEqual(expect.arrayContaining(["Read(.env)", "Read(.env.*)", "Read(secrets/**)", "Read(*.pem)"]));
    expect(settings.permissions.deny.some((r: string) => r.includes("!"))).toBe(false);
    expect(settings.permissions.ask).toEqual(["Bash(git push *)"]);
  });

  it("adds custom rules and skips comments and negations", () => {
    const settings = JSON.parse(buildClaudeSettings(ctx({ ignoreCategories: [], customIgnoreRules: "# local\n./private/\n!keep.txt\n*.secret" })));
    expect(settings.permissions.deny).toEqual(["Read(private/**)", "Read(*.secret)"]);
  });
});

describe("buildSubagent", () => {
  const skill = buildRuleContent({ ...reviewerParams(), bundledFiles: getSkillBundle(ctx()) });

  it("uses subagent frontmatter and the preset's read-only tools", () => {
    const agent = buildSubagent(skill, ctx());
    expect(agent.startsWith(`---\nname: code-reviewer\ndescription: ${reviewer.description}\ntools: Read, Grep, Glob, Bash\n---\n`)).toBe(true);
    expect(agent).not.toContain("Bundled Resources");
    expect(agent).toContain("## 8. Verification & Quality Gates");
  });

  it("inherits every tool once the skill is renamed", () => {
    expect(buildSubagent(skill, ctx({ skillName: "pr-review" }))).not.toContain("tools:");
  });
});

describe("scoped rule companions", () => {
  const cursor = "---\ndescription: \"x\"\nglobs: [\"src/**/*.{ts,tsx}\"]\nalwaysApply: false\n---\n\n# Rule\n\nBody";

  it("writes Copilot applyTo with expanded globs", () => {
    expect(buildCopilotPathInstructions(cursor, ctx())).toBe('---\napplyTo: "src/**/*.ts,src/**/*.tsx"\n---\n\n# Rule\n\nBody\n');
  });

  it("writes Kiro fileMatch or always inclusion", () => {
    expect(buildKiroSteering(cursor, ctx())).toContain('inclusion: fileMatch\nfileMatchPattern: ["src/**/*.ts","src/**/*.tsx"]');
    expect(buildKiroSteering(cursor, ctx({ alwaysApply: true }))).toContain("---\ninclusion: always\n---");
    expect(buildKiroSteering(cursor, ctx({ globPattern: "**/*" }))).toContain("inclusion: always");
  });
});

describe("getCompanionFiles / getKitCompanions", () => {
  it("places skill folder files under .claude/skills/<slug>/", () => {
    const paths = getCompanionFiles("skill_md", ctx(), "").map((f) => f.path);
    expect(paths).toEqual([
      ".claude/skills/code-reviewer/references/review-checklist.md",
      ".claude/skills/code-reviewer/scripts/verify.sh",
      ".claude/agents/code-reviewer.md",
    ]);
  });

  it("has no companions for formats without any", () => {
    for (const format of ["mcp_json", "llms_txt", "prd_md", "gemini_prompts"] as const) {
      expect(getCompanionFiles(format, ctx(), "")).toEqual([]);
    }
  });

  it("leaves extras out unless included and never duplicates a path", () => {
    const core = getKitCompanions(ctx(), () => "", false).map((f) => f.path);
    expect(core).toEqual([
      ".claude/skills/code-reviewer/references/review-checklist.md",
      ".claude/skills/code-reviewer/scripts/verify.sh",
      ".claude/settings.json",
    ]);
    const all = getKitCompanions(ctx(), () => "", true).map((f) => f.path);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toEqual(
      expect.arrayContaining([
        ".claude/agents/code-reviewer.md",
        ".gemini/settings.json",
        ".aider.conf.yml",
        ".github/workflows/ai-rules-audit.yml",
        ".github/instructions/code-reviewer.instructions.md",
        ".kiro/steering/code-reviewer.md",
      ])
    );
  });

  it("only reads parent content for formats derived from it", () => {
    const asked: OutputFormat[] = [];
    getKitCompanions(ctx(), (f) => (asked.push(f), ""), true);
    expect(asked).toEqual(["skill_md", "cursor_mdc"]);
  });
});
