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

### ⚠️ Monaco `onChange` Must Commit Synchronously
Monaco fires `onChange` outside React's event system, so state updates render deferred. `@monaco-editor/react` overwrites the model whenever the `value` prop differs from it, so a stale `value` drops keystrokes (typing "MANUAL" became "MNA"). The studio wraps the editor's `onChange` state updates in `flushSync`. Keep it that way, or make the editor uncontrolled.

### ⚠️ White Marker Bar Belongs in the Gutter
A `border-left` on a whole-line `className` decoration paints on top of column 1 and covers each line's first character. The marker uses `linesDecorationsClassName` (the bar, in the `lineDecorationsWidth: 14` gutter) and a borderless `className` tint. `findSectionLineRange` takes the focused field's value to narrow the range to that field's own lines.
Auto-follow lives in one effect, and the geometry is in `lib/markerScroll.ts` (unit-tested). On focus, it centers the marked range, or pins it near the top if the range is taller than the view. While the user types in the form, it follows the first changed line inside the range, but only once that line leaves the view. It never scrolls while Monaco has text focus. It measures after one `requestAnimationFrame`, so wrapped-line heights are current. The effect does not cancel the queued frame on re-render: the latest target wins, so fast typing never drops a scroll.

### ⚠️ Manual Edit State Lives in Refs Too
`ClaudeSkillsClient.tsx` keeps manual editor edits per format (`stashedEdits` + active `editorContent`). Change the flag only through `setIsManuallyEdited` (it records a restorable `discardedEdit`), and switch formats only through `handleSelectFormat` (it stashes and restores edits). Effects that run in the mount flush must read `isManuallyEditedRef`, not the render-time flag, or they overwrite the restored draft.

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
| `src/app/claude-skills/ClaudeSkillsClient.tsx` | Main AI Skill Studio UI component (state, handlers, persistence, Monaco editor, White Marker, manual-edit stash); renders the components below |
| `src/app/claude-skills/components/` | Studio sections: `FormatSelector`, `GovernanceSections`, `IgnoreShieldSuite`, `McpServerConfigCard`, `CursorRuleScopeCard`, `IdentityActivationCard`, `StandardSkillCards` (tech stack, philosophy, conventions, guardrails, procedures), `TargetLocationCard`, editor chrome (`CliInstallPopover`, `AuditPanel`, `EditorStatusBar`, `MobileStudioControls`), modals |
| `src/app/claude-skills/lib/{auditQuickFixes,cliInstall,contextSynthesis,shareState,editorFileName}.ts` | Pure studio helpers: audit report and quick fixes, CLI install commands, Synthesize from Context, share-link state, editor tab file name |
| `src/app/claude-skills/lib/__tests__/` | Vitest suite for generator, section locator, auditor (`npm test`) |
| `scripts/copy-monaco.mjs` | Copies Monaco into `public/monaco/vs` (same-origin editor; runs on predev/prebuild) |
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

