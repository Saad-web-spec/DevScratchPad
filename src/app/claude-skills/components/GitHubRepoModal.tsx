"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/AssistantBrandIcons";
import { OutputFormat } from "../lib/presetRegistry";
import {
  analyzeGitHubRepository,
  IngestedRepoAnalysis,
  parseGitHubRepoInput,
} from "../lib/githubIngest";

interface GitHubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (analysis: IngestedRepoAnalysis, token?: string, targetFormat?: OutputFormat) => void;
  initialInput?: string;
  initialFormat?: OutputFormat;
}

const SAMPLE_REPOS = [
  { label: "Next.js", value: "vercel/next.js" },
  { label: "Tailwind CSS", value: "tailwindlabs/tailwindcss" },
  { label: "FastAPI", value: "fastapi/fastapi" },
  { label: "React", value: "facebook/react" },
];

export function GitHubRepoModal({
  isOpen,
  onClose,
  onApply,
  initialInput = "",
  initialFormat = "claude_md",
}: GitHubRepoModalProps) {
  const [repoInput, setRepoInput] = useState(initialInput || "");
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(
    initialFormat === "mcp_json" ? "claude_md" : initialFormat
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(initialFormat === "mcp_json" ? "claude_md" : initialFormat);
    }
  }, [isOpen, initialFormat]);
  const [patToken, setPatToken] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("devscratchpad_github_pat") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [showTokenSettings, setShowTokenSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IngestedRepoAnalysis | null>(null);

  if (!isOpen) return null;

  const handleTokenChange = (val: string) => {
    setPatToken(val);
    if (typeof window !== "undefined") {
      try {
        if (val.trim()) {
          sessionStorage.setItem("devscratchpad_github_pat", val.trim());
        } else {
          sessionStorage.removeItem("devscratchpad_github_pat");
        }
      } catch {
        // ignore storage restrictions
      }
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setAnalysis(null);

    const parsed = parseGitHubRepoInput(repoInput);
    if (!parsed) {
      setError('Please enter a valid repository format ("owner/repo" or https://github.com/owner/repo).');
      return;
    }

    setIsLoading(true);
    setStatusMessage("Connecting to GitHub API...");

    try {
      const result = await analyzeGitHubRepository(
        repoInput,
        patToken.trim() || undefined,
        (msg) => setStatusMessage(msg)
      );
      setAnalysis(result);
      setStatusMessage(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze repository.";
      setError(message);
      setStatusMessage(null);
      // Auto-open token section if rate limited or unauthenticated
      if (message.toLowerCase().includes("token") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("403")) {
        setShowTokenSettings(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!analysis) return;
    onApply(analysis, patToken.trim() || undefined, selectedFormat);
    onClose();
  };

  const isTokenPresent = patToken.trim().length > 0;
  const isLikelyValidToken = patToken.startsWith("ghp_") || patToken.startsWith("github_pat_");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xl max-w-xl w-full overflow-hidden space-y-3.5 sm:space-y-4 p-4 sm:p-5 text-zinc-900 animate-in zoom-in-95 duration-150 transition-all max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between border-b border-zinc-100 pb-3 shrink-0 gap-2">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <GitHubIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Ingest GitHub Repository</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-orange-600" />
                  <span>100% Client-Side Private</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                Analyzes repository structure, manifests &amp; team conventions directly in your browser. Zero server transmission.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-3.5 pr-1">
          {/* Input & Analyze Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">Repository Identifier</label>
              <span className="text-[11px] text-zinc-400 font-mono">owner/repo or URL</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleAnalyze();
                }}
                placeholder="e.g. vercel/next.js or https://github.com/facebook/react"
                className="flex-1 min-w-0 px-3 py-2 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || !repoInput.trim()}
                className="px-3.5 sm:px-4 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed min-h-[38px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inspecting...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-400 font-medium">Quick try:</span>
              {SAMPLE_REPOS.map((sample) => (
                <button
                  key={sample.value}
                  type="button"
                  onClick={() => {
                    setRepoInput(sample.value);
                    setError(null);
                  }}
                  className="text-[10px] font-mono px-2 py-1 sm:py-0.5 rounded-md bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-orange-700 border border-zinc-200 hover:border-orange-200 transition-colors cursor-pointer min-h-[28px] sm:min-h-0 flex items-center"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* First-Class GitHub Authentication Section */}
          <div className="text-xs bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="font-semibold text-zinc-800 text-[11px] sm:text-xs">
                  Need private repo access or higher rate limits? (Optional Token)
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {isTokenPresent ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Authenticated
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Public (60/hr)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowTokenSettings(!showTokenSettings)}
                  className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer min-h-[24px] flex items-center"
                >
                  {showTokenSettings ? "Hide Token" : isTokenPresent ? "Edit Token" : "Add Token"}
                </button>
              </div>
            </div>

            {showTokenSettings ? (
              <div className="space-y-2 pt-1 border-t border-zinc-200/60 animate-in fade-in-50 duration-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="text-zinc-600 font-medium">Personal Access Token</label>
                    <a
                      href="https://github.com/settings/tokens/new?description=DevScratchpad+Skill+Studio&scopes=repo,read:org,read:user"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-0.5"
                    >
                      <span>Generate Token on GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={patToken}
                    onChange={(e) => handleTokenChange(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Authentication increases rate limits from 60 to 5,000 req/hr and enables private repository access. Handled purely in browser memory.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-500">
                <span className="leading-snug">
                  {isTokenPresent
                    ? isLikelyValidToken
                      ? "Personal token configured for high-rate API calls."
                      : "Custom access token loaded."
                    : "Authentication increases rate limits from 60 to 5,000 req/hr and enables private repository access."}
                </span>
                {!isTokenPresent && (
                  <a
                    href="https://github.com/settings/tokens/new?description=DevScratchpad+Skill+Studio&scopes=repo,read:org,read:user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-zinc-700 hover:text-orange-600 inline-flex items-center gap-0.5 shrink-0 self-start sm:self-auto sm:ml-2 mt-0.5 sm:mt-0"
                  >
                    <span>Get Token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Loading status */}
          {isLoading && statusMessage && (
            <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-lg flex items-center gap-2.5 text-xs text-orange-800 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-900">Inspection Notice</span>
                  {!showTokenSettings && (
                    <button
                      type="button"
                      onClick={() => setShowTokenSettings(true)}
                      className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                    >
                      Enter Token
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success & Analysis Report Card */}
          {analysis && (
            <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 animate-in fade-in-50 duration-150">
              <div className="flex items-start justify-between gap-2 border-b border-zinc-200/60 pb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-900 font-sans tracking-tight break-all">
                      {analysis.metadata.fullName}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      ({analysis.metadata.defaultBranch})
                    </span>
                    {analysis.metadata.isPrivate && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-medium">
                        Private
                      </span>
                    )}
                  </div>
                  {analysis.metadata.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 sm:line-clamp-1 mt-0.5">
                      {analysis.metadata.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Detected Stack Pills */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-zinc-500">Detected Stack:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {analysis.detectedTechStack
                    .filter((tech) => tech !== "None / Irrelevant" && tech !== "None" && tech !== "unknown")
                    .map((tech) => (
                      <span
                        key={tech}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-800"
                      >
                        {tech}
                      </span>
                    ))}
                  {analysis.commitConvention === "conventional" && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                      Conventional Commits
                    </span>
                  )}
                </div>
              </div>

              {/* Detected Commands */}
              {Object.keys(analysis.scripts).length > 0 && (
                <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Detected Scripts ({analysis.packageManager})
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

              {/* Synthesized Preview */}
              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200/80 text-xs text-zinc-700">
                <div className="text-[11px] font-medium text-zinc-500">
                  Synthesized Configuration
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
            onClick={handleApply}
            disabled={!analysis}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-200 text-white disabled:text-zinc-400 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed min-h-[38px]"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Apply &amp; Generate {selectedFormat === "claude_md" ? "CLAUDE.md" : selectedFormat === "cursor_mdc" ? "cursor.mdc" : selectedFormat === "agents_md" ? "AGENTS.md" : "SKILL.md"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
