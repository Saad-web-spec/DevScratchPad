import type { Metadata } from "next";
import Link from "next/link";
import {
  Terminal,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  HelpCircle,
  Code,
  FileText,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from "lucide-react";
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
      "softwareVersion": "2.1.0",
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
          "text": "Run 'npx devscratchpad list' in your terminal to see all 9 assistant formats and 23+ technology presets.",
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
            "text": "Never. DevScratchpad CLI operates with 100% client-side execution and zero telemetry. It only fetches static public presets from the CDN with automatic offline fallback when air-gapped.",
          },
        },
        {
          "@type": "Question",
          "name": "What AI IDEs and assistants does devscratchpad support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It supports Cursor (.mdc rules), Claude Code (SKILL.md & CLAUDE.md), Windsurf Cascade, GitHub Copilot instructions, OpenAI custom instructions, Google Gemini prompt specs, and Model Context Protocol (claude.json).",
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

export default function CliPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white">
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
        {/* Header Breadcrumb & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/ai-skill-studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded px-1"
            >
              <span>← Back to AI Skill Studio</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <Link
              href="/blog/how-to-manage-ai-rules-with-cli-guide"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded px-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-500" />
              <span>CLI Guide & Architecture</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <a
              href="https://github.com/Saad-web-spec/DevScratchPad"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span>·</span>
            <a
              href="https://www.npmjs.com/package/devscratchpad"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded px-1"
            >
              <span>npm: devscratchpad</span>
              <span className="text-zinc-400">v2.1.0</span>
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80 shadow-xs">
            <Terminal className="w-3.5 h-3.5 text-orange-600" />
            <span>Headless Terminal AI Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            The Zero-Install CLI for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 dark:from-orange-500 dark:via-amber-500 dark:to-orange-400 bg-clip-text text-transparent">
              AI Agent & IDE Rulebooks
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Scaffold, audit, and install production-hardened AI guidelines directly inside your project workspace.
            Built with 100% offline privacy, zero runtime dependencies, and instant multi-assistant compatibility.
          </p>

          <div className="pt-1">
            <Link
              href="/blog/how-to-manage-ai-rules-with-cli-guide"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-xs group"
            >
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Step-by-Step Tutorial: How to Author & Audit AI Rules with CLI</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Interactive CLI Client Component */}
        <CliClient />

        {/* Feature Highlights Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Engineered for Enterprise Privacy & Speed
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Why leading developers use the DevScratchpad headless terminal workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Zero Server Data Leakage</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Audits repository rules in local memory. Slugs are strictly validated against directory traversal and
                file writes are strictly confined within current workspace boundaries.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/80 flex items-center justify-center">
                <img src="/orange-star.png" className="w-5 h-5 object-contain" alt="DevScratchpad Star" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Zero External Dependencies</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Zero npm dependency bloat. Operates purely on native Node.js standard libraries (<code>node:fs</code>,{" "}
                <code>node:path</code>, <code>node:https</code>). Installs in under 1.5 seconds via <code>npx</code>.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Universal Assistant Sync</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Export and scaffold for Cursor (.mdc), Claude Code (SKILL.md), Windsurf Cascade, GitHub Copilot,
                OpenAI, and Gemini from a single command syntax.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Step "How It Works" Flow */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              How It Works in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              From zero installation to production-grade AI agent steering in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Pick Assistant & Stack</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Choose your AI IDE format (Cursor .mdc, Claude SKILL.md, Windsurf, Copilot, OpenAI, Gemini) and framework preset.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Run Terminal One-Liner</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Execute directly via <code>npx</code>, <code>pnpm dlx</code>, or <code>bunx</code>. No npm install or global binaries needed.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Instant Local Activation</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Rules are automatically placed in standard paths (e.g. <code>.cursor/rules/</code>) ready to steer your assistant.
              </p>
            </div>
          </div>
        </div>

        {/* Tangible Zero-Telemetry Security Verification Callout */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl text-zinc-300 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Verifiable Enterprise Privacy & Zero Telemetry</span>
            </div>
            <h3 className="text-base font-bold text-white">Under the Hood: 100% Local & Auditable</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every execution runs strictly inside your local Node.js process without analytics, telemetry, or remote prompt logging. Inspect the open-source runner or execute with dry-run mode to verify zero network requests outside of static preset delivery.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <code className="text-xs font-mono bg-black/60 border border-zinc-800 px-3 py-2 rounded-lg text-sky-400">
              $ npx devscratchpad --dry-run
            </code>
          </div>
        </div>

        {/* Command Reference Cheat-Sheet Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-orange-600" />
                <span>CLI Command Reference</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Comprehensive syntax and options for terminal execution
              </p>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="py-3 px-4">Command</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Example Invocation</th>
                  <th className="py-3 px-4">Target Filesystem Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-500 dark:text-amber-400">
                    add &lt;format&gt;/&lt;preset&gt;
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    Installs rulebook into standard folder
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 select-none mr-1.5">$</span>npx devscratchpad add cursor-rules/nextjs-15
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-sky-600 dark:text-sky-400 font-medium">
                    .cursor/rules/nextjs-15.mdc
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-500 dark:text-amber-400">
                    add &lt;preset&gt; --format &lt;fmt&gt;
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    Installs rulebook via flag syntax
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 select-none mr-1.5">$</span>npx devscratchpad add fastapi -f claude-skills
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-sky-600 dark:text-sky-400 font-medium">
                    .claude/skills/fastapi/SKILL.md
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-500 dark:text-amber-400">
                    audit [dir]
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    Scans and scores existing repo rule health (0-100)
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 select-none mr-1.5">$</span>npx devscratchpad audit
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    Read-only static heuristic scan
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-500 dark:text-amber-400">
                    list
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    Lists all 9 formats & 23+ technology presets
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 select-none mr-1.5">$</span>npx devscratchpad list
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    Terminal stdout catalog
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-amber-500 dark:text-amber-400">
                    init
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    Scaffolds universal multi-agent starter rules
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <span className="text-slate-400 select-none mr-1.5">$</span>npx devscratchpad init
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-sky-600 dark:text-sky-400 font-medium">
                    .cursor/rules/cursor-rules-pro.mdc
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Frequently Asked Questions Section */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
              <span>Developer FAQ</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Do I need to install devscratchpad globally?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                No. Because <code>devscratchpad</code> is published as an executable on npm, you can run any command
                directly via <code>npx devscratchpad &lt;command&gt;</code> without leaving permanent files on your machine.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                How does the rule auditor evaluate my AI rules?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The auditor scores your files against 4 static heuristics: Negative Guardrail Presence (banning antipatterns),
                Rule Density (detecting monolithic prompt degradation over 300 lines), Trigger & Glob Specificity, and
                Vague Directive Detection (&quot;clean code&quot;).
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Can I use this when developing air-gapped without internet?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Yes. If internet connectivity is unavailable, the CLI automatically falls back to its bundled local
                templates to scaffold your workspace rules without failing.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                How do I migrate my legacy .cursorrules file?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Visit the{" "}
                <Link href="/ai-skill-studio/rules-converter" className="text-orange-600 underline font-semibold">
                  Universal Rules Converter
                </Link>{" "}
                to paste your legacy rule file and convert it into modular Cursor .mdc, Claude SKILL.md, or Windsurf rules.
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Where can I read a complete guide or tutorial?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Check out our in-depth engineering post:{" "}
                <Link
                  href="/blog/how-to-manage-ai-rules-with-cli-guide"
                  className="text-orange-600 dark:text-orange-400 underline font-semibold hover:text-orange-500"
                >
                  How to Author, Audit, and Sync AI Rules with DevScratchpad CLI
                </Link>
                . It covers negative guardrails, multi-agent synchronization, and CI/CD audit setup.
              </p>
            </div>
          </div>
        </div>

        {/* Global Traffic Bridge Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold">Prefer a Visual Interface or Step-by-Step Guide?</h3>
            <p className="text-xs sm:text-sm text-orange-100 max-w-xl leading-relaxed">
              Read our complete architecture guide or explore the DevScratchpad AI Skill Studio to design, customize, and test your AI rulebooks with
              real-time preview and 100% offline security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/blog/how-to-manage-ai-rules-with-cli-guide"
              className="px-5 py-3 bg-black/20 hover:bg-black/30 border border-white/20 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 group"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read CLI Guide</span>
            </Link>

            <Link
              href="/ai-skill-studio"
              className="px-6 py-3 bg-white text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 group"
            >
              <span>Launch AI Skill Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
