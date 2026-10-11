"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, ShieldCheck } from "lucide-react";
import { RecipeMeta } from "@/lib/recipes/registry";
import { guide } from "@/components/seo/guideUi";

const chipBase =
  "inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors cursor-pointer sm:h-8";
const chipActive = "border-zinc-900 bg-zinc-900 text-white";
const chipIdle = "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900";

export function RecipeDirectory({ recipes }: { recipes: RecipeMeta[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("all");

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
    <div className="space-y-6" suppressHydrationWarning>
      {/* Search & Filter Controls */}
      <div className="space-y-3 border-t border-zinc-200 pt-8" suppressHydrationWarning>
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search error messages, syntax errors, or tool names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-base text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 sm:text-sm"
          />
        </div>

        {/* Tool Filter Chips */}
        <div className="space-y-2" suppressHydrationWarning>
          <span className="block text-xs text-zinc-500">Filter by tool:</span>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setSelectedTool("all")}
            className={`${chipBase} ${selectedTool === "all" ? chipActive : chipIdle}`}
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
                className={`${chipBase} font-mono ${isSelected ? chipActive : chipIdle}`}
              >
                {toolSlug} ({count})
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pt-4" suppressHydrationWarning>
        <h2 className={guide.h2}>
          Verified Developer Solutions <span className="text-sm font-normal text-zinc-400">({filtered.length})</span>
        </h2>
        {selectedTool !== "all" && (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setSelectedTool("all")}
            className="min-h-10 text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900 cursor-pointer"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-lg border border-zinc-200 p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-900">No troubleshooting recipes match your search.</p>
            <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
              Try searching for common error terms like &quot;SyntaxError&quot;, &quot;invalid signature&quot;, or &quot;TypeError&quot;.
            </p>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => {
                setSearchQuery("");
                setSelectedTool("all");
              }}
              className={`${guide.btnSecondary} mt-3`}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((recipe) => (
            <Link
              key={recipe.slug}
              href={`/recipes/${recipe.slug}`}
              className={`${guide.card} justify-between text-inherit no-underline`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-500 truncate max-w-[170px]">
                    {recipe.targetToolSlug}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 shrink-0">
                    Verified Fix
                  </span>
                </div>

                <h3 className="text-sm sm:text-[15px] font-medium leading-snug text-zinc-900 line-clamp-2">
                  {recipe.title}
                </h3>

                <p className="text-[13px] text-zinc-500 leading-relaxed line-clamp-3">
                  {recipe.problem}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  100% Client-Side
                </span>
                <span className="flex items-center gap-1 font-medium text-zinc-900">
                  Inspect Fix <ArrowRight className="w-3.5 h-3.5 text-zinc-400 transition-colors group-hover:text-zinc-900" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
