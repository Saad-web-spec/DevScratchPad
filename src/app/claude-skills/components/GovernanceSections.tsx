"use client";

import React from "react";
import { AlertCircle, AlertTriangle, BookOpen, CheckCircle2, Cpu, FileText, Layers, Settings2, ShieldCheck, Sliders, Terminal, Users, type LucideIcon } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import {
  getDefaultPrdValues,
  getDefaultDesignValues,
  getDefaultTaskValues,
  getDefaultMemoryValues,
  type SkillPreset,
} from "../lib/ruleGenerator";

export type GovernanceFormat = "prd_md" | "design_md" | "task_md" | "memory_md";

export type GovernanceFieldKey =
  | keyof ReturnType<typeof getDefaultPrdValues>
  | keyof ReturnType<typeof getDefaultDesignValues>
  | keyof ReturnType<typeof getDefaultTaskValues>
  | keyof ReturnType<typeof getDefaultMemoryValues>;

export type GovernanceValues = Record<GovernanceFieldKey, string>;

interface GovernanceSectionDef {
  key: GovernanceFieldKey;
  icon: LucideIcon;
  title: string;
  tooltip: { title: string; description: string; example: string };
  subtitle: string;
  rows: number;
  placeholder?: string;
  /** Monospace textarea (default true); prose fields like the PRD executive summary use sans */
  mono?: boolean;
}

interface GovernanceGroupDef {
  iconColor: string;
  getDefaults: (preset: SkillPreset) => Partial<GovernanceValues>;
  sections: GovernanceSectionDef[];
}

/**
 * Dedicated section cards for the governance formats (ADR-008). Each card maps 1:1 to a document section that
 * sectionLocator.ts can highlight via its `data-section` key; order matches the generated document order.
 */
