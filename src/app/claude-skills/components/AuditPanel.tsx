"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Check, Copy, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditDimension, AuditIssue, RuleAuditReport } from "../lib/ruleAuditor";
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

const DIMENSIONS: { id: AuditDimension; label: string; name: string; hint: string }[] = [
  { id: "triggers", label: "Triggers", name: "Trigger specificity", hint: "Trigger chips, activation phrases and glob scope." },
  { id: "tokenDensity", label: "Density", name: "Rule density", hint: "Context footprint; lean rules keep recall high." },
  { id: "guardrails", label: "Guards", name: "Negative guardrails", hint: "Explicit \"never / do not\" constraints." },
  { id: "formatCompliance", label: "Format", name: "Format compliance", hint: "Syntax and header metadata for the target file." },
  { id: "architecture", label: "Arch", name: "Architectural boundaries", hint: "Concrete parameters instead of vague directives." },
];

/** Score tone: zinc when healthy, amber when it needs review, rose when failing. */
function tone(score: number) {
  if (score >= 80) return { bar: "fill-zinc-900", text: "text-zinc-900" };
  if (score >= 50) return { bar: "fill-amber-500", text: "text-amber-600" };
  return { bar: "fill-rose-500", text: "text-rose-600" };
}

const SEVERITY_DOT: Record<AuditIssue["severity"], string> = {
  error: "bg-rose-500",
  warning: "bg-amber-400",
  info: "bg-zinc-400",
};

