"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, X, ArrowRight } from "lucide-react";
import type { OutputFormat } from "../lib/ruleGenerator";

// ─── Format Label Map ────────────────────────────────────────────────────
const FORMAT_LABELS: Record<OutputFormat, string> = {
  skill_md: "SKILL.md",
  claude_md: "CLAUDE.md",
  cursor_mdc: "Cursor rule",
  agents_md: "AGENTS.md",
  mcp_json: "MCP config",
  windsurf_cascade: "Windsurf rule",
  copilot_instructions: "Copilot instructions",
  openai_instructions: "OpenAI instructions",
  gemini_prompts: "Gemini instructions",
  cursorignore: ".cursorignore",
  claudeignore: ".claudeignore",
  llms_txt: "llms.txt",
  architecture_md: "ARCHITECTURE.md",
  prd_md: "PRD.md",
  design_md: "DESIGN.md",
  task_md: "TASK.md",
  memory_md: "MEMORY.md",
};

// ─── Props Interface ─────────────────────────────────────────────────────
export interface DownloadHudPayload {
  /** Unique per download; the parent keys the HUD by it so every download gets a fresh toast. */
  id: number;
  /** Downloaded file or archive name. */
  fileName: string;
  /** Format that was active in the editor (the one the audit score describes). */
  format: OutputFormat;
  tokenCount: number;
  auditScore: number;
  auditGradeLabel: string;
  auditIssuesCount: number;
  isZipExport: boolean;
  /** Single file: repository-relative path where the file belongs. */
  repoPath?: string;
  /** ZIP export: repository-relative paths written into the archive. */
  files?: string[];
}

interface DownloadAuditHudProps {
  payload: DownloadHudPayload | null;
  onDismiss: () => void;
  onViewAuditDetails: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────
// Display time is set by the hud-countdown animation on the progress bar (globals.css); its animationend dismisses the toast
const EXIT_DURATION_MS = 200;

// ─── Component ───────────────────────────────────────────────────────────
export function DownloadAuditHud({
  payload,
  onDismiss,
  onViewAuditDetails,
}: DownloadAuditHudProps) {
  const [isShown, setIsShown] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Entrance: show on the next frame so the hidden styles paint first ──
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsShown(true));
    return () => {
      cancelAnimationFrame(frame);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsShown(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(onDismiss, EXIT_DURATION_MS);
  }, [onDismiss]);

  // ── Escape key dismissal ──────────────────────────────────────────
  useEffect(() => {
    if (!payload) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [payload, dismiss]);

  const handleViewAudit = useCallback(() => {
    dismiss();
    onViewAuditDetails();
  }, [dismiss, onViewAuditDetails]);

  if (!payload || typeof document === "undefined") return null;

  const formatLabel = FORMAT_LABELS[payload.format] || payload.format;
  const fileCount = payload.files?.length ?? 0;
  const detail = payload.isZipExport
    ? `${fileCount} files · unzip in project root`
    : payload.repoPath ?? payload.fileName;

  const hudElement = (
    <div
      role="status"
      aria-live="polite"
      aria-label="Download complete"
      className={[
        "group fixed z-[9999] bottom-20 right-3 sm:right-5 lg:bottom-5 w-[min(19rem,calc(100%-1.5rem))]",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        isShown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-lg border border-orange-200 bg-white shadow-md shadow-orange-900/5">
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-zinc-900">
              {payload.isZipExport ? "AI kit downloaded" : `${formatLabel} downloaded`}
            </p>
            <p className="truncate font-mono text-[11px] text-zinc-500" title={payload.isZipExport ? payload.fileName : detail}>
              {detail}
            </p>
            <button
              type="button"
              onClick={handleViewAudit}
              className="mt-1 flex items-center gap-1 rounded text-[11px] font-medium text-orange-600 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span className="tabular-nums">{payload.auditScore}/100</span>
              <span className="text-orange-300">·</span>
              View audit
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Countdown: pauses while hovered or focused, dismisses when the animation ends */}
        <div className="h-0.5 w-full bg-orange-100">
          <div
            onAnimationEnd={dismiss}
            className="h-full origin-left bg-orange-500 animate-[hud-countdown_5s_linear_forwards] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          />
        </div>
      </div>
    </div>
  );

  // Render via portal to avoid layout interference
  return createPortal(hudElement, document.body);
}