export const GOVERNANCE_SECTIONS: Record<GovernanceFormat, GovernanceGroupDef> = {
  prd_md: {
    iconColor: "text-blue-600",
    getDefaults: getDefaultPrdValues,
    sections: [
      {
        // Executive Summary & Vision
        key: "prdOverview",
        icon: FileText,
        title: "1. Executive Summary & Vision",
        tooltip: {
          title: "Executive Summary & Vision",
          description: "Summarize what problem your product solves, target users, and key value propositions in 2-3 sentences. Supports markdown formatting.",
          example: "DevScratchpad is an offline-first developer workbench providing privacy-first tools and agent governance.",
        },
        subtitle: "High-level product vision, core value proposition, and executive scope:",
        rows: 3,
        placeholder: "Executive summary of the product...",
        mono: false,
      },
      {
        // Problem Statement
        key: "prdProblemStatement",
        icon: AlertCircle,
        title: "2. Problem Statement & Scope Boundaries",
        tooltip: {
          title: "Problem Statement & Scope",
          description: "List developer pain points, market differentiation, and explicit non-goals to keep agents strictly within scope boundaries.",
          example: "- Problem: Sensitive credentials leak to remote LLMs.\\n- Scope: 100% client-side execution only.\\n- Non-Goal: No remote user database.",
        },
        subtitle: "Engineering pain points, agent guardrails, and boundary definitions:",
        rows: 3,
        placeholder: "Specific problems this software addresses...",
      },
      {
        // User Personas
        key: "prdPersonas",
        icon: Users,
        title: "3. Target User Personas",
        tooltip: {
          title: "Target User Personas",
          description: "Define primary user roles, background, workflows, and success metrics in a markdown table or bullet list.",
          example: "| Persona | Role | Key Goal |\\n| :--- | :--- | :--- |\\n| Alex | Senior Eng | Mask sensitive tokens |",
        },
        subtitle: "Target user personas, job titles, and primary pain points (Markdown table format):",
        rows: 4,
        placeholder: "| Persona | Role | Primary Goal & Need |",
      },
      {
        // Functional Requirements
        key: "prdFunctionalReqs",
        icon: CheckCircle2,
        title: "4. Functional Requirements (FR)",
        tooltip: {
          title: "Functional Requirements",
          description: "List features using FR-1, FR-2 format with priority tags (P0/P1/P2) and expected behavior.",
          example: "### FR-1: Client-Side Hashing (P0)\\n- SHA-256 and Argon2id computed in-browser with zero network calls.",
        },
        subtitle: "Numbered functional capabilities, domain workflows, and system behaviors:",
        rows: 6,
        placeholder: "### Core Capabilities (FR-1 to FR-4)...",
      },
      {
        // Non-Functional Requirements
        key: "prdNonFunctionalReqs",
        icon: ShieldCheck,
        title: "5. Non-Functional SLAs & Privacy",
        tooltip: {
          title: "Non-Functional SLAs & Privacy",
          description: "Specify privacy constraints (zero-server transmission), latency targets, and browser memory limits.",
          example: "- Zero Server Transmission: No API accepts user payloads.\\n- Latency: Sub-50ms execution on local payloads.",
        },
        subtitle: "Performance SLAs, zero-server privacy constraints, and reliability standards:",
        rows: 4,
        placeholder: "- Performance: Sub-50ms overhead...",
      },
      {
        // Milestone Phasing
        key: "prdMilestones",
        icon: Layers,
        title: "6. Milestone Phasing & Roadmap",
        tooltip: {
          title: "Milestone Phasing & Roadmap",
          description: "Define sprint milestones and delivery phases using markdown checklists.",
          example: "### Milestone 1.0 (Core)\\n- [x] Baseline crypto suite\\n- [ ] Multi-file bundling",
        },
        subtitle: "Roadmap milestones, deliverables, and release phases (Markdown table format):",
        rows: 4,
        placeholder: "| Milestone | Phase | Key Deliverables |",
      },
    ],
  },
  design_md: {
    iconColor: "text-indigo-600",
    getDefaults: getDefaultDesignValues,
    sections: [
      {
        // Design Tokens & Palette
        key: "designTokens",
        icon: Layers,
        title: "1. Visual Language & Semantic Tokens",
        tooltip: {
          title: "Visual Language & Tokens",
          description: "Define hex color tokens, background surfaces, font families, and border radiuses.",
          example: "- Canvas: Pitch black (#09090B)\\n- Surface: Elevated dark (#18181B)\\n- Typography: Monospace for data, Sans for labels",
        },
        subtitle: "Pitch-black canvas palette, elevated surfaces, border tokens, and monospace metrics:",
        rows: 5,
      },
      {
        // Single-Canvas Layout
        key: "designLayout",
        icon: Sliders,
        title: "2. Component Hierarchy & Single-Canvas Layout",
        tooltip: {
          title: "Single-Canvas Layout",
          description: "Specify layout rules (single canvas, no nested card-in-card containers, mobile touch targets).",
          example: "- Single-Canvas: Keep UI depth to a single clean layer.\\n- Touch Targets: Minimum 44x44px for interactive elements.",
        },
        subtitle: "Single-canvas layout rules, anti-nested card invariant, and mobile touch targets:",
        rows: 4,
      },
      {
        // Conventions
        key: "designConventions",
        icon: Settings2,
        title: "3. Core Architectural & UI Conventions",
        tooltip: {
          title: "Architectural & UI Conventions",
          description: "List component contracts, decoupled presentation rules, and controlled state rules.",
          example: "- Decouple UI components strictly from state mutation.\\n- Controlled components with explicit TypeScript prop types.",
        },
        subtitle: "Component decoupling, controlled state contracts, and styling conventions:",
        rows: 4,
      },
      {
        // Negative Guardrails
        key: "designGuardrails",
        icon: AlertTriangle,
        title: "4. Negative Design Guardrails",
        tooltip: {
          title: "Negative Design Guardrails",
          description: "Define explicit forbidden UI anti-patterns (no arbitrary margins, no inline styles, no card nesting).",
          example: "- Never introduce nested card-in-card containers.\\n- Never apply arbitrary inline styles.\\n- Never break mobile responsiveness.",
        },
        subtitle: "Forbidden UI anti-patterns (nested cards, arbitrary margin offsets, non-standard CSS):",
        rows: 4,
      },
      {
        // StitchMCP & Design Verification
        key: "designVerification",
        icon: CheckCircle2,
        title: "5. StitchMCP Compatibility & Design QA Gate",
        tooltip: {
          title: "StitchMCP & Design QA Gate",
          description: "Write verification commands and visual QA checks (contrast ratios, mobile breakpoints).",
          example: "1. Check contrast ratios and accessibility.\\n2. Verify responsive layout on mobile and desktop.\\n3. Ensure zero visual regressions.",
        },
        subtitle: "StitchMCP schema integration, accessibility contrast, and visual QA checklist:",
        rows: 4,
      },
    ],
  },
  task_md: {
    iconColor: "text-emerald-600",
    getDefaults: getDefaultTaskValues,
    sections: [
      {
        // Sprint Status Dashboard
        key: "taskDashboard",
        icon: CheckCircle2,
        title: "1. Sprint Dashboard & Active Milestone",
        tooltip: {
          title: "Sprint Dashboard & Milestone",
          description: "Update active milestone name, completion percentages, and sprint status summary.",
          example: "- Milestone 1.0 (Foundation): [x] 100% Completed\\n- Milestone 2.0 (Features): [/] In Progress\\n- Milestone 3.0 (Hardening): [ ] Planned",
        },
        subtitle: "Current milestone, sprint objective, target version, and overall progress:",
        rows: 3,
      },
      {
        // Active Phase Checklists
        key: "taskPhases",
        icon: Terminal,
        title: "2. Active Sprint Task Checklists",
        tooltip: {
          title: "Active Sprint Task Checklists",
          description: "Add or check off sprint tasks using markdown checkboxes: - [x] done, - [/] in progress, - [ ] planned.",
          example: "### Phase 2: Active Tasks\\n- [x] Schema validation layer\\n- [/] Live reactivity sync\\n- [ ] E2E smoke tests",
        },
        subtitle: "Manage Phase 1 Foundation, Phase 2 Active Tasks, and Phase 3 Quality checklists (- [ ] / - [x]):",
        rows: 8,
      },
      {
        // Verification Commands & Quality Gates
        key: "taskVerification",
        icon: ShieldCheck,
        title: "3. Verification Commands & Quality Gates",
        tooltip: {
          title: "Verification Commands & Quality Gates",
          description: "Specify shell verification commands that agents must run before finishing (lint, test, build).",
          example: "```bash\\nnpm run validate-presets\\nnpm run lint\\nnpm run build\\n```",
        },
        subtitle: "Required verification shell commands that all agents and developers must execute to pass:",
        rows: 5,
      },
      {
        // Agent Session Audit Log
        key: "taskSessionLog",
        icon: FileText,
        title: "4. Autonomous Agent Session Audit Log",
        tooltip: {
          title: "Agent Session Audit Log",
          description: "Add markdown table rows recording agent actions, dates, and verification outcomes.",
          example: "| Date | Agent | Action | Result |\\n| :--- | :--- | :--- | :--- |\\n| 2026-09-20 | Lead Agent | Implemented dedicated sections | ✅ Exit 0 |",
        },
        subtitle: "Living chronological audit table documenting agent runs, dates, and verification outcomes:",
        rows: 4,
      },
      {
        // Sprint Directives
        key: "taskDirectives",
        icon: ShieldCheck,
        title: "5. Sprint Directives & Scope Constraints",
        tooltip: {
          title: "Sprint Directives & Scope Constraints",
          description: "Define sprint-specific constraints, architectural bounds, and scope directives for agents.",
          example: "- No external API dependencies.\\n- Keep diffs surgical and preserve comments.",
        },
        subtitle: "Project-specific sprint guardrails, non-negotiable scope limits, and execution boundaries:",
        rows: 3,
        placeholder: "- Critical SLA: Zero regression on build times...",
      },
    ],
  },
  memory_md: {
    iconColor: "text-amber-600",
    getDefaults: getDefaultMemoryValues,
    sections: [
      {
        // Technology Context Matrix
        key: "memoryContext",
        icon: Cpu,
        title: "1. Persistent Technology Context Matrix",
        tooltip: {
          title: "Technology Context Matrix",
          description: "Document frameworks, language versions, persistence layers, and core dependencies in a markdown table.",
          example: "| Attribute | Specification | Notes |\\n| :--- | :--- | :--- |\\n| Framework | Next.js 16.3.3 | App Router, SSG |",
        },
        subtitle: "Application framework, language invariants, persistence layer, and engineering philosophy:",
        rows: 4,
      },
      {
        // Architectural Decision Records (ADRs)
        key: "memoryAdrs",
        icon: BookOpen,
        title: "2. Architectural Decision Records (ADRs)",
        tooltip: {
          title: "Architectural Decision Records (ADRs)",
          description: "Document accepted decisions using: Status, Context, Decision, and Consequences.",
          example: "### ADR-001: Separation of Concerns\\n- Status: Accepted\\n- Context: Blending UI with state creates fragility.\\n- Decision: Decouple presentation from persistence.\\n- Consequences: Cleaner testing and reusability.",
        },
        subtitle: "Formal architectural decisions across context resets (Status, Context, Decision, Consequences):",
        rows: 6,
      },
      {
        // Operational Gotchas & Pitfalls
        key: "memoryGotchas",
        icon: AlertTriangle,
        title: "3. Operational Gotchas & Pitfalls",
        tooltip: {
          title: "Operational Gotchas & Pitfalls",
          description: "Add known traps and gotchas prefixed with ⚠️ to steer agents away from mistakes.",
          example: "- ⚠️ Monaco Editor requires dynamic import with ssr: false.\\n- ⚠️ Never run 'cd' commands in tool calls.",
        },
        subtitle: "Critical traps, edge cases, and hard-earned learnings that all agents must heed:",
        rows: 4,
      },
      {
        // 5-Step Agent Loop
        key: "memoryLoop",
        icon: Terminal,
        title: "4. 5-Step Agent Execution Loop Protocol",
        tooltip: {
          title: "5-Step Agent Execution Loop",
          description: "Define the agent operating procedure (Ingest → Plan → Execute → Verify → Update).",
          example: "1. INGEST   → Read MEMORY.md → PRD.md → DESIGN.md\\n2. PLAN     → Inspect TASK.md\\n3. EXECUTE  → Apply surgical diffs\\n4. VERIFY   → Run quality gates\\n5. UPDATE   → Log in TASK.md & MEMORY.md",
        },
        subtitle: "Standard agent execution loop (Ingest → Plan → Execute → Verify → Update):",
        rows: 5,
      },
      {
        // Domain Invariants & Anchors
        key: "memoryInvariants",
        icon: Layers,
        title: "5. Domain Invariants & Key File Anchors",
        tooltip: {
          title: "Domain Invariants & Anchors",
          description: "List key directories, system boundaries, and non-negotiable architectural invariants.",
          example: "- All utilities reside under src/lib/tools/.\\n- CLI lives in cli/bin/devscratchpad.mjs.",
        },
        subtitle: "System boundaries, core package directories, and project invariant constraints:",
        rows: 3,
        placeholder: "- Key directory anchors...",
      },
      {
        // Session History
        key: "memorySessionHistory",
        icon: FileText,
        title: "6. Session History",
        tooltip: {
          title: "Session History",
          description: "Append chronological changelog entries noting dates and key system modifications.",
          example: "- 2026-09-20: Initialized persistent memory bank and core ADRs.",
        },
        subtitle: "Chronological record of memory additions and changes over time:",
        rows: 3,
      },
    ],
  },
};

