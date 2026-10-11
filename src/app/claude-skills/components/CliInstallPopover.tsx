"use client";

import React from "react";
import { Check, Copy, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard, type InstallCommands, type OutputFormat } from "../lib/ruleGenerator";
import type { CliTab } from "../lib/cliInstall";

export interface CliInstallPopoverProps {
  format: OutputFormat;
  /** Content differs from the preset's raw stream, so only heredoc commands can reproduce it */
  isCustomEdited: boolean;
  showCliDropdown: boolean;
  setShowCliDropdown: (open: boolean) => void;
  cliDropdownRef: React.RefObject<HTMLDivElement | null>;
  cliActiveTab: CliTab;
  setCliActiveTab: (tab: CliTab) => void;
  cliCopied: boolean;
  setCliCopied: (copied: boolean) => void;
  cliCommands: InstallCommands;
  currentTabCliCommand: string;
  targetInstallFile: string;
  handleCliAction: () => void;
}

/** Editor toolbar CLI button: copies the primary install command and toggles a popover with per-shell install commands. */
export function CliInstallPopover({
  format,
  isCustomEdited,
  showCliDropdown,
  setShowCliDropdown,
  cliDropdownRef,
  cliActiveTab,
  setCliActiveTab,
  cliCopied,
  setCliCopied,
  cliCommands,
  currentTabCliCommand,
  targetInstallFile,
  handleCliAction,
}: CliInstallPopoverProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCliAction}
        className={cn(
          "flex items-center gap-1 px-1.5 sm:px-2 2xl:px-2.5 py-1 text-xs rounded-md transition-colors font-medium cursor-pointer",
          showCliDropdown
            ? "bg-zinc-700 text-orange-400"
            : "text-zinc-300 hover:text-white hover:bg-zinc-700/60"
        )}
        title={
          isCustomEdited
            ? "Copy custom Heredoc terminal command to install in repo"
            : "Copy terminal curl install command to install in repo"
        }
      >
        {cliCopied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{isCustomEdited ? "Heredoc!" : "Copied!"}</span>
          </>
        ) : (
          <>
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden 2xl:inline">CLI</span>
          </>
        )}
      </button>

      {/* Dropdown Modal */}
      {showCliDropdown && (
        <div
          ref={cliDropdownRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-[480px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-4 font-sans text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <span className="font-semibold text-zinc-100">Terminal Command</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono",
                  isCustomEdited
                    ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                )}
              >
                {isCustomEdited ? "Custom Heredoc" : "Preset Stream"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCliDropdown(false)}
              className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Options */}
          <div className="flex items-center gap-1 mt-3 mb-2 flex-wrap">
            {!isCustomEdited ? (
              <>
                <button
                  type="button"
                  onClick={() => setCliActiveTab("bash")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "bash"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Bash (curl)
                </button>
                <button
                  type="button"
                  onClick={() => setCliActiveTab("powershell")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "powershell"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  PowerShell
                </button>
                <button
                  type="button"
                  onClick={() => setCliActiveTab("wget")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "wget"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Wget
                </button>
                {format === "mcp_json" && cliCommands.cliRunner && (
                  <button
                    type="button"
                    onClick={() => setCliActiveTab("cli")}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                      cliActiveTab === "cli"
                        ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    CLI Runner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCliActiveTab("heredoc")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "heredoc"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Heredoc
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCliActiveTab("bash")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "bash"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Heredoc (Bash)
                </button>
                <button
                  type="button"
                  onClick={() => setCliActiveTab("powershell")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                    cliActiveTab === "powershell"
                      ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  PowerShell Script
                </button>
              </>
            )}
          </div>

          {/* Code Display Area */}
          <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto overflow-x-auto text-zinc-300 select-all whitespace-pre-wrap">
            {currentTabCliCommand}
          </pre>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 truncate mr-2">
              Target: <code className="text-zinc-400">{targetInstallFile}</code>
            </span>
            <button
              type="button"
              onClick={async () => {
                const success = await copyToClipboard(currentTabCliCommand);
                if (success) {
                  setCliCopied(true);
                  setTimeout(() => setCliCopied(false), 2000);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              {cliCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
