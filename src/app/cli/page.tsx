import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Layers, Lock, Package, Plus, TerminalSquare } from "lucide-react";
import { GitHubIcon } from "@/components/icons/AssistantBrandIcons";
import { CliClient } from "./CliClient";

export const metadata: Metadata = {
  title: "Offline AI Rulebook CLI",
  description:
    "Zero-dependency, 100% offline terminal CLI (npx devscratchpad) to scaffold, audit, and install AI agent guidelines for Cursor (.mdc), Claude Code, Windsurf, Copilot, and Gemini.",
  keywords: [
    "npx devscratchpad",
    "devscratchpad cli",
    "cursor rules cli",
    "claude skills cli",
    "ai rules terminal",
    "audit cursorrules",
    "windsurf cascade rules cli",
    "copilot instructions cli",
    "offline ai developer tools",
    "DevScratchpad",
  ],
  alternates: {
    canonical: "https://www.devscratchpad.tech/cli",
  },
  icons: {
    icon: [
      { url: "/cli-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/cli-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/cli-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/cli-icon-192.png",
  },
  openGraph: {
    title: "Offline AI Rulebook CLI | DevScratchpad",
    description:
      "Zero-dependency, offline-first terminal CLI (`npx devscratchpad`) to scaffold, audit, and install AI agent rules across 13 formats and 5-layer suite with 100% client-side privacy.",
    url: "https://www.devscratchpad.tech/cli",
    siteName: "DevScratchpad",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad CLI (npx devscratchpad) — Offline AI Rulebook Manager (13 Formats, 5-Layer Suite)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offline AI Rulebook CLI | DevScratchpad",
    description:
      "Install and audit Cursor (.mdc), Claude SKILL.md, Windsurf, Copilot, and Gemini rules directly from your terminal (`npx devscratchpad`). 13 formats, 5-layer suite, 100% offline.",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad CLI (npx devscratchpad) — Offline AI Rulebook Manager (13 Formats, 5-Layer Suite)",
      },
    ],
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.devscratchpad.tech/cli#app",
      "name": "DevScratchpad CLI",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All (Windows, macOS, Linux)",
      "url": "https://www.devscratchpad.tech/cli",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "description":
        "Zero-dependency, 100% offline-first terminal CLI for managing, auditing, and installing AI rulebooks across Cursor, Claude Code, Windsurf, Copilot, and Gemini.",
      "softwareVersion": "2.2.0",
      "downloadUrl": "https://www.npmjs.com/package/devscratchpad",
    },
    {
      "@type": "HowTo",
      "@id": "https://www.devscratchpad.tech/cli#howto",
      "name": "How to Install and Audit AI Rules via DevScratchpad CLI",
      "description": "Step-by-step guide to installing and auditing project AI rulebooks via npx devscratchpad.",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Browse Available Presets",
          "text": "Run 'npx devscratchpad list' in your terminal to see all 13 formats and the technology presets.",
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Install Rules into Repository",
          "text": "Run 'npx devscratchpad add cursor-rules/nextjs-15' to automatically place rules in .cursor/rules/nextjs-15.mdc.",
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Audit Existing Rules for Hallucinations",
          "text": "Run 'npx devscratchpad audit' to scan repository rulebooks for missing negative constraints and monolithic prompt degradation.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.devscratchpad.tech/cli#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Do I need to install devscratchpad globally before running it?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No installation is required. You can execute commands directly using 'npx devscratchpad <command>'. If you prefer global installation, run 'npm install -g devscratchpad'.",
          },
        },
        {
          "@type": "Question",
          "name": "Does the CLI upload code or prompts to external servers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. The CLI has zero telemetry. Its only network request fetches a public preset, and it falls back to bundled templates when offline.",
          },
        },
        {
          "@type": "Question",
          "name": "What AI IDEs and assistants does devscratchpad support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "13 formats: Cursor .mdc, Claude Code SKILL.md and CLAUDE.md, AGENTS.md, Windsurf, GitHub Copilot, MCP config, OpenAI, Gemini, .cursorignore, .claudeignore, llms.txt and ARCHITECTURE.md.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I customize the generated rules interactively?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Every CLI command outputs a direct reciprocal link to the AI Skill Studio (https://www.devscratchpad.tech/ai-skill-studio) where you can visually adjust directives and test quality scores.",
          },
        },
        {
          "@type": "Question",
          "name": "Where can I find a step-by-step tutorial on using the CLI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Read our comprehensive engineering guide: 'How to Author, Audit, and Sync AI Agent Rulebooks & Claude Skills with DevScratchpad CLI' at https://www.devscratchpad.tech/blog/how-to-manage-ai-rules-with-cli-guide.",
          },
        },
      ],
    },
  ],
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need to install devscratchpad globally?",
    a: (
      <>
        No. It is published as an npm executable, so <code>npx devscratchpad &lt;command&gt;</code> runs it without a global
        install. Prefer a global binary? Run <code>npm install -g devscratchpad</code>.
      </>
    ),
  },
  {
    q: "Will it overwrite files I already have?",
    a: (
      <>
        No. Existing files are skipped. Pass <code>--force</code> to replace one (the previous version is kept as{" "}
        <code>&lt;file&gt;.bak</code>), or <code>--dry-run</code> to see what would be written first.
      </>
    ),
  },
  {
    q: "Can I run the audit in CI?",
    a: (
      <>
        Yes. <code>npx devscratchpad audit --min-score 80</code> exits with code 1 when any rule file scores below 80, and{" "}
        <code>--json</code> prints a machine-readable report.
      </>
    ),
  },
  {
    q: "Does the CLI upload my code or prompts?",
    a: "No. It has zero telemetry. The only network request is fetching a public preset, and it falls back to bundled templates when you are offline.",
  },
  {
    q: "Which assistants and formats are supported?",
    a: "13 formats: Cursor .mdc, Claude Code SKILL.md and CLAUDE.md, AGENTS.md, Windsurf, GitHub Copilot, MCP config, OpenAI, Gemini, .cursorignore, .claudeignore, llms.txt and ARCHITECTURE.md.",
  },
  {
    q: "How does audit score my rules?",
    a: "It runs static checks on every rule file it finds: negative guardrails, rule length and density, trigger and glob specificity, and vague directives such as “write clean code”. Each file gets a 0–100 score with fixes.",
  },
  {
    q: "How do I migrate a legacy .cursorrules file?",
    a: (
      <>
        Paste it into the{" "}
        <Link href="/ai-skill-studio/rules-converter" className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
          rules converter
        </Link>{" "}
        to split it into Cursor .mdc, Claude SKILL.md or Windsurf rules.
      </>
    ),
  },
];

