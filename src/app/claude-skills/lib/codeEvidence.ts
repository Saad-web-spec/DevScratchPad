/**
 * Code Evidence: reads a sample of a repository's own source files and turns the
 * patterns they share into rules, each citing how much of the code backs it.
 * Pure functions only; the GitHub and local-folder importers fetch the files
 * in the browser and pass them in (ADR-001, nothing is uploaded).
 */

export interface RepoFile {
  path: string;
  /** Bytes, when the file list provides it (GitHub tree); local folders skip it. */
  size?: number;
}

export interface SourceSample {
  path: string;
  content: string;
}

export interface EvidenceFinding {
  /** Short topic shown in the import preview, e.g. "Tests". */
  topic: string;
  /** Imperative rule written into the generated file, without a trailing period. */
  rule: string;
  /** How much of the sample backs the rule, e.g. "18 of 20 component files". */
  support: string;
  /** A file where the pattern was seen. */
  example?: string;
  /** One line of code that breaks the rule, used to build the anti-pattern example. */
  counterExample?: string;
}

export interface ExistingRuleFile {
  path: string;
  rules: string[];
}

export interface CodeEvidence {
  filesRead: number;
  findings: EvidenceFinding[];
  existingRules: ExistingRuleFile[];
  /** A real function from the repository, for the preferred-pattern example. */
  exampleGood?: string;
  /** Lines that break the detected conventions, for the anti-pattern example. */
  exampleBad?: string;
}

export const MAX_SOURCE_SAMPLES = 24;
const MAX_TEST_SAMPLES = 4;
export const MAX_SOURCE_BYTES = 60_000;
const MIN_SOURCE_BYTES = 120;
const MAX_RULE_FILES = 6;
const MAX_EXISTING_RULES = 6;
const MAX_FINDINGS = 12;
/** When the cap bites, keep the rules that change how code is written; formatting is usually enforced by tooling anyway. */
const TOPIC_ORDER = ["Tests", "File naming", "Imports", "Exports", "Errors", "Validation", "Logging", "Components", "Types", "Functions", "Formatting"];

const SOURCE_EXT = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|py|go|rs|java|kt|rb|php|cs|swift)$/;
const JS_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
const TS_EXT = /\.tsx?$/;
const COMPONENT_EXT = /\.(tsx|jsx|vue|svelte)$/;
const HASH_COMMENT = /\.(py|rb)$/;

/** Folders that hold dependencies, build output or generated code rather than the team's own source. */
export const SKIPPED_DIRS = new Set([
  "node_modules", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit", ".output", "target", "vendor",
  "venv", ".venv", "env", "__pycache__", "coverage", ".turbo", ".vercel", "generated", "__generated__",
  "__snapshots__", "__mocks__", "fixtures", ".git", "Pods", "bin", "obj", "public", "static", "migrations",
  // Sample apps and docs sites follow their own conventions, not the project's
  "examples", "example", "demo", "demos", "docs", "website", "playground", "benchmarks",
]);
/** Dot-folders that hold AI rules, which the importers still read. */
export const RULE_DIRS = new Set([".cursor", ".github", ".claude", ".windsurf"]);

const SKIPPED_FILE = /\.d\.ts$|\.min\.[cm]?js$|\.bundle\.js$|\.generated\.|\.config\.[cm]?[jt]s$|\.stories\.[jt]sx?$/;
const TEST_PATH = /(^|\/)(__tests__|tests?|spec)\/|\.(test|spec)\.[a-z]+$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$/;
const MAIN_ROOT = /^(src|lib|app|apps|packages|internal|pkg|cmd|server|components|core)(\/|$)/;

const ROOT_RULE_FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules", ".windsurfrules", "CONVENTIONS.md", ".github/copilot-instructions.md"];
const NESTED_RULE_FILE = /^(\.cursor\/rules\/[^/]+\.mdc?|\.claude\/skills\/[^/]+\/SKILL\.md|\.github\/instructions\/[^/]+\.instructions\.md|\.windsurf\/rules\/[^/]+\.md)$/;

/** Files whose names the framework dictates, so they say nothing about the team's naming or export style. */
const FRAMEWORK_FILE = /^(page|layout|route|loading|error|not-found|template|default|middleware|proxy|index|main|mod|lib|app|_app|_document|__init__|setup|conftest|manage|global-error|opengraph-image|sitemap|robots)$/;

