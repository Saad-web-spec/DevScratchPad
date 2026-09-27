/**
 * PromptCraft Studio — Deep Dark Minimalist Image Prompt Studio (IDE Layout)
 * Deep obsidian canvas (#030303), MoE routing telemetry, WebGPU neural engine & 3-panel IDE.
 * BSL 1.1 License
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, ChevronDown, RefreshCw, Zap, Layers, Cpu } from 'lucide-react';
import { usePromptStore } from '../../promptcraft-studio/store/usePromptStore';
import { useInferenceWorker } from '../../promptcraft-studio/hooks/useInferenceWorker';
import { ModelNotificationBadge } from '../../promptcraft-studio/components/ModelNotificationBadge';
import { MoERouterBadge } from '../../promptcraft-studio/components/MoERouterBadge';
import {
  AspectRatio,
  EngineTarget,
  FocalLength,
  LightingScheme,
  ColorPalette,
} from '../../promptcraft-studio/types';
import {
  FOCAL_LENGTH_LABELS,
  LIGHTING_SCHEME_LABELS,
  COLOR_PALETTE_LABELS,
  analyzeScenePrompt,
  compilePromptAlgorithmic,
} from '../../promptcraft-studio/lib/promptCompiler';

const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: '1:1', label: '1:1 (Square)' },
  { id: '16:9', label: '16:9 (Landscape)' },
  { id: '9:16', label: '9:16 (Vertical)' },
  { id: '4:5', label: '4:5 (Portrait)' },
  { id: '2:3', label: '2:3 (35mm)' },
  { id: '4:3', label: '4:3 (Print)' },
];

const LENSES: { id: FocalLength; label: string }[] = [
  { id: '24mm-cinematic-wide', label: '24mm (Cinematic Wide)' },
  { id: '50mm-standard', label: '50mm (Standard Prime)' },
  { id: '85mm-portrait', label: '85mm (Portrait Telephoto)' },
  { id: '14mm-ultra-wide', label: '14mm (Ultra-Wide)' },
  { id: 'anamorphic-bokeh', label: 'Anamorphic 2x Bokeh' },
];

const LIGHTING_SCHEMES: { id: LightingScheme; label: string }[] = [
  { id: 'volumetric-rays', label: 'Volumetric Rays' },
  { id: 'chiaroscuro', label: 'Chiaroscuro' },
  { id: 'practical-neon', label: 'Practical Neon' },
  { id: 'golden-hour', label: 'Golden Hour' },
  { id: 'overcast-diffused', label: 'Overcast Diffused' },
];

const FILM_STOCKS: { id: ColorPalette; label: string }[] = [
  { id: 'kodachrome-64', label: 'Kodachrome 64' },
  { id: 'teal-orange-bleach', label: 'Teal & Orange Bleach Bypass' },
  { id: 'monochromatic-noir', label: 'Monochromatic Noir' },
  { id: 'muted-cyberpunk', label: 'Muted Cyberpunk' },
];

export function MinimalImageStudio() {
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
    outputPrompt,
    isGenerating,
    metrics,
    modelStatus,
  } = usePromptStore();

  const { compile, loadNeuralModel } = useInferenceWorker();

  useEffect(() => {
    setIsMounted(true);
    if (studioMode !== 'image') {
      setStudioMode('image');
    }
    if (selectedEngine !== 'midjourney-v6' && selectedEngine !== 'flux-1') {
      setSelectedEngine('midjourney-v6');
    }
  }, [studioMode, setStudioMode, selectedEngine, setSelectedEngine]);

  // Dynamic Prompt Compilation
  const compiledFullPrompt = useMemo(() => {
    if (outputPrompt && studioMode === 'image') return outputPrompt;
    if (!userIdea) return '';
    return compilePromptAlgorithmic(
      userIdea,
      cinematics,
      [],
      selectedEngine === 'flux-1' ? 'flux-1' : 'midjourney-v6'
    );
  }, [outputPrompt, userIdea, cinematics, selectedEngine, studioMode]);

  // Split compiled prompt into primary subject and appended technical parameters
  const { primarySubjectText, secondaryParametersText } = useMemo(() => {
    if (!compiledFullPrompt) {
      return { primarySubjectText: '', secondaryParametersText: '' };
    }

    if (selectedEngine === 'midjourney-v6') {
      const parts = compiledFullPrompt.split(', ');
      if (parts.length > 1) {
        return {
          primarySubjectText: parts[0],
          secondaryParametersText: parts.slice(1).join(', '),
        };
      }
    }

    const firstPeriod = compiledFullPrompt.indexOf('.');
    if (firstPeriod !== -1) {
      return {
        primarySubjectText: compiledFullPrompt.slice(0, firstPeriod + 1),
        secondaryParametersText: compiledFullPrompt.slice(firstPeriod + 1).trim(),
      };
    }

    return {
      primarySubjectText: compiledFullPrompt,
      secondaryParametersText: '',
    };
  }, [compiledFullPrompt, selectedEngine]);

  // Scene Intelligence Analysis for AST View
  const sceneAst = useMemo(() => {
    const intel = analyzeScenePrompt(
      userIdea,
      cinematics,
      selectedEngine as EngineTarget,
      cinematics.directorStyle || 'none'
    );

    return {
      neuralMoE: {
        activeExpert: 'Photographic Optics & Glass Science (95%)',
        idleExpert: 'Spatio-Temporal Kinematics (0% overhead)',
        localEngine: 'SmolLM2-135M (~45 MB) In-Browser',
      },
      engine: selectedEngine,
      baseSubject: userIdea || '(empty)',
      parameters: {
        aspectRatio: cinematics.aspectRatio,
        lens: FOCAL_LENGTH_LABELS[cinematics.focalLength]?.label || cinematics.focalLength,
        lighting: LIGHTING_SCHEME_LABELS[cinematics.lightingScheme]?.label || cinematics.lightingScheme,
        filmStock: COLOR_PALETTE_LABELS[cinematics.colorPalette]?.label || cinematics.colorPalette,
        rawMode: cinematics.rawMode,
        stylize: cinematics.stylize,
      },
      ast: {
        primarySubject: intel.primarySubject,
        subjectDetails: intel.subjectDetails,
        environmentSetting: intel.environmentSetting,
        atmosphericPhysics: intel.atmosphericPhysics,
        lightingScheme: intel.lightingScheme,
        opticsProfile: intel.opticsProfile,
        colorGrading: intel.colorGrading,
      },
    };
  }, [userIdea, cinematics, selectedEngine]);

  const estimatedTokens = useMemo(() => {
    if (metrics?.tokenCount) return metrics.tokenCount;
    if (!compiledFullPrompt) return 0;
    return Math.ceil(compiledFullPrompt.length / 3.8);
  }, [compiledFullPrompt, metrics]);

  const characterCount = compiledFullPrompt.length;
  const wordCount = compiledFullPrompt ? compiledFullPrompt.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    if (!compiledFullPrompt) return;
    try {
      await navigator.clipboard.writeText(compiledFullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-[calc(100vh-52px)] flex items-center justify-center bg-[#030303] text-zinc-500 font-mono text-xs">
        Initializing Image IDE...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-[#030303] text-[#E8E8E8] min-h-[calc(100vh-52px)]">
      {/* Model Loading Status Notification */}
      <div className="px-4 sm:px-6 pt-3">
        <ModelNotificationBadge onLoadModel={loadNeuralModel} />
      </div>

      {/* Sparse MoE Router Badge Banner */}
      <div className="px-4 sm:px-6 pt-3">
        <MoERouterBadge onLoadModel={loadNeuralModel} />
      </div>

      {/* 3-Panel IDE Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full p-4 sm:p-6 gap-4 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────
            1. LEFT PANEL - INPUT (30% width)
        ───────────────────────────────────────────────────────────── */}
        <section className="w-full lg:w-[30%] lg:min-w-[320px] lg:max-w-[400px] bg-[#0C0E14] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Header & Target Engine Select */}
            <div className="space-y-2 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-400" />
                  Photographic Optics Input
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Panel 01
                </span>
              </div>
              
              <div className="pt-1">
                <label htmlFor="engine-select" className="text-xs text-zinc-400 block mb-1">
                  Target Engine
                </label>
                <select
                  id="engine-select"
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value as EngineTarget)}
                  className="w-full bg-[#141722] border border-white/10 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-colors"
                >
                  <option value="midjourney-v6">Midjourney v6.1 (--style raw)</option>
                  <option value="flux-1">Flux.1 (Micro-Textures)</option>
                </select>
              </div>
            </div>

            {/* Base Prompt Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label htmlFor="base-prompt">Scene Concept & Subject</label>
                <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                  {userIdea.length} chars
                </span>
              </div>
              <textarea
                id="base-prompt"
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="e.g. A cybernetic street vendor repairing a holographic koi fish in rain-slicked Shibuya at twilight..."
                rows={4}
                className="w-full bg-[#141722] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 resize-y transition-colors leading-relaxed font-sans"
              />
            </div>

            {/* Compact Form Rows for Optical Parameters */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block pb-1 border-b border-white/5">
                Optical Specification Matrix
              </span>

              {/* Aspect Ratio */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label htmlFor="ar-select" className="text-zinc-400 shrink-0">
                  Aspect Ratio
                </label>
                <select
                  id="ar-select"
                  value={cinematics.aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="bg-[#141722] border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-colors w-44"
                >
                  {ASPECT_RATIOS.map((ar) => (
                    <option key={ar.id} value={ar.id}>
                      {ar.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera Lens */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label htmlFor="lens-select" className="text-zinc-400 shrink-0">
                  Prime Glass
                </label>
                <select
                  id="lens-select"
                  value={cinematics.focalLength}
                  onChange={(e) => setCinematics({ focalLength: e.target.value as FocalLength })}
                  className="bg-[#141722] border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-colors w-44"
                >
                  {LENSES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lighting Physics */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label htmlFor="lighting-select" className="text-zinc-400 shrink-0">
                  Lighting
                </label>
                <select
                  id="lighting-select"
                  value={cinematics.lightingScheme}
                  onChange={(e) => setCinematics({ lightingScheme: e.target.value as LightingScheme })}
                  className="bg-[#141722] border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-colors w-44"
                >
                  {LIGHTING_SCHEMES.map((ls) => (
                    <option key={ls.id} value={ls.id}>
                      {ls.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Film Stock & Color Timing */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label htmlFor="film-select" className="text-zinc-400 shrink-0">
                  Film Stock
                </label>
                <select
                  id="film-select"
                  value={cinematics.colorPalette}
                  onChange={(e) => setCinematics({ colorPalette: e.target.value as ColorPalette })}
                  className="bg-[#141722] border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition-colors w-44"
                >
                  {FILM_STOCKS.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stylize & Raw Mode Row */}
              {selectedEngine === 'midjourney-v6' && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Stylize (--s)</span>
                    <span className="font-mono text-orange-400 tabular-nums">{cinematics.stylize}</span>
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

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-400">Raw Mode (--style raw)</span>
                    <input
                      type="checkbox"
                      checked={cinematics.rawMode}
                      onChange={(e) => setCinematics({ rawMode: e.target.checked })}
                      className="accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Neural MoE Compile Button */}
          <div className="pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={compile}
              disabled={isGenerating}
              className="w-full py-2.5 px-3 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-500/50 text-orange-200 text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  <span>Synthesizing with Local Neural MoE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>Compile with Neural MoE</span>
                  <span className="text-[10px] font-mono text-orange-400/80">(~45MB Local)</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2. CENTER PANEL - THE WORKSPACE (40% width)
        ───────────────────────────────────────────────────────────── */}
        <section className="flex-1 lg:w-[40%] bg-[#0C0E14] border border-white/10 rounded-xl flex flex-col p-4 sm:p-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                Live Prompt Workspace
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                • Monospace Stream
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#141722] border border-white/10">
              {selectedEngine}
            </span>
          </div>

          {/* Monospace Output Box with Visual Hierarchy */}
          <div className="flex-1 bg-[#050608] border border-white/10 rounded-lg p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-y-auto select-all">
            {isGenerating && (
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>Streaming tokens from local in-browser neural engine...</span>
              </div>
            )}

            {compiledFullPrompt ? (
              <div className="space-y-3">
                {/* Primary Subject in bolder text */}
                <div className="font-bold text-white text-[13px] leading-relaxed">
                  {primarySubjectText}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {/* Appended Technical Parameters in Muted Gray */}
                {secondaryParametersText && (
                  <div className="text-zinc-500 text-xs leading-relaxed border-t border-white/5 pt-2.5">
                    {secondaryParametersText}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-zinc-500 text-xs font-mono space-y-1.5">
                <Cpu className="w-8 h-8 text-zinc-700" />
                <span>Enter a concept on the left or click &quot;Compile&quot;.</span>
                <span className="text-[11px] text-zinc-600">
                  Local WebGPU inference with zero server transmission.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. RIGHT PANEL - TELEMETRY & OUTPUT (30% width)
        ───────────────────────────────────────────────────────────── */}
        <section className="w-full lg:w-[30%] lg:min-w-[300px] lg:max-w-[380px] bg-[#0C0E14] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-5 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                MoE Telemetry & Details
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Panel 03
              </span>
            </div>

            {/* Active MoE Expert Indicator */}
            <div className="bg-[#141722] border border-orange-500/20 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Domain MoE Router:</span>
                <span className="text-orange-400 font-bold font-mono text-[10px]">ACTIVE (95%)</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-mono">
                📷 Photographic Optics & Glass Science: Active
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                🎬 Spatio-Temporal Kinematics: Idle (0% overhead)
              </p>
            </div>

            {/* Metrics: Token Count, Speed, Characters, Words */}
            <div className="bg-[#141722] border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Token Count</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {estimatedTokens} tok
                </span>
              </div>
              {metrics && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Synthesis Speed</span>
                  <span className="font-mono font-bold text-orange-400 tabular-nums">
                    {metrics.tokensPerSecond} tok/s ({metrics.elapsedMs}ms)
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Characters</span>
                <span className="font-mono text-zinc-300 tabular-nums">
                  {characterCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Word Count</span>
                <span className="font-mono text-zinc-300 tabular-nums">
                  {wordCount}
                </span>
              </div>
            </div>

            {/* 1-Click Copy Button */}
            <div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!compiledFullPrompt}
                className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-800" />
                    <span>Copy Full Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Raw JSON AST View in Accordion Menu */}
            <div className="border border-white/10 rounded-lg bg-[#141722] overflow-hidden">
              <details className="group">
                <summary className="px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors">
                  <span>Raw JSON AST</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-zinc-500" />
                </summary>
                <div className="p-3 border-t border-white/5 bg-[#050608] overflow-x-auto max-h-56">
                  <pre className="font-mono text-[11px] text-zinc-400 leading-normal whitespace-pre-wrap">
                    {JSON.stringify(sceneAst, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>

          {/* Minimal Footer Info */}
          <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>SmolLM2-135M Core</span>
            <span className="text-orange-400/80">WebGPU Ready</span>
          </div>
        </section>

      </div>
    </div>
  );
}
