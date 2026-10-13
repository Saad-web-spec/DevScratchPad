"use client";

import React, { useState } from "react";
import { FolderOpen, FolderSearch, Loader2, TriangleAlert } from "lucide-react";
import {
  LocalProjectAnalysis,
  pickAndInspectLocalDirectory,
  isFileSystemAccessSupported,
} from "../lib/fsPicker";
import { OutputFormat } from "../lib/ruleGenerator";
import {
  CodeEvidenceRow,
  IntakeError,
  IntakeFormatSwitch,
  IntakeModal,
  IntakeRow,
  ScriptList,
  initialIntakeFormat,
  intakeFormatLabel,
  intakePanelClass,
  intakePillClass,
  type IntakeFormat,
} from "./IntakeModal";

interface LocalFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (analysis: LocalProjectAnalysis, targetFormat?: OutputFormat) => void;
  initialFormat?: OutputFormat;
}

/** Mounted only while open, so each opening starts from the studio's current format. */
export function LocalFolderModal(props: LocalFolderModalProps) {
  if (!props.isOpen) return null;
  return <LocalFolderModalBody {...props} />;
}

function LocalFolderModalBody({ onClose, onApply, initialFormat }: LocalFolderModalProps) {
  const [analysis, setAnalysis] = useState<LocalProjectAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<IntakeFormat>(() => initialIntakeFormat(initialFormat));

  const isSupported = isFileSystemAccessSupported();

  const handlePick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await pickAndInspectLocalDirectory();
      if (result.analysis) setAnalysis(result.analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to inspect directory.";
      if (message !== "Selection cancelled.") setError(message);
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
    <IntakeModal
      icon={<FolderSearch className="size-4" />}
      title="Read a local folder"
      subtitle="Reads the manifest, a sample of source files and existing AI rules, then drafts rules from how the code is actually written."
      privacyNote="Read in your browser. No files are uploaded."
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmLabel={`Generate ${intakeFormatLabel(selectedFormat)}`}
      confirmDisabled={!analysis}
    >
      {isSupported ? (
        <button
          type="button"
          onClick={handlePick}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-dashed border-zinc-300 hover:border-orange-300 hover:bg-orange-50/30 text-left transition-colors cursor-pointer disabled:cursor-wait"
        >
          {isLoading ? (
            <Loader2 className="size-4 text-orange-600 animate-spin shrink-0" />
          ) : (
            <FolderOpen className="size-4 text-orange-600 shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-zinc-900 truncate">
              {isLoading ? "Reading code..." : analysis ? analysis.directoryName : "Choose project folder"}
            </span>
            <span className="block text-[11px] text-zinc-500">
              {analysis ? "Click to pick a different folder" : "Uses your browser's folder picker (read-only)"}
            </span>
          </span>
        </button>
      ) : (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/60 text-xs text-amber-800">
          <TriangleAlert className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Folder access works in Chrome, Edge and Brave. In Firefox or Safari, use Import from GitHub instead.
          </span>
        </div>
      )}

      {error && <IntakeError message={error} />}

      {analysis && (
        <div className={intakePanelClass}>
          <div className="flex items-center gap-2 px-3 py-2 text-xs flex-wrap">
            <span className="text-sm font-semibold">{analysis.directoryName}</span>
            {analysis.manifestFileName && <span className={`${intakePillClass} font-mono`}>{analysis.manifestFileName}</span>}
            {analysis.packageManager !== "unknown" && <span className="text-zinc-400 font-mono">{analysis.packageManager}</span>}
          </div>

          {(analysis.detectedTechStack.length > 0 || analysis.hasGit) && (
            <IntakeRow label="Stack">
              <div className="flex flex-wrap gap-1">
                {analysis.detectedTechStack.map((tech) => (
                  <span key={tech} className={intakePillClass}>
                    {tech}
                  </span>
                ))}
                {analysis.hasGit && <span className={intakePillClass}>Git</span>}
              </div>
            </IntakeRow>
          )}

          {Object.keys(analysis.scripts).length > 0 && (
            <IntakeRow label="Scripts">
              <ScriptList scripts={analysis.scripts} />
            </IntakeRow>
          )}

          <CodeEvidenceRow evidence={analysis.codeEvidence} />

          <IntakeRow label="Draft rules">
            <p className="text-xs text-zinc-700 leading-relaxed">
              <span className="font-semibold text-zinc-900">Role:</span> {analysis.synthesizedRole}
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{analysis.synthesizedDirectives.map((d) => d.replace(/^\s*- /, "")).join(" · ")}</p>
          </IntakeRow>

          <IntakeFormatSwitch value={selectedFormat} onChange={setSelectedFormat} />
        </div>
      )}
    </IntakeModal>
  );
}
