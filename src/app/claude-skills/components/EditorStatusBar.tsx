"use client";

import React from "react";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
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

      {/* Right: Audit launcher (white pill, matches the white audit panel; orange star) */}
      <button
        type="button"
        data-tour="audit"
        onClick={() => setShowAuditPanel((prev) => !prev)}
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-full border pl-1.5 pr-2 text-xs font-mono font-medium shadow-sm transition-colors cursor-pointer shrink-0",
          showAuditPanel
            ? "border-white bg-white text-zinc-900 ring-2 ring-white/30"
            : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
        )}
        title="Toggle Rule Quality & Security Audit"
        aria-expanded={showAuditPanel}
      >
        <Image src="/orange-star.png" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0" alt="" />
        <span
          className={cn(
            "font-bold tabular-nums",
            auditReport.overallScore >= 80 ? "text-zinc-900" : auditReport.overallScore >= 50 ? "text-amber-600" : "text-rose-600"
          )}
        >
          {auditReport.overallScore}
          <span className="font-normal text-zinc-400">/100</span>
        </span>
        <span className="hidden sm:inline text-zinc-300">·</span>
        <span className="hidden sm:inline text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{auditReport.gradeLabel}</span>
        <ChevronUp className={cn("size-3.5 text-zinc-500 transition-transform", showAuditPanel && "rotate-180")} aria-hidden="true" />
      </button>
    </div>
  );
}
