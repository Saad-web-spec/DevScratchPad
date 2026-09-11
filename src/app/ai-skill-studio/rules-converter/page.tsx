import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, ShieldCheck, CheckCircle2, HelpCircle, Code, Cpu, RefreshCw, Terminal, Layers } from "lucide-react";
import { ConverterClient } from "./ConverterClient";

export const metadata: Metadata = {
  title: "Universal AI Rules Converter",
  description:
    "Free, 100% offline AI rules converter. Deconstruct legacy .cursorrules and CLAUDE.md into modular Cursor .mdc, Claude SKILL.md, Windsurf Cascade, and GitHub Copilot instructions.",
  keywords: [
    "convert cursorrules to claude",
    "cursor rules to claude converter",
    "convert cursor rules to windsurf",
    "claude.md to cursor rules",
    "cursorrules converter",
    "AI rules converter",
    "convert cursorrules to copilot",
    "cursor mdc converter",
    "SKILL.md converter",
    "DevScratchpad",
  ],
  alternates: {
    canonical: "https://www.devscratchpad.tech/ai-skill-studio/rules-converter",
  },
  openGraph: {
    title: "Universal AI Rules Converter | DevScratchpad",
    description:
      "Deconstruct monolithic .cursorrules or CLAUDE.md into modular Cursor .mdc, Claude SKILL.md, Windsurf Cascade, and GitHub Copilot instructions 100% offline.",
    url: "https://www.devscratchpad.tech/ai-skill-studio/rules-converter",
    siteName: "DevScratchpad",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        width: 1200,
        height: 630,
        alt: "Universal AI Rules Converter — DevScratchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal AI Rules Converter | DevScratchpad",
    description:
      "Free offline converter: .cursorrules to Claude SKILL.md, Windsurf Cascade, and GitHub Copilot instructions.",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        width: 1200,
        height: 630,
        alt: "Universal AI Rules Converter — DevScratchpad",
      },
    ],
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio/rules-converter#app",
      "name": "Universal AI Rules Converter",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "url": "https://www.devscratchpad.tech/ai-skill-studio/rules-converter",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "description":
        "100% client-side parser that decomposes legacy .cursorrules, CLAUDE.md, and system prompts into modern Cursor .mdc, Claude Code SKILL.md, Windsurf Cascade, and GitHub Copilot instructions.",
    },
    {
      "@type": "HowTo",
      "name": "How to Convert Legacy .cursorrules to Claude Code or Windsurf",
      "description": "Step-by-step guide to convert legacy monolithic .cursorrules into modular multi-assistant rules.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Paste or Drop Rulebook",
          "text": "Paste your existing .cursorrules, CLAUDE.md, or system prompt into the input area or drop the file directly.",
        },
        {
          "@type": "HowToStep",
          "name": "Automatic Deconstruction",
          "text": "The client-side engine automatically parses the persona, tech stack, negative guardrails, and conventions into an Intermediate Representation (IR).",
        },
        {
          "@type": "HowToStep",
          "name": "Select Target Format & Export",
          "text": "Choose your desired runtime format (Claude SKILL.md, Cursor .mdc, Windsurf Cascade, Copilot) and copy the converted code or launch it in AI Skill Studio.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio/rules-converter#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Can I convert .cursorrules to Claude Code SKILL.md?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! The converter extracts tech stack parameters, negative constraints ('never use any'), and procedural steps from your .cursorrules file and formats them into the standard Claude Code SKILL.md specification with YAML frontmatter.",
          },
        },
        {
          "@type": "Question",
          "name": "Does this converter upload my code to a server?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. DevScratchpad executes 100% in your local browser memory using client-side JavaScript. No pasted prompts, proprietary code, or rulebooks are ever transmitted over the network.",
          },
        },
        {
          "@type": "Question",
          "name": "What AI assistants and formats are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The converter exports into 9 target formats: Cursor Rules (.mdc), Claude Code Skills (SKILL.md), CLAUDE.md project memory, AGENTS.md multi-agent specs, Windsurf Cascade rules, GitHub Copilot instructions (.github/copilot-instructions.md), OpenAI Custom Instructions, and Gemini API system prompts.",
          },
        },
        {
          "@type": "Question",
          "name": "Why should I migrate away from legacy monolithic .cursorrules?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Monolithic .cursorrules inject hundreds of lines of instructions on every single prompt, consuming valuable context tokens and causing LLM confusion. Modern standards like Cursor .mdc and Windsurf Cascade attach conditionally using file globs, ensuring the model only reads rules relevant to active files.",
          },
        },
      ],
    },
  ],
};

