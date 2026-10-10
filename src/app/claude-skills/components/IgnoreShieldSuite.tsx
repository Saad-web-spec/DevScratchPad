"use client";

import React, { useMemo } from "react";
import { CheckCircle2, Cpu, Database, FileArchive, FileText, FolderGit2, Lock, Package, ShieldCheck, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./InfoTooltip";
import type { OutputFormat } from "../lib/ruleGenerator";

export type IgnoreProfile = "full_shield" | "security_only" | "max_token_saver" | "custom";

interface IgnoreCategoryItem {
  id: string;
  sectionKey: string;
  name: string;
  desc: string;
  tokenSavings: number;
  tokenLabel: string;
  isSecret?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const IGNORE_CATEGORY_LIST: IgnoreCategoryItem[] = [
  {
    id: "secrets",
    sectionKey: "ignoreSecrets",
    name: "Secrets & Local Credentials",
    desc: "Masks .env files, private keys, SSL certs, service accounts, and API credentials from AI indexers.",
    tokenSavings: 5,
    tokenLabel: "~5k tokens",
    isSecret: true,
    icon: ShieldCheck,
  },
  {
    id: "dependencies",
    sectionKey: "ignoreDependencies",
    name: "Dependency Bloat & Lockfiles",
    desc: "Excludes node_modules, vendor directories, and massive lockfiles (package-lock, yarn, pnpm, Cargo).",
    tokenSavings: 60,
    tokenLabel: "~60k tokens",
    icon: Package,
  },
  {
    id: "build",
    sectionKey: "ignoreBuild",
    name: "Build Outputs & Framework Caches",
    desc: "Filters out dist/, build/, out/, .next/, .turbo/, .cache/, and compiled bytecode artifacts.",
    tokenSavings: 35,
    tokenLabel: "~35k tokens",
    icon: Cpu,
  },
  {
    id: "media",
    sectionKey: "ignoreMedia",
    name: "Media & Heavy Binary Blobs",
    desc: "Omits raster images (png, jpg, webp), audio/video, fonts, zip archives, and wasm binaries.",
    tokenSavings: 20,
    tokenLabel: "~20k tokens",
    icon: FileArchive,
  },
  {
    id: "logs",
    sectionKey: "ignoreLogs",
    name: "Logs & Diagnostic Traces",
    desc: "Blocks test coverage reports (coverage/, .nyc_output/) and verbose npm/yarn/pnpm debug logs.",
    tokenSavings: 15,
    tokenLabel: "~15k tokens",
    icon: Sliders,
  },
  {
    id: "ide",
    sectionKey: "ignoreIde",
    name: "IDE Configurations & OS Metadata",
    desc: "Strips .idea/, .vscode/, editor swap files, .DS_Store, and Windows Thumbs.db files.",
    tokenSavings: 5,
    tokenLabel: "~5k tokens",
    icon: FolderGit2,
  },
  {
    id: "database",
    sectionKey: "ignoreDatabase",
    name: "Database Dumps & Local Storage",
    desc: "Guards raw database dumps (*.sql, *.dump), SQLite database files, and journal files (*.db, *.db-wal).",
    tokenSavings: 30,
    tokenLabel: "~30k tokens",
    isSecret: true,
    icon: Database,
  },
  {
    id: "fixtures",
    sectionKey: "ignoreFixtures",
    name: "Test Fixtures & Heavy Snapshots",
    desc: "Skips bloated mock JSON payloads, large test fixture folders, and verbose test snapshots.",
    tokenSavings: 20,
    tokenLabel: "~20k tokens",
    icon: CheckCircle2,
  },
];

export interface IgnoreShieldSuiteProps {
  format: OutputFormat;
  ignoreCategories: string[];
  ignorePreset: IgnoreProfile;
  customIgnoreRules: string;
  setCustomIgnoreRules: (value: string) => void;
  handleToggleCategory: (categoryId: string) => void;
  handleSelectIgnoreProfile: (profile: IgnoreProfile) => void;
  requestSectionScroll: (fieldKey?: string) => void;
  setActiveFieldKey: (fieldKey: string | null) => void;
  setIsManuallyEdited: (next: boolean) => void;
}

/** Dedicated Ignore Shield & Indexing Boundary suite for .cursorignore / .claudeignore (ADR-012): protection profiles, impact HUD, category toggles, and custom negate rules. */
export function IgnoreShieldSuite({
  format,
  ignoreCategories,
  ignorePreset,
  customIgnoreRules,
  setCustomIgnoreRules,
  handleToggleCategory,
  handleSelectIgnoreProfile,
  requestSectionScroll,
  setActiveFieldKey,
  setIsManuallyEdited,
}: IgnoreShieldSuiteProps) {
  const estimatedTokensSaved = useMemo(() => {
    return IGNORE_CATEGORY_LIST.reduce((acc, cat) => {
      return ignoreCategories.includes(cat.id) ? acc + cat.tokenSavings : acc;
    }, 0);
  }, [ignoreCategories]);

  const activeSecretMasks = useMemo(() => {
    return IGNORE_CATEGORY_LIST.filter((cat) => cat.isSecret && ignoreCategories.includes(cat.id)).length;
  }, [ignoreCategories]);

  return (
    <div className="space-y-4">
      {/* Card 1: Shield Protection Profile & Overview */}
      <div data-section="ignoreProfile" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900">
              {format === "cursorignore" ? ".cursorignore Shield" : ".claudeignore Shield"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleSelectIgnoreProfile("full_shield");
                setCustomIgnoreRules("");
                setIsManuallyEdited(false);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors font-mono cursor-pointer"
              title="Reset to preset default"
            >
              Reset
            </button>
            <InfoTooltip
              title={format === "cursorignore" ? ".cursorignore Shield" : ".claudeignore Shield"}
              description={
                format === "cursorignore"
                  ? "Controls what files Cursor's AI model indexes into its vector database and prompt context. Placed in repository root."
                  : "Controls what files Claude Code CLI scans when exploring repository directories. Placed in repository root."
              }
              example=".env*\nnode_modules/\n*.lock\ncoverage/"
              align="right"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          {format === "cursorignore"
            ? "Prevent Cursor AI from indexing secrets, build caches, and bulky lockfiles to save context window tokens:"
            : "Define boundary exclusions for Claude Code CLI to guard credentials and reduce prompt bloat:"}
        </p>

        {/* Profile Selector Buttons in orange theme */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700">Shield Protection Profile</label>
            <span className="text-[10px] text-zinc-400 font-mono">
              {ignorePreset === "full_shield"
                ? "Full Protection"
                : ignorePreset === "security_only"
                ? "Security Focused"
                : ignorePreset === "max_token_saver"
                ? "Token Saver"
                : "Custom Selection"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSelectIgnoreProfile("full_shield")}
              className={cn(
                "p-2 sm:px-3 sm:py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5 cursor-pointer min-w-0",
                ignorePreset === "full_shield"
                  ? "border-orange-500 bg-orange-50/60 text-orange-950 font-semibold ring-1 ring-orange-500/20"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className={cn("w-3.5 h-3.5 shrink-0", ignorePreset === "full_shield" ? "text-orange-600" : "text-zinc-400")} />
                <span className="truncate text-xs font-semibold">Full Shield</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-normal truncate">All 8 categories</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectIgnoreProfile("security_only")}
              className={cn(
                "p-2 sm:px-3 sm:py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5 cursor-pointer min-w-0",
                ignorePreset === "security_only"
                  ? "border-orange-500 bg-orange-50/60 text-orange-950 font-semibold ring-1 ring-orange-500/20"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Lock className={cn("w-3.5 h-3.5 shrink-0", ignorePreset === "security_only" ? "text-orange-600" : "text-zinc-400")} />
                <span className="truncate text-xs font-semibold">Security Only</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-normal truncate">Secrets &amp; DB leaks</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectIgnoreProfile("max_token_saver")}
              className={cn(
                "p-2 sm:px-3 sm:py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5 cursor-pointer min-w-0",
                ignorePreset === "max_token_saver"
                  ? "border-orange-500 bg-orange-50/60 text-orange-950 font-semibold ring-1 ring-orange-500/20"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Package className={cn("w-3.5 h-3.5 shrink-0", ignorePreset === "max_token_saver" ? "text-orange-600" : "text-zinc-400")} />
                <span className="truncate text-xs font-semibold">Max Token Saver</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-normal truncate">Deps, build &amp; media</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectIgnoreProfile("custom")}
              className={cn(
                "p-2 sm:px-3 sm:py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5 cursor-pointer min-w-0",
                ignorePreset === "custom"
                  ? "border-orange-500 bg-orange-50/60 text-orange-950 font-semibold ring-1 ring-orange-500/20"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders className={cn("w-3.5 h-3.5 shrink-0", ignorePreset === "custom" ? "text-orange-600" : "text-zinc-400")} />
                <span className="truncate text-xs font-semibold">Custom</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-normal truncate">Manual rules</span>
            </button>
          </div>
        </div>

        {/* Impact Summary HUD in warm orange theme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-orange-50/30 border border-orange-200/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-orange-100/80 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-orange-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-zinc-500 leading-tight truncate">Tokens Saved / Turn</div>
              <div className="text-xs font-bold text-zinc-900 tracking-tight truncate">~{estimatedTokensSaved}k tokens</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-orange-100/80 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-orange-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-zinc-500 leading-tight truncate">Secret Leak Guards</div>
              <div className="text-xs font-bold text-zinc-900 tracking-tight truncate">{activeSecretMasks} Active Guards</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-orange-100/80 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4 text-orange-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-zinc-500 leading-tight truncate">Shield Categories</div>
              <div className="text-xs font-bold text-zinc-900 tracking-tight truncate">
                {ignoreCategories.length} of {IGNORE_CATEGORY_LIST.length} Enabled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Indexing Boundary Categories — Exact fashion and orange theme as other tweak cards */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="w-4 h-4 text-orange-600 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 truncate">Indexing Boundary Categories</h3>
            <InfoTooltip
              title="Indexing Boundary Categories"
              description="Select specific categories of files to shield from AI context. Click any card to toggle and highlight its section in the editor."
              example="Secrets, Lockfiles, Build Outputs, Media"
              align="left"
            />
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0 hidden sm:inline">Select active exclusions</span>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Toggle specific categories to mask secrets and exclude heavy artifacts:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {IGNORE_CATEGORY_LIST.map((cat) => {
            const isSelected = ignoreCategories.includes(cat.id);
            return (
              <label
                key={cat.id}
                data-section={cat.sectionKey}
                className={cn(
                  "p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 select-none",
                  isSelected
                    ? "border-orange-200 bg-orange-50/40 text-zinc-900 shadow-2xs"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50/60"
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  // Toggle on the input, not the label: a label click is re-dispatched to its input, so a label
                  // onClick fired twice per click and the category flipped back immediately
                  onChange={() => {
                    handleToggleCategory(cat.id);
                    requestSectionScroll(cat.sectionKey);
                  }}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-300 accent-orange-600 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center justify-between gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-zinc-900 leading-snug break-words">{cat.name}</span>
                    <span
                      className={cn(
                        "text-[10px] sm:text-[11px] font-medium leading-none px-2 py-0.5 rounded-full border shrink-0 tracking-tight whitespace-nowrap mt-0.5 sm:mt-0",
                        isSelected
                          ? "bg-orange-100 text-orange-800 border-orange-200/80 font-semibold"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200"
                      )}
                    >
                      {cat.tokenLabel}
                    </span>
                  </div>
                  <span className="text-xs leading-relaxed text-zinc-500 block break-words">{cat.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Card 3: Custom Project Rules & Negate Exceptions */}
      <div
        data-section="customIgnoreRules"
        className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-orange-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">Custom Rules &amp; Negate Exceptions</h3>
            <InfoTooltip
              title="Custom Ignore Rules & Negations"
              description="Add custom paths or globs to ignore, or prefix with '!' to re-include files that were excluded by broader category rules (e.g. '!packages/schema/types.d.ts')."
              example="!dist/types.d.ts\nscratch/\n*.tmp"
              align="left"
            />
          </div>
          {customIgnoreRules.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCustomIgnoreRules("");
                setIsManuallyEdited(false);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors font-mono cursor-pointer shrink-0"
              title="Clear custom rules"
            >
              Clear
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Append repo-specific file globs or re-include allowed files with negation patterns (<code className="font-mono text-zinc-700">!path</code>):
        </p>

        <textarea
          value={customIgnoreRules}
          onFocus={() => {
            setActiveFieldKey("customIgnoreRules");
            requestSectionScroll("customIgnoreRules");
          }}
          onChange={(e) => {
            setCustomIgnoreRules(e.target.value);
            setActiveFieldKey("customIgnoreRules");
            setIsManuallyEdited(false);
          }}
          rows={4}
          placeholder={`# Custom project rules\nprivate/\ninternal-docs/\n!public/logo.svg`}
          className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
        />
      </div>
    </div>
  );
}
