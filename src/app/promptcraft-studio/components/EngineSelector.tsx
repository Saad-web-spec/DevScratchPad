/**
 * PromptCraft Studio — Engine Selector (Dedicated Video vs Image Modes)
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';
import { EngineTarget, StudioMode } from '../types';

interface EngineMeta {
  id: EngineTarget;
  name: string;
  tag: string;
  badge: string;
}

const VIDEO_ENGINES: EngineMeta[] = [
  { id: 'runway-gen3', name: 'Runway Gen-3', tag: 'Temporal Video', badge: 'Bracketed Cues' },
  { id: 'sora', name: 'OpenAI Sora', tag: 'Cinematic Flow', badge: 'Continuous Prose' },
  { id: 'kling', name: 'Kling 2.0', tag: 'High Motion', badge: 'Trajectory Vectors' },
];

const IMAGE_ENGINES: EngineMeta[] = [
  { id: 'midjourney-v6', name: 'Midjourney v6.1', tag: 'Photographic Glass', badge: '--style raw' },
  { id: 'flux-1', name: 'Flux.1', tag: 'Next-Gen Diffusion', badge: 'Micro-Textures' },
];

export function EngineSelector() {
  const {
    studioMode,
    setStudioMode,
    selectedEngine,
    setSelectedEngine,
  } = usePromptStore();

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-2 sm:p-2.5 shadow-xs space-y-2">
      {/* 1. Primary Studio Mode Switcher: Video vs Image */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200 text-xs font-bold">
        <button
          onClick={() => setStudioMode('video')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md transition-all cursor-pointer ${
            studioMode === 'video'
              ? 'bg-white text-orange-950 shadow-xs border border-orange-200'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Film className="w-4 h-4 text-orange-600" />
          <span>🎬 Video Generation</span>
        </button>

        <button
          onClick={() => setStudioMode('image')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md transition-all cursor-pointer ${
            studioMode === 'image'
              ? 'bg-white text-orange-950 shadow-xs border border-orange-200'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-orange-600" />
          <span>🖼️ Image Generation</span>
        </button>
      </div>

      {/* 2. Sub-Engine Selector for the Active Mode */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-50 rounded-lg border border-zinc-200/80">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 shrink-0">
          Target Engine:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 flex-1">
          {(studioMode === 'video' ? VIDEO_ENGINES : IMAGE_ENGINES).map((engine) => {
            const isActive = selectedEngine === engine.id;
            return (
              <button
                key={engine.id}
                onClick={() => setSelectedEngine(engine.id)}
                className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? 'bg-white border-orange-400 text-orange-950 shadow-xs font-bold'
                    : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
                }`}
              >
                <span>{engine.name}</span>
                <span
                  className={`text-[9px] px-1 py-px rounded font-mono hidden md:inline ${
                    isActive ? 'bg-orange-100 text-orange-800' : 'bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {engine.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
