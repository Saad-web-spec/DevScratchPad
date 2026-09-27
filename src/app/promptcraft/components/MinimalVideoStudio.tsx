/**
 * PromptCraft Studio — Minimalist Video Prompt Studio (Temporal Miller's Law Layout)
 * Flat horizontal timeline track, standard chunked editor, global settings & output terminal.
 * BSL 1.1 License
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Plus, Trash2, Video, Terminal } from 'lucide-react';
import { usePromptStore } from '../../promptcraft-studio/store/usePromptStore';
import {
  AspectRatio,
  EngineTarget,
  CameraMovement,
} from '../../promptcraft-studio/types';
import {
  CAMERA_MOVEMENT_LABELS,
  compilePromptAlgorithmic,
} from '../../promptcraft-studio/lib/promptCompiler';

const VIDEO_ENGINES: { id: EngineTarget; label: string }[] = [
  { id: 'sora', label: 'OpenAI Sora (Narrative Flow)' },
  { id: 'runway-gen3', label: 'Runway Gen-3 (Bracketed Cues)' },
  { id: 'kling', label: 'Kling 2.0 (Kinematic Vectors)' },
];

const VIDEO_ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: '16:9', label: '16:9 (Cinematic Widescreen)' },
  { id: '2.39:1', label: '2.39:1 (Anamorphic Scope)' },
  { id: '9:16', label: '9:16 (Vertical Video)' },
  { id: '4:3', label: '4:3 (IMAX Academy)' },
  { id: '1:1', label: '1:1 (Square)' },
];

const CAMERA_MOTIONS: { id: CameraMovement; label: string }[] = [
  { id: 'dolly-in', label: 'Dolly In (Forward Push)' },
  { id: 'dolly-out', label: 'Dolly Out (Backward Reveal)' },
  { id: 'tracking-shot', label: 'Tracking Shot (Lateral Move)' },
  { id: 'crane-pedestal', label: 'Crane / Pedestal (Vertical Boom)' },
  { id: 'orbit', label: '360° Orbit (Arc Rotation)' },
  { id: 'whip-pan', label: 'Whip Pan (Fast Transition)' },
  { id: 'static-tripod', label: 'Static Tripod (Locked Position)' },
];

export function MinimalVideoStudio() {
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');

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
    timelineBeats,
    addBeat,
    updateBeat,
    removeBeat,
    outputPrompt,
  } = usePromptStore();

  useEffect(() => {
    setIsMounted(true);
    if (studioMode !== 'video') {
      setStudioMode('video');
    }
    if (
      selectedEngine !== 'sora' &&
      selectedEngine !== 'runway-gen3' &&
      selectedEngine !== 'kling'
    ) {
      setSelectedEngine('sora');
    }
  }, [studioMode, setStudioMode, selectedEngine, setSelectedEngine]);

  // Ensure an active beat is selected
  useEffect(() => {
    if (timelineBeats.length > 0) {
      const exists = timelineBeats.some((b) => b.id === selectedBeatId);
      if (!exists) {
        setSelectedBeatId(timelineBeats[0].id);
      }
    } else {
      setSelectedBeatId('');
    }
  }, [timelineBeats, selectedBeatId]);

  const activeBeat = useMemo(() => {
    return timelineBeats.find((b) => b.id === selectedBeatId) || timelineBeats[0];
  }, [timelineBeats, selectedBeatId]);

  // Dynamic Prompt Compilation for Video
  const compiledVideoPrompt = useMemo(() => {
    if (outputPrompt && studioMode === 'video') return outputPrompt;
    const baseConcept = userIdea || 'Cinematic sequence with dynamic subject kinematics';
    return compilePromptAlgorithmic(
      baseConcept,
      cinematics,
      timelineBeats,
      selectedEngine as EngineTarget
    );
  }, [outputPrompt, userIdea, cinematics, timelineBeats, selectedEngine, studioMode]);

  const estimatedTokens = useMemo(() => {
    if (!compiledVideoPrompt) return 0;
    return Math.ceil(compiledVideoPrompt.length / 3.8);
  }, [compiledVideoPrompt]);

  const characterCount = compiledVideoPrompt.length;
  const wordCount = compiledVideoPrompt ? compiledVideoPrompt.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    if (!compiledVideoPrompt) return;
    try {
      await navigator.clipboard.writeText(compiledVideoPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleAddBeat = () => {
    addBeat();
  };

  if (!isMounted) {
    return (
      <div className="h-[calc(100vh-48px)] flex items-center justify-center bg-[#121212] text-zinc-500 font-mono text-xs">
        Initializing Video Studio...
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 bg-[#121212] text-[#E8E8E8] min-h-[calc(100vh-48px)]">
      
      {/* ─────────────────────────────────────────────────────────────
          1. THE TIMELINE UI (TOP HALF)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] border border-white/10 rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Video className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
            <h2 className="text-sm font-medium text-[#E8E8E8]">
              Temporal Timeline Sequencer
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
              ({timelineBeats.length} {timelineBeats.length === 1 ? 'segment' : 'segments'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Master Concept:</span>
            <input
              type="text"
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder="e.g. Cybernetic courier navigating neon rooftops..."
              className="bg-[#242424] border border-white/10 rounded px-2.5 py-1 text-xs text-[#E8E8E8] placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400 w-64 sm:w-80"
            />
            <button
              type="button"
              onClick={handleAddBeat}
              className="py-1 px-2.5 rounded bg-[#242424] hover:bg-[#2e2e2e] text-[#E8E8E8] border border-white/20 text-xs font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block</span>
            </button>
          </div>
        </div>

        {/* Flat Horizontal Track (No Gradients) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
            <span>00:00 (Start)</span>
            <span>Chronological Progress</span>
            <span>Duration Lock</span>
          </div>

          {/* Simple Flat Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {timelineBeats.map((beat, idx) => {
              const isSelected = beat.id === activeBeat?.id;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => setSelectedBeatId(beat.id)}
                  className={`p-2.5 rounded text-left border transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#242424] border-white/30 text-[#E8E8E8] ring-1 ring-slate-400'
                      : 'bg-[#121212] border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span>Segment {idx + 1}</span>
                    <span className="tabular-nums">{beat.timestamp}</span>
                  </div>
                  <div className="text-xs font-medium truncate text-[#E8E8E8]">
                    {beat.focalSubject || 'Focal Subject'}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {beat.cameraMotion || 'Camera Motion'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Form for Selected Segment */}
        {activeBeat && (
          <div className="bg-[#121212] border border-white/10 rounded p-4 space-y-4 pt-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-medium text-[#E8E8E8] flex items-center gap-2">
                <span>Editing Segment:</span>
                <input
                  type="text"
                  value={activeBeat.timestamp}
                  onChange={(e) => updateBeat(activeBeat.id, { timestamp: e.target.value })}
                  className="bg-[#1A1A1A] border border-white/10 rounded px-2 py-0.5 font-mono text-xs text-[#E8E8E8] w-28 focus:outline-none focus:border-white/30"
                />
              </span>

              {timelineBeats.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBeat(activeBeat.id)}
                  className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remove this segment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Block</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Camera Motion */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Camera Motion</label>
                <input
                  type="text"
                  value={activeBeat.cameraMotion}
                  onChange={(e) => updateBeat(activeBeat.id, { cameraMotion: e.target.value })}
                  placeholder="e.g. Dolly in, slow forward push"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#E8E8E8] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Focal Subject */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Focal Subject</label>
                <input
                  type="text"
                  value={activeBeat.focalSubject}
                  onChange={(e) => updateBeat(activeBeat.id, { focalSubject: e.target.value })}
                  placeholder="e.g. Courier's gloved fingers"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#E8E8E8] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">Action / Kinematics</label>
                <input
                  type="text"
                  value={activeBeat.action}
                  onChange={(e) => updateBeat(activeBeat.id, { action: e.target.value })}
                  placeholder="e.g. Solders microchip, sparks fly outward"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#E8E8E8] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. BOTTOM SECTION: GLOBAL SETTINGS (LEFT) & OUTPUT TERMINAL (RIGHT)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Global Settings (Bottom Left: 5 Cols) */}
        <section className="lg:col-span-5 bg-[#1A1A1A] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="border-b border-white/10 pb-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Global Variables
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Target Engine */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="video-engine-select" className="text-zinc-400 shrink-0">
                Target Engine
              </label>
              <select
                id="video-engine-select"
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value as EngineTarget)}
                className="bg-[#121212] border border-white/10 text-xs text-[#E8E8E8] rounded px-2.5 py-1.5 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400 transition-colors w-52"
              >
                {VIDEO_ENGINES.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frame Rate */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="fps-select" className="text-zinc-400 shrink-0">
                Frame Rate (FPS)
              </label>
              <select
                id="fps-select"
                value={cinematics.fps}
                onChange={(e) => setCinematics({ fps: Number(e.target.value) as 24 | 30 | 60 })}
                className="bg-[#121212] border border-white/10 text-xs text-[#E8E8E8] rounded px-2.5 py-1.5 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400 transition-colors w-52"
              >
                <option value={24}>24 FPS (Cinematic standard)</option>
                <option value={30}>30 FPS (Fluid video)</option>
                <option value={60}>60 FPS (High-speed smooth)</option>
              </select>
            </div>

            {/* Motion Intensity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Motion Intensity</span>
                <span className="font-mono text-zinc-300 tabular-nums">
                  {cinematics.motionStrength} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={cinematics.motionStrength}
                onChange={(e) => setCinematics({ motionStrength: Number(e.target.value) })}
                className="w-full accent-slate-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 (Subtle drift)</span>
                <span>5 (Natural camera)</span>
                <span>10 (Aggressive kinetic)</span>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-white/5">
              <label htmlFor="video-ar-select" className="text-zinc-400 shrink-0">
                Aspect Ratio
              </label>
              <select
                id="video-ar-select"
                value={cinematics.aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-[#121212] border border-white/10 text-xs text-[#E8E8E8] rounded px-2.5 py-1.5 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400 transition-colors w-52"
              >
                {VIDEO_ASPECT_RATIOS.map((ar) => (
                  <option key={ar.id} value={ar.id}>
                    {ar.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Motion Default */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="default-motion-select" className="text-zinc-400 shrink-0">
                Global Trajectory
              </label>
              <select
                id="default-motion-select"
                value={cinematics.cameraMovement}
                onChange={(e) => setCinematics({ cameraMovement: e.target.value as CameraMovement })}
                className="bg-[#121212] border border-white/10 text-xs text-[#E8E8E8] rounded px-2.5 py-1.5 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-slate-400 transition-colors w-52"
              >
                {CAMERA_MOTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Output Terminal (Bottom Right: 7 Cols) */}
        <section className="lg:col-span-7 bg-[#1A1A1A] border border-white/10 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Output Terminal ({selectedEngine})
              </h3>
            </div>
            
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500 tabular-nums">
              <span>{estimatedTokens} tok</span>
              <span>•</span>
              <span>{characterCount} chars</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Flat Dark-Gray Console Box */}
          <div className="bg-[#121212] border border-white/10 rounded p-4 font-mono text-xs leading-relaxed text-zinc-300 min-h-[190px] overflow-x-auto select-all">
            {compiledVideoPrompt ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-[#E8E8E8]">
                {compiledVideoPrompt}
              </pre>
            ) : (
              <div className="h-36 flex items-center justify-center text-zinc-600 font-mono text-xs">
                Timeline output syntax will display here.
              </div>
            )}
          </div>

          {/* 1-Click Copy Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-zinc-500">
              Formatted for direct copy into generation prompt input
            </span>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!compiledVideoPrompt}
              className="py-1.5 px-3 rounded bg-[#242424] hover:bg-[#2e2e2e] active:bg-[#1a1a1a] text-[#E8E8E8] border border-white/20 text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
