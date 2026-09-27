/**
 * PromptCraft Studio — Scene Input & Parameters (Dedicated Video/Image Mode)
 * Client-Side Generative Prompt Compiler Platform
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import {
  Maximize2,
  Sliders,
  Activity,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';
import { AspectRatio } from '../types';

const ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '16:9', label: '16:9', desc: 'Standard Widescreen' },
  { id: '2.39:1', label: '2.39:1', desc: 'Cinematic Anamorphic' },
  { id: '9:16', label: '9:16', desc: 'Vertical Reel' },
  { id: '1:1', label: '1:1', desc: 'Square 1:1' },
  { id: '4:3', label: '4:3', desc: 'Classic IMAX' },
];

const QUICK_IDEAS = [
  'A cybernetic courier repairing a broken drone on a rain-soaked Tokyo rooftop at dusk',
  'An ancient monolithic stargate activating in an overgrown bioluminescent jungle',
  'A deep-sea research submersible gliding past a colossal luminous siphonophore',
  'An armored exploration convoy kicking up salt dust plumes at sunset',
];

export function SceneInput() {
  const {
    userIdea,
    setUserIdea,
    cinematics,
    setAspectRatio,
    setCinematics,
    studioMode,
  } = usePromptStore();

  const isVideo = studioMode === 'video';

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              1. Core Scene Concept
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {userIdea.length} characters
          </span>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Describe your baseline concept (e.g., A cybernetic courier repairing a broken drone in the rain...)"
            rows={4}
            className="w-full bg-zinc-50/70 hover:bg-zinc-50 focus:bg-white text-zinc-900 text-sm leading-relaxed p-3 rounded-lg border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all resize-y placeholder:text-zinc-400"
          />
        </div>

        {/* Quick Idea Starters */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 shrink-0">
            <Lightbulb className="w-3 h-3 text-orange-600" />
            Inspiration:
          </span>
          {QUICK_IDEAS.map((ideaText, i) => (
            <button
              key={i}
              onClick={() => setUserIdea(ideaText)}
              className="text-[11px] text-zinc-600 hover:text-orange-700 bg-zinc-100 hover:bg-orange-50 px-2 py-0.5 rounded border border-zinc-200/80 hover:border-orange-300 transition-colors truncate max-w-[200px] cursor-pointer"
              title={ideaText}
            >
              {ideaText}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Parameters */}
      <div className="pt-3 border-t border-zinc-100 space-y-3">
        {/* Aspect Ratio */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 text-orange-600" />
              Aspect Ratio
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {ASPECT_RATIOS.find((r) => r.id === cinematics.aspectRatio)?.desc}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {ASPECT_RATIOS.map((ar) => {
              const isSelected = cinematics.aspectRatio === ar.id;
              return (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium text-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50 border-orange-400 text-orange-800 font-bold shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                  title={ar.desc}
                >
                  {ar.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Controls: Motion Strength & FPS */}
        {isVideo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-orange-600" />
                  Motion Intensity
                </span>
                <span className="text-[11px] font-mono font-bold text-orange-700">
                  {cinematics.motionStrength} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={cinematics.motionStrength}
                onChange={(e) =>
                  setCinematics({ motionStrength: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-orange-600" />
                  Frame Rate (FPS)
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {cinematics.fps}fps
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {([24, 30, 60] as const).map((fpsVal) => (
                  <button
                    key={fpsVal}
                    onClick={() => setCinematics({ fps: fpsVal })}
                    className={`py-0.5 text-[11px] font-mono rounded border transition-all cursor-pointer ${
                      cinematics.fps === fpsVal
                        ? 'bg-orange-50 border-orange-400 text-orange-800 font-bold shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {fpsVal}p
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Controls: Stylize & Raw Style */}
        {!isVideo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                  Stylize Strength (--s)
                </span>
                <span className="text-[11px] font-mono font-bold text-orange-700">
                  {cinematics.stylize}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={cinematics.stylize}
                onChange={(e) =>
                  setCinematics({ stylize: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-700 block">
                  Raw Style Mode
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  --style raw (Midjourney/Flux)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCinematics({ rawMode: !cinematics.rawMode })}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  cinematics.rawMode ? 'bg-orange-600' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    cinematics.rawMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