export default function RulesConverterPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      {/* Header Nav */}
      <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/ai-skill-studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              DevScratchpad Home
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ai-skill-studio"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Studio Editor</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Universal AI Rules Converter & Decomposer</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Convert <code className="text-orange-600 dark:text-orange-400 font-mono">.cursorrules</code> to Claude Code, Windsurf & Copilot
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            Deconstruct legacy monolithic <code className="font-mono text-xs">.cursorrules</code>, <code className="font-mono text-xs">CLAUDE.md</code>, or custom system prompts into modular <strong>Cursor .mdc</strong>, <strong>Claude SKILL.md</strong>, <strong>Windsurf Cascade</strong>, and <strong>GitHub Copilot instructions</strong>. 100% offline with zero server transmission.
          </p>
        </div>

        {/* Interactive Converter Client Application */}
        <ConverterClient />

        {/* Educational SEO & Comparison Guide */}
        <section className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Zero Context Token Bloat</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Legacy .cursorrules injected hundreds of lines into every LLM request. Converting to modern standards uses glob-scoped activation (<code className="text-[11px]">globs: src/app/**/*</code>) so rules only trigger when editing matching code.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Cross-Assistant Portability</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Convert once and deploy everywhere. Export cleanly into Cursor (.mdc), Claude Code (SKILL.md), Windsurf Cascade (.windsurf/rules), GitHub Copilot (.github/copilot-instructions.md), and Gemini JSON schemas.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Negative Guardrails Extraction</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The reverse parser isolates negative constraints (&quot;never use any&quot;, &quot;avoid loose fetches&quot;) from positive conventions, guaranteeing that LLMs adhere to strict architectural invariants without hallucinating.
              </p>
            </div>
          </div>

          {/* Assistant Compatibility Table */}
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>AI Assistant Format Matrix & Target File Locations</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono">
                    <th className="py-2.5 px-3">Runtime Standard</th>
                    <th className="py-2.5 px-3">Standard File Path</th>
                    <th className="py-2.5 px-3">Scoping Mechanism</th>
                    <th className="py-2.5 px-3">Primary Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Cursor .mdc Rules</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">.cursor/rules/*.mdc</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">File Glob Pattern (<code className="text-[10px]">globs: src/**/*</code>)</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Cursor IDE targeted architectural rules</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Claude Code Skill</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">.claude/skills/*/SKILL.md</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Agent activation description</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Claude Code terminal agent skills</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Windsurf Cascade</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">.windsurf/rules/*.md</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Target context & step checklist</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Windsurf Cascade agent multi-file flows</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">GitHub Copilot</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">.github/copilot-instructions.md</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Root repository instructions</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Copilot Chat and PR automated reviews</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">AGENTS.md Protocol</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">AGENTS.md</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Multi-agent team specification</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">Multi-agent orchestrators & subagents</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terminal CLI Spotlight Banner */}
          <div className="p-5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm">Need rules directly in your terminal?</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Use the zero-dependency DevScratchpad CLI to install and audit rules right in your terminal.
              </p>
            </div>
            <code className="px-3 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs font-mono text-orange-300 self-start sm:self-auto select-all">
              npx devscratchpad add cursor-rules/nextjs-15
            </code>
          </div>

          {/* FAQ Accordion Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600" />
              <span>Frequently Asked Questions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Can I convert .cursorrules to Claude Code SKILL.md?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Yes. The converter extracts your tech stack parameters, negative constraints, and procedures and outputs a standard Claude Code SKILL.md file with YAML frontmatter ready to drop into <code className="text-[11px]">.claude/skills/</code>.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Does this converter upload code to any server?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Never. DevScratchpad executes 100% in your local browser memory using HTML5 File API and client-side JavaScript. Your code and prompts never touch our servers or any cloud telemetry.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  How do I install the converted rules into my repository?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Click &quot;Copy Converted Rule&quot; and paste it into the standard target file location (e.g. <code className="text-[11px]">.cursor/rules/my-rule.mdc</code> or <code className="text-[11px]">.claude/skills/my-skill/SKILL.md</code>). Alternatively, click &quot;Customize in AI Skill Studio&quot; to audit quality or export a full workspace zip.
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Does it support Windsurf Cascade and GitHub Copilot?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Yes! You can instantly convert legacy rules into Windsurf Cascade workflows (<code className="text-[11px]">.windsurf/rules/</code>) or GitHub Copilot repository instructions (<code className="text-[11px]">.github/copilot-instructions.md</code>).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-950 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DevScratchpad AI Skill Studio — 100% Client-Side Privacy</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Developer Tools (28)
            </Link>
            <Link href="/ai-skill-studio" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              AI Skill Studio
            </Link>
            <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Engineering Guides
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
