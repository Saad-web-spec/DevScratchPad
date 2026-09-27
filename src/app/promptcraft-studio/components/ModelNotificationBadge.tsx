/**
 * PromptCraft Studio — Dismissible WebGPU Model Notification Badge
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React, { useState } from 'react';
import {
  Cpu,
  RotateCw,
  AlertTriangle,
  X,
  DownloadCloud,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

interface ModelNotificationBadgeProps {
  onLoadModel: () => void;
}

export function ModelNotificationBadge({ onLoadModel }: ModelNotificationBadgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    modelStatus,
    downloadInfo,
    hardwareBackend,
  } = usePromptStore();

  // If user cleared/dismissed the badge, it is completely gone
  if (isDismissed) {
    return null;
  }

  // Ready state: subtle, compact notification pill
  if (modelStatus === 'ready') {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 text-xs text-emerald-300">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0 animate-pulse" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white">SmolLM2-135M-Instruct Ready</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              {hardwareBackend === 'webgpu' ? 'WebGPU Direct' : 'WASM'}
            </span>
            <span className="text-[11px] text-emerald-400/80 hidden sm:inline">
              • ~45 MB • 100% In-Browser • Offline Cached
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors cursor-pointer shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss model status"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Downloading & Caching state: live % and MB progress bar
  if (modelStatus === 'downloading') {
    return (
      <div className="bg-zinc-900/90 border border-orange-500/30 rounded-xl p-3.5 shadow-lg space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 animate-spin">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white">
              Downloading & Caching Local SmolLM2 Model...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-orange-400">
              {Math.round(downloadInfo.progress)}%
            </span>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss downloading status"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B00] via-[#EA580C] to-[#C2410C] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(4, Math.min(100, downloadInfo.progress))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span className="truncate max-w-[280px]">
            {downloadInfo.file ? `Caching: ${downloadInfo.file}` : 'Connecting to Hugging Face CDN...'}
          </span>
          <span>
            {((downloadInfo.loadedBytes || 0) / (1024 * 1024)).toFixed(1)} MB / ~45 MB
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (modelStatus === 'error') {
    return (
      <div className="bg-red-950/50 border border-red-800/60 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 text-xs text-red-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>WebGPU initialization issue. Algorithmic compiler will execute instantly.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadModel}
            className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Unloaded initial state: Sleek, non-intrusive banner that user can initialize or dismiss
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
          <Cpu className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">Local AI Model: SmolLM2-135M-Instruct</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-800/60 font-bold">
              ~45 MB
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug truncate">
            Ultra-fast ~2s loading • 100% in-browser via WebGPU • Zero server transmission
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onLoadModel}
          className="promptcraft-fox-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>Load AI Model</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Dismiss badge"
          aria-label="Dismiss badge"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
