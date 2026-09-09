#!/usr/bin/env node

/**
 * DevScratchpad CLI (npx devscratchpad)
 * 100% Client-Side & Offline-First AI Rulebook Manager
 * 
 * Commands:
 *   add <format>/<preset>   Install a pre-configured AI rulebook into your repo
 *   list                    List all available presets and formats
 *   audit [file/dir]        Audit your repository's AI rule files for quality & hallucinations
 *   init                    Initialize recommended starter rules for your project
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const VERSION = "2.1.0";
const SITE_URL = "https://www.devscratchpad.tech";

const KNOWN_PRESETS = [
  { slug: "nextjs-15", tech: "Next.js 15 App Router", category: "Fullstack", defaultGlobs: "src/app/**/*.{ts,tsx}" },
  { slug: "react-19", tech: "React 19 & Server Components", category: "Frontend", defaultGlobs: "src/**/*.{ts,tsx}" },
  { slug: "tailwind-v4", tech: "Tailwind CSS v4 (CSS-First)", category: "Styling", defaultGlobs: "src/**/*.{css,tsx,jsx}" },
  { slug: "fastapi", tech: "FastAPI & Pydantic v2", category: "Backend", defaultGlobs: "**/*.py" },
  { slug: "codebase-auditor", tech: "Codebase Security & Lint Auditor", category: "Quality", defaultGlobs: "**/*" },
  { slug: "typescript-strict", tech: "Strict TypeScript Invariants", category: "Language", defaultGlobs: "**/*.{ts,tsx}" },
  { slug: "cursor-rules-pro", tech: "Universal Cursor Pro Rules", category: "IDE", defaultGlobs: "**/*" },
  { slug: "postgres", tech: "PostgreSQL & Prisma/Drizzle", category: "Database", defaultGlobs: "src/db/**/*,prisma/**/*" },
  { slug: "docker-compose", tech: "Docker & Container Hardening", category: "DevOps", defaultGlobs: "Dockerfile,docker-compose*.yml" },
  { slug: "graphql", tech: "GraphQL Yoga & Apollo Federation", category: "API", defaultGlobs: "**/*.graphql,src/schema/**/*" },
  { slug: "django", tech: "Django & Django REST Framework", category: "Backend", defaultGlobs: "**/*.py" },
  { slug: "go-standard", tech: "Idiomatic Go (net/http & slog)", category: "Backend", defaultGlobs: "**/*.go" },
  { slug: "rust-cli", tech: "Rust & Tokio Async", category: "Systems", defaultGlobs: "**/*.rs" },
  { slug: "vitest-testing", tech: "Vitest & Playwright TDD", category: "Testing", defaultGlobs: "**/*.{test,spec}.{ts,tsx}" },
  { slug: "hono-cloudflare", tech: "Hono on Cloudflare Workers", category: "Edge", defaultGlobs: "src/**/*.{ts,js}" },
  { slug: "expo-react-native", tech: "Expo Router & React Native", category: "Mobile", defaultGlobs: "app/**/*.{ts,tsx}" },
  { slug: "svelte-5", tech: "Svelte 5 Runes & SvelteKit", category: "Frontend", defaultGlobs: "src/**/*.{svelte,ts,js}" },
  { slug: "security-guard", tech: "Zero-Trust Security Guardrails", category: "Security", defaultGlobs: "**/*" }
];

