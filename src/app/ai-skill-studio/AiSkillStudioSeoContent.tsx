import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllFormatHubs, getFormatHub, type FormatHubMeta } from "../claude-skills/lib/formatHubs";
import { getPresetBySlug, type OutputFormat, type ProgrammaticPresetRoute } from "../claude-skills/lib/presetRegistry";
import { generateContentFromRoute } from "../claude-skills/lib/ruleGenerator";
import { CopyTextButton } from "./components/CopyTextButton";
import { StudioSupportSection } from "./components/StudioSupportSection";
import { STUDIO_FAQS, type StudioFaq } from "./components/studioFaqs";

/* ---------------------------------------------------------------------------
 * "Which file do I need?" table data.
 * Rows come from getAllFormatHubs(); this map only adds what the hub data
 * lacks (tool, load timing, grouping). Keyed by OutputFormat so TypeScript
 * flags any new format that is missing a row.
 * ------------------------------------------------------------------------- */

type GroupId = "rules" | "ignore" | "docs" | "planning";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "rules", label: "Agent rules and tool config" },
  { id: "ignore", label: "Ignore files" },
  { id: "docs", label: "Reference docs" },
  { id: "planning", label: "Planning docs" },
];

interface FormatRowInfo {
  tool: string;
  group: GroupId;
  /** When the tool reads the file. Backticks mark inline code. */
  loads: string;
  /** Overrides the placement derived from the hub's targetDir. Backticks mark inline code. */
  where?: string;
  /** Overrides the hub's targetFile as the displayed file name. */
  file?: string;
}

const FORMAT_ROWS: Record<OutputFormat, FormatRowInfo> = {
  cursor_mdc: {
    tool: "Cursor",
    group: "rules",
    loads:
      "Per rule: always, when `globs` match the files in play, when the agent finds the `description` relevant, or on @-mention.",
  },
  skill_md: {
    tool: "Claude Code",
    group: "rules",
    where: "`.claude/skills/<skill-name>/`, or `~/.claude/skills/` for all projects",
    loads: "Name and description at startup. The full file only when a task matches or you run `/skill-name`.",
  },
  claude_md: {
    tool: "Claude Code",
    group: "rules",
    where: "Repo root, or `~/.claude/CLAUDE.md` for all projects",
    loads: "Every session, in full. A `CLAUDE.md` in a subfolder loads when Claude works there.",
  },
  agents_md: {
    tool: "Codex, Cursor, Copilot coding agent and others",
    group: "rules",
    where: "Repo root. Nested files cover their subfolder.",
    loads: "At the start of each task. For Claude Code, add `@AGENTS.md` to `CLAUDE.md`.",
  },
  windsurf_cascade: {
    tool: "Windsurf",
    group: "rules",
    loads: "Per rule `trigger`: always on, glob match, model decision, or manual @-mention.",
  },
  copilot_instructions: {
    tool: "GitHub Copilot",
    group: "rules",
    loads: "With every Copilot Chat, code review and coding agent request in the repo. Not used for inline completions.",
  },
  openai_instructions: {
    tool: "ChatGPT / OpenAI API",
    group: "rules",
    where: "`prompts/`, as a copy you version",
    loads: "Only when pasted into ChatGPT custom instructions or sent as the system message.",
  },
  gemini_prompts: {
    tool: "Gemini API / AI Studio",
    group: "rules",
    where: "`prompts/`, as a copy you version",
    loads: "Only when passed as `systemInstruction` or pasted into AI Studio.",
  },
  mcp_json: {
    tool: "Claude Code, Claude Desktop, Cursor",
    group: "rules",
    file: ".mcp.json",
    where:
      "Repo root for Claude Code. Claude Desktop uses `claude_desktop_config.json`; Cursor uses `.cursor/mcp.json`.",
    loads: "At startup, so restart after editing. Claude Code asks before using servers from `.mcp.json`.",
  },
  cursorignore: {
    tool: "Cursor",
    group: "ignore",
    loads: "Always. Indexing and AI features skip matching files (best effort: terminal commands can still read them).",
  },
  claudeignore: {
    tool: "Claude Code",
    group: "ignore",
    loads:
      "Keep it as your pattern list, and mirror secret paths in `permissions.deny` in `.claude/settings.json`, the setting Claude Code documents for blocking reads.",
  },
  llms_txt: {
    tool: "Any LLM or crawler",
    group: "docs",
    where: "Repo root, or your site root as `/llms.txt`",
    loads: "Only when a tool or person fetches it. Nothing loads it automatically.",
  },
  architecture_md: {
    tool: "Any agent",
    group: "docs",
    loads: "When your rules file points to it, or when the agent explores the repo.",
  },
  prd_md: {
    tool: "Any agent",
    group: "planning",
    loads: "When your rules file tells the agent to read it.",
  },
  design_md: {
    tool: "Any agent",
    group: "planning",
    loads: "When your rules file tells the agent to read it, usually before UI work.",
  },
  task_md: {
    tool: "Any agent",
    group: "planning",
    loads: "At the start and end of a task, if your rules say to read and update it.",
  },
  memory_md: {
    tool: "Any agent",
    group: "planning",
    loads: "At session start, if your rules say so. Agents add lessons as they go.",
  },
};

