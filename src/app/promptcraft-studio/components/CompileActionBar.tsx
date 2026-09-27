/**
 * PromptCraft Studio — Compile Action Bar (Fox-Orange Gradient)
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import { Zap, Square, Sparkles, Loader2 } from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

interface CompileActionBarProps {
  onCompile: () => void;
  onAbort: () => void;
}

export function CompileActionBar({ onCompile, onAbort }: CompileActionBarProps) {
  const { isGenerating, modelStatus, selectedEngine } = usePromptStore();

  const isDownloading = modelStatus === 'downloading';

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 space-y-2">
      <div className="flex items-center gap-3">
        {isGenerating ? (
          <button
            onClick={onAbort}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all shadow-sm cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current text-red-600" />
            <span>Stop Generation</span>
          </button>
        ) : isDownloading ? (
          <button
            disabled
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-orange-50 text-orange-800 border border-orange-200 opacity-80 cursor-not-allowed shadow-xs"
          >
            <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
            <span>Downloading Qwen2.5 Weights...</span>
          </button>
        ) : (
          <button
            onClick={onCompile}
            className="promptcraft-fox-btn flex items-center gap-2.5 px-9 py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all transform active:scale-98"
          >
            <Zap className="w-4 h-4 text-amber-200 fill-amber-200/50" />
            <span>Compile Cinematic Prompt</span>
            <Sparkles className="w-4 h-4 text-amber-200" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <span>Target: <strong className="text-orange-700 font-mono">{selectedEngine}</strong></span>
        <span>•</span>
        <span>
          Engine:{' '}
          <span className="text-zinc-800 font-mono font-semibold">
            Qwen2.5-0.5B-Instruct WebGPU
          </span>
        </span>
      </div>
    </div>
  );
}
