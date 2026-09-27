/**
 * PromptCraft Studio — Dedicated Video Prompt Compiler Studio
 * Cosmic pitch-dark theme with Deep Directorial Intelligence
 * BSL 1.1 License
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  Camera,
  Activity,
  Sliders,
  AlertCircle,
  Lightbulb,
  Layers,
} from 'lucide-react';
import { StudioHeader } from './StudioHeader';
import { Starfield } from './Starfield';
import { SceneIntelligencePanel } from './SceneIntelligencePanel';
import { TemporalTimeline } from './TemporalTimeline';
import { OutputPanel } from './OutputPanel';
import { MoERouterBadge } from './MoERouterBadge';
import { useInferenceWorker } from '../hooks/useInferenceWorker';
import { usePromptStore } from '../store/usePromptStore';
import { AspectRatio, EngineTarget, CameraMovement } from '../types';
import {
  CAMERA_MOVEMENT_LABELS,
  CURATED_PRESETS,
} from '../lib/promptCompiler';

const VIDEO_ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '16:9', label: '16:9', desc: 'Standard Cinematic 16:9' },
  { id: '2.39:1', label: '2.39:1', desc: 'Anamorphic Widescreen' },
  { id: '9:16', label: '9:16', desc: 'Vertical Video (Reels/TikTok)' },
  { id: '4:3', label: '4:3', desc: 'Classic IMAX Ratio' },
  { id: '1:1', label: '1:1', desc: 'Square 1:1' },
];

const VIDEO_ENGINES: { id: EngineTarget; name: string; badge: string; desc: string }[] = [
  { id: 'kling', name: 'Kling 2.0', badge: 'Trajectory Vectors', desc: 'High dynamic trajectory vectors and kinetic physics' },
  { id: 'runway-gen3', name: 'Runway Gen-3', badge: 'Bracketed Cues', desc: 'Temporal bracketed cues and strict camera commands' },
  { id: 'sora', name: 'OpenAI Sora', badge: 'Continuous Prose', desc: 'Continuous spatial-temporal descriptive narrative flow' },
];

const VIDEO_QUICK_IDEAS = [
  'A cybernetic courier repairing a broken drone on a rain-slicked Tokyo rooftop at dusk',
  'An ancient monolithic stargate activating inside an overgrown bioluminescent jungle',
  'Deep-sea research submersible gliding past colossal luminous siphonophore organisms',
  'Armored exploration convoy kicking up salt dust plumes at golden hour sunset',
];

export function VideoPromptStudio() {
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
    if (studioMode !== 'video') {
      setStudioMode('video');
    }
  }, [studioMode, setStudioMode]);

  const videoPresets = CURATED_PRESETS.filter((p) => p.mode === 'video');

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>Loading Video Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-50 flex flex-col font-sans selection:bg-orange-600 selection:text-white relative">

      {/* Header */}
      <StudioHeader activeTab="video" />

      {/* Quick Presets Sub-bar */}
      <div className="relative z-10 border-b border-white/10 bg-[#0c0e18]/70 backdrop-blur-md px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Video Presets:
          </span>
          <div className="flex items-center gap-1.5 py-0.5 min-w-max">
            {videoPresets.map((preset) => (
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
              Target Video Engine:
            </span>
            <div className="flex items-center gap-1.5">
              {VIDEO_ENGINES.map((engine) => {
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
            <span>Directorial Physics Engine (<span className="text-orange-400">&lt;15ms</span>)</span>
          </div>
        </div>

        {/* Two-Column Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Concept, Directorial Analyzer, Camera Kinetics, Timeline */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Core Scene Concept */}
            <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    1. Cinematic Scene Concept
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {userIdea.length} characters
                </span>
              </div>

              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="Describe your cinematic scene in natural detail (e.g. A cybernetic courier repairing a broken drone on a rain-slicked neo-Tokyo rooftop at dusk...)"
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
                  {VIDEO_QUICK_IDEAS.map((idea, idx) => (
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

            {/* 3. Camera Movement Vector & Kinematics */}
            <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Camera className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  2. Camera Trajectory Vector & Motion Dynamics
                </h3>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  Framing Aspect Ratio
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {VIDEO_ASPECT_RATIOS.map((ar) => {
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
                        <div className="text-[10px] text-zinc-400 truncate">{ar.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Camera Movement Vector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Camera Kinematic Vector</span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    {CAMERA_MOVEMENT_LABELS[cinematics.cameraMovement]?.desc}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(CAMERA_MOVEMENT_LABELS) as CameraMovement[]).map((move) => {
                    const info = CAMERA_MOVEMENT_LABELS[move];
                    const isSelected = cinematics.cameraMovement === move;
                    return (
                      <button
                        key={move}
                        type="button"
                        onClick={() => setCinematics({ cameraMovement: move })}
                        className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-semibold shadow-xs'
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{info.label}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{info.vector}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Motion Intensity Slider & FPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-orange-400" />
                      <span>Motion Intensity</span>
                    </div>
                    <span className="font-mono text-orange-400">{cinematics.motionStrength}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={cinematics.motionStrength}
                    onChange={(e) => setCinematics({ motionStrength: Number(e.target.value) })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>1 (Subtle)</span>
                    <span>5 (Natural)</span>
                    <span>10 (Aggressive)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-300">Frame Rate (FPS)</div>
                  <div className="grid grid-cols-3 gap-2">
                    {([24, 30, 60] as const).map((rate) => {
                      const isSelected = cinematics.fps === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setCinematics({ fps: rate })}
                          className={`py-2 rounded-lg text-center text-xs font-mono font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-orange-950/80 text-orange-300 border-orange-500 shadow-xs'
                              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {rate} FPS
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {cinematics.fps === 24 ? 'Standard cinematic motion cadence' : cinematics.fps === 30 ? 'Broadcast fluid motion' : 'High-speed action smoothness'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Temporal Sequence Timeline Builder */}
            <TemporalTimeline />

            {/* Direct Compilation Action Bar */}
            <div className="pt-2">
              <button
                onClick={compile}
                disabled={isGenerating}
                className="promptcraft-fox-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isGenerating ? 'Synthesizing with Local Neural MoE...' : 'Compile Directorial Video Prompt'}</span>
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