const FORMAT_CONFIGS = {
  "cursor-rules": {
    name: "Cursor Rules (.mdc)",
    aliases: ["cursor", "cursor-mdc", "mdc"],
    getTargetPath: (preset) => path.join(".cursor", "rules", `${preset}.mdc`),
  },
  "claude-skills": {
    name: "Claude Code Skills (SKILL.md)",
    aliases: ["claude", "skill", "skill-md"],
    getTargetPath: (preset) => path.join(".claude", "skills", preset, "SKILL.md"),
  },
  "claude-md": {
    name: "Project Root Guidelines (CLAUDE.md)",
    aliases: ["claudemd"],
    getTargetPath: () => "CLAUDE.md",
  },
  "agents-md": {
    name: "Multi-Agent Directives (AGENTS.md)",
    aliases: ["agents", "agentsmd"],
    getTargetPath: () => "AGENTS.md",
  },
  "windsurf": {
    name: "Windsurf Cascade Rules",
    aliases: ["windsurf-rules", "cascade"],
    getTargetPath: (preset) => path.join(".windsurf", "rules", `${preset}.md`),
  },
  "copilot": {
    name: "GitHub Copilot Instructions",
    aliases: ["github-copilot", "copilot-instructions"],
    getTargetPath: () => path.join(".github", "copilot-instructions.md"),
  },
  "mcp-config": {
    name: "Model Context Protocol Schema (claude.json)",
    aliases: ["mcp", "claude-json"],
    getTargetPath: () => "claude.json",
  },
  "openai": {
    name: "OpenAI Custom Instructions",
    aliases: ["openai-instructions", "chatgpt"],
    getTargetPath: () => path.join(".openai", "system-instructions.md"),
  },
  "gemini": {
    name: "Gemini Structured Prompts",
    aliases: ["gemini-prompts", "gemini-rules"],
    getTargetPath: (preset) => path.join(".gemini", `${preset}.json`),
  }
};

function canonicalizeFormat(formatInput) {
  const normalized = formatInput.toLowerCase().trim();
  for (const [canonical, cfg] of Object.entries(FORMAT_CONFIGS)) {
    if (canonical === normalized || cfg.aliases.includes(normalized)) {
      return canonical;
    }
  }
  return null;
}

function fetchContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": `devscratchpad-cli/${VERSION}` } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Server returned HTTP ${res.statusCode}`));
      }
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => resolve(raw));
    }).on("error", (err) => reject(err));
  });
}

function generateLocalFallback(format, preset) {
  const found = KNOWN_PRESETS.find((p) => p.slug === preset) || {
    slug: preset,
    tech: preset,
    category: "General",
    defaultGlobs: "**/*"
  };

  if (format === "cursor-rules") {
    return `---
description: "${found.tech} production guardrails and architectural standards"
globs: "${found.defaultGlobs}"
alwaysApply: false
---
You are an expert engineer specializing in ${found.tech}.

## Core Architectural Guardrails
1. Adhere strictly to idiomatic patterns for ${found.tech}.
2. Ensure 100% client-side data privacy with zero server leaks for sensitive data.
3. Validate all runtime and user boundaries with strict type schemas.
4. Keep diffs surgical and minimal; never reformat unrelated code.

Generated with DevScratchpad AI Skill Studio (${SITE_URL})
`;
  }

  if (format === "windsurf") {
    return `# Windsurf Cascade Rules: ${found.tech}

## Context & File Targets
- Apply to: \`${found.defaultGlobs}\`

## Rules & Conventions
1. Implement idiomatic ${found.tech} solutions adhering to current stable APIs.
2. Prefer modular composition over monolithic architecture.
3. Handle error states deterministically with proper error boundaries.
4. Preserve existing comments and docstrings.

Generated by DevScratchpad (${SITE_URL})
`;
  }

  if (format === "copilot") {
    return `# GitHub Copilot Repository Instructions: ${found.tech}

## Architecture
- Tech Stack: ${found.tech}
- Conventions: Strict type safety, clean code segregation, zero-dependency utility patterns.

## Instructions for Copilot
- When generating code, follow established repository style.
- Prefer explicit return types on all functions and hooks.
- Never introduce deprecated or outdated APIs.
`;
  }

  if (format === "claude-skills") {
    return `---
name: "${found.slug}"
description: "Expert engineering capabilities and patterns for ${found.tech}"
---

# ${found.tech} Skill

## Role & Responsibilities
You are a senior specialist in ${found.tech}. Provide deterministic, production-grade solutions.

## Negative Constraints
- Never use deprecated features or APIs.
- Do not execute unverified shell commands.
- Avoid introducing unneeded external dependencies.
`;
  }

  if (format === "openai") {
    return `# OpenAI Custom Instructions: ${found.tech}

## Operational Persona
You are a senior software architect specializing in ${found.tech}.

## Architecture & Conventions
- Strictly follow established ${found.tech} idioms and design patterns.
- Enforce clean separation of concerns and robust error handling.
- Never introduce deprecated APIs or unnecessary external dependencies.

Generated by DevScratchpad AI Skill Studio (${SITE_URL})
`;
  }

  if (format === "gemini") {
    return JSON.stringify(
      {
        title: `${found.tech} Structured Directives`,
        model_tuning: {
          role: `Senior ${found.tech} Software Engineer`,
          guidelines: [
            `Strictly adhere to modern ${found.tech} conventions and clean typing`,
            "100% offline privacy and zero-trust local execution",
            "Avoid hallucinated dependencies or deprecated APIs"
          ]
        },
        metadata: {
          source: `${SITE_URL}/ai-skill-studio/gemini-prompts/${found.slug}`,
          generator: "DevScratchpad CLI"
        }
      },
      null,
      2
    );
  }

  return `# ${found.tech} Guidelines
Generated by DevScratchpad AI Skill Studio (${SITE_URL})

1. Strict adherence to ${found.tech} standards.
2. 100% offline privacy and secure memory management.
`;
}

