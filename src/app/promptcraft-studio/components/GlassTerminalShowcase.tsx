/**
 * PromptCraft Studio — Interactive Cosmic Glass Terminal Showcase
 * Modeled after `my website` GlassTerminal with real-time prompt compilation preview
 * BSL 1.1 License
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, Copy, Check } from 'lucide-react';
import { EngineTarget } from '../types';
import { compilePromptAlgorithmic } from '../lib/promptCompiler';

interface TerminalDemoPreset {
  id: EngineTarget;
  label: string;
  badge: string;
  command: string;
  idea: string;
  aspectRatio: '16:9' | '2.39:1' | '1:1';
}

const TERMINAL_PRESETS: TerminalDemoPreset[] = [
  {
    id: 'kling',
    label: '🎬 Kling 2.0 Directorial',
    badge: 'Video Kinematics',
    command: 'compile --target=kling-2.0 --mode=directorial --trajectory=orbit',
    idea: 'A cybernetic courier repairing a broken drone on a rain-slicked Tokyo rooftop at dusk',
    aspectRatio: '16:9',
  },
  {
    id: 'midjourney-v6',
    label: '🖼️ Midjourney v6.1 Raw',
    badge: 'Photographic Glass',
    command: 'compile --target=midjourney-v6 --style=raw --optics=leica-50mm',
    idea: 'Close portrait of an elderly watchmaker inspecting antique clockwork in a dusty workshop',
    aspectRatio: '16:9',
  },
  {
    id: 'runway-gen3',
    label: '🎬 Runway Gen-3 Alpha',
    badge: 'Temporal Timeline',
    command: 'compile --target=runway-gen3 --timeline=bracketed --motion=7',
    idea: 'A solitary desert wanderer standing before colossal brutalist obsidian monoliths during a sandstorm',
    aspectRatio: '2.39:1',
  },
  {
    id: 'flux-1',
    label: '🖼️ Flux.1 Tactile',
    badge: 'Sensory T5-XXL',
    command: 'compile --target=flux-1 --textures=subsurface --realism=unfiltered',
    idea: 'Macro photograph of an exotic bioluminescent orchid flowering inside a mist-filled antique glass terrarium',
    aspectRatio: '1:1',
  },
];

export function GlassTerminalShowcase() {
  const [selectedPreset, setSelectedPreset] = useState<TerminalDemoPreset>(TERMINAL_PRESETS[0]);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsTyping(true);
    setDisplayedLines([]);

    const compiledOutput = compilePromptAlgorithmic(
      selectedPreset.idea,
      {
        cameraMovement: 'orbit',
        focalLength: '24mm-cinematic-wide',
        lightingScheme: 'practical-neon',
        colorPalette: 'teal-orange-bleach',
        aspectRatio: selectedPreset.aspectRatio,
        motionStrength: 7,
        fps: 24,
        stylize: 250,
        rawMode: true,
        directorStyle: selectedPreset.id === 'kling' ? 'ridley-scott' : selectedPreset.id === 'runway-gen3' ? 'denis-villeneuve' : 'roger-deakins',
        microTextures: true,
        atmosphericParticles: true,
        filmGrain: true,
      },
      [],
      selectedPreset.id
    );

    const steps = [
      `promptcraft@neural-compiler:~$ ${selectedPreset.command}`,
      `[OK] Deep NLP Intent Parser: Extracted entities, spatial physics, and materials`,
      `[OK] Cinematographic Knowledge Graph: Applied director profile and lens optics`,
      `[OK] Synthesized Dialect: ${selectedPreset.label}`,
      `--- COMPILED OUTPUT ---`,
      compiledOutput,
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (isCancelled) return;
      if (currentStep < steps.length) {
        setDisplayedLines((prev) => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [selectedPreset]);

  const fullCompiledText = displayedLines[displayedLines.length - 1] || '';

  const handleCopy = async () => {
    if (!fullCompiledText) return;
    try {
      await navigator.clipboard.writeText(fullCompiledText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Engine Switcher Chips */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TERMINAL_PRESETS.map((preset) => {
            const isActive = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-orange-950/80 text-orange-400 border-orange-500/60 shadow-[0_0_15px_rgba(234,88,12,0.3)] font-bold'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 hidden sm:inline">
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleCopy}
          disabled={isTyping}
          className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Output</span>
            </>
          )}
        </button>
      </div>

      {/* Cosmic Glass Terminal (Direct from my website styles) */}
      <div className="glass-terminal border border-white/10 shadow-2xl">
        <div className="terminal-header">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
          <span className="terminal-title">promptcraft@neural-compiler: ~</span>
        </div>

        <div className="terminal-body space-y-1.5 font-mono text-xs sm:text-sm">
          {displayedLines.map((line, idx) => {
            if (typeof line !== 'string') return null;
            const isCommand = line.startsWith('promptcraft@');
            const isOk = line.startsWith('[OK]');
            const isDivider = line.startsWith('---');

            if (isCommand) {
              return (
                <div key={idx} className="terminal-line command-color font-bold pb-1">
                  {line}
                </div>
              );
            }
            if (isOk) {
              return (
                <div key={idx} className="terminal-line success-color text-[11px] sm:text-xs">
                  {line}
                </div>
              );
            }
            if (isDivider) {
              return (
                <div key={idx} className="terminal-line text-zinc-600 text-xs py-1">
                  {line}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="terminal-line text-zinc-200 bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap select-all selection:bg-orange-600 selection:text-white"
              >
                {line}
              </div>
            );
          })}

          <div className="terminal-line pt-1">
            <span className="cursor-block blink">█</span>
          </div>
        </div>
      </div>
    </div>
  );
}
