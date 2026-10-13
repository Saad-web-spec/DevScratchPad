import { SECRET_IGNORE_PATTERNS, toYamlScalar, type OutputFormat, type SkillPreset } from "./ruleGenerator";
import { toFileSlug } from "./exportTargets";

/**
 * Companion files: extra files that belong with one of the studio's formats but need no editor
 * view of their own (the skill folder's scripts and references, Claude Code settings, and the
 * pointer/scoped files other tools read). They are derived from the parent file or the form, so
 * the format selector stays at 17 entries.
 */
export interface CompanionFile {
  /** Repository-relative path, also the path inside the AI kit ZIP. */
  path: string;
  /** One line shown in the studio: what reads the file and what it does. */
  note: string;
  content: string;
  /** Extras (other tools, subagent, CI) are written to the ZIP only when the user opts in. */
  extra: boolean;
}

/** A file inside the skill folder, relative to it (e.g. `scripts/verify.sh`). */
export interface SkillBundleFile {
  path: string;
  when: string;
  content: string;
}

export interface CompanionContext {
  skillName: string;
  description: string;
  procedures: string;
  globPattern: string;
  alwaysApply: boolean;
  ignoreCategories: string[];
  customIgnoreRules: string;
  /** The preset last applied in the studio, if any. */
  preset?: SkillPreset;
}

/** Tools that read a root AGENTS.md on their own, so they need no file of their own. */
export const AGENTS_MD_NATIVE_READERS = ["OpenAI Codex", "Cursor", "GitHub Copilot", "Zed", "JetBrains Junie", "Cline", "Kiro"];

export const VERIFY_SCRIPT = `#!/usr/bin/env bash
# Runs this repository's own checks (lint, type-check, tests, build) and stops at the first failure.
# Run it from the repository root. It only runs commands the project already defines.
set -euo pipefail

export CI="\${CI:-true}" # keeps test runners out of watch mode
ran=0
run() { echo "==> $*"; "$@"; ran=1; }

if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ]; then pm=pnpm
  elif [ -f yarn.lock ]; then pm=yarn
  elif [ -f bun.lockb ] || [ -f bun.lock ]; then pm=bun
  else pm=npm; fi
  for script in lint typecheck type-check test build; do
    if node -e "const s=require('./package.json').scripts||{};process.exit(s['$script']?0:1)" 2>/dev/null; then
      run "$pm" run "$script"
    fi
  done
fi

if [ -f pyproject.toml ] || [ -f setup.py ] || [ -f requirements.txt ]; then
  if command -v ruff >/dev/null 2>&1; then run ruff check .; fi
  if command -v mypy >/dev/null 2>&1 && grep -qs mypy pyproject.toml setup.cfg mypy.ini; then run mypy .; fi
  if command -v pytest >/dev/null 2>&1; then run pytest -q; fi
fi

if [ -f Cargo.toml ]; then run cargo check --all-targets; run cargo test; fi
if [ -f go.mod ]; then run go vet ./...; run go test ./...; fi
if [ -x gradlew ]; then run ./gradlew check
elif [ -f pom.xml ]; then run mvn -q verify; fi
if compgen -G "*.sln" >/dev/null || compgen -G "*.csproj" >/dev/null; then run dotnet build; run dotnet test; fi

if [ "$ran" -eq 0 ]; then
  echo "No checks detected. Ask the user which commands verify this project." >&2
  exit 1
fi
echo "All checks passed."
`;

const VERIFY_WHEN =
  "run it from the repository root before concluding a task; it runs the project's own lint, type-check, test, and build commands and stops at the first failure";

/**
 * Files exported inside the skill folder next to SKILL.md. Reference files come from task presets and
 * are kept while the skill still is that preset (same name or unchanged procedures), so they never
 * leak into a skill imported from a repository or written from scratch.
 */
export function getSkillBundle(ctx: CompanionContext): SkillBundleFile[] {
  const { preset } = ctx;
  const keepsPreset =
    !!preset && (ctx.skillName === preset.slug || ctx.procedures.trim() === preset.procedures.trim());
  const references = keepsPreset ? (preset?.references ?? []) : [];
  return [...references, { path: "scripts/verify.sh", when: VERIFY_WHEN, content: VERIFY_SCRIPT }];
}

/** Strips a leading `---` frontmatter block. */
function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "");
}

