"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  FileCode2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  WindsurfIcon,
  OpenAIIcon,
  GeminiIcon,
  CopilotIcon,
} from "@/components/icons/AssistantBrandIcons";

interface PresetItem {
  slug: string;
  name: string;
  category: string;
  defaultFormat: string;
}

const POPULAR_PRESETS: PresetItem[] = [
  { slug: "nextjs-15", name: "Next.js 15 App Router", category: "Fullstack", defaultFormat: "cursor-rules" },
  { slug: "fastapi", name: "FastAPI & Pydantic v2", category: "Backend", defaultFormat: "claude-skills" },
  { slug: "tailwind-v4", name: "Tailwind CSS v4 (CSS-First)", category: "Styling", defaultFormat: "windsurf" },
  { slug: "react-19", name: "React 19 & Server Components", category: "Frontend", defaultFormat: "cursor-rules" },
  { slug: "typescript-strict", name: "Strict TypeScript Invariants", category: "Language", defaultFormat: "copilot" },
  { slug: "codebase-auditor", name: "Codebase Security & Lint Auditor", category: "Quality", defaultFormat: "claude-skills" },
  { slug: "docker-compose", name: "Docker & Container Hardening", category: "DevOps", defaultFormat: "cursor-rules" },
  { slug: "go-standard", name: "Idiomatic Go (net/http & slog)", category: "Backend", defaultFormat: "cursor-rules" },
];

const FORMAT_TABS = [
  { id: "cursor-rules", label: "Cursor .mdc", file: ".cursor/rules/*.mdc" },
  { id: "claude-skills", label: "Claude Skill", file: ".claude/skills/*/SKILL.md" },
  { id: "windsurf", label: "Windsurf", file: ".windsurf/rules/*.md", icon: <WindsurfIcon className="w-3.5 h-3.5" /> },
  { id: "copilot", label: "Copilot", file: ".github/copilot-instructions.md", icon: <CopilotIcon className="w-3.5 h-3.5" /> },
  { id: "openai", label: "OpenAI", file: ".openai/system-instructions.md", icon: <OpenAIIcon className="w-3.5 h-3.5" /> },
  { id: "gemini", label: "Gemini", file: ".gemini/*.json", icon: <GeminiIcon className="w-3.5 h-3.5" /> },
];

