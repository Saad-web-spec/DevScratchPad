"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  FileCode2,
  ExternalLink,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  CursorIcon,
  ClaudeIcon,
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
  {
    id: "cursor-rules",
    label: "Cursor .mdc",
    file: ".cursor/rules/*.mdc",
    icon: <CursorIcon white className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
  {
    id: "claude-skills",
    label: "Claude Skill",
    file: ".claude/skills/*/SKILL.md",
    icon: <ClaudeIcon className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
  {
    id: "windsurf",
    label: "Windsurf",
    file: ".windsurf/rules/*.md",
    icon: <WindsurfIcon className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
  {
    id: "copilot",
    label: "Copilot",
    file: ".github/copilot-instructions.md",
    icon: <CopilotIcon className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
  {
    id: "openai",
    label: "OpenAI",
    file: ".openai/system-instructions.md",
    icon: <OpenAIIcon className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
  {
    id: "gemini",
    label: "Gemini",
    file: ".gemini/*.json",
    icon: <GeminiIcon className="w-4 h-4 mr-2 inline-flex items-center shrink-0" />,
  },
];

function getTargetFilePath(format: string, preset: string) {
  switch (format) {
    case "cursor-rules":
      return `.cursor/rules/${preset}.mdc`;
    case "claude-skills":
      return `.claude/skills/${preset}/SKILL.md`;
    case "windsurf":
      return `.windsurf/rules/${preset}.md`;
    case "copilot":
      return `.github/copilot-instructions.md`;
    case "openai":
      return `.openai/system-instructions.md`;
    case "gemini":
      return `.gemini/${preset}.json`;
    default:
      return `.cursor/rules/${preset}.mdc`;
  }
}

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
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Live on NPM Registry
              </span>
              <a
                href="https://www.npmjs.com/package/devscratchpad"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors font-mono"
              >
                <span>v2.1.0</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
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
              <div className="flex items-center gap-2 overflow-x-auto py-1 select-all">
                <span className="text-[#94A3B8] font-bold select-none">$</span>
                <span className="text-[#A855F7] font-semibold">npx</span>
                <span className="text-[#38BDF8] font-semibold">devscratchpad</span>
                <span className="text-[#F8FAFC] font-semibold">add</span>
                <span className="text-[#F8FAFC] font-semibold">{selectedFormat}/{selectedPreset}</span>
              </div>

              <button
                onClick={() => handleCopy(currentAddCommand)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="text-[#38BDF8] font-semibold">Copied!</span>
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
                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all truncate cursor-pointer ${
                      selectedFormat === fmt.id
                        ? "bg-orange-600 text-white shadow-xs font-semibold"
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
                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-xs"
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
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-orange-600" />
              <span>Live Terminal Command Simulator</span>
            </h3>
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
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold"
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
              <div className="w-3 h-3 rounded-full bg-sky-500/80" />
              <span className="text-[11px] text-zinc-400 ml-2">bash — npx devscratchpad {activeCommandTab}</span>
            </div>
            <span className="text-[10px] text-zinc-500">Node.js ESM · Zero Telemetry</span>
          </div>

          {/* Terminal Body */}
          <div className="p-4 sm:p-5 space-y-3 leading-relaxed text-zinc-300">
            {/* Syntax Highlighted Command Line */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] font-mono pb-2 border-b border-zinc-800/80">
              <span className="text-[#94A3B8] select-none">$</span>
              <span className="text-[#A855F7] font-semibold">npx</span>
              <span className="text-[#38BDF8] font-semibold">devscratchpad</span>
              {activeCommandTab === "add" && (
                <>
                  <span className="text-[#F8FAFC] font-semibold">add</span>
                  <span className="text-[#F8FAFC] font-semibold">{selectedFormat}/{selectedPreset}</span>
                </>
              )}
              {activeCommandTab === "audit" && (
                <span className="text-[#F8FAFC] font-semibold">audit</span>
              )}
              {activeCommandTab === "list" && (
                <span className="text-[#F8FAFC] font-semibold">list</span>
              )}
              {activeCommandTab === "init" && (
                <span className="text-[#F8FAFC] font-semibold">init</span>
              )}
            </div>

            {activeCommandTab === "add" && (
              <div className="space-y-3 pt-1">
                <div className="text-slate-400 text-xs flex items-center gap-2">
                  <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="DevScratchpad Star" />
                  <span>Fetching rules for &quot;{selectedPreset}&quot; in format &quot;{selectedFormat}&quot;...</span>
                </div>
                <div className="text-[#2DD4BF] font-semibold flex items-center gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Successfully installed!</span>
                </div>
                <div className="pl-3 border-l-2 border-zinc-800 space-y-1 text-xs text-slate-300">
                  <div>Target:  <span className="font-mono font-medium text-white">{getTargetFilePath(selectedFormat, selectedPreset)}</span></div>
                  <div>Format:  <span className="text-slate-200">{selectedFormat}</span></div>
                  <div>Privacy: <span className="text-slate-200">100% Client-Side Confined</span></div>
                </div>
                <div className="text-xs text-slate-400 pt-1">
                  👉 Customize interactively in AI Skill Studio:{" "}
                  <Link
                    href={`/ai-skill-studio/${selectedFormat}/${selectedPreset}`}
                    className="text-[#38BDF8] hover:text-[#7DD3FC] underline font-medium transition-colors"
                  >
                    https://www.devscratchpad.tech/ai-skill-studio/{selectedFormat}/{selectedPreset}
                  </Link>
                </div>
              </div>
            )}

            {activeCommandTab === "audit" && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="text-[#38BDF8] font-medium">🔍 Scanning repository for AI rulebooks in current workspace...</div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/80 space-y-1 text-slate-200">
                  <div><span className="font-semibold text-slate-100">File:</span> .cursor/rules/nextjs-15.mdc</div>
                  <div><span className="font-semibold text-slate-100">Quality Score:</span> <span className="text-[#2DD4BF] font-bold">95 / 100</span></div>
                  <div className="text-[#2DD4BF] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    <span>Passed negative constraint & glob specificity checks!</span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/80 space-y-1 text-slate-200">
                  <div><span className="font-semibold text-slate-100">File:</span> CLAUDE.md</div>
                  <div><span className="font-semibold text-slate-100">Quality Score:</span> <span className="text-amber-400 font-bold">70 / 100</span></div>
                  <div className="text-amber-400">⚠ Missing negative guardrails (&quot;never do X&quot;, &quot;avoid Y&quot;). Without negative bounds, LLMs hallucinate.</div>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-slate-200 font-semibold">
                  Repository AI Rule Health: <span className="text-[#38BDF8] font-bold">83 / 100</span> (2 files analyzed)
                </div>
                <div className="text-slate-400 pt-0.5">
                  💡 Auto-fix and enhance your rules with zero data leakage:{" "}
                  <Link
                    href="/ai-skill-studio"
                    className="text-[#38BDF8] hover:text-[#7DD3FC] underline font-medium transition-colors"
                  >
                    https://www.devscratchpad.tech/ai-skill-studio
                  </Link>
                </div>
              </div>
            )}

            {activeCommandTab === "list" && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="text-[#F97316] font-semibold">Available Formats:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-2 text-slate-300 font-mono">
                  <div>• cursor-rules (Cursor .mdc)</div>
                  <div>• claude-skills (Claude SKILL.md)</div>
                  <div>• windsurf (Cascade Rules)</div>
                  <div>• copilot (GitHub Copilot)</div>
                  <div>• openai (Custom Instructions)</div>
                  <div>• gemini (Structured Prompts)</div>
                </div>
                <div className="text-[#F97316] font-semibold pt-1">Available Presets:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pl-2 text-slate-300 font-mono">
                  <div>• nextjs-15 (Fullstack)</div>
                  <div>• react-19 (Frontend)</div>
                  <div>• tailwind-v4 (Styling)</div>
                  <div>• fastapi (Backend)</div>
                  <div>• typescript-strict (Quality)</div>
                  <div>• docker-compose (DevOps)</div>
                  <div>• codebase-auditor (Security)</div>
                  <div>• go-standard (Backend)</div>
                </div>
              </div>
            )}

            {activeCommandTab === "init" && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="text-[#38BDF8] font-medium">🚀 Initializing DevScratchpad starter rules for repository...</div>
                <div className="text-[#2DD4BF] font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Scaffolding universal multi-agent guidelines:</span>
                </div>
                <div className="pl-3 border-l-2 border-zinc-800 space-y-1 text-slate-300 font-mono">
                  <div>• Created .cursor/rules/cursor-rules-pro.mdc</div>
                  <div>• Created CLAUDE.md with architectural invariants</div>
                  <div>• Initialized negative guardrails against hallucinations</div>
                </div>
              </div>
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
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center mb-3">
              <img src="/ai-skill-icon.png" className="w-5 h-5 object-contain" alt="AI Skill Studio logo" />
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
          className="group p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800/80 border border-purple-200 dark:border-zinc-700 rounded-2xl transition-all hover:shadow-md hover:border-purple-300 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Universal Rules Converter</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Deconstruct legacy .cursorrules or CLAUDE.md into modular rules for Windsurf, Copilot, or Gemini.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 mt-4 group-hover:translate-x-1 transition-transform">
            <span>Convert Legacy Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/developer-tools"
          className="group p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800/80 border border-blue-200 dark:border-zinc-700 rounded-2xl transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
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
