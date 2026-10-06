"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, BookOpen, Layers, Sparkles, Filter } from "lucide-react";
import { BlogPost, LearningTrack, QuickCheatItem } from "@/lib/blog/types";
import { HubHeader } from "./HubHeader";
import { LearningTracks } from "./LearningTracks";
import { CheatSheetGrid } from "./CheatSheetGrid";

interface HubSearchAndFilterProps {
  posts: BlogPost[];
  tracks: LearningTrack[];
  cheats: QuickCheatItem[];
}

function formatUtcDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function HubSearchAndFilter({ posts, tracks, cheats }: HubSearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  const categories = useMemo(() => {
    return [
      "All",
      "Cheat Sheets",
      "DevOps & Cloud",
      "Security & Cryptography",
      "API & Automation",
      "Data & Serialization",
    ];
  }, []);

  // Keyboard shortcut for search (Press '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      if (selectedCategory === "Cheat Sheets") {
        if (post.type !== "cheat-sheet") return false;
      } else if (selectedCategory !== "All") {
        if (post.category !== selectedCategory) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "All" && post.difficulty !== selectedDifficulty) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesDesc = post.description.toLowerCase().includes(q);
        const matchesCategory = post.category.toLowerCase().includes(q);
        const matchesTags = post.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesSlug = post.slug.toLowerCase().includes(q);

        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTags && !matchesSlug) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div>
      {/* Hub Hero Header */}
      <HubHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        categories={categories}
        totalGuides={posts.length}
      />

      {/* Show Curated Tracks & Cheats when not actively searching to avoid clutter */}
      {!searchQuery && selectedCategory === "All" && (
        <>
          <LearningTracks tracks={tracks} allPosts={posts} />
          <CheatSheetGrid cheats={cheats} />
        </>
      )}

      {/* Guide List Header & Difficulty Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            {selectedCategory === "All" ? "ALL GUIDES & REFERENCE ARCHITECTURES" : `${selectedCategory.toUpperCase()}`}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            ({filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"})
          </span>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span>Difficulty:</span>
          {["All", "Beginner", "Intermediate"].map((diff) => (
            <button
              type="button"
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              suppressHydrationWarning
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedDifficulty === diff
                  ? "bg-zinc-900 text-white font-medium"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Guides Grid / List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center my-8">
          <p className="text-sm font-medium text-zinc-900 mb-1">No guides match your search</p>
          <p className="text-xs text-zinc-500 mb-4">
            Try adjusting your search terms or clearing category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedDifficulty("All");
            }}
            suppressHydrationWarning
            className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-md hover:bg-zinc-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 mb-16">
          {filteredPosts.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.slug}
              className="group block bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 hover:border-zinc-400 hover:shadow-sm transition-all duration-150 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                      {post.category.toUpperCase()}
                    </span>
                    {post.type === "cheat-sheet" && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded">
                        CHEAT SHEET
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 font-mono">
                      {post.readTime}
                    </span>
                    <span className="text-xs text-zinc-300">•</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {post.difficulty}
                    </span>
                    <span className="text-xs text-zinc-300">•</span>
                    <time className="text-xs text-zinc-400 font-mono" suppressHydrationWarning>
                      {formatUtcDate(post.publishedAt)}
                    </time>
                  </div>

                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors tracking-tight flex items-center gap-1.5">
                    {post.title}
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 shrink-0" />
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed max-w-3xl">
                    {post.description}
                  </p>

                  {/* Tag Chips */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {post.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center text-xs font-mono font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors pt-1 shrink-0">
                  <span>Read Guide →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
