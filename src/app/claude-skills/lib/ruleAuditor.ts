/**
 * Rule Quality & Security Auditing Engine
 * Static analysis linter that scores agent rules (0-100) across 4 dimensions:
 * 1. Clarity & Ambiguity (30%)
 * 2. Token Density & Economy (25%)
 * 3. Guardrails & Boundary Enforcement (25%)
 * 4. Trigger Precision & Scoping (20%)
 */

import { validateTriggerPhrase } from "./slugUtils";

export type AuditDimension = "clarity" | "tokenDensity" | "guardrails" | "triggers";
export type IssueSeverity = "error" | "warning" | "info";

export interface AuditIssue {
  id: string;
  dimension: AuditDimension;
  severity: IssueSeverity;
  title: string;
  message: string;
  suggestion: string;
}

export interface DimensionScore {
  score: number; // 0 - 100
  weight: number; // e.g. 0.30
  issues: AuditIssue[];
}

export interface RuleAuditReport {
  overallScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C";
  gradeLabel: string;
  summary: string;
  tokenCount: number;
  charCount: number;
  dimensions: {
    clarity: DimensionScore;
    tokenDensity: DimensionScore;
    guardrails: DimensionScore;
    triggers: DimensionScore;
  };
  allIssues: AuditIssue[];
}

export interface AuditInputData {
  content: string; // The generated rule text (SKILL.md, .mdc, CLAUDE.md)
  format: string; // 'skill_md', 'cursor_mdc', 'claude_md', etc.
  description?: string;
  globPattern?: string;
  alwaysApply?: boolean;
  exampleGood?: string;
  exampleBad?: string;
}

const VAGUE_PHRASES = [
  { pattern: /\bwrite clean code\b/i, phrase: "write clean code" },
  { pattern: /\bfollow best practices\b/i, phrase: "follow best practices" },
  { pattern: /\bensure high quality\b/i, phrase: "ensure high quality" },
  { pattern: /\bmake it fast\b/i, phrase: "make it fast" },
  { pattern: /\bbe helpful\b/i, phrase: "be helpful" },
  { pattern: /\bdo your best\b/i, phrase: "do your best" },
  { pattern: /\bwrite good code\b/i, phrase: "write good code" },
  { pattern: /\bavoid bugs\b/i, phrase: "avoid bugs" },
  { pattern: /\berror-free code\b/i, phrase: "error-free code" },
  { pattern: /\bas simple as possible\b/i, phrase: "as simple as possible" },
];

const NEGATIVE_GUARDRAIL_PATTERNS = [
  /\bnever\s+/i,
  /\bdo not\s+/i,
  /\bstrictly forbidden\b/i,
  /\bprohibited\b/i,
  /\bmust not\s+/i,
  /\bunder no circumstances\b/i,
  /\bavoid\s+/i,
  /\bcannot\s+/i,
];

const DESTRUCTIVE_COMMAND_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bgit push\s+--force\b/i,
  /\bdrop\s+(database|table)\b/i,
  /\b\.env(\.local)?\b/i,
  /\b(secret|api_key|password|credential)\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  {
    pattern: /\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)\b/i,
    label: "Instruction Override Attempt",
  },
  {
    pattern: /\bdisregard\s+(all\s+)?(previous|prior)\s+(instructions|guidelines|rules)\b/i,
    label: "Directive Disregard Pattern",
  },
  {
    pattern: /\b(system\s+prompt\s+override|bypass\s+safety\s+guidelines|jailbreak)\b/i,
    label: "System Prompt Override Directive",
  },
  {
    pattern: /\b(exfiltrate|send|upload)\b.*?\b(env|token|secret|password|api_key|credential)\b/i,
    label: "Secret Exfiltration Pattern",
  },
  {
    pattern: /\breveal\s+(the\s+)?(system|internal|developer)\s+prompt\b/i,
    label: "Prompt Extraction Directive",
  },
  {
    pattern: /<script\b|javascript:\s*|\bonerror\s*=/i,
    label: "Embedded Script / Markup Injection",
  },
];

