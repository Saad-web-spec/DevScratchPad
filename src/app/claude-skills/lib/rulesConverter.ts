/**
 * Reverse Importer: Rules Converter Engine
 * 100% Client-Side parser that decomposes legacy .cursorrules, CLAUDE.md,
 * and arbitrary AI instructions into the Universal Studio Intermediate Representation (IR).
 */

export interface ParsedRulesIR {
  skillName: string;
  skillTitle: string;
  description: string;
  role: string;
  framework: string;
  language: string;
  styling: string;
  database: string;
  philosophy: "pragmatic" | "modern" | "strict" | "vibe" | "architect";
  behaviors: string[];
  conventions: string[];
  procedures: string;
  customDirectives: string;
  exampleGood: string;
  exampleBad: string;
  globPattern: string;
  alwaysApply: boolean;
  detectedSourceFormat: string;
  triggers?: string[];
}

export type ConvertedRulesIR = ParsedRulesIR;

const FRAMEWORK_KEYWORDS: Record<string, { framework: string; language: string; styling?: string; database?: string }> = {
  "next.js": { framework: "Next.js 15 (App Router)", language: "TypeScript 5.x", styling: "Tailwind CSS v4" },
  "nextjs": { framework: "Next.js 15 (App Router)", language: "TypeScript 5.x", styling: "Tailwind CSS v4" },
  "react": { framework: "React 19 (SPA/Vite)", language: "TypeScript 5.x", styling: "Tailwind CSS" },
  "fastapi": { framework: "FastAPI", language: "Python 3.12+", database: "PostgreSQL" },
  "django": { framework: "Django / DRF", language: "Python 3.12+", database: "PostgreSQL" },
  "svelte": { framework: "Svelte 5 / SvelteKit", language: "TypeScript 5.x", styling: "Tailwind CSS" },
  "vue": { framework: "Vue 3 / Nuxt 3", language: "TypeScript 5.x", styling: "Tailwind CSS" },
  "hono": { framework: "Hono / Cloudflare Workers", language: "TypeScript 5.x" },
  "express": { framework: "Express / Node.js", language: "TypeScript 5.x" },
  "nestjs": { framework: "NestJS", language: "TypeScript 5.x", database: "PostgreSQL" },
  "rust": { framework: "Rust / Tokio", language: "Rust 2021" },
  "go": { framework: "Go standard library (net/http)", language: "Go 1.22+" },
  "golang": { framework: "Go standard library (net/http)", language: "Go 1.22+" },
  "flutter": { framework: "Flutter / Dart", language: "Dart 3.x" },
  "expo": { framework: "Expo / React Native", language: "TypeScript 5.x" },
};

/**
 * Parses raw rulebook text into Universal Studio IR.
 */
