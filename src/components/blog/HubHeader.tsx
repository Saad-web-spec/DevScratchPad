"use client";

import React from "react";
import { BookOpen, Sparkles, Terminal, Search, ShieldCheck } from "lucide-react";

interface HubHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  categories: string[];
  totalGuides: number;
}

export function HubHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories,
  totalGuides,
}: HubHeaderProps) {
  return (
    <div className="border-b border-zinc-200 pb-8 mb-10">
      {/* Top Badge */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-zinc-900 text-white shadow-sm">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>DEV_LEARNING_HUB // v2.0</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span>100% Client-Side Knowledge Base</span>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {totalGuides} Practical References
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
        Engineering Guides, Cheat Sheets & Architecture Cookbooks
      </h1>

      <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
        Exhaustive, copy-pasteable references for everyday developer challenges. From cron schedules and JWT RFC standards to cURL conversions and modern cryptographic hashing.
      </p>

      {/* Instant Search Bar */}
      <div className="mt-6 max-w-2xl relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search guides, cheat sheets, syntax, commands, or tags (e.g. cron, jwt, python, regex)..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            suppressHydrationWarning
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              suppressHydrationWarning
              className="absolute right-3 px-2 py-0.5 text-xs font-mono text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded"
            >
              Clear
            </button>
          ) : (
            <div className="absolute right-3 hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded pointer-events-none">
              <span>Press /</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-5 pb-1 scrollbar-none" suppressHydrationWarning>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              type="button"
              key={cat}
              onClick={() => onCategorySelect(cat)}
              suppressHydrationWarning
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