async function handleAdd(rawArgs) {
  const argsList = Array.isArray(rawArgs) ? rawArgs : [rawArgs].filter(Boolean);
  const arg = argsList[0];
  if (!arg) {
    console.error("\x1b[31mError: Missing preset identifier.\x1b[0m");
    console.log("Usage: npx devscratchpad add <format>/<preset> or npx devscratchpad add <preset> --format <format>");
    console.log("Example: npx devscratchpad add cursor-rules/nextjs-15");
    process.exit(1);
  }

  let formatSlug = "cursor-rules";
  let presetSlug = arg;

  // Check for --format or -f flag
  const formatFlagIdx = argsList.findIndex((a) => a === "--format" || a === "-f");
  if (formatFlagIdx !== -1 && argsList[formatFlagIdx + 1]) {
    const rawFmt = argsList[formatFlagIdx + 1];
    const canonical = canonicalizeFormat(rawFmt);
    if (!canonical) {
      console.error(`\x1b[31mError: Unknown format "${rawFmt}".\x1b[0m`);
      console.log("Available formats: cursor-rules, claude-skills, claude-md, agents-md, windsurf, copilot, mcp-config, openai, gemini");
      process.exit(1);
    }
    formatSlug = canonical;
    presetSlug = arg;
  } else {
    // Normalize Windows backslashes
    const normalizedArg = arg.replace(/\\/g, "/");
    if (normalizedArg.includes("/")) {
      const parts = normalizedArg.split("/");
      formatSlug = canonicalizeFormat(parts[0]);
      presetSlug = parts[1];
      if (!formatSlug) {
        console.error(`\x1b[31mError: Unknown format "${parts[0]}".\x1b[0m`);
        console.log("Available formats: cursor-rules, claude-skills, claude-md, agents-md, windsurf, copilot, mcp-config, openai, gemini");
        process.exit(1);
      }
    } else {
      const detectedFormat = canonicalizeFormat(arg);
      if (detectedFormat) {
        console.error(`\x1b[31mError: Specified format "${arg}" but missing preset name.\x1b[0m`);
        console.log(`Example: npx devscratchpad add ${arg}/nextjs-15`);
        process.exit(1);
      }
    }
  }

  // Strict alphanumeric slug validation & path confinement
  const cleanPreset = (presetSlug || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanPreset) {
    console.error(`\x1b[31mError: Invalid preset slug "${presetSlug}". Slugs must contain only alphanumeric characters, dashes, or underscores.\x1b[0m`);
    process.exit(1);
  }

  const formatConfig = FORMAT_CONFIGS[formatSlug];
  const targetPath = formatConfig.getTargetPath(cleanPreset);
  const resolvedTarget = path.resolve(process.cwd(), targetPath);
  const cwdRoot = path.resolve(process.cwd()) + path.sep;

  // Strict boundary assertion: resolved target must reside within current workspace
  if (!resolvedTarget.startsWith(cwdRoot) && resolvedTarget !== path.resolve(process.cwd())) {
    console.error(`\x1b[31mSecurity Error: Target path "${targetPath}" attempts directory traversal outside current workspace.\x1b[0m`);
    process.exit(1);
  }

  console.log(`\x1b[36m⚡ Fetching ${formatConfig.name} for "${cleanPreset}"...\x1b[0m`);

  let content = "";
  try {
    const rawUrl = `${SITE_URL}/api/raw/${formatSlug}/${cleanPreset}`;
    content = await fetchContent(rawUrl);
  } catch (err) {
    console.log(`\x1b[33mℹ Using offline bundled template (remote: ${err.message})\x1b[0m`);
    content = generateLocalFallback(formatSlug, cleanPreset);
  }

  // Ensure target folder exists
  const parentDir = path.dirname(resolvedTarget);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(resolvedTarget, content, "utf8");
  console.log(`\x1b[32m✔ Successfully installed!\x1b[0m`);
  console.log(`  Target: \x1b[1m${targetPath}\x1b[0m`);
  console.log(`  Size:   ${content.length} bytes`);
  console.log(`  Format: ${formatConfig.name}`);
  console.log(`\n\x1b[36m👉 Customize interactively in AI Skill Studio:\x1b[0m`);
  console.log(`   ${SITE_URL}/ai-skill-studio/${formatSlug}/${cleanPreset}`);
  console.log(`\x1b[35m🔄 Convert existing rules across formats:\x1b[0m`);
  console.log(`   ${SITE_URL}/ai-skill-studio/rules-converter\n`);
}