const fixBtn =
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 font-mono text-[10px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer";

/** Rule Quality Audit panel floating over the editor: score header, 5-dimension meters (click to filter), findings with one-click fixes, and the rule checklist. */
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

  /** One-click remediations available for an issue (most specific first). */
  const fixesFor = (issue: AuditIssue): { label: string; onClick: () => void }[] => {
    const fixes: { label: string; onClick: () => void }[] = [];
    if (issue.id === "guardrails-no-negative-constraints") fixes.push({ label: "Inject guardrails", onClick: handleInjectNegativeGuardrails });
    if (issue.id.startsWith("vague-")) fixes.push({ label: "Make concrete", onClick: handleFixVaguePhrases });
    if (issue.id === "trigger-cursor-global-unscoped") fixes.push({ label: "Scope globs", onClick: handleScopeGlobs });
    if (issue.id.startsWith("format-")) fixes.push({ label: "Fix syntax", onClick: handleFixFormatCompliance });
    if (issue.id.startsWith("trigger-")) fixes.push({ label: "Refine triggers", onClick: handleFixBroadTriggers });
    if (issue.id === "clarity-no-code-blocks") fixes.push({ label: "Add code reference", onClick: handleInjectCodeBlock });
    return fixes;
  };

  const densityOk = auditReport.tokenCount >= 70 && auditReport.tokenCount <= 1200;
  const overall = tone(auditReport.overallScore);
  const issueCount = auditReport.allIssues.length;
  const activeDimension = DIMENSIONS.find((d) => d.id === selectedDimension);

  return (
    <div className="absolute bottom-2 left-3 right-3 z-30 flex max-h-[360px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-black/50 ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 duration-150 sm:left-auto sm:w-[420px]">
      {/* Header: score + grade, copy, close */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-200 pl-3 pr-1.5">
        <Image src="/orange-star.png" width={16} height={16} className="size-4 shrink-0 object-contain" alt="" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-900">Audit</span>
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("font-mono text-base font-bold tabular-nums leading-none", overall.text)}>{auditReport.overallScore}</span>
          <span className="font-mono text-[10px] text-zinc-400">/100</span>
          <span className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">· {auditReport.gradeLabel}</span>
        </span>
        <div className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            onClick={handleCopyAuditReport}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            title="Copy audit report summary to clipboard"
            aria-label="Copy audit report"
          >
            {auditCopied ? <Check className="size-3.5 text-zinc-900" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{auditCopied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAuditPanel(false)}
            className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            title="Close audit panel"
            aria-label="Close audit panel"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 5-dimension meters (click to filter findings) */}
      <div className="grid shrink-0 grid-cols-5 border-b border-zinc-200 bg-zinc-50/60">
        {DIMENSIONS.map((d, i) => {
          const score = auditReport.dimensions[d.id].score;
          const t = tone(score);
          const active = selectedDimension === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setAuditTab("findings");
                setSelectedDimension((prev) => (prev === d.id ? "all" : d.id));
              }}
              aria-pressed={active}
              className={cn(
                "flex min-w-0 flex-col gap-1 px-2.5 py-2 text-left transition-colors cursor-pointer",
                i > 0 && "border-l border-zinc-200",
                active ? "bg-white shadow-[inset_0_-2px_0_0_#18181b]" : "hover:bg-white"
              )}
              title={`${d.name}: ${d.hint} Click to filter.`}
            >
              <span className={cn("truncate font-mono text-[9px] uppercase tracking-wider", active ? "text-zinc-900" : "text-zinc-500")}>
                {d.label}
              </span>
              <span className={cn("font-mono text-xs font-semibold tabular-nums leading-none", t.text)}>
                {d.id === "tokenDensity" ? `~${auditReport.tokenCount}t` : `${score}%`}
              </span>
              <svg className="h-0.5 w-full overflow-hidden rounded-full" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="1" className="fill-zinc-200" />
                <rect width={Math.max(4, Math.min(100, score))} height="1" className={t.bar} />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Tabs + Auto-fix */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-zinc-200 px-1.5 font-mono">
        {(
          [
            { id: "findings", label: "Findings", count: issueCount },
            { id: "checklist", label: "Checklist", count: null },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAuditTab(tab.id);
              if (tab.id === "findings") setSelectedDimension("all");
            }}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold transition-colors cursor-pointer",
              auditTab === tab.id ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={cn("rounded px-1 text-[10px] tabular-nums", tab.count > 0 ? "bg-zinc-900 text-white" : "text-zinc-400")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {issueCount > 0 && (
          <button
            type="button"
            onClick={handleAutoFixAll}
            className="ml-auto inline-flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2 text-[11px] font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-95 cursor-pointer"
            title="Automatically remediate all detected issues"
          >
            <Wand2 className="size-3.5" />
            Auto-fix all
          </button>
        )}
      </div>

      {/* Body (scrollable) */}
      <div className="min-h-0 overflow-y-auto scrollbar-thin">
        {auditTab === "findings" ? (
          <>
            {activeDimension ? (
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 font-mono text-[10px]">
                <span className="truncate text-zinc-500">
                  Showing <span className="font-semibold text-zinc-900">{activeDimension.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDimension("all")}
                  className="shrink-0 text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline cursor-pointer"
                >
                  Show all
                </button>
              </div>
            ) : (
              <p className="border-b border-zinc-100 px-3 py-2 text-[11px] leading-relaxed text-zinc-600">{auditReport.summary}</p>
            )}

            {filteredIssues.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 text-[11px]">
                <Check className="size-3.5 shrink-0 text-zinc-900" />
                <span className="font-medium text-zinc-900">No issues{activeDimension ? " in this dimension" : ""}.</span>
                <span className="truncate text-zinc-400">~{auditReport.tokenCount} tokens · guardrails verified</span>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filteredIssues.map((issue) => {
                  const fixes = fixesFor(issue);
                  return (
                    <li key={issue.id} className="space-y-1 px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", SEVERITY_DOT[issue.severity])} aria-hidden="true" />
                        <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-zinc-900">{issue.title}</span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-zinc-400">{issue.severity}</span>
                      </div>
                      <p className="pl-3.5 text-[11px] leading-relaxed text-zinc-500">
                        {issue.message} <span className="text-zinc-700">{issue.suggestion}</span>
                      </p>
                      {fixes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-3.5 pt-0.5">
                          {fixes.map((fix) => (
                            <button key={fix.label} type="button" onClick={fix.onClick} className={fixBtn}>
                              <Wand2 className="size-3" />
                              {fix.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          /* Checklist: the five weighted pillars */
          <ul className="divide-y divide-zinc-100">
            {DIMENSIONS.map((d, i) => {
              const score = auditReport.dimensions[d.id].score;
              const passed = d.id === "tokenDensity" ? densityOk : score >= 80;
              const t = tone(passed ? 100 : score);
              const hint =
                d.id === "tokenDensity"
                  ? `~${auditReport.tokenCount} tokens. ${d.hint}`
                  : d.id === "formatCompliance"
                  ? `${d.hint} (${format})`
                  : d.hint;
              return (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-3 shrink-0 font-mono text-[10px] text-zinc-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-zinc-900">{d.name}</div>
                    <div className="truncate text-[10px] text-zinc-500" title={hint}>
                      {hint}
                    </div>
                  </div>
                  <span className={cn("shrink-0 font-mono text-[11px] font-semibold tabular-nums", t.text)}>{score}%</span>
                  <span
                    className={cn(
                      "inline-flex h-5 w-14 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold uppercase tracking-wider",
                      passed ? "bg-zinc-100 text-zinc-700" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {passed ? "Pass" : "Review"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
