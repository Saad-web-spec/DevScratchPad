"use client";

import React, { useMemo } from "react";
import { AlertCircle, AlertTriangle, Boxes, Check, CheckCircle2, Database, ExternalLink, FolderOpen, Info, Server, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { GitHubIcon } from "@/components/icons/AssistantBrandIcons";
import { InfoTooltip } from "./InfoTooltip";
import { MCP_PRESETS } from "../lib/ruleGenerator";

export interface McpServerConfigCardProps {
  mcpPresetId: string;
  mcpServerName: string;
  mcpCommand: string;
  mcpArgs: string;
  mcpEnvKey: string;
  mcpEnvValue: string;
  setMcpServerName: (value: string) => void;
  setMcpCommand: (value: string) => void;
  setMcpArgs: (value: string) => void;
  setMcpEnvKey: (value: string) => void;
  setMcpEnvValue: (value: string) => void;
  handleSelectMcpPreset: (presetId: string) => void;
  setIsGitHubModalOpen: (open: boolean) => void;
  setIsDdlModalOpen: (open: boolean) => void;
  setIsDockerModalOpen: (open: boolean) => void;
  setIsFolderModalOpen: (open: boolean) => void;
  requestSectionScroll: (fieldKey?: string) => void;
  setActiveFieldKey: (fieldKey: string | null) => void;
  setIsManuallyEdited: (next: boolean) => void;
}

/** MCP Server Configuration card (mcp_json): server presets, live ingestion entry points, command/args/env fields, and real-time validation diagnostics. */
export function McpServerConfigCard({
  mcpPresetId,
  mcpServerName,
  mcpCommand,
  mcpArgs,
  mcpEnvKey,
  mcpEnvValue,
  setMcpServerName,
  setMcpCommand,
  setMcpArgs,
  setMcpEnvKey,
  setMcpEnvValue,
  handleSelectMcpPreset,
  setIsGitHubModalOpen,
  setIsDdlModalOpen,
  setIsDockerModalOpen,
  setIsFolderModalOpen,
  requestSectionScroll,
  setActiveFieldKey,
  setIsManuallyEdited,
}: McpServerConfigCardProps) {
  const mcpValidation = useMemo(() => {
    const issues: { type: "error" | "warning" | "info"; message: string; field: string }[] = [];
    const isGitHub = mcpPresetId === "github" || mcpServerName.toLowerCase().includes("github") || mcpEnvKey.toUpperCase().includes("GITHUB");
    const isPostgres = mcpPresetId === "postgres" || mcpServerName.toLowerCase().includes("postgres") || mcpArgs.toLowerCase().includes("postgres");
    const isBrave = mcpPresetId === "brave-search" || mcpServerName.toLowerCase().includes("brave") || mcpEnvKey.toUpperCase().includes("BRAVE");
    const isFilesystem = mcpPresetId === "filesystem" || mcpServerName.toLowerCase().includes("filesystem") || mcpArgs.includes("server-filesystem");

    // Server identifier checks
    if (!mcpServerName.trim()) {
      issues.push({ type: "error", message: "Server identifier key is required (e.g. 'github', 'filesystem').", field: "serverName" });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(mcpServerName.trim())) {
      issues.push({ type: "warning", message: "Server key should only contain alphanumeric characters, hyphens, or underscores.", field: "serverName" });
    }

    // Command check
    if (!mcpCommand.trim()) {
      issues.push({ type: "error", message: "Executable command is required (e.g. 'npx', 'node', 'uvx').", field: "command" });
    }

    // GitHub Access Token Validation
    if (isGitHub) {
      const tokenKey = mcpEnvKey.trim();
      const tokenVal = mcpEnvValue.trim();

      if (!tokenKey || (!tokenKey.includes("GITHUB") && !tokenKey.includes("TOKEN"))) {
        issues.push({
          type: "error",
          message: "Missing environment variable name: Expected 'GITHUB_PERSONAL_ACCESS_TOKEN'.",
          field: "envKey",
        });
      }

      if (!tokenVal) {
        issues.push({
          type: "error",
          message: "GitHub Personal Access Token is required to authenticate against GitHub repositories and API.",
          field: "envValue",
        });
      } else if (tokenVal.includes("your_token_here") || tokenVal.includes("placeholder") || tokenVal.toLowerCase().includes("token")) {
        issues.push({
          type: "warning",
          message: "Placeholder token detected. Replace with a real personal access token from GitHub Settings.",
          field: "envValue",
        });
      } else if (!tokenVal.startsWith("ghp_") && !tokenVal.startsWith("github_pat_") && !tokenVal.startsWith("gho_")) {
        issues.push({
          type: "info",
          message: "Token does not match standard GitHub token prefixes ('ghp_' for classic tokens, 'github_pat_' for fine-grained).",
          field: "envValue",
        });
      }
    }

    // Postgres Connection URI Validation
    if (isPostgres) {
      const argsArray = mcpArgs.split("\n").map((a) => a.trim()).filter(Boolean);
      const uriArg = argsArray.find((a) => a.startsWith("postgres://") || a.startsWith("postgresql://") || a.includes("5432"));
      if (!uriArg) {
        issues.push({
          type: "error",
          message: "PostgreSQL connection URI argument is missing. Expected 'postgresql://user:password@host:port/dbname'.",
          field: "args",
        });
      } else if (uriArg.includes("user:password@localhost")) {
        issues.push({
          type: "warning",
          message: "Placeholder database credentials detected. Update credentials for target PostgreSQL host.",
          field: "args",
        });
      }
    }

    // Brave Search Validation
    if (isBrave) {
      if (!mcpEnvValue.trim() || mcpEnvValue.includes("your_brave_search_api_key")) {
        issues.push({
          type: "warning",
          message: "Brave Search API Key is required for web queries. Obtain one from brave.com/search/api.",
          field: "envValue",
        });
      }
    }

    // Filesystem path check
    if (isFilesystem) {
      const argsArray = mcpArgs.split("\n").map((a) => a.trim()).filter(Boolean);
      const hasPath = argsArray.some((a) => a.startsWith("./") || a.startsWith("/") || a.includes(":\\") || a === ".");
      if (!hasPath) {
        issues.push({
          type: "warning",
          message: "Filesystem MCP server requires at least one directory path argument (e.g. './' or absolute path).",
          field: "args",
        });
      }
    }

    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");
    const infos = issues.filter((i) => i.type === "info");

    return {
      isValid: errors.length === 0 && warnings.length === 0,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      isGitHub,
      isPostgres,
      isBrave,
      isFilesystem,
      issues,
      errors,
      warnings,
      infos,
    };
  }, [mcpPresetId, mcpServerName, mcpCommand, mcpArgs, mcpEnvKey, mcpEnvValue]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-orange-600 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Claude MCP Server Configuration</h3>
        </div>
        <div className="flex items-center gap-2">
          {mcpValidation.hasErrors ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
              {mcpValidation.errors.length} {mcpValidation.errors.length === 1 ? "issue" : "issues"}
            </span>
          ) : mcpValidation.hasWarnings ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              {mcpValidation.warnings.length} {mcpValidation.warnings.length === 1 ? "warning" : "warnings"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-50/70 border border-orange-200/70 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-orange-600 shrink-0" />
              Ready for Claude
            </span>
          )}
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">.mcp.json</span>
          <InfoTooltip
            title="Claude MCP Server"
            description="Model Context Protocol config for connecting Claude Code CLI or Claude Desktop to local tools, filesystems, and databases."
            example=".mcp.json -> mcpServers"
            align="right"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-700">Select MCP Preset Template</label>
          <InfoTooltip
            title="MCP Preset Templates"
            description="Pre-configured Model Context Protocol server templates for common developer tools like filesystem, memory, github, and fetch."
            align="right"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {MCP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectMcpPreset(preset.id)}
              className={cn(
                "px-2.5 py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5",
                mcpPresetId === preset.id
                  ? "border-blue-500 bg-blue-50/60 text-blue-900 font-semibold ring-1 ring-blue-400"
                  : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700"
              )}
            >
              <span className="truncate">{preset.label}</span>
              <span className="text-[10px] text-zinc-500 font-mono font-normal truncate">{preset.command}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Server Identifier Key</label>
            <InfoTooltip
              title="Server Identifier Key"
              description="Unique key name for the MCP server inside the mcpServers JSON dictionary."
              example="filesystem, github, postgres"
              align="left"
            />
          </div>
          <input
            type="text"
            value={mcpServerName}
            onFocus={() => requestSectionScroll("mcpServerName")}
            onChange={(e) => { setMcpServerName(e.target.value); setActiveFieldKey("mcpServerName"); setIsManuallyEdited(false); }}
            placeholder="e.g. filesystem or github"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Executable Command</label>
            <InfoTooltip
              title="Executable Command"
              description="Binary runner to launch the MCP server (npx, uvx, node, python)."
              example="npx, uvx"
              align="right"
            />
          </div>
          <input
            type="text"
            value={mcpCommand}
            onFocus={() => requestSectionScroll("mcpCommand")}
            onChange={(e) => { setMcpCommand(e.target.value); setActiveFieldKey("mcpCommand"); setIsManuallyEdited(false); }}
            placeholder="npx, uvx, node, python"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-700">Command Arguments (One per line)</label>
            {mcpValidation.isFilesystem && (
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                title="Inspect local folder manifests and directory structure"
              >
                <FolderOpen className="w-3 h-3 text-blue-600" />
                <span>Inspect Local Folder</span>
              </button>
            )}
          </div>
          <InfoTooltip
            title="Command Arguments"
            description="Command line arguments passed to the MCP server process, one argument per line."
            example="-y\n@modelcontextprotocol/server-filesystem\n./"
            align="right"
          />
        </div>
        <textarea
          rows={3}
          value={mcpArgs}
          onFocus={() => requestSectionScroll("mcpArgs")}
            onChange={(e) => { setMcpArgs(e.target.value); setActiveFieldKey("mcpArgs"); setIsManuallyEdited(false); }}
          placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;./"
          className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Environment Variable Key (Optional)</label>
            <InfoTooltip
              title="Environment Variable Key"
              description="Secret environment variable name required by the server (e.g. API keys or tokens)."
              example="GITHUB_PERSONAL_ACCESS_TOKEN"
              align="left"
            />
          </div>
          <input
            type="text"
            value={mcpEnvKey}
            onFocus={() => requestSectionScroll("mcpEnvKey")}
            onChange={(e) => { setMcpEnvKey(e.target.value); setActiveFieldKey("mcpEnvKey"); setIsManuallyEdited(false); }}
            placeholder="e.g. GITHUB_PERSONAL_ACCESS_TOKEN"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Environment Variable Value</label>
            {mcpValidation.isGitHub && (
              <span className="text-[10px]">
                {!mcpEnvValue.trim() ? (
                  <span className="text-rose-600 font-medium">Token required</span>
                ) : mcpEnvValue.includes("your_token_here") || mcpEnvValue.includes("placeholder") ? (
                  <span className="text-amber-600 font-medium">Placeholder token</span>
                ) : mcpEnvValue.startsWith("ghp_") || mcpEnvValue.startsWith("github_pat_") ? (
                  <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Valid PAT format
                  </span>
                ) : (
                  <span className="text-zinc-500">Custom token</span>
                )}
              </span>
            )}
          </div>
          <input
            type="password"
            autoComplete="off"
            value={mcpEnvValue}
            onFocus={() => requestSectionScroll("mcpEnvValue")}
            onChange={(e) => { setMcpEnvValue(e.target.value); setActiveFieldKey("mcpEnvValue"); setIsManuallyEdited(false); }}
            placeholder="e.g. ghp_your_token_here"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* GitHub PAT Helper Banner */}
      {mcpValidation.isGitHub && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-orange-50/50 border border-orange-200/50 rounded-lg text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-orange-800 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-orange-800 shrink-0" />
              <span>GitHub Personal Access Token (PAT) Required</span>
            </div>
            <p className="text-[11px] text-orange-800 leading-relaxed">
              Classic token (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">ghp_...</code>) or Fine-grained (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">github_pat_...</code>) with <code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">repo</code> and <code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">read:org</code> scopes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <GitHubIcon className="w-3.5 h-3.5 text-white" />
              <span>Ingest Repo</span>
            </button>
            <a
              href="https://github.com/settings/tokens/new?description=Claude+Code+MCP&scopes=repo,read:org,read:user"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 bg-white hover:bg-orange-50/80 text-orange-700 hover:text-orange-800 border border-orange-200 rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <span>Generate Token</span>
              <ExternalLink className="w-3 h-3 text-orange-700" />
            </a>
          </div>
        </div>
      )}

      {/* Database Schema Introspection Banner */}
      {(mcpValidation.isPostgres || mcpPresetId === "sqlite") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span>Live Database Schema Introspection</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Paste SQL DDL or Prisma schema to extract tables, foreign keys, and synthesize database safety guardrails.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDdlModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Introspect DDL</span>
          </button>
        </div>
      )}

      {/* Docker Compose Introspection Banner */}
      {mcpPresetId === "docker" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
              <span>Live Docker Compose &amp; Container Introspection</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Paste docker-compose.yml or Dockerfile to extract services, port mappings, and container rules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDockerModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Introspect Compose</span>
          </button>
        </div>
      )}

      {/* Real-time Validation Diagnostics Checklist */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            MCP Protocol Diagnostics
          </span>
          <span className="text-[10px] text-zinc-500">
            {mcpValidation.issues.length === 0
              ? "All checks passed"
              : `${mcpValidation.issues.length} check${mcpValidation.issues.length > 1 ? "s" : ""} flagged`}
          </span>
        </div>

        {mcpValidation.issues.length > 0 ? (
          <div className="space-y-1.5">
            {mcpValidation.issues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2 text-xs p-2 rounded-md border leading-relaxed",
                  issue.type === "error"
                    ? "bg-rose-50/80 border-rose-200 text-rose-900"
                    : issue.type === "warning"
                    ? "bg-amber-50/80 border-amber-200 text-amber-900"
                    : "bg-orange-50/60 border-orange-200/70 text-orange-900"
                )}
              >
                {issue.type === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                ) : issue.type === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                )}
                <span className="text-[11px] flex-1">{issue.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-orange-800 bg-orange-50/50 border border-orange-200/50 rounded-md p-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="text-[11px]">
              MCP configuration verified. Compatible with Claude Code (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">.mcp.json</code>) and Claude Desktop (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">claude_desktop_config.json</code>).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