function handleList() {
  console.log("\x1b[1m\x1b[36m====================================================\x1b[0m");
  console.log("\x1b[1m DevScratchpad AI Skill Studio — Available Presets\x1b[0m");
  console.log("\x1b[1m\x1b[36m====================================================\x1b[0m\n");

  console.log("\x1b[1mAvailable Formats:\x1b[0m");
  for (const [key, cfg] of Object.entries(FORMAT_CONFIGS)) {
    console.log(`  • \x1b[33m${key.padEnd(16)}\x1b[0m (${cfg.name})`);
  }

  console.log("\n\x1b[1mAvailable Technology Presets:\x1b[0m");
  const grouped = {};
  for (const p of KNOWN_PRESETS) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  for (const [cat, presets] of Object.entries(grouped)) {
    console.log(`\n  \x1b[35m[${cat}]\x1b[0m`);
    for (const p of presets) {
      console.log(`    - \x1b[1m${p.slug.padEnd(22)}\x1b[0m ${p.tech}`);
    }
  }

  console.log("\n\x1b[36mQuick Install Example:\x1b[0m");
  console.log("  npx devscratchpad add cursor-rules/nextjs-15");
  console.log("  npx devscratchpad add windsurf/tailwind-v4");
  console.log("  npx devscratchpad add claude-skills/fastapi");
  console.log("  npx devscratchpad add copilot/typescript-strict\n");
  console.log("\x1b[1m\x1b[36mInteractive Web Studio:\x1b[0m");
  console.log(`  Visual Rule Studio:     ${SITE_URL}/ai-skill-studio`);
  console.log(`  Universal Converter:    ${SITE_URL}/ai-skill-studio/rules-converter`);
  console.log(`  Offline Dev Utilities:  ${SITE_URL}/developer-tools\n`);
}

