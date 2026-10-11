"use client";

import React from "react";
import { BookOpen, Check, FileText, Layers, Lock, Settings2, ShieldCheck, Sliders, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./InfoTooltip";
import { BEHAVIOR_OPTIONS, CONVENTION_OPTIONS, PHILOSOPHIES, SECURITY_BASELINE, type SkillPreset } from "../lib/ruleGenerator";

type Philosophy = SkillPreset["philosophy"];

/** White Marker wiring shared by the standard skill form cards */
interface FieldMarkerProps {
  setActiveFieldKey: (fieldKey: string | null) => void;
  setIsManuallyEdited: (next: boolean) => void;
}

// Toggle checkbox helper
const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
  setList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
};

export interface TechStackCardProps extends FieldMarkerProps {
  framework: string;
  language: string;
  styling: string;
  database: string;
  setFramework: (value: string) => void;
  setLanguage: (value: string) => void;
  setStyling: (value: string) => void;
  setDatabase: (value: string) => void;
  setIsConverterModalOpen: (open: boolean) => void;
  setIsManifestModalOpen: (open: boolean) => void;
}

/** Technology Stack Context card: framework, language, styling and database inputs, with legacy-rule conversion and manifest auto-detect entry points. */
export function TechStackCard({
  framework,
  language,
  styling,
  database,
  setFramework,
  setLanguage,
  setStyling,
  setDatabase,
  setIsConverterModalOpen,
  setIsManifestModalOpen,
  setActiveFieldKey,
  setIsManuallyEdited,
}: TechStackCardProps) {
  return (
    <div data-section="techStack" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Technology Stack Context</h3>
          <InfoTooltip
            title="Technology Stack Context"
            description="Specifies your project's framework, language, UI library, and database so the AI writes syntactically accurate, modern idiomatic code."
            example="Framework: Next.js 15 | Language: TypeScript | UI: Tailwind CSS"
            align="left"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsConverterModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-700 hover:text-orange-700 bg-zinc-100 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer min-h-[32px]"
            title="Reverse-convert existing .cursorrules, CLAUDE.md, or custom prompts into Universal Studio IR"
          >
            <FileText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Convert Legacy Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setIsManifestModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-700 hover:text-orange-700 bg-zinc-100 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer min-h-[32px]"
            title="Auto-detect stack from package.json, pyproject.toml, Cargo.toml, or go.mod"
          >
            <UploadCloud className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Auto-Detect</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600">Framework</label>
          <input
            type="text"
            value={framework}
            onFocus={() => setActiveFieldKey("techStack")}
            onChange={(e) => { setFramework(e.target.value); setActiveFieldKey("techStack"); setIsManuallyEdited(false); }}
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600">Language</label>
          <input
            type="text"
            value={language}
            onFocus={() => setActiveFieldKey("techStack")}
            onChange={(e) => { setLanguage(e.target.value); setActiveFieldKey("techStack"); setIsManuallyEdited(false); }}
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600">Styling / UI</label>
          <input
            type="text"
            value={styling}
            onFocus={() => setActiveFieldKey("techStack")}
            onChange={(e) => { setStyling(e.target.value); setActiveFieldKey("techStack"); setIsManuallyEdited(false); }}
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-600">Database / API</label>
          <input
            type="text"
            value={database}
            onFocus={() => setActiveFieldKey("techStack")}
            onChange={(e) => { setDatabase(e.target.value); setActiveFieldKey("techStack"); setIsManuallyEdited(false); }}
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>
    </div>
  );
}

export interface PhilosophyCardProps extends FieldMarkerProps {
  philosophy: Philosophy;
  setPhilosophy: (value: Philosophy) => void;
}

