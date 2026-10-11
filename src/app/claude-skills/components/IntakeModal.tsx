"use client";

import React, { useEffect } from "react";
import { CircleAlert, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputFormat } from "../lib/ruleGenerator";

/**
 * Shared shell for the MCP context-intake modals (GitHub repo, local folder, DDL, Docker):
 * compact header, scrollable body, and a footer with a privacy note, Cancel and one primary action.
 */

export const INTAKE_FORMATS = [
  { label: "CLAUDE.md", value: "claude_md" },
  { label: "AGENTS.md", value: "agents_md" },
  { label: "Cursor .mdc", value: "cursor_mdc" },
  { label: "SKILL.md", value: "skill_md" },
] as const satisfies readonly { label: string; value: OutputFormat }[];

export type IntakeFormat = (typeof INTAKE_FORMATS)[number]["value"];

/** Format the modal starts on: the studio's current format when it is a rule file, otherwise CLAUDE.md. */
export function initialIntakeFormat(format?: OutputFormat): IntakeFormat {
  return INTAKE_FORMATS.find((f) => f.value === format)?.value ?? "claude_md";
}

export function intakeFormatLabel(format: IntakeFormat): string {
  return INTAKE_FORMATS.find((f) => f.value === format)?.label ?? "CLAUDE.md";
}

interface IntakeModalProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  privacyNote?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled: boolean;
  children: React.ReactNode;
}

export function IntakeModal({
  icon,
  title,
  subtitle,
  privacyNote = "Runs in your browser. Nothing is uploaded.",
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  children,
}: IntakeModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col text-zinc-900 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 shrink-0">
          <div className="size-8 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 leading-snug">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3.5 space-y-3">{children}</div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-400 min-w-0 mr-auto">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">{privacyNote}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto sm:ml-0 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-100 text-white disabled:text-zinc-400 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Segmented control for the rule file the intake result is written to. */
export function IntakeFormatSwitch({ value, onChange }: { value: IntakeFormat; onChange: (next: IntakeFormat) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-[11px] font-medium text-zinc-500">Write to</span>
      <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
        {INTAKE_FORMATS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
              value === f.value ? "bg-white text-zinc-900 font-semibold shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IntakeError({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/60 text-xs text-rose-800">
      <CircleAlert className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
      <span className="flex-1 leading-relaxed">{message}</span>
      {action}
    </div>
  );
}

/** One row of a flat result panel (rows are separated by the panel's dividers, never nested cards). */
export function IntakeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 space-y-1">
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      {children}
    </div>
  );
}

export const intakePanelClass = "rounded-lg border border-zinc-200 divide-y divide-zinc-100 animate-in fade-in-50 duration-150";
export const intakePillClass = "text-[11px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700";
export const intakeInputClass =
  "w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15";

/** Build/test/lint/dev script grid shared by the repo and folder results. */
export function ScriptList({ scripts }: { scripts: Partial<Record<"build" | "test" | "lint" | "dev", string>> }) {
  const entries = (["build", "test", "lint", "dev"] as const).filter((k) => scripts[k]);
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] text-zinc-700">
      {entries.map((k) => (
        <div key={k} className="truncate">
          <span className="text-zinc-400">{k}:</span> {scripts[k]}
        </div>
      ))}
    </div>
  );
}
