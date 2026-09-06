"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Code2,
  FolderTree,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { ProgrammaticPresetRoute, getPresetsByFormat } from "../../claude-skills/lib/presetRegistry";
import { getFormatHub } from "../../claude-skills/lib/formatHubs";
import { getInstallCommands, copyToClipboard } from "../../claude-skills/lib/ruleGenerator";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-[11px] font-mono text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700 font-medium">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 text-zinc-500" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
}

function getFormatMeta(formatSlug: string) {
  switch (formatSlug) {
    case "cursor-rules":
      return {
        pill: "CURSOR RULES",
        scope: "Glob Pattern Auto-Match",
        formatType: "Frontmatter MDC (.mdc)",
        aiSupport: "Cursor IDE & Composer",
      };
    case "claude-skills":
      return {
        pill: "CLAUDE SKILL",
        scope: "Trigger Phrase / CLI Tool",
        formatType: "Folder Skill (SKILL.md)",
        aiSupport: "Claude Code CLI & Desktop",
      };
    case "claude-md":
      return {
        pill: "CLAUDE.MD",
        scope: "Root Workspace Context",
        formatType: "Project Memory (.md)",
        aiSupport: "Claude Code & Agent Workflows",
      };
    case "agents-md":
      return {
        pill: "AGENTS.MD",
        scope: "Multi-Agent Root Invariants",
        formatType: "Agent Standard (.md)",
        aiSupport: "Antigravity, Codex & Windsurf",
      };
    case "mcp-config":
      return {
        pill: "MCP CONFIG",
        scope: "Local stdio / JSON-RPC Process",
        formatType: "JSON Schema (claude.json)",
        aiSupport: "Claude Desktop & MCP Hosts",
      };
    default:
      return {
        pill: "AI RULEBOOK",
        scope: "Project Context",
        formatType: "Markdown / Config",
        aiSupport: "Universal AI Assistants",
      };
  }
}

function TerminalInstallWidget({ route }: { route: ProgrammaticPresetRoute }) {
  const [activeTab, setActiveTab] = useState<"bash" | "powershell" | "wget" | "cli">("bash");
  const [baseUrl, setBaseUrl] = useState("https://www.devscratchpad.tech");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");
      if (isLocal) {
        setBaseUrl(window.location.origin);
      }
    }
  }, []);

  const commands = useMemo(
    () => getInstallCommands(route.formatSlug, route.presetSlug, route.targetFile, baseUrl),
    [route.formatSlug, route.presetSlug, route.targetFile, baseUrl]
  );

  const activeCommand = useMemo(() => {
    switch (activeTab) {
      case "powershell":
        return commands.powershell;
      case "wget":
        return commands.wget;
      case "cli":
        return commands.cliRunner || commands.bash;
      case "bash":
      default:
        return commands.bash;
    }
  }, [activeTab, commands]);

  const handleCopy = async () => {
    const success = await copyToClipboard(activeCommand);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMcp = route.formatSlug === "mcp-config" && Boolean(commands.cliRunner);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs space-y-0">
      <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/60">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-600" />
            Terminal One-Liner Install
          </h4>
          <p className="text-xs text-zinc-600 mt-0.5">
            Run directly in your project root to stream and write this rule file with one command.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Raw API Stream
          </span>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-zinc-950 text-zinc-100 font-mono text-xs">
        {/* Tab & Action Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 px-3 py-2 bg-zinc-900/90 gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("bash")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === "bash"
                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Bash (curl)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("powershell")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === "powershell"
                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              PowerShell
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wget")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeTab === "wget"
                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Wget
            </button>
            {isMcp && (
              <button
                type="button"
                onClick={() => setActiveTab("cli")}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === "cli"
                    ? "bg-zinc-800 text-orange-400 border border-zinc-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                CLI Runner ({commands.cliRunner?.split(" ")[0]})
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors font-mono text-[11px] cursor-pointer"
            title="Copy command to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        {/* Command Box */}
        <div className="p-4 overflow-x-auto flex items-start sm:items-center gap-3">
          <span className="text-zinc-500 select-none font-bold shrink-0 pt-0.5 sm:pt-0">
            {activeTab === "powershell" ? "PS>" : "$"}
          </span>
          <code className="text-zinc-200 font-mono text-xs sm:text-sm whitespace-pre select-all">
            {activeCommand}
          </code>
        </div>
      </div>
    </div>
  );
}

