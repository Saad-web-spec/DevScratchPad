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
### Session: 2026-09-20 — PromptCraft Studio (WebGPU In-Browser Generative Prompt Compiler)
- **Agent**: Antigravity (Google Gemini)
- **Task**: Build zero-backend, client-side PromptCraft Studio compiling text into structured prompts for Runway Gen-3, Sora, Kling, Midjourney v6, and Flux.1 via @huggingface/transformers targeting WebGPU with Qwen2.5-0.5B-Instruct, dedicated Web Worker, Zustand store, and Higgsfield-inspired cinematic bento UI.
- **Changes**:
  - Implemented Web Worker (`inference.worker.ts`) hosting `@huggingface/transformers` v3 pipeline with WebGPU acceleration and download progress callbacks.
  - Implemented reactive Zustand store (`usePromptStore.ts`) for shot beats, cinematography matrix, and dual compilation modes (Neural WebGPU vs Instant Algorithmic <50ms).
  - Designed Higgsfield-inspired cinematic noir palette with subtle ambient violet light leak, matte glass cards (`backdrop-blur-md`), violet glow rings, and gradient CTA buttons.
  - Created Cinematography Matrix (Camera Movement, Lens/Focal Glass, Lighting Schemes, Color Palettes) and Temporal Video Timeline Builder with duration scrubber (5s/10s).
  - Built Output & Export layer (`OutputPanel.tsx`) with real-time token streaming, multi-engine syntax tabs, side-by-side & unified Diff Inspector, JSON/text export, and LZ-string URL permalinks.
  - Added route `/promptcraft-studio` with SEO metadata, JSON-LD schema, sitemap entry, and header navigation link.
  - Configured CSP in `next.config.ts` to allow Hugging Face CDN model weight endpoints in `connect-src`.
- **Learnings**: In Next.js App Router, avoid `ssr: false` in Server Component wrappers; use direct imports of client components with internal `typeof window !== 'undefined'` Web Worker instantiation.
### Session: 2026-09-23 — Minimalist Utilitarian Redesign of PromptCraft Studio
- **Agent**: Antigravity (Google Gemini)
- **Task**: Align PromptCraft Studio with modern minimal UI design systems (Vercel, Linear, Raycast): strip starfields, radial rings, and fox-orange glowing gradients in favor of layered surface lightness (`#121212` base, `#1A1A1A` elevated, `#242424` secondary), muted off-white text (`#E8E8E8`), crisp `border-white/10`, and clean sans-serif/monospace pairing with tabular numbers.
- **Changes**:
  - Built sparse, unstyled top navigation header (`PromptCraftHeader.tsx`) with left-aligned text logo and segmented control pill for `Overview`, `Image`, and `Video`.
  - Built Main Hub (`/promptcraft`): generous negative space, centered stark WebGPU introduction block, two flat navigation cards (`Image Studio` and `Video Studio`), and borderless technical matrix table using `tabular-nums`.
  - Built Dedicated Image Studio (`/promptcraft/images`): IDE 3-panel layout (30% input with compact form rows for Aspect Ratio, Lens, Lighting, Film Stock; 40% center monospace workspace with bold subject and muted secondary parameters; 30% details sidebar with token count and JSON AST accordion).
  - Built Dedicated Video Studio (`/promptcraft/video`): Miller's Law temporal layout with flat horizontal track and clickable time segment blocks (`00:00 - 00:03`), standard inline form editor, bottom-left global settings, and bottom-right flat dark-gray output console.
  - Configured backward compatibility: `/promptcraft-studio` routes cleanly delegate to `/promptcraft`, and sitemap/SiteHeader updated.
  - Cleaned up `globals.css` to eliminate `.ambient-mesh` and glowing gradients.
- **Learnings**: Communicating depth via layered surface lightness (`#121212` -> `#1A1A1A` -> `#242424`) with crisp 1px borders drastically reduces eye strain and visual noise compared to glowing drop shadows, while preserving 100% client-side zero-server functionality.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 871 SSG pages exit 0)