/** Matches values that look like live credentials; files containing one are never quoted. */
const SECRET_LIKE = /-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i;

function dirOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

function baseName(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.replace(/\.(test|spec|stories)(?=\.)/, "").replace(/\.[^.]+$/, "");
}

function isSkippedPath(path: string): boolean {
  return path.split("/").slice(0, -1).some((part) => SKIPPED_DIRS.has(part) || (part.startsWith(".") && !RULE_DIRS.has(part)));
}

export function isTestPath(path: string): boolean {
  return TEST_PATH.test(path);
}

/** Round-robins across folders so the sample covers the codebase rather than one big directory. */
function spreadAcrossFolders(files: RepoFile[], count: number): string[] {
  const groups = new Map<string, RepoFile[]>();
  for (const file of files) {
    const dir = dirOf(file.path);
    groups.set(dir, [...(groups.get(dir) ?? []), file]);
  }
  // Mid-sized files read most like everyday code; tiny ones are re-exports and huge ones are outliers
  const typical = (f: RepoFile) => Math.abs((f.size ?? 4000) - 4000);
  const ordered = [...groups.entries()]
    .map(([dir, group]) => ({ main: MAIN_ROOT.test(dir), group: group.sort((a, b) => typical(a) - typical(b) || a.path.localeCompare(b.path)) }))
    .sort((a, b) => Number(b.main) - Number(a.main) || b.group.length - a.group.length)
    .map((entry) => entry.group);

  const picked: string[] = [];
  for (let round = 0; picked.length < count; round++) {
    let added = false;
    for (const group of ordered) {
      if (!group[round]) continue;
      picked.push(group[round].path);
      added = true;
      if (picked.length === count) break;
    }
    if (!added) break;
  }
  return picked;
}

/** Picks the source files worth reading: the team's own code across folders, plus a few tests. */
export function selectEvidenceFiles(files: RepoFile[], limit = MAX_SOURCE_SAMPLES): string[] {
  const candidates = files.filter(
    (f) =>
      SOURCE_EXT.test(f.path) &&
      !SKIPPED_FILE.test(f.path) &&
      !isSkippedPath(f.path) &&
      (f.size === undefined || (f.size >= MIN_SOURCE_BYTES && f.size <= MAX_SOURCE_BYTES))
  );
  const tests = candidates.filter((f) => isTestPath(f.path));
  const sources = candidates.filter((f) => !isTestPath(f.path));
  const testPicks = spreadAcrossFolders(tests, Math.min(MAX_TEST_SAMPLES, limit));
  return [...spreadAcrossFolders(sources, limit - testPicks.length), ...testPicks];
}

/** AI rule files already in the repository, so new rules build on them instead of starting over. */
export function findRuleFiles(paths: string[]): string[] {
  const set = new Set(paths);
  const root = ROOT_RULE_FILES.filter((p) => set.has(p));
  const nested = paths.filter((p) => NESTED_RULE_FILE.test(p)).sort();
  return [...root, ...nested].slice(0, MAX_RULE_FILES);
}

/** Pulls the short, rule-like bullets out of an existing rule file. */
export function extractRuleLines(content: string): string[] {
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/```[\s\S]*?```/g, "");
  const rules: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/);
    if (!match) continue;
    const text = match[1].replace(/^\[[ x]\]\s*/i, "");
    // Index entries ("[MEMORY.md](./MEMORY.md) — ...") point elsewhere rather than state a rule
    if (text.length < 20 || text.length > 200 || text.includes("](") || /^#/.test(text)) continue;
    if (!rules.includes(text)) rules.push(text);
  }
  return rules;
}

type NameCase = "PascalCase" | "kebab-case" | "snake_case" | "camelCase";

function nameCase(name: string): NameCase | null {
  if (/^[A-Z][A-Za-z0-9]*$/.test(name)) return "PascalCase";
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(name)) return "kebab-case";
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(name)) return "snake_case";
  if (/^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(name)) return "camelCase";
  return null;
}

const CASE_SAMPLE: Record<NameCase, (words: string[]) => string> = {
  PascalCase: (w) => w.map((x) => x[0].toUpperCase() + x.slice(1)).join(""),
  "kebab-case": (w) => w.join("-"),
  snake_case: (w) => w.join("_"),
  camelCase: (w) => w[0] + w.slice(1).map((x) => x[0].toUpperCase() + x.slice(1)).join(""),
};

