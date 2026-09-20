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

### ⚠️ CLI Zero Dependencies
The CLI (`cli/bin/devscratchpad.mjs`) operates on zero npm dependencies — it uses only Node.js standard libraries (`node:fs`, `node:path`, `node:https`). Never add external package imports to CLI code.

### ⚠️ Preset Schema Validation
All community presets in `/community-presets/` must validate against `schemas/preset-schema.json`. Run `npm run validate-presets` before committing any preset changes.

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
- **Learnings**: Native browser `title` attributes on interactive trigger buttons conflict with custom popovers and render uncontrollable OS-level tooltips at the mouse cursor; always use `aria-label` for accessibility instead of `title` when custom tooltips/popovers are used.
- **Status**: ✅ Complete (All gates passed)

---

*This document is updated by AI agents after significant sessions. Human maintainers should review and correct any inaccuracies periodically.*
