/**
 * PromptCraft Studio — Header styled after Google Antigravity clean navigation
 * Single AI Skill Studio link on top-left (no background), Fox logo, and white pill action button.
 * WebGPU badges and icons completely removed per user request.
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface PromptCraftHeaderProps {
  activeTab?: 'overview' | 'image' | 'video';
}

export function PromptCraftHeader({ activeTab = 'overview' }: PromptCraftHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Single AI Skill Studio Button (No Background, Original Icon + Text) + Brand */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Top Left: Single AI Skill Studio button without background */}
          <Link
            href="/ai-skill-studio"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors group cursor-pointer shrink-0"
            title="AI Skill Studio"
          >
            <Image
              src="/ai-skill-icon.png"
              alt="AI Skill Studio"
              width={16}
              height={14}
              className="w-4 h-3.5 object-contain shrink-0 transition-transform group-hover:scale-105"
              priority
            />
            <span className="font-semibold tracking-tight">AI Skill Studio</span>
          </Link>

          <span className="text-zinc-300 font-light hidden sm:inline" aria-hidden="true">
            /
          </span>

          {/* Transparent Fox Logo & Title (Clean, no WebGPU icon or badge) */}
          <Link
            href="/promptcraft"
            className="flex items-center gap-2 group cursor-pointer shrink-0"
            title="PromptCraft Studio Home"
          >
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <Image
                src="/promptcraft-fox-clean.png"
                alt="PromptCraft Fox Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <span className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900">
              PromptCraft <span className="text-orange-600 font-bold">Studio</span>
            </span>
          </Link>
        </div>

        {/* Center: Mode Navigation Tabs (Pill style from Google Antigravity reference) */}
        <nav
          aria-label="PromptCraft navigation"
          className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs font-medium"
        >
          <Link
            href="/promptcraft"
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Overview</span>
          </Link>

          <Link
            href="/promptcraft/images"
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Image Studio</span>
          </Link>

          <Link
            href="/promptcraft/video"
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Video Studio</span>
          </Link>
        </nav>

        {/* Right: White Pill Action Button (like Get Started in reference) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/promptcraft/images"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-300 shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