/** The dominant naming style among files, when one clearly wins. */
function namingFinding(paths: string[], label: string, ext: string, contrast: NameCase): { style: NameCase; finding: EvidenceFinding } | null {
  const counts = new Map<NameCase, string[]>();
  for (const path of paths) {
    const name = baseName(path);
    if (FRAMEWORK_FILE.test(name)) continue;
    const style = nameCase(name);
    if (style) counts.set(style, [...(counts.get(style) ?? []), path]);
  }
  const total = [...counts.values()].reduce((n, list) => n + list.length, 0);
  const [style, list] = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!style || !list || total < 5 || list.length / total < 0.7) return null;
  const wrongStyle = style === contrast ? "kebab-case" : contrast;
  return {
    style,
    finding: {
      topic: "File naming",
      rule: `Name ${label} in ${style}, like \`${CASE_SAMPLE[style](["user", "card"])}${ext}\``,
      support: `${list.length} of ${total} ${label}`,
      example: list[0],
      counterExample: `${HASH_COMMENT.test(ext) ? "#" : "//"} ${CASE_SAMPLE[wrongStyle](["user", "card"])}${ext} breaks the ${style} file naming`,
    },
  };
}

function count(content: string, pattern: RegExp): number {
  return content.match(pattern)?.length ?? 0;
}

function share(part: number, total: number): string {
  return `${part} of ${total}`;
}


/** The language most of the sampled source files are written in, by extension. */
function primaryExtension(samples: SourceSample[]): string {
  const counts = new Map<string, number>();
  for (const s of samples) {
    const ext = s.path.match(/\.([a-z]+)$/)?.[1];
    if (!ext) continue;
    const family = /^(tsx?)$/.test(ext) ? "ts" : /^(jsx?|mjs|cjs)$/.test(ext) ? "js" : ext;
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ts";
}

function sourceFamily(path: string, family: string): boolean {
  if (family === "ts") return TS_EXT.test(path);
  if (family === "js") return /\.(jsx?|mjs|cjs)$/.test(path);
  return path.endsWith(`.${family}`);
}

/** Picks one real, mid-sized top-level function to quote as the preferred pattern. */
export function pickExampleExcerpt(samples: SourceSample[], family: string): string | undefined {
  const isPython = family === "py";
  const start = isPython
    ? /^(async )?def [a-z_][\w]*\(/
    : family === "go"
      ? /^func /
      : family === "rs"
        ? /^pub (async )?fn /
        : /^export (async )?function [A-Za-z_$]|^export const [A-Za-z_$][\w$]*\s*=\s*(async\s*)?\(/;
  let best: { score: number; text: string } | undefined;

  for (const sample of samples) {
    if (isTestPath(sample.path) || !sourceFamily(sample.path, family) || SECRET_LIKE.test(sample.content)) continue;
    const lines = sample.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!start.test(lines[i])) continue;
      let end = -1;
      for (let j = i + 1; j < Math.min(lines.length, i + 40); j++) {
        const line = lines[j];
        if (isPython ? line.trim() !== "" && !/^\s/.test(line) : /^[)}\]];?\s*$/.test(line)) {
          end = isPython ? j - 1 : j;
          break;
        }
      }
      if (isPython && end === -1 && lines.length - i <= 40) end = lines.length - 1;
      if (end === -1) continue;
      while (end > i && lines[end].trim() === "") end--;
      const length = end - i + 1;
      if (length < 5 || length > 30) continue;
      // Prefer about a dozen lines of plain logic: long enough to show the style, short enough to read
      const score = Math.abs(length - 12) + (COMPONENT_EXT.test(sample.path) ? 4 : 0);
      if (!best || score < best.score) {
        const comment = HASH_COMMENT.test(sample.path) ? "#" : "//";
        best = { score, text: `${comment} From ${sample.path}\n${lines.slice(i, end + 1).join("\n")}` };
      }
    }
  }
  return best?.text;
}