/** Never drops a hub: formats without an entry still get a row (and their link). */
function rowInfoFor(hub: FormatHubMeta): FormatRowInfo {
  return FORMAT_ROWS[hub.format] ?? { tool: hub.badge, group: "rules", loads: "See the format page." };
}

function placementFor(hub: FormatHubMeta, info: FormatRowInfo): string {
  if (info.where) return info.where;
  if (hub.targetDir.startsWith("./")) return "Repo root";
  return `\`${hub.targetDir}\``;
}

/* ---------------------------------------------------------------------------
 * Good vs vague rule examples.
 * ------------------------------------------------------------------------- */

const RULE_EXAMPLES: { title: string; file: string; vague: string; specific: string; why: string }[] = [
  {
    title: "Give commands, not wishes",
    file: "CLAUDE.md or AGENTS.md",
    vague: `## Guidelines
- Write clean code.
- Follow best practices.
- Make sure tests pass.`,
    specific: `## Commands
- Test one file: pnpm vitest run src/lib/date.test.ts
- Typecheck: pnpm tsc --noEmit
- Never run pnpm db:reset. It wipes the shared dev database.`,
    why: "The agent can run each line as written, and the \"never\" rule names the exact command and the reason.",
  },
  {
    title: "Scope rules to the files they cover",
    file: ".cursor/rules/components.mdc",
    vague: `---
alwaysApply: true
---
Use React best practices.`,
    specific: `---
globs: src/components/**/*.tsx
alwaysApply: false
---
- Reuse Button and Input from @/components/ui; never add a UI library.
- One component per file, named export, props typed with an interface.`,
    why: "It loads only when a component file is in play, and every line is something the model can check.",
  },
  {
    title: "Tell a skill when to run",
    file: "SKILL.md",
    vague: `---
name: helper
description: Helps with code.
---`,
    specific: `---
name: db-migration
description: Writes and reviews Prisma migrations. Use when schema.prisma changes or the user asks for a migration.
---`,
    why: "Claude picks a skill by its description, so say what it does and when to use it.",
  },
];

/* ---------------------------------------------------------------------------
 * Copy-ready starters: popular presets, generated with the same function the
 * raw preset endpoint and CLI use, so the copied file matches the spoke page.
 * ------------------------------------------------------------------------- */

const STARTER_PRESETS: readonly (readonly [formatSlug: string, presetSlug: string])[] = [
  ["claude-md", "nextjs-15"],
  ["cursor-rules", "nextjs-15"],
  ["claude-skills", "codebase-auditor"],
  ["agents-md", "fullstack-agent-team"],
  ["cursor-rules", "fastapi"],
  ["copilot-instructions", "react-19"],
  ["cursor-rules", "tailwind-v4"],
  ["mcp-config", "github"],
];

interface Starter {
  route: ProgrammaticPresetRoute;
  href: string;
  formatLabel: string;
  path: string;
  content: string;
}

function buildStarters(): Starter[] {
  return STARTER_PRESETS.flatMap(([formatSlug, presetSlug]) => {
    const route = getPresetBySlug(formatSlug, presetSlug);
    if (!route) return [];
    return [
      {
        route,
        href: `/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`,
        formatLabel: getFormatHub(route.formatSlug)?.badge ?? route.formatSlug,
        path: route.format === "mcp_json" ? ".mcp.json or claude_desktop_config.json" : route.targetFile,
        content: generateContentFromRoute(route),
      },
    ];
  });
}

/* ---------------------------------------------------------------------------
 * Shared bits.
 * ------------------------------------------------------------------------- */

