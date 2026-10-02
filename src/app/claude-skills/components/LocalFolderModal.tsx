"use client";

import React, { useState } from "react";
import {
  FolderTree,
  FolderOpen,
  X,
  Check,
  AlertCircle,
  ShieldCheck,
  Package,
  Layers,
  Terminal,
} from "lucide-react";
import {
  LocalProjectAnalysis,
  pickAndInspectLocalDirectory,
  isFileSystemAccessSupported,
} from "../lib/fsPicker";
import { OutputFormat } from "../lib/ruleGenerator";

interface LocalFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (analysis: LocalProjectAnalysis, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

export function LocalFolderModal({
  isOpen,
  onClose,
  onApply,
  initialFormat = "claude_md",
}: LocalFolderModalProps) {
  const [analysis, setAnalysis] = useState<LocalProjectAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(
    initialFormat === "mcp_json" ? "claude_md" : initialFormat
  );

  if (!isOpen) return null;

  const isSupported = isFileSystemAccessSupported();

  const handlePick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await pickAndInspectLocalDirectory();
      if (result.analysis) {
        setAnalysis(result.analysis);
      }
    } catch (err: any) {
      if (err.message !== "Selection cancelled.") {
        setError(err.message || "Failed to inspect directory.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!analysis) return;
    onApply(analysis, selectedFormat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden space-y-3.5 sm:space-y-4 p-4 sm:p-5 text-zinc-900 animate-in zoom-in-95 duration-150 transition-all max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between border-b border-zinc-100 pb-3 shrink-0 gap-2">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <FolderTree className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-900 font-sans tracking-tight">
                  Inspect Local Project Directory
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-orange-600" />
                  <span>100% Client-Side Private</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                Select your local project folder to inspect manifests, dependencies &amp; scripts directly in your browser with zero file upload.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1 sm:mr-0 sm:mt-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-3.5 pr-1">
          {/* File System Access Trigger Box */}
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2.5 text-center">
            <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mx-auto text-zinc-800">
              <FolderOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-900">
                {analysis ? `Inspected: ${analysis.directoryName}` : "Choose Local Folder to Scan"}
              </h4>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Uses the browser&apos;s native File System Access API. Reads <code>package.json</code>, <code>Cargo.toml</code>, or <code>pyproject.toml</code> in offline memory.
              </p>
            </div>

            {isSupported ? (
              <button
                type="button"
                onClick={handlePick}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer min-h-[36px]"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{isLoading ? "Reading Folder..." : analysis ? "Pick Different Folder" : "Select Project Folder"}</span>
              </button>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
                <span className="font-semibold">Browser Notice:</span> Native folder picker is supported on Chrome, Edge, and Brave. On Firefox or Safari, please use GitHub Repo Ingestion or the Auto-Detect file upload button.
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results Card */}
          {analysis && (
            <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-zinc-700" />
                  <span className="text-sm font-semibold text-zinc-900 tracking-tight">
                    {analysis.directoryName}
                  </span>
                  {analysis.manifestFileName && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-medium">
                      {analysis.manifestFileName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {analysis.packageManager !== "unknown" ? `${analysis.packageManager} package` : "Manifest Detected"}
                </span>
              </div>

              {/* Detected Stack Pills */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-zinc-500">Detected Stack:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {analysis.detectedTechStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-800"
                    >
                      {tech}
                    </span>
                  ))}
                  {analysis.hasGit && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                      Git Repository
                    </span>
                  )}
                </div>
              </div>

              {/* Detected Scripts */}
              {Object.keys(analysis.scripts).length > 0 && (
                <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Detected Local Scripts
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-700 pt-0.5">
                    {analysis.scripts.build && (
                      <div className="truncate">
                        <span className="text-zinc-400">build:</span> {analysis.scripts.build}
                      </div>
                    )}
                    {analysis.scripts.test && (
                      <div className="truncate">
                        <span className="text-zinc-400">test:</span> {analysis.scripts.test}
                      </div>
                    )}
                    {analysis.scripts.lint && (
                      <div className="truncate">
                        <span className="text-zinc-400">lint:</span> {analysis.scripts.lint}
                      </div>
                    )}
                    {analysis.scripts.dev && (
                      <div className="truncate">
                        <span className="text-zinc-400">dev:</span> {analysis.scripts.dev}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Synthesized Configuration */}
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs text-zinc-700">
                <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-zinc-600" />
                  <span>Synthesized Configuration</span>
                </div>
                <div className="space-y-0.5 leading-relaxed pt-0.5">
                  <div>
                    <span className="font-semibold text-zinc-900">Role:</span> {analysis.synthesizedRole}
                  </div>
                  <div className="text-zinc-600 line-clamp-2">
                    <span className="font-semibold text-zinc-900">Directives:</span>{" "}
                    {analysis.synthesizedDirectives.join(" · ")}
                  </div>
                </div>
              </div>

              {/* Target Format Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                <span className="text-[11px] font-medium text-zinc-600">Synthesize To:</span>
                <div className="grid grid-cols-2 sm:flex items-center gap-1 w-full sm:w-auto">
                  {[
                    { label: "CLAUDE.md", value: "claude_md" as const },
                    { label: "cursor.mdc", value: "cursor_mdc" as const },
                    { label: "AGENTS.md", value: "agents_md" as const },
                    { label: "SKILL.md", value: "skill_md" as const },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.value)}
                      className={`px-2.5 py-1.5 sm:py-0.5 rounded text-[11px] font-mono text-center transition-colors cursor-pointer min-h-[30px] sm:min-h-0 flex items-center justify-center ${
                        selectedFormat === fmt.value
                          ? "bg-zinc-900 text-white font-semibold"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!analysis}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:via-orange-400 hover:to-amber-500 disabled:from-zinc-200 disabled:via-zinc-200 disabled:to-zinc-200 text-white disabled:text-zinc-400 text-xs font-semibold rounded-lg shadow-sm hover:shadow-[0_4px_14px_rgba(234,88,12,0.35)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:shadow-none min-h-[38px] active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Apply &amp; Generate {selectedFormat === "claude_md" ? "CLAUDE.md" : selectedFormat === "cursor_mdc" ? "cursor.mdc" : selectedFormat === "agents_md" ? "AGENTS.md" : "SKILL.md"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
