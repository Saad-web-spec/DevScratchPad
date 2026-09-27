/**
 * PromptCraft Studio — Dedicated Image Prompt Compiler Studio
 * Cosmic pitch-dark theme with Deep Directorial Intelligence
 * BSL 1.1 License
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  Camera,
  Sun,
  Palette,
  Sliders,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { StudioHeader } from './StudioHeader';
import { Starfield } from './Starfield';
import { SceneIntelligencePanel } from './SceneIntelligencePanel';
import { OutputPanel } from './OutputPanel';
import { MoERouterBadge } from './MoERouterBadge';
import { useInferenceWorker } from '../hooks/useInferenceWorker';
import { usePromptStore } from '../store/usePromptStore';
import { AspectRatio, EngineTarget, FocalLength, LightingScheme, ColorPalette } from '../types';
import {
  FOCAL_LENGTH_LABELS,
  LIGHTING_SCHEME_LABELS,
  COLOR_PALETTE_LABELS,
  CURATED_PRESETS,
} from '../lib/promptCompiler';

const IMAGE_ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '1:1', label: '1:1', desc: 'Square (Instagram/Avatar)' },
  { id: '16:9', label: '16:9', desc: 'Landscape Widescreen' },
  { id: '9:16', label: '9:16', desc: 'Vertical Story / Mobile' },
  { id: '4:5', label: '4:5', desc: 'Portrait Feed' },
  { id: '2:3', label: '2:3', desc: 'Classic 35mm Photo' },
  { id: '4:3', label: '4:3', desc: 'Classic Print' },
];

const IMAGE_ENGINES: { id: EngineTarget; name: string; badge: string; desc: string }[] = [
  { id: 'midjourney-v6', name: 'Midjourney v6.1', badge: '--style raw', desc: 'Photographic glass, optical realism, syntax flags' },
  { id: 'flux-1', name: 'Flux.1', badge: 'Micro-Textures', desc: 'Dense tactile rendering and hyper-precise sensor details' },
];

const IMAGE_QUICK_IDEAS = [
  'A cybernetic street vendor repairing an illuminated holographic koi fish in rain-slicked Shibuya',
  'Macro photograph of an ancient brass astrolabe reflecting starlight, depth of field',
  'Bioluminescent orchid flowering inside a mist-filled Victorian glass terrarium at twilight',
  'Weathered desert wanderer in ceremonial ceramic mask standing before colossal sandstone ruins',
];

export function ImagePromptStudio() {
  const [isMounted, setIsMounted] = useState(false);
  const { compile, loadNeuralModel, isGenerating } = useInferenceWorker();

  const {
    studioMode,
    setStudioMode,
    selectedEngine,
    setSelectedEngine,
    userIdea,
    setUserIdea,
    cinematics,
    setAspectRatio,
    setCinematics,
    errorMessage,
    loadPreset,
  } = usePromptStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (studioMode !== 'image') {
      setStudioMode('image');
    }
  }, [studioMode, setStudioMode]);

  const imagePresets = CURATED_PRESETS.filter((p) => p.mode === 'image');

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>Loading Image Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-50 flex flex-col font-sans selection:bg-orange-600 selection:text-white relative">

      {/* Header */}
      <StudioHeader activeTab="images" />

      {/* Quick Presets Sub-bar */}
      <div className="relative z-10 border-b border-white/10 bg-[#0c0e18]/70 backdrop-blur-md px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Image Presets:
          </span>
          <div className="flex items-center gap-1.5 py-0.5 min-w-max">
            {imagePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all border shrink-0 bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-orange-500/50 hover:text-white hover:bg-orange-950/40 shadow-xs cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Body */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-6 space-y-4 flex-1">
        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sparse MoE Router Badge & Telemetry */}
        <MoERouterBadge onLoadModel={loadNeuralModel} />

        {/* Target Engine Sub-bar */}
        <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">
              Target Image Engine:
            </span>
            <div className="flex items-center gap-1.5">
              {IMAGE_ENGINES.map((engine) => {
                const isActive = selectedEngine === engine.id;
                return (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-950/80 border-orange-500 text-orange-300 font-bold shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>{engine.name}</span>
                    <span
                      className={`text-[9px] px-1 py-px rounded font-mono ${
                        isActive ? 'bg-orange-900/80 text-orange-300 font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {engine.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>Client-Side Semantic NLP (<span className="text-orange-400">&lt;15ms</span>)</span>
          </div>
        </div>

        {/* Two-Column Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Image Concept & Photographic Optical Matrix */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Core Concept Input */}
            <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    1. Scene Concept & Subject
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {userIdea.length} characters
                </span>
              </div>

              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="Describe your visual concept in detail (e.g. A cybernetic street vendor repairing an illuminated holographic koi fish in rain-slicked Shibuya...)"
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 resize-y transition-all leading-relaxed font-sans"
              />

              {/* Quick Inspiration Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Lightbulb className="w-3 h-3 text-orange-400" />
                  <span>Quick Concepts:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {IMAGE_QUICK_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserIdea(idea)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-orange-500/40 transition-colors text-left truncate max-w-full cursor-pointer"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Directorial Scene Intelligence & Analyzer */}
            <SceneIntelligencePanel
              idea={userIdea}
              cinematics={cinematics}
              engine={selectedEngine}
              onUpdateCinematics={setCinematics}
            />

            {/* 3. Photographic Optical Specification Matrix */}
            <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Camera className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  2. Optical & Photographic Matrix
                </h3>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {IMAGE_ASPECT_RATIOS.map((ar) => {
                    const isSelected = cinematics.aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id)}
                        className={`p-2 rounded-lg text-center transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-bold shadow-xs'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-mono font-bold">{ar.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lens Glass & Focal Length */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Camera Prime Glass</span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    {FOCAL_LENGTH_LABELS[cinematics.focalLength]?.desc}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(FOCAL_LENGTH_LABELS) as FocalLength[]).map((focal) => {
                    const info = FOCAL_LENGTH_LABELS[focal];
                    const isSelected = cinematics.focalLength === focal;
                    return (
                      <button
                        key={focal}
                        type="button"
                        onClick={() => setCinematics({ focalLength: focal })}
                        className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-semibold shadow-xs'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{info.label}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lighting Scheme */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-orange-400" />
                  <span>Lighting Physics Scheme</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(LIGHTING_SCHEME_LABELS) as LightingScheme[]).map((scheme) => {
                    const info = LIGHTING_SCHEME_LABELS[scheme];
                    const isSelected = cinematics.lightingScheme === scheme;
                    return (
                      <button
                        key={scheme}
                        type="button"
                        onClick={() => setCinematics({ lightingScheme: scheme })}
                        className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-semibold shadow-xs'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{info.label}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Palette & Film Stock */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-orange-400" />
                  <span>Color Timing & Film Stock</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(COLOR_PALETTE_LABELS) as ColorPalette[]).map((palette) => {
                    const info = COLOR_PALETTE_LABELS[palette];
                    const isSelected = cinematics.colorPalette === palette;
                    return (
                      <button
                        key={palette}
                        type="button"
                        onClick={() => setCinematics({ colorPalette: palette })}
                        className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-semibold shadow-xs'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{info.label}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine Controls: Stylize, Raw Mode, Micro-Textures */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>Stylize Engine Intensity (--s)</span>
                  </div>
                  <span className="font-mono text-orange-400">{cinematics.stylize}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={cinematics.stylize}
                  onChange={(e) => setCinematics({ stylize: Number(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-bold text-white">Raw Photographic Mode (--style raw)</div>
                    <div className="text-[11px] text-zinc-400">
                      Disables Midjourney aesthetic bias for raw optical neutrality
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCinematics({ rawMode: !cinematics.rawMode })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      cinematics.rawMode ? 'bg-orange-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform transform ${
                        cinematics.rawMode ? 'translate-x-6' : 'translate-x-1'
                      } top-1 absolute`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Compilation Action Bar */}
            <div className="pt-2">
              <button
                onClick={compile}
                disabled={isGenerating}
                className="promptcraft-fox-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isGenerating ? 'Synthesizing with Local Neural MoE...' : 'Compile Photographic Prompt'}</span>
                <span className="text-[11px] font-mono opacity-80">(SmolLM2 ~45MB Local Engine)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Output & Terminal Panel */}
          <div className="lg:col-span-5 sticky top-20">
            <OutputPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
