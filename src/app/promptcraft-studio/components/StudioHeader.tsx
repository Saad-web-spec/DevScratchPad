/**
 * PromptCraft Studio — Cosmic Header with Fox Logo, Nav Tabs & AI Skill Studio Link
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  RotateCcw,
  Sparkles,
  Film,
  Image as ImageIcon,
  Compass,
  Zap,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

interface StudioHeaderProps {
  activeTab?: 'hub' | 'images' | 'video';
}

export function StudioHeader({ activeTab = 'hub' }: StudioHeaderProps) {
  const { resetToDefaults } = usePromptStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-800 shadow-lg text-zinc-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Transparent Fox Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/promptcraft-studio"
            className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
            title="PromptCraft Studio Home"
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <Image
                src="/promptcraft-fox-clean.png"
                alt="PromptCraft Fox Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                PromptCraft Studio
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-800/60 font-semibold">
                <Zap className="w-2.5 h-2.5 text-orange-400" /> Instant 0 MB
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Mode Navigation Tabs (Overview / Images / Video) */}
        <nav className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-white/10 text-xs font-semibold">
          <Link
            href="/promptcraft-studio"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'hub'
                ? 'bg-zinc-800 text-white shadow-xs font-bold border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <Link
            href="/promptcraft-studio/images"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'images'
                ? 'bg-orange-950/80 text-orange-300 shadow-xs font-bold border border-orange-500/50'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
            <span>Images</span>
          </Link>

          <Link
            href="/promptcraft-studio/video"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-orange-950/80 text-orange-300 shadow-xs font-bold border border-orange-500/50'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-orange-500" />
            <span>Video</span>
          </Link>
        </nav>

        {/* Right: Direct Link to AI Skill Studio */}
        <div className="flex items-center gap-2">
          {activeTab !== 'hub' && (
            <button
              onClick={resetToDefaults}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Reset all settings to default"
              aria-label="Reset all settings"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/ai-skill-studio"
            className="promptcraft-fox-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-200 shrink-0" />
            <span className="hidden sm:inline">AI Skill Studio</span>
            <span className="sm:hidden">Skills</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
