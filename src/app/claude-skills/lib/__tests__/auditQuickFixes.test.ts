import { describe, expect, it } from "vitest";
import {
  AUTO_FIX_CODE_REFERENCE_SNIPPET,
  AUTO_FIX_GUARDRAILS_SNIPPET,
  CODE_REFERENCE_SNIPPET,
  NEGATIVE_GUARDRAILS_SNIPPET,
  autoFixAllContent,
  buildAuditReportMarkdown,
  buildCursorFrontmatter,
  buildFallbackMcpConfig,
  fixFormatCompliance,
  refineBroadTriggerTags,
  replaceVaguePhrases,
  type AutoFixContext,
} from "../auditQuickFixes";
import type { AuditIssue, RuleAuditReport } from "../ruleAuditor";

const dimension = (score: number) => ({ score, weight: 0.2, issues: [] });
const report = (allIssues: AuditIssue[] = []): RuleAuditReport => ({
  overallScore: 92,
  grade: "A",
  gradeLabel: "Production Grade",
  summary: "Solid rule.",
  tokenCount: 640,
  charCount: 2560,
  dimensions: {
    triggers: dimension(90),
    tokenDensity: dimension(85),
    guardrails: dimension(100),
    formatCompliance: dimension(95),
    architecture: dimension(80),
  },
  allIssues,
});

const ctx = (overrides: Partial<AutoFixContext> = {}): AutoFixContext => ({
  format: "claude_md",
  description: "Use when auditing API routes",
  skillTitle: "Auditor",
  globPattern: "src/**/*.ts",
  alwaysApply: false,
  mcpServerName: "github",
  mcpCommand: "npx",
  mcpArgs: "-y\n@modelcontextprotocol/server-github",
  mcpEnvKey: "",
  mcpEnvValue: "",
  guardrailsScore: 100,
  ...overrides,
});

describe("buildAuditReportMarkdown", () => {
  const header = [
    "### Static Rule Quality Audit: 92/100 · Production Grade",
    "- **Trigger Specificity**: 90%",
    "- **Rule Density**: 85% (~640 tokens)",
    "- **Negative Guardrails**: 100%",
    "- **Format Compliance**: 95%",
    "- **Architectural Boundaries**: 80%",
    "",
    "**Summary**: Solid rule.",
  ];

  it("reports a clean audit", () => {
    expect(buildAuditReportMarkdown(report())).toBe(
      [...header, "", "*Zero deficiencies detected. Ready for production deployment.*"].join("\n")
    );
  });

  it("lists every finding with severity and tip", () => {
    const issues: AuditIssue[] = [
      { id: "vague-1", dimension: "architecture", severity: "warning", title: "Vague directive", message: "Found 'be helpful'.", suggestion: "Be concrete." },
      { id: "format-1", dimension: "formatCompliance", severity: "error", title: "Bad frontmatter", message: "Missing globs.", suggestion: "Add globs." },
    ];
    expect(buildAuditReportMarkdown(report(issues))).toBe(
      [
        ...header,
        "",
        "**Diagnostic Findings:**",
        "- [WARNING] **Vague directive**: Found 'be helpful'. (Tip: Be concrete.)",
        "- [ERROR] **Bad frontmatter**: Missing globs. (Tip: Add globs.)",
      ].join("\n")
    );
  });
});

describe("replaceVaguePhrases", () => {
  it("replaces every occurrence, case-insensitively", () => {
    expect(replaceVaguePhrases("Write Clean Code. Then write clean code again.")).toBe(
      "enforce single-responsibility functions and explicit TypeScript interfaces. Then enforce single-responsibility functions and explicit TypeScript interfaces again."
    );
  });

  it("only matches whole phrases", () => {
    expect(replaceVaguePhrases("rewrite clean codebase")).toBe("rewrite clean codebase");
  });

  it("gives the same result on repeated calls (shared global regexes)", () => {
    const input = "Make it fast and avoid bugs; be helpful.";
    const first = replaceVaguePhrases(input);
    expect(replaceVaguePhrases(input)).toBe(first);
    expect(first).not.toMatch(/make it fast|avoid bugs|be helpful/i);
  });
});

describe("quick-fix snippets", () => {
  it("guardrail snippets append a section, and only the quick fix carries the secrets and injection rules", () => {
    for (const snippet of [NEGATIVE_GUARDRAILS_SNIPPET, AUTO_FIX_GUARDRAILS_SNIPPET]) {
      expect(snippet.startsWith("\n\n## Strict Negative Guardrails\n")).toBe(true);
    }
    expect(NEGATIVE_GUARDRAILS_SNIPPET).toContain("(CE-001)");
    expect(NEGATIVE_GUARDRAILS_SNIPPET).toContain("`${VAR_NAME}`");
    expect(NEGATIVE_GUARDRAILS_SNIPPET).toContain("<untrusted_content>");
    expect(AUTO_FIX_GUARDRAILS_SNIPPET).not.toContain("CE-001");
  });

  it("code reference snippets are fenced TypeScript blocks", () => {
    expect(CODE_REFERENCE_SNIPPET).toContain("```typescript\n");
    expect(CODE_REFERENCE_SNIPPET).toContain("export function validateInput(value: string): boolean {");
    expect(AUTO_FIX_CODE_REFERENCE_SNIPPET).toContain("export function validateScope(input: string): boolean {");
    expect(CODE_REFERENCE_SNIPPET.endsWith("```")).toBe(true);
  });
});

