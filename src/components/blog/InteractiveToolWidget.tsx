"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Terminal, ArrowRight, Play, Check, Copy, Sparkles, ShieldCheck } from "lucide-react";
import { InteractivePreset } from "@/lib/blog/types";
import { ToolMeta } from "@/lib/tools/registry";

interface InteractiveToolWidgetProps {
  preset: InteractivePreset;
  toolMeta?: ToolMeta;
}

export function InteractiveToolWidget({ preset, toolMeta }: InteractiveToolWidgetProps) {
  const [inputVal, setInputVal] = useState(preset.initialInput);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setInputVal(preset.initialInput);
  };

  return (
    <div className="my-10 bg-zinc-900 text-zinc-100 rounded-xl p-5 sm:p-6 border border-zinc-800 shadow-sm not-prose">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            {preset.title}
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded">
            Live Interactive Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            100% Client-Side
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 mt-3 mb-4 leading-relaxed">
        {preset.explanation} Test the preset input below or customize it before launching into the full workspace.
      </p>

      {/* Editor / Input Box */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>{preset.inputLabel}:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              suppressHydrationWarning
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Reset to preset
            </button>
            <button
              type="button"
              onClick={handleCopy}
              suppressHydrationWarning
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
        <textarea
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          rows={3}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none selection:bg-zinc-800 selection:text-white"
        />
      </div>

      {/* Footer CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-zinc-400">
          Ready for advanced parsing, syntax error highlighting & bulk export?
        </div>

        <Link
          href={`/tools/${preset.toolSlug}`}
          className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-none"
        >
          <span>Open in Full Workspace ({toolMeta?.shortName || "Tool"})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