/** Renders `backtick` segments as <code>, leaving the text content unchanged apart from the markers. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-800">
            {part}
          </code>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

const h2Class = "text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl";
const introClass = "max-w-3xl text-[15px] leading-7 text-zinc-600";

interface AiSkillStudioSeoContentProps {
  /** Hub slug of the format page being viewed; highlights its row in the file table. */
  activeFormatSlug?: string;
  /** Format-specific questions shown before the general FAQ. Must match any FAQPage JSON-LD the page emits. */
  formatFaqs?: StudioFaq[];
}

export function AiSkillStudioSeoContent({ activeFormatSlug, formatFaqs = [] }: AiSkillStudioSeoContentProps = {}) {
  const hubs = getAllFormatHubs();
  const groupedHubs = GROUPS.map((group) => ({
    ...group,
    hubs: hubs.filter((hub) => rowInfoFor(hub).group === group.id),
  })).filter((group) => group.hubs.length > 0);
  const starters = buildStarters();

  return (
    <article
      aria-label="AI instruction file reference"
      className="mt-8 w-full border-t border-zinc-200 bg-white px-4 py-16 text-zinc-700 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-20">
        {/* 1. Which file do I need? */}
        <section id="which-file" aria-labelledby="which-file-heading" className="scroll-mt-24 space-y-6">
          <div className="space-y-2">
            <h2 id="which-file-heading" className={h2Class}>
              Which file do I need?
            </h2>
            <p className={introClass}>
              Each AI coding tool reads its own file from its own place. Find your tool, put the file where the table
              says, and check when it actually gets loaded. Every file name opens a generator for that format.
            </p>
          </div>

          <table className="block w-full border-collapse text-left text-sm leading-6 md:table">
            <caption className="sr-only">AI instruction files by tool, with location and load timing</caption>
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-zinc-300 text-xs uppercase tracking-wide text-zinc-500">
                <th scope="col" className="py-2 pl-3 pr-6 font-medium md:w-[18%]">
                  AI tool
                </th>
                <th scope="col" className="py-2 pr-6 font-medium md:w-[20%]">
                  File
                </th>
                <th scope="col" className="py-2 pr-6 font-medium md:w-[27%]">
                  Where it goes
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  When it&apos;s loaded
                </th>
              </tr>
            </thead>
            {groupedHubs.map((group) => (
              <tbody key={group.id} className="block md:table-row-group">
                <tr className="block md:table-row">
                  <th
                    scope="rowgroup"
                    colSpan={4}
                    className="block px-3 pb-2 pt-8 text-left text-[13px] font-semibold text-zinc-900 md:table-cell"
                  >
                    {group.label}
                  </th>
                </tr>
                {group.hubs.map((hub) => {
                  const info = rowInfoFor(hub);
                  const isActive = hub.slug === activeFormatSlug;
                  return (
                    <tr
                      key={hub.slug}
                      className={cn(
                        "block border-t border-zinc-200 px-3 py-4 md:table-row md:px-0 md:py-0",
                        isActive && "bg-orange-50/70"
                      )}
                    >
                      <td className="block text-[13px] text-zinc-500 md:table-cell md:py-3 md:pl-3 md:pr-6 md:align-top md:text-sm md:text-zinc-700">
                        {info.tool}
                      </td>
                      <td className="block md:table-cell md:py-3 md:pr-6 md:align-top">
                        <Link
                          href={`/ai-skill-studio/${hub.slug}`}
                          aria-current={isActive ? "page" : undefined}
                          className="break-all font-mono text-[13px] font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-orange-700 hover:decoration-orange-600"
                        >
                          {info.file ?? hub.targetFile}
                        </Link>
                      </td>
                      <td className="mt-1 block text-zinc-700 md:mt-0 md:table-cell md:py-3 md:pr-6 md:align-top">
                        <span className="text-zinc-500 md:hidden">Goes in: </span>
                        <InlineCode text={placementFor(hub, info)} />
                      </td>
                      <td className="mt-1 block text-zinc-600 md:mt-0 md:table-cell md:py-3 md:pr-3 md:align-top">
                        <span className="text-zinc-500 md:hidden">Loaded: </span>
                        <InlineCode text={info.loads} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </section>

        {/* 2. Good vs vague examples */}
        <section id="rule-examples" aria-labelledby="rule-examples-heading" className="scroll-mt-24 space-y-10">
          <div className="space-y-2">
            <h2 id="rule-examples-heading" className={h2Class}>
              What a good rule looks like
            </h2>
            <p className={introClass}>
              Agents follow rules they can check. Swap advice for commands, paths and explicit &ldquo;never&rdquo;
              lines.
            </p>
          </div>

          {RULE_EXAMPLES.map((example) => (
            <div key={example.title} className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold text-zinc-900">{example.title}</h3>
                <span className="font-mono text-xs text-zinc-500">{example.file}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <figure className="space-y-2">
                  <figcaption className="text-xs font-medium uppercase tracking-wide text-zinc-500">Vague</figcaption>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-r-md border-l-2 border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-6 text-zinc-500">
                    {example.vague}
                  </pre>
                </figure>
                <figure className="space-y-2">
                  <figcaption className="text-xs font-medium uppercase tracking-wide text-orange-600">Specific</figcaption>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-r-md border-l-2 border-orange-600 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-6 text-zinc-800">
                    {example.specific}
                  </pre>
                </figure>
              </div>
              <p className="max-w-3xl text-[15px] leading-7 text-zinc-600">
                <span className="font-medium text-zinc-900">Why it works:</span> {example.why}
              </p>
            </div>
          ))}
        </section>

        {/* 3. Copy-ready starters */}
        <section id="starters" aria-labelledby="starters-heading" className="scroll-mt-24 space-y-6">
          <div className="space-y-2">
            <h2 id="starters-heading" className={h2Class}>
              Copy-ready starters
            </h2>
            <p className={introClass}>
              Complete files from the preset library. Copy one as it is, or open it to change the stack, commands and
              rules before you download it.
            </p>
          </div>

          <ul className="grid md:grid-cols-2 md:gap-x-12">
            {starters.map((starter) => (
              <li key={starter.href} className="flex items-start justify-between gap-4 border-t border-zinc-200 py-4">
                <div className="min-w-0 space-y-1">
                  <Link
                    href={starter.href}
                    className="group inline-flex flex-wrap items-baseline gap-x-2 text-[15px] font-medium text-zinc-900 transition-colors hover:text-orange-700"
                  >
                    <span>{starter.route.techName}</span>
                    <span className="text-[13px] font-normal text-zinc-500 group-hover:text-orange-700">
                      {starter.formatLabel}
                    </span>
                  </Link>
                  <p className="break-all font-mono text-xs text-zinc-500">{starter.path}</p>
                  {starter.route.keyRules[0] ? (
                    <p className="text-sm leading-6 text-zinc-600">
                      <InlineCode text={starter.route.keyRules[0]} />
                    </p>
                  ) : null}
                </div>
                <CopyTextButton
                  text={starter.content}
                  ariaLabel={`Copy ${starter.route.techName} ${starter.formatLabel} file`}
                />
              </li>
            ))}
          </ul>

          <p>
            <Link
              href="/skill"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-orange-600 transition-colors hover:text-orange-700"
            >
              Browse the full preset library
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </section>

        {/* 4. FAQ (text shared with the FAQPage JSON-LD in page.tsx; format hubs prepend their own questions) */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 space-y-6">
          <h2 id="faq-heading" className={h2Class}>
            Frequently asked questions
          </h2>
          <div className="border-b border-zinc-200">
            {[...formatFaqs, ...STUDIO_FAQS].map((faq) => (
              <details key={faq.question} className="group border-t border-zinc-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[15px] font-medium text-zinc-900 group-hover:text-orange-700">
                    <InlineCode text={faq.question} />
                  </h3>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-3xl pb-5 text-[15px] leading-7 text-zinc-600">
                  <InlineCode text={faq.answer} />
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* 5. Privacy, support and further reading */}
        <footer className="space-y-4 border-t border-zinc-200 pt-8">
          <StudioSupportSection />
          <p className="text-[15px] leading-7 text-zinc-600">
            Want the longer version? Read{" "}
            <Link
              href="/blog/claude-code-skills-cursor-rules-guide"
              className="font-medium text-orange-600 underline decoration-orange-600/30 underline-offset-4 transition-colors hover:text-orange-700 hover:decoration-orange-700"
            >
              the guide to Claude Code skills, Cursor rules, CLAUDE.md and MCP
            </Link>
            .
          </p>
        </footer>
      </div>
    </article>
  );
}
