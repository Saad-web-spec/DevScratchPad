/**
 * PromptCraft Studio — Scene Intelligence & Directorial Analyzer
 * Real-time NLP entity extraction, director aesthetic injection, and negative prompt generation
 * BSL 1.1 License
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Camera,
  Layers,
  Flame,
  Info,
} from 'lucide-react';
import { CinematographyMatrix, DirectorStyle, EngineTarget } from '../types';
import { analyzeScenePrompt, DIRECTOR_PROFILES } from '../lib/promptCompiler';

interface SceneIntelligencePanelProps {
  idea: string;
  cinematics: CinematographyMatrix;
  engine: EngineTarget;
  onUpdateCinematics: (updated: Partial<CinematographyMatrix>) => void;
}

const DIRECTORS: { id: DirectorStyle; label: string; desc: string }[] = [
  { id: 'none', label: 'Balanced Natural', desc: 'Neutral photographic balance' },
  { id: 'roger-deakins', label: 'Roger Deakins', desc: 'Motivated natural key, silhouettes' },
  { id: 'denis-villeneuve', label: 'Denis Villeneuve', desc: 'Colossal scale, brutalist sand haze' },
  { id: 'christopher-nolan', label: 'Christopher Nolan', desc: 'IMAX 70mm practical realism' },
  { id: 'ridley-scott', label: 'Ridley Scott', desc: 'Backlit smoke, anamorphic flare' },
  { id: 'david-fincher', label: 'David Fincher', desc: 'Surgical tracking, desaturated tone' },
  { id: 'wong-kar-wai', label: 'Wong Kar-wai', desc: 'Step-print blur, saturated neon' },
];

export function SceneIntelligencePanel({
  idea,
  cinematics,
  engine,
  onUpdateCinematics,
}: SceneIntelligencePanelProps) {
  const currentDirector = cinematics.directorStyle || 'none';
  const intel = useMemo(() => {
    return analyzeScenePrompt(idea, cinematics, engine, currentDirector);
  }, [idea, cinematics, engine, currentDirector]);

  const [copiedNegative, setCopiedNegative] = useState(false);

  const handleCopyNegative = async () => {
    if (!intel.suggestedNegativePrompt) return;
    try {
      await navigator.clipboard.writeText(intel.suggestedNegativePrompt);
      setCopiedNegative(true);
      setTimeout(() => setCopiedNegative(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div className="rounded-xl bg-[#0c0e18]/80 border border-white/10 p-4 sm:p-5 shadow-xl space-y-4 text-white">
      {/* Header & Quality Scores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Scene Intelligence & Directorial Analyzer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800/50">
                NLP Engine
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Deconstructs prompt physics, material tactility, and director aesthetic
            </p>
          </div>
        </div>

        {/* Quality Gauges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Cinematography:</span>
            <span className="text-xs font-bold text-orange-400 font-mono">
              {intel.cinematographyScore}/100
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Resonance:</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {intel.modelResonanceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Extracted Semantic Entities Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" /> Subject & Material Physics
          </span>
          <p className="text-zinc-200 font-medium">
            {intel.primarySubject}
          </p>
          <p className="text-[11px] text-zinc-400 leading-snug">
            {intel.subjectDetails}
          </p>
        </div>

        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3" /> Atmosphere & Dynamics
          </span>
          <p className="text-zinc-200 font-medium truncate">
            {intel.atmosphericPhysics}
          </p>
          <p className="text-[11px] text-zinc-400 leading-snug">
            {intel.actionKinematics}
          </p>
        </div>
      </div>

      {/* Director Style Injection Chips */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>Director Aesthetic Injections:</span>
          </span>
          <span className="text-[11px] text-orange-400 font-mono">
            {intel.directorAesthetic}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {DIRECTORS.map((dir) => {
            const isActive = currentDirector === dir.id;
            return (
              <button
                key={dir.id}
                onClick={() => onUpdateCinematics({ directorStyle: dir.id })}
                title={dir.desc}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-orange-950/90 text-orange-300 border-orange-500 font-bold shadow-xs'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {dir.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Negative Constraints */}
      {intel.suggestedNegativePrompt && (
        <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-orange-500" />
              Engine Negative Constraints:
            </span>
            <button
              onClick={handleCopyNegative}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-950/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedNegative ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Negative</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 select-all leading-relaxed">
            {intel.suggestedNegativePrompt}
          </p>
        </div>
      )}

      {/* Optimization Tips */}
      {intel.optimizationTips.length > 0 && (
        <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 pt-1">
          <Info className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <span>Tip: {intel.optimizationTips[0]}</span>
        </div>
      )}
    </div>
  );
}
