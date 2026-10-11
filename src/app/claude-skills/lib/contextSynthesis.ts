import type { OutputFormat } from "./ruleGenerator";

export interface ContextSynthesisInput {
  format: OutputFormat;
  globPattern: string;
  role: string;
  framework: string;
  language: string;
  styling: string;
  database: string;
  philosophy: string;
  behaviors: string[];
  conventions: string[];
}

export interface ContextSynthesisResult {
  description: string;
  procedures: string;
  customDirectives: string;
}

/**
 * Context-Aware Synthesis Engine (Option 3: Reads all 12 form fields).
 * Derives the activation description, numbered procedures, and custom directives from the
 * stack, philosophy, conventions, and behaviors ("Synthesize from Context").
 */
export function synthesizeContextFields({
  format,
  globPattern,
  role,
  framework,
  language,
  styling,
  database,
  philosophy,
  behaviors,
  conventions,
}: ContextSynthesisInput): ContextSynthesisResult {
  // 1. Philosophy Mission Matrix
  const missionByPhilosophy: Record<string, string> = {
    strict: "enforces zero-tolerance for untyped 'any', strict null-safety, defensive type boundaries, and schema validation",
    modern: "balances clean architectural abstractions with pragmatic delivery, modular cohesion, and sensible defaults",
    pragmatic: "prioritizes clean, readable, maintainable code over clever micro-abstractions, abiding strictly by YAGNI",
    vibe: "optimizes for rapid iteration, flat direct implementations, and fast working feedback loops with minimal ceremony",
    architect: "evaluates long-term trade-offs, scales cleanly, documents architectural decisions, and secures system boundaries",
  };

  // Filter relevant tech stack items
  const stackItems = [
    framework && framework !== "Framework Agnostic" && framework !== "Any / Auto-Detect" ? framework : "",
    language && language !== "Polyglot" ? language : "",
    styling && !styling.toLowerCase().includes("none") ? styling : "",
    database && !database.toLowerCase().includes("none") ? database : "",
  ].filter(Boolean);

  const stackLabel = stackItems.length > 0 ? stackItems.join(" • ") : "modern development environments";

  // Format-tailored trigger text
  let triggerClause = "";
  if (format === "cursor_mdc") {
    triggerClause = `Scoped to target files matching active globs (${globPattern || "**/*"}).`;
  } else if (format === "skill_md") {
    triggerClause = `Activated automatically when tasks involve ${framework || "system"} development, auditing, or refactoring.`;
  } else if (format === "claude_md") {
    triggerClause = "Loaded at session initialization to govern all repository workflows.";
  } else if (format === "mcp_json") {
    triggerClause = `Configures external MCP context servers and tooling pipelines for ${stackLabel}.`;
  } else {
    triggerClause = `Orchestrates autonomous agents executing within ${stackLabel}.`;
  }

  const behaviorClauses: string[] = [];
  if (behaviors.includes("inspect-first")) {
    behaviorClauses.push("Always inspects existing codebase patterns and manifest configs before proposing changes.");
  }
  if (behaviors.includes("dependency-caution")) {
    behaviorClauses.push("Blocks unapproved third-party dependencies.");
  }

  const synthesizedDescription = [
    `Specialized ${role || "Autonomous Assistant"} configured for ${stackLabel}.`,
    `This configuration ${missionByPhilosophy[philosophy] || "applies disciplined engineering standards"}.`,
    triggerClause,
    ...behaviorClauses,
  ].join(" ");

  // 2. Multi-Step Procedures derived from Conventions & Stack
  const steps: string[] = [];

  // Step 1: Inspection
  if (behaviors.includes("inspect-first")) {
    steps.push(
      "1. Context Inspection: Read active directory layout, package manifests, and existing code idioms prior to proposing changes."
    );
  } else {
    steps.push(`1. Discovery & Analysis: Examine requirements and map affected components within ${framework || "the codebase"}.`);
  }

  // Step 2: Architecture
  const archClauses: string[] = [];
  if (conventions.includes("rsc-first") && (framework.toLowerCase().includes("next") || framework.toLowerCase().includes("react"))) {
    archClauses.push("default to Server Components (RSC) and keep client interactivity confined to leaf components");
  }
  if (conventions.includes("clean-layered")) {
    archClauses.push("separate concerns cleanly between route handlers, domain services, and data access layers");
  }
  if (conventions.includes("feature-colocated")) {
    archClauses.push("colocate components, hooks, tests, and types inside domain feature folders");
  }
  if (conventions.includes("flat-pragmatic")) {
    archClauses.push("keep folder nesting shallow (max 2-3 levels) to avoid navigational friction");
  }
  if (archClauses.length > 0) {
    steps.push(`2. Architectural Alignment: Structure implementation to ${archClauses.join("; ")}.`);
  } else {
    steps.push("2. Architectural Planning: Design clean interfaces and avoid unnecessary abstraction layers.");
  }

  // Step 3: Execution & Code Quality
  const codeClauses: string[] = [];
  if (conventions.includes("typed-schemas")) {
    codeClauses.push("validate all external inputs, requests, and environment variables with strict schemas");
  }
  if (conventions.includes("guard-clauses")) {
    codeClauses.push("leverage guard clauses and early returns to eliminate nested branches");
  }
  if (conventions.includes("result-types")) {
    codeClauses.push("return explicit Result tuples or typed error objects instead of swallowing exceptions");
  }
  if (behaviors.includes("minimal-diffs")) {
    codeClauses.push("produce surgical, targeted diffs preserving unrelated code and comments");
  }
  if (codeClauses.length > 0) {
    steps.push(`3. Implementation Standards: Ensure that you ${codeClauses.join(", ")}.`);
  } else {
    steps.push("3. Focused Implementation: Write clean, idiomatic code adhering to existing repository formatting.");
  }

  // Step 4: Verification
  if (behaviors.includes("verification-driven")) {
    steps.push(
      "4. Verification & Quality Gates: Run automated tests, linting, and typecheck commands. Provide explicit manual verification steps for runtime behavior."
    );
  } else {
    steps.push("4. Validation: Verify that modified files compile cleanly without regression or unresolved imports.");
  }

  // 3. Custom Directives
  const directives: string[] = [];
  if (philosophy === "strict") {
    directives.push("- Banned: Never use loose 'any', 'as unknown as T', or disable TypeScript compiler warnings.");
  }
  if (behaviors.includes("dependency-caution")) {
    directives.push("- Dependency Rule: Do not install external libraries without explicit user confirmation.");
  }
  if (behaviors.includes("concise-direct")) {
    directives.push("- Communication: Keep commentary brief, code-focused, and free of conversational filler.");
  }
  if (behaviors.includes("preserve-style")) {
    directives.push("- Style Preservation: Mirror existing quote styles, indentations, and naming idioms.");
  }
  if (database && !database.toLowerCase().includes("none")) {
    directives.push(`- Database Hygiene: Use parameterized queries with ${database}; prevent injection and credential leaks.`);
  }
  directives.push("- Security: All secrets, API keys, and environment tokens must remain strictly server-side.");

  return {
    description: synthesizedDescription,
    procedures: steps.join("\n"),
    customDirectives: directives.join("\n"),
  };
}
