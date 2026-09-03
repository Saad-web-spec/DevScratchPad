"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Terminal, Cpu, ArrowRight, Clock, BookOpen } from "lucide-react";
import { LearningTrack, BlogPost } from "@/lib/blog/types";

interface LearningTracksProps {
  tracks: LearningTrack[];
  allPosts: BlogPost[];
}

export function LearningTracks({ tracks, allPosts }: LearningTracksProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck className="w-4 h-4 text-zinc-800" />;
      case "Terminal":
        return <Terminal className="w-4 h-4 text-zinc-800" />;
      case "Cpu":
        return <Cpu className="w-4 h-4 text-zinc-800" />;
      default:
        return <BookOpen className="w-4 h-4 text-zinc-800" />;
    }
  };

  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            CURATED LEARNING TRACKS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-mono text-zinc-400">Structured Deep Dives</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((track) => {
          const trackGuides = allPosts.filter((p) => track.guideSlugs.includes(p.slug));
          return (
            <div
              key={track.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-300 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 bg-zinc-100 border border-zinc-200 rounded-lg">
                    {getIcon(track.iconName)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                      {track.badge}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {track.estimatedTime}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-zinc-900 text-sm tracking-tight mb-1.5">
                  {track.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  {track.description}
                </p>

                {/* Sub guides list */}
                <div className="space-y-1 mb-4 border-t border-zinc-100 pt-3">
                  {trackGuides.slice(0, 3).map((guide, idx) => (
                    <Link
                      key={guide.slug}
                      href={`/blog/${guide.slug}`}
                      className="group flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-900 py-1 transition-colors"
                    >
                      <span className="truncate pr-2">
                        {idx + 1}. {guide.title.split("—")[0].trim()}
                      </span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-zinc-400" />
                    </Link>
                  ))}
                  {trackGuides.length > 3 && (
                    <span className="text-[10px] font-mono text-zinc-400 block pt-1">
                      +{trackGuides.length - 3} more modules in track
                    </span>
                  )}
                </div>
              </div>

              {trackGuides.length > 0 && (
                <Link
                  href={`/blog/${trackGuides[0].slug}`}
                  className="w-full mt-2 py-2 px-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono font-medium text-zinc-700 hover:text-zinc-900 text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Start Track</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