/** Engineering Philosophy card: one selectable tile per philosophy. */
export function PhilosophyCard({ philosophy, setPhilosophy, setActiveFieldKey, setIsManuallyEdited }: PhilosophyCardProps) {
  return (
    <div data-section="techStack" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-1">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Engineering Philosophy</h3>
          <InfoTooltip
            title="Engineering Philosophy"
            description="Select the architectural mindset your agent should prioritize: Pragmatic MVP, Strict Correctness, Performance First, or Production Hardened."
            align="left"
          />
        </div>
        <span className="text-[11px] text-zinc-500">Flexible & Adaptable</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PHILOSOPHIES.map((p) => {
          const isSelected = philosophy === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setPhilosophy(p.id as Philosophy); setActiveFieldKey("philosophy"); setIsManuallyEdited(false); }}
              className={cn(
                "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer",
                isSelected
                  ? "border-orange-300 bg-orange-50/50 text-zinc-900 ring-1 ring-orange-500/15 shadow-xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 text-zinc-700"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">{p.title}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
              </div>
              <p className="text-xs leading-relaxed text-zinc-500 font-normal">{p.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface ConventionsCardProps extends FieldMarkerProps {
  conventions: string[];
  setConventions: React.Dispatch<React.SetStateAction<string[]>>;
}

/** Architectural & Code Quality Conventions card: checkbox tiles over CONVENTION_OPTIONS. */
export function ConventionsCard({ conventions, setConventions, setActiveFieldKey, setIsManuallyEdited }: ConventionsCardProps) {
  return (
    <div data-section="conventions" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-1">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Architectural & Code Quality Conventions</h3>
          <InfoTooltip
            title="Architectural Conventions"
            description="Select best-practice conventions such as strict typing, single-responsibility functions, and schema validation."
            align="left"
          />
        </div>
        <span className="text-[11px] text-zinc-500">Less rigid & configurable</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CONVENTION_OPTIONS.map((opt) => {
          const isChecked = conventions.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={cn(
                "p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 select-none",
                isChecked ? "border-orange-200 bg-orange-50/40 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50/60"
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  toggleItem(conventions, setConventions, opt.id);
                  setActiveFieldKey("conventions");
                  setIsManuallyEdited(false);
                }}
                className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-300 accent-orange-600 cursor-pointer shrink-0"
              />
              <div>
                <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export interface BehaviorGuardrailsCardProps extends FieldMarkerProps {
  behaviors: string[];
  setBehaviors: React.Dispatch<React.SetStateAction<string[]>>;
}

/** Agent Behavioral Guardrails card: checkbox tiles over BEHAVIOR_OPTIONS, plus the always-on SECURITY_BASELINE strip. */
export function BehaviorGuardrailsCard({ behaviors, setBehaviors, setActiveFieldKey, setIsManuallyEdited }: BehaviorGuardrailsCardProps) {
  return (
    <div data-section="behaviors" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Agent Behavioral Guardrails</h3>
          <InfoTooltip
            title="Agent Behavioral Guardrails"
            description="Select active rules that prevent destructive behaviors (e.g., silent failures, sweeping refactors, missing tests)."
            align="left"
          />
        </div>
        <span className="text-[11px] text-zinc-500">Select active rules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BEHAVIOR_OPTIONS.map((opt) => {
          const isChecked = behaviors.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={cn(
                "p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 select-none",
                isChecked ? "border-orange-200 bg-orange-50/40 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50/60"
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  toggleItem(behaviors, setBehaviors, opt.id);
                  setActiveFieldKey("behaviors");
                  setIsManuallyEdited(false);
                }}
                className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-300 accent-orange-600 cursor-pointer shrink-0"
              />
              <div>
                <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="text-xs font-semibold text-zinc-800">Security &amp; Trust Boundaries</span>
          <InfoTooltip
            title="Security & Trust Boundaries"
            description="Emitted in every generated rule file: embedded or encoded instructions are treated as data, file access is scoped, irreversible actions need confirmation, and secrets are masked."
            align="left"
          />
          <span className="ml-auto text-[11px] text-zinc-500">Always included</span>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {SECURITY_BASELINE.map((rule) => (
            <li
              key={rule.label}
              title={rule.desc}
              className="text-[11px] leading-none px-2 py-1 rounded-full border border-zinc-200 bg-white text-zinc-700 cursor-help"
            >
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export interface ProceduresCardProps extends FieldMarkerProps {
  procedures: string;
  setProcedures: (value: string) => void;
  customDirectives: string;
  setCustomDirectives: (value: string) => void;
}

/** Step-by-Step Workflow Procedures card, including the Custom Directives & Forbidden Patterns textarea. */
export function ProceduresCard({
  procedures,
  setProcedures,
  customDirectives,
  setCustomDirectives,
  setActiveFieldKey,
  setIsManuallyEdited,
}: ProceduresCardProps) {
  return (
    <div data-section="procedures" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-700 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900">Step-by-Step Workflow Procedures</h3>
          <InfoTooltip
            title="Step-by-Step Procedures"
            description="Numbered, deterministic steps the AI agent must follow when invoked. Keep steps actionable and test-driven."
            example="1. Ingest context\n2. Trace execution\n3. Execute changes\n4. Run tests"
            align="left"
          />
        </div>
      </div>

      <textarea
        value={procedures}
        onFocus={() => setActiveFieldKey("procedures")}
        onChange={(e) => { setProcedures(e.target.value); setActiveFieldKey("procedures"); setIsManuallyEdited(false); }}
        rows={8}
        placeholder="1. Read context... 2. Trace execution..."
        className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[195px] resize-y"
      />

      <div data-section="customDirectives" className="pt-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-xs font-semibold text-zinc-700 block">
            Custom Directives &amp; Forbidden Patterns
          </label>
          <InfoTooltip
            title="Custom Directives & Forbidden Patterns"
            description="Hard constraints and forbidden patterns specific to your repository (e.g. 'Never use eval', 'Always use server actions')."
            example="- Never use any or eval\n- Always validate request payloads with Zod"
            align="left"
          />
        </div>
        <textarea
          value={customDirectives}
          onFocus={() => setActiveFieldKey("customDirectives")}
          onChange={(e) => { setCustomDirectives(e.target.value); setActiveFieldKey("customDirectives"); setIsManuallyEdited(false); }}
          rows={5}
          placeholder="- Never use eval or dangerous innerHTML..."
          className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-h-[125px] resize-y"
        />
      </div>
    </div>
  );
}