/** Splits a glob list on commas outside braces and expands `{a,b}`, since Copilot's `applyTo` separates globs with commas. */
export function expandGlobs(pattern: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of pattern) {
    if (ch === "{") depth++;
    if (ch === "}") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  const expand = (glob: string): string[] => {
    const match = glob.match(/\{([^{}]*)\}/);
    if (!match || match.index === undefined) return [glob];
    const head = glob.slice(0, match.index);
    const tail = glob.slice(match.index + match[0].length);
    return match[1].split(",").flatMap((alt) => expand(`${head}${alt.trim()}${tail}`));
  };

  const globs = parts.map((p) => p.trim()).filter(Boolean).flatMap(expand);
  return [...new Set(globs)];
}

/** True when a Cursor scope means "every file", which other tools express as always-on. */
function isAlwaysOn(ctx: CompanionContext): boolean {
  const globs = expandGlobs(ctx.globPattern);
  return ctx.alwaysApply || globs.length === 0 || globs.every((g) => g === "**/*" || g === "**");
}

/** `.gitignore`-style line to a Claude Code `Read()` rule; directories cover everything below them. */
function toReadRule(pattern: string): string {
  const p = pattern.trim().replace(/^\.\//, "");
  return `Read(${p.endsWith("/") ? `${p}**` : p})`;
}

export function buildClaudeSettings(ctx: CompanionContext): string {
  const patterns = ctx.ignoreCategories.includes("secrets") ? [...SECRET_IGNORE_PATTERNS] : [];
  for (const line of ctx.customIgnoreRules.split("\n")) {
    const trimmed = line.trim();
    if (trimmed) patterns.push(trimmed);
  }
  // Negations (`!.env.example`) have no deny-rule equivalent; comments are not patterns
  const deny = [...new Set(patterns.filter((p) => !p.startsWith("#") && !p.startsWith("!")).map(toReadRule))];
  const settings = {
    $schema: "https://json.schemastore.org/claude-code-settings.json",
    permissions: {
      deny,
      ask: ["Bash(git push *)"],
    },
  };
  return `${JSON.stringify(settings, null, 2)}\n`;
}

/** The SKILL.md body as a Claude Code subagent. Bundled Resources is dropped: subagents have no skill folder. */
export function buildSubagent(skillContent: string, ctx: CompanionContext): string {
  const name = toFileSlug(ctx.skillName).toLowerCase();
  const body = stripFrontmatter(skillContent)
    .replace(/\r?\n## \d+\. Bundled Resources[\s\S]*?(?=\r?\n## |$)/, "")
    .replace(/when this skill is active/g, "when you are invoked")
    .trimEnd();
  const tools = ctx.preset && ctx.skillName === ctx.preset.slug ? ctx.preset.subagentTools : undefined;
  const frontmatter = [
    "---",
    `name: ${name}`,
    `description: ${toYamlScalar(ctx.description.trim().replace(/\s+/g, " "))}`,
    ...(tools ? [`tools: ${tools}`] : []),
    "---",
  ].join("\n");
  return `${frontmatter}\n\n${body}\n`;
}

export function buildCopilotPathInstructions(cursorContent: string, ctx: CompanionContext): string {
  const applyTo = isAlwaysOn(ctx) ? "**" : expandGlobs(ctx.globPattern).join(",");
  return `---\napplyTo: ${JSON.stringify(applyTo)}\n---\n\n${stripFrontmatter(cursorContent).trimEnd()}\n`;
}

export function buildKiroSteering(cursorContent: string, ctx: CompanionContext): string {
  const globs = expandGlobs(ctx.globPattern);
  const frontmatter = isAlwaysOn(ctx)
    ? "inclusion: always"
    : `inclusion: fileMatch\nfileMatchPattern: ${globs.length === 1 ? JSON.stringify(globs[0]) : JSON.stringify(globs)}`;
  return `---\n${frontmatter}\n---\n\n${stripFrontmatter(cursorContent).trimEnd()}\n`;
}

export const GEMINI_SETTINGS = `${JSON.stringify({ context: { fileName: ["AGENTS.md", "GEMINI.md"] } }, null, 2)}\n`;

export const AIDER_CONFIG = `# Aider loads these files read-only into every chat.
read:
  - AGENTS.md
`;

export const AUDIT_WORKFLOW = `# Scores the repository's AI rule files on every change to them and fails below 80/100.
name: AI rules audit

on:
  pull_request:
    paths:
      - "AGENTS.md"
      - "CLAUDE.md"
      - ".claude/**"
      - ".cursor/rules/**"
      - ".windsurf/rules/**"
      - ".github/copilot-instructions.md"
  push:
    branches: [main]
    paths:
      - "AGENTS.md"
      - "CLAUDE.md"
      - ".claude/**"
      - ".cursor/rules/**"
      - ".windsurf/rules/**"
      - ".github/copilot-instructions.md"

permissions:
  contents: read

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
      - run: npx --yes devscratchpad@2 audit . --min-score 80
`;

/**
 * Companion files for one format. `content` is that format's final text (generated or edited);
 * it is only read for formats whose companions are derived from it (SKILL.md, Cursor rules).
 */
export function getCompanionFiles(format: OutputFormat, ctx: CompanionContext, content: string): CompanionFile[] {
  const slug = toFileSlug(ctx.skillName);
  const settings: CompanionFile = {
    path: ".claude/settings.json",
    note: "Claude Code permissions: blocks reads of secret files and asks before git push. Claude Code does not read .claudeignore.",
    content: buildClaudeSettings(ctx),
    extra: false,
  };
  const workflow: CompanionFile = {
    path: ".github/workflows/ai-rules-audit.yml",
    note: "GitHub Actions: fails the build when a rule file scores below 80/100.",
    content: AUDIT_WORKFLOW,
    extra: true,
  };

  switch (format) {
    case "skill_md":
      return [
        ...getSkillBundle(ctx).map((file) => ({
          path: `.claude/skills/${slug}/${file.path}`,
          note: file.path.startsWith("scripts/")
            ? "Runs your project's lint, type-check, test, and build commands; SKILL.md tells the agent when."
            : "Reference the agent opens only when SKILL.md says it applies.",
          content: file.content,
          extra: false,
        })),
        {
          path: `.claude/agents/${slug}.md`,
          note: "Same instructions as a Claude Code subagent, which runs in its own context window.",
          content: buildSubagent(content, ctx),
          extra: true,
        },
      ];
    case "claude_md":
      return [settings, workflow];
    case "claudeignore":
      return [settings];
    case "agents_md":
      return [
        {
          path: ".gemini/settings.json",
          note: "Gemini CLI: reads AGENTS.md as its context file.",
          content: GEMINI_SETTINGS,
          extra: true,
        },
        {
          path: ".aider.conf.yml",
          note: "Aider: loads AGENTS.md read-only into every chat.",
          content: AIDER_CONFIG,
          extra: true,
        },
        workflow,
      ];
    case "cursor_mdc":
      return [
        {
          path: `.github/instructions/${slug}.instructions.md`,
          note: "GitHub Copilot: the same rule, scoped with applyTo.",
          content: buildCopilotPathInstructions(content, ctx),
          extra: true,
        },
        {
          path: `.kiro/steering/${slug}.md`,
          note: "Kiro steering: the same rule, scoped with fileMatchPattern.",
          content: buildKiroSteering(content, ctx),
          extra: true,
        },
      ];
    default:
      return [];
  }
}

/** Formats that have companion files, in ZIP write order. */
export const COMPANION_PARENT_FORMATS: readonly OutputFormat[] = ["skill_md", "claude_md", "claudeignore", "agents_md", "cursor_mdc"];

/** Parents whose companions are built from the parent's text; the rest only need the form state. */
const CONTENT_DERIVED_FORMATS: readonly OutputFormat[] = ["skill_md", "cursor_mdc"];

/** Every companion file for the AI kit, de-duplicated by path. `contentFor` returns each parent format's final text. */
export function getKitCompanions(
  ctx: CompanionContext,
  contentFor: (format: OutputFormat) => string,
  includeExtras: boolean
): CompanionFile[] {
  const byPath = new Map<string, CompanionFile>();
  for (const format of COMPANION_PARENT_FORMATS) {
    const content = CONTENT_DERIVED_FORMATS.includes(format) ? contentFor(format) : "";
    for (const file of getCompanionFiles(format, ctx, content)) {
      if ((includeExtras || !file.extra) && !byPath.has(file.path)) byPath.set(file.path, file);
    }
  }
  return [...byPath.values()];
}