function auditFileContent(filename, content) {
  let score = 100;
  const issues = [];

  // 1. Check for negative constraints
  const hasNegativeGuardrails = /\b(never|do not|avoid|prohibit|forbidden|must not)\b/i.test(content);
  if (!hasNegativeGuardrails) {
    score -= 20;
    issues.push("Missing negative guardrails (e.g. 'Never do X', 'Avoid Y'). Without negative bounds, LLMs hallucinate.");
  }

  // 2. Check rule density
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 5) {
    score -= 25;
    issues.push("Rule file is too sparse (< 5 active lines). Add concrete tech stack boundaries.");
  } else if (lines.length > 300) {
    score -= 15;
    issues.push("Rule file exceeds 300 lines. Monolithic rules cause context window degradation.");
  }

  // 3. Check for specific globs or triggers
  if (filename.endsWith(".mdc")) {
    const hasGlobs = /^globs:\s*.+/m.test(content);
    if (!hasGlobs) {
      score -= 20;
      issues.push("Missing 'globs:' frontmatter directive in .mdc rule. Rule will either never apply or apply everywhere.");
    }
  }

  // 4. Check for vague phrases
  const vagueMatches = content.match(/\b(clean code|write good code|best practices|etc)\b/gi);
  if (vagueMatches) {
    score -= 10;
    issues.push(`Contains vague directives (${vagueMatches.slice(0, 3).join(", ")}). Replace with concrete architectural invariants.`);
  }

  return { score: Math.max(0, score), issues };
}

function handleAudit(targetDir = process.cwd()) {
  console.log(`\x1b[36m🔍 Scanning repository for AI rulebooks in: ${targetDir}...\x1b[0m\n`);

  const ruleCandidates = [
    ".cursorrules",
    "CLAUDE.md",
    "AGENTS.md",
    ".windsurfrules",
    path.join(".github", "copilot-instructions.md")
  ];

  const foundFiles = [];

  // Direct root candidates
  for (const candidate of ruleCandidates) {
    const full = path.join(targetDir, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      foundFiles.push(candidate);
    }
  }

  // Check .cursor/rules/*.mdc
  const cursorRulesDir = path.join(targetDir, ".cursor", "rules");
  if (fs.existsSync(cursorRulesDir)) {
    const files = fs.readdirSync(cursorRulesDir);
    for (const f of files) {
      if (f.endsWith(".mdc") || f.endsWith(".md")) {
        foundFiles.push(path.join(".cursor", "rules", f));
      }
    }
  }

  // Check .claude/skills/*/SKILL.md
  const claudeSkillsDir = path.join(targetDir, ".claude", "skills");
  if (fs.existsSync(claudeSkillsDir)) {
    const dirs = fs.readdirSync(claudeSkillsDir);
    for (const d of dirs) {
      const skillFile = path.join(".claude", "skills", d, "SKILL.md");
      if (fs.existsSync(path.join(targetDir, skillFile))) {
        foundFiles.push(skillFile);
      }
    }
  }

  // Check .windsurf/rules/*.md
  const windsurfRulesDir = path.join(targetDir, ".windsurf", "rules");
  if (fs.existsSync(windsurfRulesDir)) {
    const files = fs.readdirSync(windsurfRulesDir);
    for (const f of files) {
      if (f.endsWith(".md")) {
        foundFiles.push(path.join(".windsurf", "rules", f));
      }
    }
  }

  // Check .openai and .gemini
  const openaiFile = path.join(targetDir, ".openai", "system-instructions.md");
  if (fs.existsSync(openaiFile)) foundFiles.push(path.join(".openai", "system-instructions.md"));

  const geminiDir = path.join(targetDir, ".gemini");
  if (fs.existsSync(geminiDir)) {
    const files = fs.readdirSync(geminiDir);
    for (const f of files) {
      if (f.endsWith(".json")) foundFiles.push(path.join(".gemini", f));
    }
  }

  if (foundFiles.length === 0) {
    console.log("\x1b[33mNo AI rule files found in this repository.\x1b[0m");
    console.log("Run \x1b[36mnpx devscratchpad list\x1b[0m to browse rule presets, or \x1b[36mnpx devscratchpad init\x1b[0m to create one.");
    console.log(`\n\x1b[36m🌐 Create visually in AI Skill Studio:\x1b[0m ${SITE_URL}/ai-skill-studio\n`);
    return;
  }

  let totalScore = 0;

  for (const relPath of foundFiles) {
    const full = path.join(targetDir, relPath);
    const content = fs.readFileSync(full, "utf8");
    const { score, issues } = auditFileContent(relPath, content);
    totalScore += score;

    const color = score >= 80 ? "\x1b[32m" : score >= 60 ? "\x1b[33m" : "\x1b[31m";
    console.log(`\x1b[1mFile:\x1b[0m ${relPath}`);
    console.log(`\x1b[1mQuality Score:\x1b[0m ${color}${score} / 100\x1b[0m`);

    if (issues.length > 0) {
      console.log("\x1b[1mRemediations:\x1b[0m");
      for (const iss of issues) {
        console.log(`  ⚠ ${iss}`);
      }
    } else {
      console.log("\x1b[32m  ✔ Passed all static heuristic quality checks!\x1b[0m");
    }
    console.log("");
  }

  const avgScore = Math.round(totalScore / foundFiles.length);
  const avgColor = avgScore >= 80 ? "\x1b[32m" : avgScore >= 60 ? "\x1b[33m" : "\x1b[31m";
  console.log(`\x1b[1mRepository AI Rule Health:\x1b[0m ${avgColor}${avgScore} / 100\x1b[0m (${foundFiles.length} file${foundFiles.length > 1 ? "s" : ""})`);
  console.log(`\n\x1b[36m💡 Auto-fix and enhance your rules with zero data leakage in AI Skill Studio:\x1b[0m`);
  console.log(`   ${SITE_URL}/ai-skill-studio`);
  console.log(`\x1b[35m🔄 Convert existing rules across formats:\x1b[0m`);
  console.log(`   ${SITE_URL}/ai-skill-studio/rules-converter\n`);
}

