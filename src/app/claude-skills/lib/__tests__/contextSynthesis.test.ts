import { describe, expect, it } from "vitest";
import { synthesizeContextFields, type ContextSynthesisInput } from "../contextSynthesis";

const base: ContextSynthesisInput = {
  format: "skill_md",
  globPattern: "src/**/*.ts",
  role: "Senior Auditor",
  framework: "Next.js 15",
  language: "TypeScript",
  styling: "Tailwind CSS",
  database: "PostgreSQL",
  philosophy: "strict",
  behaviors: [],
  conventions: [],
};

describe("synthesizeContextFields", () => {
  it("builds the description from role, stack, philosophy, and format", () => {
    expect(synthesizeContextFields(base).description).toBe(
      "Specialized Senior Auditor configured for Next.js 15 • TypeScript • Tailwind CSS • PostgreSQL. " +
        "This configuration enforces zero-tolerance for untyped 'any', strict null-safety, defensive type boundaries, and schema validation. " +
        "Activated automatically when tasks involve Next.js 15 development, auditing, or refactoring."
    );
  });

  it("drops placeholder stack values and falls back to a generic label", () => {
    const { description } = synthesizeContextFields({
      ...base,
      format: "agents_md",
      role: "",
      framework: "Framework Agnostic",
      language: "Polyglot",
      styling: "None",
      database: "none / irrelevant",
      philosophy: "unknown",
    });
    expect(description).toBe(
      "Specialized Autonomous Assistant configured for modern development environments. " +
        "This configuration applies disciplined engineering standards. " +
        "Orchestrates autonomous agents executing within modern development environments."
    );
  });

  it.each([
    ["cursor_mdc", "Scoped to target files matching active globs (src/**/*.ts)."],
    ["claude_md", "Loaded at session initialization to govern all repository workflows."],
    ["mcp_json", "Configures external MCP context servers and tooling pipelines for Next.js 15 • TypeScript • Tailwind CSS • PostgreSQL."],
  ] as const)("uses a format-specific trigger clause for %s", (format, clause) => {
    expect(synthesizeContextFields({ ...base, format }).description).toContain(clause);
  });

  it("appends behavior clauses to the description", () => {
    const { description } = synthesizeContextFields({ ...base, behaviors: ["inspect-first", "dependency-caution"] });
    expect(description.endsWith("Always inspects existing codebase patterns and manifest configs before proposing changes. Blocks unapproved third-party dependencies.")).toBe(true);
  });

  it("always produces four numbered procedure steps", () => {
    const steps = synthesizeContextFields(base).procedures.split("\n");
    expect(steps).toEqual([
      "1. Discovery & Analysis: Examine requirements and map affected components within Next.js 15.",
      "2. Architectural Planning: Design clean interfaces and avoid unnecessary abstraction layers.",
      "3. Focused Implementation: Write clean, idiomatic code adhering to existing repository formatting.",
      "4. Validation: Verify that modified files compile cleanly without regression or unresolved imports.",
    ]);
  });

  it("derives procedure steps from conventions and behaviors", () => {
    const steps = synthesizeContextFields({
      ...base,
      behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
      conventions: ["rsc-first", "clean-layered", "typed-schemas", "guard-clauses"],
    }).procedures.split("\n");
    expect(steps[0]).toMatch(/^1\. Context Inspection:/);
    expect(steps[1]).toBe(
      "2. Architectural Alignment: Structure implementation to default to Server Components (RSC) and keep client interactivity confined to leaf components; separate concerns cleanly between route handlers, domain services, and data access layers."
    );
    expect(steps[2]).toBe(
      "3. Implementation Standards: Ensure that you validate all external inputs, requests, and environment variables with strict schemas, leverage guard clauses and early returns to eliminate nested branches, produce surgical, targeted diffs preserving unrelated code and comments."
    );
    expect(steps[3]).toMatch(/^4\. Verification & Quality Gates:/);
  });

  it("only applies the RSC convention to Next.js or React stacks", () => {
    const steps = synthesizeContextFields({ ...base, framework: "FastAPI", conventions: ["rsc-first"] }).procedures.split("\n");
    expect(steps[1]).toBe("2. Architectural Planning: Design clean interfaces and avoid unnecessary abstraction layers.");
  });

  it("derives directives and always ends with the security directive", () => {
    expect(synthesizeContextFields({ ...base, behaviors: ["dependency-caution", "concise-direct", "preserve-style"] }).customDirectives.split("\n")).toEqual([
      "- Banned: Never use loose 'any', 'as unknown as T', or disable TypeScript compiler warnings.",
      "- Dependency Rule: Do not install external libraries without explicit user confirmation.",
      "- Communication: Keep commentary brief, code-focused, and free of conversational filler.",
      "- Style Preservation: Mirror existing quote styles, indentations, and naming idioms.",
      "- Database Hygiene: Use parameterized queries with PostgreSQL; prevent injection and credential leaks.",
      "- Security: All secrets, API keys, and environment tokens must remain strictly server-side.",
    ]);
    expect(synthesizeContextFields({ ...base, philosophy: "vibe", database: "" }).customDirectives).toBe(
      "- Security: All secrets, API keys, and environment tokens must remain strictly server-side."
    );
  });
});
