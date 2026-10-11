"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyTextButtonProps {
  /** Text written to the clipboard. */
  text: string;
  /** Accessible name, e.g. "Copy .cursor/rules/nextjs-15.mdc". */
  ariaLabel: string;
  label?: string;
}

/** Tiny clipboard button so the surrounding reference content can stay a Server Component. */
export function CopyTextButton({ text, ariaLabel, label = "Copy" }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
