/**
 * PromptCraft Studio — Temporal Video Timeline
 * Cosmic pitch-dark theme with chronological sequence builder
 * BSL 1.1 License
 */

'use client';

import React from 'react';
import {
  Film,
  Plus,
  Trash2,
  Clock,
  Video,
  Layers,
  Sparkles,
  Wind,
} from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';

export function TemporalTimeline() {
  const {
    timelineBeats,
    addBeat,
    updateBeat,
    removeBeat,
    totalDurationSeconds,
    setTotalDuration,
    studioMode,
  } = usePromptStore();

  if (studioMode !== 'video') {
    return null;
  }

  return (
    <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-4 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                3. Temporal Video Timeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800/60 font-semibold">
                {timelineBeats.length} {timelineBeats.length === 1 ? 'Beat' : 'Beats'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Segment camera motions and kinetic progressions chronologically across timestamps
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Duration:</span>
            <select
              value={totalDurationSeconds}
              onChange={(e) => setTotalDuration(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value={5} className="bg-zinc-900 text-white">5s Clip</option>
              <option value={10} className="bg-zinc-900 text-white">10s Clip</option>
            </select>
          </div>

          <button
            onClick={addBeat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-950/80 hover:bg-orange-900 text-orange-300 border border-orange-500/50 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Beat</span>
          </button>
        </div>
      </div>

      {/* Scrubber Track */}
      <div className="w-full bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
          <span>00:00</span>
          <span>{totalDurationSeconds === 5 ? '00:02.5' : '00:05.0'}</span>
          <span>{totalDurationSeconds === 5 ? '00:05.0' : '00:10.0'}</span>
        </div>

        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/5">
          {timelineBeats.map((beat, idx) => (
            <div
              key={beat.id}
              className={`h-full rounded-full transition-all ${
                idx % 2 === 0
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#EA580C]'
                  : 'bg-gradient-to-r from-[#EA580C] to-[#C2410C]'
              }`}
              style={{ width: `${100 / Math.max(1, timelineBeats.length)}%` }}
              title={`Beat ${idx + 1}: ${beat.timestamp}`}
            />
          ))}
        </div>
      </div>

      {/* Beat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {timelineBeats.map((beat, index) => (
          <div
            key={beat.id}
            className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2.5 shadow-md hover:border-orange-500/30 transition-all"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-orange-950 text-orange-400 font-mono text-[11px] font-bold flex items-center justify-center border border-orange-800/60">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={beat.timestamp}
                  onChange={(e) => updateBeat(beat.id, { timestamp: e.target.value })}
                  className="bg-transparent font-mono text-xs text-white font-semibold border-b border-transparent hover:border-zinc-600 focus:border-orange-500 outline-none w-28"
                  placeholder="00:00 - 00:03"
                />
              </div>

              {timelineBeats.length > 1 && (
                <button
                  onClick={() => removeBeat(beat.id)}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Remove beat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <Video className="w-3 h-3 text-orange-400" />
                Camera Vector:
              </label>
              <input
                type="text"
                value={beat.cameraMotion}
                onChange={(e) => updateBeat(beat.id, { cameraMotion: e.target.value })}
                placeholder="e.g. Dolly in, slow forward push"
                className="w-full bg-black/60 text-xs text-white p-2 rounded-lg border border-white/10 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <Layers className="w-3 h-3 text-orange-400" />
                Focal Subject:
              </label>
              <input
                type="text"
                value={beat.focalSubject}
                onChange={(e) => updateBeat(beat.id, { focalSubject: e.target.value })}
                placeholder="e.g. Courier's gloved fingers"
                className="w-full bg-black/60 text-xs text-white p-2 rounded-lg border border-white/10 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                Subject Action:
              </label>
              <textarea
                value={beat.action}
                onChange={(e) => updateBeat(beat.id, { action: e.target.value })}
                rows={2}
                placeholder="e.g. Solders microchip, sparks fly outward"
                className="w-full bg-black/60 text-xs text-white p-2 rounded-lg border border-white/10 focus:border-orange-500 outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <Wind className="w-3 h-3 text-orange-400" />
                Ambient Environment:
              </label>
              <textarea
                value={beat.environmentReaction}
                onChange={(e) => updateBeat(beat.id, { environmentReaction: e.target.value })}
                rows={2}
                placeholder="e.g. Rain beading on glass, neon bokeh shimmering"
                className="w-full bg-black/60 text-xs text-white p-2 rounded-lg border border-white/10 focus:border-orange-500 outline-none resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