function handleInit() {
  console.log("\x1b[36m🚀 Initializing DevScratchpad starter rules...\x1b[0m");
  handleAdd("cursor-rules/cursor-rules-pro");
}

function printHelp() {
  console.log(`
\x1b[1mDevScratchpad CLI v${VERSION}\x1b[0m
100% Offline-First AI Agent & IDE Rulebook Manager

\x1b[1mUSAGE:\x1b[0m
  npx devscratchpad <command> [arguments]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[36madd <format>/<preset>\x1b[0m    Install rulebook into repository (e.g. cursor-rules/nextjs-15)
  \x1b[36mlist\x1b[0m                     Browse available technology presets and format hubs
  \x1b[36maudit [dir]\x1b[0m              Audit current repository's AI rule files for quality & hallucinations
  \x1b[36minit\x1b[0m                     Install default universal multi-agent starter rules
  \x1b[36mhelp\x1b[0m                     Show this help message

\x1b[1mFORMATS:\x1b[0m
  cursor-rules, claude-skills, claude-md, agents-md, windsurf, copilot, mcp-config, openai, gemini

\x1b[1mWEBSITE & TOOLS:\x1b[0m
  Web Terminal:      ${SITE_URL}/cli
  Engineering Guide: ${SITE_URL}/blog/how-to-manage-ai-rules-with-cli-guide
  Visual Studio:     ${SITE_URL}/ai-skill-studio
  Rules Converter:   ${SITE_URL}/ai-skill-studio/rules-converter
  Developer Tools:   ${SITE_URL}/developer-tools
`);
}

async function main() {
  const [,, cmd, ...args] = process.argv;

  switch (cmd) {
    case "add":
      await handleAdd(args);
      break;
    case "list":
    case "ls":
      handleList();
      break;
    case "audit":
      handleAudit(args[0]);
      break;
    case "init":
      handleInit();
      break;
    case "version":
    case "-v":
    case "--version":
      console.log(`devscratchpad v${VERSION}`);
      break;
    case "help":
    case "-h":
    case "--help":
    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(1);
});
