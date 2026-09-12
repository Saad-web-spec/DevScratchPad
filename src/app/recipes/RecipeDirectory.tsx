"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Wrench, ShieldCheck } from "lucide-react";
import { RecipeMeta } from "@/lib/recipes/registry";

export function RecipeDirectory({ recipes }: { recipes: RecipeMeta[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Extract unique tool slugs for quick filter pills
  const availableTools = Array.from(new Set(recipes.map((r) => r.targetToolSlug))).sort();

  const filtered = recipes.filter((r) => {
    const matchesTool = selectedTool === "all" || r.targetToolSlug === selectedTool;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTool;
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      r.problem.toLowerCase().includes(q) ||
      r.targetToolSlug.toLowerCase().includes(q);
    return matchesTool && matchesSearch;
  });

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* Search & Filter Controls */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4" suppressHydrationWarning>
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search error messages, syntax errors, or tool names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-sans"
          />
        </div>

        {/* Tool Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1" suppressHydrationWarning>
          <span className="text-xs font-mono text-zinc-500 mr-1">Filter by tool:</span>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setSelectedTool("all")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
              selectedTool === "all"
                ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-orange-300 hover:text-orange-700"
            }`}
          >
            All ({recipes.length})
          </button>
          {availableTools.map((toolSlug) => {
            const count = recipes.filter((r) => r.targetToolSlug === toolSlug).length;
            const isSelected = selectedTool === toolSlug;
            return (
              <button
                key={toolSlug}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedTool(toolSlug)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-mono ${
                  isSelected
                    ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-orange-300 hover:text-orange-700"
                }`}
              >
                {toolSlug} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-mono" suppressHydrationWarning>
        <span>Showing {filtered.length} verified developer troubleshooting recipes</span>
        {selectedTool !== "all" && (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setSelectedTool("all")}
            className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-900">No troubleshooting recipes match your search.</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try searching for common error terms like &quot;SyntaxError&quot;, &quot;invalid signature&quot;, or &quot;TypeError&quot;.
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => {
                setSearchQuery("");
                setSelectedTool("all");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 mt-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((recipe) => (
            <Link
              key={recipe.slug}
              href={`/recipes/${recipe.slug}`}
              className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-5 bg-white shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all text-inherit no-underline group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                    {recipe.targetToolSlug}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                    Verified Fix
                  </span>
                </div>

                <h3 className="font-bold text-zinc-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                  {recipe.title}
                </h3>

                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {recipe.problem}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Client-Side
                </span>
                <span className="text-orange-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Inspect Fix <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
