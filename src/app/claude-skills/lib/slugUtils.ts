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
  recommendation?: string;
}

/**
 * Evaluates an activation trigger phrase against heuristic anti-patterns.
 * Overly broad triggers (e.g. "help", "fix code", "test") activate on almost
 * every prompt, bloating the LLM context window and eroding instruction recall.
 */
export function validateTriggerPhrase(phrase: string): TriggerValidationResult {
  const trimmed = phrase?.trim() || "";

  if (!trimmed) {
    return {
      isValid: false,
      severity: "warning",
      message: "Activation trigger is empty. Agents may fail to auto-activate this skill.",
      recommendation: "Specify when this skill should activate (e.g., 'When writing unit tests or mocking services in Vitest').",
    };
  }

  if (trimmed.length < 4) {
    return {
      isValid: false,
      severity: "warning",
      message: "Trigger phrase is too short to guide AI activation reliably.",
      recommendation: "Provide a descriptive sentence explaining the trigger condition.",
    };
  }

  // Extract individual alphanumeric words
  const words = (trimmed.toLowerCase().match(/[a-z0-9]+/g) || []);
  const matchedCatchAlls = words.filter((w) => CATCH_ALL_TRIGGERS.has(w));

  // If the trigger consists entirely of 1 or 2 generic catch-all words
  if (words.length <= 2 && matchedCatchAlls.length === words.length) {
    return {
      isValid: false,
      severity: "warning",
      matches: matchedCatchAlls,
      message: `Trigger phrase uses overly generic catch-all words ("${matchedCatchAlls.join('", "')}"). This causes frequent false-positive activations and context bloat.`,
      recommendation: "Ground the trigger in specific domain tasks, file types, or libraries (e.g., 'When refactoring Prisma database schemas' or 'When generating Next.js server actions').",
    };
  }

  // If broad words are present but with some context
  if (matchedCatchAlls.length > 0 && words.length < 5) {
    return {
      isValid: true,
      severity: "info",
      matches: matchedCatchAlls,
      message: `Contains generic keyword ("${matchedCatchAlls.join('", "')}"). Consider adding specific file patterns or framework boundaries.`,
      recommendation: "Add explicit file extensions or subdirectories to narrow down when this rule is activated.",
    };
  }

  return { isValid: true };
}
