"use client";

import React, { useState } from "react";
import { ArrowUpRight, KeyRound, Loader2, Search } from "lucide-react";
import { GitHubIcon } from "@/components/icons/AssistantBrandIcons";
import { OutputFormat } from "../lib/presetRegistry";
import {
  analyzeGitHubRepository,
  IngestedRepoAnalysis,
  parseGitHubRepoInput,
} from "../lib/githubIngest";
import {
  IntakeError,
  IntakeFormatSwitch,
  IntakeModal,
  IntakeRow,
  ScriptList,
  initialIntakeFormat,
  intakeFormatLabel,
  intakeInputClass,
  intakePanelClass,
  intakePillClass,
  type IntakeFormat,
} from "./IntakeModal";

interface GitHubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (analysis: IngestedRepoAnalysis, token?: string, targetFormat?: OutputFormat) => void;
  initialInput?: string;
  initialFormat?: OutputFormat;
}

const TOKEN_STORAGE_KEY = "devscratchpad_github_pat";
const TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

/** Mounted only while open, so each opening starts from the studio's current format. */
export function GitHubRepoModal(props: GitHubRepoModalProps) {
  if (!props.isOpen) return null;
  return <GitHubRepoModalBody {...props} />;
}

function GitHubRepoModalBody({ onClose, onApply, initialInput = "", initialFormat }: GitHubRepoModalProps) {
  const [repoInput, setRepoInput] = useState(initialInput);
  const [selectedFormat, setSelectedFormat] = useState<IntakeFormat>(() => initialIntakeFormat(initialFormat));
  const [patToken, setPatToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IngestedRepoAnalysis | null>(null);

  const hasToken = patToken.trim().length > 0;

  const handleTokenChange = (val: string) => {
    setPatToken(val);
    try {
      if (val.trim()) sessionStorage.setItem(TOKEN_STORAGE_KEY, val.trim());
      else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage restrictions
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setAnalysis(null);
    if (!parseGitHubRepoInput(repoInput)) {
      setError('Enter a repository as "owner/repo" or https://github.com/owner/repo.');
      return;
    }

    setIsLoading(true);
    setStatusMessage("Connecting to GitHub...");
    try {
      const result = await analyzeGitHubRepository(repoInput, patToken.trim() || undefined, (msg) => setStatusMessage(msg));
      setAnalysis(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze repository.";
      setError(message);
      // Rate limits and private repos need a token: open the token field
      if (/token|rate limit|403/i.test(message)) setShowToken(true);
    } finally {
      setStatusMessage(null);
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!analysis) return;
    onApply(analysis, patToken.trim() || undefined, selectedFormat);
    onClose();
  };

  const stack = analysis?.detectedTechStack.filter((t) => !["None / Irrelevant", "None", "unknown"].includes(t)) ?? [];

  return (
    <IntakeModal
      icon={<GitHubIcon className="size-4" />}
      title="Import from GitHub"
      subtitle="Read a repository's manifests, scripts and commit style to draft rules."
      privacyNote="Talks only to api.github.com."
      onClose={onClose}
      onConfirm={handleApply}
      confirmLabel={`Generate ${intakeFormatLabel(selectedFormat)}`}
      confirmDisabled={!analysis}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={repoInput}
          autoFocus
          onChange={(e) => {
            setRepoInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading && repoInput.trim()) handleAnalyze();
          }}
          placeholder="owner/repo or https://github.com/owner/repo"
          aria-label="Repository"
          className={intakeInputClass}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading || !repoInput.trim()}
          className="inline-flex items-center gap-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 text-white disabled:text-zinc-400 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
          {isLoading ? "Reading" : "Inspect"}
        </button>
      </div>

      {/* Optional token: one line until opened */}
      <div className="rounded-lg border border-zinc-200 text-xs">
        <div className="flex items-center gap-2 px-3 py-2">
          <KeyRound className="size-3.5 text-zinc-500 shrink-0" />
          <span className="font-medium text-zinc-800">Access token</span>
          <span className="text-[11px] text-zinc-400 truncate">
            {hasToken ? "Set for this tab" : "Optional · private repos, 5,000 req/hr"}
          </span>
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="ml-auto text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer shrink-0"
          >
            {showToken ? "Hide" : hasToken ? "Edit" : "Add"}
          </button>
        </div>
        {showToken && (
          <div className="px-3 pb-2.5 space-y-1.5">
            <input
              type="password"
              autoComplete="off"
              value={patToken}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="github_pat_... or ghp_..."
              aria-label="GitHub access token"
              className={intakeInputClass}
            />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Use a fine-grained token with read-only Contents and Metadata. It stays in this tab&apos;s session storage.{" "}
              <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-zinc-700 hover:text-orange-600">
                Create token <ArrowUpRight className="size-3" />
              </a>
            </p>
          </div>
        )}
      </div>

      {isLoading && statusMessage && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="size-3.5 animate-spin text-orange-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <IntakeError
          message={error}
          action={
            !showToken ? (
              <button type="button" onClick={() => setShowToken(true)} className="text-[11px] font-semibold underline cursor-pointer shrink-0">
                Add token
              </button>
            ) : undefined
          }
        />
      )}

      {analysis && (
        <div className={intakePanelClass}>
          <div className="px-3 py-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold break-all">{analysis.metadata.fullName}</span>
              <span className="text-[11px] font-mono text-zinc-400">{analysis.metadata.defaultBranch}</span>
              {analysis.metadata.isPrivate && <span className={intakePillClass}>Private</span>}
            </div>
            {analysis.metadata.description && <p className="text-xs text-zinc-500 line-clamp-1">{analysis.metadata.description}</p>}
          </div>

          {(stack.length > 0 || analysis.commitConvention === "conventional") && (
            <IntakeRow label="Stack">
              <div className="flex flex-wrap gap-1">
                {stack.map((tech) => (
                  <span key={tech} className={intakePillClass}>
                    {tech}
                  </span>
                ))}
                {analysis.commitConvention === "conventional" && <span className={intakePillClass}>Conventional Commits</span>}
              </div>
            </IntakeRow>
          )}

          {Object.keys(analysis.scripts).length > 0 && (
            <IntakeRow label={`Scripts (${analysis.packageManager})`}>
              <ScriptList scripts={analysis.scripts} />
            </IntakeRow>
          )}

          <IntakeRow label="Draft rules">
            <p className="text-xs text-zinc-700 leading-relaxed">
              <span className="font-semibold text-zinc-900">Role:</span> {analysis.synthesizedRole}
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{analysis.synthesizedDirectives.join(" · ")}</p>
          </IntakeRow>

          <IntakeFormatSwitch value={selectedFormat} onChange={setSelectedFormat} />
        </div>
      )}
    </IntakeModal>
  );
}
