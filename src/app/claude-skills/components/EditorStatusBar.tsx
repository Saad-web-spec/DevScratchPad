"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { RuleAuditReport } from "../lib/ruleAuditor";
import type { OutputFormat } from "../lib/ruleGenerator";

export interface EditorStatusBarProps {
  format: OutputFormat;
  lineCount: number;
  auditReport: RuleAuditReport;
  showAuditPanel: boolean;
  setShowAuditPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Bottom status bar under the editor: language, encoding and line metrics, plus the audit score button that toggles the audit panel. */
export function EditorStatusBar({
  format,
  lineCount,
  auditReport,
  showAuditPanel,
  setShowAuditPanel,
}: EditorStatusBarProps) {
  return (
    <div className="px-3 py-1.5 bg-[#121316] border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono select-none shrink-0 gap-2">
      {/* Left: File and Editor Metrics */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex items-center gap-1 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span className="text-[10px] uppercase font-semibold text-zinc-300">
            {format === "mcp_json" || format === "gemini_prompts"
              ? "JSON"
              : format === "cursor_mdc"
              ? "MDC"
              : format === "cursorignore" || format === "claudeignore"
              ? "IGNORE"
              : "Markdown"}
          </span>
        </span>
        <span className="hidden sm:inline text-zinc-700">•</span>
        <span className="hidden sm:inline text-zinc-500 text-[10px]">UTF-8</span>
        <span className="hidden sm:inline text-zinc-700">•</span>
        <span className="text-zinc-400 text-[10px]">{lineCount} Lines</span>
        <span className="hidden md:inline text-zinc-700">•</span>
        <span className="hidden md:inline text-zinc-500 text-[10px]">Spaces: 2</span>
      </div>

      {/* Right: Anchored Audit Launcher Button (Black/Zinc + Orange Star, NO flashy gold) */}
      <button
        type="button"
        onClick={() => setShowAuditPanel((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0",
          showAuditPanel
            ? "bg-zinc-800 text-white border-zinc-600"
            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/80"
        )}
        title="Toggle Rule Quality & Security Audit"
      >
        <Image src="/orange-star.png" width={14} height={14}  className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
        <span className="font-semibold text-zinc-100">{auditReport.overallScore}/100</span>
        <span className="text-zinc-600">·</span>
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{auditReport.gradeLabel}</span>
        <span className="text-[10px] text-zinc-500 ml-0.5">{showAuditPanel ? "▼" : "▲"}</span>
      </button>
    </div>
  );
}