const COMMANDS: { cmd: string; does: string; example: string; output: string }[] = [
  { cmd: "add <format>/<preset>", does: "Install a rulebook", example: "npx devscratchpad add cursor-rules/nextjs-15", output: ".cursor/rules/nextjs-15.mdc" },
  { cmd: "add <preset> -f <format>", does: "Same, flag syntax", example: "npx devscratchpad add fastapi -f claude-skills", output: ".claude/skills/fastapi/SKILL.md" },
  { cmd: "add … --dry-run", does: "Preview, change nothing", example: "npx devscratchpad add claude-skills/fastapi --dry-run", output: "Nothing (prints the plan)" },
  { cmd: "add … --force", does: "Replace an existing file", example: "npx devscratchpad add cursor-rules/nextjs-15 --force", output: "New file + <file>.bak" },
  { cmd: "audit [dir]", does: "Score existing rule files", example: "npx devscratchpad audit", output: "Read-only report" },
  { cmd: "audit --min-score <n>", does: "Fail CI below a score", example: "npx devscratchpad audit --min-score 80 --json", output: "Exit code 1 if any file < n" },
  { cmd: "list", does: "Show formats and presets", example: "npx devscratchpad list", output: "Printed to terminal" },
  { cmd: "init", does: "Scaffold the 5-layer suite", example: "npx devscratchpad init", output: "7 files (rules, CLAUDE.md, AGENTS.md…)" },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Stays on your machine",
    body: "Audits run in your local Node.js process with zero telemetry. Writes are confined to the current workspace and slugs are validated against path traversal.",
  },
  {
    icon: Package,
    title: "Zero dependencies",
    body: "Built only on Node.js standard modules (node:fs, node:path, node:https). Nothing to install; npx fetches a single small package.",
  },
  {
    icon: Layers,
    title: "One syntax, every assistant",
    body: "The same add command writes Cursor, Claude Code, Windsurf, Copilot, OpenAI and Gemini rules to the paths each tool reads.",
  },
];

