"use client";

import React from "react";
import Image from "next/image";
import { Bot, Boxes, CheckCircle2, Cpu, FileText, Layers, Server, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { WindsurfIcon, OpenAIIcon, GeminiIcon, CopilotIcon } from "@/components/icons/AssistantBrandIcons";
import { InfoTooltip } from "./InfoTooltip";
import type { OutputFormat } from "../lib/ruleGenerator";

export interface FormatSelectorProps {
  format: OutputFormat;
  handleSelectFormat: (format: OutputFormat) => void;
}

/** Target Standard & File Format selector: the 17 output formats grouped into agent rules, ignore shields, integrations, and the governance suite. */
export function FormatSelector({
  format,
  handleSelectFormat,
}: FormatSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Boxes className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900 truncate">Target Standard &amp; File Format</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 hidden sm:inline">Select runtime specification</span>
          <InfoTooltip
            title="Target File Format"
            description="Choose from 17 supported agent formats including Cursor rules, Claude Code skills, MCP servers, and the 4-layer AI governance documents (PRD.md, DESIGN.md, TASK.md, MEMORY.md)."
            align="right"
          />
        </div>
      </div>

      {/* Group 1: AI Agent Rules & Skills */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-orange-500" />
          <span>AI Agent Rules & Skills</span>
        </div>
        <div suppressHydrationWarning className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("cursor_mdc")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "cursor_mdc"
                ? "border-black bg-zinc-950 text-white shadow-sm ring-1 ring-black"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Image src="/cursor-icon.png" width={14} height={14}  alt="Cursor" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="truncate">.cursorrules</span>
            </div>
            <span className={cn("text-[10px] leading-tight truncate", format === "cursor_mdc" ? "text-zinc-400" : "text-zinc-500")}>
              Cursor .mdc Rules
            </span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("skill_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "skill_md"
                ? "border-orange-500 bg-orange-50/60 text-orange-950 shadow-xs ring-1 ring-orange-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Image src="/ai-skill-icon.png" width={14} height={14}  alt="Claude" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="truncate">SKILL.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Claude Code / Skill</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("claude_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "claude_md"
                ? "border-amber-500 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Image src="/claude-icon.png" width={14} height={14}  alt="Claude" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="truncate">CLAUDE.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Root Guidelines</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("agents_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "agents_md"
                ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">AGENTS.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Multi-Agent</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("windsurf_cascade")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "windsurf_cascade"
                ? "border-teal-500 bg-teal-50/60 text-teal-950 shadow-xs ring-1 ring-teal-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <WindsurfIcon className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate">Windsurf</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Cascade Rules</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("copilot_instructions")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "copilot_instructions"
                ? "border-sky-500 bg-sky-50/60 text-sky-950 shadow-xs ring-1 ring-sky-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <CopilotIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">Copilot</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Instructions</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("openai_instructions")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "openai_instructions"
                ? "border-purple-500 bg-purple-50/60 text-purple-950 shadow-xs ring-1 ring-purple-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <OpenAIIcon className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
              <span className="truncate">OpenAI</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Custom System</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("gemini_prompts")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "gemini_prompts"
                ? "border-indigo-500 bg-indigo-50/60 text-indigo-950 shadow-xs ring-1 ring-indigo-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <GeminiIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Gemini</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">System Prompts</span>
          </button>
        </div>
      </div>

      {/* Group 2: Context Shields & Privacy (Ignore Files) */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Context Shields & Privacy (Ignore Files)</span>
        </div>
        <div suppressHydrationWarning className="grid grid-cols-2 gap-2">
          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("cursorignore")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "cursorignore"
                ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">.cursorignore</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Token & Secret Shield</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("claudeignore")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "claudeignore"
                ? "border-amber-600 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">.claudeignore</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">CLI Boundary Shield</span>
          </button>
        </div>
      </div>

      {/* Group 3: Integrations & Machine Documentation */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-blue-600" />
          <span>Integrations & Machine Documentation</span>
        </div>
        <div suppressHydrationWarning className="grid grid-cols-2 sm:grid-cols-3 gap-2 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("mcp_json")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "mcp_json"
                ? "border-blue-500 bg-blue-50/60 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">.mcp.json</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">MCP Servers</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("llms_txt")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "llms_txt"
                ? "border-indigo-500 bg-indigo-50/60 text-indigo-950 shadow-xs ring-1 ring-indigo-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">llms.txt</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Codebase Roadmap</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("architecture_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "architecture_md"
                ? "border-purple-500 bg-purple-50/60 text-purple-950 shadow-xs ring-1 ring-purple-500/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">ARCHITECTURE.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">System Invariants</span>
          </button>
        </div>
      </div>

      {/* Group 4: AI Governance & Multi-Agent Planning Suite */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-emerald-600" />
          <span>AI Governance & Multi-Agent Planning Suite</span>
        </div>
        <div suppressHydrationWarning className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("prd_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "prd_md"
                ? "border-blue-600 bg-blue-50/60 text-blue-950 shadow-xs ring-1 ring-blue-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">PRD.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Product Requirements</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("design_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "design_md"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-xs ring-1 ring-indigo-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">DESIGN.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Design & Invariants</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("task_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "task_md"
                ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">TASK.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Sprint Tracker & Gates</span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => handleSelectFormat("memory_md")}
            className={cn(
              "p-2 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
              format === "memory_md"
                ? "border-amber-600 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-600/20"
                : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
              <Cpu className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">MEMORY.md</span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight truncate">Persistent Agent Brain</span>
          </button>
        </div>
      </div>
    </div>
  );
}
