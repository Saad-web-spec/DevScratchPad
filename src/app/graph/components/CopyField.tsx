"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** One line of text (a URL or a command) with a copy button beside it. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (permissions, in-app browsers): the text stays selectable.
    }
  };
  return (
    <div className="flex min-w-0 items-stretch overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap px-3 py-2.5 font-mono text-[12.5px] text-zinc-800">{value}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex shrink-0 items-center gap-1.5 border-l border-zinc-200 px-3 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-500"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-orange-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
