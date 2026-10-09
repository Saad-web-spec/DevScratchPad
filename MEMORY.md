# DevScratchpad — Persistent Agent Memory

> **Purpose**: This file serves as the long-term memory for all AI coding agents operating in this repository. It captures critical context, architectural decisions, operational gotchas, and learned lessons that persist across sessions.
>
> **Last Updated**: 2026-09-20

---

## 1. Core Technology Context

| Component | Version | Notes |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.3 | App Router, SSG, Turbopack |
| **UI Runtime** | React 19.2.8 | Server Components by default |
| **Styling** | Tailwind CSS v4 | PostCSS-based, utility-first |
| **Editor** | Monaco Editor (via `@monaco-editor/react` ^4.7.0) | VS Code engine, dynamic import required |
| **Node.js** | v24.13.0 | Runtime for CLI and build |
| **Python** | 3.13.7 | Used for utility scripts only |
| **Package Manager** | npm | `package-lock.json` committed |
| **License** | BSL 1.1 | Source-available, commercial restrictions |
| **Deployment** | Vercel (Static Export / SSG) | Zero server-side rendering of user data |
| **PWA** | Serwist ^9.5.12 | Offline-capable service worker |

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: 100% Client-Side Architecture
- **Decision**: All developer utilities execute entirely in the browser sandbox. No API route ever accepts or transmits user-provided payload data.
- **Context**: The core value proposition is privacy-first operation. Users handle sensitive API keys, JWT tokens, environment secrets, and PII data. Server transmission would undermine trust.
- **Consequences**: The only API routes that exist (`/api/raw/[formatSlug]/[presetSlug]`) serve static preset content. All crypto, formatting, parsing, and conversion happens via Web Crypto API, pure JavaScript, or WASM.

### ADR-002: Single-Canvas Spatial Dark Theme
- **Decision**: The entire UI uses a single unified pitch-black canvas background (`#09090B`) with elevated surfaces (`#121215`) only for distinct functional regions.
- **Context**: Early iterations used nested card-in-card containers that created visual depth confusion and inconsistent borders.
- **Consequences**: No component may introduce a second level of card nesting. All tools follow the flat single-canvas layout documented in DESIGN.md.

### ADR-003: URL Hash State Sharing
- **Decision**: Workspace states are serialized into URL hash fragments (`#data=<LZ-compressed-base64>`) using `lz-string`, enabling sharing with zero server storage.
- **Context**: A traditional backend approach would require a database, user accounts, and API endpoints — directly contradicting the zero-server architecture.
- **Consequences**: Maximum shareable payload is limited by URL length (~8KB compressed). For larger payloads, users export via ZIP or copy-paste.

### ADR-004: Multi-Format Rule Synthesis from Centralized Registry
- **Decision**: A single `presetRegistry.ts` file defines all 14+ curated presets, and `ruleGenerator.ts` synthesizes output for 13 different target formats from the same source data.
- **Context**: Maintaining separate preset definitions per format would cause drift and inconsistency. A centralized registry ensures a single source of truth.
- **Consequences**: Adding a new format requires implementing a new generator function in `ruleGenerator.ts` and adding the format to the `OutputFormat` union type. Presets themselves remain format-agnostic.

### ADR-005: Business Source License 1.1 (BSL 1.1)
- **Decision**: Source code is publicly available under BSL 1.1, which permits personal, research, and educational use but restricts commercial hosting of competing services.
- **Context**: Prevents competitors from cloning and commercially hosting DevScratchpad without contributing back or licensing.
- **Consequences**: All contributors must be aware of the license terms. The LICENSE file at repository root is authoritative.

### ADR-006: Monaco Editor Dynamic Import
- **Decision**: Monaco Editor must always be imported via `next/dynamic` with `{ ssr: false }` option.
- **Context**: Monaco Editor's initialization code accesses browser-only APIs (`window`, `document`, `navigator`) that cause fatal errors during Next.js SSR/SSG build.
- **Consequences**: Every component that renders Monaco must use the dynamic import pattern. Direct static imports of `@monaco-editor/react` are forbidden.

### ADR-007: Tailwind CSS v4 PostCSS Configuration
- **Decision**: Tailwind CSS v4 is configured via `@tailwindcss/postcss` in `postcss.config.mjs`, not via the legacy `tailwind.config.js` approach.
- **Context**: Tailwind v4 moved to a CSS-first configuration model. Legacy config files are not used.
- **Consequences**: Theme customization uses CSS variables and Tailwind's new configuration syntax. Agents must not generate `tailwind.config.js` or `tailwind.config.ts` files.

### ADR-008: Format-Specific Dedicated Section Architecture
- **Decision**: AI Skill Studio replaces artificial append/tweak buttons with first-class, dedicated form section suites for every file format (`PRD.md`, `DESIGN.md`, `TASK.md`, `MEMORY.md`, and standard skill files).
- **Context**: Generic append buttons injected text only into generic directives without allowing direct customization of specific document sections (ADRs, Gotchas, Personas, Invariants).
- **Consequences**: Every document section has an explicit, full-width reactive textarea, descriptive headers, document section anchors (`§ 1..6`), and a single-click reset button. When editing governance documents or MCP servers, general skill inputs (Identity, Trigger Chips, Stack Context) are contextually hidden to eliminate visual clutter.

### ADR-009: Universal Contextual Info Tooltips & Guidance Popovers
- **Decision**: Replaced noisy colored section badges (`PRD.md § 1`, `DESIGN.md § 2`, etc.) with subtle, neutral circular info `(i)` tooltips (`InfoTooltip.tsx`). Added contextual help across governance, MCP, and standard skill cards.
- **Context**: Colored pill badges added visual noise and looked like action buttons or status indicators rather than subtle guidance. Developers needed clear, interactive, and immediate explanations on "how to edit" each section without cluttering the screen.
- **Consequences**: `InfoTooltip` provides accessible, keyboard-navigable (`Escape` key dismissal and outside click detection), responsive (left/right/center alignment) guidance popovers with concise descriptions and syntax examples.

### ADR-010: Dynamic URL History Synchronization & Dot-Route Aliasing
- **Decision**: In-studio format and preset selection updates the browser address bar in real-time using `window.history.pushState` and a `popstate` listener rather than full App Router transitions (`router.push`). File formats with dot extensions (`claude.md`, `prd.md`, `design.md`, `task.md`, `memory.md`, `agents.md`, `cursor.mdc`, `llms.txt`, `architecture.md`, `mcp.json`) are generated as first-class static export pages via `getAllFormatSlugsWithAliases()`, with `alternates.canonical` preserving search engine indexing.
- **Context**: Developers require direct deep-links like `/ai-skill-studio/claude.md` that reflect in the address bar without page reloads or unmounting the Monaco Editor and losing user input.
- **Consequences**: Zero editor state loss, 0ms tab switching latency, native browser Back/Forward navigation, zero duplicate content SEO penalty, and direct deep-link access to `/ai-skill-studio/claude.md` with the interactive studio mounted at the top.

### ADR-011: Client-Side Living Ingestion Engines (GitHub, SQL DDL, Local Filesystem)
- **Decision**: All repository introspection (GitHub REST v3 recursive git tree, raw manifests, commit conventions), database schema introspection (SQL DDL and Prisma models), and local filesystem configuration (Web File System Access API) execute 100% in the user's browser sandbox without any proxy or server transmission.
- **Context**: Static boilerplate presets are dead templates. Transforming presets into living, authentic project rules requires deep structural awareness of real codebases, databases, and local paths without violating ADR-001 (Zero Server Transmission).
- **Consequences**: Developers can ingest any public or private GitHub repository, inspect schemas, and pick local directories without security risks or token leaks. Manifests and git trees are parsed in milliseconds directly on the client, synthesizing tailored directives, procedures, and safety guardrails.

