"use client";

import React from "react";
import { FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./InfoTooltip";

export interface CursorRuleScopeCardProps {
  globPattern: string;
  setGlobPattern: (value: string) => void;
  alwaysApply: boolean;
  setAlwaysApply: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Cursor Rule Scope card (cursor_mdc): the rule's file glob and its alwaysApply toggle. */
export function CursorRuleScopeCard({
  globPattern,
  setGlobPattern,
  alwaysApply,
  setAlwaysApply,
}: CursorRuleScopeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-2.5 gap-1">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-zinc-900 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Cursor Rule Scope</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 font-mono">.cursor/rules/*.mdc</span>
          <InfoTooltip
            title="Cursor Rule Scope"
            description="Configure how Cursor IDE loads this .mdc rule — either scoped to specific glob matching files or injected into all model contexts."
            example="glob: src/app/**/*.tsx\nalwaysApply: false"
            align="right"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">File Glob Pattern</label>
            <InfoTooltip
              title="File Glob Pattern"
              description="Glob pattern controlling which files trigger this rule. Use **/* for project-wide scope, or targeted paths like src/components/**/*.tsx."
              example="src/**/*.tsx\n**/*.py"
              align="right"
            />
          </div>
          <input
            type="text"
            value={globPattern}
            onChange={(e) => setGlobPattern(e.target.value)}
            placeholder="e.g. src/app/**/*.tsx or **/*"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <p className="text-[10px] text-zinc-500">Scopes rule to matching files. Use **/* for global workspace scope.</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Always Apply Behavior</label>
            <InfoTooltip
              title="Always Apply Behavior"
              description="When enabled (alwaysApply: true), Cursor injects this rule into every generation and chat context, regardless of which file is open."
              align="right"
            />
          </div>
          <button
            type="button"
            onClick={() => setAlwaysApply((prev) => !prev)}
            className={cn(
              "w-full px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all mt-0.5",
              alwaysApply
                ? "border-black bg-zinc-950 text-white shadow-xs"
                : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
            )}
          >
            <span>alwaysApply: {alwaysApply ? "true" : "false"}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", alwaysApply ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-600")}>
              {alwaysApply ? "ALWAYS ON" : "SCOPED ONLY"}
            </span>
          </button>
          <p className="text-[10px] text-zinc-500">When ON, Cursor injects this rule in every generation context.</p>
        </div>
      </div>
    </div>
  );
}
