"use client";

import React from "react";
import { AlertTriangle, Cpu, Lock, Terminal, Unlock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./InfoTooltip";
import type { TriggerValidationResult } from "../lib/slugUtils";

/** Suggested trigger chips offered below the active chip list */
const PRESET_TRIGGER_TAGS = [
  "api-routes",
  "database-schema",
  "react-components",
  "unit-tests",
  "security-audit",
  "refactoring",
  "auth-flow",
  "orm-prisma",
  "state-management",
];

export interface IdentityActivationCardProps {
  skillName: string;
  skillTitle: string;
  description: string;
  role: string;
  isSlugLocked: boolean;
  triggerTags: string[];
  triggerValidation: TriggerValidationResult;
  newTagInput: string;
  setNewTagInput: (value: string) => void;
  setDescription: (value: string) => void;
  setRole: (value: string) => void;
  handleSlugChange: (rawSlug: string) => void;
  handleTitleChange: (newTitle: string) => void;
  toggleSlugLock: () => void;
  handleAddTag: (tagToAdd: string) => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleFixBroadTriggers: () => void;
  synthesizeFromContext: () => void;
  setActiveFieldKey: (fieldKey: string | null) => void;
  setIsManuallyEdited: (next: boolean) => void;
}

/** Identity & Activation Rules card: skill identifier and title, trigger chips with heuristic validation, activation description, and agent role. */
export function IdentityActivationCard({
  skillName,
  skillTitle,
  description,
  role,
  isSlugLocked,
  triggerTags,
  triggerValidation,
  newTagInput,
  setNewTagInput,
  setDescription,
  setRole,
  handleSlugChange,
  handleTitleChange,
  toggleSlugLock,
  handleAddTag,
  handleRemoveTag,
  handleFixBroadTriggers,
  synthesizeFromContext,
  setActiveFieldKey,
  setIsManuallyEdited,
}: IdentityActivationCardProps) {
  return (
    <div data-section="identity" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Identity & Activation Rules</h3>
        </div>
        <button
          suppressHydrationWarning
          type="button"
          onClick={synthesizeFromContext}
          className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/90 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-xs w-full sm:w-auto shrink-0 cursor-pointer"
          title="Synthesizes triggers, procedures, and directives from all 12 current form fields and stack context"
        >
          <Cpu className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>Synthesize from Context</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div data-section="skillName" className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Skill Identifier (Kebab Case)</label>
              <InfoTooltip
                title="Skill Identifier"
                description="URL-friendly kebab-case slug used for directory or rule naming (e.g. codebase-auditor). Click Auto-sync/Locked to toggle syncing with the Display Title."
                example="codebase-auditor"
                align="left"
              />
            </div>
            <button
              type="button"
              onClick={toggleSlugLock}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-100"
              title={
                isSlugLocked
                  ? "Identifier is locked from auto-syncing with Display Title. Click to unlock."
                  : "Identifier is auto-syncing with Display Title. Click to lock."
              }
            >
              {isSlugLocked ? (
                <>
                  <Lock className="w-3 h-3 text-orange-600" />
                  <span className="text-orange-700 font-semibold">Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-zinc-500" />
                  <span>Auto-sync</span>
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            value={skillName}
            onFocus={() => setActiveFieldKey("skillName")}
            onChange={(e) => {
              handleSlugChange(e.target.value);
              setActiveFieldKey("skillName");
              setIsManuallyEdited(false);
            }}
            placeholder="e.g. codebase-auditor"
            className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div data-section="skillTitle" className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Display Title</label>
            <InfoTooltip
              title="Display Title"
              description="Human-readable title displayed in rule catalogs, tab headers, and exported documentation."
              example="Codebase Health & Security Auditor"
              align="right"
            />
          </div>
          <input
            type="text"
            value={skillTitle}
            onFocus={() => setActiveFieldKey("skillTitle")}
            onChange={(e) => {
              handleTitleChange(e.target.value);
              setActiveFieldKey("skillTitle");
              setIsManuallyEdited(false);
            }}
            placeholder="e.g. Codebase Health & Security Auditor"
            className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Interactive Trigger Tag Chips & Heuristic Validation */}
      <div data-section="triggers" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Interactive Activation Trigger Chips</label>
            <InfoTooltip
              title="Activation Trigger Chips"
              description="Keywords and intent tags that activate this skill or rule. Type a keyword and press Enter or select suggested chips below."
              example="audit, security, review, lint"
              align="left"
            />
            <span className="text-[10px] bg-orange-100 text-orange-800 font-mono px-1.5 py-0.5 rounded font-medium leading-none">
              {triggerTags.length} chips
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">Scoped domain keywords evaluated in real time</span>
        </div>

        {/* Active Chips List */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg min-h-[42px]">
          {triggerTags.map((tag) => {
            const isBroad = triggerValidation.broadTags?.includes(tag);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all animate-in fade-in zoom-in-95 duration-100",
                  isBroad
                    ? "bg-amber-100/90 text-amber-900 border-amber-300 font-semibold shadow-2xs"
                    : "bg-white text-zinc-800 border-zinc-300 shadow-2xs"
                )}
              >
                {isBroad && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-zinc-500 hover:text-zinc-900 rounded p-0.5 transition-colors cursor-pointer"
                  title={`Remove tag '${tag}'`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* Add Custom Tag Input */}
          <div className="flex items-center gap-1 ml-auto">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              placeholder="+ Add tag..."
              className="px-2 py-1 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono w-24 sm:w-32 bg-white"
            />
            {newTagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-500 cursor-pointer shadow-2xs"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Quick-Add Preset Tag Chips Suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Suggested Chips:</span>
          {PRESET_TRIGGER_TAGS.map((presetTag) => {
            const isAdded = triggerTags.includes(presetTag);
            return (
              <button
                key={presetTag}
                type="button"
                onClick={() => (isAdded ? handleRemoveTag(presetTag) : handleAddTag(presetTag))}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-all font-mono cursor-pointer",
                  isAdded
                    ? "bg-zinc-800 text-white border-zinc-700 font-semibold"
                    : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                )}
              >
                {isAdded ? `✓ ${presetTag}` : `+ ${presetTag}`}
              </button>
            );
          })}
        </div>

        {/* Detailed Activation Description */}
        <div data-section="description" className="space-y-1 pt-1">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Activation Description &amp; Conditions</label>
            <InfoTooltip
              title="Activation Description"
              description="Plain-English instructions telling Claude Code or Cursor exactly when this skill or rule should be invoked."
              example="Use when analyzing codebase security, evaluating vulnerabilities, or running pre-commit audits."
              align="left"
            />
          </div>
          <textarea
            value={description}
            onFocus={() => setActiveFieldKey("description")}
            onChange={(e) => { setDescription(e.target.value); setActiveFieldKey("description"); }}
            rows={3}
            placeholder="When should the AI activate this skill? (e.g., progressive disclosure condition for Claude Code or file globs for Cursor .mdc rules)..."
            className="w-full p-3 border border-zinc-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[90px] resize-y"
          />
        </div>

        {/* Real-time Heuristic Warning & Auto-Fix Banner */}
        {(!triggerValidation.isValid || triggerValidation.severity) && (
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs leading-relaxed transition-all",
              triggerValidation.severity === "warning" || !triggerValidation.isValid
                ? "bg-amber-50/80 border-amber-200/90 text-amber-900"
                : "bg-blue-50/80 border-blue-200/90 text-blue-900"
            )}
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle
                className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  triggerValidation.severity === "warning" || !triggerValidation.isValid
                    ? "text-amber-600"
                    : "text-blue-600"
                )}
              />
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-[11px]">{triggerValidation.message}</p>
                {triggerValidation.recommendation && (
                  <p className="text-[10px] text-zinc-600">
                    <span className="font-semibold text-zinc-700">Tip: </span>
                    {triggerValidation.recommendation}
                  </p>
                )}
              </div>
            </div>

            {(triggerValidation.broadTags?.length || triggerValidation.matches?.length) ? (
              <button
                type="button"
                onClick={handleFixBroadTriggers}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-amber-900 hover:bg-amber-800 text-white rounded-md text-[10px] font-mono font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
                title="Refine broad tags into domain-specific chips"
              >
                ⚡ Refine Triggers
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div data-section="role" className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Agent Persona / Role</label>
          <InfoTooltip
            title="Agent Persona & Role"
            description="Defines the AI agent's mindset, seniority, and technical specialization when executing this skill."
            example="Senior Security & Systems Auditor specializing in zero-trust architecture"
            align="left"
          />
        </div>
        <input
          type="text"
          value={role}
          onFocus={() => setActiveFieldKey("role")}
          onChange={(e) => { setRole(e.target.value); setActiveFieldKey("role"); setIsManuallyEdited(false); }}
          placeholder="e.g. Senior Security & Systems Auditor"
          className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </div>
    </div>
  );
}
