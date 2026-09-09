"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCode2,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { convertRawRulesToIR, ParsedRulesIR } from "../lib/rulesConverter";

interface RulesConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (ir: ParsedRulesIR) => void;
}

export function RulesConverterModal({ isOpen, onClose, onApply }: RulesConverterModalProps) {
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedRulesIR | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string, sourceName = fileName) => {
    setInputText(text);
    if (text.trim().length > 20) {
      try {
        const ir = convertRawRulesToIR(text, sourceName);
        setParsedResult(ir);
      } catch {
        setParsedResult(null);
      }
    } else {
      setParsedResult(null);
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      handleTextChange(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedResult) {
      onApply(parsedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Reverse Importer: Rules Converter
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  100% Client-Side
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Decompose legacy <code className="text-xs">.cursorrules</code> or <code className="text-xs">CLAUDE.md</code> into Universal Studio IR.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dropzone & Textarea */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 transition-all text-center ${
              isDragging
                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".cursorrules,.mdc,.md,.txt,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {fileName ? `Loaded: ${fileName}` : "Click to select or drop .cursorrules / CLAUDE.md / .mdc file"}
              </p>
              <p className="text-[11px] text-zinc-400">Zero server upload. Processed entirely in browser memory.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Or Paste Raw Rule Text:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste existing rules, guidelines, or system prompt here..."
              rows={7}
              className="w-full font-mono text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Parsed Preview Card */}
          {parsedResult && (
            <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-gradient-to-r from-orange-50/70 to-amber-50/50 dark:from-orange-950/30 dark:to-zinc-900 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Parsed Universal Studio IR:
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-semibold">
                    {parsedResult.detectedSourceFormat}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {parsedResult.framework} ({parsedResult.language})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 block">Philosophy</span>
                  <span className="font-semibold capitalize text-zinc-800 dark:text-zinc-200">{parsedResult.philosophy}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 block">Negative Guards</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{parsedResult.behaviors.length} extracted</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 block">Conventions</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{parsedResult.conventions.length} extracted</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 block">Code Examples</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {parsedResult.exampleGood || parsedResult.exampleBad ? "Detected" : "None"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacy guaranteed: zero telemetry.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!parsedResult}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                parsedResult
                  ? "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <span>Convert &amp; Apply to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
