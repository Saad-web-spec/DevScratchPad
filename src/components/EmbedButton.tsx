"use client";

import { useState } from "react";
import { Code2, Check, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { encodeShareData } from "./ShareButton";

interface EmbedButtonProps {
  toolSlug: string;
  data: string | object;
  className?: string;
}

export function EmbedButton({ toolSlug, data, className }: EmbedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getEmbedCode = () => {
    if (data === undefined || data === null) return "";
    const encoded = encodeShareData(data);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tools.saadengineer.works";
    const embedUrl = `${origin}/${toolSlug}?embed=true#data=${encoded}`;
    
    return `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600px" 
  style="border: 1px solid #27272A; border-radius: 8px; overflow: hidden;"
  title="DevScratchpad ${toolSlug}"
  allow="clipboard-write"
></iframe>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0",
          className
        )}
        title="Get embed code to put this tool on your own site"
      >
        <Code2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[92vw] sm:w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Embed on Your Site
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Copy the code below to embed this interactive tool directly into your blog, documentation, or website. The embedded tool will load exactly as it appears right now, with all your data pre-filled.
              </p>
              
              {/* Code Snippet Box with Header Bar */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-200/60 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    HTML iframe snippet
                  </span>
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap break-all overflow-x-auto max-h-56 sm:max-h-64 overflow-y-auto leading-relaxed">
                  {getEmbedCode()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
