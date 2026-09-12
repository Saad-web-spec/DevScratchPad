"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

export function CodeBlock({ code, title = "Verified Implementation & Fix" }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.split("\n");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden flex flex-col shadow-2xs my-4">
      {/* Top Header Bar */}
      <div className="bg-zinc-100/90 border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-700 font-semibold ml-1">
            <Terminal className="w-3.5 h-3.5 text-orange-600" />
            <span>{title}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container with Intelligent Line-Level Highlighting */}
      <pre className="p-4 sm:p-5 bg-zinc-950 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
        <code>
          {lines.map((line, idx) => {
            const isBad = line.includes("❌") || line.toLowerCase().includes("bad:") || line.toLowerCase().includes("crashes");
            const isGood = line.includes("✅") || line.toLowerCase().includes("good:") || line.toLowerCase().includes("fixed");
            const isComment = line.trim().startsWith("//") || line.trim().startsWith("#");

            let lineClass = "text-zinc-200";
            let bgClass = "";

            if (isBad) {
              lineClass = "text-rose-400 font-semibold";
              bgClass = "bg-rose-950/30 -mx-4 sm:-mx-5 px-4 sm:px-5 py-0.5 rounded";
            } else if (isGood) {
              lineClass = "text-emerald-400 font-semibold";
              bgClass = "bg-emerald-950/30 -mx-4 sm:-mx-5 px-4 sm:px-5 py-0.5 rounded";
            } else if (isComment) {
              lineClass = "text-zinc-500 italic";
            }

            return (
              <div key={idx} className={`${bgClass} flex items-start`}>
                <span className="select-none text-zinc-600 w-8 inline-block text-right pr-3 text-[11px] font-mono shrink-0">
                  {idx + 1}
                </span>
                <span className={`${lineClass} flex-1 whitespace-pre`}>{line || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
