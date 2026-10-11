"use client";

import { useEffect, useState } from "react";
import { CodeXml, Check, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnIcon, btnSecondary, ICON_STROKE } from "@/components/tools/ToolChrome";
import { encodeShareData } from "./ShareButton";

interface EmbedButtonProps {
  toolSlug: string;
  data: string | object;
  className?: string;
}

/** iframe snippet that loads the tool in embed mode with the current input pre-filled. */
export function getEmbedCode(toolSlug: string, data: string | object): string {
  if (data === undefined || data === null) return "";
  const encoded = encodeShareData(data);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.devscratchpad.tech";
  const embedUrl = `${origin}/tools/${toolSlug}?embed=true#data=${encoded}`;

  return `<iframe
  src="${embedUrl}"
  width="100%"
  height="600px"
  style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;"
  title="DevScratchpad ${toolSlug}"
  allow="clipboard-write"
></iframe>`;
}

interface EmbedDialogProps {
  toolSlug: string;
  data: string | object;
  onClose: () => void;
}

/** Modal with the copyable iframe snippet. Render it only while open. */
export function EmbedDialog({ toolSlug, data, onClose }: EmbedDialogProps) {
  const [copied, setCopied] = useState(false);
  const code = getEmbedCode(toolSlug, data);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-zinc-950/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="embed-dialog-title"
        className="w-full sm:max-w-lg max-h-[85dvh] flex flex-col bg-white border border-zinc-200 rounded-t-2xl sm:rounded-xl overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pl-4 pr-2 h-14 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CodeXml className="size-4 shrink-0 text-zinc-900" strokeWidth={ICON_STROKE} aria-hidden="true" />
            <h2 id="embed-dialog-title" className="text-sm font-semibold text-zinc-900 truncate">
              Embed this tool
            </h2>
          </div>
          <button type="button" onClick={onClose} className={btnIcon} aria-label="Close" title="Close">
            <X className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Paste this snippet into a blog post or docs page. The embedded tool opens with your current input.
          </p>
          <div className="rounded-lg border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between gap-2 pl-3 pr-1 h-10 bg-zinc-50 border-b border-zinc-200">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">HTML</span>
              <button type="button" onClick={handleCopy} className={btnSecondary}>
                {copied ? (
                  <Check className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
                ) : (
                  <Copy className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-zinc-800 whitespace-pre-wrap break-all max-h-60 overflow-y-auto leading-relaxed">
              {code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmbedButton({ toolSlug, data, className }: EmbedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(btnIcon, className)}
        aria-label="Embed tool"
        title="Get embed code"
      >
        <CodeXml className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>

      {isOpen && <EmbedDialog toolSlug={toolSlug} data={data} onClose={() => setIsOpen(false)} />}
    </>
  );
}