### Session: 2026-10-10 — AI Skill Studio Data-Loss Fixes, Token Hygiene & Test Suite
- **Agent**: Claude Code (Opus)
- **Fixes**: Manual Monaco edits are now kept per format (stashed on switch, restored on return, exported in ZIP, persisted). Form `onFocus` no longer wipes them, and a "Restore edits" notice appears when a form change or Reset replaces them. Fixed dropped keystrokes (`flushSync` in the editor's `onChange`) and the mount-time draft restore being overwritten by the content-sync effect. Format deep links beat the saved draft's format. The 23 governance section fields are now persisted (previously lost on reload).
- **Security**: The MCP env value input is masked and never persisted as a literal (only `${VAR}` references), and unedited editor content is not persisted. GitHub ingestion writes `${GITHUB_PERSONAL_ACCESS_TOKEN}` into the MCP config instead of the PAT. The PAT link now points to fine-grained read-only tokens instead of `repo` scope.
- **Engines**: Auditor injection checks skip fenced and inline code and negated guardrail lines; the markup rule no longer flags Vue `<script setup>`. Copilot procedures render as a nested list. Fixed section locator misses for Copilot procedures and `mcpConfig`.
- **Tests**: Added a Vitest suite under `src/app/claude-skills/lib/__tests__` (562 tests: every preset × format, JSON validity, locator ranges, auditor false positives and negatives, slug and share utils, committed snapshots), run with `npm test`.
- **Status**: ✅ Complete (validate-presets pass, lint 0 errors, 562 tests, build 869 routes exit 0, 19/19 Playwright checks on localhost:3000)

### Session: 2026-10-11 — Self-Hosted Monaco & Fonts, Studio Component Split, Repo Hygiene
- **Agent**: Claude Code (Opus)
- **Fonts**: Replaced the CSP-blocked Google Fonts `@import` with `@fontsource-variable/google-sans` and `@fontsource-variable/plus-jakarta-sans`, bundled from npm, so builds still work offline (`next/font/google` fetches at build time, which a comment says the build sandbox can't do).
- **Monaco**: Monaco is now served same-origin from `public/monaco/vs` (gitignored, copied by `scripts/copy-monaco.mjs` on `predev`/`prebuild`); the loader is pointed there via `src/lib/monacoLoader.ts`. Removed `cdn.jsdelivr.net` from the CSP and the preconnect hints. Editor mount went from 17.3s to 1.5s locally.
- **Component split**: `ClaudeSkillsClient.tsx` went from 6,334 to 4,363 lines. New: `components/GovernanceSections.tsx` (22 governance cards, now data-driven; parsed from the old JSX and verified lossless), `IgnoreShieldSuite.tsx`, `McpServerConfigCard.tsx` (with its validation memo), `FormatSelector.tsx`, and `TargetLocationCard.tsx` (moved verbatim).
- **Bug fixed during the split**: Ignore Shield category cards toggled twice per click (label `onClick` plus the label re-dispatching the click to its checkbox), so clicking a card did nothing. Toggles now live on the input's `onChange`; the conventions and behaviors tiles got the same fix.
- **Hygiene**: Untracked (kept on disk, now gitignored) `.idea/`, `install.log`, `push.ps1`, the one-off `add_*`/`fix_*` codemods, a personal video and a personal photo. (Superseded 2026-10-11: the CLI now has a single bin, `cli/bin/devscratchpad.mjs`; the duplicate `.js` was removed in v2.2.0.) Added `.github/workflows/studio-tests.yml` (runs `npm test` on studio changes). ESLint ignores `public/monaco/**`; linting it ran ESLint out of memory.
- **Status**: ✅ Complete (validate-presets pass, lint 0 errors, 562 tests, build 869 routes exit 0, 26/26 Playwright checks on localhost:3000)

### Session: 2026-10-11 — ClaudeSkillsClient Behavior-Preserving Split (Round 2)
- **Agent**: Claude Code (Opus)
- **Change**: `ClaudeSkillsClient.tsx` went from 4,371 to 2,887 lines. Pure logic moved to `lib/` (`auditQuickFixes.ts`, `cliInstall.ts`, `contextSynthesis.ts`, `shareState.ts`, `editorFileName.ts`) with unit tests; JSX moved verbatim to `components/` (`AuditPanel`, `CliInstallPopover`, `EditorStatusBar`, `MobileStudioControls`, `CursorRuleScopeCard`, `IdentityActivationCard`, `StandardSkillCards`), state and handlers passed as props. The CLI format slug now reuses `FORMAT_TO_URL_SLUG` (identical values, pinned by a test).
- **Left in place on purpose**: Monaco element and `flushSync` `onChange`, White Marker effects and decorations, manual-edit stash machinery, persistence effects, the header/H1, and the editor toolbar and restore notice (they wire straight into the manual-edit state). `getEditorFileName` and `resolveTargetInstallFile` are not derived from `getExportTarget()`, because doing so would change displayed paths.
- **Verification**: server-rendered markup compared byte-for-byte against the original on 760 renders (17 formats × 38 UI states, including the open audit panel and CLI popover); the original handler and derived-value code was compiled and compared with the new code on generated inputs. tsc exit 0, eslint 0 errors, 688 tests.
- **Learning**: `vitest run` re-saves `__snapshots__/*.snap` with LF line endings on every local run, so git lists the file as modified with an empty `git diff`. That is not a snapshot change; restore CRLF or ignore it.
- **Status**: ✅ Complete (build intentionally not run in this session)

---

*This document is updated by AI agents after significant sessions. Human maintainers should review and correct any inaccuracies periodically.*




### Session: 2026-10-11 — Studio Info Section, SEO Fixes, Download Toast, Shared Site Nav
- **Task**: Rewrite the studio reference section, fix SEO findings, redesign the download toast, unify navigation on non-AI pages.
- **Changes**:
  1. `AiSkillStudioSeoContent.tsx` rewritten (no H1; file table linking all 17 hubs, good/vague examples, starters, FAQ from `components/studioFaqs.ts` shared with JSON-LD). Hubs pass `activeFormatSlug` and `formatFaqs={hub.faqs}` so hub FAQPage JSON-LD matches visible text.
  2. `ClaudeSkillsClient` takes an optional `heading` prop (H1 above the editor); studio root and format hubs pass it, spokes do not (they have their own H1).
  3. `lib/exportTargets.ts` is the single source for download names and repo paths; `downloadAiKitZip` returns `{ fileName, files }`. MCP config is written to `.mcp.json` (Claude Code's project MCP file), not `claude.json`.
  4. Sitemap `lastModified` comes from git commit dates of each page's sources (fallback constant), blog posts use `updatedAt`.
  5. `PrimaryNav`/`BrandLink` (`src/components/layout/PrimaryNav.tsx`) used by SiteHeader and the workspace TopBar only.
- **Gotcha — AI Skill area keeps its own identity**: The AI Skill Studio and Skill Hub headers must stay their own branded headers (studio: AI Skill Studio title, SKILL folder link, "Cursor .mdc + Claude Ready" pill; hub: back-to-workspace + "AI Skill Hub"). Do not replace them with the shared site nav. The download toast must stay small, minimal and orange (one compact card, bottom-right).

### Session: 2026-10-11 — Main Site UI Pass (Tools, Guides, Fonts, Mobile)
- **Task**: Monochrome redesign of the main workspace and all tool panels, short tool guides without AI Skill Studio promos, better fonts/icons, mobile fixes, tool bug sweep.
- **Changes**:
  1. `src/components/tools/ToolChrome.tsx` holds the shared tool UI vocabulary (ToolHeader, PaneBar, MobilePaneTabs, button/select/input classes, `iconProps`). Tools use `getToolIcon(id)` from `src/components/layout/toolIcons.ts` so header, sidebar, tabs and command palette show the same icon.
  2. `src/components/ShareMenu.tsx` is the single share entry point (copy link via `copyShareLink`, `EmbedDialog`, lazy `ExportImageModal`). Pass the real route slug as `toolSlug` (wrong slugs made share links 404).
  3. `MonacoEditor.tsx` defines `devscratchpad-light` (default) and `devscratchpad-dark` (export image) themes, enforces Geist Mono + no overview ruler, merges `scrollbar` options key by key, and respects an explicit `theme` prop.
  4. Fonts: `@theme { --font-sans: Geist; --font-mono: Geist Mono }` in globals.css. `.font-gemini` (Google Sans) stays on AI Skill Studio / Skill Hub.
  5. `src/lib/useModKeyLabel.ts` renders "Ctrl" or "⌘" for shortcut hints (SSR-safe via useSyncExternalStore).
  6. `useMagicPaste` skips pastes inside `.monaco-editor` on /tools/* and pastes on same-family tools (all cURL targets; JSON-family tools).
  7. Tool bug fixes (with tests in `src/lib/tools/__tests__/` and `src/components/tools/generators/__tests__/`): XML indent width; CSS/SVG/HTML minify no longer strips needed spaces; cert decoder reads SAN/key usage/EKU (@peculiar/x509 v2); SSH "MD5" fingerprint is a real MD5; curl-to-go only imports what it uses; cron shows next runs. Tool helpers live in `tools/converters/`, `tools/generators/`, `tools/security/`.
  8. tsconfig targets ES2017: no regex `s` flag (use `[\s\S]`). The React compiler lint rejects `useMemo` whose deps it can't preserve; move pure work into a plain function.
  9. User feedback round 2: no "Sample" buttons / "Load sample" links in tools (initial editor content is fine), no green success styling (use zinc; red/amber only for errors/warnings), no sparkle/star icons. `ToolHeader` keeps title + controls on one row and wraps controls only when they do not fit; on phones, secondary actions in `actions` collapse to icons (put label text in a `<span>` and the primary button last).
- **Gotcha — two visual identities**: Main site (tools, guides, blog, recipes) is strictly black/white/zinc with no AI Skill Studio promo boxes or star/sparkle icons. AI Skill Studio and Skill Hub keep orange accents, their own headers and the orange folder logo.
- **Decision (resolved)**: `layout.tsx` unregisters every service worker on each load, so the site is NOT offline-capable. Do not claim "offline" for the web tools (use "client-side" / "private" / "in your browser"); only the CLI is genuinely offline.

### Session: 2026-10-11 — CLI v2.2.0
- **Task**: Audit and harden the npm CLI (`cli/`), align the website with it.
- **Changes**: Rewrote `cli/bin/devscratchpad.mjs` (parseArgs, CliError exit codes 0/1/2, no-overwrite + `--force`/.bak, `--dry-run`, `--offline`, 10s timeout, 404 = unknown preset, `audit --min-score/--json`, NO_COLOR). `KNOWN_PRESETS` mirrors `BASE_CODE_SLUGS` in `presetRegistry.ts`; `MCP_PRESETS` mirrors `MCP_SLUGS`. Tests: `cli/test/cli.test.mjs` (node:test, offline), root `npm run test:cli`, `.github/workflows/cli-tests.yml`.
- **Gotcha**: The published npm 2.1.0 had drifted from the repo (9 formats vs 13) under the same version. Bump `VERSION` in the bin and `cli/package.json` together and publish after every CLI change. When adding presets to `presetRegistry.ts`, add them to the CLI catalogue too.
- **Gotcha**: `node --test <dir>` fails on Node 22+; pass the test file path.

### Session: 2026-10-11 — Generator Security Baseline (TAR audit follow-up)
- **Task**: Fix findings from the external TAR Engine audit of `codebase-auditor` (tarai.dev, 35/100 D: SEM-002/003/004/006/007/008, AR-003/005) at the template level.
- **Changes**: `SECURITY_BASELINE` in `ruleGenerator.ts` is rendered as a "Security & Trust Boundaries" section in every instruction format (SKILL.md/Windsurf sections renumbered 5-8). Rewrote the `claude-auditor` preset procedures/directives and its `presetRegistry.ts` keyRules. Removed `meta-prompt-shield` / `credential-safety` behaviors (superseded; old share-state IDs are filtered out harmlessly). `BehaviorGuardrailsCard` shows the baseline as a locked strip. `sectionLocator.ts` patterns for Project-Specific Directives and Implementation Reference are now number-agnostic. Tests assert the baseline in all formats for every preset and that the auditor output has zero `security-*` issues in our own `ruleAuditor`.
- **Gotcha**: Section numbers in SKILL.md / Windsurf output are matched by `sectionLocator.ts`; renumbering headings breaks editor highlighting unless patterns use `\d+`.
- **Gotcha**: Lines in the baseline that mention secrets/tokens must start with "Never"/"Do not" (optionally after a `**Label**:`), or `ruleAuditor`'s exfiltration pattern flags them.
- **Status**: ✅ Complete (831 tests, validate-presets, lint 0 errors, build)
- **Follow-up (CLI v2.3.0)**: `SECURITY_BASELINE` is duplicated in `cli/bin/devscratchpad.mjs` (the CLI has zero deps and cannot import TS); `ruleGenerator.test.ts` fails if the two copies drift, so edit both together. CLI `audit` adds trust-boundary (-10) and confirmation-gate (-5) checks, skipped for llms.txt, ARCHITECTURE.md and ignore files; deductions stay small so an otherwise perfect file still clears `--min-score 80`.
- **Gotcha**: Writing JS through Python/bash heredocs on this machine mangled `\b` (became backspace) and `\n` (became a real newline). Use the Edit tool for regexes and escape sequences.

### Session: 2026-10-11 — MCP Section Redesign
- **Task**: Redesign the AI Skill Studio MCP card and its four intake modals (compact, consistent icons, not bloated).
- **Changes**: `McpServerConfigCard.tsx` rewritten (PRESET_UI icon/short-label map, single context-import row, flat checks). New `components/IntakeModal.tsx` (shell, `IntakeFormatSwitch`, `IntakeRow`, `ScriptList`, `initialIntakeFormat`) used by `GitHubRepoModal`, `LocalFolderModal`, `DdlIntrospectModal`, `DockerInspectModal`. Each modal mounts its body only while open, so the "Write to" format initialises from props without a `useEffect` (removed 3 set-state-in-effect warnings and one `any`).
- **Decision**: MCP env values default to `${VAR}` references (Claude Code expands them from the shell when loading `.mcp.json`). Literal secrets are a warning, never a requirement.
- **Gotcha**: `dockerParser.ts` must fix the service indent from the first service; matching any `name:` within 4 spaces of `services:` turned `ports:` / `depends_on:` into fake services.
- **Status**: ✅ Complete (836 tests, validate-presets, lint 0 errors, build)

### Session: 2026-10-12 — SEO Audit: Re-index Spoke Pages
- **Task**: Audit SEO after ~7 weeks live (Vercel: 506 visitors/30d, 83% bounce; GSC 3 months: 33 clicks, 1.46K impressions).
- **Changes**: Removed the `isCuratedPreset` noindex from `[formatSlug]/[presetSlug]/page.tsx` and the matching sitemap filter (163 → 450 URLs). `/skill` title no longer doubles the site suffix; added its own Twitter card.
- **Decision**: Template-only preset spokes stay indexed. They are ~2.4K words each with ~30% of lines differing between stacks, and GSC showed them earning most of the site's clicks. Improve their uniqueness instead of hiding them. `isCuratedPreset` is still exported but unused.
- **Gotcha**: OpenGraph was never removed. Root, tools, recipes and AI Skill Studio OG images all return 200 image/png. The plain `</>` thumbnail in GSC is Google's favicon fallback, because the homepage has no large in-page `<img>`. Google picks result thumbnails from page images, not og:image.
- **Status**: ✅ Complete (validate-presets, lint 0 errors, build)
- **Follow-up (2026-10-13)**: Vercel Firewall traffic showed Huawei Cloud (AS55990/AS136907) at ~4.0k of 6.7k requests/day with a single Chrome JA4 digest, plus Alibaba (AS45102). These are headless browsers that run JS, so Vercel Web Analytics counts them as visitors (the China/Singapore share). Owner visits come from Nayatel and PERN (university network); PERN is shared with real users, so do not filter by ASN.
- **Decision**: `src/components/layout/SiteAnalytics.tsx` wraps `<Analytics>` and `<SpeedInsights>` with a `beforeSend` that drops events when the `devscratchpad_exclude_analytics` envelope flag is set. Visit any page with `?exclude-me=1` to opt a browser out (`=0` opts back in). `@vercel/analytics` v2 has no built-in opt-out flag.
- **Gotcha**: `loadFromStorageEnvelope(key)` falls back to the legacy studio key by default. Pass the same key as `legacyKey` for unrelated values.

### Session: 2026-10-13 — Bot Filtering & AI Skill Studio SEO
- **Agent**: Claude Code (Opus)
- **Firewall (Vercel API, project `prj_psa0v6NkMIihqOo54yB05BYldmoL`)**: Bot Protection managed rule set to `challenge`; custom rule denying AS55990, AS136907 (Huawei Cloud) and AS45102 (Alibaba); custom `bypass` rule for `^/(api/raw/.*|llms\.txt|llms-full\.txt|sitemap\.xml|robots\.txt)$`.
- **Gotcha — Bot Protection challenges every non-browser client**: with the challenge on, `curl`, the CLI (`/api/raw`), and unverified crawlers get HTTP 429 "Vercel Security Checkpoint" on any path not covered by the bypass rule. Verified bots (Googlebot, Bingbot) still pass. Any new machine-readable endpoint (feeds, JSON, raw files) must be added to the bypass rule, and curl-based SEO checks against production will see 429 on HTML pages, so audit SEO on a local build (`.next/server/app/**/*.html`).
- **SEO changes**: Hubs render `FormatGuide` (in `AiSkillStudioSeoContent.tsx`, only when `activeFormatSlug` is set) with the hub's overview, placement, samples, tips and a link to every preset; hub JSON-LD adds an `ItemList`. All 17 `FORMAT_HUBS` texts were rewritten (they were unused since the 2026-10-09 revert, and several claims were wrong). Spoke titles come from `SPOKE_TITLE_NOUNS` + "Template & Example"/"Template" when within 44 chars; descriptions from `buildSpokeDescription` (curated description + closing line, ≤160). Per-format facts for spoke Step 3 and HowTo JSON-LD live in `ai-skill-studio/components/spokeFormatMeta.ts` (plain module so the server page can import it; the spoke content component is `"use client"`).
- **Decision**: Hub and spoke copy only states what each tool documents. Files nothing loads automatically (OpenAI/Gemini instructions, llms.txt, ARCHITECTURE.md, PRD/DESIGN/TASK/MEMORY.md) are described as conventions the rules file must point to. `.claudeignore` is described as a list mirrored into `permissions.deny`.
- **Left alone on purpose**: MCP spoke `targetFile` stays `claude_desktop_config.json` (CLI install and editor file name tests depend on it); the studio's export path is still `.mcp.json`.

### Session: 2026-10-14 — Audit Panel Redesign & Editor Clipping Fix
- **Agent**: Claude Code (Opus)
- **Bug**: The editor card (`overflow-hidden`, `lg:min-h-[400px]`) clipped the status bar. Header + "Restore edits" notice + the editor's `min-h-[300px]` + status bar added up to more than 400px, so on short viewports the status bar was pushed out of the card. The audit panel's fixed `max-h-[360px]` was also taller than the editor.
- **Fix**: Editor `lg:min-h-[220px]`, notice `shrink-0`, panel `max-h-[min(460px,calc(100%_-_1rem))]` (sized to the editor container).
- **Panel**: score ring + grade + severity counts in the header; findings sorted by severity with "Line N" jumps (`AuditIssue.line`, set by the auditor where a finding maps to a line); Auto-fix only appears when a finding has a one-click fix (count shown); new Budget tab (`getSectionBreakdown`, `TOKEN_BUDGET` exported from `ruleAuditor.ts`) lists sections by token weight and jumps to them; Esc closes the panel.
- **Gotcha**: Don't drop the card's explicit min-height for `overflow-clip` + auto min. The column flexbox's intrinsic height includes the static `<pre>` preview's full text height, so the card would never shrink.
- **Status**: ✅ Complete (ruleAuditor tests 8/8, validate-presets, lint 0 errors, build; verified in Chrome at 1280×720 and 1280×900)

### Session: 2026-10-14 — First-Run Studio Guide
- **Agent**: Claude Code (Opus)
- **Built**: `StudioGuide.tsx` (floating mascot + first-visit offer; the mascot is an inline SVG folder face (`GuideMascot`) on a zinc-900 button, cloned into each popover title as `.studio-guide-avatar`) driving a driver.js tour defined in `lib/studioGuide.ts`. driver.js is imported on click; only its CSS loads with the page. Popover theme lives in `globals.css` under `.studio-guide-popover`.
- **Anchors**: Tour targets are `data-tour` attributes (presets, format, governance, mcp, editor, audit, export) plus existing `data-section` ones. If you rename or remove one, update `GUIDE_STEPS`; missing targets are skipped silently.
- **Gotcha**: `loadFromStorageEnvelope` falls back to the studio's v1 state key by default; pass the guide key as the legacy key too, or a returning visitor's old studio state is read (and migrated) as guide state.
- **Gotcha**: Below lg the editor column is `hidden` while the Configure tab is active. Custom `onNextClick`/`onPrevClick` set the mobile tab, wait two frames, then `moveTo`, so driver.js never measures a hidden element.
- **Gotcha**: driver.js only scrolls elements that are off-screen, so a card on screen but under the sticky studio header stayed covered. While the tour runs, `body.studio-guide-running` unsticks `[data-guide-unstick]` (the header) and hides `[data-guide-hide]` (mascot, mobile action bar); `revealInBand` scrolls each target into view before driver.js measures it.
- **Layout**: Desktop popovers for form-column steps open to the right (beside the card, over the editor column). Below lg the popover is a bottom sheet (`.studio-guide-sheet`, fixed with `!important` over driver's inline position) and targets are revealed in the space above it (`SHEET_SPACE`).
- **Status**: ✅ Complete (studioGuide tests 5/5, validate-presets, lint 0 errors, build; geometry checks pass on every step at 1280×720, 1440×900, 1536×864, 390×844 and 360×740, including tours started mid-page)

### Session: 2026-10-14 — Task Skills, Skill Folders & Companion Files
- **Agent**: Claude Code (Opus)
- **Task presets**: `SkillPreset.kind: "task"` groups workflow presets under the preset bar's Tasks switch (auditor, security guard, TDD, plus new code-reviewer, debugger, commit-pr-writer, safe-refactor, dependency-upgrade). `references` (contents in `lib/taskSkillReferences.ts`) and `subagentTools` are optional preset fields. New slugs are in `BASE_CODE_SLUGS`, `PRESET_ROUTES` (skill_md base routes), `SLUG_ALIASES` and the CLI `KNOWN_PRESETS`.
- **Companion files** (`lib/companionFiles.ts`): files that belong with a format but get no selector button or hub. They are derived from the parent's final text (SKILL.md, Cursor) or the form state, shown in `TargetLocationCard`, and written by the ZIP. `extra: true` ones only go in the ZIP when the user ticks "Include extras" (`lib/kitExtras.ts`, own envelope key, `useSyncExternalStore` so SSR renders `false`).
- **Decision — no file where the tool reads AGENTS.md**: Codex, Cursor, Copilot, Zed, Junie, Cline and Kiro read root AGENTS.md natively (checked against their docs 2026-10-14). Zed uses only the first match and `.rules` beats AGENTS.md, so never generate `.rules`. Gemini CLI and Aider get pointer configs (`.gemini/settings.json` `context.fileName`, `.aider.conf.yml` `read:`), not copies. Custom slash commands are merged into skills (`.claude/skills/<name>/` is `/name`), so no `.claude/commands/` output. SECURITY.md / CONTRIBUTING.md are not generated (no inputs for them; they would be boilerplate).
- **Gotcha — Claude Code ignores `.claudeignore`**: its docs say the file has no effect. `.claude/settings.json` turns the secrets category and custom rules into `Read(...)` deny rules (directories become `dir/**`, negations are dropped) plus `ask: Bash(git push *)`. Don't deny lockfiles, media or `*.sql`: deny is a hard block, not a token saver.
- **Gotcha — SKILL.md bundle stays in the studio**: `bundledFiles` is only passed by the studio, so `/api/raw` and the CLI still serve a single SKILL.md with no "Bundled Resources" section. Task references are kept while `skillName` or `procedures` still match the preset, so they don't leak into imported skills.
- **Gotcha — YAML**: `toYamlScalar` quotes frontmatter descriptions containing `: `, ` #` or a leading indicator. Preset descriptions avoid `: ` anyway.
- **Status**: ✅ Complete (949 tests, CLI tests 22/22, validate-presets, lint 0 errors, build 989 pages; Chrome check of the preset switch, companion list, skill-folder ZIP (verify.sh stored 755), kit ZIP with extras; CLI audit of the exported kit: 13 files, all 100/100)

### Session: 2026-10-14 — Read Your Code (Code Evidence)
- **Agent**: Claude Code (Opus)
- **What**: The GitHub and local-folder imports now read a sample of source files and existing AI rule files, not just the manifest. `lib/codeEvidence.ts` is pure (paths + samples in, findings out); `githubIngest.ts` and `fsPicker.ts` do the I/O and append `evidenceDirectives()` to `synthesizedDirectives`. The apply handlers swap in `codeEvidence.exampleGood/exampleBad` when present.
- **Decision — only state what the code backs**: every detector needs a minimum count and a clear majority, and each directive cites its support ("18 of 20 component files"). Findings are ranked by `TOPIC_ORDER` before the 12-finding cap so formatting is dropped before tests or errors.
- **Decision — entry point**: the Technology Stack header stays two buttons (an earlier session restored it on purpose). Auto-Detect became "Read your code", which opens the GitHub modal; that modal links to the local folder and the pasted-manifest modals.
- **Gotcha — contents API needs `Accept: application/vnd.github.raw+json`**: without it, token reads returned the JSON envelope (base64), so manifests parsed as garbage when a PAT was set.
- **Gotcha — local directives**: `LocalProjectAnalysis.synthesizedDirectives` mixes plain sentences (manifest) with evidence lines that are already bullets (including nested `  - ` carried-over rules); the apply handler only prefixes lines that aren't bullets.
- **Gotcha — `showDirectoryPicker` must be called as a method on `window`**; a detached reference throws "Illegal invocation".
- **Status**: ✅ Complete (see TASK.md for verification)

### Session: 2026-10-15 — Skill Graph (`/graph`)
- **Agent**: Claude Code (Opus)
- **What**: New route `/graph`: a Graph SKILL.md (frontmatter `topology` + `## @node:` sections) edited as Markdown (Monaco) or on a canvas, run in the browser in parallel, exported for Claude Code / Cursor. Pure logic lives in `src/app/graph/lib/` (`graphSkill.ts` parse/serialize/validate/layout, `graphRunner.ts`, `graphProviders.ts`, `graphExport.ts`); UI in `GraphClient.tsx` and `components/`.
- **Decision — Markdown is the source of truth**: canvas/inspector edits go through `serializeGraphSkill`, so they reformat the frontmatter (prompt bodies and the preamble are kept verbatim). Edits are blocked while the frontmatter fails to parse, so a broken file is never overwritten by the last good graph.
- **Decision — no React Flow / dagre**: the canvas is ~400 lines of SVG + absolutely positioned nodes; layout is layered longest-path with barycenter ordering. Node positions are not stored in the file.
- **Decision — what "fresh context" means here**: every node is one stateless call whose request is its rendered prompt plus the payloads of incoming edges that the prompt didn't already reference. The bias meter only counts upstream material; `{{goal}}` is always allowed. Reasoning tags are stripped from outputs.
- **Gotcha — JSON contracts and slices**: when a source returns a JSON object with a key named after the target node, only that slice crosses the edge. A slice is plain text, so the contract check must run on the source output, not the slice (it flagged every splitter edge red before).
- **Gotcha — CSP**: `/graph` is excluded from the catch-all header rule (`graph(?:/|$)` in the negative lookahead) and gets its own block with the provider hosts. Adding a provider means adding its host to `graphConnectHosts` in `next.config.ts`; arbitrary base URLs are not possible.
- **Gotcha — restoring saved state**: `GraphClient` reads localStorage through `useSyncExternalStore` (server snapshot `null`) and mounts `GraphWorkspace` with initial props, instead of `setState` in an effect.
- **Status**: ✅ Complete (990 tests incl. 27 new, validate-presets, lint 0 errors, build; headless Chrome check of dry run, edge inspector, drag-to-connect writing the Markdown, mobile TB layout, headers on /ai-skill-studio and /skill, no console errors). Not verified: a live run with a real API key.

### Session: 2026-10-15 — Skill Graph polish (streaming, blueprints, editor sync, icon)
- **Agent**: Claude Code (Opus)
- **What**: Streaming output, blueprints, two-way editor/canvas selection, undo/redo, resizable panes, pinch zoom, share links, Markdown results, a custom icon. See TASK.md for the list.
- **Decision — icon**: `SkillGraphIcon` is an inline SVG (strokes in `currentColor`, one node in orange-600) so it fits both the monochrome header text and the AI area's orange accent. Use it wherever the graph is linked; don't swap in a lucide icon.
- **Decision — undo history only covers canvas/inspector edits**: Monaco keeps its own undo. An entry can only be undone while the Markdown still equals its `after`; any typing in Monaco after a canvas edit makes the stack stale and it is dropped.
- **Gotcha — Monaco text uses non-breaking spaces**: `.view-line` textContent has ` ` for spaces; normalize before matching text in browser tests.
- **Gotcha — dry-run timing**: `createLlmClient(..., { dryRunTimeScale })` exists so tests don't hit the 5 s vitest timeout; the UI uses the default (1).
- **Gotcha — finishing a run must not steal the dock tab**: it only switches to Result when the Run tab is open; otherwise inspecting a node mid-run gets yanked away.
- **Testing without a key**: a mock OpenAI-compatible server on port 11434 (Ollama's port, already in the `/graph` CSP) with CORS and SSE exercises the real fetch/stream path from the browser.
- **Status**: ✅ Complete (1004 tests, validate-presets, lint 0 errors and no new warnings, build; 20/20 browser checks, no console errors). Not verified: a live Claude run with a real key.

### Session: 2026-10-15 — Skill Graph v2 (no model calls, graph skills for agents)
- **Agent**: Claude Code (Opus)
- **Decision — no API keys on /graph**: the user rejected a BYOK runner. The studio parses, validates, previews and compiles; the agent runs the exported files. The two sessions above describe a runner, providers, streaming and a `/graph` CSP block that no longer exist (`graphRunner.ts`, `graphProviders.ts` deleted; `next.config.ts` and `package.json` back to their earlier state).
- **Decision — the purpose**: a graph skill writes down what a flat SKILL.md leaves the agent to improvise: stages (parallel steps), contracts on edges, fresh-context steps, pass/fail gates, per-step tools and model tier. The orchestrator SKILL.md holds only the plan; each step's prompt lives in its subagent file and loads when that step runs.
- **Gotcha — controlled inputs and a trimming parser**: every inspector keystroke re-serializes the Markdown and the parser trims values, so a typed trailing space vanished ("Onlyverifiedclaims."). Inspector text fields use `useDraft`, which keeps the local text unless the saved value changes for another reason.
- **Gotcha — empty `tools: []`**: Claude Code reads a missing `tools:` line as "inherit every tool", and the exporter omits empty lists, so an empty list is a validation warning; blueprints give the splitter and merger `[Read]`.
- **Gotcha — fonts per route**: `src/app/graph/layout.tsx` imports the fontsource CSS and wraps the route in `.graph-theme`, which overrides `--font-sans` / `--font-mono` (Tailwind v4 `font-sans` resolves through the variable).
- **Status**: ✅ Complete (1007 tests, validate-presets, lint 0 errors with no new warnings, build; 22/22 browser checks, no console errors).

### Session: 2026-10-15 — Skill Graph v2 (no model calls, graph skills for agents)
- **Agent**: Claude Code (Opus)
- **Decision — no API keys on /graph**: the user rejected a BYOK runner. The studio parses, validates, previews and compiles; the agent runs the exported files. The two sessions above describe a runner, providers, streaming and a `/graph` CSP block that no longer exist (`graphRunner.ts`, `graphProviders.ts` deleted; `next.config.ts` and `package.json` back to their earlier state).
- **Decision — the purpose**: a graph skill writes down what a flat SKILL.md leaves the agent to improvise: stages (parallel steps), contracts on edges, fresh-context steps, pass/fail gates, per-step tools and model tier. The orchestrator SKILL.md holds only the plan; each step's prompt lives in its subagent file and loads when that step runs.
- **Gotcha — controlled inputs and a trimming parser**: every inspector keystroke re-serializes the Markdown and the parser trims values, so a typed trailing space vanished ("Onlyverifiedclaims."). Inspector text fields use `useDraft`, which keeps the local text unless the saved value changes for another reason.
- **Gotcha — empty `tools: []`**: Claude Code reads a missing `tools:` line as "inherit every tool", and the exporter omits empty lists, so an empty list is a validation warning; blueprints give the splitter and merger `[Read]`.
- **Gotcha — fonts per route**: `src/app/graph/layout.tsx` imports the fontsource CSS and wraps the route in `.graph-theme`, which overrides `--font-sans` / `--font-mono` (Tailwind v4 `font-sans` resolves through the variable).
- **Status**: ✅ Complete (1007 tests, validate-presets, lint 0 errors with no new warnings, build; 22/22 browser checks, no console errors).

### Session: 2026-10-16 — Skill Graph: loops, checks, lanes and approvals
- **Agent**: Claude Code (Opus)
- **Source**: "Loops and Graphs" by @hanakoxbt (X article 2091515787366306154, Substack mirror). The "Karpathy said" framing on X is unverified promo; the ideas match Anthropic's agent guidance.
- **Decision — additive spec**: new fields (`run`, `check`, `risk`) and types (`code`, `approval`) keep `spec: skill-graph/1`; older files parse unchanged. `runsWithoutSubagent()` is the single test for "no subagent file, the orchestrator does it".
- **Decision — `on_fail` meaning depends on the node**: with a gate it re-runs upstream steps; with only a `check` it re-runs the node itself; on a `code` node it re-runs the direct agent predecessors.
- **Gotcha — every edge already hands its payload**: the previewer puts un-referenced incoming payloads in the task message, so `unread-edge` fires only when a prompt names some upstream inputs but not this one, and never for edges out of `code`/`approval` steps (waiting is their point).
- **Gotcha — `toSlug` moved** to `graphSkill.ts` (graphPlan needs it for payload paths; importing graphExport would be circular). graphExport re-exports it.
- **Status**: ✅ Complete (1037 tests, validate-presets, lint 0 errors with no new warnings, build; headless Chrome check of the new blueprint, inspector and plan, no console errors).

### Session: 2026-10-16 — Skill Graph: guide, share cards, SEO and security hardening
- **Agent**: Claude Code (Opus)
- **Decision — model/tools allowlist**: both are written verbatim into `.claude/agents/*.md` frontmatter, so `MODEL_PATTERN` / `TOOL_PATTERN` in `graphSkill.ts` are errors in validation and filters in `buildSubagent`. A newline in either could add `permissionMode`, `hooks` or `mcpServers` to an exported subagent from a share link.
- **Decision — shared graphs are untrusted**: opening a link seeds the undo history with the previous draft and shows `SharedReview` (commands, Bash, Edit/Write, MCP) until dismissed.
- **Gotcha — next/og fonts**: Satori reads ttf/otf/woff, not woff2, so the fontsource packages cannot be used; static woff files live in `src/app/graph/_og/`. CSS radial-gradient dot grids do not tile in next/og; the card draws its dots as SVG circles.
- **Gotcha — backslashes through the Bash tool**: `\` inside heredoc'd scripts got halved, which wrote a real NUL byte into a regex. Build backslashes with `String.fromCharCode(92)` or use the Edit/Write tools.
- **Open — storage eviction**: `saveToStorageEnvelope` still evicts other tools' data on a quota error; the new size caps make that unreachable from /graph, but the behaviour is shared.
- **Status**: ✅ Complete (80 graph tests, validate-presets, lint 0 errors with no new warnings, build).

### Session: 2026-10-16 — Skill Graph: no-code authoring
- **Agent**: Claude Code (Opus)
- **Decision — the minimum is nodes, edges, prompts, name and description**: every edge already delivers its payload, so references and contracts are refinements. The UI hides them behind Insert input, auto-defined contracts and a collapsed Advanced panel; the guide leads with the same message.
- **Gotcha — contract names commit per keystroke**: `setEdgeContract` drops the previous contract when it has no description and no edge uses it, otherwise typing "findings" would define f, fi, fin…
- **Gotcha — Monaco virtualizes lines**: an e2e check that reads `.view-lines` misses text that is off screen; read the autosaved source instead. A CDP script (Node 24 global WebSocket + installed Chrome) works without Puppeteer.
- **Status**: ✅ Complete (86 graph tests, validate-presets, lint 0 errors with no new warnings, build).

### Session: 2026-10-16 — Skill Graph: review fixes
- **Agent**: Claude Code (Opus); fixes from a fresh-context verifier pass (12 findings, all confirmed and fixed).
- **Gotcha — unknown edge ends**: the Markdown is parsed on every keystroke, so edges can point at ids that do not exist yet. `predecessorsOf`/`successorsOf` drop them; never `find(...) as GraphNode` on an edge end.
- **Gotcha — one default per setting**: `on_fail` unset means stop in the inspector, plan panel and export; `isKeyedJson` is the single rule for when a JSON output is split per target.
- **Gotcha — plain-object maps**: `graph.contracts[name]` resolves `constructor`/`toString`; use `getContract`. `__proto__` is refused as a contract name.
- **Gotcha — CRLF files**: `src/lib/storage.ts` has Windows line endings, so multi-line string replacement in scripts silently misses; use the Edit tool there.
- **E2E**: `%TEMP%/graph-e2e/check2.mjs <project> <outdir>` drives the installed Chrome over CDP (26 checks). Open about:blank and then `Page.navigate`: the /json/new request drops a `#graph=` fragment.
- **Status**: ✅ Complete (1064 tests, 22 CLI tests, validate-presets, lint 0 errors, build, 26/26 browser checks).

### Session: 2026-10-16 — Skill Graph: bolder share cards
- **Agent**: Claude Code (Opus); the user found the /graph link preview too faint in WhatsApp.
- **Gotcha — preview size**: chat apps show the 1200×630 card at roughly a fifth of its size, so text under ~22px and 2px strokes vanish. Size share-card type and strokes for the thumbnail, not the full image.
- **Gotcha — Satori backgrounds**: a `radial-gradient` with `backgroundSize` does not tile into a dot grid in next/og; draw repeated patterns as plain SVG circles (no `<pattern>` support).
- **Status**: ✅ Complete (validate-presets, lint 0 errors, build).

### Session: 2026-10-16 — Skill Graph: mobile editor white blockage & node card text clipping fixes
- **Agent**: Antigravity (Gemini)
- **Gotcha — sibling `flex-1` panes in mobile tab views**: In `GraphClient.tsx`, `<main>` is `flex-col` below `lg`. Hiding only the inner `<section>` children of `rightPaneRef` while leaving `rightPaneRef` itself as `flex flex-1` caused an empty `flex-1` container to steal 50% of the vertical viewport height below the Markdown editor on mobile. Always toggle `hidden` (`mobileView === "editor" ? "hidden" : "flex"` with `lg:flex`) on the outer flex-item wrapper itself, and pair mobile `flex-1` with `lg:flex-none` when desktop uses an explicit width (`lg:w-(--editor-w)`).
- **Gotcha — Flexbox `min-height: auto` with `line-clamp-2`**: `line-clamp-2` sets `overflow: hidden`, which changes a flex child's automatic minimum size from its content height to `0`. Inside a fixed-height `justify-between` card (`NODE_HEIGHT`), any vertical deficit is absorbed entirely by the `line-clamp-2` label, slicing the bottom of the second line without triggering an ellipsis. Fix by giving the card sufficient inner height (`NODE_HEIGHT = 96`, `px-3 py-2.5`) and adding `shrink-0` to the header, `line-clamp-2` label, and footer.
- **Gotcha — Monaco sticky scroll on mobile**: Monaco's default `stickyScroll` pins nested YAML headers at the top of the viewport, creating a white overlay bar over the first lines on compact screens; disable with `stickyScroll: { enabled: false }`.
- **Status**: ✅ Complete (1064 tests, validate-presets, lint 0 errors, build).


### Session: 2026-10-16 — Skill Graph: share card redesign & unfinished-work sweep
- **Agent**: Claude Code (Opus)
- **Decision — share card carries one message**: feeds show it at ~1/4 size, so anything under ~18px is noise there. Flat white, no gradients, one orange word in the headline, a top-to-bottom graph (lets four nodes be large on a 548px panel). Check every change at a 320px thumbnail, not just 1200px.
- **Gotcha — X's large card draws the domain over the image's bottom-left corner**: keep the URL and other content out of that corner.
- **Gotcha — OG image URL hash comes from the route file only**: Next.js puts `?<contenthash>` of `opengraph-image.tsx` / `twitter-image.tsx` in the meta tag, not of the modules it imports. Redesigning `_og/shareImage.tsx` alone kept the same URL, so LinkedIn Post Inspector showed the old cached card. Change the dated comment in all four graph route files on every design change.
- **Gotcha — Satori headline highlight**: split the line into `<span>`s inside a `whiteSpace: "pre"` flex row, or the spaces around the highlighted word collapse.
- **Gotcha — per-type Inspector branches**: the spec lets every node type carry `risk`/`check`/`gate`, but each Inspector branch and exporter function picks its own subset. When adding a field, grep `codeStepLines`, `approvalStepLines`, `verificationLines` and each `node.type ===` branch in `InspectorPanel.tsx`.
- **Status**: ✅ Complete (1071 tests, validate-presets, typecheck, lint 0 errors, build).

### Session: 2026-10-18 — Skill Graph: audit fixes, Batch A
- **Agent**: Claude Code (Opus)
- **Context**: `SKILL_GRAPH_PLAN.md` (written by another agent) was checked against the code first. Confirmed 1.1, 1.2, 1.4, 1.5, 1.6; 1.3 and 2.1 only partly (keyed JSON for >1 successor is by design; `{{inputs}}` cannot collide with `groupAlias("input")` since `inputs` is checked first everywhere); 2.2 and 2.3 are not bugs.
- **Decision — validator tool list ≠ picker list**: `KNOWN_TOOLS` drives the Inspector chips, so extra Claude Code tools live in a private `VALID_TOOL_NAMES`; adding to `KNOWN_TOOLS` adds chips.
- **Gotcha — kit audit regressions**: `graphAudit.test.ts` runs the real CLI on every blueprint kit. Any new text in `nodeInstructions` / `HANDOFF_RULES` must keep a "never", an "untrusted" and an "approved/confirm" phrase, or agent files drop below 85.
- **Gotcha — `nodeInstructions` is shared** by the studio context preview and the exported subagent files; a line added there shows in both.
- **Status**: ✅ Complete (1080 tests, 23 CLI tests, validate-presets, typecheck, lint 0 errors, build).

### Session: 2026-10-18 — Skill Graph: audit fixes, Batch B
- **Agent**: Claude Code (Opus)
- **Decision — unset tools mean "may edit files"**: matches Claude Code (no `tools:` inherits every tool) and the share banner. New typed nodes start read-only instead, so UI fan-outs stay quiet until the user lifts the limit.
- **Decision — gate retry follows the path, not one node**: a gate often sees only a diff or reviews, so it gets the list of upstream steps it may name (with "edits files" marks); after re-running named steps the orchestrator re-runs everything between them and the gate. Proper `retry_target` stays in the `skill-graph/2` roadmap (plan 3.3).
- **Gotcha — keyed JSON slicing lives in `jsonKeysFor`**: handOff, the context preview and the splitter's key list all read it; don't reintroduce `node.id` slicing inline.
- **Status**: ✅ Complete (1093 tests, 23 CLI tests, validate-presets, typecheck, lint 0 errors, build).

### Session: 2026-10-18 — Skill Graph: audit fixes, Batch C
- **Agent**: Claude Code (Opus)
- **Decision — routing slots, not edge bending**: long edges reserve a thin slot per column inside `layoutGraph` (Sugiyama dummy nodes), so ordering makes room for them; the canvas only follows `layout.routes`. Pills of long edges sit in the gap after the source because a lane is narrower than a pill in TB.
- **Decision — group aliases are scoped to the reading step**: in ship-a-change `implement` and both reviewers are all `worker`s, so a global `{{workers.output}}` in the gate would have pulled in `implement`.
- **Gotcha — headless visual check without Puppeteer**: build a share hash with `encodeShareHash` (vite-node), then `chrome --headless=new --window-size=4200,1300 --screenshot=… http://localhost:3000/graph#graph=…`; a very wide window fits the canvas near 100%, a tall one (height > 1.1 × width of the canvas) switches it to TB.
- **Status**: ✅ Complete (1112 tests, 23 CLI tests, validate-presets, typecheck, lint 0 errors, build).

### Session: 2026-10-18 — Skill Graph: audit fixes, Batch D
- **Agent**: Claude Code (Opus)
- **Decision — undo carries the selection**: `commit(next, selectionAfter)` records what the edit leaves selected; handlers that change the selection must pass it, or undo/redo restores the wrong thing. The selection default is the current one.
- **Decision — file handoffs need a design call**: a Claude Code subagent's answer lands in the orchestrator's context anyway, so file handoffs save re-typing (C1) or context (C2, needs write access on every step). See `SKILL_GRAPH_V2_RFC.md`.
- **Gotcha — headless UI driving without Puppeteer**: launch Chrome with `--remote-debugging-port`, talk CDP over Node 24's global `WebSocket`, set React inputs with the native value setter plus an `input`/`change` event, and call `Emulation.setFocusEmulationEnabled` first, or `blur()` never fires and commit-on-blur fields (node id) silently keep only a draft.
- **Status**: ✅ Complete (1115 tests, 23 CLI tests, validate-presets, typecheck, lint 0 errors, build, 12/12 browser checks).
- **Gotcha — compiler strings are Markdown**: `handOff`, `outputSummary` and plan lines are written for SKILL.md (backticks around ids). Any studio panel that shows them must render them (`PlanText` in `PlanPanel.tsx`), not print them raw.
- **Gotcha — Monaco DOM text uses ` ` for spaces**: normalise `.view-line` text before matching it in browser checks.

### Session: 2026-10-18 — Skill Graph: retry targets, checked contracts, learning from runs
- **Agent**: Claude Code (Opus)
- **Decision — learning from hard signals only** (user's call, after reviewing Harness², Google Research): lessons come only from failed checks/commands, `GATE: FAIL` lines and retries; they are auto-applied next run, and bake-in in the studio is optional. Probing (N candidates per step) is deferred.
- **Decision — reflect is a subagent with `tools: Read`**: Claude Code reads no tools list as "every tool", so Read is the smallest grant. Its file is written by the orchestrator, keeping steps read-only.
- **Gotcha — fresh-context steps get only their "Hand it" line** (handoff rule 4): anything every step must receive (lessons) has to be on that line, not only in an intro paragraph.
- **Gotcha — `.skill-graph/**` cannot re-include EXPERIENCE.md**: git never re-includes a file whose folder is ignored; use `/*/*` + `!/*/EXPERIENCE.md`.
- **Gotcha — template edits move test counts**: ship-a-change now exports 7 subagents (reflect included) and its gate offers only implement onward.
- **Status**: ✅ Complete (1138 tests, validate-presets, typecheck, lint 0 errors, build).

### Session: 2026-10-18 — Skill Graph: `skill-graph/2`, fan-out and file handoffs
- **Agent**: Claude Code (Opus)
- **Decision — `{{item}}` shadows a node named `item` inside fan-out steps** (`isItemRef`); every ref resolver (validator, isolation, readPredecessors, jsonKeysFor, preview, toAgentPrompt) must check it first.
- **Gotcha — a fan-out run returns one entry**: contract lines in `nodeInstructions` describe the collected array, so they are worded differently for `foreach` steps.
- **Gotcha — the 63 lint warnings outside src/app/graph are left on purpose** (user's call, 2026-10-18); do not fix them unasked.
- **Gotcha — stopping a `npm run dev` background task leaves `next dev` running** (PID in `.next/dev/logs`); a second `npm run dev` exits with "Another next dev server is already running". `npm run build` still works beside it.
- **Status**: ✅ Complete (1160 tests, validate-presets, typecheck, graph lint clean, build).

### Session: 2026-10-18 — Skill Graph: probing
- **Agent**: Claude Code (Opus)
- **Decision — probe only read-only steps** (user asked for probing): Claude Code's `isolation: worktree` subagents branch from the remote default branch (no uncommitted work, no node_modules) and do not return their path, so candidates that edit files cannot be compared or merged reliably. Probe the plan, not the implementation.
- **Decision — the judge returns the answer itself** (`CHOSEN`, `WHY`, `---`, answer), so it can combine two candidates without the orchestrator doing the step's work.
- **Gotcha — Python heredoc edits of TS with `
` or backticks** broke twice (escapes became real newlines, or the match failed); use the Edit tool for strings with escapes.
- **Status**: ✅ Complete (1170 tests, validate-presets, typecheck, graph lint clean, build).

### Session: 2026-10-18 — Skill Graph: movable cards and side panel
- **Agent**: Claude Code (Opus)
- **Decision — positions live in the graph file** (`layout:`, last in the frontmatter), so a placement survives reloads, share links and kits; agents ignore it and the compiled skill is unchanged.
- **Decision — the first drag pins every card**, so moving one never makes the others jump to a different automatic layout; Tidy is the way back.
- **Gotcha — CSS % on the side panel is relative to the canvas + panel area**, not `<main>`; the splitter's `measurePanel` must measure the same element (`rightPaneRef`).
- **Gotcha — viewport breakpoints (`sm:`) do not fit a 400px panel**: Inspector grids are fixed two-column now; use container queries if a wider variant is ever needed.
- **Gotcha — headless browser checks of drags need real input**: `Input.dispatchMouseEvent` over CDP (synthetic PointerEvents fail `setPointerCapture`).
- **Status**: ✅ Complete (1177 tests, validate-presets, typecheck, graph lint clean, build).


### Session: 2026-10-18 — Skill Graph: readable default framing
- **Agent**: Claude Code (Opus 5.5)
- **Fix**: between the editor and the side panel the canvas is ~570px wide, so a 5-layer LR graph fit at ~25%. User wants LR kept (tried auto-flipping to TB; rejected). auto-fit now floors at `AUTO_FIT_MIN_ZOOM` (fit button uses `whole`). `autoFit` ref is now `"readable" | "whole" | null`.
- **Gotcha — absolute overlays in the canvas collide on narrow widths**: keep the bottom controls and hint in one flex row; use `@container` queries on the canvas, not viewport breakpoints.
- **Status**: ✅ Complete (validate-presets, lint, build).


### Session: 2026-10-18 — Skill Graph intro video
- **Agent**: Claude Code (Opus 5.5)
- **Output**: `promo_assets/skill-graph-video/` — `scene.html` (deterministic scene, `seek(t)`), `render.py` (Playwright frames → ffmpeg, parallel segments joined with `-c copy`), `skill-graph-intro.mp4` (40 s, 1080p60, no audio). Story: build the graph → studio reveal → select Verifier (Markdown + Inspector follow) → plan walk-through → Export kit file tree → end card.
- **Decision — a recreated scene, not a screen recording**: frame-exact motion and camera moves; it mirrors the real UI (zinc + orange, Manrope + JetBrains Mono, real labels, real export paths) and must be updated by hand if /graph changes.
- **Gotcha — round line caps on `pathLength=1` strokes leave dots at dashoffset 1**; hide undrawn strokes.
- **Voice-over**: `voiceover.py` narrates with Kokoro (offline neural TTS, voice `af_heart`; venv + models in `C:/Users/User/.tts/kokoro`, not in the repo) → `skill-graph-intro-voiceover.mp4`. Lines are timed to scene moments in `SCRIPT`; retime them if scene.html timings change. Windows only ships robotic SAPI voices (David/Zira/Mark).
- **Status**: ✅ Complete (no app source changed, so no build/lint run).

### Session: 2026-10-20 — Skill Graph: Instagram in-app browser zoom-out
- **Agent**: Claude Code (Opus 5.5)
- **Fix**: `GraphSeoContent` two-column grid had no base `grid-cols`, so on mobile the implicit `1fr` (= `minmax(auto,1fr)`) track grew to the `<pre>` code sample's width (page 778px at 375px). Added `grid-cols-[minmax(0,1fr)]`.
- **Gotcha — in-app browsers (Instagram, Facebook; Android WebView overview mode) zoom out to fit any horizontal overflow**, so one wide element shrinks the whole page; Chrome just scrolls sideways and hides it. Grids/flex items holding `<pre>`/tables need `minmax(0,1fr)` / `min-w-0`. Check with `document.documentElement.scrollWidth` at 375px.
- **Status**: ✅ Complete (validate-presets, lint, build).

### Session: 2026-10-20 — Skill Graph connector for Claude
- **Agent**: Claude Code (Opus 5.5)
- **ADR — remote MCP without sign-in**: the user wants Claude to use Skill Graph, started from the site, with no accounts, no Supabase and no API keys. Anthropic's consumer OAuth cannot be used by third-party sites, so the site is a connector Claude calls, not a client of Claude. Without accounts OAuth has nothing to do, so the connector is authless. Tool inputs are processed in memory and dropped; only tool names are logged. This is the one scoped exception to ADR-001 (recorded in AGENTS.md and CLAUDE.md).
- **Layout**: `src/app/graph/mcp/route.ts` (HTTP: origin, size, version, status codes) → `lib/mcpProtocol.ts` (JSON-RPC, testable) → `lib/graphConnector.ts` (tools, prompts) → the existing checker and compiler. `lib/graphReference.ts` holds the format docs used by both the guide and `get_graph_format`.
- **Directory rules that shaped it** (claude.com/docs/connectors/building/submission and review-criteria): every tool needs `title` and `readOnlyHint`/`destructiveHint`; names ≤ 64; descriptions must not tell Claude how to behave; actionable errors; docs URL, privacy URL, support contact and icon required; submit at claude.ai/directory/manage from a paid plan. Invalid Origin → 403, but too strict an allowlist breaks Claude, so a missing Origin is allowed.
- **Status**: ✅ Built and verified locally; deployment, firewall bypass, real-Claude test and submission still to do.

### Session: 2026-10-21 — Skill Graph: connector feedback round
- **Agent**: Claude Code (Opus 5.5)
- **Source**: a real claude.ai test of the connector (receipt app workflow) plus Claude's 8-point feedback; the user asked for all of it and the Skill Graph logo in Claude.
- **Decision — short links without storage**: no server storage (ADR-001), so links stay self-contained: `#g=<d><data>` is raw DEFLATE (fflate, sync, same code in studio and connector) against preset dictionary `<d>` (one base64url char) from `lib/graphShareDictionary.ts`: dictionary 0 = every distinct starter-graph line + the format's repeated lines; 1–10 = that plus one starter graph. The encoder tries all (≤ 60 KB sources) and keeps the shortest. Starter graphs ~60 chars, edited starters ~180, fresh graphs ~1/3 of LZ. The connector also returns a Markdown link label.
- **Gotcha — the share dictionaries are FROZEN**: a link only opens with byte-identical dictionary text; `graphFeedback.test` pins their SHA-256. Never edit or derive them from the live blueprints; append new dictionaries instead. Decompression is capped with a preallocated `out` buffer (fflate truncates there).
- **Decision — draft_graph takes an outline, not prose**: the server has no model, so Claude writes `{name, description, steps[{id,type,task,after,returns,keys,gate,tools}]}` and `lib/graphDraft.ts` writes the format (input `request`, keyed split for orchestrators feeding several steps, contracts from `returns`/`keys`, read-only default tools).
- **Gotcha — the connector icon**: as a custom connector, Claude ignores `serverInfo.icons` and shows `google.com/s2/favicons?domain=<last two host labels>`, i.e. the DevScratchpad `</>` favicon of devscratchpad.tech; a subdomain cannot change it (anthropics/claude-ai-mcp#152, #838). Only a separate registrable domain whose homepage favicon is the Skill Graph mark, or Anthropic fixing #152, changes it.
- **Gotcha — same-page hash navigation**: going from /graph to /graph#g=… in one tab does not reload, so the link is not opened (true for `#graph=` too); browser tests must go through about:blank.
- **Gotcha — YAML anchors**: `stringifyYaml` aliased shared arrays (`tools: &a1`) in fan-out blueprints; `aliasDuplicateObjects: false` now.
- **Status**: ✅ Complete (262 graph tests, browser check, validate-presets, lint, typecheck, build).

### Session: 2026-10-21 — Skill Graph: connector review round 2
- **Agent**: Claude Code (Opus 5.5)
- **Source**: a second real Claude test (candidate-scoring panel): draft_graph wrote judges reading `{{parse_candidates.judge_correctness}}` while the contract described a candidates array, the checker said 0 warnings, and the dry run said "every handoff lines up" while the final step got only the auditor's notes.
- **Decision — an orchestrator with keys or returns is data, not a splitter**: split only when the outline says nothing about its output, or `split: true`. Splitting is right for blueprint-style planners but silently wrong for parsers.
- **Decision — verifiers pass the work on (the recommended default; the user said "go" without picking)**: drafted verifiers that feed later steps are told to hand on the checked work with their notes, matching the blueprints ("Reject unverified claims"), instead of auto-wiring extra edges.
- **Gotcha — a structural "reads only a verifier" rule fires on 8 of 10 blueprints**, and a "keyed ref without required" rule on all 10 splitters. `reads-only-review` is therefore gated on the verifier prompt lacking pass-on words (`PASS_ON_WORDS` in graphSkill.ts) and on no contract on its edge; the keyed-key gap is closed at run time in `contractChecks` instead of with a warning.
- **Gotcha — the checker cannot read prose**: a contract description that contradicts the keys is undetectable unless `required` is set; the dry run's Sees lines are the honest backstop, and the tool docs now say so.
- **MCP probe (same day)**: the endpoint held up against protocol edge cases and heavy inputs; the gaps were an uncaught throw answering as a Next.js HTML 500 (now `isError` tool result / JSON-RPC -32603), the body read before the size check (now a Content-Length precheck), and tool results too large for Claude: clients cut results past ~100k characters silently, and a 200-step kit was 287k. `compile_graph` now sends whole files up to 80k and names the rest with the download link. Typical kits (8–20 steps) are 16–33k and unaffected.
- **Status**: ✅ Complete (286 graph tests, 1252 total, validate-presets, lint 0 errors, typecheck, build, live MCP curl).

### Session: 2026-10-21 — Skill Graph: landing page, /graph/studio, kit download page
- **Agent**: Claude Code (Opus 5.5)
- **Decision — landing first** (user: opening straight into the editor "not professional"): `/graph` = landing, `/graph/studio` = editor, `/graph/download` = kit page for connector links. Share links stay hash-based, so old `/graph#g=` links are forwarded client-side by an inline script in `graph/page.tsx`.
- **Decision — no OAuth just to hide Claude's "No sign-in" notice**: without accounts it would be a sign-in anyone can pass; the setup page explains the notice instead.
- **Gotcha — studio links must be full page loads**: on a Next `<Link>` navigation the new page renders before the URL changes, and `GraphClient` reads hash/query once before mounting, so `?blueprint=` and `#g=` links to the studio use `<a>`.
- **Gotcha — headless Chrome `--window-size=390` lays out wider than 390** (minimum window width) and crops; check mobile with Playwright `viewport` + `scrollWidth`.
- **Video for the web**: `ffmpeg -ss 3.25 -to 36.0 -i skill-graph-intro-voiceover.mp4 -vf "fps=30,fade=in:0.25 / fade=out at 32.35 (color 0xf4f4f5)" -crf 25 -ac 1 -b:a 96k -movflags +faststart` → `public/videos/skill-graph-demo.mp4`. Re-cut if scene.html timings change.
- **Status**: ✅ Complete (267 graph tests, Playwright 16/16, validate-presets, lint 0 errors, typecheck, build).
- **Redesign round 2 (same day)**: the gradient version was rejected as well ("still could not like colour choice and gradient and design… professional, fast, not ai slope"). Rebuilt as a restrained editorial layout: left-aligned, 1120px grid, hairline rules, white, flat orange-600 on one button and one word, real artefacts instead of mock-ups. `BUTTON_PRIMARY`/`BUTTON_SECONDARY` in `components/theme.ts` are flat now. Round 3: the flat orange-600 button was "shiny"; the primary button is now the studio's soft orange tint, and the headline word is orange-800.
- **Gotcha — inline `<script>` in a React component warns on client navigation**: React never runs scripts it renders on the client, and Next 16 shows "Encountered a script tag while rendering React component" when /graph is reached by in-app navigation. `next/script` with `beforeInteractive` is root-layout only. The share-link forward is a client component with `useLayoutEffect` (brief flash of the landing page on an old `/graph#g=` link, which only legacy links hit).

### Session: 2026-10-22 — Skill Graph: analysis and plan (`SKILL_GRAPH_V3_PLAN.md`)
- **Agent**: Claude Code (Fable 5.1)
- **Ask**: analyse the MCP connector and Skill Graph as a tool, plan to make it more powerful, and add "a self loop file" to the MCP.
- **Reading of "self loop"**: two things the format and connector lack. (1) A step cannot iterate on itself: the only loops are gate/check retries with no ledger, and cycles are refused. (2) The connector compiles but never referees a run, so contracts, gate parsing and retry counts are enforced by prose in SKILL.md, not by code. The plan proposes `loop:` on a node (`until: check | gate | done`, `max_iterations`, a ledger file `.skill-graph/<slug>/<id>.loop.md` that survives iterations and runs, additive, no self-edge so `buildPlan` is unchanged) and `start_run`/`advance_run` tools whose whole state travels in a DEFLATE token (still stateless, still `readOnlyHint: true`).
- **Cheapest big win found**: `edit_graph` with a list of operations; today every change is a full-source round trip. `draft_graph` cannot express `check:`, so the "loop on tests" pattern cannot be drafted.
- **Verified**: 289 graph tests pass; live `/graph/mcp` answers `tools/list`. Build/lint not run (no source changed).
- **Status**: 📝 Plan written; built the same day (next entry).

### Session: 2026-10-22 — Skill Graph: loops, run referee, edit and lessons tools
- **Agent**: Claude Code (Fable 5.1, then Opus 5.5)
- **Ask**: "build the things, so nothing holding it back" after the plan; §6 decisions taken as recommended.
- **Decision — `loop:` is a node field, not a self-edge**: the DAG, stages and `buildPlan` stay unchanged; the loop is how one step runs, like `foreach`. Stays `skill-graph/1` (it changes no output's meaning). The orchestrator, not the step, writes the ledger, so loop steps need no Write tool.
- **Decision — the run object holds no outputs**: Claude retypes the run on every advance_run call, and a DEFLATE token of every output would be tens of thousands of base64 characters where one wrong character breaks it. The run is plain JSON (~0.5–4k chars, capped at 40k) with the graph as its `#g=` hash; tasks name inputs by task id, and each answer is checked when reported. No HMAC: tampering only changes the user's own run.
- **Decision — stale answers**: task ids carry `/tryN` per re-issue, so an answer to an older attempt is ignored instead of taken for the new one. A call that starts nothing new re-lists the open tasks.
- **Gotcha — `nodeFromEntry` / `nodeToEntry`** in graphSkill.ts are now the one place a node is read from and written to frontmatter; a new node field goes there (and in `STEP_FIELDS` in graphEdit.ts for edit_graph).
- **Gotcha — the parser clamps, edits refuse**: `asProbe`/`asCount` cap numbers silently for hand-written files; edit_graph compares the written value and refuses `probe: 9` instead of saving 4.
- **Gotcha — structured output**: a tool with `outputSchema` must return matching `structuredContent` on every non-error result, including validate_graph's "could not be read" answer (it is not `isError`).
- **Gotcha — a dev server may already be running**: `npm run dev` exits 1 when another `next dev` for this folder is up (it prints its PID); use that one on :3000.
- **Validation round (user: "validate things")**: a fresh-context reviewer subagent (given the code, not my conclusions, per the AGENTS.md verifier stage) found 9 real bugs in the referee and editor, all fixed; my own 54 adversarial probes and the all-starters smoke had missed them because they only exercised the paths I had designed. Keep doing the independent review for state machines.
- **Gotcha — the referee only learns a fan-out list from `checkShape`**: anything accepted on another path (command steps, a fan-out step's assembled array) must set `items[consumer]` itself (`markDone` does it for fan-out sources now).
- **Gotcha — per-item bookkeeping needs per-item keys**: `contractRetries` and `retries` for fan-out items are keyed `step/itemN`, never by step alone.
- **Gotcha — `isValidNodeId` allows `constructor`/`toString`**: `reserved-id` is now a checker error, and every id-keyed map in a run object is `Object.create(null)`.
- **Status**: ✅ Built and validated (1295 tests, validate-presets, typecheck, lint 0 errors, build, MCP Inspector against the dev server, live start_run → advance_run, studio screenshot). Not done: deploy, submission, real-Claude test of a refereed run, loop script export.

### Session: 2026-10-22 — Skill Graph connector: everyday use in the Claude app
- **Agent**: Claude Code (Opus 5.5)
- **Ask**: make the connector useful to common users in the Claude app: run-it-all tool, chat-native tools, saved workflows, plain-language templates, visible progress, plain labels.
- **Decision — connector only**: the user rejected the first pass, which also relabelled the studio (Checker on cards, Repeat for each sections), grouped the blueprint menu, edited the guide and landing page and added a `/graph/run` "My workflows" page. All reverted; everything lives in `src/app/graph/lib/` and the connector's own docs page.
- **Decision — run_graph keys answers by step id**: Claude writes every step's answer inside one tool call; the chat runner matches them to the referee's pending tasks (exact task id, then `step`, `step/check`, `step/itemN`, list entries) and feeds round after round, each answer at most once per call. A run where every check passes takes 2 calls (1 if answers come with the workflow).
- **Decision — saved workflows without storage**: `save_workflow` returns the studio link (run_graph accepts it), a rerun prompt and a Claude Project instruction line. No server storage (ADR-001), and the browser-side list went with the reverted page.
- **Decision — everyday starters are connector-only**: `EVERYDAY_WORKFLOWS` + `CONNECTOR_TEMPLATES` in graphTemplates.ts; the studio imports `BLUEPRINTS`, which is unchanged.
- **Gotcha — check/contract tasks carry the answer ref in `feedback`**: only work/item/candidate/command tasks with feedback are "sent back".
- **Gotcha — the referee's 40k run-object cap fires before a reply gets huge** when many entries are sent back with long reasons; each pending task stores its reason.
- **Gotcha — shell heredocs and `python -c` mangle backslashes and backticks** in this Bash tool; edit TS with the Edit tool or a Python script written to a file.
- **Gotcha — a deleted route leaves `.next/dev/types/app/<route>`** from a running dev server, which fails `npm run build`'s type check; delete those generated files.
- **Gotcha — tasks that are not graph steps**: `reflect` has no node, so any loop over open tasks that starts with `byId.get(task.step)` silently drops it; handle `task.kind === "reflect"` first. The judge and reflect wording in `renderTask` is Claude Code wording (subagents, Read/Grep); the chat runner writes its own judge text.
- **Gotcha — a loop's next try carries feedback too** ("Iteration N did not end the loop"), so "has feedback" does not mean "sent back"; the chat runner reports it as `repeat`.
- **Validation pattern that worked**: a generic driver (`%TEMP%/sg-scratch/all-starters.test.ts`) answers whatever run_graph asks, shaped by the graph (`wantsJsonOutput`, `jsonOutputKeys`, contract `required`, foreach lists, `GATE: PASS`, loop notes, exit codes), and asserts every starter reaches `done` under 80k characters. Two fresh-context review rounds found 7 bugs my own tests had missed; keep doing both for the referee.
- **Status**: ✅ Complete and validated (1332 tests, validate-presets, typecheck, lint 0 errors, build, MCP Inspector, live MCP). Not done: deploy, real-Claude test.

### Session: 2026-10-22 — sg-sem: quick-look review, outline rejections fixed
- **Agent**: Claude Code (Opus 5.5)
- **Task**: Review the Colab quick-look run of `ml/sg-sem/sg_sem.ipynb` (`QUICK_LOOK = True`, so no training ran yet)
- **Findings**: 22 of 24 round-1 outlines were rejected by `draftGraph`, leaving 16 seeds (14 starters + 2 drafts), too few for a per-graph split. One H1 buried-problem answer marked the wrong sentence; one H4 answer was broken JSON.
- **Changes**: `scripts/semantic/pipeline.ts`: `cleanOutline` drops empty optional step fields before drafting; round2 prints the top rejection reasons; assemble counts `h4-unreadable`.
- **Gotcha — Qwen copies every template field, empty**: `"foreach": ""` or `null` fails `readStep`'s foreach check and rejects the whole outline. Clean outlines in the pipeline; keep the connector's drafter strict.
- **Gotcha — the notebook's outputs live in the Colab commit on `origin/sg-sem`**, not the local file; the data lives on the user's Google Drive (`MyDrive/sg-sem`), which is not synced to this machine.
- **Status**: ✅ Fix verified with draftGraph probes and a mock end-to-end run (64 seeds, 2023 examples); validate-presets, lint 0 errors, build pass. Next: another quick look, then the full run with training.

### Session: 2026-10-22 — sg-sem: second quick-look review, label noise filtered
- **Agent**: Claude Code (Opus 5.5)
- **Task**: Review the second Colab quick look (Colab commit `5bfb66b`)
- **Findings**: Round 1 now drafts 38 of 48 outlines (52 seeds). Remaining problem is label noise: an `honest_pass` (label 0) with no concrete evidence read the same as a `no_evidence_pass` (label 1); a `buried_problem_pass` flagged advice ("ensure all claims are current") as the open problem; `resolved_problem_pass` answers often had no fix in them; H4 gates came as questions and Qwen mislabelled them ("Are there any conflicting sources?" as `not`); 18 of 36 H1 answers were dropped with no reason recorded. The quick look only reached 2 graphs because `--limit` took the first requests in file order.
- **Changes**: `llmPrompts.ts`: `readH1` returns `{ reject }` with a reason and checks each style's text (evidence = a digit or quoted phrase; buried problems use problem words and no fix; resolved passes state a non-negated fix); sharper style prompts; H4 asks for statements in one list per label (`{"checkable": [...], "partly": [...], "not": [...]}`), dropping questions and repeats. `pipeline.ts`: round-2 request ids carry a prompt hash (`@xxxx`), so changed prompts are asked again instead of reusing old answers; `cleanOutline` adds a fan-out's source step to `after`; 3 H1 samples per style (was 2). `generate.py`: `--limit` takes turns across kind/style and graph; counts only answers to current ids. Notebook: quick look 48, review cell shows 2 newest answers per kind and style.
- **Gotcha — answers are resumed by request id**: a prompt change with the same id silently reuses answers to the old prompt. Keep `keyedByPrompt` on every round-2 request; round-1 ids have no hash (seed names come from them).
- **Status**: ✅ Readers checked against the real run-2 answers (7 cases), mock end-to-end run (214 seeds, 7679 examples, nothing dropped), typecheck, validate-presets, lint 0 errors, build. Next: a third quick look to see the new drop reasons, then the full run.

### Session: 2026-10-22 — sg-sem: third quick-look review
- **Agent**: Claude Code (Opus 5.5)
- **Task**: Review the third Colab quick look (Colab commit `65d82a9`, `--limit 24`)
- **Findings**: Every cell ran. Round 1: 72 outlines, 55 drafted (17 rejected, mostly invalid step `type` and `foreach`), 69 seeds. Round 2: 2226 requests (h1 1992, h4 166, h2 68). Assemble: 695 examples; the new readH1 filters caught bad JSON, a resolved pass with no fix and advice flagged as a problem. Two problems were left: `no_evidence_pass` answers were one sentence (4 of 6 dropped as `length`), and `splitSentences` split "Dr. Smith" into two `[SEN]`. The review cell's old version raised KeyError on answers to old prompt ids; the committed cell skips them.
- **Changes**: `semanticInput.ts`: `splitSentences` does not break after titles, common abbreviations or single-letter initials (test added). `llmPrompts.ts`: `no_evidence_pass` asks for exactly 3 sentences, each its own list entry (changes only those request ids).
- **Watch**: real drafted graphs give few H2 requests (68 for 69 seeds; the mock gives 211 for 64), so H2 positives will be scarce next to its ~300 negatives.
- **Status**: ✅ semanticInput tests (9), validate-presets, lint 0 errors, typecheck, build. Next: the full run (`QUICK_LOOK = False`).

### Session: 2026-10-22 — sg-sem: pipeline validated before the full run
- **Agent**: Claude Code (Fable 5.1)
- **Task**: Check every step the quick looks did not exercise, so the full run is not wasted
- **Findings**: The base model id `nreimers/MiniLM-L12-H384-uncased` is no longer public on Hugging Face (401): training would have crashed after ~3 h of generation. The real quick-look answers, run through `readH1` locally, reproduce Colab's drop reasons exactly. Drafted graphs give few H2 requests because Qwen's outlines are linear chains (an H2 request needs a step with two or more predecessors).
- **Changes**: base model → `microsoft/MiniLM-L12-H384-uncased` (same weights; train.py, notebook, make_notebook.py, spec). Outline prompt asks for at least one step that reads from two earlier steps. Training smoke-tested locally on CPU on the full-size mock data (7679 examples, 12 steps): writes metrics.json, errors.md, sgsem.json, best.pt, last.pt.
- **Gotcha — a changed base model id also lives in `sg_sem.ipynb`** (cell 1), not only in train.py's default; the notebook passes `--base` explicitly.
- **Status**: ✅ semanticInput tests (9), validate-presets, lint 0 errors, typecheck, build, training smoke test. Next: the full run (`QUICK_LOOK = False`), ~3–3.5 h on an L4, nearly all of it round 2.

### Session: 2026-10-23 — sg-sem: first full run (minilm-1) read; thresholds fixed
- **Agent**: Claude Code (Opus 5.5)
- **Task**: Read the full Colab run's results and take the next step
- **Results (generated test split)**: 171 seeds, 7659 examples (H1 1497 / H2 928 / H3 733 / H4 2792 train after balancing, far under the spec's targets). 4 epochs, 1.1 min. H1 precision 0.98 at 0.5, AUROC 1.0; H2 precision 1.0 / recall 0.90 at 0.5, AUROC 1.0; H3 precision 0.64 / AUROC 0.74; H4 macro-F1 0.87 vs gate-vague 0.22, "not" precision 0.91.
- **Findings**: H2 "missed" the bar only because the threshold picker took the lowest dev threshold with precision ≥ 0.9 (0.044 for H2, 0.016 for H1). On ~30 dev positives that sits on the edge and test fell to 0.875. H3 does not learn (loss ~0.6, dev predictions the same from epoch 1): a description swap changes none of the 16 features, and 733 examples are too few to learn the text comparison. AUROC 1.0 on H1/H2 is generated-data easy, so only the gold set can show real precision. Some of the "worst errors" in errors.md for H1 are generator label noise (e.g. a `resolved_problem_pass` that still reports 3 of 5 courses).
- **Changes**: `train.py` thresholds aim for 0.95 on dev and never go below 0.5. H4 now reports precision at its threshold, and the ship check uses that for every head.
- **Gotcha — rerunning the training cell with the same RUN re-evaluates without retraining**: `last.pt` holds epoch 4, so the loop is skipped and only the final dev/test pass runs.
- **Status**: ✅ threshold picker smoke-tested locally. Next: rerun the training cell (re-evaluation), then the gold set (spec §8.2). H3 stays out of v1 unless more seeds fix it.

### Session: 2026-10-23 — sg-sem: gold set built; notebook section 6 scores it
- **Agent**: Claude Code (Fable 5.1)
- **Task**: After the first full run passed its own test split (H1, H2, H4 true with the fixed thresholds), build the honest measure: the gold set (spec §8.2).
- **Changes**: `ml/sg-sem/gold/`: 7 hand-written graphs (`graphs.json`, drafted through `draftGraph`; topics outside the 50 training topics), 42 verifier answers with sentence labels (`h1.json`), 28 cut edges whose task names the data in plain words (`h2.json`), 56 gates by label (`h4.json`); `scripts/semantic/gold.ts` builds `gold/examples.jsonl` (164 examples) with the same serializers and fails loudly when a sentence count or span does not match. `sgsem/evaluate.py` scores a run at its saved thresholds (no refitting). Notebook section 6 runs both; `make_notebook.py` now keeps saved outputs of unchanged cells and defaults to `QUICK_LOOK = False`.
- **Gotcha — H2 gold positives are built differently from training**: training cut an edge and replaced `{{ref}}` with a phrase; gold removes the step from `after` so the drafted prompt never had the block, and the task names the data in plain words. That is what a real missing edge looks like, so a drop on gold H2 is informative, not a bug.
- **Status**: ✅ gold builds (164), evaluator smoke-tested on `.data/runs/smoke` (CPU), lint, typecheck. Next: run section 6 on Colab (~1 min, no generation, no training), read `meets_bar`; H3 stays out of v1; then export (§9) for the heads that hold.

### Session: 2026-10-23 — sg-sem: gold set results for minilm-1
- **Agent**: Claude Code (Fable 5.1)
- **Results (164 hand-written examples the model never saw; run's own thresholds)**: **H4 ships**: "not checkable" precision 0.95, recall 0.90, macro-F1 0.84 vs 0.21 for `gate-vague`. **H1**: precision 1.0, recall 0.32: it flags all 7 no-evidence answers and none of the 15 buried problems (each predicted 0.99 consistent, including sentences with "failed" and "no limit"). **H2**: recall 0, AUROC 0.61 (chance).
- **Lesson — a generated test split is not evidence**: the same model scored AUROC 1.0 on H1 and H2 on data its generator wrote. Only the gold set showed H2 learned nothing usable.
- **Status**: gold results read; cause analysis and data fix next (H2 positives, H1 buried problems). H3 and, until fixed, H2 stay out of v1.

### Session: 2026-10-23 — sg-sem: why H1 and H2 failed on gold, and the data fix (run minilm-2)
- **Agent**: Claude Code (Fable 5.1)
- **Cause, H2**: `draftGraph` names every input with a heading block `READ RECEIPTS:\n{{read_receipts}}` (the step id in capitals). The pipeline's positive swapped only the `{{ref}}` for a phrase, so the heading stayed while the `[INPUT] read_receipts` line vanished: the model learned a token match between heading and input id. Gold has no heading, so recall was 0. Verified on the local mock data (positive and negative share `text_a`; only the heading/input match differs).
- **Cause, H1**: every training "buried problem" sentence had to contain a problem word (`PROBLEM` regex), and honest answers were required to be concrete, so the model learned "numbers everywhere = honest". Gold buried problems stated through numbers ("Equipment totals 27,300, which is above the 25,000 cap") scored 0.99 consistent.
- **Changes**: `pipeline.ts`: `withoutInput` removes the all-caps heading block of the cut input (a written heading like "The claims:" stays and its reference becomes the phrase, as before); H2 requests run in `phrase` mode (inline ref) or `quote` mode (the LLM quotes the task words naming the data; null → dropped `h2-not-named`); single-input steps allowed, a step left with no input is reconnected to the request; cap 6 per seed; the kept-edge negative keeps the identical `text_a` as a hard negative. `llmPrompts.ts`: fifth H1 style `buried_number_pass` (problem stated only through a number, date or comparison; filter requires `CONCRETE`, not a problem word). Spec §7.1 row updated. Notebook `RUN = "minilm-2"` so training starts fresh instead of resuming epoch 4 of minilm-1.
- **Cost on Colab**: only new request ids are generated (prompts changed → new hashes): ~1,500 H1 (new style × 3 samples) + ~1,000 H2 ≈ 1 h on an L4; round 1 and the other 4,700 answers are reused. Then assemble, train (~1 min), gold (~1 min).
- **Gotcha — the rerun training cell resumes**: with the same `RUN`, `last.pt` at epoch 4 means no training happens; a new data set needs a new `RUN` name.
- **Status**: ✅ mock pipeline end to end (round1 → round2 → assemble), lint 0, tsc 0, validate-presets, build. Next: Colab cells 1–4, then sections 3 (round 2), 4, 5, 6; read gold `meets_bar`.

### Session: 2026-10-23 — sg-sem: gold set results for minilm-2 read
- **Agent**: Claude Code (Fable 5.1)
- **Results (gold, run's own thresholds; minilm-1 → minilm-2)**: **H4 holds again**: "not checkable" precision 0.95, recall 0.90, macro-F1 0.81 (was 0.84). **H1 flipped**: precision 1.0 / recall 0.32 → precision 0.62 / recall 0.95: it now catches 21 of 22 problems but flags 13 of the 20 honest or resolved answers, all of them number-dense ledgers ("Personnel 128,400 of 150,000; Equipment 22,000 of 25,000"). **H2 still nothing**: recall 0, AUROC 0.36 (below chance), and even the generated test split had recall 0 at the 0.5 threshold.
- **Cause, H1**: the new `buried_number_pass` style is the only training style written as terse figure-against-limit comparisons; Qwen's `honest_pass` answers are prose with a number in them. So the shortcut moved from "numbers = honest" to "comparison form = problem"; the model never had to read the direction of a comparison.
- **Cause, H2**: data starvation, not (only) a shortcut: 474 of the `quote`-mode requests were dropped `h2-not-named` (a drafted task with a heading block never names the data in words), leaving 68 positives against 644 negatives (`balance` caps at 3:1 → ~270 rows). The notebook's gold cell prints only the first 5,000 chars of `errors.md`, which is all H1, so the H2 errors were not visible.
- **Changes (run minilm-3)**: `llmPrompts.ts`: sixth H1 style `honest_number_pass` (terse ledger, every figure within its limit, label consistent; filter wants 2/3 concrete sentences and rejects an `OVER_LIMIT` word such as "exceeds" or "above the"). H2 `quote` mode replaced by `insert`: the LLM writes one sentence naming the data in plain words plus the words of it that name the data (`readH2Insert`); `withoutInput(prompt, pred, replacement)` puts the sentence where the heading block stood, so the positive reads like gold ("... The request: {{goal}} Use the scores of every criterion for the final grade. OPTIONS: {{options}}"). Spec §7.1 row updated. Notebook `RUN = "minilm-3"`; the two error cells print every head's section of `errors.md`, not the first 5,000 chars.
- **Cost on Colab**: new ids only: ~1,500 H1 (new style × 3 samples) + ~500 H2 insert requests; the phrase-mode H2 answers and everything else are reused. Then assemble, train, gold.
- **Status**: ✅ mock pipeline end to end (854 H2 positives, 400 of them insert mode, 0 span mismatches; 642 ledger H1 rows all label 0), tsc 0, lint 0 errors, validate-presets, build. Next: Colab cells 1–4, then sections 3 to 6; read gold `meets_bar`. If H1 still flags honest ledgers, the next lever is the gold set size (20 honest answers is too few to judge at 0.9), not another style.

### Session: 2026-10-23 — sg-sem: gold set results for minilm-3 read
- **Agent**: Claude Code (Fable 5.1)
- **Notebook fix**: the two `errors.md` cells stored the `split("\n## ")` separator as a real line break (Colab JSON), so Python saw an unterminated string; both lines carry a proper `\n` escape again. The gold cell also needs its `python -m sgsem.evaluate` line: `gold.ts` only writes `gold/examples.jsonl`, the evaluator writes `metrics.json` and `errors.md`.
- **Training (1.0 min, 4 epochs)**: train h1 2056 / h2 1514 / h3 733 / h4 2792. Generated test: H1 precision 0.97 recall 0.99; H2 precision 0.77 recall 0.96 at 0.5, AUROC 0.96 (threshold fitted at 0.85: precision 0.83 recall 0.64); H3 AUROC 0.75 (no threshold); H4 macro-F1 0.86, "not" precision 0.93. Bar on test: h1 ✅ h2 ❌ h3 ❌ h4 ✅.
- **Gold (minilm-2 → minilm-3)**: **H4 holds**: "not checkable" precision 1.0, recall 0.86 at threshold, macro-F1 0.90 (ships). **H1 moved to the middle**: precision 0.62 / recall 0.95 → 0.82 / 0.82 (18 of 22 problems caught; 4 of 20 honest or resolved answers flagged: grant `resolved`, api-rate-limits, apartment-shortlist, podcast-show-notes `honest`, all 0.86–0.93; the two misses are both flaky-test-hunt `buried` problems at 0.95+). The honest-ledger style helped (13 → 4 false flags) but the bar needs ≤ 2 of 20. **H2 still fails, in a new way**: AUROC 0.36 → 0.69, but every one of the 28 gold positives is predicted "kept" at 0.99–1.0; at the fitted 0.85 threshold precision 0 / recall 0. Saturated misses, not borderline: the model is sure, and wrong, so another threshold will not fix it.
- **Features (corrected later this day)**: first read as "not a feature leak" because the positive and its kept negative share the node. Wrong: the leak check below shows the facts alone separate cut from kept at 0.90 AUROC (one predecessor fewer, the all-inputs-are-the-request flag after the reconnect).
- **Working hypothesis for H2**: a cue in the text that separates Qwen-built positives from hand-written ones. Gold positives have other inputs' heading blocks still in A and plain-word mentions of data whose heading IS present ("budget totals" + `BUDGET REVIEW: {{budget_review}}`); the generated test errors show the same shape missed there too (`cut worker3` with WORKER1/WORKER2 headings left, predicted kept 0.98) and heading-less kept steps flagged as cut (`kept orchestrate_request`, 0.87). Consistent with "a heading block in A → kept; none → cut", which is the single-input majority of the generated set. Unverified: the training rows are on Drive.
- **Next (not done)**: before another data style, a probe in Colab against `runs/minilm-3`: take 3 gold cut positives, write minimal variants (other headings removed; B shortened to the request only; the plain mention of the cut data removed) into a small jsonl and run `sgsem.evaluate` on it; whichever edit flips the prediction names the cue. Then either fill the generated set with multi-input cuts (require ≥ 2 inputs for H2 positives, or cut each input of a multi-input step in turn) or drop the heading blocks from A for H2 altogether so only the words count. H1: grow the gold honest/resolved set past 20 before judging 0.9; the two flaky-test misses are "buried in the middle sentence of a PASS ledger", the style the generated data has least of.
- **Probe added**: `ml/sg-sem/sgsem/probe.py` (`python -m sgsem.probe --run runs/minilm-3 --data gold/examples.jsonl`; `--dry-run` prints the variants without a model) scores every gold H2 positive as is and with one change at a time (other heading blocks removed; B = the request line only; the span phrase replaced by "the data"; the as-written gold negative as control) and prints p(cut) per column with means. New last cell of notebook section 6. `make_notebook.py` was the source of the separator bug (`"
## "` inside a plain triple-quoted string); now `\n`.
- **Probe result (Colab, minilm-3)**: nothing in the text moves it. Mean p(cut) over the 28 gold positives: as is 0.07, no heading blocks 0.06, B = request only 0.08, mention removed 0.05, as-written control 0.06; only 1 of 28 reaches 0.5 in any column. Gated checker steps and plain worker steps score alike, so the 16 facts are not the lever either. The model is blind to these rows: whatever it reads in the generated positives is absent from every hand-written one.
- **Lead**: `withoutInput` removes only an all-caps heading block, never `The request: {{goal}}`; a generated single-input cut is left with no `{{reference}}` at all, while every as-written step keeps at least one. The test-split false positive `kept orchestrate_request` (no reference, predicted cut 0.87) has that shape; all gold positives keep a reference. Second candidate: the Qwen insert sentence itself ("Use ... for ...") as the cue.
- **Probe extended + leak check**: `probe.py` gains columns `no references` (every block goes, `{{goal}}` too), `insert sentence` (a generated-style sentence naming the cut input appended), `features zeroed`. New `sgsem/leak.py` (`python -m sgsem.leak --data {DATA}/examples.jsonl`): per label and row kind (cut / kept / as written) the share of A with no reference, blocks in A, lines in B; then train-split bag-of-words classifiers on text A only, text B only, facts only, with test AUROC against each negative kind (scikit-learn, added to requirements; Colab has it). New last cell of section 6.
- **Status**: probe dry-run OK on the 28 gold positives (22 have an as-written twin and an insert sentence); leak check smoke-tested on gold. No pipeline or web code changed, so the TS gates were not rerun. Colab notebook commit `c8387a8` holds the run's outputs; they were carried into the regenerated notebook. Next: run the probe cell on Colab against `runs/minilm-3` and read the column means.

### Session: 2026-10-23 — sg-sem: H2 cue found; dropped and swapped negatives (run minilm-4)
- **Agent**: Claude Code (Opus 5.5)
- **Probe (Colab, minilm-3, 28 gold positives, mean p(cut))**: as is 0.07; no heading blocks 0.06; no references 0.06; B = request only 0.08; mention removed 0.05; features zeroed 0.12; **insert sentence 0.61** (14 of 22 at or above 0.5). Only a generated-style sentence ("Use ... for this step.") wakes the head; the hand-written mentions woven into gold prose do not.
- **Leak check (Colab, generated H2, 1,875 rows)**: test AUROC of one-side classifiers: text A only vs kept 0.49 / vs as written 0.98; text B only vs kept 0.89; facts only vs kept 0.90. Rows with no `{{reference}}`: 464, exactly half positive (the no-reference lead is ruled out). **Cause**: no negative shared the positive's input list and facts, so "a generated sentence in A (separates from as-written) and a shorter input list (separates from kept)" scored the generated test without ever comparing A with B.
- **Changes**: `pipeline.ts` assemble: H2 answers that made a positive are kept per step (`h2Answers`); a second pass adds, for every insert-mode cut, *dropped* (edge cut, block gone, nothing in its place, label 0) and, for every other insert answer on the same step, *swapped* (edge cut, the other input's sentence where the cut block stood, that input's heading kept, label 0). New helpers `namedIn` and `cutStep` (the cut edit, now shared with the positive). `sgsem/data.py` `balance`: "as written" rows are trimmed first, so the built hard negatives survive the 3:1 cap. `sgsem/leak.py` reports every negative kind. Spec §7.1 row updated. Notebook `RUN = "minilm-4"`.
- **Mock check**: 400 dropped and 400 swapped from 854 cuts; all 800 have a positive with the same seed, pred and identical input list; swapped vs its positive: identical facts, A differs only in which input the sentence names. Leak on mock: B only vs dropped / swapped 0.54 / 0.54, facts only vs swapped 0.48 (vs dropped 0.95: the positive's prompt is a sentence longer). A only vs swapped 0.96 on mock is the template sentence naming fixed ids; read it on real data.
- **Cost on Colab**: no new text-model calls (same prompts, answers reused): cells 1–4, round 2 (skips), assemble, leak cell, train, gold, probe.
- **Status**: ✅ tsc 0, validate-presets, lint 0 errors (63 old warnings), build. Next: run minilm-4 on Colab; read the leak cell first (want vs swapped near 0.5 on every side), then gold `meets_bar`. If gold H2 recall stays near 0 with the leak closed, the remaining gap is the style of the mention: generated positives append a sentence, gold weaves the words into the task; next lever would be positives from a step whose prose already names the input (round-1 outlines that name their data in words).
- **minilm-4 result (Colab `62d0a43`)**: regeneration was instant as planned (round 2: 9239 answered, 0 to go). H2 rows 2682: cut 580, kept 580, dropped 525, swapped 282, as written 715. **Leak, partly closed**: vs dropped, B only 0.53 / facts only 0.59; vs swapped, A only 0.57. Still open: A only vs dropped 0.96 (the sentence is there or not, by design) and B / facts vs swapped 0.80, because swapped exists only on steps with ≥ 2 insert answers, so the single-input cuts have no twin of that kind. Generated test: H2 precision 0.68 recall 0.84, AUROC 0.95. **Gold: H2 unchanged in effect**: precision 0 / recall 0, AUROC 0.51 (minilm-3: 0.69); probe means as is 0.04, insert sentence 0.58 (15 of 22), every other column ≤ 0.07. H1 gold 0.71 / 0.77 (minilm-3: 0.82 / 0.82; H1 data unchanged, the `balance` reorder and seed shift are the only differences, 42 rows); H4 holds (not-precision 0.95, 1.0 at threshold; macro-F1 0.82).
- **Reading**: the head detects a generated-style appended sentence. Taking away the input-list shortcut did not make it read woven mentions, because no training positive has one. The data has to change, not the negatives.

### Session: 2026-10-23 — sg-sem: woven H2 positives (run minilm-5)
- **Agent**: Claude Code (Opus 5.5)
- **Why not quote mode again**: minilm-2 asked the text model to quote words in drafted tasks that already name an input; 474 were "not named" (68 positives). Drafted tasks name their inputs only through heading blocks, so the words have to be written, not found.
- **Changes**: `llmPrompts.ts`: H2 `insert` mode replaced by `weave` (`h2WeaveRequest`, `readH2Weave`): given the step's outline task and every input it reads, the text model rewrites the task naming each input in plain words inside its sentences, returns the words naming the target, and the same rewrite without that mention ("reword, about as long"). The reader rejects a phrase missing from the task, a phrase (or all its content words) left in `without`, braces, all-caps headings, hyphenated/underscored step ids, bad lengths (`h2-weave-<reason>` in `dropped`). `pipeline.ts`: `Seed.outline` (the cleaned outline a draft came from) in seeds.jsonl; `redraft` drafts the seed again with one step's task and after changed, exactly as `gold.ts` builds gold cuts (heading blocks, request block for a step left with no input). Per weave answer: *cut* (woven task, input gone, label 1, span = the words), *kept* (that prompt on the original graph: identical text A), *dropped* (`without`, input gone: identical input list and facts except fact 7, prompt length). Phrase mode (starters' inline refs) unchanged and keeps its old answers (same prompt hash). Insert answers and the swapped negatives are gone. `H2_PER_SEED` 6 → 8. `leak.py`: a built negative kind is compared only with the positives that have a twin of that kind. Test: dropped twins checked; the old H1 assertion fixed for `buried_number_pass` (it failed on `62d0a43` already). Spec §7.1 row. Notebook `RUN = "minilm-5"`, review cell shows answers per H2 mode.
- **Mock check**: 100 weave triples, leak vs dropped: B only 0.33, facts only 0.33 (identical); A only 1.00 (the mention is the only difference, by design); vs kept: A only 0.43.
- **Cost on Colab**: new text-model calls only for the weave jobs (~600–800, 400 tokens max; the round-2 cell skips the 9k answered). Then assemble, leak, train, gold, probe.
- **Status**: ✅ tsc 0, vitest 1343/1343, validate-presets, lint 0 errors (63 old warnings), build. Next: run minilm-5; read `stats.json` `dropped` for `h2-weave-*` (if most weave answers are rejected, look at the review cell before training), then the leak cell (vs dropped: B and facts near 0.5), then gold H2. Success = gold H2 AUROC well above 0.69 and the probe's "as is" column up from 0.04.
- **minilm-5 result (Colab `e397058`)**: **the weave prompt failed**: of 573 weave answers only ~55 were usable (dropped: length 416, phrase-not-in-task 82, phrase-in-without 14, braces 5). The review cell shows why: Qwen put a whole sentence in `phrase` and only the removed words in `without`. H2 rows 988 (cut 109, about half of them starter phrase-mode; kept 109, dropped 55, as written 715); train positives 87 (minilm-4: 580 cuts). Generated test H2: precision 0.80 recall 0.67, AUROC 0.94 on 12 positives. **Gold H2: AUROC 0.37, 0 of 28** (minilm-4 0.51); probe "as is" mean 0.05, every column ≤ 0.10, the insert-sentence column fell to 0.02 (no insert rows left). Leak: vs dropped B 0.32 / facts 0.52 (closed); vs kept B / facts 1.00 (by design: identical A); **vs as written every side ≥ 0.90**, so positives are told from as-written rows without comparing A with B. The kept twin (cut prompt on the original graph: an input with no heading block and no reference) is a graph no gold row resembles; the gold negative of a gold cut is the same task with every input and heading block, and no generated row looked like that. H1 gold 0.78 / 0.82 (H1 data unchanged); H4 holds (not-precision 1.0, macro-F1 0.84).

### Session: 2026-10-23 — sg-sem: why five runs left H2 at chance; pair-trained base (run msmarco-1)
- **Agent**: Claude Code (Opus 5.5, then Fable 5.1)
- **Diagnosis, after reading the model and training code rather than the data again**: every run from minilm-1 to minilm-5 changed the data recipe (a new H1 style, quote → insert → weave mode, kept / dropped / swapped twins) while four things never moved. (1) The base `microsoft/MiniLM-L12-H384-uncased` is a raw masked-language model that has never been trained on a text pair; H2 asks whether words in A are supported by a line in B, and the model had to learn matching from scratch. (2) It had 87 (minilm-5) to 580 (minilm-4) H2 positives against the spec's 8,000, about half from the three starter graphs. (3) H2's dev split holds 10 positives: its temperature and threshold are fitted on 10 rows, and the checkpoint is chosen by the mean of all four heads, which H1 and H4 dominate. (4) Training is 4 epochs, 744 steps, 0.8 min on an A100, H2 drawing ~18% of the batches (~135); its loss was still falling at the end (0.63 → 0.43 across epochs 3–4). Each run closed one shortcut (the input list, the facts, the appended sentence) and the model, with no matching ability of its own and few positives, took the next one; the gold set of 7 hand-written graphs (28 cuts, several on the same step) never looked like the Qwen outlines, so nothing learnt there carried over. H4 ships every run because "not checkable" is readable from A alone; H1 hovers near 0.8/0.8 for the same data-volume reasons.
- **Change**: notebook `BASE = "cross-encoder/ms-marco-MiniLM-L12-v2"`: the same MiniLM-L12-H384 network (its config says so), same 30,522-word vocab, `type_vocab_size` 2, Apache-2.0, trained on ~500k MS MARCO query–passage pairs; `AutoModel` loads its BERT body and drops the ranking head, so `model.py`, the ONNX export size and the TypeScript tokenizer are unchanged. `EPOCHS = 10` passed to `sgsem.train`. Run renamed `msmarco-1`. Spec §2 encoder row, epochs row and licence line updated.
- **Still open, in order of leverage if msmarco-1 does not clear the bar**: more H2 positives (cut every input of every multi-input step, every seed; the spec target is 8k, the runs had 1–7% of it); a dev split with more than 10 H2 positives and the checkpoint chosen per head; feature dropout so the 16 facts cannot carry H2 alone; the DeBERTa-v3-xsmall bake-off the spec already plans.
- **Changes**: `llmPrompts.ts` `h2WeaveRequest`: the answer is `{"task", "task_without"}`, and the words naming the cut input are marked with square brackets inside `task` instead of copied into a `phrase` field, with one worked example (survey/interviews, not a gold topic). `readH2Weave` takes the one bracketed part as the span (`h2-weave-brackets` when there are none, several, or any in `task_without`) and adds `off-task` (under a third of the original's content words kept: the example copied); `phrase-not-in-task` is gone (true by construction). `pipeline.ts`: a fourth row per weave answer, *drafted* (`redraft` with the woven task and the full `after`: heading blocks for every input, label 0), built exactly like gold's as-written negative of a cut; `h2-drafted-checker-error` counted. Mock answers in the new format. `leak.py`: `swapped` → `drafted`. Test: bracket, off-task rejects; every drafted row has its cut's span words and at least as many inputs. Spec §7.1 row. Notebook run `msmarco-1`.
- **Cost on Colab**: the weave prompt changed, so its ~573 jobs run again (~2 min on the A100); the other 9k answers are reused. Training is ~2 min at 10 epochs.
- **Status**: ✅ tsc 0, vitest 1343/1343, validate-presets, lint 0 errors (63 old warnings), build. Next: run msmarco-1; first `stats.json` `dropped` `h2-weave-*` (want most of the 573 usable; if not, read the review cell before training), then the leak cell (new column vs drafted), then gold H2 and the probe's "as is". If gold H2 stays near chance with several hundred woven cuts and gold-style twins, the generated steps themselves differ from gold too much (short drafted tasks, mostly single-input) and the next lever is the cut population (multi-input steps only), not the text.
- **msmarco-1 result (Colab `c4d3423`)**: **weave prompt works now**: 312 of ~573 answers rejected (off-task 123, brackets 77, phrase-in-without 60, length 43, still-named 7, step-id 2), the rest usable; H2 positives 315 (train 249 / dev 37 / test 29; minilm-5 had 87 train positives) against 1,552 negatives (kept, drafted, dropped, as written 715). Training 2.3 min; best checkpoint epoch 7 (dev mean 0.823); H2 train loss 0.47 → 0.08 by epoch 10 while dev H2 AUROC stayed 0.78–0.81 (F1 at 0.5 ≈ 0.51, fitted threshold 0.866 = precision 1.0 / recall 0.24 on dev). Generated test H2: precision 0.75 / recall 0.62, AUROC 0.84 (minilm-5 0.94: the drafted twins are harder negatives), span F1 0.71. **Gold H2: first movement, still far off**: AUROC 0.37 → 0.58, 2 of 28 positives above 0.5 (apartment-shortlist cut collect 0.83, grant compliance 0.75), 0 of 28 above the fitted 0.866, span F1 0.37; the 26 misses sit at p(kept) 0.94–0.96, saturated as in minilm-3. **Probe (mean p(cut), 28 gold positives)**: as is 0.16 (minilm-5 0.05); mention removed 0.10 (the words count a little for the first time: apartment collect 0.83 → 0.06, grant requirement 0.31 → 0.07, budget 0.34 → 0.07); **B = request only 0.22, the highest column** (apartment score_each 0.05 → 0.86, api-rate-limits routes 0.06 → 0.30, propose 0.04 → 0.22, grant eligibility 0.06 → 0.27); no heading blocks 0.15, no references 0.14, features zeroed 0.16, as-written control 0.06. **Leak (Colab `0d8ec85`, a Run-all that resumed after epoch 10, so same model)**: H2 1,867 rows (cut 315, kept 315, drafted 261, dropped 261, as written 715); lines in B: cut 1.15, dropped 1.16, as written 1.32, kept 1.60, drafted 1.66. One-side AUROC: B only vs kept 0.90 / vs drafted 0.85 / vs dropped 0.46 / vs as written 0.74; facts only vs kept 0.95 / vs drafted 0.91 / vs dropped 0.53; A only vs kept 0.48 / vs drafted 0.64 / vs dropped 0.58 / vs as written 0.94. So the input list and the 16 facts alone tell a cut from both full-list twins at 0.85–0.95. H1 gold 0.85 / 0.77 (minilm-5 0.78 / 0.82; H1 data unchanged): the 5 worst misses are 4 `buried` problems at 0.91–0.98 (both flaky-test-hunt, podcast quote wrong, allergy over budget) and the allergy `honest` ledger at 0.89. H4 ships, best so far: macro-F1 0.95, not-precision 1.0 / recall 0.95 at 0.5, 1.0 / 0.90 at threshold.
- **Reading**: the cue the model took this time is the input list's length. A drafted outline step mostly reads one input, so a weave cut empties `after` and `redraft` gives the step the request block: text B of nearly every generated positive is the request line alone (minilm-5 leak table: cut rows average 1.11 lines in B, kept 1.37). Every negative with a full input list (as written 715, kept, drafted ≈ 1,250 rows) is label 0; the only request-only negatives are the ~300 dropped twins. So "inputs still listed → kept, request only → read the words" is the cheapest fit, and gold cuts are made on multi-input steps that keep one to three inputs. The probe shows exactly that: emptying B raises p(cut), removing the mention lowers it, and the two gold rows that scored well are among the few whose B is short. The pair-trained base did what it was brought in for (the mention now moves the score at all) but cannot overrule a list-length prior learnt from the positives' shape.
- **Next (not done; the last session's prediction, now confirmed)**: change the cut population, not the text. Weave only steps with ≥ 2 inputs and cut each input in turn, so the positive's B keeps the other inputs and matches the drafted negative line for line; keep single-input cuts only with their dropped twin so request-only B stays label-balanced. Then rerun the leak cell (B only vs drafted must fall toward 0.5) before reading gold. Second lever if the multi-input population is too small (check `stats.json` for how many drafted steps have ≥ 2 inputs): trim `as written` H2 negatives harder in `balance` so full-list rows are not 80% of the negatives.

### Session: 2026-10-23 — sg-sem: replaced positives so the list's length carries no label (run msmarco-2)

- **Task**: read msmarco-1 (Colab `c4d3423`, leak cell in `0d8ec85`; results under the previous session) and build the next run.
- **Why this lever**: a drafted outline step mostly reads one input, so a weave cut empties its `after` and `redraft` gives it the request block; every full-list H2 row in training (as written, kept, drafted ≈ 1,250) was a negative, and the model read the length of the input list and fact 8 (input count) / fact 10 (reads the request only) instead of the words. Gold cuts are made on multi-input steps that keep one to three inputs, so all 28 read as "kept".
- **Changes**: `pipeline.ts`: a fifth row per weave answer, *replaced* (label 1, note `replaced <pred>`): `substituteFor` picks, by seeded chance, another outline step the step does not read already and that is not downstream of it (a step that reads the cut input may stand in, as gold's api-rate-limits cut of `traffic` keeps `propose`), and `redraft` builds the step with the substitute in the cut input's place: as many inputs, heading blocks and facts as the drafted twin, span recomputed on the new text A; `h2-replaced-none` / `h2-replaced-checker-error` / `h2-span-replaced` counted. No new text-model calls: the same weave answers are reused (prompt hash unchanged). `Example.node` (the step id) on every round-2 row, so twins can be matched by seed, step and note (two steps of one seed can share a cut input). Mock outline gains a `sources` step (reads `gather`, read by `write`) so the mock has a substitute. `leak.py`: `replaced` kind; the one-side table is printed for all positives and then per positive kind, so *replaced vs drafted* (same list, different words) is read on its own. Test: replaced rows have their drafted twin's input count and fact 8, never the cut input's line, and the cut's span words. Spec §7.1 row; notebook `RUN = "msmarco-2"` (regenerated, outputs of unchanged cells kept).
- **Status**: ✅ tsc 0, vitest 1343/1343, validate-presets, lint 0 errors (63 old warnings), build. Mock run: 150 replaced from 150 weave answers (every mock cut has a substitute; the Qwen outlines in a line or "2 parallel research → checker" will often have none, so expect fewer than the 261 drafted). Next: run msmarco-2; read `stats.json` `h2-replaced-none` (how many cuts got a stand-in), then the leak cell's *positives: replaced* block (B only and facts only vs drafted should sit near 0.5), then gold H2 and the probe's "as is" column. If replaced rows are few, the next lever is outline shapes with more steps per graph so a stand-in exists.
