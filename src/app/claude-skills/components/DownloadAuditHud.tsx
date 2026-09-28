"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  ShieldCheck,
  Lock,
  Archive,
  FileText,
} from "lucide-react";
import type { OutputFormat } from "../lib/ruleGenerator";

// ─── Format Label Map ────────────────────────────────────────────────────
const FORMAT_LABELS: Record<OutputFormat, string> = {
  skill_md: "Claude Code Skill",
  claude_md: "CLAUDE.md Root Guidelines",
  cursor_mdc: "Cursor Rules (.mdc)",
  agents_md: "AGENTS.md Multi-Agent",
  mcp_json: "MCP Server Config",
  windsurf_cascade: "Windsurf Cascade",
  copilot_instructions: "GitHub Copilot",
  openai_instructions: "OpenAI Instructions",
  gemini_prompts: "Gemini System Instructions",
  cursorignore: ".cursorignore",
  claudeignore: ".claudeignore",
  llms_txt: "llms.txt",
  architecture_md: "ARCHITECTURE.md",
  prd_md: "PRD.md Governance",
  design_md: "DESIGN.md Governance",
  task_md: "TASK.md Governance",
  memory_md: "MEMORY.md Governance",
};

// ─── Props Interface ─────────────────────────────────────────────────────
export interface DownloadHudPayload {
  fileName: string;
  format: OutputFormat;
  tokenCount: number;
  charCount: number;
  auditScore: number;
  auditGrade: string;
  auditGradeLabel: string;
  auditIssuesCount: number;
  triggerCount: number;
  guardrailsScore: number;
  framework: string;
  language: string;
  isManuallyEdited: boolean;
  isZipExport: boolean;
}

