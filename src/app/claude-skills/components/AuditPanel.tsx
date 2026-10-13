"use client";

import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Copy, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSectionBreakdown, TOKEN_BUDGET, type AuditDimension, type AuditIssue, type RuleAuditReport } from "../lib/ruleAuditor";
import type { OutputFormat } from "../lib/ruleGenerator";

export type AuditTab = "findings" | "checklist" | "budget";

export interface AuditPanelProps {
  auditReport: RuleAuditReport;
  /** Editor text the report was computed from; feeds the per-section token budget. */
  content: string;
  format: OutputFormat;
  auditTab: AuditTab;
  setAuditTab: (tab: AuditTab) => void;
  selectedDimension: AuditDimension | "all";
  setSelectedDimension: React.Dispatch<React.SetStateAction<AuditDimension | "all">>;
  auditCopied: boolean;
  setShowAuditPanel: React.Dispatch<React.SetStateAction<boolean>>;
  /** Scrolls the editor to a 1-based line and selects it. */
  onRevealLine: (line: number) => void;
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
  if (score >= 80) return { bar: "fill-zinc-900", stroke: "stroke-zinc-900", text: "text-zinc-900" };
  if (score >= 50) return { bar: "fill-amber-500", stroke: "stroke-amber-500", text: "text-amber-600" };
  return { bar: "fill-rose-500", stroke: "stroke-rose-500", text: "text-rose-600" };
}

const SEVERITY_RANK: Record<AuditIssue["severity"], number> = { error: 0, warning: 1, info: 2 };

const SEVERITY_STYLE: Record<AuditIssue["severity"], { dot: string; pill: string; text: string }> = {
  error: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700", text: "text-rose-600" },
  warning: { dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700", text: "text-amber-600" },
  info: { dot: "bg-zinc-400", pill: "bg-zinc-100 text-zinc-600", text: "text-zinc-500" },
};

const actionBtn =
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 font-mono text-[10px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Circular score gauge for the panel header. */
function ScoreRing({ score }: { score: number }) {
  const r = 15;
  const circumference = 2 * Math.PI * r;
  const t = tone(score);
  return (
    <div className="relative size-10 shrink-0">
      <svg viewBox="0 0 36 36" className="size-10 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-zinc-200" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, score)) / 100)}
          className={cn("transition-[stroke-dashoffset] duration-500", t.stroke)}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center font-mono text-[13px] font-bold tabular-nums", t.text)}>
        {score}
      </span>
    </div>
  );
}

