"use client";

import { useState, useRef } from "react";
import { toPng, toBlob } from "html-to-image";
import { Download, X, Image as ImageIcon, Copy, Check } from "lucide-react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { cn } from "@/lib/utils";

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

const BACKGROUNDS = [
  { name: "Purple/Pink", class: "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500" },
  { name: "Sunset", class: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500" },
  { name: "Emerald", class: "bg-gradient-to-br from-emerald-400 to-cyan-400" },
  { name: "Ocean", class: "bg-gradient-to-br from-cyan-400 to-blue-500" },
  { name: "Obsidian", class: "bg-gradient-to-br from-slate-800 to-zinc-900" },
  { name: "Solid Dark", class: "bg-[#09090B]" },
];

const SYNTAX_THEMES = [
  { name: "One Dark Pro", bg: "#282C34" },
  { name: "Dark Slate", bg: "#121215" },
  { name: "Dracula", bg: "#282A36" },
  { name: "GitHub Dark", bg: "#0D1117" },
  { name: "Nord", bg: "#2E3440" },
];

const PADDINGS = [
  { label: "16px", value: "p-4" },
  { label: "32px", value: "p-8" },
  { label: "64px", value: "p-16" },
];

export function ExportImageModal({ isOpen, onClose, code, language }: ExportImageModalProps) {
  const [activeBg, setActiveBg] = useState(BACKGROUNDS[0]);
  const [activeTheme, setActiveTheme] = useState(SYNTAX_THEMES[1]); // Default Dark Slate
  const [activePadding, setActivePadding] = useState(PADDINGS[1]); // Default 32px
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const captureRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const prepareExport = async () => {
    if (!captureRef.current) return null;
    setIsExporting(true);
    // Wait for Monaco to fully render
    await new Promise((resolve) => setTimeout(resolve, 500));
    return captureRef.current;
  };

  const handleDownload = async () => {
    const el = await prepareExport();
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `snippet-${language}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    const el = await prepareExport();
    if (!el) return;
    try {
      const blob = await toBlob(el, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: true,
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      alert("Failed to copy image to clipboard.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* We inject a style block to force Monaco to be transparent inside this modal so it inherits our theme background */}
      <style>{`
        .export-monaco-container .monaco-editor,
        .export-monaco-container .monaco-editor-background,
        .export-monaco-container .monaco-editor .margin {
          background-color: transparent !important;
        }
      `}</style>
      
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Export Code Snippet</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Main Preview Area */}
          <div className="flex-1 p-6 md:p-10 bg-zinc-100 dark:bg-zinc-950 overflow-auto flex flex-col items-center justify-center relative">
            
            {/* Capture Target */}
            <div
              ref={captureRef}
              className={cn(
                "w-full max-w-3xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden",
                activeBg.class,
                activePadding.value
              )}
            >
              {/* Code Window Container */}
              <div 
                className="w-full rounded-xl shadow-2xl shadow-black/60 border border-white/10 overflow-hidden flex flex-col"
                style={{ backgroundColor: activeTheme.bg }}
              >
                {/* Window Header */}
                <div className="h-12 px-4 flex items-center relative shrink-0">
                  {/* macOS Dots */}
                  <div className="flex items-center gap-2 absolute left-4">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  {/* Filename Badge */}
                  <div className="mx-auto px-3 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-white/60 font-mono tracking-wide">
                    {`data.${language === 'json' ? 'json' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'txt'}`}
                  </div>
                </div>
                
                {/* Editor Area */}
                <div className="p-4 pt-2 pb-6 export-monaco-container">
                  <div className="pointer-events-none" style={{ height: `${Math.min(code.split('\n').length * 21 + 20, 600)}px` }}>
                    <MonacoEditor
                      language={language}
                      value={code}
                      theme="devscratchpad-dark" // We override the bg via CSS
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        lineNumbers: showLineNumbers ? "on" : "off",
                        folding: false,
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "none",
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                        scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                        fontSize: 15,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        padding: { top: 0, bottom: 0 },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Brand Watermark */}
              <div className="absolute bottom-4 right-6 text-xs font-mono text-white/40 tracking-wider select-none">
                tools.saadengineer.works
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-6 bg-white dark:bg-zinc-900 shrink-0 overflow-y-auto">
            
            {/* Background Selector */}
            <div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Background</h3>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUNDS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBg(bg)}
                    title={bg.name}
                    className={cn(
                      "h-10 rounded-md transition-all hover:scale-105 active:scale-95 border",
                      bg.class,
                      activeBg.name === bg.name 
                        ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900 border-transparent" 
                        : "border-zinc-200 dark:border-zinc-700/50"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Syntax Theme */}
            <div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Syntax Theme (Window)</h3>
              <select 
                value={activeTheme.name}
                onChange={(e) => setActiveTheme(SYNTAX_THEMES.find(t => t.name === e.target.value) || SYNTAX_THEMES[1])}
                className="w-full h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SYNTAX_THEMES.map((theme) => (
                  <option key={theme.name} value={theme.name}>{theme.name}</option>
                ))}
              </select>
            </div>

            {/* Padding */}
            <div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Padding</h3>
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {PADDINGS.map((pad) => (
                  <button
                    key={pad.label}
                    onClick={() => setActivePadding(pad)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
                      activePadding.label === pad.label
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-transparent"
                    )}
                  >
                    {pad.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Numbers Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Line Numbers</span>
              <button
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  showLineNumbers ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div className={cn(
                  "w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform",
                  showLineNumbers ? "translate-x-5" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Export Buttons */}
            <div className="mt-auto pt-6 flex flex-col gap-3">
              <button
                onClick={handleCopyClipboard}
                disabled={isExporting}
                className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied to Clipboard!" : "Copy PNG to Clipboard"}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm text-sm"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "Exporting..." : "Download PNG"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