### Session: 2026-09-23 — White & Orange Infographic Main Page Redesign
- **Agent**: Antigravity (Google Gemini)
- **Task**: Overhaul the PromptCraft Studio landing page (`/promptcraft`) into a clean White and Orange themed Infographic Main Page (aligned with `ai-skill-studio` brand aesthetic), incorporating the transparent Fox logo, 4-step MoE pipeline architecture diagram, interactive side-by-side prompt compiler widget, 6-profile directorial intelligence matrix, and zero-server privacy architecture cards.
- **Changes**:
  - Rebuilt `PromptCraftHeader.tsx` in a crisp white (`#FFFFFF`/`#FAFAFA`) and orange (`orange-600`/`orange-50`) theme with the transparent Fox logo (`/promptcraft-fox-clean.png`), active route pills, WebGPU MoE status indicator, and direct AI Skill Studio badge.
  - Implemented `InfographicDemo.tsx`: an interactive side-by-side comparison widget illustrating raw human input vs. MoE-compiled engine output across Image (Midjourney/Flux) and Video (Sora/Runway/Kling) modalities, featuring syntax badges, latency stats (<15ms), and one-click copying.
  - Re-architected `src/app/promptcraft/page.tsx` as a comprehensive 7-section Infographic Hub:
    1. Hero Infographic with 4-metric ribbon (~45MB Local Core, <15ms Latency, 5 Vision Engines, 0 Bytes Transmitted).
    2. 4-Stage In-Browser MoE Pipeline diagram (NLP Parser -> Sparse MoE Gating Router -> Directorial Optics -> Syntax Compilation).
    3. Dual Studio Workspace Gateways (Image & Video) with visual feature breakdown pills and CTAs.
    4. Interactive Live Compiler Demo (`<InfographicDemo />`).
    5. Directorial Intelligence Matrix (Deakins, Villeneuve, Nolan, Scott, Fincher, Wong Kar-wai).
    6. Technical Specifications & Benchmark Table (memory footprint, inference speeds, privacy sandbox).
    7. Zero-Server Privacy Guarantee (Web Crypto, WebGPU isolation, IndexedDB cache, BSL 1.1).
    8. Clean, cohesive white & zinc footer with Fox branding.
- **Learnings**: The user prioritizes a clean, high-craft editorial aesthetic (white canvas with orange brand highlights) matching `ai-skill-studio` over dark/grey schemes. Emphasizing the local MoE pipeline and privacy guarantees via structural infographic diagrams creates immediate visual clarity.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 871 SSG pages exit 0, localhost:3000 verified 200 OK)

### Session: 2026-09-23 — Top-Left AI Skill Studio Link, Original Star, Black Accents & Plus Jakarta Sans Font
- **Agent**: Antigravity (Google Gemini)
- **Task**: Refine PromptCraft Studio header & landing page according to specific user directions:
  1. Use only a single button for AI Skill Studio without background, displaying the original icon (`/ai-skill-icon.png`) and text, located strictly on the top left side of the navigation header.
  2. Remove duplicate AI Skill Studio buttons (eliminated from hero action CTAs).
  3. Use the original star (`/orange-star.png`) across hero badges, section headings, and compiler demo.
  4. Replace all green (`emerald`) elements with black (`zinc-900`) for metrics (0 Bytes), badges, status pulses, and privacy icons.
  5. Upgrade typography to `Plus Jakarta Sans` via dedicated `src/app/promptcraft/layout.tsx` for a refined, modern editorial feel.
- **Changes**:
  - `PromptCraftHeader.tsx`: Added single transparent AI Skill Studio link on the top-left with `/ai-skill-icon.png`, removed the duplicate right-side button, changed hardware status pulse from green to black (`bg-zinc-900`), and integrated `/orange-star.png`.
  - `src/app/promptcraft/layout.tsx`: Configured `Plus_Jakarta_Sans` font from `next/font/google`.
  - `src/app/promptcraft/page.tsx`: Integrated `/orange-star.png` on hero eyebrow and section titles; replaced green text on `0 Bytes`, Step 4 badge, benchmark privacy pills, and privacy card with black (`zinc-900`); removed duplicate AI Skill Studio button from hero action CTAs.
  - `InfographicDemo.tsx`: Replaced sparkles with `/orange-star.png`; replaced green badges, check icon, and status text with black/zinc.
- **Learnings**: Clean typography with `Plus Jakarta Sans` and monochromatic black/zinc status indicators keeps the infographic high-contrast and professional while preventing color clash with the orange brand accent.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 871 SSG pages exit 0, localhost:3000 verified 200 OK)

### Session: 2026-09-23 — Google Antigravity Reference Styling, Black Cards & White Pill Buttons
- **Agent**: Antigravity (Google Gemini)
- **Task**: Align PromptCraft Studio directly with the Google Antigravity documentation interface reference image (`antigravity.google/docs`):
  1. Adopt the clean geometric sans typography stack (`Google Sans` / `Inter`) with medium weight headings and generous line-height.
  2. Implement the signature white pill button style (`rounded-full bg-white text-zinc-950 font-semibold hover:bg-zinc-100 shadow-sm`) matching the reference "Get Started" / "Download" buttons.
  3. Style cards in sleek deep black (`bg-zinc-950 text-white border border-zinc-800 shadow-md`) creating high-contrast depth against the white background.
  4. Remove all unnecessary example text blocks and the entire "showdown" demo component (`InfographicDemo.tsx`) to eliminate clutter.
