"use client";

import React, { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";

export function StudioSupportSection() {
  const [copied, setCopied] = useState(false);
  const email = "support@devscratchpad.tech";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full pt-2">
      <div className="w-full bg-white border border-zinc-200/90 rounded-xl p-4 sm:p-6 shadow-xs relative overflow-hidden transition-all hover:border-zinc-300">
        {/* Subtle orange accent hairline on top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          {/* Left: Heading & description */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-[10px] font-mono font-medium text-orange-800 uppercase tracking-wider">
                Support &amp; Custom Presets
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-900 tracking-tight leading-snug">
              Have questions or need tailored agent rules?
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
              Reach out to our engineering team for custom stack presets and multi-agent setup help.
            </p>
          </div>

          {/* Right: Interactive One-Click Copy Pill */}
          <button
            type="button"
            onClick={handleCopy}
            className={`group w-full sm:w-auto flex items-center justify-between gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg border transition-all text-left cursor-pointer shrink-0 min-h-[42px] select-none active:scale-[0.99] ${
              copied
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                : "bg-zinc-50 hover:bg-orange-50/50 active:bg-orange-50/70 border-zinc-200 hover:border-orange-300 text-zinc-900 shadow-2xs"
            }`}
            title="Click to copy email address"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mail className={`w-3.5 h-3.5 shrink-0 ${copied ? "text-emerald-600" : "text-orange-600"}`} />
              <span className="font-mono text-xs font-semibold tracking-tight text-zinc-900 truncate">
                {email}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-colors shrink-0 ${
                copied
                  ? "bg-emerald-100 text-emerald-800 font-bold"
                  : "bg-white border border-zinc-200 group-hover:border-orange-200 text-zinc-600 group-hover:text-orange-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400 group-hover:text-orange-500 shrink-0" />
                  <span>Copy</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
