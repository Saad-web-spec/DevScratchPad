"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2, ChevronDown, Cpu, FileText, FolderGit2, Layers, Server, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { WindsurfIcon, OpenAIIcon, GeminiIcon, CopilotIcon } from "@/components/icons/AssistantBrandIcons";
import type { OutputFormat } from "../lib/ruleGenerator";
import { EXPORT_FORMATS, getExportTarget } from "../lib/exportTargets";

export interface TargetLocationCardProps {
  format: OutputFormat;
  skillName: string;
}

/** Target File Location card: where the generated file lives in the repository for the selected format, with usage notes. */
export function TargetLocationCard({
  format,
  skillName,
}: TargetLocationCardProps) {
  const kitPaths = [...EXPORT_FORMATS.map((f) => getExportTarget(f, skillName).repoPath), "README.md"].sort();
  const activePath = getExportTarget(format, skillName).repoPath;

  return (
    <div
      suppressHydrationWarning
      className="rounded-xl border border-orange-200/80 bg-gradient-to-b from-orange-50/60 via-white to-orange-50/30 p-3.5 sm:p-4 shadow-2xs space-y-2 shrink-0 transition-all"
    >
      <div className="flex items-center justify-between gap-2 border-b border-orange-100 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-orange-100/90 border border-orange-200/80 flex items-center justify-center shrink-0 text-orange-700 shadow-2xs">
            {format === "cursor_mdc" ? (
              <Image src="/cursor-icon.png" width={14} height={14} alt="Cursor" className="w-3.5 h-3.5 object-contain" />
            ) : format === "claude_md" ? (
              <Image src="/claude-icon.png" width={14} height={14} alt="Claude" className="w-3.5 h-3.5 object-contain" />
            ) : format === "mcp_json" ? (
              <Server className="w-3.5 h-3.5 text-orange-600" />
            ) : format === "windsurf_cascade" ? (
              <WindsurfIcon className="w-3.5 h-3.5 text-teal-700" />
            ) : format === "copilot_instructions" ? (
              <CopilotIcon className="w-3.5 h-3.5 text-sky-600" />
            ) : format === "openai_instructions" ? (
              <OpenAIIcon className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            ) : format === "gemini_prompts" ? (
              <GeminiIcon className="w-3.5 h-3.5" />
            ) : format === "llms_txt" ? (
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
            ) : format === "architecture_md" ? (
              <Layers className="w-3.5 h-3.5 text-purple-600" />
            ) : format === "prd_md" ? (
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            ) : format === "design_md" ? (
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            ) : format === "task_md" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : format === "memory_md" ? (
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
            ) : format === "cursorignore" || format === "claudeignore" ? (
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            ) : (
              <FolderGit2 className={cn("w-3.5 h-3.5", format === "skill_md" ? "text-orange-500" : "text-zinc-800")} />
            )}
          </div>
          <h4 className="text-xs font-bold text-zinc-900 tracking-tight truncate">Target File Location</h4>
        </div>
        <span className="text-[10px] font-medium tracking-tight text-orange-800 bg-orange-100/80 border border-orange-200/70 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          Project Placement
        </span>
      </div>
      {format === "skill_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.claude/skills/{(skillName || "skill").replace(/[^a-zA-Z0-9._-]/g, "-")}/SKILL.md</code> in project root, or in <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">~/.claude/skills/{(skillName || "skill").replace(/[^a-zA-Z0-9._-]/g, "-")}/SKILL.md</code> for global Claude Code availability.
        </p>
      )}
      {format === "claude_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">CLAUDE.md</code> directly in the root directory. Parsed automatically at the start of every session.
        </p>
      )}
      {format === "cursor_mdc" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save in <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.cursor/rules/{(skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-")}.mdc</code>. Evaluated via glob patterns for targeted context.
        </p>
      )}
      {format === "agents_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">AGENTS.md</code> in your root directory. Multi-agent workflows load this spec to coordinate tasks.
        </p>
      )}
      {format === "mcp_json" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.mcp.json</code> in project root for Claude Code, or merge its <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">mcpServers</code> block into Claude Desktop <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">claude_desktop_config.json</code>.
        </p>
      )}
      {format === "windsurf_cascade" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.windsurf/rules/{(skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-")}.md</code> in project root. Windsurf Cascade automatically injects this rule when executing flows.
        </p>
      )}
      {format === "copilot_instructions" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.github/copilot-instructions.md</code> in repository root. Read by GitHub Copilot chat and code completions.
        </p>
      )}
      {format === "openai_instructions" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save in <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">prompts/openai-custom-instructions.md</code> or paste directly into ChatGPT Custom Instructions / OpenAI Playground System Prompt.
        </p>
      )}
      {format === "gemini_prompts" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save in <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">prompts/gemini-system-instructions.json</code> for Google AI Studio / Gemini API SDK system instructions configuration.
        </p>
      )}
      {format === "cursorignore" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.cursorignore</code> in project root. Masks credentials and excludes build caches and bulky lockfiles to save 50k+ tokens.
        </p>
      )}
      {format === "claudeignore" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">.claudeignore</code> in project root. Prevents Claude Code CLI from reading or modifying restricted directories.
        </p>
      )}
      {format === "llms_txt" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">llms.txt</code> in project root or domain root. Standardized machine-readable orientation for LLMs and autonomous agents.
        </p>
      )}
      {format === "architecture_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">ARCHITECTURE.md</code> in repository root. Establishes non-negotiable data flow and system state invariants.
        </p>
      )}
      {format === "prd_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">PRD.md</code> in repository root. Authoritative product requirements, user personas, and milestone roadmap.
        </p>
      )}
      {format === "design_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">DESIGN.md</code> in repository root. UI/UX design tokens, single-canvas layout rules, and negative guardrails.
        </p>
      )}
      {format === "task_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">TASK.md</code> in repository root. Active sprint tracker, mandatory verification gates, and agent session log.
        </p>
      )}
      {format === "memory_md" && (
        <p className="text-xs text-zinc-600 leading-relaxed font-sans">
          Save as <code className="px-1.5 py-0.5 rounded-md bg-white border border-orange-200 text-orange-950 font-mono text-[11px] font-semibold shadow-2xs break-all sm:break-normal">MEMORY.md</code> in repository root. Persistent agent brain: tech context, ADRs, operational gotchas, and 5-step loop.
        </p>
      )}

      {/* AI kit preview: the exact paths the ZIP export writes, so users know what lands in their repo */}
      <details className="group border-t border-orange-100 pt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded text-xs font-medium text-zinc-700 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 [&::-webkit-details-marker]:hidden">
          <span>What&apos;s in the ZIP export ({kitPaths.length} files)</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="mt-1.5 text-[11px] text-zinc-500">Unzip into your project root. Every file is already in the folder its tool reads from.</p>
        <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-zinc-600">
          {kitPaths.map((path) => (
            <li
              key={path}
              className={cn("truncate", path === activePath && "font-semibold text-orange-800")}
              title={path}
            >
              {path}
              {path === activePath && <span className="font-sans font-normal text-orange-700"> (open in editor)</span>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