interface DownloadAuditHudProps {
  payload: DownloadHudPayload | null;
  onDismiss: () => void;
  onViewAuditDetails: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────
const HUD_DURATION_MS = 5000;
const ENTER_DURATION_MS = 300;
const EXIT_DURATION_MS = 250;

// ─── Component ───────────────────────────────────────────────────────────
export function DownloadAuditHud({
  payload,
  onDismiss,
  onViewAuditDetails,
}: DownloadAuditHudProps) {
  const [phase, setPhase] = useState<"hidden" | "entering" | "active" | "exiting">("hidden");
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(HUD_DURATION_MS);
  const lastTickRef = useRef(Date.now());

  // ── Cleanup helper ────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  // ── Start the countdown bar ticking ───────────────────────────────
  const startCountdown = useCallback(() => {
    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      remainingRef.current = Math.max(0, remainingRef.current - delta);
      const pct = (remainingRef.current / HUD_DURATION_MS) * 100;
      setProgress(pct);
      if (remainingRef.current <= 0) {
        clearTimers();
        setPhase("exiting");
      }
    }, 16); // ~60fps for smooth bar
  }, [clearTimers]);

  // ── Pause / resume on hover ───────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;
    if (isHovered) {
      // Freeze: stop the interval, preserve remaining time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Resume countdown from where we left off
      startCountdown();
    }
  }, [isHovered, phase, startCountdown]);

  // ── React to new payload: trigger entrance ────────────────────────
  useEffect(() => {
    if (!payload) return;

    // Reset for new notification
    clearTimers();
    remainingRef.current = HUD_DURATION_MS;
    setProgress(100);
    setIsHovered(false);
    setPhase("entering");

    // After entrance animation, move to active
    const enterTimeout = setTimeout(() => {
      setPhase("active");
      startCountdown();
    }, ENTER_DURATION_MS);

    return () => {
      clearTimeout(enterTimeout);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  // ── Handle exit phase: unmount after transition ───────────────────
  useEffect(() => {
    if (phase !== "exiting") return;
    exitTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      onDismiss();
    }, EXIT_DURATION_MS);
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [phase, onDismiss]);

  // ── Escape key dismissal ──────────────────────────────────────────
  useEffect(() => {
    if (phase === "hidden") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearTimers();
        setPhase("exiting");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, clearTimers]);

  // ── Manual dismiss ────────────────────────────────────────────────
  const handleManualDismiss = useCallback(() => {
    clearTimers();
    setPhase("exiting");
  }, [clearTimers]);

  // ── View audit click: dismiss + open panel ────────────────────────
  const handleViewAudit = useCallback(() => {
    clearTimers();
    setPhase("exiting");
    onViewAuditDetails();
  }, [clearTimers, onViewAuditDetails]);

  // ── Don't render anything when hidden or no payload ───────────────
  if (phase === "hidden" || !payload) return null;

  // ── Computed values ───────────────────────────────────────────────
  const formatLabel = FORMAT_LABELS[payload.format] || payload.format;
  const isHighScore = payload.auditScore >= 80;
  const scoreColor = isHighScore ? "text-orange-800" : "text-amber-800";
  const scoreBg = isHighScore
    ? "bg-orange-50 border-orange-200/90"
    : "bg-amber-50 border-amber-200/90";
  const shieldColor = isHighScore ? "text-orange-600" : "text-amber-600";

  // ── Transition classes ────────────────────────────────────────────
  const transitionClass =
    phase === "entering"
      ? "translate-y-8 opacity-0 scale-95"
      : phase === "exiting"
        ? "translate-y-4 opacity-0 scale-[0.98]"
        : "translate-y-0 opacity-100 scale-100";

  // ── Build adjustment pills ────────────────────────────────────────
  const adjustmentPills: string[] = [];
  if (payload.framework) adjustmentPills.push(payload.framework);
  if (payload.language) adjustmentPills.push(payload.language);
  if (payload.triggerCount > 0) adjustmentPills.push(`${payload.triggerCount} Triggers`);
  if (payload.guardrailsScore >= 80) adjustmentPills.push("Guardrails Active");
  if (payload.isManuallyEdited) adjustmentPills.push("Manually Edited");

  const hudElement = (
    <div
      role="status"
      aria-live="polite"
      aria-label="Download verification notification"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        "fixed bottom-3 sm:bottom-5 left-1/2 z-[9999]",
        "w-[calc(100%-1.25rem)] max-w-lg sm:max-w-xl",
        "-translate-x-1/2",
        "transition-all duration-300",
        phase === "entering"
          ? "ease-[cubic-bezier(0.16,1,0.3,1)]"
          : "ease-in",
        transitionClass,
      ].join(" ")}
      style={{
        transitionDuration:
          phase === "entering"
            ? `${ENTER_DURATION_MS}ms`
            : `${EXIT_DURATION_MS}ms`,
      }}
    >
      {/* Formal White & Orange Container with crisp hairline border & layered ambient shadow */}
      <div className="relative bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-xl sm:rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(234,88,12,0.08)] overflow-hidden">
        
        {/* Subtle orange accent hairline at top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

        {/* ── Row 1: Status Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4.5 pt-3 sm:pt-3.5 pb-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Main AI Skill Studio Folder Icon */}
            <div className="relative shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50/90 border border-orange-200/80 shadow-xs">
              <Image
                src="/ai-skill-icon.png"
                width={20}
                height={16}
                alt="AI Skill Studio"
                className="w-5 h-4 sm:w-5.5 sm:h-4.5 object-contain shrink-0"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-semibold text-zinc-900 leading-tight truncate">
                {payload.isZipExport ? "Suite Exported" : "Export Verified"}{" "}
                <span className="font-normal text-zinc-300">·</span>{" "}
                <span className="text-orange-600 font-bold">Skill File All Done</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-snug mt-0.5 truncate flex items-center gap-1 sm:gap-1.5">
                {payload.isZipExport ? (
                  <Archive className="w-3 h-3 text-orange-600 shrink-0" />
                ) : (
                  <FileText className="w-3 h-3 text-orange-600 shrink-0" />
                )}
                <span className="font-mono text-zinc-800 font-medium truncate max-w-[150px] sm:max-w-[260px]">
                  {payload.fileName}
                </span>
                <span className="text-zinc-300">·</span>
                <span className="text-zinc-500 shrink-0">~{payload.tokenCount.toLocaleString()} tokens</span>
              </p>
            </div>
          </div>

          {/* Close button with accessible touch target */}
          <button
            type="button"
            onClick={handleManualDismiss}
            className="shrink-0 p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* ── Row 2: Audit Score + Format + Zero Server Stamp ───────── */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 px-3.5 sm:px-4.5 pb-2">
          {/* Audit score badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${scoreBg} ${scoreColor}`}
          >
            <ShieldCheck className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${shieldColor}`} />
            {payload.auditScore}/100 · {payload.auditGradeLabel}
          </span>

          {/* Format label pill */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/90 truncate max-w-[160px] sm:max-w-none">
            {formatLabel}
          </span>

          {/* Privacy badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-zinc-50 text-zinc-600 border border-zinc-200/90">
            <Lock className="w-2.5 h-2.5 text-zinc-500" />
            0 Bytes Sent
          </span>
        </div>

        {/* ── Row 3: Adjustment Pills ─────────────────────────────── */}
        {adjustmentPills.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 px-3.5 sm:px-4.5 pb-2">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mr-0.5 shrink-0">
              Adjustments
            </span>
            {adjustmentPills.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200/80"
              >
                {pill}
              </span>
            ))}
          </div>
        )}

        {/* ── Row 4: Quick Action Link ────────────────────────────── */}
        <div className="flex items-center justify-between px-3.5 sm:px-4.5 pb-2.5 pt-0.5">
          <button
            type="button"
            onClick={handleViewAudit}
            className="text-[11px] sm:text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer flex items-center gap-1 group"
          >
            <span>Inspect Audit Details</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
          {isHovered && (
            <span className="text-[9px] sm:text-[10px] text-zinc-400 italic">
              Paused — move away to resume
            </span>
          )}
        </div>

        {/* ── Countdown Bar in Vibrant Orange ─────────────────────── */}
        <div className="h-[2.5px] w-full bg-zinc-100">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Render via portal to avoid layout interference
  if (typeof document === "undefined") return null;
  return createPortal(hudElement, document.body);
}