### ADR-012: Dedicated Ignore Shield & Indexing Boundary Architecture (.cursorignore & .claudeignore)
- **Decision**: Provide dedicated interactive boundary controls (8 specialized exclusion categories, 4 protection profiles: Full Shield, Security Only, Max Token Saver, Custom, real-time token savings and secret leak telemetry HUD, and custom negate exception textarea) exclusively when `.cursorignore` or `.claudeignore` is selected. Automatically suppress generic natural-language prompt cards (Persona, Triggers, Procedures, Guardrails) that have zero effect on ignore outputs.
- **Context**: Selecting `.cursorignore` or `.claudeignore` previously rendered generic prompt cards, which confused developers and provided no interface for controlling ignore patterns, token savings, or credentials masking.
- **Consequences**: Ignore formats now enjoy 100% reactive category synchronization with Monaco Editor via `sectionLocator.ts` `# ---` headers, White Marker highlighting, storage envelope persistence, and zero-server URL hash state sharing. Strict prohibition on lightning (`Zap`) icons in the ignore shield suite to preserve utilitarian security semantics.

---

## 3. Operational Gotchas & Known Constraints

### ⚠️ Next.js 16 Agent Rules Block
The `AGENTS.md` file contains a Next.js auto-generated block:
```
<!-- BEGIN:nextjs-agent-rules -->
...
<!-- END:nextjs-agent-rules -->
```
This block is **automatically regenerated** by `next dev` (via `node_modules/next/dist/server/lib/generate-agent-files.js`). **Never delete or modify it** — removing it from a diff only re-creates the uncommitted change. Commit it with your work to keep the tree clean.

### ⚠️ Browser Memory Limits
When processing very large files (>50MB), browser memory limits may be reached, especially during:
- Base64 encoding/decoding of large binaries
- SHA-512 hashing of multi-megabyte payloads
- Monaco Editor rendering of files with 10,000+ lines

Mitigation: Tools should show a warning for inputs exceeding safe thresholds and consider Web Worker offloading.

### ⚠️ LocalStorage Quota (5-10MB)
The FIFO workspace history buffer and tool state persistence use `localStorage`, which has a 5-10MB quota depending on the browser. The `storage.ts` module includes quota overflow protection, but agents must never bypass it with direct `localStorage.setItem()` calls.

### ⚠️ Build Command Uses Webpack Mode
The build command in `package.json` is `next build --webpack` (not Turbopack). This is intentional for production build stability. Development uses `next dev --webpack` as well. Agents should use these exact commands.

### ⚠️ Next.js `beforeFiles` Rewrites Shadow `redirects()`
Next.js processes `rewrites.beforeFiles` before `redirects()`. If a path pattern is declared in `beforeFiles`, Next.js internally rewrites it without issuing the intended HTTP 308 redirect header to web crawlers. For SEO canonicalization, handle redirect patterns via `redirects()` and never mirror them in `beforeFiles`.

### ⚠️ Governance Formats Are Format-Wide Singletons
Governance and project-level formats (`prd_md`, `design_md`, `task_md`, `memory_md`) describe entire repository frameworks, not individual framework presets. They do NOT have preset spoke pages. Any request to `/ai-skill-studio/<governance-format>/<preset>` must permanently redirect (HTTP 308) to the canonical hub `/ai-skill-studio/<governance-format>`.

### ⚠️ CLI Zero Dependencies
The CLI (`cli/bin/devscratchpad.mjs`) operates on zero npm dependencies — it uses only Node.js standard libraries (`node:fs`, `node:path`, `node:https`). Never add external package imports to CLI code.

### ⚠️ Preset Schema Validation
All community presets in `/community-presets/` must validate against `schemas/preset-schema.json`. Run `npm run validate-presets` before committing any preset changes.

### ⚠️ Preserving Architectural Copy on Spoke Pages
When adding live features, ingestion capabilities, or protocol enhancements to preset spoke pages (`[formatSlug]/[presetSlug]/page.tsx` and `ProgrammaticSpokeSeoContent.tsx`), never replace or genericize curated preset copy (`route.description` and `route.whyNeeded`). Retain the original architectural text as the primary foundation and append new feature context.

---

## 4. File Hierarchy & Key Paths

| File / Directory | Purpose |
| :--- | :--- |
| `src/app/claude-skills/lib/presetRegistry.ts` | Central preset definitions (2108 lines, 96KB) — the single source of truth for all curated presets |
| `src/app/claude-skills/lib/ruleGenerator.ts` | Multi-format rule synthesis engine (86KB) |
| `src/app/claude-skills/lib/ruleAuditor.ts` | Static quality scoring engine (0-100) |
| `src/app/claude-skills/lib/manifestParser.ts` | Auto-detect stack from package.json / Cargo.toml |
| `src/app/claude-skills/lib/formatHubs.ts` | Format hub metadata for 13 target formats |
| `src/app/claude-skills/ClaudeSkillsClient.tsx` | Main AI Skill Studio UI component (180KB) |
| `src/lib/tools/registry.ts` | Tool registry for all 28+ developer utilities |
| `src/lib/storage.ts` | LocalStorage abstraction with quota protection |
| `cli/bin/devscratchpad.mjs` | Headless CLI entry point (26KB) |
| `scripts/build_registry.js` | Static registry builder for preset distribution |
| `schemas/preset-schema.json` | JSON schema for community preset validation |
| `next.config.ts` | Next.js 16 configuration (8KB) |

---

## 5. Agent Execution Protocol

All AI agents operating in this repository MUST follow this 5-step loop:

```
┌─────────────────────────────────────────────┐
│  1. INGEST CONTEXT                          │
│     Read: MEMORY.md → PRD.md → DESIGN.md   │
│     Understand: Stack, ADRs, Guardrails     │
├─────────────────────────────────────────────┤
│  2. CHECK TASK.md                           │
│     Identify: Current sprint, active tasks  │
│     Verify: No conflicting in-progress work │
├─────────────────────────────────────────────┤
│  3. APPLY SURGICAL CHANGES                  │
│     Follow: DESIGN.md tokens & patterns     │
│     Respect: Negative guardrails (NG-1..10) │
│     Preserve: All unrelated comments/docs   │
├─────────────────────────────────────────────┤
│  4. RUN VERIFICATION GATES                  │
│     Execute: npm run validate-presets       │
│     Execute: npm run lint                   │
│     Execute: npm run build                  │
├─────────────────────────────────────────────┤
│  5. UPDATE TRACKING                         │
│     Update: TASK.md (mark completed items)  │
│     Log: MEMORY.md (new ADRs, gotchas)      │
│     Record: Agent Session Log in TASK.md    │
└─────────────────────────────────────────────┘
```

---

## 6. Session History

### Session: 2026-09-20 — Agent Governance Layer
- **Agent**: Antigravity (Google Gemini)
- **Task**: Create foundational agent governance files (PRD.md, DESIGN.md, TASK.md, MEMORY.md)
- **Changes**: Created 4 new root-level documents, enhanced AGENTS.md and CLAUDE.md with reading hierarchy
- **Learnings**: Next.js 16 auto-generates AGENTS.md content; must preserve the agent-rules block when modifying
- **Status**: ✅ Complete

### Session: 2026-09-20 — AI Skill Studio Governance Suite & Designated Tweaks
- **Agent**: Antigravity (Google Gemini)
- **Task**: Expose PRD.md, DESIGN.md, TASK.md, and MEMORY.md in AI Skill Studio with designated interactive tweak buttons and proper layout placement
- **Changes**:
  - Expanded `OutputFormat` in `presetRegistry.ts`, `ruleGenerator.ts`, and `formatHubs.ts` with 4 governance formats (`prd_md`, `design_md`, `task_md`, `memory_md`).
  - Added "AI Governance & Multi-Agent Planning Suite" format selector group in `ClaudeSkillsClient.tsx`.
  - Added dedicated quick-tweak cards with contextual modifier buttons for each format (e.g. +User Persona, +Negative Guardrail, +Verification Gates, +Record ADR).
  - Integrated into unified ZIP exporter and bottom placement guide.
