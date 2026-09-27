/**
 * PromptCraft Studio — Real WebGPU Model Status & Lifecycle Banner
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import {
  Cpu,
  CheckCircle2,
  DownloadCloud,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

interface ModelStatusBannerProps {
  onLoadModel: () => void;
}

export function ModelStatusBanner({ onLoadModel }: ModelStatusBannerProps) {
  const {
    modelStatus,
    downloadInfo,
    hardwareBackend,
    gpuInfo,
  } = usePromptStore();

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3">
      {/* State 1: Ready / Cached */}
      {modelStatus === 'ready' && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-zinc-900">
                Qwen2.5-0.5B-Instruct Ready
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                {hardwareBackend === 'webgpu' ? 'WebGPU Direct' : 'WASM'}
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                • 100% Local Browser Execution
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero API Keys • Offline Cached</span>
          </div>
        </div>
      )}

      {/* State 2: Downloading & Caching */}
      {modelStatus === 'downloading' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center text-orange-700 animate-spin">
                <RotateCw className="w-3 h-3" />
              </div>
              <span className="font-bold text-zinc-900">
                Downloading & Caching Qwen2.5 Model...
              </span>
            </div>
            <span className="font-mono font-bold text-orange-700">
              {Math.round(downloadInfo.progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] via-[#EA580C] to-[#C2410C] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(100, downloadInfo.progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span className="truncate max-w-[280px]">
              {downloadInfo.file ? `Fetching: ${downloadInfo.file}` : 'Connecting to Hugging Face CDN...'}
            </span>
            <span>
              {((downloadInfo.loadedBytes || 0) / (1024 * 1024)).toFixed(1)} MB / ~310 MB
            </span>
          </div>
        </div>
      )}

      {/* State 3: Unloaded Initial State */}
      {modelStatus === 'unloaded' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                  Local AI Model: Qwen2.5-0.5B-Instruct
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  ~310 MB
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Runs 100% inside your browser via WebGPU. Cached permanently in your browser for offline use.
              </p>
            </div>
          </div>

          <button
            onClick={onLoadModel}
            className="promptcraft-fox-btn flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Initialize WebGPU Model</span>
          </button>
        </div>
      )}

      {/* State 4: Error State */}
      {modelStatus === 'error' && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Failed to initialize WebGPU model. Check browser WebGPU flags or network connection.</span>
          </div>
          <button
            onClick={onLoadModel}
            className="px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-800 font-bold transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
