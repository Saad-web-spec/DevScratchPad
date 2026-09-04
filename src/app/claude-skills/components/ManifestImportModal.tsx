"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Check, FileCode, ArrowRight, AlertCircle } from "lucide-react";
import { parseProjectManifest, ParsedManifestResult } from "../lib/manifestParser";

interface ManifestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: ParsedManifestResult) => void;
}

export function ManifestImportModal({ isOpen, onClose, onApply }: ManifestImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedManifestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseProjectManifest(file.name, text);
        setParsedResult(result);
        setPasteContent(text.slice(0, 500) + (text.length > 500 ? "\n..." : ""));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTextChange = (text: string) => {
    setPasteContent(text);
    if (text.trim().length > 10) {
      const result = parseProjectManifest("pasted-manifest.json", text);
      setParsedResult(result);
    } else {
      setParsedResult(null);
    }
  };

  const handleConfirm = () => {
    if (parsedResult && parsedResult.detected) {
      onApply(parsedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-5 text-zinc-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Auto-Detect Stack from Manifest</h3>
              <p className="text-[11px] text-zinc-500">
                Upload or paste <code className="text-zinc-700 font-mono">package.json</code>, <code className="text-zinc-700 font-mono">pyproject.toml</code>, <code className="text-zinc-700 font-mono">Cargo.toml</code>, or <code className="text-zinc-700 font-mono">go.mod</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-orange-500 bg-orange-50/50 scale-[1.01]"
              : "border-zinc-200 hover:border-orange-400 bg-zinc-50/60 hover:bg-orange-50/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.toml,.mod,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <FileCode className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-zinc-700">Click to choose file or drag & drop</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">100% processed locally in your browser. Never uploaded to servers.</p>
        </div>

        {/* Paste Textarea Alternative */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-zinc-600 block">Or Paste Manifest Content:</label>
          <textarea
            value={pasteContent}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
            placeholder={`{\n  "dependencies": {\n    "next": "15.1.0",\n    "@prisma/client": "^5.0.0"\n  }\n}`}
            className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed"
          />
        </div>

        {/* Detection Result Card */}
        {parsedResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              parsedResult.detected
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                : "bg-amber-50/60 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {parsedResult.detected ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Detected Stack Profile ({parsedResult.filename})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Unable to Parse Manifest</span>
                </>
              )}
            </div>

            {parsedResult.detected && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Framework</span>
                    <span className="font-semibold text-zinc-900">{parsedResult.framework}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Language</span>
                    <span className="font-semibold text-zinc-900">{parsedResult.language}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Styling</span>
                    <span className="font-semibold text-zinc-900">{parsedResult.styling}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Database</span>
                    <span className="font-semibold text-zinc-900">{parsedResult.database}</span>
                  </div>
                  {parsedResult.testing && (
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                      <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Testing</span>
                      <span className="font-semibold text-zinc-900">{parsedResult.testing}</span>
                    </div>
                  )}
                  {parsedResult.validation && (
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                      <span className="text-zinc-500 block text-[9px] uppercase font-sans font-bold">Validation</span>
                      <span className="font-semibold text-zinc-900">{parsedResult.validation}</span>
                    </div>
                  )}
                </div>

                {parsedResult.summary && parsedResult.summary.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedResult.summary.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-mono"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedResult || !parsedResult.detected}
            onClick={handleConfirm}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
              parsedResult && parsedResult.detected
                ? "bg-orange-600 hover:bg-orange-500 text-white cursor-pointer active:scale-95"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
            }`}
          >
            <span>Apply to Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