- **Learnings**: Monaco editor requires client hydration (`isMounted`) before rendering client-side studio options; SSG prerenders 865 pages cleanly.
- **Status**: ✅ Complete (All verification gates passed)
 
### Session: 2026-09-20 — Format-Specific Dedicated Sections Strategy
- **Agent**: Antigravity (Google Gemini)
- **Task**: Remove broken quick-action tweak buttons and implement format-specific intended sections across AI Skill Studio for PRD.md, DESIGN.md, TASK.md, and MEMORY.md.
- **Changes**:
  - Removed artificial yellow tweak cards and `handleAppendDirective` logic.
  - Implemented 22 rich, dedicated section form cards across `PRD.md` (6 sections), `DESIGN.md` (6 sections), `TASK.md` (5 sections), and `MEMORY.md` (6 sections).
  - Wired full two-way reactivity: changes to any section immediately regenerate the document and reflect in Monaco Editor.
  - Added individual section "Reset" buttons to restore preset defaults on demand.
  - Contextually hidden standard skill/agent form cards (`Identity & Activation Rules`, `Tech Stack`, `Philosophy`, `Procedures`, etc.) when viewing governance or MCP formats to prevent clutter.
- **Learnings**: Direct section-level mapping is vastly superior to appending directives, giving developers surgical control over each document section.
- **Status**: ✅ Complete (0 lint errors, 865 SSG pages compiled)

### Session: 2026-09-20 — Universal Info Tooltip Guidance & SEO Content Expansion
- **Agent**: Antigravity (Google Gemini)
- **Task**: Replace colored section badges with circular info `(i)` badges that emerge short descriptions on how to edit, propagate across AI Skill Studio cards, and update bottom page content.
- **Changes**:
  - Created `InfoTooltip.tsx` supporting hover/focus, click-to-toggle, click-outside dismissal, alignment, and example snippets.
  - Replaced all 22 colored badges across `PRD.md`, `DESIGN.md`, `TASK.md`, and `MEMORY.md` cards with tailored `InfoTooltip` instances.
  - Added `InfoTooltip` across MCP Server Configuration, Cursor Rule Scope, and all standard skill cards (Identifier, Display Title, Triggers, Description, Persona, Tech Stack, Philosophy, Guardrails, Conventions, Procedures, Directives).
  - Updated the bottom "Target File Location" card in `ClaudeSkillsClient.tsx` with format-specific icons and expanded usage text.
  - Updated `AiSkillStudioSeoContent.tsx` and `page.tsx` with Layer 4 AI Governance & Multi-Agent Planning Suite covering all 17 formats, guided editing instructions, and comprehensive FAQ items.
- **Learnings**: Replacing static colored labels with interactive floating info tooltips preserves single-canvas cleanliness while offering deeper, on-demand documentation.
- **Status**: ✅ Complete (All gates passed: validate-presets, 0 lint errors, 865 SSG pages exit 0)

### Session: 2026-09-20 — Tooltip Heading Overlap & Mobile Viewport Clamping Fix
- **Agent**: Antigravity (Google Gemini)
- **Task**: Eliminate native browser `title` hover popup obscuring headings, prevent mobile viewport bloating, and verify all 329 previous lint fixes on localhost.
- **Changes**:
  - Removed `title="Click or hover for editing instructions"` from `InfoTooltip.tsx` button; retained accessible `aria-label` and `aria-expanded`.
  - Re-architected popover rendering via React `createPortal` into `document.body` with fixed positioning.
  - Implemented dynamic horizontal clamping: `Math.max(12, Math.min(left, viewportWidth - maxWidth - 12))` with responsive `maxWidth = Math.min(320, viewportWidth - 24)`, guaranteeing the tooltip never overflows viewport edges on mobile screens.
  - Positioned popover cleanly below the button (`top = rect.bottom + 6`) or flipped above if viewport bottom is cramped, preventing any heading occlusion.
  - Verified all 329 previous lint fixes intact (0 errors, 228 warnings), validate-presets passed, Next.js build compiled all 865 pages (exit 0), and dev server running on localhost:3000.


### Session: 2026-09-26 — AI Skill Studio White Marker & Section Tracking
- **Agent**: Antigravity
- **Task**: Implement clean White Marker editor highlighter in AI Skill Studio whenever respective fields/sections are changed:
  1. Created `src/app/claude-skills/lib/sectionLocator.ts` to locate line ranges for any modified field across all 17 formats (PRD, DESIGN, TASK, MEMORY, standard skills, MCP, etc.).
  2. Added `.monaco-white-marker-line` (subtle white background tint with 3px solid white left marker bar) and `.monaco-white-marker-glyph` to `src/app/globals.css`.
  3. Added reactive `activeFieldKey` tracking across 25+ form fields in `ClaudeSkillsClient.tsx`, triggering Monaco `deltaDecorations` and auto-scrolling to the marked section via `revealLineInCenter`.
  4. Added a minimalist White Marker status pill in the editor header showing the marked section label and line range (`L:start–end`).
  5. Added matching line-by-line white marker styling in the static `<pre>` preview fallback.
  6. Enabled `glyphMargin: true` in Monaco Editor options to support the gutter marker.
  7. Verified all gates passed (validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0), dev server active on `http://localhost:3000/ai-skill-studio`.
- **Status**: ✅ Complete (All verification gates passed, verified 200 OK on localhost:3000)

### Session: 2026-09-26 — White Marker & Lockstep Editor Auto-Scroll Refinement
- **Agent**: Antigravity
- **Task**: Address user feedback on White Marker: remove banner heading, fix broken dashed lines, eliminate scroll flash/inversion, and ensure text is 100% visible:
  1. **Removed Toolbar Status Pill**: Completely removed the white banner pill (`[● Title & I... ]`) from the Monaco header toolbar per user request, keeping the header clean with filename, line count, and action buttons.
  2. **Eliminated Scroll Thrashing & Flashing**: Diagnosed and removed `editorRef.current.setScrollTop(0)` from the `generatedContent` sync `useEffect`. Previously, editing any field forced the editor to line 1 before scrolling down, causing an erratic vertical flash.
  3. **Synchronized Top-to-Bottom Order**: Reordered the left form cards (Conventions before Guardrails) to strictly match the code generation sequence. Previously, Conventions was below Guardrails in the UI but above Guardrails in the code, causing Monaco to scroll UP when the user scrolled DOWN.
  4. **Single Continuous White Marker with Radiant Glow**: Replaced disjointed multi-class decorations (which produced broken dashed segments across glyph, gutter, and line) with a single continuous `border-left: 3px solid #ffffff` and `box-shadow: 0 0 10px rgba(255, 255, 255, 0.4)`.
  5. **100% Text Readability Guarantee**: Replaced murky rectangular grey fills with a transparent gradient (`rgba(255,255,255,0.08) -> transparent`) and enforced `.monaco-editor .view-lines { z-index: 1 !important; }` so syntax-highlighted code is rendered above the decoration layer with zero occlusion.
  6. **All Quality Gates Passed**: Verified `npm run validate-presets` (exit 0), `npm run lint` (0 errors), `npm run build` (872 SSG routes compiled cleanly), and live server running at `http://localhost:3000/ai-skill-studio` returning HTTP 200.
### Session: 2026-09-27 — Mobile Audit Panel Header Text Overlap Fix
- **Agent**: Antigravity
- **Task**: Fix text overlap on mobile view where `94/100 · PRODUCTION GRADE` badge, `Copy Report` button, and `✕` close button collided:
  1. **Diagnosed Mobile Width Constraint**: On mobile screens (~360px viewport), the audit panel width is ~336px (`left-3 right-3`). The previous header required >440px because the title (`RULE AUDIT`), badge (`94/100 · PRODUCTION GRADE`), and copy button (`[icon] Copy Report`) all had `shrink-0` with full strings, forcing elements to overlap directly on top of each other.
  2. **Responsive Mobile Hierarchy**:
     - **Title**: `AUDIT` on mobile, `RULE AUDIT` on `sm+`.
     - **Score Badge**: `{score}/100` on mobile, full `{score}/100 · {gradeLabel}` on `sm+` with `truncate max-w-[130px] sm:max-w-none`.
     - **Copy Button**: Icon-only `<Copy />` / `<Check />` with `aria-label="Copy audit report"` on mobile, full text label on `sm+`.
     - **Metric Grid**: Refined padding to `p-2 sm:p-2.5`, gaps to `gap-1 sm:gap-1.5`, and font sizes to `text-[8px] sm:text-[9px]` for labels so all 5 metric columns (Triggers, Density, Guards, Format, Arch) fit comfortably without horizontal clipping.
  3. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (872 routes SSG exit 0), and live local endpoint verified HTTP 200.