export function isGovernanceFormat(format: string): format is GovernanceFormat {
  return format in GOVERNANCE_SECTIONS;
}

interface GovernanceSectionsProps {
  format: GovernanceFormat;
  values: GovernanceValues;
  /** Preset whose defaults the per-section Reset button restores */
  preset: SkillPreset;
  /** Section value changed (typing or per-section Reset) */
  onChange: (key: GovernanceFieldKey, value: string) => void;
  /** Section became active for the editor White Marker (focus or typing; Reset does not move the highlight) */
  onFocusField: (key: GovernanceFieldKey) => void;
}

const MONO_TEXTAREA = "w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y";
const SANS_TEXTAREA = "w-full p-2.5 border border-zinc-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y";

export function GovernanceSections({ format, values, preset, onChange, onFocusField }: GovernanceSectionsProps) {
  const group = GOVERNANCE_SECTIONS[format];
  return (
    <div data-tour="governance" className="space-y-4">
      {group.sections.map((section) => {
        const Icon = section.icon;
        return (
          <div
            key={section.key}
            data-section={section.key}
            className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 ${group.iconColor} shrink-0`} />
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{section.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onChange(section.key, group.getDefaults(preset)[section.key] ?? "")}
                  className="text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors font-mono cursor-pointer"
                  title="Reset to preset default"
                >
                  Reset
                </button>
                <InfoTooltip
                  title={section.tooltip.title}
                  description={section.tooltip.description}
                  example={section.tooltip.example}
                  align="right"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{section.subtitle}</p>
            <textarea
              value={values[section.key]}
              onFocus={() => onFocusField(section.key)}
              onChange={(e) => {
                onChange(section.key, e.target.value);
                onFocusField(section.key);
              }}
              rows={section.rows}
              placeholder={section.placeholder}
              className={section.mono === false ? SANS_TEXTAREA : MONO_TEXTAREA}
            />
          </div>
        );
      })}
    </div>
  );
}