/** Rule Quality Audit panel floating over the editor: score header, 5-dimension meters (click to filter), findings with one-click fixes and line jumps, the rule checklist, and a per-section token budget. */
export function AuditPanel({
  auditReport,
  content,
  format,
  auditTab,
  setAuditTab,
  selectedDimension,
  setSelectedDimension,
  auditCopied,
  setShowAuditPanel,
  onRevealLine,
  handleCopyAuditReport,
  handleAutoFixAll,
  handleInjectNegativeGuardrails,
  handleFixVaguePhrases,
  handleScopeGlobs,
  handleFixFormatCompliance,
  handleFixBroadTriggers,
  handleInjectCodeBlock,
}: AuditPanelProps) {
  // Escape closes the panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAuditPanel(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowAuditPanel]);

  // Findings for the selected dimension, most severe first
  const filteredIssues = useMemo(() => {
    const issues =
      selectedDimension === "all" ? auditReport.allIssues : auditReport.allIssues.filter((issue) => issue.dimension === selectedDimension);
    return [...issues].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [auditReport.allIssues, selectedDimension]);

  const sections = useMemo(() => getSectionBreakdown(content).sort((a, b) => b.tokens - a.tokens), [content]);

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

  const overall = tone(auditReport.overallScore);
  const issueCount = auditReport.allIssues.length;
  const fixableCount = auditReport.allIssues.filter((issue) => fixesFor(issue).length > 0).length;
  const activeDimension = DIMENSIONS.find((d) => d.id === selectedDimension);
  const severityCounts = (["error", "warning", "info"] as const)
    .map((severity) => ({ severity, count: auditReport.allIssues.filter((i) => i.severity === severity).length }))
    .filter((s) => s.count > 0);

  const tokens = auditReport.tokenCount;
  const budgetStatus =
    tokens > TOKEN_BUDGET.max
      ? { label: `~${tokens - TOKEN_BUDGET.max} over budget`, className: "text-amber-600" }
      : tokens > TOKEN_BUDGET.ceiling
      ? { label: "Near the ceiling", className: "text-zinc-600" }
      : tokens < TOKEN_BUDGET.sparse
      ? { label: "Critically sparse", className: "text-rose-600" }
      : tokens < TOKEN_BUDGET.lean
      ? { label: "Sparse", className: "text-amber-600" }
      : { label: "In the ideal range", className: "text-zinc-600" };
  const scaleMax = Math.max(TOKEN_BUDGET.max * 1.25, tokens * 1.05);
  const x = (value: number) => (value / scaleMax) * 100;
  const densityTone = tone(auditReport.dimensions.tokenDensity.score);
  const heaviest = sections[0]?.tokens ?? 1;

  const openDimension = (id: AuditDimension) => {
    setAuditTab("findings");
    setSelectedDimension((prev) => (prev === id && auditTab === "findings" ? "all" : id));
  };

  return (
    <div
      role="dialog"
      aria-label="Rule quality audit"
      className="absolute bottom-2 left-2 right-2 z-30 flex max-h-[min(460px,calc(100%_-_1rem))] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-black/50 ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 duration-150 sm:left-auto sm:w-[440px]"
    >
      {/* Header: score ring, grade, severity summary, copy, close */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-zinc-200 py-2 pl-3 pr-1.5">
        <ScoreRing score={auditReport.overallScore} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Image src="/orange-star.png" width={12} height={12} className="size-3 shrink-0 object-contain" alt="" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rule audit</span>
            <span className="rounded bg-zinc-100 px-1 font-mono text-[10px] font-bold text-zinc-700">{auditReport.grade}</span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-[12px]">
            <span className={cn("truncate font-semibold", overall.text)}>{auditReport.gradeLabel}</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-400">~{tokens}t</span>
            {severityCounts.length === 0 ? (
              <span className="shrink-0 font-mono text-[10px] text-zinc-500">· no issues</span>
            ) : (
              severityCounts.map(({ severity, count }) => (
                <span key={severity} className={cn("shrink-0 font-mono text-[10px]", SEVERITY_STYLE[severity].text)}>
                  · {plural(count, severity)}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={handleCopyAuditReport}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            title="Copy the audit report as Markdown"
            aria-label="Copy audit report"
          >
            {auditCopied ? <Check className="size-3.5 text-zinc-900" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{auditCopied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAuditPanel(false)}
            className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            title="Close (Esc)"
            aria-label="Close audit panel"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 5-dimension meters (click to filter findings) */}
      <div className="grid shrink-0 grid-cols-5 border-b border-zinc-200 bg-zinc-50/60">
        {DIMENSIONS.map((d, i) => {
          const { score, issues } = auditReport.dimensions[d.id];
          const t = tone(score);
          const active = auditTab === "findings" && selectedDimension === d.id;
          const worst = [...issues].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0];
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => openDimension(d.id)}
              aria-pressed={active}
              className={cn(
                "flex min-w-0 flex-col gap-1 px-2.5 py-2 text-left transition-colors cursor-pointer",
                i > 0 && "border-l border-zinc-200",
                active ? "bg-white shadow-[inset_0_-2px_0_0_#f97316]" : "hover:bg-white"
              )}
              title={`${d.name}: ${d.hint}${issues.length ? ` ${plural(issues.length, "finding")}.` : ""} Click to filter.`}
            >
              <span className="flex items-center gap-1">
                <span className={cn("truncate font-mono text-[9px] uppercase tracking-wider", active ? "text-zinc-900" : "text-zinc-500")}>
                  {d.label}
                </span>
                {worst && <span className={cn("size-1.5 shrink-0 rounded-full", SEVERITY_STYLE[worst.severity].dot)} aria-hidden="true" />}
              </span>
              <span className={cn("font-mono text-xs font-semibold tabular-nums leading-none", t.text)}>
                {d.id === "tokenDensity" ? `~${tokens}t` : `${score}%`}
              </span>
              <svg className="h-1 w-full overflow-hidden rounded-full" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="1" className="fill-zinc-200" />
                <rect width={Math.max(4, Math.min(100, score))} height="1" className={t.bar} />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Tabs + Auto-fix */}
      <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-zinc-200 px-1.5 font-mono" role="tablist">
        {(
          [
            { id: "findings", label: "Findings", count: issueCount },
            { id: "checklist", label: "Checklist", count: null },
            { id: "budget", label: "Budget", count: null },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={auditTab === tab.id}
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

        {fixableCount > 0 && (
          <button
            type="button"
            onClick={handleAutoFixAll}
            className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-95 cursor-pointer"
            title={`Apply one-click fixes for ${plural(fixableCount, "finding")}`}
          >
            <Wand2 className="size-3.5" />
            Auto-fix
            <span className="rounded bg-white/15 px-1 text-[10px] tabular-nums">{fixableCount}</span>
          </button>
        )}
      </div>

      {/* Body (scrollable) */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
        {auditTab === "findings" && (
          <>
            {activeDimension ? (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 font-mono text-[10px]">
                <span className="truncate text-zinc-500">
                  Showing <span className="font-semibold text-zinc-900">{activeDimension.name}</span> ·{" "}
                  {auditReport.dimensions[activeDimension.id].score}%
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
              <div className="flex items-center gap-2 px-3 py-4 text-[11px]">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                  <Check className="size-3 text-zinc-900" />
                </span>
                <span className="font-medium text-zinc-900">No issues{activeDimension ? " in this dimension" : ""}.</span>
                <span className="truncate text-zinc-400">~{tokens} tokens checked</span>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filteredIssues.map((issue) => {
                  const fixes = fixesFor(issue);
                  const style = SEVERITY_STYLE[issue.severity];
                  const isBudgetIssue = issue.dimension === "tokenDensity" && tokens > TOKEN_BUDGET.ceiling;
                  return (
                    <li key={issue.id} className="flex gap-2.5 px-3 py-2.5">
                      <span className={cn("mt-[5px] size-1.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-zinc-900">{issue.title}</span>
                          <span className={cn("shrink-0 rounded px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider", style.pill)}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-500">{issue.message}</p>
                        <p className="border-l-2 border-zinc-200 pl-2 text-[11px] leading-relaxed text-zinc-700">{issue.suggestion}</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {fixes.map((fix) => (
                            <button key={fix.label} type="button" onClick={fix.onClick} className={actionBtn}>
                              <Wand2 className="size-3" />
                              {fix.label}
                            </button>
                          ))}
                          {issue.line !== undefined && (
                            <button
                              type="button"
                              onClick={() => onRevealLine(issue.line as number)}
                              className={actionBtn}
                              title={`Jump to line ${issue.line} in the editor`}
                            >
                              Line {issue.line}
                              <ArrowUpRight className="size-3" />
                            </button>
                          )}
                          {isBudgetIssue && (
                            <button type="button" onClick={() => setAuditTab("budget")} className={actionBtn}>
                              Heaviest sections
                              <ArrowUpRight className="size-3" />
                            </button>
                          )}
                          <span className="ml-auto truncate font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                            {DIMENSIONS.find((d) => d.id === issue.dimension)?.label}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {auditTab === "checklist" && (
          /* Checklist: the five weighted pillars; a row opens that dimension's findings */
          <ul className="divide-y divide-zinc-100">
            {DIMENSIONS.map((d, i) => {
              const { score, issues } = auditReport.dimensions[d.id];
              const passed = score >= 80;
              const t = tone(score);
              const hint =
                d.id === "tokenDensity"
                  ? `~${tokens} tokens. ${d.hint}`
                  : d.id === "formatCompliance"
                  ? `${d.hint} (${format})`
                  : d.hint;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => openDimension(d.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
                    title={issues.length ? `View ${plural(issues.length, "finding")}` : hint}
                  >
                    <span className="w-3 shrink-0 font-mono text-[10px] text-zinc-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-900">
                        {d.name}
                        <span className="font-mono text-[9px] font-normal text-zinc-400">20%</span>
                      </div>
                      <div className="truncate text-[10px] text-zinc-500">{hint}</div>
                    </div>
                    <span className={cn("w-9 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums", t.text)}>{score}%</span>
                    <span
                      className={cn(
                        "inline-flex h-5 w-14 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold uppercase tracking-wider",
                        passed ? "bg-zinc-100 text-zinc-700" : score >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {passed ? "Pass" : score >= 50 ? "Review" : "Fail"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {auditTab === "budget" && (
          <>
            {/* Token meter: ideal band, ceiling, and where this rule sits */}
            <div className="space-y-1.5 border-b border-zinc-100 px-3 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[12px] font-semibold tabular-nums text-zinc-900">
                  ~{tokens.toLocaleString()} tokens
                  <span className="ml-1.5 font-normal text-zinc-400">{auditReport.charCount.toLocaleString()} chars</span>
                </span>
                <span className={cn("font-mono text-[10px] font-semibold", budgetStatus.className)}>{budgetStatus.label}</span>
              </div>
              <svg className="h-2 w-full overflow-hidden rounded-full" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="2" className="fill-zinc-100" />
                <rect x={x(TOKEN_BUDGET.lean)} width={x(TOKEN_BUDGET.ceiling) - x(TOKEN_BUDGET.lean)} height="2" className="fill-zinc-300" />
                <rect x={x(TOKEN_BUDGET.ceiling)} width={x(TOKEN_BUDGET.max) - x(TOKEN_BUDGET.ceiling)} height="2" className="fill-zinc-200" />
                <rect width={Math.min(100, x(tokens))} height="2" className={cn("opacity-25", densityTone.bar)} />
                <rect x={Math.min(99, x(tokens))} width="1" height="2" className={densityTone.bar} />
              </svg>
              <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                <span>Ideal {TOKEN_BUDGET.lean}–{TOKEN_BUDGET.ceiling}</span>
                <span>Ceiling {TOKEN_BUDGET.max.toLocaleString()}</span>
              </div>
              {tokens > TOKEN_BUDGET.max && (
                <p className="pt-0.5 text-[11px] leading-relaxed text-zinc-600">
                  Trim ~{tokens - TOKEN_BUDGET.max} tokens, or move the heaviest sections below into their own scoped rule file.
                </p>
              )}
            </div>

            {/* Sections by weight; click to jump */}
            <div className="flex items-center justify-between px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
              <span>Sections by weight</span>
              <span>{plural(sections.length, "section")}</span>
            </div>
            <ul className="pb-1.5">
              {sections.map((s) => {
                const share = s.tokens / Math.max(1, tokens);
                const heavy = tokens > TOKEN_BUDGET.ceiling && share >= 0.2;
                return (
                  <li key={`${s.line}-${s.title}`}>
                    <button
                      type="button"
                      onClick={() => onRevealLine(s.line)}
                      className="group flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
                      title={`Jump to line ${s.line}`}
                    >
                      <span className="w-9 shrink-0 font-mono text-[10px] tabular-nums text-zinc-400">L{s.line}</span>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-800 group-hover:text-zinc-950">{s.title}</span>
                      <svg className="h-1 w-16 shrink-0 overflow-hidden rounded-full" viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
                        <rect width="100" height="1" className="fill-zinc-100" />
                        <rect width={Math.max(3, (s.tokens / heaviest) * 100)} height="1" className={heavy ? "fill-amber-500" : "fill-zinc-700"} />
                      </svg>
                      <span className={cn("w-11 shrink-0 text-right font-mono text-[10px] tabular-nums", heavy ? "text-amber-600" : "text-zinc-600")}>
                        ~{s.tokens}t
                      </span>
                      <span className="w-7 shrink-0 text-right font-mono text-[9px] tabular-nums text-zinc-400">{Math.round(share * 100)}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
