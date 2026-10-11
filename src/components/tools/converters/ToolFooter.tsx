"use client";

import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/components/tools/ToolChrome";

interface ToolFooterProps {
  /** "ok" shows an emerald check, "error" a red alert, "warning" an amber triangle, "idle" nothing. */
  status: "ok" | "error" | "warning" | "idle";
  /** Status text, e.g. "Valid JSON" or "Line 3, Col 5: Unexpected token". */
  message?: ReactNode;
  /** Right-aligned stats (chars, lines, timing). Hidden on very narrow screens when there is an error. */
  meta?: ReactNode;
  className?: string;
}

/** Thin status line at the bottom of a tool: validity on the left, quiet stats on the right. */
export function ToolFooter({ status, message, meta, className }: ToolFooterProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-8 shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-white px-3 text-xs md:px-4",
        className
      )}
    >
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5 truncate",
          status === "error" ? "text-red-600" : status === "warning" ? "text-amber-700" : "text-zinc-500"
        )}
      >
        {status === "ok" && <CircleCheck className="size-3.5 shrink-0 text-zinc-900" strokeWidth={ICON_STROKE} aria-hidden="true" />}
        {status === "error" && <CircleAlert className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />}
        {status === "warning" && <TriangleAlert className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />}
        <span className="truncate">{message}</span>
      </span>
      {meta && (
        <span className={cn("shrink-0 tabular-nums text-zinc-400", status === "error" && "hidden sm:inline")}>{meta}</span>
      )}
    </div>
  );
}

/** "1,234 chars · 0.4 ms" */
export function formatStats(chars: number, ms?: number): string {
  const parts = [`${chars.toLocaleString()} chars`];
  if (ms !== undefined && Number.isFinite(ms)) parts.push(ms < 1 ? `${ms.toFixed(2)} ms` : `${ms.toFixed(1)} ms`);
  return parts.join(" · ");
}
