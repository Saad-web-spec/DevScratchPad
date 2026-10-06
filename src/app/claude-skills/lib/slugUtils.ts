/**
 * Slug & Trigger Utilities
 * Provides POSIX-compliant slugification for rule files and heuristic
 * analysis of AI activation trigger phrases to prevent context bloat.
 */

const CATCH_ALL_TRIGGERS = new Set([
  "help",
  "code",
  "fix",
  "debug",
  "test",
  "write",
  "program",
  "build",
  "create",
  "run",
  "make",
  "do",
  "assist",
  "work",
  "task",
  "dev",
  "generate",
  "prompt",
  "ai",
  "ask",
]);

/**
 * Strict slug regex: lowercase alphanumeric segments separated by single hyphens.
 * Prevents traversal sequences (../), slashes, dots, and invalid filesystem characters.
 */
export const SAFE_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates whether a skill identifier adheres to strict whitelist security standards.
 */
export function validateSkillIdentifier(identifier: string): { isValid: boolean; message?: string } {
  if (!identifier || typeof identifier !== "string") {
    return { isValid: false, message: "Skill identifier cannot be empty." };
  }
  const trimmed = identifier.trim();
  if (trimmed.length > 48) {
    return { isValid: false, message: "Identifier must not exceed 48 characters." };
  }
  if (/\.\.|\/|\\|\0/.test(trimmed)) {
    return { isValid: false, message: "Identifier cannot contain path traversal characters (/, \\, ..) or null bytes." };
  }
  if (!SAFE_SLUG_REGEX.test(trimmed)) {
    return {
      isValid: false,
      message: "Identifier must only contain lowercase letters, numbers, and single hyphens (e.g. 'nextjs-api-auditor').",
    };
  }
  return { isValid: true };
}

/**
 * Generates a safe, POSIX-compliant slug suitable for filenames and skill identifiers.
 * - Normalizes unicode and strips diacritics
 * - Strips null bytes and path traversal patterns
 * - Converts to lowercase
 * - Replaces whitespace, underscores, slashes, and dots with hyphens
 * - Strips non-alphanumeric characters except hyphens
 * - Collapses repeated hyphens and trims edges
 * - Truncates to max 48 characters
 */
export function generateSafeSlug(input: string): string {
  if (!input || typeof input !== "string") {
    return "custom-skill";
  }

  // Remove null bytes and path traversal sequences
  const sanitizedInput = input.replace(/\0/g, "").replace(/\.\.+/g, "-");

  const slug = sanitizedInput
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics / accents
    .toLowerCase()
    .replace(/[\s_./\\]+/g, "-") // Convert whitespace, underscores, slashes, dots to hyphen
    .replace(/[^a-z0-9-]/g, "") // Remove all non-alphanumeric characters except hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens

  if (!slug) {
    return "custom-skill";
  }

  // Truncate to max 48 characters without ending on a hyphen
  const truncated = slug.slice(0, 48).replace(/-+$/, "");
  return truncated || "custom-skill";
}

export interface TriggerValidationResult {
  isValid: boolean;
  severity?: "warning" | "info";
  message?: string;
  matches?: string[];
  broadTags?: string[];
  recommendation?: string;
}

/**
 * Evaluates an activation trigger phrase and interactive trigger chips against heuristic anti-patterns.
 * Overly broad triggers (e.g. "help", "fix code", "test") activate on almost
 * every prompt, bloating the LLM context window and eroding instruction recall.
 */
export function validateTriggerPhrase(phrase: string, tags: string[] = []): TriggerValidationResult {
  const trimmed = phrase?.trim() || "";
  const cleanedTags = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);

  // Identify broad chips/tags
  const broadTags = cleanedTags.filter((tag) => {
    const tagWords = tag.match(/[a-z0-9]+/g) || [];
    return tagWords.length > 0 && tagWords.every((w) => CATCH_ALL_TRIGGERS.has(w));
  });

  const hasSpecificTags = cleanedTags.some((tag) => !broadTags.includes(tag));

  if (!trimmed && cleanedTags.length === 0) {
    return {
      isValid: false,
      severity: "warning",
      message: "Activation trigger and chips are empty. Agents may fail to auto-activate this skill.",
      recommendation: "Add specific trigger chips (e.g. 'api-routes', 'prisma-schema') or a descriptive activation phrase.",
    };
  }

  if (broadTags.length > 0 && broadTags.length === cleanedTags.length && !trimmed) {
    return {
      isValid: false,
      severity: "warning",
      broadTags,
      message: `Trigger chips contain overly generic terms ("${broadTags.join('", "')}"). This causes frequent false-positive activations.`,
      recommendation: "Replace generic tags with domain-specific chips like 'nextjs-app-router', 'postgresql', or 'zod-schemas'.",
    };
  }

  if (!trimmed && hasSpecificTags) {
    return { isValid: true };
  }

  if (trimmed.length < 4 && !hasSpecificTags) {
    return {
      isValid: false,
      severity: "warning",
      message: "Trigger phrase is too short to guide AI activation reliably.",
      recommendation: "Provide a descriptive sentence explaining the trigger condition or select domain chips.",
    };
  }

  // Extract individual alphanumeric words
  const words = (trimmed.toLowerCase().match(/[a-z0-9]+/g) || []);
  const matchedCatchAlls = Array.from(new Set(words.filter((w) => CATCH_ALL_TRIGGERS.has(w))));

  // If the trigger consists entirely of generic catch-all words and no specific tags exist
  if (words.length <= 2 && matchedCatchAlls.length === words.length && !hasSpecificTags) {
    return {
      isValid: false,
      severity: "warning",
      matches: matchedCatchAlls,
      broadTags,
      message: `Trigger phrase uses overly generic catch-all words ("${matchedCatchAlls.join('", "')}"). This causes frequent false-positive activations and context bloat.`,
      recommendation: "Ground the trigger in specific domain tasks, file types, or libraries (e.g., 'When refactoring Prisma database schemas' or 'When generating Next.js server actions').",
    };
  }

  // If broad words are present but with some context
  if (matchedCatchAlls.length > 0 && words.length < 5 && !hasSpecificTags) {
    return {
      isValid: true,
      severity: "info",
      matches: matchedCatchAlls,
      broadTags,
      message: `Contains generic keyword ("${matchedCatchAlls.join('", "')}"). Consider adding specific file patterns or framework boundaries.`,
      recommendation: "Add explicit file extensions, subdirectories, or domain chips to narrow down when this rule is activated.",
    };
  }

  if (broadTags.length > 0) {
    return {
      isValid: true,
      severity: "info",
      broadTags,
      message: `Overly broad chip(s) detected ("${broadTags.join('", "')}").`,
      recommendation: "Consider refining broad chips with specific module tags.",
    };
  }

  return { isValid: true };
}
