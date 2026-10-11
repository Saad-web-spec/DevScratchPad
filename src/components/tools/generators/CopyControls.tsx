"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnGhost, btnIcon, iconProps } from "@/components/tools/ToolChrome";
import { copyText } from "./clipboard";

/**
 * Tracks which value was copied last so its button can show a check for a moment.
 * One hook per tool keeps a single "copied" indicator across all rows.
 */
export function useCopyState(resetMs = 1400) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(
    async (text: string, key: string) => {
      if (!text) return false;
      const ok = await copyText(text);
      if (!ok) return false;
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), resetMs);
      return true;
    },
    [resetMs]
  );

  return { copiedKey, copy };
}

interface CopyIconButtonProps {
  copied: boolean;
  onCopy: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

/** Icon-only copy button for a single value (40px on mobile, 32px from md). */
export function CopyIconButton({ copied, onCopy, label, className, disabled }: CopyIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className={cn(btnIcon, copied && "text-zinc-900", className)}
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check {...iconProps} /> : <Copy {...iconProps} />}
    </button>
  );
}

interface CopyTextButtonProps {
  copied: boolean;
  onCopy: () => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}

/** Quiet "Copy" text button for pane bars. */
export function CopyTextButton({ copied, onCopy, children = "Copy", className, disabled, title }: CopyTextButtonProps) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className={cn(btnGhost, copied && "text-zinc-900", className)}
      title={title}
    >
      {copied ? <Check {...iconProps} /> : <Copy {...iconProps} />}
      <span>{copied ? "Copied" : children}</span>
    </button>
  );
}

interface ResultRowProps {
  label: ReactNode;
  value: string;
  /** Secondary line under the value (e.g. relative time, hint). */
  hint?: ReactNode;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
  /** Override what the copy button copies (defaults to `value`). */
  copyLabel?: string;
}

/**
 * One label / value row with a trailing copy button. Rows sit in a `divide-y` list.
 * Below `sm` the label stacks above the value so long values wrap instead of overflowing.
 */
export function ResultRow({ label, value, hint, mono = true, copied, onCopy, copyLabel }: ResultRowProps) {
  return (
    <div className="flex min-h-12 items-center gap-2 py-1.5 pl-3 pr-1 sm:pl-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
        <span className="shrink-0 text-xs font-medium text-zinc-500 sm:w-40">{label}</span>
        <div className="min-w-0 flex-1">
          <div className={cn("break-all text-[13px] text-zinc-900 sm:text-sm", mono && "font-mono")}>{value}</div>
          {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
        </div>
      </div>
      <CopyIconButton copied={copied} onCopy={onCopy} label={copyLabel ?? (typeof label === "string" ? label : "value")} />
    </div>
  );
}