describe("buildCursorFrontmatter", () => {
  it("falls back to the title and a global glob", () => {
    expect(buildCursorFrontmatter({ description: "", skillTitle: "Auditor", globPattern: "", alwaysApply: true })).toBe(
      "---\ndescription: Auditor\nglobs: **/*\nalwaysApply: true\n---\n\n"
    );
  });
});

describe("buildFallbackMcpConfig", () => {
  it("rebuilds a valid config with trimmed args and no env when there is no key", () => {
    const json = buildFallbackMcpConfig({ mcpServerName: "", mcpCommand: "", mcpArgs: " -y \n\n pkg ", mcpEnvKey: "", mcpEnvValue: "x" });
    expect(JSON.parse(json)).toEqual({ mcpServers: { server: { command: "npx", args: ["-y", "pkg"] } } });
    expect(json).toContain('\n  "mcpServers"');
  });

  it("includes the env entry when a key is set", () => {
    const json = buildFallbackMcpConfig({ mcpServerName: "gh", mcpCommand: "uvx", mcpArgs: "a", mcpEnvKey: "TOKEN", mcpEnvValue: "${TOKEN}" });
    expect(JSON.parse(json)).toEqual({ mcpServers: { gh: { command: "uvx", args: ["a"], env: { TOKEN: "${TOKEN}" } } } });
  });
});

describe("fixFormatCompliance", () => {
  it("prepends frontmatter to a Cursor rule that lacks it", () => {
    expect(fixFormatCompliance("# Rule", ctx({ format: "cursor_mdc" }))).toBe(
      "---\ndescription: Use when auditing API routes\nglobs: src/**/*.ts\nalwaysApply: false\n---\n\n# Rule"
    );
  });

  it("returns null when there is nothing to fix", () => {
    expect(fixFormatCompliance("---\nx\n---", ctx({ format: "cursor_mdc" }))).toBeNull();
    expect(fixFormatCompliance('{"mcpServers":{}}', ctx({ format: "mcp_json" }))).toBeNull();
    expect(fixFormatCompliance("# Not frontmatter", ctx({ format: "claude_md" }))).toBeNull();
  });

  it("rebuilds invalid MCP JSON from the form fields", () => {
    const fixed = fixFormatCompliance("{ broken", ctx({ format: "mcp_json" }));
    expect(JSON.parse(fixed ?? "")).toEqual({ mcpServers: { github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] } } });
  });
});

describe("autoFixAllContent", () => {
  const long = "Rules for the API layer.\n".repeat(20);

  it("appends guardrails only when the guardrails score is below 70", () => {
    expect(autoFixAllContent("```\nx\n```", ctx({ guardrailsScore: 69 }))).toBe("```\nx\n```" + AUTO_FIX_GUARDRAILS_SNIPPET);
    expect(autoFixAllContent("```\nx\n```", ctx({ guardrailsScore: 70 }))).toBe("```\nx\n```");
  });

  it("adds a code reference only to long content without a fenced block", () => {
    expect(autoFixAllContent(long, ctx())).toBe(long + AUTO_FIX_CODE_REFERENCE_SNIPPET);
    expect(autoFixAllContent("short", ctx())).toBe("short");
  });

  it("puts Cursor frontmatter before everything it appends", () => {
    const fixed = autoFixAllContent("write clean code", ctx({ format: "cursor_mdc", guardrailsScore: 0 }));
    expect(fixed.startsWith("---\ndescription: Use when auditing API routes\n")).toBe(true);
    expect(fixed).toContain("enforce single-responsibility functions");
    expect(fixed.endsWith(AUTO_FIX_GUARDRAILS_SNIPPET + AUTO_FIX_CODE_REFERENCE_SNIPPET)).toBe(true);
  });

  it("only repairs JSON for MCP configs", () => {
    const valid = JSON.stringify({ mcpServers: {}, note: "be helpful" });
    expect(autoFixAllContent(valid, ctx({ format: "mcp_json", guardrailsScore: 0 }))).toBe(
      JSON.stringify({ mcpServers: {}, note: "provide concise, surgical code diffs with clear technical rationale" })
    );
    expect(JSON.parse(autoFixAllContent("{ broken", ctx({ format: "mcp_json" })))).toHaveProperty("mcpServers.github");
  });
});

describe("refineBroadTriggerTags", () => {
  it("drops chips made only of broad words and keeps scoped ones", () => {
    expect(refineBroadTriggerTags(["help", "fix code", "api-routes", "debug-auth-flow", "Do-Work"])).toEqual(["api-routes", "debug-auth-flow"]);
  });

  it("falls back to two scoped chips when nothing scoped remains", () => {
    expect(refineBroadTriggerTags(["help", "ai"])).toEqual(["api-routes", "domain-services"]);
    expect(refineBroadTriggerTags([])).toEqual(["api-routes", "domain-services"]);
  });

  it("does not mutate its input", () => {
    const tags = ["help"];
    refineBroadTriggerTags(tags);
    expect(tags).toEqual(["help"]);
  });
});
