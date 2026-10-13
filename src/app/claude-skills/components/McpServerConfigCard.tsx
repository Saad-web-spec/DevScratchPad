"use client";

import React, { useMemo } from "react";
import {
  AppWindow,
  ArrowUpRight,
  Brain,
  CircleAlert,
  CircleCheck,
  Container,
  Database,
  FolderOpen,
  FolderSearch,
  Globe,
  HardDrive,
  Info,
  Search,
  Server,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
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

type PresetIcon = LucideIcon | typeof GitHubIcon;

/** Short tile labels and icons for MCP_PRESETS (the long labels are used on SEO pages). */
const PRESET_UI: Record<string, { short: string; icon: PresetIcon }> = {
  filesystem: { short: "Filesystem", icon: FolderOpen },
  github: { short: "GitHub", icon: GitHubIcon },
  postgres: { short: "Postgres", icon: Database },
  "brave-search": { short: "Brave", icon: Search },
  fetch: { short: "Web Fetch", icon: Globe },
  memory: { short: "Memory", icon: Brain },
  sqlite: { short: "SQLite", icon: HardDrive },
  puppeteer: { short: "Puppeteer", icon: AppWindow },
  docker: { short: "Docker", icon: Container },
  custom: { short: "Custom", icon: Wrench },
};

/** `${VAR}` reference: Claude Code expands it from the shell when it loads .mcp.json. */
const ENV_REF_RE = /^\$\{[A-Za-z_][A-Za-z0-9_]*\}$/;
const SECRET_KEY_RE = /TOKEN|SECRET|PASSWORD|API_?KEY|_KEY$/i;
const PLACEHOLDER_RE = /your_|placeholder|<token>|changeme/i;

const inputClass =
  "w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15";

type Issue = { type: "error" | "warning" | "info"; message: string };

/** MCP Server Configuration card (mcp_json): server presets, command/args/env fields, an optional context import, and live checks. */
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
  const check = useMemo(() => {
    const issues: Issue[] = [];
    const name = mcpServerName.trim();
    const envKey = mcpEnvKey.trim();
    const envValue = mcpEnvValue.trim();
    const argsArray = mcpArgs.split("\n").map((a) => a.trim()).filter(Boolean);
    const isGitHub = mcpPresetId === "github" || name.toLowerCase().includes("github") || envKey.toUpperCase().includes("GITHUB");
    const isPostgres = mcpPresetId === "postgres" || name.toLowerCase().includes("postgres") || mcpArgs.toLowerCase().includes("postgres");
    const isBrave = mcpPresetId === "brave-search" || name.toLowerCase().includes("brave") || envKey.toUpperCase().includes("BRAVE");
    const isFilesystem = mcpPresetId === "filesystem" || name.toLowerCase().includes("filesystem") || mcpArgs.includes("server-filesystem");
    const envRefHint = `\${${envKey || "VAR_NAME"}}`;

    if (!name) {
      issues.push({ type: "error", message: "Add a server key (e.g. github, filesystem)." });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      issues.push({ type: "warning", message: "Server key should use only letters, digits, hyphens and underscores." });
    }

    if (!mcpCommand.trim()) {
      issues.push({ type: "error", message: "Add the command that starts the server (npx, uvx, node)." });
    }

    if (isGitHub) {
      if (!envKey || (!envKey.includes("GITHUB") && !envKey.includes("TOKEN"))) {
        issues.push({ type: "error", message: "Set the env variable name to GITHUB_PERSONAL_ACCESS_TOKEN." });
      }
      if (!envValue) {
        issues.push({ type: "error", message: "Add a token value. Use ${GITHUB_PERSONAL_ACCESS_TOKEN} to read it from your environment." });
      }
    }

    if (isBrave && !envValue) {
      issues.push({ type: "warning", message: "Brave Search needs an API key. Use ${BRAVE_API_KEY} and set it in your shell." });
    }

    // Secrets belong in the environment, not in a file that is often committed
    if (envValue && !ENV_REF_RE.test(envValue)) {
      if (PLACEHOLDER_RE.test(envValue)) {
        issues.push({ type: "warning", message: `Replace the placeholder with ${envRefHint}.` });
      } else if (SECRET_KEY_RE.test(envKey) || isGitHub || isBrave) {
        issues.push({
          type: "warning",
          message: `This writes a real secret into the file. Use ${envRefHint} and keep the value in your shell; never commit it.`,
        });
      }
    }

    if (isPostgres) {
      const uriArg = argsArray.find((a) => a.startsWith("postgres://") || a.startsWith("postgresql://") || a.includes("5432"));
      const password = uriArg?.match(/:\/\/[^:/\s@]+:([^@\s]+)@/)?.[1];
      if (!uriArg) {
        issues.push({ type: "error", message: "Add a connection URI argument: postgresql://user:password@host:5432/dbname." });
      } else if (password && !ENV_REF_RE.test(password)) {
        issues.push({ type: "warning", message: "The connection URI contains a literal password. Use ${DB_PASSWORD} instead." });
      }
    }

    if (isFilesystem && !argsArray.some((a) => a.startsWith("./") || a.startsWith("/") || a.includes(":\\") || a === ".")) {
      issues.push({ type: "warning", message: "Add at least one directory path argument (e.g. ./ or an absolute path)." });
    }

    return {
      issues,
      errors: issues.filter((i) => i.type === "error").length,
      warnings: issues.filter((i) => i.type === "warning").length,
      isGitHub,
      isPostgres,
      isFilesystem,
    };
  }, [mcpPresetId, mcpServerName, mcpCommand, mcpArgs, mcpEnvKey, mcpEnvValue]);

  const envValue = mcpEnvValue.trim();
  const envStatus = !mcpEnvKey.trim()
    ? null
    : !envValue
    ? check.isGitHub
      ? { text: "Required", tone: "text-rose-600" }
      : null
    : ENV_REF_RE.test(envValue)
    ? { text: "From environment", tone: "text-zinc-500" }
    : { text: "Literal value", tone: "text-amber-600" };

  // One optional import per preset family, shown in a single consistent row
  const contextTool = check.isGitHub
    ? { icon: GitHubIcon, title: "Draft rules from a repository", hint: "Reads manifests, scripts and commit style.", action: "Import repo", open: () => setIsGitHubModalOpen(true) }
    : check.isPostgres || mcpPresetId === "sqlite"
    ? { icon: Database, title: "Draft data rules from your schema", hint: "Paste SQL DDL or a Prisma schema.", action: "Paste schema", open: () => setIsDdlModalOpen(true) }
    : mcpPresetId === "docker"
    ? { icon: Container, title: "Draft rules from your Docker setup", hint: "Paste docker-compose.yml or a Dockerfile.", action: "Paste compose", open: () => setIsDockerModalOpen(true) }
    : check.isFilesystem
    ? { icon: FolderSearch, title: "Set the path from a local folder", hint: "Also drafts rules from its manifest.", action: "Pick folder", open: () => setIsFolderModalOpen(true) }
    : null;

  const field = (key: string, setter: (v: string) => void) => ({
    onFocus: () => requestSectionScroll(key),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      setActiveFieldKey(key);
      setIsManuallyEdited(false);
    },
  });

  return (
    <div data-tour="mcp" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-4 h-4 text-orange-600 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900 truncate">MCP Server</h3>
          <InfoTooltip
            title="Claude MCP Server"
            description="Model Context Protocol config that connects Claude Code or Claude Desktop to local tools, files and databases."
            example=".mcp.json -> mcpServers"
            align="left"
          />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
            check.errors
              ? "text-rose-700 bg-rose-50 border-rose-200"
              : check.warnings
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-zinc-600 bg-zinc-50 border-zinc-200"
          )}
        >
          {check.errors ? (
            <CircleAlert className="w-3 h-3" />
          ) : check.warnings ? (
            <TriangleAlert className="w-3 h-3" />
          ) : (
            <CircleCheck className="w-3 h-3" />
          )}
          {check.errors
            ? `${check.errors} ${check.errors === 1 ? "issue" : "issues"}`
            : check.warnings
            ? `${check.warnings} ${check.warnings === 1 ? "warning" : "warnings"}`
            : "Valid"}
        </span>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" role="radiogroup" aria-label="MCP server preset">
        {MCP_PRESETS.map((preset) => {
          const ui = PRESET_UI[preset.id] ?? { short: preset.label, icon: Server };
          const Icon = ui.icon;
          const active = mcpPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={preset.description}
              onClick={() => handleSelectMcpPreset(preset.id)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer min-w-0",
                active ? "border-orange-300 bg-orange-50/60 text-zinc-900" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-orange-600" : "text-zinc-400")} />
              <span className="min-w-0">
                <span className={cn("block text-xs truncate", active ? "font-semibold" : "font-medium")}>{ui.short}</span>
                <span className="block text-[10px] font-mono text-zinc-400 truncate">{preset.command}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="mcp-server-key" className="text-xs font-semibold text-zinc-700">Server key</label>
            <InfoTooltip title="Server key" description="Name of this server inside the mcpServers object." example="filesystem, github, postgres" align="left" />
          </div>
          <input id="mcp-server-key" type="text" value={mcpServerName} {...field("mcpServerName", setMcpServerName)} placeholder="github" className={inputClass} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="mcp-command" className="text-xs font-semibold text-zinc-700">Command</label>
            <InfoTooltip title="Command" description="Program that starts the MCP server." example="npx, uvx, node, python" align="right" />
          </div>
          <input id="mcp-command" type="text" value={mcpCommand} {...field("mcpCommand", setMcpCommand)} placeholder="npx" className={inputClass} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="mcp-args" className="text-xs font-semibold text-zinc-700">
            Arguments <span className="font-normal text-zinc-400">one per line</span>
          </label>
          <InfoTooltip
            title="Arguments"
            description="Arguments passed to the command, one per line. Use ${VAR} for secrets such as passwords."
            example="-y\n@modelcontextprotocol/server-filesystem\n./"
            align="right"
          />
        </div>
        <textarea
          id="mcp-args"
          rows={3}
          value={mcpArgs}
          {...field("mcpArgs", setMcpArgs)}
          spellCheck={false}
          placeholder={"-y\n@modelcontextprotocol/server-filesystem\n./"}
          className={cn(inputClass, "p-2.5 leading-relaxed resize-y")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="mcp-env-key" className="text-xs font-semibold text-zinc-700">
              Env variable <span className="font-normal text-zinc-400">optional</span>
            </label>
            <InfoTooltip title="Env variable" description="Name of the variable the server reads, usually an API key or token." example="GITHUB_PERSONAL_ACCESS_TOKEN" align="left" />
          </div>
          <input id="mcp-env-key" type="text" value={mcpEnvKey} {...field("mcpEnvKey", setMcpEnvKey)} placeholder="API_KEY" className={inputClass} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="mcp-env-value" className="text-xs font-semibold text-zinc-700">Value</label>
            <span className="flex items-center gap-1.5">
              {envStatus && <span className={cn("text-[11px] font-medium", envStatus.tone)}>{envStatus.text}</span>}
              <InfoTooltip
                title="Value"
                description="Prefer a ${VAR} reference: Claude Code expands it from your shell when it loads .mcp.json, so the secret never lands in the file. Claude Desktop may need the literal value in its own local config, which should never be committed."
                example="${GITHUB_PERSONAL_ACCESS_TOKEN}"
                align="right"
              />
            </span>
          </div>
          <input
            id="mcp-env-value"
            type="password"
            autoComplete="off"
            value={mcpEnvValue}
            {...field("mcpEnvValue", setMcpEnvValue)}
            placeholder={mcpEnvKey.trim() ? `\${${mcpEnvKey.trim()}}` : "${API_KEY}"}
            className={inputClass}
          />
          {check.isGitHub && (
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-orange-600"
            >
              Create a fine-grained token <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {contextTool && (
        <div className="flex items-center gap-3 border-t border-zinc-100 pt-3">
          <contextTool.icon className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-800">{contextTool.title}</div>
            <div className="text-[11px] text-zinc-500 truncate">{contextTool.hint}</div>
          </div>
          <button
            type="button"
            onClick={contextTool.open}
            className="px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white hover:border-orange-300 hover:text-orange-700 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            {contextTool.action}
          </button>
        </div>
      )}

      {/* Live checks */}
      <div className="border-t border-zinc-100 pt-3">
        {check.issues.length > 0 ? (
          <ul className="space-y-1.5">
            {check.issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-700">
                {issue.type === "error" ? (
                  <CircleAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-px" />
                ) : issue.type === "warning" ? (
                  <TriangleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-px" />
                )}
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
            <CircleCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-px" />
            <span>
              Valid for Claude Code (<code className="font-mono text-zinc-700">.mcp.json</code>) and Claude Desktop (
              <code className="font-mono text-zinc-700">claude_desktop_config.json</code>).
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
