import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Layers,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  FileText,
} from "lucide-react";

export function AiSkillStudioSeoContent() {
  return (
    <article className="w-full bg-white border-t border-zinc-200 mt-8 py-16 px-4 sm:px-6 lg:px-8 text-zinc-800 font-sans selection:bg-zinc-900 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* 1. Header & Context */}
        <section className="space-y-4 border-b border-zinc-200 pb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span>Developer Reference &amp; 5-Layer AI Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            AI Skill Studio — 5-Layer AI Agent Suite &amp; Rulebook Manager
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 max-w-4xl leading-relaxed">
            Autonomous coding assistants (Cursor IDE, Claude Code, Windsurf, Copilot) are only as dependable as their operational boundaries. <strong>AI Skill Studio</strong> is a 100% client-side workbench that generates, validates, and exports every critical artifact an AI agent requires: IDE rulebooks, privacy-first context shields, and machine-readable architectural blueprints. Zero telemetry, zero server uploads, completely private.
          </p>
        </section>

        {/* 2. 5-Layer System Architecture Matrix */}
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              The 5-Layer AI Agent Operating Suite
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Modern AI pair programming requires more than raw prompts. DevScratchpad organizes agent steering into 3 coordinated layers covering 13 distinct formats:
            </p>
          </div>

          {/* Group 1: Agent Rules & Execution Skills */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 font-mono">
                Layer 1: AI Agent Rules &amp; Runtime Skills
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cursor .mdc */}
              <Link
                href="/ai-skill-studio/cursor-rules"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                      .cursor/rules/*.mdc
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cursor IDE</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Modular Cursor Rules
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Glob-scoped rules with frontmatter triggers. Loads conditionally only when relevant code is edited to keep token overhead minimal.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">.cursor/rules/&lt;name&gt;.mdc</span>
                </div>
              </Link>

              {/* Claude SKILL.md */}
              <Link
                href="/ai-skill-studio/claude-skills"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-md">
                      SKILL.md
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Claude Code</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Claude Code Agent Skills
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    On-demand capabilities loaded semantically based on task intent or explicit slash commands (e.g. <code className="text-[11px] font-mono">/audit</code>).
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileCode className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate">.claude/skills/&lt;name&gt;/SKILL.md</span>
                </div>
              </Link>

              {/* CLAUDE.md */}
              <Link
                href="/ai-skill-studio/claude-md"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                      CLAUDE.md
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Project Root</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Anthropic Project Guidelines
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Repository onboarding manual. Ingested immediately upon session startup to supply build, test, and architecture rules.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">/CLAUDE.md (Root)</span>
                </div>
              </Link>

              {/* AGENTS.md */}
              <Link
                href="/ai-skill-studio/agents-md"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
                      AGENTS.md
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Multi-Agent</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Universal Agent Protocol
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Cross-framework directives for autonomous agent teams (Antigravity, Codex, Devin) with strict testing gates.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileCode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">/AGENTS.md (Root)</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Group 2: Context Shields & Privacy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 font-mono">
                Layer 2: Context Shields &amp; Zero-Leak Privacy (New Editions)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* .cursorignore */}
              <Link
                href="/ai-skill-studio/cursorignore"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4.5 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                      .cursorignore
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Token &amp; Privacy Shield</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Cursor Context Shield
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Prevents Cursor AI from indexing sensitive credentials (<code className="text-[11px] font-mono">.env</code>, <code className="text-[11px] font-mono">*.pem</code>), test fixtures, and bloated lockfiles. Saves 50,000+ context window tokens per prompt and eliminates data leakage into LLM queries.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">/.cursorignore (Repository Root)</span>
                </div>
              </Link>

              {/* .claudeignore */}
              <Link
                href="/ai-skill-studio/claudeignore"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4.5 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                      .claudeignore
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Terminal Boundary Shield</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    Claude Code Privacy Shield
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Establishes strict boundaries for Anthropic&apos;s Claude Code CLI. Guarantees that autonomous terminal agent searches and automated refactoring routines never inspect or mutate sensitive directories or vendor files.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">/.claudeignore (Repository Root)</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Group 3: Machine Documentation & Integrations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 font-mono">
                Layer 3: Machine Roadmaps &amp; Architectural Blueprints (New Editions)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* llms.txt */}
              <Link
                href="/ai-skill-studio/llms-txt"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                      llms.txt
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Open Standard</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    llms.txt Codebase Roadmap
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Standardized, machine-readable markdown orientation for web-crawling LLMs and AI coding assistants. Eliminates HTML parsing overhead.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">/llms.txt (Repo / Domain Root)</span>
                </div>
              </Link>

              {/* ARCHITECTURE.md */}
              <Link
                href="/ai-skill-studio/architecture-md"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                      ARCHITECTURE.md
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">System Blueprint</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    ARCHITECTURE.md Spec
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Defines non-negotiable system invariants, unidirectional data flows, and prohibited anti-patterns that every AI agent must obey before coding.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileText className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="truncate">/ARCHITECTURE.md (Repository Root)</span>
                </div>
              </Link>

              {/* claude.json (MCP) */}
              <Link
                href="/ai-skill-studio/mcp-config"
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md">
                      claude.json
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">MCP Runtime</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    MCP Server Schemas
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Model Context Protocol tool configurations. Connects your AI coding agents directly to databases, local filesystems, GitHub, and APIs.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <FileCode className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">~/.claude.json / config</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 3. How to Generate in 3 Steps */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              How to Generate &amp; Scaffold the Complete AI Suite
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Streamline your prompt engineering, context shield setup, and architecture specs:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 01</span>
              <h3 className="font-semibold text-zinc-900 text-sm">Select Preset or Import Manifest</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Choose a production-grade preset (Next.js 15, React 19, FastAPI, Go, Rust, Cursor Pro) or drop your <code className="font-mono text-[11px]">package.json</code> or <code className="font-mono text-[11px]">Cargo.toml</code> to auto-detect dependencies.
              </p>
            </div>
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 02</span>
              <h3 className="font-semibold text-zinc-900 text-sm">Configure Guardrails &amp; Invariants</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Customize negative bounds (&quot;Never do X&quot;), directory exclusions for <code className="font-mono text-[11px]">.cursorignore</code>, and architectural invariants in the Monaco editor.
              </p>
            </div>
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 03</span>
              <h3 className="font-semibold text-zinc-900 text-sm">Export ZIP or Scaffold with CLI</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Click <strong>Export All as AI Agent Kit (.zip)</strong> or run <code className="font-mono text-[11px] bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">npx devscratchpad init</code> to scaffold all 5 layers directly into your repository.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Privacy & Zero-Data-Leakage Guarantee */}
        <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Zero-Telemetry Client-Side Security Guarantee</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            Why Enterprise Engineers Use In-Browser AI Rule Generation
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Cloud-based prompt builders require uploading proprietary project architectures and confidential guidelines to remote databases. <strong>AI Skill Studio executes 100% in local browser memory.</strong> No network requests transmit your prompt inputs, manifests, or generated rules. It operates offline, requires zero API keys, and creates zero telemetry footprint.
          </p>
        </section>

        {/* 5. Frequently Asked Questions (FAQ) Accordion */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Everything you need to know about the 5-layer AI agent suite and rules management.
            </p>
          </div>

          <div className="space-y-3">
            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>Why do AI agents need .cursorignore and .claudeignore alongside rules?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Rules files tell agents <em>how</em> to write code, but without ignore shields, agents scan massive lockfiles (<code className="font-mono">package-lock.json</code>), build caches, and sensitive environment variables (<code className="font-mono">.env</code>). This wastes 50,000+ context tokens and leaks credentials into LLM queries. Context shields keep reasoning focused strictly on application code.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>What is the difference between Cursor .mdc rules and legacy .cursorrules?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                The legacy <code className="font-mono">.cursorrules</code> file is a single monolithic file loaded on every AI interaction, rapidly consuming context tokens. Modern Cursor Project Rules (<code className="font-mono">.cursor/rules/*.mdc</code>) allow modular rulebooks with file glob patterns (e.g. <code className="font-mono">src/components/**/*.tsx</code>) and <code className="font-mono">alwaysApply: false</code>, so rules attach only when relevant code is being modified.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>What role do llms.txt and ARCHITECTURE.md play?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                <code className="font-mono">llms.txt</code> is an open standard providing a concise, machine-readable index of your codebase for LLMs. <code className="font-mono">ARCHITECTURE.md</code> defines system invariants, state machines, and non-negotiable architectural boundaries. Together, they prevent AI assistants from introducing architectural drift or reinventing existing services.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>Where should the 5-layer files be placed in my repository?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Exporting the AI Kit ZIP automatically arranges all files:
                <br />• Cursor rules: <code className="font-mono">.cursor/rules/&lt;name&gt;.mdc</code>
                <br />• Claude skills: <code className="font-mono">.claude/skills/&lt;name&gt;/SKILL.md</code>
                <br />• Project rules: <code className="font-mono">CLAUDE.md</code> and <code className="font-mono">AGENTS.md</code> at repo root
                <br />• Context shields: <code className="font-mono">.cursorignore</code> and <code className="font-mono">.claudeignore</code> at repo root
                <br />• Specifications: <code className="font-mono">llms.txt</code> and <code className="font-mono">ARCHITECTURE.md</code> at repo root
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>How can I scaffold all these files using the CLI?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Run <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">npx devscratchpad init</code> in your terminal. It installs the universal 5-layer suite into your repository with zero setup, completely offline.
              </p>
            </details>
          </div>
        </section>

        {/* 6. Contextual Link to Blog Guide */}
        <section className="border border-zinc-200 rounded-lg p-6 bg-gradient-to-r from-zinc-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-zinc-900 text-sm">
              Want a comprehensive deep dive into AI agent architecture?
            </h4>
            <p className="text-xs text-zinc-500">
              Read our full engineering guide on Claude Code skills, Cursor rules best practices, and multi-agent coordination.
            </p>
          </div>
          <Link
            href="/blog/claude-code-skills-cursor-rules-guide"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors shrink-0"
          >
            <span>Read Complete Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

      </div>
    </article>
  );
}