### Session: 2026-09-27 — Format Switching Marker Clear, Header Filename & Auto-Scroll Jump Fix
- **Agent**: Antigravity
- **Task**: Address abnormal behavior when switching AI formats (Gemini, Copilot, Windsurf, etc.):
  1. **Clean Format Switching**: Centralized format selection via `handleSelectFormat` in `ClaudeSkillsClient.tsx`. Resets `activeFieldKey` to `null`, `markedRange` to `null`, `isManuallyEdited(false)`, and scrolls editor to top (`scrollTop = 0`) across all 17 format selectors.
  2. **Auto-Scroll Isolation**: Added `lastHandledScrollIdRef` so auto-scroll in Monaco runs strictly on new user-triggered form field edits/clicks (`scrollRequestId`), completely preventing auto-scroll jumps when switching formats or applying presets.
  3. **Header & Filename Accuracy**: Updated `currentFileName`, `handleDownload`, and colored brand dots for all 17 formats (Gemini: `gemini-system-instructions.json`, Windsurf: `.windsurf/rules/${safeSkill}.md`, Copilot: `copilot-instructions.md`, OpenAI: `openai-custom-instructions.md`, etc.).
  4. **Gemini Modular System Instructions**: Restructured `gemini_prompts` JSON output in `ruleGenerator.ts` to use modular `system_instruction.parts` (Role & Mission, Guidelines, Constraints, Procedures, Verification) instead of a single concatenated line.
  5. **Section Locator Precision**: Added dedicated range locators for `gemini_prompts` and `mcp_json` in `sectionLocator.ts` to accurately isolate JSON keys/parts and prevent line range bleeding across the whole file.
  6. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (872 routes SSG exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-27 — Universal White Marker Fix & 100% Cross-Format Validation
- **Agent**: Antigravity
- **Task**: Eliminate broken marker lines, zebra stripes, and right-edge blisters across all AI formats:
  1. **Monaco CSS Overhaul**: Diagnosed that `box-shadow: 0 0 10px rgba(255, 255, 255, 0.4), inset 2px 0 6px...` applied 10px blur in all 4 directions on every visual row in `.view-overlays`. This created overlapping horizontal lines between rows and protruding blisters on wrapped lines. Replaced with clean `border-left: 3px solid #ffffff !important;`, `box-shadow: none !important;`, and smooth translucent horizontal gradient `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%) !important;`.
  2. **Range Safety Guardrails**: Added `Math.min` and `Math.max` for Monaco `startLineNumber` and `endLineNumber` to eliminate any inverted range rendering.
  3. **Dedicated XML Locator for CLAUDE.md**: Implemented tag-based locator isolating `<project_context>`, `<tech_stack>`, `<workflows_and_procedures>`, `<conventions>`, `<agent_guardrails>`, `<custom_directives>`, `<implementation_reference>`.
  4. **Frontmatter Line Isolators**: For `cursor_mdc` and `skill_md`, isolate exact lines for `globs:`, `alwaysApply:`, `name:`, and `description:` instead of whole frontmatter blocks, while pointing `skillTitle` to `# Title`.
  5. **100% Automated Cross-Format Testing**: Ran diagnostic covering all 15 active formats and all fields (127/127 fields located successfully, 100% pass rate).
  6. **Verification Gates**: Passed `validate-presets` (100/100), `lint` (0 errors), `build` (872 SSG routes exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-27 — Download Audit HUD (Bottom Verification Dock)
- **Agent**: Antigravity
- **Task**: Implement a sleek bottom-anchored notification system in AI Skill Studio that emerges whenever users download or export skill files, showing audit score, user adjustments, and privacy guarantee:
  1. **Created `DownloadAuditHud.tsx`**: Standalone component with 4-stage lifecycle (`hidden` → `entering` → `active` → `exiting`), rendered via `createPortal` to avoid layout interference.
  2. **Spring Entrance Animation**: Emerges from `translate-y-8 opacity-0 scale-95` to resting position via `cubic-bezier(0.16, 1, 0.3, 1)` over 300ms.
  3. **60fps Countdown Bar**: 2px hairline progress bar depleting from 100% to 0% over 5 seconds, with smart hover-pause (freezes timer when user inspects the notification).
  4. **Smooth Exit**: Slides down `translate-y-4` and fades out over 250ms, then unmounts from DOM.
  5. **Comprehensive Content**: Audit score badge (emerald ≥80, amber <80), format label pill, `0 Bytes Sent` privacy badge, dynamic adjustment pills (framework, language, trigger count, guardrails status, manual edit flag).
  6. **Integration Points**: Wired into `handleDownload` (single file) and `handleExportZip` (ZIP suite) in `ClaudeSkillsClient.tsx`. "Inspect Audit Details →" link opens the existing audit panel.
  7. **Accessibility**: `role="status"`, `aria-live="polite"`, Escape key dismissal, manual ✕ close button.
  8. **Verification**: Passed `validate-presets` (100/100), `lint` (0 errors), `build` (872 SSG routes exit 0), dev server active on `http://localhost:3000`.
- **Learnings**: Using `createPortal` for fixed-position notifications prevents scroll/layout interference with the editor canvas. A ref-based countdown timer with delta-based tick calculation ensures smooth pause/resume without drift.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-28 — White & Orange HUD Redesign & Mobile Optimization
- **Agent**: Antigravity
- **Task**: Restyle `DownloadAuditHud.tsx` from dark/emerald theme to a formal, pristine White and Orange aesthetic matching AI Skill Studio's brand system, with responsive adaptations for mobile viewports:
  1. **White & Orange Surface**: Replaced dark background with an elevated pure white glassmorphism dock (`bg-white/98 backdrop-blur-xl border border-zinc-200/90 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(234,88,12,0.08)]`), featuring a top orange gradient hairline bar (`from-orange-500 via-amber-500 to-orange-500`).
  2. **Refined Typography & Accents**: High-contrast dark zinc text (`text-zinc-900`), vibrant orange highlight on `Skill File All Done` (`text-orange-600 font-bold`), formal orange checkmark badge with soft amber ping animation.
  3. **Formal Audit & Adjustment Pills**:
     - Audit Score: `bg-orange-50 text-orange-800 border-orange-200/90` with orange `<ShieldCheck />` icon.
     - Format & Privacy: `bg-zinc-100 text-zinc-700 border-zinc-200/90` with 0 Bytes Sent guarantee stamp.
     - Adjustments: `bg-zinc-50 text-zinc-700 border-zinc-200/80` for framework, language, triggers, and guardrails.
  4. **Orange Countdown Bar**: 2.5px countdown bar with gradient `from-orange-500 via-orange-600 to-amber-500` and hover-pause behavior.
  5. **Mobile View Optimization**: Clamped container width to `w-[calc(100%-1.25rem)] max-w-lg sm:max-w-xl`, positioned at `bottom-3 sm:bottom-5`, responsive font sizes (`text-xs sm:text-[13px]`), truncated filenames with responsive max-width (`max-w-[150px] sm:max-w-[260px]`), wrap-safe badge rows, and accessible close button touch target (`min-w-[28px] min-h-[28px]`).
  6. **Verification**: Passed `validate-presets` (100/100), `lint` (0 errors, 257 pre-existing warnings), `build` (872 SSG routes exit 0), dev server active on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-28 — Official Folder Icon in Download Audit HUD
- **Agent**: Antigravity
- **Task**: Replace the circular enclosed checkmark badge in `DownloadAuditHud.tsx` with the official AI Skill Studio folder icon (`/ai-skill-icon.png`):
  1. Replaced `<CheckCircle2 />` with `<Image src="/ai-skill-icon.png" width={20} height={16} alt="AI Skill Studio" className="w-5 h-4 sm:w-5.5 sm:h-4.5 object-contain shrink-0" />`.
  2. Nested within an elegant container (`rounded-lg bg-orange-50/90 border border-orange-200/80 shadow-xs`).
  3. Verified all quality gates pass: `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (872 SSG routes exit 0), dev server active on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-30 — AI Skill Library Sidebar Alignment, Model Filtering & Catalog Expansion
- **Agent**: Antigravity (Gemini)
- **Task**: Fix sidebar button alignment, resolve model filtering bug where selecting a platform returned Claude Code skills, and expand catalog with official suites:
  1. **Sidebar Alignment & Orientation**: Fixed indentation discrepancy on "All Platforms" by introducing uniform `w-4 h-4` icon containers across all platform and source buttons. Added count pills (`platformCounts`, `sourceCounts`) displaying live counts per category. Added `<Server>` for MCP and `<Globe>` for Universal.
  2. **Model Filtering Isolation**: Changed filter logic in `SkillsLibraryClient.tsx` from generic target format substring matching (`targetFormats.some(...)`) to strict primary platform matching (`skill.primaryPlatform === activePlatform`). Selecting Cursor Rules (.mdc) strictly renders Cursor `.mdc` cards; Claude Code renders Claude `SKILL.md` cards; Gemini, Windsurf, Copilot, ChatGPT, and MCP each display strictly their designated models.
  3. **Universal Cross-IDE Support**: Added "Universal (Cross-IDE)" to the platform filter list for framework/language rules (Dart, Flutter, Chrome Extensions, Modern Web) usable across any agent.
  4. **Official Catalog Expansion**: Added 11 premier official skills (GitHub MCP Server, PostgreSQL MCP Server, Puppeteer MCP Server, Brave Search MCP Server, Open Memory MCP Server, Windsurf Supabase Realtime, Windsurf Docker Microservices, GitHub Copilot Actions CI/CD, OpenAI Strict Function Calling, OpenAI Canvas Refactoring, Cursor Stripe Billing). Total skills reached 136 (111 official).
  5. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (867 SSG routes exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-30 — Sort Selector Popover, Premium Gradient Blues & Full Mobile Optimization
- **Agent**: Antigravity (Gemini)
- **Task**: Fix non-functional sort dropdown, replace ugly Windows-native blue select highlights, upgrade Gemini and Cursor card themes to rich gradient blue, and make the AI Skill Library 100% mobile-ready:
  1. **Custom Sort Popover**: Replaced native `<select>` element with a custom interactive popover component featuring `<ArrowUpDown />`, `<ChevronDown />`, and `<Check />` indicators. Eliminated native OS select picker highlighting (`#0055ff`) from user screenshots. Implemented actual array sorting for "Most Popular" (descending stars), "Highest Score" (descending audit score), and "Recently Added" (recent uploads first).
  2. **Elevated Gradient Blues for Gemini & Cursor**:
     - **Gemini**: Multi-stop gradient badge (`from-blue-600 via-indigo-600 to-sky-400`), soft tinted icon background (`from-blue-50 via-indigo-50 to-sky-100`), smooth hover text (`group-hover:text-blue-600`), and soft indigo/blue elevation shadow (`hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]`).
     - **Cursor**: Vibrant cyan-to-blue gradient badge (`from-blue-600 to-cyan-500`), subtle container tint (`from-blue-50 via-sky-50 to-cyan-100`), sky hover text (`group-hover:text-sky-600`), and radiant cyan shadow (`hover:border-sky-300 hover:shadow-[0_8px_30px_rgba(2,132,199,0.08)]`).
  3. **Full Mobile Optimization**:
     - Transformed desktop 25-button vertical sidebar into `hidden lg:flex` to prevent displacing cards off-screen on mobile.
     - Added horizontal touch-scrollable model ribbon (`lg:hidden`) with compact labels (`mobileLabel`) and count badges for 1-tap switching.
     - Added collapsible mobile "Filters" accordion toggle button with active count indicator dot to easily reveal Source and Category filters.
     - Optimized card padding to `p-4 sm:p-5`, clamped title to 2 lines (`line-clamp-2`), and truncated filename badges with responsive constraints (`max-w-[110px] xs:max-w-[160px] sm:max-w-none`).
  4. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (867 SSG pages exit 0), dev server active on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-30 — MCP Theme Transition from Purple to Minimalist Dark Zinc
- **Agent**: Antigravity (Gemini)
- **Task**: Remove purple theme from MCP in the AI Skill Library per user direction:
  1. **Minimalist Zinc Palette**: Replaced loud purple accents (`bg-purple-50`, `text-purple-700`, `border-purple-200`, `bg-purple-600`) with sleek, professional dark zinc styling (`bg-zinc-100`, `text-zinc-800`, `border-zinc-200`, `bg-zinc-800`, `group-hover:text-zinc-950`).
  2. **Active Filter Classes**: Configured active platform button to clean `bg-zinc-100 text-zinc-950 border-zinc-300 font-semibold shadow-xs` with `bg-zinc-200 text-zinc-800` badge.
  3. **Brand Server Icon**: Replaced `<Server className="text-purple-600" />` with crisp `<Server className="text-zinc-700" />`.
  4. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (867 SSG pages exit 0), dev server active on `http://localhost:3000` (200 OK).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-09-30 — Mobile View Hero Header Logo & Text Alignment
- **Agent**: Antigravity (Gemini)
- **Task**: Resolve vertical logo misplacement and text squishing on mobile viewports (<640px):
  1. **Direct Title Pairing**: Grouped the folder icon (`w-11 h-11`) directly with the `Skill HUB` heading in the top row on mobile, eliminating vertical floating.
  2. **Full-Width Typography**: Allowed subtitle ("Multi-Platform Agent Skills") and description to span full width below the title pair on mobile instead of being squished into a narrow column.
### Session: 2026-10-03 — Ingestion to Markdown (.md) Pipeline, Modal Unification & Spoke Layout Fix
- **Agent**: Antigravity (Gemini)
- **Task**: Fix editor rulebook population after GitHub & DDL ingestion, modernize ingestion modals to clean monochrome aesthetic, restore Technology Stack Context header, and align programmatic spoke page text:
  1. **Direct Markdown Synthesis via `buildRuleContent`**: Diagnosed root cause where ingesting a repository or SQL DDL failed to populate rules in Monaco editor — an undefined `generateRules` call threw an unhandled reference exception before state could sync. Replaced with `buildRuleContent` supplying all required arguments. Now, applying GitHub or DDL analysis immediately generates the complete markdown rulebook (`CLAUDE.md`, `cursor.mdc`, `AGENTS.md`, or `SKILL.md`), updates `editorContent`, resets `isManuallyEdited(false)`, and deep-links to `/ai-skill-studio/{formatSlug}`.
  2. **Format Selection in Ingestion Modals**: Added target format selector pills (`CLAUDE.md`, `cursor.mdc`, `AGENTS.md`, `SKILL.md`) to both `GitHubRepoModal` and `DdlIntrospectModal`. Synced `initialFormat` dynamically when opening modals so users can directly choose their preferred output rulebook.
  3. **Monochrome Minimalist Modal Card Styling**: Removed distracting stars, forks, terminal prompts (`>_`), sparkles, and loud blues from both `GitHubRepoModal` and `DdlIntrospectModal`. Unified cards to sleek dark zinc and white surfaces with crisp typography and subtle orange accents matching DevScratchpad's design system. Filtered out `"None / Irrelevant"` tags.
  4. **Technology Stack Header & Ingestion Layout**: Restored Technology Stack Context header buttons back to original clean state (`Convert Legacy Rules` + `Auto-Detect`) and housed `Ingest GitHub` and `Introspect DDL` in a dedicated, clean "Live Project Ingestion" section row.
  5. **Spoke Page Text Preservation & Reciprocal Callouts**: Reverted promotional text injected into the top executive summary of `ProgrammaticSpokeSeoContent.tsx` back to original technology copy (`route.description` + `route.whyNeeded`). Added a dedicated, balanced reciprocal action callout card at the end of the page alongside the Reverse Converter, directing users to Launch AI Skill Studio with zero server transmission.
  6. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (890 SSG routes exit 0), and fresh production server running on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-03 — Mobile Viewport Optimization for Live Ingestion & Spoke Pages
- **Agent**: Antigravity (Gemini)
- **Task**: Optimize all Phase 2 components, modals, and spoke content for small mobile viewports (320px–640px):
  1. **`GitHubRepoModal.tsx`**: Updated modal container with responsive padding (`p-3 sm:p-4`, `p-4 sm:p-5`, `max-h-[92vh] sm:max-h-[90vh]`); converted token access section to `flex-col sm:flex-row` with wrapped badges; switched detected scripts grid from 2 columns to `grid-cols-1 sm:grid-cols-2` to prevent truncation of long scripts; formatted format switcher pills into `grid grid-cols-2 sm:flex` with `min-h-[30px]` touch targets; ensured footer action buttons have `min-h-[38px]`.
  2. **`DdlIntrospectModal.tsx`**: Added mobile padding, flex-wrapping header with `min-w-0`, `grid-cols-1 sm:grid-cols-2` table preview grid, `min-h-[28px]` sample chips, `grid grid-cols-2 sm:flex` format pills, and `min-h-[38px]` footer apply button.
  3. **`ClaudeSkillsClient.tsx`**: In Live Project Ingestion section, configured `Ingest GitHub` and `Introspect DDL` buttons with `flex-1 sm:flex-none` and `w-full sm:w-auto` for equal-width, comfortable mobile touch targets (`min-h-[36px]`). Applied same responsive layout to GitHub PAT and DDL banners in MCP mode.
  4. **`ProgrammaticSpokeSeoContent.tsx`**: Optimized TerminalInstallWidget tab bar and header; removed mobile margin indentations (`ml-0 sm:ml-8`, `pl-0 sm:pl-8`) in Steps 1-3 to maximize code reading space; made Central Pillar Hub button `w-full sm:w-auto min-h-[38px]`; made reciprocal action callout buttons self-stretching (`self-stretch sm:self-start min-h-[38px]`).
### Session: 2026-10-03 — Phase 3: Local Filesystem, Docker Compose Ingestion & Format UI Restoration
- **Agent**: Antigravity (Gemini)
- **Task**: Implement Phase 3 and restore clean format URL routing:
  1. **Local Filesystem Inspection (`fsPicker.ts`)**: Built native client-side directory inspector using Chromium's `window.showDirectoryPicker()` with zero server upload. Iterates top-level directories, extracts manifests, parses package managers & scripts, and synthesizes pair programming directives.
  2. **Docker Compose Parser (`dockerParser.ts`)**: Implemented client-side parser extracting services, images, ports, volumes, networks, environment keys, and dependencies.
  3. **Interactive Modals with Gradient Buttons**: Created `LocalFolderModal.tsx` and `DockerInspectModal.tsx`. Upgraded modal apply buttons with professional orange-to-amber gradients (`from-orange-600 via-orange-500 to-amber-600`), hover depth shadows, and spring press feedback.
  4. **Single Dedicated Position for MCP Engines**: Consolidated MCP introspection engines exclusively into `MCP Server Configuration` (Filesystem, GitHub, Postgres/SQLite, Docker), eliminating duplication in `Technology Stack Context`. Restored clean header buttons (`Convert Legacy Rules` & `Auto-Detect`).
  5. **Exact UI Preservation for `[formatSlug]`**: Restored `/ai-skill-studio/[formatSlug]` to render the exact same UI as `/ai-skill-studio` without top breadcrumb bars or bottom hub directory text, loading `<AiSkillStudioSeoContent />` below the fold.
  6. **Mobile Optimization**: Verified all modals, format switcher pills (`min-h-[30px]`), sample chips (`min-h-[28px]`), and action buttons (`min-h-[36px]` / `min-h-[38px]`) are completely optimized for mobile viewports down to 320px with zero overflow.
  7. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), `npm run build` (890 static routes exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-06 — Technical SEO Full Remediation Sprint
- **Agent**: Antigravity (Gemini)
- **Task**: Address and resolve all findings from the multi-agent Technical SEO Audit:
  1. **Format Hub Content Deduping**: Replaced boilerplate `<AiSkillStudioSeoContent />` across all 17 `/ai-skill-studio/[formatSlug]` hubs with a new dynamic `<FormatHubSeoContent />` component rendering tailored syntax highlights, placement guides, best practices, and FAQs from `formatHubs.ts`. Injected `FAQPage` schema into root JSON-LD.
  2. **URL Canonicalization & Redirects**: Decommissioned duplicate `/ai-skill-studio/skills` with a permanent redirect to `/skill`. Added `/skill` to `sitemap.ts`. Decommissioned orphaned `/workspace` with a permanent redirect to `/`. Enforced canonical format redirection on spoke preset URLs and resolved canonical generation in `presetRegistry.ts`.
  3. **Crawl Budget Protection**: Added `Disallow: /api/` in `src/app/robots.ts` and injected `X-Robots-Tag: noindex, nofollow` headers on all 333+ raw code endpoints (`/api/raw/[formatSlug]/[presetSlug]`).
  4. **Document Outline & Heading Sequentiality**: Normalized heading hierarchy (eliminating H1->H3 skips) across Homepage (`HomeSeoContent.tsx`), Recipes Index (`recipes/page.tsx` & `RecipeDirectory.tsx`), individual recipes, Blog Index (`LearningTracks.tsx`, `CheatSheetGrid.tsx`), Tools (`SeoArticle.tsx`), CLI (`cli/page.tsx`), Rules Converter, and Programmatic Spokes (`ProgrammaticSpokeSeoContent.tsx`).
  5. **Schema & LLM Discovery**: Added `CollectionPage` and `ItemList` schema on `/recipes`. Fixed Headless Terminal CLI link in `llms.txt` and `llms-full.txt` to point to `/cli`, and added `/recipes` and `/skill` libraries.
  6. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (890 static export routes exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-07 — AI Skill Studio Header Cleanup & Seamless Navigation
- **Agent**: Antigravity (Gemini)
- **Task**: Remove Developer Tools Workspace comeback button from AI Skill Studio header and reposition AI Skill Studio section to the far left; ensure seamless entry to AI Skill Studio from main `/` page:
  1. **Header Cleanup in AI Skill Studio (`ClaudeSkillsClient.tsx`)**: Removed the `← Developer Tools Workspace` comeback button and vertical divider `|`. Dragged and repositioned the `AI Skill Studio` folder icon and title section to the leftmost position of the header navigation bar.
  2. **Main Page Navigation (`TopBar.tsx`)**: Maintained desktop entry point to `/ai-skill-studio` and added a direct 1-tap mobile action icon next to Skill Hub so users on all form factors can navigate effortlessly from `/` to `/ai-skill-studio`.
  3. **Verification**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (890 static export routes exit 0).
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-07 — Google Search Console (GSC) Indexing Remediation
- **Agent**: Antigravity (Gemini)
- **Task**: Eliminate root causes of 4 GSC indexing issue categories from Search Console report:
  1. **Not Found (404)**:
     - Root cause: `synthesizeRouteForFormat` fell through without checking format validity. For governance formats (`prd-md`, `design-md`, `task-md`, `memory-md`), it synthesized non-existent routes, producing 4 dead links on all ~336 spoke pages (~1,344 dead links). Also, 11 presets had legacy unmapped slugs in `ruleGenerator.ts`.
     - Fix: `synthesizeRouteForFormat` strictly returns `null` for governance formats and unrecognized formats. Added all 11 legacy slugs (`pragmatic-vibe-builder` -> `vibe-coder`, `security-vulnerability-guard` -> `security-guard`, etc.) to `SLUG_ALIASES` in `presetRegistry.ts`. Updated `PRESETS` array in `ruleGenerator.ts` to match canonical `BASE_CODE_SLUGS`.
  2. **Page with Redirect (308)**:
     - Root cause: `FORMAT_TO_URL_SLUG` mapped formats to dot-extension slugs (`claude.md`, etc.). `ClaudeSkillsClient.tsx` pushed dot-extension URLs to browser history (`pushState`). When visited or crawled, spoke pages hit 308 permanent redirect. Also, 21 duplicate alias pages were statically exported in `[formatSlug]/page.tsx`.
     - Fix: Updated `FORMAT_TO_URL_SLUG` across `presetRegistry.ts` and `formatHubs.ts` to canonical hyphenated slugs. Replaced `"claude.md"` fallback in `ClaudeSkillsClient.tsx` with `"claude-md"`. Statically generate only the 17 canonical hubs in `[formatSlug]/page.tsx`. Added 308 permanent redirects in `next.config.ts` for all dot-extension format hubs and spokes and all legacy preset slugs.
  3. **Discovered - Currently Not Indexed**:
     - Root cause: Programmatic spoke pages were orphaned: format hub pages (`FormatHubSeoContent.tsx`) had NO internal links to their own presets, leaving ~330 spoke URLs only in `sitemap.xml` with zero inbound HTML links. In addition, 4 format hubs were unlinked from `AiSkillStudioSeoContent.tsx`.
     - Fix: Added a responsive preset showcase grid in `FormatHubSeoContent.tsx` using `getPresetsByFormat(hub.slug)`, creating direct contextual HTML links to every child spoke. Added cards for all missing formats in Layer 1 and converted Layer 4 cards in `AiSkillStudioSeoContent.tsx` to clickable `<Link>`s.
  4. **Crawled - Currently Not Indexed**:
     - Root cause: Synthesized routes copied identical descriptions, `whyNeeded`, and FAQs across all formats, triggering near-duplicate detection. In addition, `ClaudeSkillsClient.tsx` had `if (!isMounted) return null;`, completely wiping server-side prerendered HTML during SSG/build and serving empty shells to crawlers.
     - Fix: Removed `if (!isMounted) return null;` from `ClaudeSkillsClient.tsx` so SSG prerenders the full static HTML markup and `<pre>` code preview for search crawlers. Added format-specialized descriptions, `whyNeeded`, and custom FAQs across all 12 code formats in `synthesizeRouteForFormat`.

### Session: 2026-10-08 — Full-Width Minimalist AI Skill Studio Support Section (`support@devscratchpad.tech`)
- **Agent**: Antigravity (Gemini)
- **Task**: Streamlined support email integration per user request by removing scattered triggers from header, editor column, and secondary spokes, concentrating support into a single minimalist, white-themed section at the end of AI Skill Studio, and expanding it to full container width:
  1. **Full-Width Minimalist Copy-Only Section (`StudioSupportSection.tsx`)**: Built a full-width container card (`w-full` across `max-w-7xl` layout, removing narrow `max-w-2xl` center restriction) matching the width of Section 6 and other content blocks. Features high-definition typography (`font-mono` text-xs font-semibold for the address and crisp tracking), subtle orange hairline top accent line, zero `mailto:` triggers (no external mail client or Outlook launches), and an interactive one-click copy pill providing instant 'Copied!' confirmation.
  2. **Removed from Elsewhere**: Cleaned up `ClaudeSkillsClient.tsx` (header button and in-editor card removed), `FormatHubSeoContent.tsx`, `ProgrammaticSpokeSeoContent.tsx`, and `rules-converter/page.tsx` so support is strictly concentrated in the end section.
  3. **Structured Data & FAQ (`page.tsx` & `AiSkillStudioSeoContent.tsx`)**: Maintained official customer support `contactPoint` and FAQ item for SEO clarity.
  4. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (869 static export routes exit 0). Active server live on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-09 — Security & Safety Engine Hardening (TAR Engine / Instructor Audit Learnings)
- **Agent**: Antigravity (Gemini)
- **Task**: Absorb security findings from TAR Engine's audit of `instructor` into DevScratchpad's core rule auditor (`ruleAuditor.ts`), generator (`ruleGenerator.ts`), and UI quick fixes (`ClaudeSkillsClient.tsx`):
  1. **Credential Exposure / Mock Secret Linter (`CE-001` / `SEM-006`)**: Added detection for hardcoded mock credentials (`api_key="your-api-key"`, `ghp_...`, `sk-...`, literal authorization tokens). Deducts 25 points from Guardrails and warns that LLMs/developers leak mock keys into production.
  2. **Untrusted Input XML Boundary Armor (`SEM-004` / `SEM-008`)**: Added linter check for raw user/external content interpolation (`{text}`, `[article text]`, `$INPUT`) lacking XML boundary delimiters or data-isolation directives.
  3. **Obfuscated & Leetspeak Prompt Injection (`AR-003` / `AR-004`)**: Added regex heuristics catching token-level evasion patterns (`1gn0r3 4ll...`, `d15r3g4rd`, adversarial persona hijacking).
  4. **Supply Chain & Reliability Linters (`SUP-003` / `QL-001` / `QL-002`)**: Added unpinned package installation detection (`pip install pkg` without `==`, `npm install pkg` without `@`) and shell block error-trapping check (`set -euo pipefail`).
  5. **MCP Presets & Behavior Hardening**: Sanitized all MCP presets to use dynamic `${ENV_VAR}` references instead of mock strings; added `meta-prompt-shield` and `credential-safety` to `BEHAVIOR_OPTIONS`; fortified `handleInjectNegativeGuardrails` quick-fix button with zero-hardcoded secrets and XML boundary armor.
  6. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (869 static export routes exit 0). Active server live on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-09 — Editor Highlight & Smooth Sync Optimization (Round 2 Hardening)
- **Agent**: Antigravity (Gemini)
- **Task**: Deep-dive review and fix subtle race conditions, event storms, truncation, and editor snapping in the AI Skill Studio highlight/sync engine:
  1. **State-Tearing Race Condition Fix**: Converted `markedRange` from asynchronous `useEffect` to synchronous `useMemo(() => (!activeFieldKey ? null : findSectionLineRange(activeContent, activeFieldKey, format)), [activeContent, activeFieldKey, format])`, ensuring auto-scroll never executes with stale section coordinates. Cached latest range in `markedRangeRef` to decouple scroll triggers from render churn.
  2. **Event Listener Storm & Pure State Transitions**: Guarded `requestSectionScroll` to only increment `scrollRequestId` when section changes (`activeFieldKeyRef.current !== fieldKey`). Eliminated illegal `setState` inside `setState` updater callback, preventing double-increments in Strict Mode. Removed redundant `onClick` handler on the container div to prevent duplicate scroll resets.
  3. **Auto-Scroll Cancellation Bug Fix**: Decoupled Monaco auto-scroll `useEffect` to depend strictly on `[scrollRequestId]`. Fixed the critical bug where rapid focus/typing triggered effect cleanup that called `clearTimeout(scrollTimer)` and prematurely marked `lastHandledScrollIdRef` as handled, dropping the scroll permanently.
  4. **Static Preview Keystroke Jitter Elimination**: Added `lastHandledPreviewScrollIdRef` guard to static preview auto-scrolling, ensuring the container scrolls smoothly only on explicit section changes, not on every character typed in the form.
  5. **Composite Section & EOF Truncation Fix (`sectionLocator.ts`)**: Differentiated section boundary detection so `## ` sections only terminate at `## ` or `# ` (or markdown dividers `---`), preventing `### ` subheadings in Functional Requirements, Task Phases, and ADRs from prematurely truncating the section highlight. Added `isCompositeSection` flag so sections starting with `### Phase 1` include Phase 2 and Phase 3. Trimmed trailing blank lines for EOF sections.
  6. **Static Preview Relative Offset Calculation**: Added `relative` styling to the preview `<pre>` element and switched scroll calculation to bounding client rects (`elemRect.top - containerRect.top + container.scrollTop - container.clientHeight / 2`) for exact smooth centering.
  7. **Monaco Mount Viewport Reset & Layout Settling**: Removed hardcoded `editor.setScrollTop(0)` on `onMount` when `markedRange` exists, smoothly revealing the marked line range via `markedRangeRef` after a 50ms layout settling delay. Reset `decorationsCollectionRef.current = null` on mount and added try-catch recovery against disposed models.
  8. **Modernized Monaco Line Markers**: Replaced deprecated `editor.deltaDecorations` with `editor.createDecorationsCollection()`. Aligned sub-field `data-section` attributes for `skillName`, `skillTitle`, `description`, and `role`.
  9. **Monaco Diff Editor Configuration (`DiffCheckerTool.tsx`)**: Configured `diffWordWrap: "on"`, `automaticLayout: true`, and `smoothScrolling: true`.
  10. **Verification Gates**: Validated comprehensive test scenarios across PRD, Task, Memory, and Skill formats.
- **Status**: ✅ Complete (All verification gates passed)

### Session: 2026-10-09 — Dedicated Ignore Shield & Indexing Boundary Suite (.cursorignore & .claudeignore)
- **Agent**: Antigravity (Gemini)
- **Task**: Replace generic prompt cards with dedicated Ignore Shield & Indexing Boundary Suite for `.cursorignore` and `.claudeignore`:
  1. **Dedicated UI Suite**: Conditioned generic prompt cards on `!isGovernanceFormat && !isMcpFormat && !isIgnoreFormat`. Rendered Profile Selector (Full Shield, Security Only, Max Token Saver, Custom), Impact HUD (`~{tokens}k tokens saved`, Secret Leak Guards, Active Categories using `Package`, `ShieldCheck`, `Sliders` with strictly zero `Zap` lightning icons), interactive category toggle cards with clean icons and token savings badges, and custom rules & negate exceptions textarea (`data-section="customIgnoreRules"`).
  2. **Rule Generation**: Upgraded `buildCursorIgnoreContent` and `buildClaudeIgnoreContent` in `ruleGenerator.ts` to generate formatted `# ---` delimited sections based on active categories and framework/language context. Supported `test-fixtures` alias alongside `fixtures`.
  3. **Section Locator**: Added `headerPatterns` in `sectionLocator.ts` for `# ---` headers, enabling Monaco White Marker live highlighting and smooth scroll navigation when clicking or hovering category cards.
  4. **State Persistence & Sharing**: Added `ignoreCategories`, `ignorePreset`, and `customIgnoreRules` to storage envelope and URL state sharing (`ic`, `ip`, `ir` query params and LZ-compressed payloads). Enabled direct canonical hub URLs for unedited `.cursorignore` and `.claudeignore` shares.
  5. **Static Auditor**: Exempted ignore files from natural language negative guardrails and code block requirements in `ruleAuditor.ts`.
### Session: 2026-10-09 — Ignore Shield Token Typography & Pill Badge Refinement
- **Agent**: Antigravity (Gemini)
- **Task**: Eliminate wide, mechanical monospace font on Ignore Shield token savings badges and Impact Summary HUD:
  1. **Proportional Typography**: Removed `font-mono` from category pill badges and HUD metrics (`~{estimatedTokensSaved}k tokens`, active secret masks, shield categories count). Switched to clean, proportional sans typography (`text-[10px] sm:text-[11px] font-medium leading-none px-2 py-0.5 rounded-full tracking-tight` for badges; `text-xs font-bold text-zinc-900 tracking-tight` for HUD metrics).
  2. **Streamlined Token Strings**: Shortened verbose token labels in `IGNORE_CATEGORY_LIST` (`~60k+ tokens saved` -> `~60k tokens`, `~5k tokens (Leak Guard)` -> `~5k tokens`, etc.) so that category titles (`Secrets & Local Credentials`, `Dependency Bloat & Lockfiles`, etc.) render fully without getting truncated with ellipses.
  3. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (869 routes exit 0). Fresh server running on `http://localhost:3000`.
### Session: 2026-10-09 — Reverted Format Page Bottom Content to Unified Single-Heading Suite
- **Agent**: Antigravity (Gemini)
- **Task**: Revert format hub bottom reference content in `src/app/ai-skill-studio/[formatSlug]/page.tsx` from `FormatHubSeoContent` back to `AiSkillStudioSeoContent`:
  1. **Eliminated Massive Card Barrage**: Removed the multi-card placement guide, stack preset card matrix, and redundant subheadings.
  2. **Unified Single-Heading Reference**: Restored the clean single main heading layout (`AI Skill Studio — 17 Formats & 4-Layer AI Agent Operating Suite`) with organized separate links for all 17 formats divided into the 4 architectural layers.
  3. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (869 routes exit 0). Fresh server running on `http://localhost:3000`.
### Session: 2026-10-09 — Minimalist InfoTooltip Redesign & Mobile View Card Hardening
- **Agent**: Antigravity (Gemini)
- **Task**: Overhaul `InfoTooltip.tsx` into a minimal, elevated light surface and guarantee all studio cards render cleanly without truncation or overflow on mobile:
  1. **Minimal Elevated Aesthetic & Typography**: Replaced harsh dark container (`bg-zinc-900 border-zinc-700/90 text-zinc-300`) with an elevated white surface (`bg-white/98 backdrop-blur-xl border border-zinc-200/90 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_10px_rgba(234,88,12,0.06)] rounded-xl`). Replaced clunky brown monospace badge with a sleek warm orange pill badge (`bg-orange-50 border-orange-200/80 text-orange-800 font-medium rounded-full`). Upgraded header with clean `w-5 h-5 rounded-md bg-orange-100/90 text-orange-600` icon chip and `text-xs font-bold text-zinc-900 tracking-tight` title. Upgraded body description to `text-xs text-zinc-600 leading-relaxed font-sans` and format example to a clean `bg-zinc-50 border-zinc-200/80 text-[11px] font-mono text-zinc-800` code block.
  2. **Mobile Viewport Clamping & Touch-Safe Scrolling**: Added dynamic `maxHeight` clamping (`Math.min(440, space-6)`) with internal scrolling (`overflow-y-auto overscroll-contain`) so tooltips never clip off top/bottom on mobile. Clamped width to `Math.min(320, viewportWidth - 24)` and added `touch-manipulation` with warm orange ring states on trigger buttons.
  3. **Mobile View Card Usability Hardening (`ClaudeSkillsClient.tsx`)**:
     - **Category Cards**: Replaced rigid `truncate` with `break-words leading-snug` and responsive `items-start sm:items-center` flex wrapping, eliminating ellipses truncation on mobile viewports.
     - **Ignore Profile Buttons & Impact HUD**: Added `min-w-0` and responsive padding (`p-2 sm:px-3 sm:py-2`), ensuring all 4 buttons and the 3 HUD stat cards fit gracefully without stretching cards.
     - **Target File Location Card**: Added `break-all sm:break-normal` across all 13 format file path `<code>` blocks and clamped header with `min-w-0 truncate` and `shrink-0 whitespace-nowrap`.
     - **Governance Card Headers**: Added `min-w-0` and `shrink-0` across all 22 governance card headers (PRD, Design, Task, Memory) preventing flex collision on narrow mobile viewports.
  4. **Verification Gates**: Passed `npm run validate-presets` (100/100), `npm run lint` (0 errors), and `npm run build` (869 routes exit 0). Fresh production server live on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed)

---

*This document is updated by AI agents after significant sessions. Human maintainers should review and correct any inaccuracies periodically.*