export function auditRuleQuality(data: AuditInputData): RuleAuditReport {
  const content = data.content || "";
  const charCount = content.length;
  // Standard token estimation: ~4 chars per token for code & markdown
  const tokenCount = Math.max(1, Math.ceil(charCount / 4));

  const allIssues: AuditIssue[] = [];

  // ==========================================
  // Dimension 1: Clarity & Ambiguity (30%)
  // ==========================================
  const clarityIssues: AuditIssue[] = [];
  let clarityScore = 100;

  for (const { pattern, phrase } of VAGUE_PHRASES) {
    if (pattern.test(content)) {
      clarityScore -= 15;
      clarityIssues.push({
        id: `vague-${phrase.replace(/\s+/g, "-")}`,
        dimension: "clarity",
        severity: "warning",
        title: `Vague Directive: "${phrase}"`,
        message: `Directives like "${phrase}" lack concrete engineering parameters and are often ignored by coding LLMs.`,
        suggestion: `Replace with actionable rules (e.g. define max cyclomatic complexity, explicit error types, or test coverage requirements).`,
      });
    }
  }

  // Bonus/Penalty for concrete code examples
  const hasExamples =
    Boolean(data.exampleGood?.trim() || data.exampleBad?.trim()) ||
    content.includes("```");
  if (!hasExamples && charCount > 300) {
    clarityScore -= 10;
    clarityIssues.push({
      id: "clarity-no-code-blocks",
      dimension: "clarity",
      severity: "info",
      title: "No Grounding Code Snippets",
      message: "Directives without before/after code blocks are prone to interpretation drift across different model architectures.",
      suggestion: "Add at least one reference code block illustrating the exact pattern or anti-pattern to follow.",
    });
  }

  clarityScore = Math.max(20, Math.min(100, clarityScore));

  // ==========================================
  // Dimension 2: Token Density & Economy (25%)
  // ==========================================
  const tokenIssues: AuditIssue[] = [];
  let tokenDensityScore = 100;

  if (tokenCount < 70) {
    tokenDensityScore = 35;
    tokenIssues.push({
      id: "token-critically-sparse",
      dimension: "tokenDensity",
      severity: "error",
      title: "Rule Critically Sparse",
      message: `The rule contains only ~${tokenCount} tokens. It lacks sufficient behavioral guidance to enforce team standards.`,
      suggestion: "Flesh out procedures, conventions, and architectural boundaries.",
    });
  } else if (tokenCount < 160) {
    tokenDensityScore = 75;
    tokenIssues.push({
      id: "token-sparse",
      dimension: "tokenDensity",
      severity: "info",
      title: "Sparse Rule Density",
      message: `Rule is brief (~${tokenCount} tokens). While concise, it may miss important guardrails or tech stack edge cases.`,
      suggestion: "Consider documenting specific CLI procedures or error-handling protocols.",
    });
  } else if (tokenCount > 1300) {
    tokenDensityScore = 55;
    tokenIssues.push({
      id: "token-oversized",
      dimension: "tokenDensity",
      severity: "warning",
      title: "High Token Overhead",
      message: `Rule occupies ~${tokenCount} tokens. Large rules bloat every conversation window, slow inference, and can degrade instruction adherence.`,
      suggestion: "Split large instructions into focused, scoped modular rules using Cursor .mdc globs or separate SKILL.md files.",
    });
  } else if (tokenCount > 950) {
    tokenDensityScore = 80;
    tokenIssues.push({
      id: "token-approaching-limit",
      dimension: "tokenDensity",
      severity: "info",
      title: "Approaching Optimal Token Ceiling",
      message: `Rule contains ~${tokenCount} tokens. Verify that all instructions provide high-signal value.`,
      suggestion: "Audit repeated sentences or generic preambles to preserve context headroom.",
    });
  }

  tokenDensityScore = Math.max(20, Math.min(100, tokenDensityScore));

  // ==========================================
  // Dimension 3: Guardrails & Boundaries (25%)
  // ==========================================
  const guardrailIssues: AuditIssue[] = [];
  let guardrailScore = 50;

  let negativeMatchCount = 0;
  for (const pattern of NEGATIVE_GUARDRAIL_PATTERNS) {
    if (pattern.test(content)) {
      negativeMatchCount++;
    }
  }

  if (negativeMatchCount === 0) {
    guardrailScore = 30;
    guardrailIssues.push({
      id: "guardrails-no-negative-constraints",
      dimension: "guardrails",
      severity: "warning",
      title: "Missing Negative Guardrails",
      message: "No negative boundary constraints detected ('never', 'do not', 'prohibited'). AI agents without negative boundaries frequently rewrite unrequested files.",
      suggestion: "Explicitly declare prohibited actions (e.g., 'Never edit .env files or modify database schemas without explicit permission').",
    });
  } else if (negativeMatchCount >= 2) {
    guardrailScore = 95;
  } else {
    guardrailScore = 70;
  }

  // Check destructive command protection
  let hasDestructiveGuards = false;
  for (const pattern of DESTRUCTIVE_COMMAND_PATTERNS) {
    if (pattern.test(content)) {
      hasDestructiveGuards = true;
      break;
    }
  }

  if (hasDestructiveGuards) {
    guardrailScore = Math.min(100, guardrailScore + 10);
  }

  // Check for adversarial prompt injection / override patterns
  for (const { pattern, label } of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      guardrailScore = Math.max(10, guardrailScore - 30);
      guardrailIssues.push({
        id: `security-prompt-injection-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        dimension: "guardrails",
        severity: "error",
        title: `Security Risk: ${label}`,
        message: `Detected potential indirect prompt injection or instruction override pattern. Downstream AI coding models parsing this rule file may compromise repository boundaries.`,
        suggestion: `Remove prompt-override phrases. Use explicit delimiters or labeled XML tags (<context>, <directives>) to isolate user data.`,
      });
    }
  }

  guardrailScore = Math.max(10, Math.min(100, guardrailScore));

  // ==========================================
  // Dimension 4: Trigger Precision & Scoping (20%)
  // ==========================================
  const triggerIssues: AuditIssue[] = [];
  let triggerScore = 100;

  if (data.format === "cursor_mdc") {
    if (data.alwaysApply && (!data.globPattern || data.globPattern === "**/*")) {
      triggerScore = 55;
      triggerIssues.push({
        id: "trigger-cursor-global-unscoped",
        dimension: "triggers",
        severity: "warning",
        title: "Unfiltered Global Rule Attachment",
        message: 'Rule has "alwaysApply: true" without specific file globs. It will attach to every single user query in Cursor.',
        suggestion: 'Specify target file globs (e.g., "src/components/**/*.tsx") or disable alwaysApply to prevent prompt token pollution.',
      });
    } else if (data.globPattern && data.globPattern !== "**/*") {
      triggerScore = 100;
    }
  } else if (data.format === "skill_md") {
    const trigResult = validateTriggerPhrase(data.description || "");
    if (!trigResult.isValid) {
      triggerScore = 45;
      triggerIssues.push({
        id: "trigger-skill-invalid",
        dimension: "triggers",
        severity: trigResult.severity || "warning",
        title: "Suboptimal Skill Activation Trigger",
        message: trigResult.message || "Skill trigger needs domain specification.",
        suggestion: trigResult.recommendation || "Provide specific conditions for when this skill activates.",
      });
    } else if (trigResult.severity === "info") {
      triggerScore = 80;
      triggerIssues.push({
        id: "trigger-skill-info",
        dimension: "triggers",
        severity: "info",
        title: "Generic Keyword in Trigger",
        message: trigResult.message || "Trigger contains broad terms.",
        suggestion: trigResult.recommendation || "Add file types or specific workflow triggers.",
      });
    }
  }

  triggerScore = Math.max(20, Math.min(100, triggerScore));

  // ==========================================
  // Composite Score Calculation
  // ==========================================
  const weightedScore =
    clarityScore * 0.3 +
    tokenDensityScore * 0.25 +
    guardrailScore * 0.25 +
    triggerScore * 0.2;

  const overallScore = Math.max(10, Math.min(100, Math.round(weightedScore)));

  allIssues.push(
    ...clarityIssues,
    ...tokenIssues,
    ...guardrailIssues,
    ...triggerIssues
  );

  let grade: "A+" | "A" | "B" | "C" = "C";
  let gradeLabel = "Needs Refinement";

  if (overallScore >= 90) {
    grade = "A+";
    gradeLabel = "Production Grade";
  } else if (overallScore >= 80) {
    grade = "A";
    gradeLabel = "Solid Architecture";
  } else if (overallScore >= 70) {
    grade = "B";
    gradeLabel = "Acceptable (Minor Tweaks)";
  }

  let summary = "";
  if (grade === "A+" || grade === "A") {
    summary = `High-efficiency rule (~${tokenCount} tokens) with strong negative constraints and grounded clarity.`;
  } else if (grade === "B") {
    summary = `Rule is functional (~${tokenCount} tokens), but contains vague wording or loose trigger boundaries that could be tightened.`;
  } else {
    summary = `Rule requires attention (~${tokenCount} tokens). Address negative guardrails, token overhead, or trigger scope before deployment.`;
  }

  return {
    overallScore,
    grade,
    gradeLabel,
    summary,
    tokenCount,
    charCount,
    dimensions: {
      clarity: { score: clarityScore, weight: 0.3, issues: clarityIssues },
      tokenDensity: { score: tokenDensityScore, weight: 0.25, issues: tokenIssues },
      guardrails: { score: guardrailScore, weight: 0.25, issues: guardrailIssues },
      triggers: { score: triggerScore, weight: 0.2, issues: triggerIssues },
    },
    allIssues,
  };
}
