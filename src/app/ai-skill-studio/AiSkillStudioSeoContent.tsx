import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Layers,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function AiSkillStudioSeoContent() {
  return (
    <article className="w-full bg-white border-t border-zinc-200 mt-12 py-16 px-4 sm:px-6 lg:px-8 text-zinc-800 font-sans selection:bg-zinc-900 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* 1. Header & Context */}
        <section className="space-y-4 border-b border-zinc-200 pb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span>Developer Reference & Technical Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            The Complete Specification Guide to AI Coding Agent Rules & Skills
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
            AI Skill Studio enables software engineering teams to configure, standardize, and generate production-grade agent steering files—including Claude Code skills (<code className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">SKILL.md</code>), Cursor Project Rules (<code className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">.cursor/rules/*.mdc</code>), Anthropic project guidelines (<code className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">CLAUDE.md</code>), and cross-agent orchestrations (<code className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">AGENTS.md</code>)—with 100% client-side privacy.
          </p>
        </section>

        {/* 2. Format Comparison Matrix */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Comparing Modern AI Agent Configuration Formats
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600">
              Different AI coding companions and IDEs parse instructions through distinct specifications. Here is how each target format functions in production:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                  SKILL.md
                </span>
                <span className="text-xs text-zinc-500 font-mono">Claude Code & Agentic CLI</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">Claude Code Agent Skills</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Packaged modular instructions equipped with YAML frontmatter (<code className="font-mono">name</code> and <code className="font-mono">description</code>). Claude Code evaluates the description dynamically, loading the skill into context only when triggered by relevant developer tasks or explicit slash commands.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: .claude/skills/&lt;skill-name&gt;/SKILL.md
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  .mdc Rules
                </span>
                <span className="text-xs text-zinc-500 font-mono">Cursor IDE (Modern Standard)</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">Cursor Modular Project Rules</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Supersedes the legacy monolithic <code className="font-mono">.cursorrules</code> file. Modern Cursor rules live under <code className="font-mono">.cursor/rules/*.mdc</code> with structured frontmatter specifying glob patterns (<code className="font-mono">globs: [&quot;**/*.tsx&quot;]</code>) and an <code className="font-mono">alwaysApply</code> flag to minimize prompt token overhead.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: .cursor/rules/&lt;rule-name&gt;.mdc
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  CLAUDE.md
                </span>
                <span className="text-xs text-zinc-500 font-mono">Project Root Repository Context</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">Anthropic Root Instructions</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Located at the repository root, <code className="font-mono">CLAUDE.md</code> is ingested automatically by Claude Code and Claude.ai project instances. Uses semantic XML tags (<code className="font-mono">&lt;project_context&gt;</code>, <code className="font-mono">&lt;tech_stack&gt;</code>, <code className="font-mono">&lt;workflows_and_procedures&gt;</code>) to preserve high token density.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: /CLAUDE.md (Repository Root)
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  AGENTS.md
                </span>
                <span className="text-xs text-zinc-500 font-mono">Multi-Agent Systems & Antigravity</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">Multi-Agent Protocol Specifications</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Standardized configuration for agentic frameworks (Antigravity, CrewAI, AutoGen). Contains demarcated rule blocks (<code className="font-mono">&lt;!-- BEGIN:agent-rules --&gt;</code>) that establish specialized roles, architectural boundaries, and operational guardrails for autonomous multi-agent loops.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: /AGENTS.md (Workspace Root)
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                  claude.json
                </span>
                <span className="text-xs text-zinc-500 font-mono">Model Context Protocol (MCP)</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">MCP Server Configurations</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Standardized configuration block for local and remote Model Context Protocol (MCP) servers. Configures executable commands, environment credentials, and connection arguments for tools like filesystem inspection, GitHub API, PostgreSQL, and web fetchers.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: /claude.json or ~/.claude.json
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  agents/*.json
                </span>
                <span className="text-xs text-zinc-500 font-mono">Claude Code Subagents</span>
              </div>
              <h4 className="font-semibold text-zinc-900 text-sm">Subagent Role & Tool Specifications</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Defines dedicated subagents equipped with specific execution models (Claude 3.7 Sonnet, Claude 3.5 Sonnet, Haiku), strict tool capability boundaries (<code className="font-mono">Read</code>, <code className="font-mono">Write</code>, <code className="font-mono">Edit</code>, <code className="font-mono">Bash</code>, <code className="font-mono">MCP</code>), and customizable turn budgets for deep workflows.
              </p>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200 p-2 rounded">
                Path: .claude/agents/&lt;agent-name&gt;.json
              </div>
            </div>
          </div>
        </section>

        {/* 3. How to Generate in 3 Steps */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              How to Generate & Deploy AI Agent Skills in 3 Steps
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600">
              Streamline your prompt engineering and rule management pipeline:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 01</span>
              <h4 className="font-semibold text-zinc-900 text-sm">Select Preset or Import Manifest</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Choose a production-grade preset (Next.js 15, FastAPI, Cursor .mdc Pro, Codebase Auditor) or drop your <code className="font-mono text-[11px]">package.json</code> or <code className="font-mono text-[11px]">Cargo.toml</code> to auto-detect your stack.
              </p>
            </div>
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 02</span>
              <h4 className="font-semibold text-zinc-900 text-sm">Configure Guardrails & Philosophy</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Toggle essential engineering behaviors (e.g., surgical diffs, guard clauses, typed schemas, strict accessibility) and input reference code examples for immediate model grounding.
              </p>
            </div>
            <div className="border border-zinc-200 p-5 rounded-lg bg-white space-y-2 shadow-2xs">
              <span className="font-mono text-xs font-bold text-zinc-400">STEP 03</span>
              <h4 className="font-semibold text-zinc-900 text-sm">Export Unified AI Kit (.zip)</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Download a unified archive containing formatted <code className="font-mono text-[11px]">.cursor/rules/*.mdc</code>, <code className="font-mono text-[11px]">.claude/skills/SKILL.md</code>, <code className="font-mono text-[11px]">CLAUDE.md</code>, <code className="font-mono text-[11px]">AGENTS.md</code>, and installation documentation.
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
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
            Why Enterprise Engineers Use In-Browser Skill Generation
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Cloud-based AI prompt builders require uploading your project names, internal repository architectures, and confidential engineering guidelines to remote databases. <strong>AI Skill Studio executes 100% in local browser memory.</strong> No network requests transmit your prompt inputs, manifests, or generated rules. It operates offline, requires zero API keys, and creates zero telemetry footprint.
          </p>
        </section>

        {/* 5. Frequently Asked Questions (FAQ) Accordion */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              Frequently Asked Questions (FAQ)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600">
              Everything you need to know about configuring skills and project rules for AI coding assistants.
            </p>
          </div>

          <div className="space-y-3">
            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>What is the difference between Cursor .mdc rules and legacy .cursorrules?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                The legacy <code className="font-mono">.cursorrules</code> file is a single monolithic file loaded on every AI interaction, rapidly consuming context window tokens. Modern Cursor Project Rules (<code className="font-mono">.cursor/rules/*.mdc</code>) allow modular rulebooks with file glob patterns (e.g. <code className="font-mono">src/components/**/*.tsx</code>) and <code className="font-mono">alwaysApply: false</code>, so rules attach only when relevant code is being modified.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>How does Claude Code detect and run custom skills from SKILL.md?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Claude Code searches <code className="font-mono">.claude/skills/&lt;skill-name&gt;/SKILL.md</code> in your project directory (or globally in <code className="font-mono">~/.claude/skills/</code>). It indexes the YAML frontmatter (<code className="font-mono">name</code> and <code className="font-mono">description</code>). When your request aligns with the skill description or when you trigger its slash command, Claude automatically loads the full markdown instructions.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I use the generated rules in Windsurf, GitHub Copilot, or Aider?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Yes. The generated <code className="font-mono">CLAUDE.md</code> and <code className="font-mono">AGENTS.md</code> files use standard Markdown and XML structures compatible with Windsurf Cascade, GitHub Copilot workspace instructions, and Aider system prompts.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>Does AI Skill Studio send my manifest files or code to any server?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                No. All manifest parsing (<code className="font-mono">package.json</code>, <code className="font-mono">Cargo.toml</code>, etc.), rule generation, Monaco editing, and ZIP archive creation are executed 100% client-side via JavaScript in your browser memory. No backend network requests are made.
              </p>
            </details>

            <details className="group border border-zinc-200 rounded-lg bg-white p-4 open:bg-zinc-50/50 transition-colors">
              <summary className="font-medium text-sm text-zinc-900 cursor-pointer list-none flex items-center justify-between">
                <span>Where should I put the generated files in my repository?</span>
                <span className="text-xs font-mono text-zinc-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
                Exporting the AI Kit ZIP will automatically arrange the files in the correct directory structure:
                <br />• Cursor rules: <code className="font-mono">.cursor/rules/&lt;name&gt;.mdc</code>
                <br />• Claude skills: <code className="font-mono">.claude/skills/&lt;name&gt;/SKILL.md</code>
                <br />• Anthropic guidelines: <code className="font-mono">CLAUDE.md</code> at repo root
                <br />• Multi-agent rules: <code className="font-mono">AGENTS.md</code> at repo root
              </p>
            </details>
          </div>
        </section>

        {/* 6. Contextual Link to Blog Guide */}
        <section className="border border-zinc-200 rounded-lg p-6 bg-gradient-to-r from-zinc-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-zinc-900 text-sm">
              Want a comprehensive deep dive into AI agent prompt architecture?
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