- **Changes**:
  - `src/app/promptcraft/layout.tsx`: Configured Google Sans / Inter font stack with `textRendering: 'optimizeLegibility'`.
  - `PromptCraftHeader.tsx`: Pill-shaped navigation tabs, white pill action button ("Get Started"), single top-left AI Skill Studio link.
  - `src/app/promptcraft/page.tsx`: Re-architected with 5 sleek black card sections: Hero Metrics, 4-Stage MoE Pipeline, Dual Studio Gateways, Model Matrix table, and Zero-Server Privacy Guarantee; removed showdown demo and director example text walls.
- **Learnings**: Pairing a white background with deep black cards and white pill buttons creates an instant modern developer documentation look inspired directly by Google Antigravity, while removing bloated sample text lets the core architectural specs shine.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 871 SSG pages exit 0, localhost:3000 verified 200 OK)

### Session: 2026-09-23 — White-Orange-Black Card Palette, Text How-It-Works & Fox Favicon
- **Agent**: Antigravity (Google Gemini)
- **Task**: Implement user-directed refinements to PromptCraft Studio:
  1. Card palette: Replaced solid black card containers with mainly white cards (`bg-white border-zinc-200`) highlighted by an exquisite mixture of orange accents (`orange-600`, `bg-orange-50`) and crisp black elements (`text-zinc-950`, black pill badges `bg-zinc-950 text-white`).
  2. Text-only "How It Works": Replaced the 4-card container pipeline with pure text typography with zero background.
  3. Removed "algorithmic" prompt generation references in favor of neural Sparse MoE compilation.
  4. Removed WebGPU badges and icons from the navigation header.
  5. Established the clean transparent Fox (`promptcraft-fox-clean.png`) as the official favicon (`/promptcraft/icon.png`).
- **Changes**:
  - `src/app/promptcraft/icon.png`: Copied `promptcraft-fox-clean.png` for automatic Next.js App Router favicon rendering.
  - `src/app/promptcraft/layout.tsx`: Configured Fox favicon metadata links and Google Sans font stack.
  - `src/app/promptcraft/components/PromptCraftHeader.tsx`: Removed the `[★ MoE WebGPU]` badge and the `Cpu` WebGPU status pill, leaving the navigation bar minimal, clean, and distraction-free.
  - `src/app/promptcraft/page.tsx`: Transformed all cards to primarily white with orange and black accents; converted "How It Works" to pure text with no card background; eliminated all "algorithmic" references.
- **Learnings**: The user's ideal visual formula is predominantly white (`bg-white`, `#FAFAFA`) with deep black typography and badges, energized by vibrant orange brand accents, and unburdened by redundant icons or background wrappers.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0, localhost:3000 verified 200 OK)

### Session: 2026-09-23 — Removal of Technical Specifications & Model Matrix
- **Agent**: Antigravity (Google Gemini)
- **Task**: Remove the Technical Specifications & Model Matrix table section per user request (referencing `media_1790156151723.png`):
  1. Removed `const technicalMatrix = [...]` data structure from `src/app/promptcraft/page.tsx`.
  2. Removed the table `<section>` and header elements from `src/app/promptcraft/page.tsx`.
  3. Ensured clean, uncluttered visual flow from Dual Studio Workspaces directly into the Zero-Server Privacy Guarantee card.
  4. Verified all gates (`validate-presets`, `lint`, `build` 872 pages) and restarted fresh production server on `http://localhost:3000`.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0, localhost:3000 verified 200 OK)

### Session: 2026-09-23 — White-Themed Visual Elevation & Star Badge Removal
- **Agent**: Antigravity (Google Gemini)
- **Task**: Make PromptCraft Studio more impressive with white-themed design and remove the star badge:
  1. Completely removed the star badge (`/orange-star.png`) above the hero title and across section headers.
  2. Added architectural ambient light radiance and subtle micro-dot grid background to bring warmth, luminosity, and depth to the white theme without clutter.
  3. Upgraded the hero typography with an extrabold display headline, warm orange sunset gradient on "Studio", and enlarged clean Fox emblem.
  4. Unified the 4 separate metrics boxes into a single sleek white metrics dock with hairline interior dividers.
  5. Added compiled AST syntax preview boxes inside Image Studio and Video Studio cards to showcase real-time compilation power.
  6. Verified exit 0 across validate-presets, lint (0 errors), build (872 SSG pages exit 0), and fresh server live on localhost:3000.
- **Status**: ✅ Complete (All verification gates passed: validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0, localhost:3000 verified 200 OK)

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

---

*This document is updated by AI agents after significant sessions. Human maintainers should review and correct any inaccuracies periodically.*