export function CliClient() {
  const [activeCommandTab, setActiveCommandTab] = useState<"add" | "audit" | "list" | "init">("add");
  const [selectedFormat, setSelectedFormat] = useState("cursor-rules");
  const [selectedPreset, setSelectedPreset] = useState("nextjs-15");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const currentAddCommand = `npx devscratchpad add ${selectedFormat}/${selectedPreset}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Quick Install Hero Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live on NPM Registry
              </span>
              <a
                href="https://www.npmjs.com/package/devscratchpad"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>v2.1.0</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Dependencies</span>
              <span className="text-zinc-600">·</span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>100% Offline-First</span>
            </div>
          </div>

          {/* Interactive Command Display */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Run Instantly via Terminal (No Installation Required)
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-3 sm:p-4 rounded-xl font-mono text-sm">
              <div className="flex items-center gap-3 overflow-x-auto py-1 text-zinc-100">
                <span className="text-orange-500 font-bold select-none">$</span>
                <span className="font-semibold text-emerald-400 select-all">{currentAddCommand}</span>
              </div>

              <button
                onClick={() => handleCopy(currentAddCommand)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset & Format Quick Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Select Assistant Format:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FORMAT_TABS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all truncate cursor-pointer ${
                      selectedFormat === fmt.id
                        ? "bg-orange-600 text-white shadow-xs"
                        : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {fmt.icon}
                    <span className="truncate">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Select Technology Stack:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_PRESETS.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => setSelectedPreset(p.slug)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all truncate cursor-pointer ${
                      selectedPreset === p.slug
                        ? "bg-zinc-100 text-zinc-950 font-bold"
                        : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Terminal Output Simulator */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Live Terminal Command Simulator</h3>
            <p className="text-xs text-zinc-500">Preview exact terminal stdout responses and local filesystem actions</p>
          </div>

          {/* Command Switcher Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(["add", "audit", "list", "init"] as const).map((cmd) => (
              <button
                key={cmd}
                onClick={() => setActiveCommandTab(cmd)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeCommandTab === cmd
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {cmd === "add" ? "add <rule>" : cmd === "audit" ? "audit [dir]" : cmd === "list" ? "list" : "init"}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Window */}
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-xl font-mono text-xs">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 select-none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] text-zinc-400 ml-2">bash — npx devscratchpad {activeCommandTab}</span>
            </div>
            <span className="text-[10px] text-zinc-500">Node.js ESM · Zero Telemetry</span>
          </div>

          {/* Terminal Body */}
          <div className="p-4 sm:p-5 space-y-3 leading-relaxed text-zinc-300">
            {activeCommandTab === "add" && (
              <>
                <div className="text-zinc-400">$ npx devscratchpad add {selectedFormat}/{selectedPreset}</div>
                <div className="text-cyan-400">⚡ Fetching rules for &quot;{selectedPreset}&quot; in format &quot;{selectedFormat}&quot;...</div>
                <div className="text-emerald-400 font-bold">✔ Successfully installed!</div>
                <div className="pl-4 text-zinc-300 border-l border-zinc-800 space-y-1">
                  <div>Target:  <span className="font-bold text-white">.{selectedFormat === "cursor-rules" ? ".cursor/rules/" + selectedPreset + ".mdc" : selectedFormat === "claude-skills" ? ".claude/skills/" + selectedPreset + "/SKILL.md" : selectedFormat === "windsurf" ? ".windsurf/rules/" + selectedPreset + ".md" : ".github/copilot-instructions.md"}</span></div>
                  <div>Format:  {selectedFormat}</div>
                  <div>Privacy: 100% Client-Side Confined</div>
                </div>
                <div className="text-zinc-400 pt-2">
                  👉 Customize interactively in AI Skill Studio:{" "}
                  <span className="text-amber-400 underline">https://www.devscratchpad.tech/ai-skill-studio/{selectedFormat}/{selectedPreset}</span>
                </div>
              </>
            )}

            {activeCommandTab === "audit" && (
              <>
                <div className="text-zinc-400">$ npx devscratchpad audit</div>
                <div className="text-cyan-400">🔍 Scanning repository for AI rulebooks in current workspace...</div>
                <div className="pt-2 text-zinc-200">
                  <span className="font-bold">File:</span> .cursor/rules/nextjs-15.mdc<br />
                  <span className="font-bold">Quality Score:</span> <span className="text-emerald-400 font-bold">95 / 100</span><br />
                  <span className="text-emerald-400">✔ Passed negative constraint & glob specificity checks!</span>
                </div>
                <div className="pt-2 text-zinc-200">
                  <span className="font-bold">File:</span> CLAUDE.md<br />
                  <span className="font-bold">Quality Score:</span> <span className="text-amber-400 font-bold">70 / 100</span><br />
                  <span className="text-amber-400">⚠ Missing negative guardrails (&quot;never do X&quot;, &quot;avoid Y&quot;). Without negative bounds, LLMs hallucinate.</span>
                </div>
                <div className="pt-3 border-t border-zinc-800 font-bold">
                  Repository AI Rule Health: <span className="text-emerald-400">83 / 100</span> (2 files analyzed)
                </div>
                <div className="text-zinc-400 pt-1">
                  💡 Auto-fix and enhance your rules with zero data leakage:{" "}
                  <span className="text-amber-400 underline">https://www.devscratchpad.tech/ai-skill-studio</span>
                </div>
              </>
            )}

            {activeCommandTab === "list" && (
              <>
                <div className="text-zinc-400">$ npx devscratchpad list</div>
                <div className="text-amber-400 font-bold">Available Formats:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-zinc-300">
                  <div>• cursor-rules (Cursor .mdc)</div>
                  <div>• claude-skills (Claude SKILL.md)</div>
                  <div>• windsurf (Cascade Rules)</div>
                  <div>• copilot (GitHub Copilot)</div>
                  <div>• openai (Custom Instructions)</div>
                  <div>• gemini (Structured Prompts)</div>
                </div>
                <div className="text-amber-400 font-bold pt-2">Available Presets:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-zinc-300">
                  <div>• nextjs-15 (Fullstack)</div>
                  <div>• react-19 (Frontend)</div>
                  <div>• tailwind-v4 (Styling)</div>
                  <div>• fastapi (Backend)</div>
                  <div>• typescript-strict (Quality)</div>
                  <div>• docker-compose (DevOps)</div>
                </div>
              </>
            )}

            {activeCommandTab === "init" && (
              <>
                <div className="text-zinc-400">$ npx devscratchpad init</div>
                <div className="text-cyan-400">🚀 Initializing DevScratchpad starter rules for repository...</div>
                <div className="text-emerald-400 font-bold">✔ Scaffolding universal multi-agent guidelines:</div>
                <div className="pl-4 text-zinc-300 border-l border-zinc-800 space-y-1">
                  <div>• Created .cursor/rules/cursor-rules-pro.mdc</div>
                  <div>• Created CLAUDE.md with architectural invariants</div>
                  <div>• Initialized negative guardrails against hallucinations</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reciprocal Traffic Bridge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Link
          href="/ai-skill-studio"
          className="group p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800/80 border border-orange-200 dark:border-zinc-700 rounded-2xl transition-all hover:shadow-md hover:border-orange-300 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Visual AI Skill Studio</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Design, customize, and test AI rules in an interactive editor with real-time heuristic quality scoring.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/ai-skill-studio/rules-converter"
          className="group p-5 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-zinc-900 dark:to-zinc-800/80 border border-teal-200 dark:border-zinc-700 rounded-2xl transition-all hover:shadow-md hover:border-teal-300 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Universal Rules Converter</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Deconstruct legacy .cursorrules or CLAUDE.md into modular rules for Windsurf, Copilot, or Gemini.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Convert Legacy Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/developer-tools"
          className="group p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800/80 border border-blue-200 dark:border-zinc-700 rounded-2xl transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
              <FileCode2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">28 Offline Dev Utilities</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Formatters, cryptographic hashing, JWT inspectors, regex testing, and JSON schema tools in local memory.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Browse All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