/** Turns a code sample into rules; every rule needs a clear majority of the sample behind it. */
export function analyzeCodeEvidence(input: {
  paths: string[];
  samples: SourceSample[];
  ruleFiles?: SourceSample[];
}): CodeEvidence {
  const { paths, samples, ruleFiles = [] } = input;
  const own = paths.filter((p) => SOURCE_EXT.test(p) && !SKIPPED_FILE.test(p) && !isSkippedPath(p));
  const sources = samples.filter((s) => !isTestPath(s.path));
  const tests = samples.filter((s) => isTestPath(s.path));
  const family = primaryExtension(sources.length > 0 ? sources : samples);
  const jsSources = sources.filter((s) => JS_EXT.test(s.path));
  const tsSources = sources.filter((s) => TS_EXT.test(s.path));
  const pySources = sources.filter((s) => s.path.endsWith(".py"));
  const findings: EvidenceFinding[] = [];
  const comment = family === "py" || family === "rb" ? "#" : "//";

  // Tests: where they live, how they are named, and the runner they use
  const testPaths = own.filter(isTestPath);
  if (testPaths.length >= 3) {
    const jsTests = testPaths.filter((p) => JS_EXT.test(p));
    // Python test folders also hold __init__.py and conftest.py; only test modules say how tests are named
    const pyTests = testPaths.filter((p) => /(^|\/)test_[^/]+\.py$|_test\.py$/.test(p));
    const runner = (() => {
      const text = tests.map((t) => t.content).join("\n");
      if (/from ["']vitest["']/.test(text)) return "Vitest";
      if (/from ["']@playwright\/test["']/.test(text)) return "Playwright";
      if (/@jest\/globals|\bjest\.(fn|mock|spyOn)\(/.test(text)) return "Jest";
      if (/^import pytest|@pytest\./m.test(text)) return "pytest";
      if (/^import unittest/m.test(text)) return "unittest";
      return "";
    })();
    const using = runner ? `, using ${runner}` : "";
    if (jsTests.length >= 3) {
      const inTestDirs = jsTests.filter((p) => /(^|\/)__tests__\//.test(p)).length;
      const inRootDir = jsTests.filter((p) => /^(tests?|e2e)\//.test(p)).length;
      const spec = jsTests.filter((p) => /\.spec\./.test(p)).length;
      const suffix = spec > jsTests.length / 2 ? "spec" : "test";
      const extCounts = new Map<string, number>();
      for (const p of jsTests) {
        const e = p.match(/\.([a-z]+)$/)![1];
        extCounts.set(e, (extCounts.get(e) ?? 0) + 1);
      }
      const ext = [...extCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const layout =
        inTestDirs / jsTests.length >= 0.6
          ? { where: "in a `__tests__/` folder next to the code they cover", matches: (p: string) => /(^|\/)__tests__\//.test(p) }
          : inRootDir / jsTests.length >= 0.6
            ? { where: `under \`${jsTests.find((p) => /^(tests?|e2e)\//.test(p))!.split("/")[0]}/\``, matches: (p: string) => /^(tests?|e2e)\//.test(p) }
            : { where: "next to the file they cover", matches: (p: string) => !/(^|\/)(__tests__|tests?|e2e)\//.test(p) };
      findings.push({
        topic: "Tests",
        rule: `Put tests ${layout.where}, named \`*.${suffix}.${ext}\`${using}`,
        support: `${jsTests.length} test files`,
        example: jsTests.find((p) => layout.matches(p) && p.includes(`.${suffix}.${ext}`)) ?? jsTests[0],
      });
    } else if (pyTests.length >= 3) {
      const inTests = pyTests.filter((p) => /^tests?\//.test(p)).length;
      findings.push({
        topic: "Tests",
        rule: `Put tests ${inTests / pyTests.length >= 0.6 ? "under `tests/`" : "next to the module they cover"}, named \`test_*.py\`${using}`,
        support: `${pyTests.length} test files`,
        example: pyTests[0],
      });
    }
  }

  // File naming: component files and plain modules are often named differently
  const components = own.filter((p) => COMPONENT_EXT.test(p) && !isTestPath(p));
  const modules = own.filter((p) => SOURCE_EXT.test(p) && !COMPONENT_EXT.test(p) && !isTestPath(p) && sourceFamily(p, family));
  const componentNaming = namingFinding(components, "component files", components[0]?.match(/\.[a-z]+$/)?.[0] ?? ".tsx", "PascalCase");
  if (componentNaming) findings.push(componentNaming.finding);
  const moduleExt = `.${family}`;
  const moduleNaming = namingFinding(modules, "modules", moduleExt, family === "py" || family === "rs" || family === "go" ? "snake_case" : "camelCase");
  if (moduleNaming && componentNaming?.style === moduleNaming.style) {
    // Same style for both: one rule covers every file
    componentNaming.finding.rule = componentNaming.finding.rule.replace("component files", "files");
    componentNaming.finding.support += ` and ${moduleNaming.finding.support}`;
  } else if (moduleNaming) {
    findings.push(moduleNaming.finding);
  }

  if (jsSources.length >= 3) {
    // Imports: a path alias for cross-folder imports instead of ../ chains
    const specifiers = jsSources.flatMap((s) => [...s.content.matchAll(/(?:from\s+|import\s+|require\()\s*["']([^"']+)["']/g)].map((m) => m[1]));
    const alias = specifiers.filter((s) => /^(@|~|#|\$lib)\//.test(s));
    const parent = specifiers.filter((s) => s.startsWith("../"));
    if (alias.length >= 5 && alias.length / (alias.length + parent.length) >= 0.7) {
      const prefix = alias[0].split("/")[0];
      findings.push({
        topic: "Imports",
        rule: `Import across folders with the \`${prefix}/\` alias, not \`../\` paths`,
        support: `${share(alias.length, alias.length + parent.length)} cross-folder imports`,
        counterExample: `import { helper } from "../../lib/helper"; ${comment} use "${prefix}/lib/helper"`,
      });
    }

    // Exports: named or default, ignoring files whose default export the framework requires
    const exporting = jsSources.filter((s) => !FRAMEWORK_FILE.test(baseName(s.path)) && /^export /m.test(s.content));
    const withDefault = exporting.filter((s) => /^export default /m.test(s.content));
    if (exporting.length >= 5) {
      const frameworkDefaults = own.some((p) => /(^|\/)app\/(.+\/)?(page|layout)\.[jt]sx?$/.test(p)) ? ", such as pages and layouts" : "";
      if (withDefault.length / exporting.length <= 0.2) {
        findings.push({
          topic: "Exports",
          rule: `Use named exports; keep \`export default\` for files the framework requires${frameworkDefaults}`,
          support: `${share(exporting.length - withDefault.length, exporting.length)} modules use only named exports`,
          counterExample: `export default function helper() {} ${comment} use a named export`,
        });
      } else if (withDefault.length / exporting.length >= 0.7) {
        findings.push({
          topic: "Exports",
          rule: "Give each module one `export default` for its main item",
          support: `${share(withDefault.length, exporting.length)} modules`,
        });
      }
    }

    // Function style: declarations or const arrows
    const text = jsSources.map((s) => s.content).join("\n");
    const declarations = count(text, /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+[A-Za-z_$]/gm);
    const arrows = count(text, /^(?:export\s+)?const\s+[A-Za-z_$][\w$]*\s*(?::[^=\n]+)?=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=>/gm);
    const fnTotal = declarations + arrows;
    if (fnTotal >= 8 && Math.max(declarations, arrows) / fnTotal >= 0.75) {
      const useDeclarations = declarations > arrows;
      findings.push({
        topic: "Functions",
        rule: useDeclarations ? "Write top-level functions as `function` declarations, not `const` arrows" : "Write top-level functions as `const` arrow functions",
        support: `${share(Math.max(declarations, arrows), fnTotal)} top-level functions`,
        counterExample: useDeclarations ? `const total = (items) => items.length; ${comment} use a function declaration` : undefined,
      });
    }

    // Formatting: quotes and semicolons on import lines, where style is most consistent
    const importLines = jsSources.flatMap((s) => s.content.split(/\r?\n/).filter((l) => /^import .+ from ["'].+["'];?\s*$/.test(l)));
    if (importLines.length >= 10) {
      const double = importLines.filter((l) => /from "/.test(l)).length;
      const semi = importLines.filter((l) => /;\s*$/.test(l)).length;
      const quote = double / importLines.length >= 0.9 ? "double quotes" : double / importLines.length <= 0.1 ? "single quotes" : "";
      const semis = semi / importLines.length >= 0.9 ? "semicolons" : semi / importLines.length <= 0.1 ? "no semicolons" : "";
      if (quote && semis) {
        const wrongQuote = quote === "double quotes" ? "'" : '"';
        findings.push({
          topic: "Formatting",
          rule: `Use ${quote} and ${semis}`,
          support: `${importLines.length} import lines`,
          counterExample: `import { helper } from ${wrongQuote}./helper${wrongQuote}${semis === "semicolons" ? "" : ";"} ${comment} ${quote}, ${semis}`,
        });
      }
    }
  }

  if (tsSources.length >= 5) {
    // Types: avoid any, and the team's choice of interface or type for object shapes
    const tsText = tsSources.map((s) => s.content).join("\n");
    const anyCount = count(tsText, /:\s*any\b|\bas any\b|<any>|\bany\[\]/g);
    if (anyCount === 0) {
      findings.push({
        topic: "Types",
        rule: "Do not use `any`; type values precisely or use `unknown` and narrow it",
        support: `none of ${tsSources.length} sampled TypeScript files use it`,
        counterExample: `const data: any = await res.json(); ${comment} type it or use unknown`,
      });
    }
    const interfaces = count(tsText, /^(?:export\s+)?interface\s+\w+/gm);
    const typeObjects = count(tsText, /^(?:export\s+)?type\s+\w+(?:<[^>]*>)?\s*=\s*\{/gm);
    if (interfaces + typeObjects >= 6 && Math.max(interfaces, typeObjects) / (interfaces + typeObjects) >= 0.75) {
      findings.push({
        topic: "Types",
        rule: interfaces > typeObjects ? "Declare object shapes with `interface`" : "Declare object shapes with `type` aliases",
        support: `${share(Math.max(interfaces, typeObjects), interfaces + typeObjects)} object types`,
        counterExample: interfaces > typeObjects ? `type User = { id: string }; ${comment} use an interface` : `interface User { id: string } ${comment} use a type alias`,
      });
    }
  }

  // Error handling: the project's own error classes, result objects, or Go error wrapping
  const allSourceText = sources.map((s) => s.content).join("\n");
  const errorClasses = new Map<string, string>();
  for (const s of sources) {
    for (const m of s.content.matchAll(/class\s+(\w+(?:Error|Exception))\s*(?:extends\s+\w+|\(\s*\w+\s*\))/g)) {
      if (!errorClasses.has(m[1])) errorClasses.set(m[1], s.path);
    }
  }
  if (errorClasses.size > 0) {
    const names = [...errorClasses.keys()].slice(0, 3);
    const raise = family === "py" ? "Raise" : "Throw";
    findings.push({
      topic: "Errors",
      rule: `${raise} the project's own error classes (${names.map((n) => `\`${n}\``).join(", ")}) instead of a bare \`${family === "py" ? "Exception" : "Error"}\``,
      support: `${errorClasses.size} error ${errorClasses.size === 1 ? "class" : "classes"} in the sampled code`,
      example: errorClasses.get(names[0]),
      counterExample: family === "py" ? `raise Exception("not found")  # raise ${names[0]}` : `throw new Error("not found"); ${comment} throw ${names[0]}`,
    });
  } else {
    const resultFiles = sources.filter((s) => /\{\s*(ok|success):\s*(true|false)\b/.test(s.content));
    if (resultFiles.length >= 2) {
      const key = resultFiles[0].content.match(/\{\s*(ok|success):\s*(true|false)\b/)![1];
      findings.push({
        topic: "Errors",
        rule: `Return \`{ ${key}: false, error }\` results from functions that can fail instead of throwing`,
        support: `${resultFiles.length} sampled files`,
        example: resultFiles[0].path,
      });
    }
  }
  if (family === "go" && count(allSourceText, /fmt\.Errorf\([^)]*%w/g) >= 3) {
    findings.push({
      topic: "Errors",
      rule: 'Wrap errors with `fmt.Errorf("doing x: %w", err)` so callers keep the chain',
      support: `${count(allSourceText, /fmt\.Errorf\([^)]*%w/g)} wrapped errors`,
    });
  }

  // Validation: the schema library used at boundaries
  const validators: [RegExp, string, string][] = [
    [/from ["']zod["']/, "zod", "Validate external input with zod schemas"],
    [/from ["']valibot["']/, "valibot", "Validate external input with valibot schemas"],
    [/from ["']yup["']/, "yup", "Validate external input with yup schemas"],
    [/from pydantic import|import pydantic/, "Pydantic", "Model request and config data with Pydantic models"],
  ];
  for (const [pattern, name, rule] of validators) {
    const files = sources.filter((s) => pattern.test(s.content));
    if (files.length >= 2) {
      findings.push({ topic: "Validation", rule, support: `${name} in ${files.length} sampled files`, example: files[0].path });
      break;
    }
  }

  // Logging: a shared logger instead of console.log or print
  const loggerFiles = jsSources.filter((s) => /import\s+\{?[^}\n]*\blog(ger)?\b[^}\n]*\}?\s+from\s+["']([^"']*log[^"']*|pino|winston|consola)["']/.test(s.content));
  if (loggerFiles.length >= 2) {
    const from = loggerFiles[0].content.match(/from\s+["']([^"']*log[^"']*|pino|winston|consola)["']/)![1];
    findings.push({
      topic: "Logging",
      rule: `Log through the shared logger from \`${from}\`, not \`console.log\``,
      support: `${loggerFiles.length} sampled files`,
      example: loggerFiles[0].path,
      counterExample: `console.log("saved", id); ${comment} use the logger`,
    });
  } else if (pySources.filter((s) => /logging\.getLogger\(/.test(s.content)).length >= 2) {
    findings.push({
      topic: "Logging",
      rule: "Log with `logging.getLogger(__name__)`, not `print`",
      support: `${pySources.filter((s) => /logging\.getLogger\(/.test(s.content)).length} sampled modules`,
      counterExample: 'print("saved", item_id)  # use the module logger',
    });
  }

  // Python: type hints on function signatures
  if (pySources.length >= 3) {
    const pyText = pySources.map((s) => s.content).join("\n");
    const defs = count(pyText, /^\s*(?:async\s+)?def\s+\w+\(/gm);
    const typed = count(pyText, /^\s*(?:async\s+)?def\s+\w+\([^)]*\)\s*->/gm);
    if (defs >= 8 && typed / defs >= 0.8) {
      findings.push({
        topic: "Types",
        rule: "Annotate every function signature with type hints, including the return type",
        support: `${share(typed, defs)} functions`,
        counterExample: "def load(path):  # add type hints",
      });
    }
  }

  // React on Next.js App Router: Server Components by default
  const nextAppRouter = own.some((p) => /(^|\/)app\/(.+\/)?(page|layout)\.[jt]sx$/.test(p));
  const reactComponents = sources.filter((s) => /\.(tsx|jsx)$/.test(s.path));
  if (nextAppRouter && reactComponents.length >= 5) {
    const client = reactComponents.filter((s) => /^\s*["']use client["']/.test(s.content)).length;
    if (client / reactComponents.length <= 0.6) {
      findings.push({
        topic: "Components",
        rule: 'Keep components as Server Components; add "use client" only where state, effects or browser APIs need it',
        support: `${share(client, reactComponents.length)} sampled components are client components`,
      });
    }
  }

  const existingRules: ExistingRuleFile[] = ruleFiles
    .map((file) => ({ path: file.path, rules: extractRuleLines(file.content) }))
    .filter((file) => file.rules.length > 0 || file.path === "CLAUDE.md" || file.path === "AGENTS.md");

  const kept = findings
    .map((finding, index) => ({ finding, index }))
    .sort((a, b) => TOPIC_ORDER.indexOf(a.finding.topic) - TOPIC_ORDER.indexOf(b.finding.topic) || a.index - b.index)
    .slice(0, MAX_FINDINGS)
    .map((entry) => entry.finding);
  const counterLines = kept.map((f) => f.counterExample).filter((line): line is string => Boolean(line));
  const header = `${comment} Breaks this repository's conventions`;

  return {
    filesRead: samples.length,
    findings: kept,
    existingRules,
    exampleGood: pickExampleExcerpt(sources, family),
    exampleBad: counterLines.length > 0 ? [header, ...counterLines].join("\n") : undefined,
  };
}

/** Directive lines for the generated file: one per finding, then a few rules carried over from existing rule files. */
export function evidenceDirectives(evidence: CodeEvidence): string[] {
  const lines = evidence.findings.map(
    (f) => `- ${f.topic}: ${f.rule} (${f.support}${f.example ? `, e.g. \`${f.example}\`` : ""}).`
  );
  const files = evidence.existingRules.map((file) => `\`${file.path}\``);
  if (files.length === 0) return lines;
  const carried = evidence.existingRules.flatMap((file) => file.rules).slice(0, MAX_EXISTING_RULES);
  const keep = `- Existing rules: keep following ${files.join(" and ")}${carried.length > 0 ? "; key points carried over:" : "."}`;
  return [...lines, keep, ...carried.map((rule) => `  - ${rule}`)];
}

/** Runs async reads a few at a time, keeping results in input order; failed reads become null. */
export async function mapWithLimit<T, R>(items: T[], limit: number, read: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await read(items[index]);
      } catch {
        results[index] = null;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
