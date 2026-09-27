/**
 * PromptCraft Studio — Sparse MoE (Mixture of Experts) Router & Telemetry Badge
 * Displays active vs idle expert weights, WebGPU/WASM acceleration, and SmolLM2 ~45MB status.
 * BSL 1.1 License
 */

'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Camera,
  Film,
  Sparkles,
  RotateCw,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

interface MoERouterBadgeProps {
  onLoadModel?: () => void;
}

export function MoERouterBadge({ onLoadModel }: MoERouterBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    studioMode,
    moeTelemetry,
    modelStatus,
    downloadInfo,
    hardwareBackend,
  } = usePromptStore();

  if (isDismissed) return null;

  const isVideo = studioMode === 'video';

  return (
    <div className="bg-[#0c0e18]/85 border border-white/10 rounded-xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md space-y-3 transition-all">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Sparse MoE Gating Router
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-orange-950/80 text-orange-400 border border-orange-700/60">
                {isVideo ? '🎬 Video Domain Active' : '📷 Image Domain Active'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                {hardwareBackend === 'webgpu' ? 'WebGPU Direct' : 'WASM Core'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block truncate">
              Intended domain weights load on-demand while irrelevant expert weights sit idle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Neural Engine Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-white font-medium">SmolLM2-135M</span>
            <span className="text-orange-400 font-bold">(~45 MB)</span>
            {modelStatus === 'ready' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse router telemetry' : 'Expand router telemetry'}
            aria-label="Toggle router telemetry"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Dismiss router badge"
            aria-label="Dismiss router badge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Download Progress Bar (When downloading SmolLM2) */}
      {modelStatus === 'downloading' && (
        <div className="p-2.5 rounded-lg bg-black/40 border border-orange-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>Caching SmolLM2-135M (~45 MB) in IndexedDB...</span>
            </span>
            <span className="text-orange-400 font-bold">
              {Math.round(downloadInfo.progress)}% • {((downloadInfo.loadedBytes || 0) / (1024 * 1024)).toFixed(1)} MB / 45 MB
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B00] via-[#EA580C] to-[#C2410C] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, Math.min(100, downloadInfo.progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Expert Routing Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-white/5">
          {/* Expert 1: Photographic Optics */}
          <div
            className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
              !isVideo
                ? 'bg-orange-950/40 border-orange-500/50 shadow-[0_0_12px_rgba(234,88,12,0.15)]'
                : 'bg-zinc-950/40 border-white/5 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className={`w-3.5 h-3.5 ${!isVideo ? 'text-orange-400' : 'text-zinc-500'}`} />
                <span className={`font-bold ${!isVideo ? 'text-white' : 'text-zinc-400'}`}>
                  Expert: Optics
                </span>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  !isVideo
                    ? 'bg-orange-900/60 text-orange-300 border border-orange-700/60'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {!isVideo ? 'ACTIVE (95%)' : 'IDLE (0%)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {!isVideo
                ? 'Prime glass, aperture falloff, raw mode syntax'
                : 'Weights sit inactive (zero compute overhead)'}
            </p>
          </div>

          {/* Expert 2: Spatio-Temporal Kinematics */}
          <div
            className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
              isVideo
                ? 'bg-orange-950/40 border-orange-500/50 shadow-[0_0_12px_rgba(234,88,12,0.15)]'
                : 'bg-zinc-950/40 border-white/5 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Film className={`w-3.5 h-3.5 ${isVideo ? 'text-orange-400' : 'text-zinc-500'}`} />
                <span className={`font-bold ${isVideo ? 'text-white' : 'text-zinc-400'}`}>
                  Expert: Kinematics
                </span>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isVideo
                    ? 'bg-orange-900/60 text-orange-300 border border-orange-700/60'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {isVideo ? 'ACTIVE (98%)' : 'IDLE (0%)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {isVideo
                ? '3D camera vectors, temporal beats, velocity curves'
                : 'Weights sit inactive (zero compute overhead)'}
            </p>
          </div>

          {/* Expert 3: Material & Atmospheric Physics */}
          <div className="p-2.5 rounded-lg border bg-zinc-950/60 border-white/10 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-bold text-white">Expert: Physics</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-zinc-800 text-orange-300 border border-zinc-700">
                ACTIVE ({Math.round((moeTelemetry.experts.find((e) => e.id === 'material-physics')?.weight || 0.75) * 100)}%)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight truncate">
              {moeTelemetry.experts.find((e) => e.id === 'material-physics')?.summary || 'Surface shaders & particle dynamics'}
            </p>
          </div>

          {/* Expert 4: Local Neural Synthesizer */}
          <div className="p-2.5 rounded-lg border bg-zinc-950/60 border-white/10 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-bold text-white">Expert: Neural SLM</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                {modelStatus === 'ready' ? 'READY' : 'ON-DEMAND'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              SmolLM2-135M (~45 MB) • Instant WebGPU compile
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
