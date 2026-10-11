"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditDimension, RuleAuditReport } from "../lib/ruleAuditor";
import type { OutputFormat } from "../lib/ruleGenerator";

export type AuditTab = "findings" | "checklist";

export interface AuditPanelProps {
  auditReport: RuleAuditReport;
  format: OutputFormat;
  auditTab: AuditTab;
  setAuditTab: (tab: AuditTab) => void;
  selectedDimension: AuditDimension | "all";
  setSelectedDimension: React.Dispatch<React.SetStateAction<AuditDimension | "all">>;
  auditCopied: boolean;
  setShowAuditPanel: React.Dispatch<React.SetStateAction<boolean>>;
  handleCopyAuditReport: () => void;
  handleAutoFixAll: () => void;
  handleInjectNegativeGuardrails: () => void;
  handleFixVaguePhrases: () => void;
  handleScopeGlobs: () => void;
  handleFixFormatCompliance: () => void;
  handleFixBroadTriggers: () => void;
  handleInjectCodeBlock: () => void;
}

/** Rule Quality Audit panel floating over the editor: score header, 5-dimension filters, findings with one-click fixes, and the rule checklist. */
export function AuditPanel({
  auditReport,
  format,
  auditTab,
  setAuditTab,
  selectedDimension,
  setSelectedDimension,
  auditCopied,
  setShowAuditPanel,
  handleCopyAuditReport,
  handleAutoFixAll,
  handleInjectNegativeGuardrails,
  handleFixVaguePhrases,
  handleScopeGlobs,
  handleFixFormatCompliance,
  handleFixBroadTriggers,
  handleInjectCodeBlock,
}: AuditPanelProps) {
  // Filtered issues based on selected dimension
  const filteredIssues = useMemo(() => {
    if (selectedDimension === "all") return auditReport.allIssues;
    return auditReport.allIssues.filter((issue) => issue.dimension === selectedDimension);
  }, [auditReport.allIssues, selectedDimension]);

  return (
    <div className="absolute bottom-2 right-3 left-3 sm:left-auto sm:w-[460px] z-30 rounded-xl border border-zinc-800 bg-[#121316]/98 backdrop-blur-xl shadow-2xl shadow-black/90 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col max-h-[380px]">
      {/* Header Bar: Clean Dark Monochrome (Responsive on mobile with zero text overlap) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 border-b border-zinc-800/80 bg-[#121316] shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <span className="font-mono text-[11px] sm:text-xs font-bold text-zinc-200 tracking-wider flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Image src="/orange-star.png" width={16} height={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" alt="Star" />
            <span><span className="hidden sm:inline">RULE </span>AUDIT</span>
          </span>

          {/* Clean Dark Badge (Responsive: score on mobile, full label on tablet/desktop) */}
          <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 truncate max-w-[130px] sm:max-w-none">
            {auditReport.overallScore}/100<span className="hidden sm:inline"> · {auditReport.gradeLabel.toUpperCase()}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* One-click Copy Audit Report (Icon-only on mobile, full text on tablet/desktop) */}
          <button
            type="button"
            onClick={handleCopyAuditReport}
            className="text-zinc-400 hover:text-zinc-200 text-[11px] font-mono flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
            title="Copy audit report summary to clipboard"
            aria-label="Copy audit report"
          >
            {auditCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{auditCopied ? "Copied" : "Copy Report"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditPanel(false)}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
            title="Close audit panel"
            aria-label="Close audit panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Standardized 5-Column Metric Grid (Interactive Troubleshooting Filters) */}
      <div className="p-2 sm:p-2.5 bg-[#121316]/90 border-b border-zinc-800/80 shrink-0">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {/* Triggers */}
          <button
            type="button"
            onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "triggers" ? "all" : "triggers"))}
            className={cn(
              "flex flex-col items-start min-w-0 p-1 sm:p-1.5 rounded-lg text-left transition-colors cursor-pointer border",
              selectedDimension === "triggers"
                ? "bg-zinc-800/80 border-zinc-500"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
            )}
            title="Click to filter Trigger Specificity diagnostics"
          >
            <span className="text-[10px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate w-full">TRIGGERS</span>
            <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.triggers.score}%</span>
          </button>

          {/* Density */}
          <button
            type="button"
            onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "tokenDensity" ? "all" : "tokenDensity"))}
            className={cn(
              "flex flex-col items-start min-w-0 p-1 sm:p-1.5 rounded-lg text-left transition-colors cursor-pointer border",
              selectedDimension === "tokenDensity"
                ? "bg-zinc-800/80 border-zinc-500"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
            )}
            title="Click to filter Rule Density diagnostics"
          >
            <span className="text-[10px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate w-full">DENSITY</span>
            <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-zinc-100">~{auditReport.tokenCount}t</span>
          </button>

          {/* Guardrails */}
          <button
            type="button"
            onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "guardrails" ? "all" : "guardrails"))}
            className={cn(
              "flex flex-col items-start min-w-0 p-1 sm:p-1.5 rounded-lg text-left transition-colors cursor-pointer border",
              selectedDimension === "guardrails"
                ? "bg-zinc-800/80 border-zinc-500"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
            )}
            title="Click to filter Negative Guardrails diagnostics"
          >
            <span className="text-[10px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate w-full">GUARDS</span>
            <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.guardrails.score}%</span>
          </button>

          {/* Format Compliance */}
          <button
            type="button"
            onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "formatCompliance" ? "all" : "formatCompliance"))}
            className={cn(
              "flex flex-col items-start min-w-0 p-1 sm:p-1.5 rounded-lg text-left transition-colors cursor-pointer border",
              selectedDimension === "formatCompliance"
                ? "bg-zinc-800/80 border-zinc-500"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
            )}
            title="Click to filter Format Compliance diagnostics"
          >
            <span className="text-[10px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate w-full">FORMAT</span>
            <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.formatCompliance.score}%</span>
          </button>

          {/* Architectural Boundaries */}
          <button
            type="button"
            onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "architecture" ? "all" : "architecture"))}
            className={cn(
              "flex flex-col items-start min-w-0 p-1 sm:p-1.5 rounded-lg text-left transition-colors cursor-pointer border",
              selectedDimension === "architecture"
                ? "bg-zinc-800/80 border-zinc-500"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
            )}
            title="Click to filter Architectural Boundaries diagnostics"
          >
            <span className="text-[10px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate w-full">ARCH</span>
            <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.architecture.score}%</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Findings vs Checklist (Actionable & Powerful) */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 bg-[#121316] border-b border-zinc-800/60 text-xs font-mono shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setAuditTab("findings");
              setSelectedDimension("all");
            }}
            className={cn(
              "px-2 sm:px-2.5 py-1.5 border-b-2 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer",
              auditTab === "findings"
                ? "border-zinc-300 text-zinc-100 bg-zinc-800/40"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Findings ({auditReport.allIssues.length})
          </button>
          <button
            type="button"
            onClick={() => setAuditTab("checklist")}
            className={cn(
              "px-2 sm:px-2.5 py-1.5 border-b-2 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer",
              auditTab === "checklist"
                ? "border-zinc-300 text-zinc-100 bg-zinc-800/40"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            <span className="hidden sm:inline">Rule </span>Checklist
          </button>
        </div>

        {auditReport.allIssues.length > 0 && (
          <button
            type="button"
            onClick={handleAutoFixAll}
            className="text-[10px] font-mono font-semibold text-zinc-900 bg-white hover:bg-zinc-200 px-1.5 sm:px-2 py-0.5 rounded transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Automatically remediate all detected issues"
          >
            ⚡ Auto-Fix<span className="hidden sm:inline"> All</span>
          </button>
        )}
      </div>

      {/* Tab Body (Scrollable) */}
      <div className="overflow-y-auto p-3 space-y-2.5 bg-[#121316]/50 scrollbar-thin text-xs">
        {auditTab === "findings" ? (
          <>
            {/* Dimension Filter Indicator */}
            {selectedDimension !== "all" && (
              <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono">
                <span className="text-zinc-400">
                  Filtered: <strong className="text-zinc-200 uppercase">{selectedDimension}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDimension("all")}
                  className="text-zinc-300 hover:text-white underline cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{auditReport.summary}</p>

            {filteredIssues.length === 0 ? (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[11px] font-sans">
                <Image src="/orange-star.png" width={14} height={14}  className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-zinc-200">Zero Deficiencies Detected</div>
                  <div className="text-[10px] text-zinc-400">
                    Token economy ~{auditReport.tokenCount} tok • Explicit negative guard clauses verified • High trigger accuracy.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      "p-2.5 rounded-lg border text-[11px] space-y-1 font-sans",
                      issue.severity === "error"
                        ? "bg-rose-950/30 border-rose-900/60 text-rose-200"
                        : issue.severity === "warning"
                        ? "bg-amber-950/20 border-amber-900/50 text-amber-200"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{issue.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/50 text-zinc-300">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">{issue.message}</p>
                    <p className="text-[10px] text-zinc-400">
                      <span className="font-bold text-zinc-300 font-mono">Tip: </span>
                      {issue.suggestion}
                    </p>

                    {/* Direct Action Buttons for Immediate Fix */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {issue.id === "guardrails-no-negative-constraints" && (
                        <button
                          type="button"
                          onClick={handleInjectNegativeGuardrails}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>+ Inject Standard Guardrails</span>
                        </button>
                      )}
                      {issue.id.startsWith("vague-") && (
                        <button
                          type="button"
                          onClick={handleFixVaguePhrases}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>+ Replace with Concrete Rules</span>
                        </button>
                      )}
                      {issue.id === "trigger-cursor-global-unscoped" && (
                        <button
                          type="button"
                          onClick={handleScopeGlobs}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>{"+ Scope Globs (src/**/*.{ts,tsx})"}</span>
                        </button>
                      )}
                      {issue.id.startsWith("format-") && (
                        <button
                          type="button"
                          onClick={handleFixFormatCompliance}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>+ Fix Format Syntax</span>
                        </button>
                      )}
                      {issue.id.startsWith("trigger-") && (
                        <button
                          type="button"
                          onClick={handleFixBroadTriggers}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>+ Refine Triggers & Chips</span>
                        </button>
                      )}
                      {issue.id === "clarity-no-code-blocks" && (
                        <button
                          type="button"
                          onClick={handleInjectCodeBlock}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <span>+ Add Code Reference</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Checklist Tab: 5-Pillar Quality Audit Verification */
          <div className="space-y-2 font-sans">
            <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 font-mono">1. Trigger Specificity</span>
                <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.triggers.score >= 80 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                  {auditReport.dimensions.triggers.score >= 80 ? "Passed" : "Review Scope"}
                </span>
              </div>
              <p className="text-zinc-400 text-[10px]">
                Evaluates trigger chips, activation phrase precision, and glob scoping so rules only activate when relevant.
              </p>
            </div>

            <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 font-mono">2. Rule Density</span>
                <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.tokenCount <= 1200 && auditReport.tokenCount >= 70 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                  {auditReport.tokenCount <= 1200 && auditReport.tokenCount >= 70 ? "Optimal" : "Attention"}
                </span>
              </div>
              <p className="text-zinc-400 text-[10px]">
                ~{auditReport.tokenCount} tokens footprint. Keeps context lean without degrading instruction recall.
              </p>
            </div>

            <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 font-mono">4. Format Compliance</span>
                <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.formatCompliance.score >= 80 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                  {auditReport.dimensions.formatCompliance.score >= 80 ? "Passed" : "Syntax Check"}
                </span>
              </div>
              <p className="text-zinc-400 text-[10px]">
                Validates syntax and header metadata formatting for target standard ({format}).
              </p>
            </div>

            <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 font-mono">5. Architectural Boundaries</span>
                <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.architecture.score >= 80 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                  {auditReport.dimensions.architecture.score >= 80 ? "Passed" : "Review Rules"}
                </span>
              </div>
              <p className="text-zinc-400 text-[10px]">
                {auditReport.dimensions.architecture.score >= 80
                  ? "Concrete technical parameters free of vague directives ('write clean code')."
                  : "Found vague directives. Use '+ Replace with Concrete Rules'."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
