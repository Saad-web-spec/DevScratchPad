"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnGhost, btnIcon, iconProps } from "@/components/tools/ToolChrome";

/**
 * Small shared pieces for the security & cryptography tools (JWT, Base64, Hash, HMAC):
 * a copy-with-feedback hook, copy buttons, a flat status pill and a debounced value hook.
 */

/** Copies text and flashes a per-key "copied" state. The timer is cleared on unmount. */
export function useCopyFlash(duration = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = useCallback(
    (text: string, key: string) => {
      if (!text) return false;
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), duration);
      return true;
    },
    [duration]
  );

  return { copiedKey, copy };
}

/** Returns `value` once it has stopped changing for `delay` ms (immediately when delay is 0). */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return delay === 0 ? value : debounced;
}

interface CopyButtonProps {
  copied: boolean;
  onClick: () => void;
  /** Visible label for the ghost variant, accessible name for the icon variant. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Quiet "Copy" text button for pane bars. */
export function CopyGhostButton({ copied, onClick, label = "Copy", disabled, className }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(btnGhost, copied && "text-zinc-900", className)}
      aria-live="polite"
    >
      {copied ? <Check {...iconProps} /> : <Copy {...iconProps} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

/** Icon-only copy button (40px on mobile, 32px from md up). */
export function CopyIconButton({ copied, onClick, label = "Copy", disabled, className }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(btnIcon, copied && "text-zinc-900", className)}
      title={copied ? "Copied" : label}
      aria-label={label}
    >
      {copied ? <Check {...iconProps} /> : <Copy {...iconProps} />}
    </button>
  );
}

export type PillTone = "neutral" | "success" | "error" | "warning" | "strong";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  strong: "bg-zinc-900 text-white",
  success: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  error: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
};

/** Flat status chip: neutral zinc, or semantic emerald / red / amber. */
export function StatusPill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: PillTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[11px] font-medium normal-case tracking-normal",
        PILL_TONES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Formats a byte count as B / KB / MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