export function convertRawRulesToIR(rawInput: string, originalFilename = ""): ParsedRulesIR {
  let content = rawInput.trim();
  let globPattern = "**/*";
  let alwaysApply = false;
  let description = "";
  let detectedSourceFormat = "Generic Markdown / .cursorrules";

  if (originalFilename.toLowerCase().includes("claude.md")) {
    detectedSourceFormat = "Anthropic CLAUDE.md";
  } else if (originalFilename.toLowerCase().endsWith(".mdc")) {
    detectedSourceFormat = "Cursor Project Rule (.mdc)";
  } else if (originalFilename.toLowerCase().includes("cursorrules")) {
    detectedSourceFormat = "Legacy .cursorrules";
  } else if (originalFilename.toLowerCase().includes("copilot")) {
    detectedSourceFormat = "GitHub Copilot Instructions";
  } else if (originalFilename.toLowerCase().includes("windsurf")) {
    detectedSourceFormat = "Windsurf Cascade Rules";
  }

  // 1. Extract YAML Frontmatter if present
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const fmText = frontmatterMatch[1];
    content = frontmatterMatch[2].trim();

    const descMatch = fmText.match(/description:\s*["']?([^"'\r\n]+)["']?/i);
    if (descMatch) description = descMatch[1].trim();

    const globsMatch = fmText.match(/globs:\s*["']?([^"'\r\n]+)["']?/i);
    if (globsMatch) globPattern = globsMatch[1].trim();

    const alwaysMatch = fmText.match(/alwaysApply:\s*(true|false)/i);
    if (alwaysMatch) alwaysApply = alwaysMatch[1].toLowerCase() === "true";
  }

  // 2. Extract Role / Persona
  let role = "Senior Software Architect & Staff Engineer";
  const roleMatch = content.match(/(?:you are an?|act as an?|role:)\s+([^.\r\n]+)/i);
  if (roleMatch) {
    role = roleMatch[1].trim().replace(/^expert\s+/i, "Specialist: ");
    if (role.length > 60) role = role.slice(0, 60);
  }

  // 3. Extract Code Blocks (Good vs Bad)
  let exampleGood = "";
  let exampleBad = "";
  const codeBlocks: { language: string; code: string; isBad: boolean }[] = [];
  const codeRegex = /(?:(###?\s*(?:Anti-Pattern|Avoid|Bad|Discouraged|Incorrect)[^\r\n]*\r?\n)?```([a-z0-9_-]*)\r?\n([\s\S]*?)```)/gi;
  let blockMatch;

  while ((blockMatch = codeRegex.exec(content)) !== null) {
    const hasBadHeading = Boolean(blockMatch[1]);
    const lang = blockMatch[2] || "typescript";
    const code = blockMatch[3].trim();
    const isBad = hasBadHeading || code.toLowerCase().includes("bad") || code.toLowerCase().includes("discouraged");
    codeBlocks.push({ language: lang, code, isBad });
  }

  for (const b of codeBlocks) {
    if (b.isBad && !exampleBad) {
      exampleBad = b.code;
    } else if (!b.isBad && !exampleGood) {
      exampleGood = b.code;
    }
  }

  // 4. Decompose Lines: Negative Constraints vs Positive Conventions
  const lines = content.split(/\r?\n/);
  const behaviors: string[] = [];
  const conventions: string[] = [];
  const customLines: string[] = [];
  const procedureLines: string[] = [];

  let inProceduresSection = false;
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Toggle code block state and skip code content
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (line.startsWith("---")) continue;

    // Detect section headers
    if (line.startsWith("#")) {
      const lower = line.toLowerCase();
      inProceduresSection = lower.includes("procedure") || lower.includes("workflow") || lower.includes("step") || lower.includes("checklist");
      continue;
    }

    // Clean leading bullets
    const cleanLine = line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "").trim();
    if (cleanLine.length < 6) continue;

    if (inProceduresSection) {
      procedureLines.push(cleanLine);
      continue;
    }

    // Negative constraints
    const isNegative = /\b(never|do not|don't|avoid|prohibit|forbidden|must not|cannot)\b/i.test(cleanLine);
    if (isNegative) {
      behaviors.push(cleanLine);
      continue;
    }

    // Positive conventions
    const isConvention = /\b(always|prefer|use|enforce|ensure|follow|maintain|strictly)\b/i.test(cleanLine);
    if (isConvention) {
      conventions.push(cleanLine);
      continue;
    }

    // Other guidelines
    customLines.push(cleanLine);
  }

  // 5. Detect Framework and Languages
  const lowerContent = rawInput.toLowerCase();
  let framework = "Next.js 15 (App Router)";
  let language = "TypeScript 5.x";
  let styling = "Tailwind CSS v4";
  let database = "PostgreSQL";

  for (const [kw, info] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (lowerContent.includes(kw)) {
      framework = info.framework;
      language = info.language;
      if (info.styling) styling = info.styling;
      if (info.database) database = info.database;
      break;
    }
  }

  // 6. Deduce Philosophy
  let philosophy: "pragmatic" | "modern" | "strict" | "vibe" | "architect" = "modern";
  if (lowerContent.includes("zero-trust") || lowerContent.includes("security") || lowerContent.includes("strict")) {
    philosophy = "strict";
  } else if (lowerContent.includes("rapid") || lowerContent.includes("prototype") || lowerContent.includes("vibe")) {
    philosophy = "vibe";
  } else if (lowerContent.includes("clean architecture") || lowerContent.includes("hexagonal") || lowerContent.includes("ddd")) {
    philosophy = "architect";
  } else if (lowerContent.includes("pragmatic") || lowerContent.includes("mvp")) {
    philosophy = "pragmatic";
  }

  // 7. Derive Skill Name & Title
  const baseName = originalFilename
    ? originalFilename.replace(/\.(cursorrules|mdc|md|json)$/i, "").toLowerCase()
    : "custom-rule";

  const skillName = baseName.replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "imported-rule";
  const skillTitle = `${framework} Production Rulebook`;

  if (!description) {
    description = `Production guidelines, architectural constraints, and deterministic guardrails for ${framework}.`;
  }

  // Format procedures into checklist
  const procedures = procedureLines.length > 0
    ? procedureLines.map((p, idx) => `${idx + 1}. ${p}`).join("\n")
    : "1. Run typecheck and lint validation.\n2. Verify client-side isolation.\n3. Run regression tests before committing.";

  // Format custom directives
  const customDirectives = customLines.slice(0, 15).map((l) => `- ${l}`).join("\n");

  return {
    skillName,
    skillTitle,
    description,
    role,
    framework,
    language,
    styling,
    database,
    philosophy,
    behaviors: behaviors.length > 0 ? behaviors.slice(0, 10) : [
      "Never mutate client-side state during SSR hydration.",
      "Do not import server-only packages into client components.",
      "Avoid monolithic multi-thousand-line files; split cleanly by domain."
    ],
    conventions: conventions.length > 0 ? conventions.slice(0, 10) : [
      "Always enforce strict TypeScript types with zero 'any'.",
      "Prefer explicit function returns over inferred return types.",
      "Ensure all async boundaries have deterministic error handling."
    ],
    procedures,
    customDirectives,
    exampleGood,
    exampleBad,
    globPattern,
    alwaysApply,
    detectedSourceFormat
  };
}
