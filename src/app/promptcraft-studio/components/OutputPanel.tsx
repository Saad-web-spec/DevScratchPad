/**
 * PromptCraft Studio — Output & Terminal Layer
 * Cosmic pitch-dark theme with Monaco terminal, engine tabs, and diff view
 * BSL 1.1 License
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  Share2,
  FileCode,
  GitCompare,
  Terminal,
  Clock,
  Zap,
} from 'lucide-react';
import LZString from 'lz-string';
import { usePromptStore } from '../store/usePromptStore';
import { EngineTarget } from '../types';
import { compilePromptAlgorithmic } from '../lib/promptCompiler';

export function OutputPanel() {
  const {
    outputPrompt,
    previousPrompt,
    activeOutputEngine,
    setActiveOutputEngine,
    userIdea,
    cinematics,
    timelineBeats,
    isGenerating,
    metrics,
    activeView,
    setActiveView,
    studioMode,
  } = usePromptStore();

  const displayedEngines = useMemo(() => {
    if (studioMode === 'image') {
      return [
        { id: 'midjourney-v6' as EngineTarget, label: 'Midjourney v6.1' },
        { id: 'flux-1' as EngineTarget, label: 'Flux.1' },
      ];
    }
    return [
      { id: 'kling' as EngineTarget, label: 'Kling 2.0' },
      { id: 'runway-gen3' as EngineTarget, label: 'Runway Gen-3' },
      { id: 'sora' as EngineTarget, label: 'OpenAI Sora' },
    ];
  }, [studioMode]);

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Compile prompt dynamically or render streamed neural output
  const displayedPrompt = useMemo(() => {
    if (outputPrompt) return outputPrompt;
    if (!userIdea) return '';
    return compilePromptAlgorithmic(
      userIdea,
      cinematics,
      timelineBeats,
      activeOutputEngine
    );
  }, [outputPrompt, userIdea, cinematics, timelineBeats, activeOutputEngine]);

  const handleCopy = async () => {
    if (!displayedPrompt) return;
    try {
      await navigator.clipboard.writeText(displayedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleDownloadTxt = () => {
    if (!displayedPrompt) return;
    const blob = new Blob([displayedPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptcraft-${activeOutputEngine}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      generator: 'PromptCraft Studio v2.0 (DevScratchpad)',
      timestamp: new Date().toISOString(),
      engine: activeOutputEngine,
      rawIdea: userIdea,
      cinematography: cinematics,
      timelineBeats,
      compiledOutput: displayedPrompt,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptcraft-${activeOutputEngine}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareLink = () => {
    try {
      const stateToShare = {
        idea: userIdea,
        engine: activeOutputEngine,
        cinematics,
        beats: timelineBeats,
        mode: studioMode,
      };
      const compressed = LZString.compressToEncodedURIComponent(
        JSON.stringify(stateToShare)
      );
      const shareUrl = `${window.location.origin}${window.location.pathname}#data=${compressed}`;
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.warn('Share serialization failed:', err);
    }
  };

  const wordCount = displayedPrompt
    ? displayedPrompt.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="bg-[#0c0e18]/80 rounded-xl border border-white/10 p-4 sm:p-5 shadow-2xl space-y-3.5 text-white">
      {/* Top Header & Engine Syntax Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
        {/* Engine Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {displayedEngines.map((eng) => {
            const isActive = activeOutputEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => setActiveOutputEngine(eng.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-orange-950/80 text-orange-300 border-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.3)] font-bold'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {eng.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveView('prompt')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeView === 'prompt'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3 text-orange-400" />
            <span>Compiled</span>
          </button>

          <button
            onClick={() => setActiveView('diff')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeView === 'diff'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3 h-3 text-orange-400" />
            <span>Diff</span>
          </button>

          <button
            onClick={() => setActiveView('json')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeView === 'json'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3 h-3 text-orange-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* MoE Dynamic Expert Routing Indicator */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-zinc-300 font-semibold">MoE Active:</span>
          <span>
            {studioMode === 'image'
              ? '📷 Optics (95%) • 🎬 Kinematics Idle (0%)'
              : '🎬 Kinematics (98%) • 📷 Optics Idle (0%)'}
          </span>
        </div>
        <span className="text-orange-400/90 hidden sm:inline">
          SmolLM2-135M (~45 MB) Local
        </span>
      </div>

      {/* Code Box */}
      <div className="relative min-h-[240px] bg-black/60 rounded-xl p-4 font-mono text-xs leading-relaxed text-zinc-100 border border-white/10 overflow-x-auto shadow-inner">
        {activeView === 'prompt' && (
          <div>
            {isGenerating && (
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>Streaming tokens from local in-browser neural engine...</span>
              </div>
            )}
            {displayedPrompt ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-200 select-all">
                {displayedPrompt}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse align-middle" />
                )}
              </pre>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <Terminal className="w-8 h-8 text-zinc-700" />
                <p className="text-xs text-zinc-400">Click &quot;Compile Prompt&quot; to synthesize output.</p>
                <span className="text-[11px] text-zinc-500">
                  Client-side Semantic Directorial Knowledge Graph. Zero server telemetry.
                </span>
              </div>
            )}
          </div>
        )}

        {activeView === 'diff' && (
          <div>
            {previousPrompt ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-red-400 uppercase font-semibold">Previous Version</span>
                  <div className="p-3 bg-red-950/30 border border-red-900/40 rounded text-zinc-300 whitespace-pre-wrap font-mono text-[11px]">
                    {previousPrompt}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">Current Version</span>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded text-emerald-200 whitespace-pre-wrap font-mono text-[11px]">
                    {displayedPrompt}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-500">
                <p>Compile a prompt more than once to inspect delta changes.</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'json' && (
          <pre className="text-zinc-300 whitespace-pre-wrap">
            {JSON.stringify(
              {
                generator: 'PromptCraft Studio',
                engine: activeOutputEngine,
                idea: userIdea,
                cinematics,
                timelineBeats,
                compiledPrompt: displayedPrompt,
              },
              null,
              2
            )}
          </pre>
        )}
      </div>

      {/* 32px Status Footer & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 text-xs text-zinc-400">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>{displayedPrompt.length} chars</span>
          <span>•</span>
          <span>{wordCount} words</span>
          {metrics && (
            <>
              <span>•</span>
              <span className="text-orange-400 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {metrics.tokensPerSecond} tok/s
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {metrics.elapsedMs}ms
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            disabled={!displayedPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-900 shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTxt}
            disabled={!displayedPrompt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            title="Download .txt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.txt</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={!displayedPrompt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            title="Export JSON"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-orange-300 bg-orange-950/80 hover:bg-orange-900 border border-orange-500/50 transition-colors cursor-pointer font-medium"
            title="Share URL link"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-400" />
            <span>{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