export function ProgrammaticSpokeSeoContent({ route }: { route: ProgrammaticPresetRoute }) {
  const hub = getFormatHub(route.formatSlug);
  const meta = getFormatMeta(route.formatSlug);

  const sameFormatPresets = getPresetsByFormat(route.formatSlug).filter(
    (p) => p.presetSlug !== route.presetSlug
  );
  const siblingTechPresets = sameFormatPresets.slice(0, 6);

  return (
    <article className="w-full bg-white border-t border-zinc-200 mt-8 py-16 px-4 sm:px-6 lg:px-8 text-zinc-800 font-sans selection:bg-zinc-900 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* 1. Executive Callout Card (Specs at a Glance Hero) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* Header with pill badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
                <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                <span className="font-semibold">{meta.pill}</span>
              </div>
              <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-mono text-zinc-600 font-medium">
                {route.category}
              </span>
            </div>

            <Link
              href={`/ai-skill-studio/${route.formatSlug}`}
              className="text-xs font-mono text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors font-medium"
            >
              <span>{hub?.name || "Format"} Hub Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Main Title & Executive Summary */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {route.title}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 max-w-4xl">
              Production-grade architectural rulebook for <strong>{route.techName}</strong>. Engineered to eliminate LLM hallucinations, enforce strict deterministic conventions, and prevent architectural drift across Cursor IDE, Claude Code CLI, and autonomous multi-agent pipelines.
            </p>
          </div>

          {/* 4 Mini Spec Cards Sub-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Card 1: Target Path */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 flex flex-col justify-between gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-medium">
                  Target Path
                </span>
                <CopyButton text={route.targetFile} />
              </div>
              <code className="text-xs font-mono text-zinc-900 font-semibold truncate" title={route.targetFile}>
                {route.targetFile}
              </code>
            </div>

            {/* Card 2: Scope */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 flex flex-col justify-between gap-2 shadow-2xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-medium">
                Execution Scope
              </span>
              <div className="text-xs font-mono text-zinc-900 font-semibold truncate">
                {meta.scope}
              </div>
            </div>

            {/* Card 3: Format Type */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 flex flex-col justify-between gap-2 shadow-2xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-medium">
                Specification Format
              </span>
              <div className="text-xs font-mono text-zinc-900 font-semibold truncate">
                {meta.formatType}
              </div>
            </div>

            {/* Card 4: AI Tool Support */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 flex flex-col justify-between gap-2 shadow-2xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-medium">
                AI Tool Support
              </span>
              <div className="text-xs font-mono text-orange-700 font-semibold truncate">
                {meta.aiSupport}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Side-by-Side Failure Patterns: Without vs With This Rule */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-orange-700 tracking-wider font-semibold uppercase">
              02 / DRIFT ANALYSIS &amp; VALUE PROPOSITION
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600" />
            Failure Patterns Prevented for {route.techName}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Column 1: Without This Rule */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-200 pb-3">
                <span className="flex items-center gap-2 text-rose-800 font-semibold text-xs font-mono uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Without This Rule (Default LLM Behavior)
                </span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 uppercase font-semibold">
                  Vulnerable
                </span>
              </div>

              <div className="space-y-3 text-sm text-zinc-700 leading-relaxed">
                <p>{route.whyNeeded}</p>
                <div className="rounded-lg bg-white border border-rose-200 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="text-[11px] font-mono text-rose-800 uppercase tracking-wider font-semibold">
                    Hallucination Symptoms
                  </div>
                  <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside">
                    <li>Invokes deprecated or removed APIs from older model training weights</li>
                    <li>Generates conflicting configuration files and invalid imports</li>
                    <li>Silently drops type-safety, boundaries, or transaction isolation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Column 2: With This Rule */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <span className="flex items-center gap-2 text-emerald-800 font-semibold text-xs font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  With This Rule (Guaranteed Invariants)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase font-semibold">
                  Deterministic
                </span>
              </div>

              <div className="space-y-2.5">
                {route.keyRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Verified Code Patterns: File Headers, Contrast & Copy Buttons */}
        {(route.exampleGood || route.exampleBad) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-orange-700 tracking-wider font-semibold uppercase">
                03 / VERIFIED CODE PATTERNS
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-orange-600" />
              Code Standards: Anti-Pattern vs Verified Implementation
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Discouraged Anti-Pattern */}
              {route.exampleBad && (
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col shadow-2xs">
                  {/* Top Bar with Filename & Action */}
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-xs font-mono text-rose-800 font-semibold">
                        Discouraged Anti-Pattern
                      </span>
                    </div>
                    <CopyButton text={route.exampleBad} />
                  </div>
                  {/* Code Container */}
                  <pre className="p-4 bg-zinc-900 text-xs font-mono text-rose-200 overflow-x-auto leading-relaxed flex-1">
                    <code>{route.exampleBad}</code>
                  </pre>
                </div>
              )}

              {/* Recommended Pattern */}
              {route.exampleGood && (
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col shadow-2xs">
                  {/* Top Bar with Filename & Action */}
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-mono text-emerald-800 font-semibold">
                        Verified Production Standard
                      </span>
                    </div>
                    <CopyButton text={route.exampleGood} />
                  </div>
                  {/* Code Container */}
                  <pre className="p-4 bg-zinc-900 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed flex-1">
                    <code>{route.exampleGood}</code>
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Target Placement Specification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-orange-700 tracking-wider font-semibold uppercase">
              04 / REPOSITORY PLACEMENT &amp; INSTALLATION
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-4 shadow-2xs">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-orange-600" />
              Where to Save This Rule in Your Repository
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Export the rules from the interactive editor above or download the full ZIP bundle. Ensure the file is placed at the exact path below relative to your project root so the AI engine automatically loads it:
            </p>
            <div className="bg-zinc-100 border border-zinc-200 rounded-lg px-4 py-3 font-mono text-xs text-zinc-900 flex items-center justify-between">
              <span className="truncate pr-4 font-bold text-zinc-900">{route.targetFile}</span>
              <CopyButton text={route.targetFile} label="Copy Path" />
            </div>
          </div>

          {/* Terminal One-Liner Install Interactive Widget */}
          <TerminalInstallWidget route={route} />
        </section>

        {/* 5. Lateral Hub-and-Spoke Route Directory */}
        <section className="space-y-6 pt-4 border-t border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-orange-700 tracking-wider font-semibold uppercase">
              05 / ROUTE DIRECTORY &amp; CROSS-TOOLING
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Alternative Formats Micro-Grid */}
          {(() => {
            const CODE_FORMAT_SPECS = [
              { formatSlug: "cursor-rules", label: "Cursor Rules (.mdc)" },
              { formatSlug: "claude-skills", label: "Claude Skill (SKILL.md)" },
              { formatSlug: "claude-md", label: "CLAUDE.md Memory" },
              { formatSlug: "agents-md", label: "AGENTS.md Spec" },
            ];

            const isCodeFormat = CODE_FORMAT_SPECS.some((f) => f.formatSlug === route.formatSlug);

            const generatedSpokes = isCodeFormat
              ? CODE_FORMAT_SPECS.filter((f) => f.formatSlug !== route.formatSlug).map((f) => ({
                  formatSlug: f.formatSlug,
                  presetSlug: route.presetSlug,
                  label: `${route.techName} ${f.label}`,
                }))
              : (route.relatedSpokes || []);

            const filteredSpokes = generatedSpokes.filter((spoke) => {
              if (spoke.formatSlug !== route.formatSlug) return true;
              return spoke.presetSlug !== route.presetSlug;
            });

            return filteredSpokes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-700 uppercase tracking-wider font-bold">
                    Alternative AI Formats for {route.techName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 font-medium">Cross-Tooling</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredSpokes.map((spoke, idx) => (
                    <Link
                      key={idx}
                      href={`/ai-skill-studio/${spoke.formatSlug}/${spoke.presetSlug}`}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/20 transition shadow-2xs group"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-xs text-zinc-800 group-hover:text-orange-700 truncate block font-medium">
                          /ai-skill-studio/{spoke.formatSlug}/{spoke.presetSlug}
                        </span>
                        <span className="text-[10px] font-mono text-orange-700 font-semibold">
                          {spoke.label}
                        </span>
                      </div>
                      <span className="text-zinc-400 group-hover:text-orange-600 text-sm transition-transform group-hover:translate-x-1 shrink-0">
                        &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Sibling Stacks in Same Format */}
          {siblingTechPresets.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-700 uppercase tracking-wider font-bold">
                  Related {hub?.name || "Format"} Presets
                </span>
                <span className="text-[11px] font-mono text-zinc-500 font-medium">Same Directory</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {siblingTechPresets.map((preset) => (
                  <Link
                    key={preset.presetSlug}
                    href={`/ai-skill-studio/${route.formatSlug}/${preset.presetSlug}`}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/20 transition shadow-2xs group"
                  >
                    <div className="truncate pr-2">
                      <div className="text-[9px] font-mono uppercase text-zinc-500 font-medium">{preset.category}</div>
                      <div className="text-xs font-mono text-zinc-800 group-hover:text-orange-700 truncate font-semibold">
                        {preset.techName}
                      </div>
                    </div>
                    <span className="text-zinc-400 group-hover:text-orange-600 text-sm transition-transform group-hover:translate-x-1 shrink-0">
                      &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Central Pillar Hub Card */}
          {hub && (
            <div className="rounded-xl border border-zinc-200 bg-orange-50/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-orange-300 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-800">
                    Format Pillar Hub
                  </span>
                  <span className="rounded-full bg-orange-100 border border-orange-200 px-2 py-0.2 text-[10px] font-mono text-orange-800 font-medium">
                    Comprehensive Manual
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900">
                  {hub.heroHeading}
                </h4>
                <p className="text-xs text-zinc-600 max-w-2xl">
                  Inspect the complete specification manual, glob patterns, directory rules, and all available presets in our central directory.
                </p>
              </div>
              <Link
                href={`/ai-skill-studio/${hub.slug}`}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500 text-xs font-mono font-semibold transition-colors shadow-2xs"
              >
                <span>/{hub.slug} Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* 6. Stack-specific Frequently Asked Questions */}
        {route.faqs && route.faqs.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-zinc-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-orange-700 tracking-wider font-semibold uppercase">
                06 / FREQUENTLY ASKED QUESTIONS
              </span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              Technical FAQ: {route.techName} AI Rulebooks
            </h2>

            <div className="space-y-3 pt-2">
              {route.faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-2 shadow-2xs">
                  <h4 className="text-sm font-bold text-zinc-900">{faq.question}</h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