const STEPS = [
  { title: "Pick assistant and stack", body: "Choose a format and a preset in the builder above, or run list." },
  { title: "Run one command", body: "Use npx, pnpm dlx or bunx. No global install." },
  { title: "Rules land in place", body: "Files go to the standard paths, such as .cursor/rules/, ready for your assistant." },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

export default function CliPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      {/* Top bar */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-4 text-[13px] sm:px-6">
          <Link href="/ai-skill-studio" className={`inline-flex items-center gap-1.5 rounded text-zinc-500 transition-colors hover:text-zinc-900 ${focusRing}`}>
            <ArrowLeft className="size-3.5" />
            AI Skill Studio
          </Link>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/Saad-web-spec/DevScratchPad"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${focusRing}`}
            >
              <GitHubIcon className="size-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a
              href="https://www.npmjs.com/package/devscratchpad"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${focusRing}`}
            >
              npm <span className="text-zinc-400">v2.2.0</span>
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-20 px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        {/* Hero */}
        <header className="max-w-2xl space-y-5">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
            <TerminalSquare className="size-4 text-zinc-900" />
            devscratchpad CLI
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            AI agent rulebooks, installed from your terminal.
          </h1>
          <p className="text-base leading-relaxed text-zinc-600">
            Scaffold, audit and install rules for Cursor, Claude Code, Windsurf, Copilot, OpenAI and Gemini with one command.
            No install, no dependencies, nothing leaves your machine.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="#builder-heading"
              className={`inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 ${focusRing}`}
            >
              Get the command
              <ArrowDown className="size-4" />
            </a>
            <Link
              href="/blog/how-to-manage-ai-rules-with-cli-guide"
              className={`inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 ${focusRing}`}
            >
              <BookOpen className="size-4" />
              Read the guide
            </Link>
          </div>
        </header>

        <CliClient />

        {/* Features */}
        <section aria-labelledby="why-heading" className="space-y-6">
          <h2 id="why-heading" className="text-xl font-semibold tracking-tight">
            Why a CLI
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-2 border-t border-zinc-200 pt-4">
                <Icon className="size-4 text-zinc-900" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section aria-labelledby="how-heading" className="space-y-6">
          <h2 id="how-heading" className="text-xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="space-y-2 border-t border-zinc-200 pt-4">
                <span className="font-mono text-xs text-zinc-400">0{i + 1}</span>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Command reference */}
        <section aria-labelledby="ref-heading" className="space-y-6">
          <h2 id="ref-heading" className="text-xl font-semibold tracking-tight">
            Command reference
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Command</th>
                  <th className="px-4 py-2.5 font-semibold">What it does</th>
                  <th className="px-4 py-2.5 font-semibold">Example</th>
                  <th className="px-4 py-2.5 font-semibold">Writes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {COMMANDS.map((row) => (
                  <tr key={row.cmd} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-medium text-zinc-900">{row.cmd}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.does}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      <span className="mr-1.5 select-none text-zinc-400">$</span>
                      {row.example}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="space-y-6">
          <h2 id="faq-heading" className="text-xl font-semibold tracking-tight">
            Questions
          </h2>
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded py-3 text-sm font-medium text-zinc-900 [&::-webkit-details-marker]:hidden ${focusRing}`}>
                  {item.q}
                  <Plus className="size-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-45" />
                </summary>
                <p className="pb-4 pr-8 text-sm leading-relaxed text-zinc-500 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-zinc-800">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Prefer a visual editor?</h2>
            <p className="text-sm text-zinc-500">Build and score the same rules in AI Skill Studio, then download them.</p>
          </div>
          <Link
            href="/ai-skill-studio"
            className={`inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:self-auto ${focusRing}`}
          >
            Open AI Skill Studio
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
