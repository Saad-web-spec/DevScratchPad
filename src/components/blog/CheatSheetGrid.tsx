"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Copy, Terminal, ArrowUpRight } from "lucide-react";
import { QuickCheatItem } from "@/lib/blog/types";

interface CheatSheetGridProps {
  cheats: QuickCheatItem[];
}

export function CheatSheetGrid({ cheats }: CheatSheetGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            INSTANT CHEAT SHEETS & ONE-LINERS
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
            Copy-Paste Ready
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-400">Click to Copy</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cheats.map((cheat) => {
          const isCopied = copiedId === cheat.id;
          return (
            <div
              key={cheat.id}
              className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-300 transition-all shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded font-medium">
                    {cheat.category}
                  </span>
                  {cheat.toolSlug && (
                    <Link
                      href={`/tools/${cheat.toolSlug}`}
                      className="text-[10px] font-mono text-zinc-400 hover:text-zinc-900 flex items-center gap-0.5 transition-colors"
                      title="Open interactive tool"
                    >
                      <span>Tool</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-zinc-900 tracking-tight mb-1">
                  {cheat.title}
                </h4>

                <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
                  {cheat.description}
                </p>
              </div>

              {/* Code / Command Block with Copy */}
              <div className="relative bg-zinc-900 rounded-lg p-2.5 text-[11px] font-mono text-zinc-200 flex items-center justify-between gap-2 overflow-hidden">
                <span className="truncate selection:bg-zinc-700 selection:text-white">
                  {cheat.syntax}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(cheat.id, cheat.syntax)}
                  suppressHydrationWarning
                  className="shrink-0 p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                  aria-label="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
