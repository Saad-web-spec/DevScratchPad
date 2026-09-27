/**
 * PromptCraft Studio — Interactive Infographic Compiler Demo
 * White & Orange theme showing Side-by-Side Raw vs MoE-Compiled output.
 * BSL 1.1 License
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Film, Image as ImageIcon, Zap } from 'lucide-react';

export function InfographicDemo() {
  const [activeMode, setActiveMode] = useState<'image' | 'video'>('image');
  const [copied, setCopied] = useState(false);

  const imageDemo = {
    engine: 'Midjourney v6.1 & Flux.1',
    input: 'A cybernetic street vendor repairing an illuminated holographic koi fish in rain-slicked Shibuya at twilight',
    compiled:
      'Cinematic film still of a cybernetic street vendor repairing an illuminated holographic koi fish in rain-slicked Shibuya at twilight, featuring weathered brass prosthetic fingers with micro-soldering arc filaments, surrounded by cramped alleyway with neon signs reflecting in wet puddles, illuminated by dramatic chiaroscuro low-key lighting with cyan and amber rim highlights, crepuscular volumetric fog slicing through rain particulates, shot on Zeiss Master Prime 24mm f/1.4 lens, natural perspective compression with subtle circular background bokeh, classic Kodachrome 64 color timing, organic film grain, --ar 16:9 --v 6.1 --style raw --s 250',
    tags: [
      { label: 'Optics', text: 'Zeiss 24mm f/1.4', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Lighting', text: 'Chiaroscuro Rim', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { label: 'Emulsion', text: 'Kodachrome 64', color: 'bg-zinc-100 text-zinc-900 border-zinc-300' },
      { label: 'Syntax', text: '--style raw --v 6.1', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    ],
  };

  const videoDemo = {
    engine: 'Runway Gen-3 Alpha & Sora',
    input: 'Deep-sea research submersible gliding past colossal bioluminescent siphonophore organisms in abyssal trench',
    compiled:
      '[Cinematic Abyssal Sequence | 2.39:1 Anamorphic | Teal-Orange Bleach Bypass]\nMaster Scene: Deep-sea research submersible gliding through midnight ocean trench. Filmed with Panavision 2x Anamorphic optics.\n[Camera Kinematics: Tracking Arc — Horizontal X-axis parallax alongside submersible hull]\n\n[00:00 - 00:03] [Camera: Slow forward dolly-in] Center framing on submersible quartz observation dome, pilot silhouette illuminated by cockpit instrument phosphorescence. Bioluminescent tendrils drift past foreground glass.\n[00:03 - 00:06] [Camera: 180° Orbital sweep] The camera arcs around the vessel stern, revealing colossal siphonophore organisms pulsing with electric cyan and magenta luminescence in the deep background.\n\nTechnical Specs: --motion 7 --fps 24 --camera-smoothness high --dynamic-physics true',
    tags: [
      { label: 'Kinematics', text: '180° Orbital Arc', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      { label: 'Beats', text: '2-Shot Chronology', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Physics', text: 'Bioluminescent Bloom', color: 'bg-zinc-100 text-zinc-900 border-zinc-300' },
      { label: 'Syntax', text: '--motion 7 --fps 24', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    ],
  };

  const current = activeMode === 'image' ? imageDemo : videoDemo;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.compiled);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-zinc-50/80 border-b border-zinc-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center text-orange-600">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Interactive Compiler Comparison</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-mono">
                Live Output Preview
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Targeting: <strong className="text-zinc-700">{current.engine}</strong>
            </div>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center bg-zinc-200/80 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveMode('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'image'
                ? 'bg-white text-zinc-900 shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
            <span>Image Mode</span>
          </button>
          <button
            onClick={() => setActiveMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'video'
                ? 'bg-white text-zinc-900 shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-orange-600" />
            <span>Video Mode</span>
          </button>
        </div>
      </div>

      {/* Side by side comparison grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
        {/* Left: Raw Input */}
        <div className="lg:col-span-4 p-5 sm:p-6 space-y-4 bg-zinc-50/40 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                01 / Naive Concept (Input)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 font-mono">
                Raw Text
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-sans shadow-xs">
              &quot;{current.input}&quot;
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-zinc-700 block">
                Sparse MoE Injected Metadata:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${t.color}`}
                  >
                    {t.label}: {t.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200/60 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>In-Browser Tokenization</span>
            <span className="font-mono text-orange-600 font-semibold">&lt; 15ms</span>
          </div>
        </div>

        {/* Right: Compiled Directorial Output */}
        <div className="lg:col-span-8 p-5 sm:p-6 space-y-4 flex flex-col justify-between bg-white">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                <Image
                  src="/orange-star.png"
                  alt="Star"
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                02 / MoE Directorial Synthesis (Compiled)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal-style clean box */}
            <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner border border-zinc-800 select-all">
              <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-200">
                {current.compiled}
              </pre>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500 font-mono">
            <div>
              Ready to generate • Formatted for <strong className="text-zinc-800">{current.engine}</strong>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-bold text-orange-600">
                {current.compiled.length} chars
              </span>
              <span>•</span>
              <span className="text-zinc-900 font-bold">100% Client-Side</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
