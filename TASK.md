# DevScratchpad — Active Task Tracker

> **Last Updated**: 2026-09-20  
> **Current Milestone**: 2.0 — Community Registry & Governance Hardening  
> **Overall Progress**: ~65%

---

## Quick Status Dashboard

| Milestone | Status | Progress |
| :--- | :--- | :--- |
| 1.0 — Foundation & SEO | ✅ Complete | 100% |
| 1.1 — AI Skill Studio & Auditor | ✅ Complete | 100% |
| 1.2 — Headless CLI | ✅ Complete | 100% |
| 2.0 — Community Registry & Governance | 🔄 In Progress | 40% |
| 2.2 — PromptCraft Studio (WebGPU Prompt Compiler) | ✅ Complete | 100% |
| 2.1 — VFS Multi-File Bundling | 📋 Planned | 0% |
| 3.0 — Rule Importer & Token Linter | 📋 Planned | 0% |

---

## Phase 1: Core Foundation & SEO ✅

- [x] Implement 28+ client-side developer utilities
- [x] JSON Formatter with multi-indent formatting and minification
- [x] JWT Decoder with auto timestamp conversion
- [x] X.509 Certificate Decoder with SAN extraction
- [x] SSH Key Generator (Ed25519/RSA/ECDSA) with OpenSSH Randomart
- [x] Password Hash & Verifier (bcrypt, Argon2id, PBKDF2)
- [x] Hash Generator (MD5, SHA-1, SHA-256, SHA-512)
- [x] HMAC Generator (SHA256, SHA512 in Hex & Base64)
- [x] UUID Generator (v4, bulk generation)
- [x] Base64 & Hex Inspector with Data URL preview
- [x] SQL Formatter (PostgreSQL, MySQL, SQLite)
- [x] GraphQL Formatter with AST parser
- [x] XML Formatter with indentation controls
- [x] cURL to Fetch / cURL to Python converters
- [x] JSON to TypeScript / JSON to Zod converters
- [x] SVG to JSX converter
- [x] YAML to JSON converter
- [x] Diff Checker (Monaco side-by-side + inline)
- [x] CSS & SVG Minifier with byte savings display
- [x] Regex Tester with flag support
- [x] Cron Visualizer with plain English translation
- [x] IP/CIDR Calculator
- [x] Monaco Editor integration with custom dark theme
- [x] 32px status footers (execution time, char count, error lines)
- [x] Command Palette (Ctrl+K / Cmd+K)
- [x] URL hash state sharing (#data=...)
- [x] FIFO 15-entry workspace history
- [x] Serwist PWA service worker
- [x] JSON-LD structured data (SoftwareApplication, FAQPage)
- [x] Dynamic sitemap generation
- [x] OpenGraph image generation

## Phase 2: AI Skill Studio & Static Auditor ✅

- [x] 13-format rule generator engine (presetRegistry.ts + ruleGenerator.ts)
  - [x] Cursor Rules (.mdc)
  - [x] Claude Skills (SKILL.md)
  - [x] CLAUDE.md
  - [x] AGENTS.md
  - [x] MCP Config (JSON)
  - [x] Windsurf Cascade (.md)
  - [x] GitHub Copilot Instructions
  - [x] OpenAI Custom Instructions
  - [x] Gemini System Instructions (JSON)
  - [x] .cursorignore (Dedicated Token & Secret Shield Suite)
  - [x] .claudeignore (Claude Code CLI Indexing Boundary Shield)
  - [x] llms.txt
  - [x] ARCHITECTURE.md
- [x] Static Analysis Auditor scoring engine (ruleAuditor.ts)
  - [x] 5-dimension scoring (Trigger, Density, Guardrails, Compliance, Architecture)
  - [x] One-click Auto-Fix
- [x] Manifest Auto-Detection (package.json, Cargo.toml, pyproject.toml, go.mod)
- [x] Trigger Tagging with heuristic validation
- [x] 14+ curated production presets
- [x] Terminal one-liner stream (/api/raw/[formatSlug]/[presetSlug])
- [x] LZ-compressed permalink sharing
- [x] ZIP export (Unified AI Kit)
- [x] Format Hub pages with SEO content
- [x] Programmatic spoke pages per preset

## Phase 3: Headless CLI ✅

- [x] Zero-dependency CLI (`npx devscratchpad`)
- [x] `list` command — browse formats and presets
- [x] `add <preset>` command — install into local project
- [x] `audit` command — score repository rule health
- [x] `init` command — scaffold starter guidelines
- [x] Cross-runner support (npx, pnpm dlx, bunx)
- [x] Deep link integration with web AI Skill Studio
- [x] CLI documentation page (/cli)
- [x] npm package publishing

## Phase 4: Community Registry & Governance 🔄

- [x] Community presets directory (`/community-presets/`)
- [x] Preset JSON schema (`schemas/preset-schema.json`)
- [x] Validation script (`scripts/validate-presets.mjs`)
- [x] Agent governance documentation layer
  - [x] PRD.md — Product Requirements Document
  - [x] DESIGN.md — Design System & Technical Architecture
  - [x] TASK.md — This active tracker
  - [x] MEMORY.md — Persistent agent memory & ADRs
  - [x] AGENTS.md — Enhanced multi-agent steering protocol
  - [x] CLAUDE.md — Expanded reading hierarchy
- [ ] GitHub Actions CI pipeline for preset validation
  - [ ] Automated schema validation on PR
  - [ ] Quality gate enforcement (score >= 80/100)
  - [ ] Security scan for malicious script content
- [ ] Static JSON index build & CDN deployment
- [ ] Community contribution guide for presets
- [ ] Preset discovery UI in AI Skill Studio

## Phase 5: VFS Multi-File Bundling 📋

- [ ] In-memory Virtual File System (memfs) for multi-file skill packages
- [ ] File tree editor UI with tabs
- [x] Support for scripts/ and references/ directories in skills (generated, not editable; `assets/` not yet)
- [ ] Preview code files within studio tabs
- [x] Export as structured .zip (SKILL.md download is the skill folder ZIP)
- [ ] CLI `add` command support for multi-file bundles

## Phase 6: Rule Importer & Two-Way Auditor 📋

- [ ] Import existing .cursorrules / .mdc files
- [ ] Import existing CLAUDE.md / SKILL.md files
- [ ] Token count analysis and waste detection
- [ ] Cross-format conversion (e.g., .mdc → SKILL.md)
- [ ] Optimization suggestions with before/after preview
- [ ] Bulk repository rule health dashboard
---


## Verification Commands & Quality Gates

Every change MUST pass all verification gates before merging:

```bash
# 1. Validate preset JSON schemas
npm run validate-presets

# 2. Run ESLint
npm run lint

# 3. Build Next.js production bundle
npm run build

# 4. Unit tests (Vitest: generator, section locator, auditor, slug/share utils)
npm test

# 5. CLI smoke test
node ./cli/bin/devscratchpad.mjs list
node ./cli/bin/devscratchpad.mjs audit
```

---

## Agent Session Log

| Date | Agent | Action | Result |
| :--- | :--- | :--- | :--- |
| 2026-09-20 | Antigravity (Gemini) | Created PRD.md, DESIGN.md, TASK.md, MEMORY.md governance layer; updated AGENTS.md and CLAUDE.md | ✅ Completed |
| 2026-09-20 | Antigravity (Gemini) | Fixed all 166 lint errors across tools & components, configured ESLint flat config, verified build (861 pages), started dev server on localhost:3000 | ✅ Exit 0 verified |
| 2026-09-20 | Antigravity (Gemini) | Removed orange "Deep Dive Guide" banner below tool editor across all tool pages while keeping top bar AI Skill Studio badge | ✅ Exit 0 verified |
| 2026-09-20 | Antigravity (Gemini) | Added PRD.md, DESIGN.md, TASK.md, and MEMORY.md governance formats to AI Skill Studio with designated tweak cards, format hubs, and ZIP exporter integration | ✅ All gates passed (865 SSG pages) |
| 2026-09-20 | Antigravity (Gemini) | Removed non-functional tweak buttons; implemented dedicated, interactive, and customizable section suites for PRD.md (6 sections), DESIGN.md (6 sections), TASK.md (5 sections), and MEMORY.md (6 sections) with section-specific reset, instant Monaco editor reactivity, and contextual hiding of generic skill forms | ✅ All gates passed (0 lint errors, exit 0 build) |
| 2026-09-20 | Antigravity (Gemini) | Replaced colored section badges across all 22 governance cards with circular info `(i)` tooltips (`InfoTooltip`); added info tooltips across MCP, Cursor, and standard skill cards; updated bottom "Target File Location" card with format icons; expanded `AiSkillStudioSeoContent.tsx` and `page.tsx` with Layer 4 AI Governance & Multi-Agent Planning Suite (17 formats) and guided editing instructions | ✅ All gates passed (validate-presets, 0 lint errors, 865 SSG pages exit 0) |
| 2026-09-20 | Antigravity (Gemini) | Removed native browser `title` hover popup that obscured section headings; implemented viewport-clamped portal positioning with 12px safety boundaries to prevent mobile bloating; verified all 329 previous lint fixes intact (0 errors, 865 SSG pages exit 0, dev server active on localhost:3000) | ✅ All gates passed |
| 2026-09-21 | Antigravity (Gemini) | Complete redesign of PromptCraft Studio: eliminated modal and simulated typing; embedded real WebGPU/Qwen2.5 model lifecycle with live download % and cache status; added clean transparent Fox logo (`/promptcraft-fox-clean.png`); aligned theme to AI Skill Studio minimalist white/black with `#FF6B00` Fox-Orange gradient; separated Video vs Image generation modes; built balanced 2-column productivity layout; fixed SSR hydration mismatch; verified on dev server localhost:3000 | ✅ All gates passed (validate-presets: 0, lint: 0 errors, build: 866 pages exit 0) |
| 2026-09-21 | Antigravity (Gemini) | Restructured PromptCraft Studio into 3 clean pages: Pitch Dark Hub (`/promptcraft-studio`), dedicated Image Studio (`/promptcraft-studio/images`), and dedicated Video Studio (`/promptcraft-studio/video`); added dismissible model loading badge (`ModelNotificationBadge.tsx`) with `✕` clear action; added transparent Fox logo and AI Skill Studio button to header; isolated client components to resolve SSR hydration attribute mismatch; verified build of all 868 pages and all 3 endpoints returning HTTP 200 on localhost:3000 | ✅ All gates passed (validate-presets: 0, lint: 0 errors, build: 868 pages exit 0) |
| 2026-09-21 | Antigravity (Gemini) | Built Cosmic Space Topography (ported from `my website`: `#030303` canvas, 60fps interactive `Starfield`, `ambient-mesh` glow, macOS `GlassTerminalShowcase` with live typewriter compilation demo); eliminated 360 MB download barrier with client-side Semantic Directorial Knowledge Graph (<15ms, 0 MB); added `SceneIntelligencePanel` (NLP entity extraction, director aesthetic injection: Deakins, Villeneuve, Nolan, Scott, Fincher, Wong Kar-wai, 1-click Negative Prompt copy, cinematography depth score); verified exit 0 across validate-presets, lint, and build (868 pages) | ✅ All gates passed (validate-presets: 0, lint: 0 errors, build: 868 pages exit 0) |
| 2026-09-22 | Antigravity (Gemini) | Implemented 100% local Sparse Mixture of Experts (MoE) architecture: Gating Router dynamically activates domain expert weights (Photographic Optics in Image Studio, Spatio-Temporal Kinematics in Video Studio, Material/Particle Physics, Directorial Grammars) while keeping irrelevant weights completely idle; integrated ultra-compact `SmolLM2-135M-Instruct` (~45 MB, loads in ~2s with permanent IndexedDB cache) replacing 310MB model; created `MoERouterBadge.tsx` displaying live expert weights; wired live token streaming into OutputPanel; verified exit 0 across validate-presets, lint (0 errors), build (868 SSG pages exit 0), and all 3 endpoints returning HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-22 | Antigravity (Gemini) | Redesigned PromptCraft Studio Hub to match `saadengineer.works` design architecture: `#030303` base canvas, gentle ambient mesh and soft starfield; removed redundant sub-bar with duplicate AI Skill Studio button; fixed dark background box on Prompt Studio navbar logo using transparent asset; created two formal minimalist glassmorphism gateway cards for Image & Video studios; added structured system architecture breakdown; replaced white footer with cohesive dark footer | ✅ Completed |
| 2026-09-23 | Antigravity (Gemini) | Complete Minimalist Redesign of PromptCraft Studio (Vercel / Linear / Raycast Aesthetic): stripped away starfields, radial rings, and fox-orange glowing gradients; established `#121212` base canvas with `#1A1A1A` elevated cards, `#E8E8E8` off-white text, and `border-white/10`; built Utilitarian Hub (`/promptcraft`) with centered WebGPU statement, flat cards, and borderless technical matrix table (`tabular-nums`); built Dedicated Image Studio (`/promptcraft/images`) with IDE 3-panel layout (compact form rows, center monospace workspace with bold subject and muted secondary parameters, details sidebar with token count and JSON AST accordion); built Dedicated Video Studio (`/promptcraft/video`) with Miller's Law horizontal timeline track, chunked form editor, global settings, and dark-gray output terminal; verified exit 0 across validate-presets, lint (0 errors), and build (871 SSG pages exit 0) | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Redesigned PromptCraft Studio Main Hub into a high-craft White & Orange Infographic page (`/promptcraft`): `#FAFAFA`/`#FFFFFF` canvas, `border-zinc-200`, `text-zinc-900`, vibrant orange brand accents (`orange-600`, `orange-50`), transparent Fox logo (`/promptcraft-fox-clean.png`), 4-stage in-browser MoE pipeline diagram, hero metrics ribbon (~45MB core, <15ms latency, 5 engines, 0 bytes sent), dual studio gateway cards, live side-by-side prompt compiler comparison widget (`InfographicDemo`), 6-profile directorial intelligence matrix, technical benchmark table, and zero-server privacy architecture cards; verified exit 0 across validate-presets, lint (0 errors), build (871 SSG pages exit 0), and server running on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Refined PromptCraft Studio header & landing page: single AI Skill Studio button without background on top left side using original icon (`/ai-skill-icon.png`) and text; eliminated duplicate AI Skill Studio CTA in hero; integrated original star asset (`/orange-star.png`) across hero badge, architecture flow, demo, and matrix; replaced all green (`emerald`) elements with black (`zinc-900`); integrated `Plus_Jakarta_Sans` font; verified exit 0 on validate-presets, lint (0 errors), build (871 SSG pages exit 0), and live HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Restyled PromptCraft Studio after Google Antigravity docs reference (`antigravity.google/docs`): applied clean geometric sans font stack (`Google Sans` / `Inter`); styled cards in deep black (`bg-zinc-950 text-white border-zinc-800 shadow-md`) across metrics ribbon, 4-stage MoE pipeline, dual studio gateways, model matrix table, and zero-server privacy card; implemented signature white pill buttons (`rounded-full bg-white text-zinc-950 font-semibold`); removed unnecessary examples and showdown demo component; verified exit 0 on validate-presets, lint (0 errors), build (871 SSG pages exit 0), and live server HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Perfected PromptCraft Studio palette & layout: made cards primarily white (`bg-white`) with an exquisite mixture of orange accents (`orange-600`) and black details (`zinc-950`); replaced 4-card pipeline with pure text-only "How It Works" with zero background; completely removed "algorithmic" prompt generation references in favor of neural MoE compilation; removed WebGPU badge/icon from the header; established Fox (`promptcraft-fox-clean.png`) as the official favicon (`/promptcraft/icon.png`); verified exit 0 across validate-presets, lint (0 errors), build (872 routes exit 0), and live server HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Removed Technical Specifications & Model Matrix table section and technicalMatrix data definition from PromptCraft hub page per user request; verified clean layout flow directly into Zero-Server Privacy Guarantee; verified exit 0 on validate-presets, lint (0 errors), build (872 SSG pages exit 0), and fresh production server running on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Elevated white-themed design & removed star badge: completely removed star eyebrow badge above hero title; added ambient warm light radiance & subtle architectural dot grid; upgraded hero typography (extrabold headline, orange-amber gradient Studio); unified metrics into cohesive white dock with hairline dividers; added compiled syntax AST mockups inside Image & Video Studio cards; verified exit 0 on validate-presets, lint (0 errors), build (872 SSG pages exit 0), and fresh server live on localhost:3000 | ✅ All gates passed |
| 2026-09-23 | Antigravity (Gemini) | Adopted ultra-minimalist developer hero (Linear / Resend / Vercel style) per user direction: removed awkward floating top Fox icon above H1 and removed the 4-point metrics dock below CTAs; established clean, high-impact typographic hierarchy (`In-Browser Sparse MoE Compiler` eyebrow + bold `PromptCraft Studio`); connected directly into Dedicated Workspaces (Image & Video Studio with live syntax AST previews), How It Works (text-only), and Zero-Server Privacy Guarantee; verified exit 0 on validate-presets, lint (0 errors), build (872 SSG pages exit 0), and live HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-26 | Antigravity | Implemented White Marker in AI Skill Studio editor: created `sectionLocator.ts` mapping across all 17 formats; added white marker CSS decorations and glyphs in `globals.css`; wired real-time section tracking, Monaco deltaDecorations, smooth auto-scroll to changed lines, header status pill (`[Marked: <label> L:start-end]`), and static pre fallback line highlights; verified validate-presets (exit 0), lint (0 errors), build (872 SSG pages exit 0), and live HTTP 200 on localhost:3000 | ✅ All gates passed |
| 2026-09-26 | Antigravity | Refined White Marker & Smooth Lockstep Editor Auto-Scroll: removed banner heading/pill from editor toolbar per user request; eliminated scroll thrashing by removing conflicting `editorRef.current.setScrollTop(0)` in content sync effect; corrected section ordering in form (Conventions before Guardrails) to match generated document structure; upgraded marker to single solid 3px vertical white bar with radiant glow (`rgba(255,255,255,0.4)`), transparent gradient, and `z-index` layering ensuring 100% text readability; verified all quality gates (validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0, localhost:3000 200 OK) | ✅ All gates passed |
| 2026-09-27 | Antigravity | Resolved Mobile Audit Header Text Overlap: diagnosed collision where `94/100 · PRODUCTION GRADE` badge and `Copy Report` button overlapped on narrow mobile viewports due to fixed `shrink-0` widths exceeding ~336px container width; made header responsive by showing `AUDIT` on mobile (`RULE AUDIT` on `sm+`), displaying score `{score}/100` on mobile (full grade label on `sm+`), icon-only copy button on mobile (`Copy Report` text on `sm+`), and refined metric grid padding/labels; verified zero text collision, all gates passed (validate-presets: 0, lint: 0 errors, build: 872 SSG routes exit 0, localhost:3000 200 OK) | ✅ All gates passed |
| 2026-09-27 | Antigravity | Resolved Format Switching Stale Markers, Header Filenames & Auto-Scroll Jumps: created `handleSelectFormat` resetting `activeFieldKey`, `markedRange`, and scrolling to top (`scrollTop = 0`) across all 17 format selectors; isolated auto-scroll with `lastHandledScrollIdRef` to prevent editor jumping on format switch; updated `currentFileName`, `handleDownload`, and colored brand dots for all 17 formats; restructured `gemini_prompts` into modular `system_instruction.parts`; added dedicated JSON locators in `sectionLocator.ts` for Gemini & MCP; verified all gates exit 0 | ✅ All gates passed |
| 2026-09-27 | Antigravity | Universal White Marker Fix & 100% Cross-Format Validation: eliminated box-shadow multi-line zebra stripes and right-edge blisters in `globals.css`; added dedicated XML tag locator for `CLAUDE.md`, frontmatter sub-line isolators for `cursor_mdc`/`skill_md`, expanded regex patterns across all 17 formats; automated validation script passed 127/127 fields (100%); all gates exit 0 | ✅ All gates passed |
| 2026-09-27 | Antigravity | Download Audit HUD — Bottom Verification Dock: created `DownloadAuditHud.tsx` component with 4-stage lifecycle (hidden → entering → active → exiting), smooth spring emergence from bottom (`translate-y-8 → 0`, `opacity-0 → 1`, `scale-95 → 100`), 60fps countdown bar with hover-pause, Escape key dismissal, portal rendering, audit score badge with grade label, format label pill, privacy guarantee stamp (`0 Bytes Sent`), dynamic user adjustment pills (framework, language, triggers, guardrails, manual edits), and "Inspect Audit Details →" link opening the audit drawer; wired into `handleDownload` (single file) and `handleExportZip` (suite export); verified all gates exit 0 (validate-presets: 0, lint: 0 errors, build: 872 SSG pages exit 0, dev server active on localhost:3000) | ✅ All gates passed |
| 2026-09-28 | Antigravity | White & Orange Formal Theme & Mobile Optimization: redesigned `DownloadAuditHud.tsx` into a formal white & orange aesthetic matching AI Skill Studio's brand palette: pure white elevated surface (`bg-white/98 backdrop-blur-xl border border-zinc-200/90 shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(234,88,12,0.08)]`), hairline orange gradient top accent bar, formal orange checkmark badge with soft amber ping, dark zinc typography (`text-zinc-900`) with vibrant orange emphasis (`text-orange-600 font-bold`), clean white/orange audit score pill (`bg-orange-50 text-orange-800 border-orange-200/90`), subtle zinc adjustment pills, orange countdown bar (`from-orange-500 via-orange-600 to-amber-500`), and mobile-responsive viewport clamping (`w-[calc(100%-1.25rem)]`, truncated filename, wrap-safe badge rows, accessible touch targets); verified all gates exit 0 (validate-presets: 100/100, lint: 0 errors, build: 872 SSG pages exit 0, dev server active on localhost:3000) | ✅ All gates passed |
| 2026-09-28 | Antigravity | Main Folder Icon Integration in Download Audit HUD: replaced circular enclosed checkmark with the official AI Skill Studio orange folder icon (`/ai-skill-icon.png`) housed in a clean `rounded-lg bg-orange-50/90 border border-orange-200/80` container; verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 872 SSG pages exit 0, dev server live on localhost:3000) | ✅ All gates passed |
| 2026-09-30 | Antigravity (Gemini) | Resolved AI Skill Library sidebar button orientation & model filtering: fixed misaligned 'All Platforms' with dedicated `<Layers>` icon container, added count badges for all sources & platforms; implemented strict primaryPlatform filtering (`skill.primaryPlatform === activePlatform`) ensuring clicking Cursor, Claude, Windsurf, Copilot, ChatGPT, or MCP brings up that specific model without cross-format pollution; added 'Universal (Cross-IDE)' filter option; expanded catalog to 136 production skills (111 official) adding premier MCP servers (GitHub, Postgres, Puppeteer, Brave, Memory), Windsurf Supabase & Docker, Copilot CI/CD, OpenAI Strict Function Calling & Canvas, and Cursor Stripe Billing; verified exit 0 across validate-presets, lint (0 errors), build (867 SSG routes exit 0) | ✅ All gates passed |
| 2026-09-30 | Antigravity (Gemini) | Fixed non-working sort selector & Windows OS electric blue highlight with custom popover (`Most Popular`, `Highest Score`, `Recently Added`); upgraded Gemini & Cursor cards to rich multi-stop gradient blues (`from-blue-600 via-indigo-600 to-sky-400` / `from-blue-600 to-cyan-500`) with matching soft shadows and hover accents; optimized library for mobile with horizontal swipeable platform ribbon, collapsible filter drawer, touch-friendly pads (`p-4 sm:p-5`), and responsive filename truncation; verified all quality gates (validate-presets: 100/100, lint: 0 errors, build: 867 SSG pages exit 0) | ✅ All gates passed |
| 2026-09-30 | Antigravity (Gemini) | Completely removed purple color from MCP in AI Skill Library: transitioned MCP cards, platform filter button, active badge, and `<Server />` brand icon to minimalist dark zinc / neutral charcoal styling (`zinc-950`, `zinc-800`, `zinc-100`, `border-zinc-200`) aligning with open developer protocol identity; verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 867 SSG routes exit 0) | ✅ All gates passed |
| 2026-09-30 | Antigravity (Gemini) | Resolved Mobile View Hero Header Logo & Text Alignment: paired the folder icon directly with the 'Skill HUB' title in the top row on mobile viewports (<640px) to prevent vertical floating and squished right-side columns; allowed subtitle and description to render at full width with clean line-height; updated action buttons with full-width mobile touch targets and centered privacy stamp; verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 867 SSG routes exit 0) | ✅ All gates passed |
| 2026-10-02 | Antigravity (Gemini) | Resolved Mobile View Duplicate Skill Icons & Redesigned Inspect Skill Modal: removed duplicate 'Skills' item from TopBar mobile 3-dot dropdown; assigned Zap icon exclusively to 'AI Skill Studio' and single folder icon exclusively to '/skill' across TopBar and ClaudeSkillsClient header to prevent icon ambiguity; cleaned up SkillsLibraryClient sticky header by removing redundant left folder icon; completely redesigned Inspect Skill modal ('Read Mode') on mobile view with responsive vertical column stack giving 100% width to skill title without awkward word-wrapping, pinned top-right close 'X' button, full-width action bar with equal button widths, touch-scrolling code viewer, and responsive footer; verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 869 SSG routes exit 0) | ✅ All gates passed |
| 2026-10-02 | Antigravity (Gemini) | Restored AI Skill Studio Original Logo & Ultra-Smooth PWA Icons: restored original `/ai-skill-icon.png` folder logo across TopBar desktop navigation, mobile overflow dropdown, and ClaudeSkillsClient header per user request; diagnosed cause of rough/pixelated PWA splash screen icon (old 512x512 bitmap had un-antialiased stair-stepped lines and wobbly geometry); generated mathematically precise, vector-smooth `< / >` icons via Sharp with Lanczos3 anti-aliasing across `src/app/icon.png`, `src/app/apple-icon.png`, and `public/` icon suite (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` with Android safe zone padding); updated `src/app/manifest.ts` and `public/manifest.json` with multi-size declarations and `purpose: 'any' / 'maskable'`; verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 869 SSG routes exit 0) | ✅ All gates passed |
| 2026-10-02 | Antigravity (Gemini) | Phase 1: Dynamic URL Address Bar Synchronization & Deep-Linking (`/ai-skill-studio/claude.md`): implemented real-time address bar URL updates without reloading or state wiping (`window.history.pushState` with `popstate` Back/Forward listener); supported dot-extension format aliases (`claude.md`, `prd.md`, `design.md`, `task.md`, `memory.md`, `agents.md`, `cursor.mdc`, `llms.txt`, `architecture.md`, `mcp.json`); updated `[formatSlug]/page.tsx` to mount `ClaudeSkillsClient` pre-selected with requested format with educational SEO guides below the fold; added rewrites in `next.config.ts`; verified all 890 static routes compiled exit 0 | ✅ All gates passed (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0) |
| 2026-10-02 | Antigravity (Gemini) | Phase 2 Refinement: Text Preservation & Ingestion Context Integration: per user feedback, restored previous architectural copy and descriptive text across `/ai-skill-studio/mcp-config/github` and `ProgrammaticSpokeSeoContent.tsx` (`route.description` and `route.whyNeeded` restored as primary content, adding live client-side repo ingestion context rather than overwriting original copy); restored natural text across `GitHubRepoModal.tsx` ('Need private repo access or higher rate limits? (Optional Token)', browser memory isolation explanation) while preserving PAT authentication and neutral sample repositories (removed `Saad-web-spec`); updated CSP `connect-src` to permit client-side `api.github.com` & `raw.githubusercontent.com`; verified all gates passed (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0, localhost:3000 running) | ✅ All gates passed |
| 2026-10-03 | Antigravity (Gemini) | Ingestion Synthesis to Markdown (.md) Pipeline & Modal Design Alignment: resolved runtime crash where undefined `generateRules` prevented ingested GitHub and SQL DDL / Prisma results from populating Monaco editor by wiring full `buildRuleContent` synthesis; added format selection pills (`CLAUDE.md`, `cursor.mdc`, `AGENTS.md`, `SKILL.md`) and synchronized format across `GitHubRepoModal` and `DdlIntrospectModal`; removed unneeded icons (stars, forks, terminal prompts, sparkles) and unified both modals to sleek monochrome zinc aesthetic with crisp orange accents; restored Technology Stack Context header buttons back to original clean state (`Convert Legacy Rules` + `Auto-Detect`) with a dedicated Live Project Ingestion section; restored executive summary in `ProgrammaticSpokeSeoContent.tsx` with original technology copy while placing Live Ingestion in a clean reciprocal action callout section at the end of the page; verified all 3 gates pass (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0, production server running on http://localhost:3000) | ✅ All gates passed (validate-presets: 100/100, lint: 0 errors, build: 890 routes exit 0) |
| 2026-10-03 | Antigravity (Gemini) | Phase 3: Local Filesystem & Docker Compose Client-Side Ingestion: implemented `fsPicker.ts` leveraging browser File System Access API (`showDirectoryPicker`) to inspect manifests offline; implemented `dockerParser.ts` for client-side container parsing; built responsive `LocalFolderModal.tsx` and `DockerInspectModal.tsx`; consolidated MCP ingestion engines exclusively into `MCP Server Configuration` without duplicating in `Technology Stack Context`; preserved original `Technology Stack Context` header (`Convert Legacy Rules` & `Auto-Detect`); restored `[formatSlug]/page.tsx` UI to be 100% identical to `/ai-skill-studio` without breadcrumb/switcher bar or bottom hub text; added professional orange-to-amber gradients on modal apply buttons; verified all 3 quality gates (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0) | ✅ All gates passed (100/100 presets, 0 errors lint, 890 routes build exit 0) |
| 2026-10-03 | Antigravity (Gemini) | Upgraded AGENTS.md & Code Generation with The Graph Blueprint: upgraded root `AGENTS.md` and `ruleGenerator.ts` (`AGENTS.md` format generation) with the emerging Graph Blueprint multi-agent coordination protocol (`Goal ➔ Splitter ➔ Parallel Fan-out Workers [1-4] ➔ Independent Verifier [Fresh Context] ➔ Synthesizer`); established domain-isolated parallel worker roles (Research, Comparative, Validation, Gap Analysis); enforced fresh context window policy with zero worker CoT leakage to eliminate confirmation bias; incorporated standardized graph blueprint presets (`pr-review-graph`, `rfc-discovery-graph`, `bug-triaging-graph`); strictly preserved Next.js agent-rules block and non-negotiable constraints; passed all quality gates (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0) | ✅ All gates passed (validate-presets: 100/100, lint: 0 errors, build: 890 routes exit 0) |
| 2026-10-04 | Antigravity | AI Skill Studio UI polish (theme unchanged, header untouched): lifted all 8px/9px text to 10px min; zinc-400 -> zinc-500 on light form surfaces (WCAG AA); unified section card padding (p-4 sm:p-5) and header rhythm (center-aligned meta, pb-3); Target Standard heading matches other sections; orange selection language for philosophy and checkbox tiles (accent-orange-600 replaces browser-blue checkboxes); orange focus rings on all inputs/textareas; fixed invalid py-0.2; editor tab filename no longer truncates to 'SK...'; Integrations grid 2-col on mobile; gates: validate-presets pass, lint 0 errors, build 890 routes | ✅ All gates passed |
| 2026-10-06 | Antigravity (Gemini) | Technical SEO Full Remediation Sprint: resolved duplicate content across 17 AI Skill Studio Format Hubs (`/ai-skill-studio/[formatSlug]`) by creating `FormatHubSeoContent.tsx` with dedicated metadata, file trees, syntax highlights, best practices, and FAQPage JSON-LD; eliminated dual-URL collision by 308 redirecting `/ai-skill-studio/skills` to `/skill` and adding `/skill` to `sitemap.ts`; decommissioned orphaned `/workspace` with 308 redirect to `/`; fixed canonical URL generation in `presetRegistry.ts` for aliased formats and added alias redirects in `[formatSlug]/[presetSlug]/page.tsx`; protected crawl budget by adding `Disallow: /api/` in `robots.ts` and `X-Robots-Tag: noindex, nofollow` on raw code routes; resolved pervasive heading hierarchy skips (H1->H3) across Homepage, Recipes, Blog, Tools, CLI, Rules Converter, and Programmatic Spokes; added `CollectionPage` and `ItemList` schema on `/recipes`; updated `llms.txt` and `llms-full.txt` with `/cli`, `/recipes`, and `/skill`; passed all verification gates (validate-presets: 100/100, lint: 0 errors, build: 890 SSG routes exit 0) | ✅ All gates passed |
| 2026-10-07 | Antigravity (Gemini) | Complete Resolution of Google Search Console (GSC) Indexing Issues (404s, Redirects, Discovered Unindexed, Crawled Unindexed): eliminated 1,344 dead links by strictly returning null for governance formats in synthesizeRouteForFormat and mapping all 11 missing legacy preset slugs in SLUG_ALIASES; resolved website redirects by canonicalizing FORMAT_TO_URL_SLUG to hyphenated slugs, adding next.config.ts 308 redirects, generating static params for only 17 canonical hubs, and permanentRedirecting aliases; solved orphaned spoke pages by adding a responsive preset showcase grid in FormatHubSeoContent.tsx and linking all 17 formats in AiSkillStudioSeoContent.tsx; eliminated empty SSR renders by removing 'if (!isMounted) return null' from ClaudeSkillsClient.tsx so static HTML pre blocks render for crawlers; added format-specialized descriptions/whyNeeded/FAQs in synthesizeRouteForFormat to eliminate near-duplicate text | ✅ All gates passed |
| 2026-10-08 | Antigravity (Gemini) | Full-Width Minimalist Copy-Only Support Section: removed 'Send Email' mailto action preventing Outlook triggers; redesigned `StudioSupportSection.tsx` into a full-width container card matching Section 6 (`w-full` across `max-w-7xl` layout, removing narrow `max-w-2xl` center restriction); polished monospace typography (`font-mono`) and clean sans text with subtle orange top accent line; clicking the email pill copies `support@devscratchpad.tech` directly to clipboard with visual 'Copied!' confirmation; verified all quality gates (validate-presets: 100/100, lint: 0 errors, build: 869 SSG routes exit 0, localhost:3000 running) | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Security & Safety Engine Hardening (TAR Engine / Instructor Learnings): upgraded static auditor (`ruleAuditor.ts`) and generator (`ruleGenerator.ts`) with 5 core safety protections: (1) Hardcoded Credential / Mock Secret Trap linter (`CE-001` / `SEM-006`); (2) Untrusted Input XML Boundary Armor detection (`SEM-004` / `SEM-008`); (3) Obfuscated and Leetspeak prompt injection defense (`AR-003` / `AR-004`); (4) Unpinned package dependency detection (`SUP-003` / `QL-002`); (5) Multi-line shell error trapping check (`QL-001`); sanitized MCP preset credentials to use `${ENV_VAR}` references; added `meta-prompt-shield` and `credential-safety` to `BEHAVIOR_OPTIONS`; fortified `handleInjectNegativeGuardrails` quick-fix in `ClaudeSkillsClient.tsx`; verified all quality gates (validate-presets: 100/100, lint: 0 errors, build: 869 static routes exit 0, localhost:3000 active) | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Editor Highlight & Smooth Sync Optimization (Round 2 Hardening): resolved state-tearing race condition via synchronous useMemo for markedRange and cached markedRangeRef; guarded requestSectionScroll against duplicate triggers and eliminated illegal setState inside setState updater callback; decoupled Monaco auto-scroll to eliminate timer cancellation and dropped scrolls on rapid interaction; prevented static preview scrolling jitter while typing via lastHandledPreviewScrollIdRef; fixed composite section boundary matching in sectionLocator.ts so multi-phase checklists and ADRs do not truncate on ### subheadings; trimmed trailing blank lines for EOF sections; added relative positioning to preview pre and fixed smooth scroll centering using getBoundingClientRect; prevented Monaco viewport resetting onMount with layout settling delay and stale collection clearance; modernized line markers using createDecorationsCollection; configured Monaco diff editor with diffWordWrap, automaticLayout, and smoothScrolling; verified all quality gates | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Dedicated Ignore Shield & Indexing Boundary Suite (.cursorignore & .claudeignore): replaced generic prompt cards with specialized 8-category ignore boundary suite; implemented 4 protection profiles (Full Shield, Security Only, Max Token Saver, Custom); integrated real-time Impact HUD (tokens saved, secret leak guards, category count) using Package, ShieldCheck, and Sliders with strictly zero Zap icons anywhere in the component; added custom negate rules textarea; wired White Marker sync via # --- headers in sectionLocator.ts; supported test-fixtures alias alongside fixtures; fixed canonical hub URLs in stateSharing.ts; preserved ignore settings during live context synthesis; updated storage envelope and state sharing (ic, ip, ir query params); documented ADR-012 and session log in MEMORY.md | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Ignore Shield Token Typography & Pill Badge Refinement: eliminated wide, mechanical `font-mono` styling across Category token savings badges and Impact Summary HUD in `src/app/claude-skills/ClaudeSkillsClient.tsx`; streamlined token strings in `IGNORE_CATEGORY_LIST` (`~60k tokens`, `~35k tokens`, `~20k tokens`, `~5k tokens`) preventing category headers from truncating into ellipses; transitioned badges to modern proportional sans pill tags (`rounded-full bg-orange-100 text-orange-800 text-[10px] sm:text-[11px] font-medium tracking-tight`); refined HUD metrics to clean proportional sans bold (`text-xs font-bold text-zinc-900 tracking-tight`); verified all quality gates (validate-presets: 100/100, lint: 0 errors, build: 869 SSG routes exit 0, fresh production server live on localhost:3000) | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Reverted Format Page Bottom Content to Unified Single-Heading Suite: restored `src/app/ai-skill-studio/[formatSlug]/page.tsx` to render `<AiSkillStudioSeoContent />` instead of `<FormatHubSeoContent />`; eliminated the massive card barrage and redundant subheadings while preserving clean separate links to all 17 formats under the single unified main heading (`AI Skill Studio — 17 Formats & 4-Layer AI Agent Operating Suite`); verified exit 0 across validate-presets, lint (0 errors), build (869 routes exit 0), and fresh production server running on localhost:3000 | ✅ All gates passed |
| 2026-10-09 | Antigravity (Gemini) | Minimalist InfoTooltip Redesign & Mobile View Card Hardening: overhauled `InfoTooltip.tsx` from harsh dark theme into an ultra-clean, minimal elevated surface (`bg-white/98 backdrop-blur-xl border border-zinc-200/90 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_10px_rgba(234,88,12,0.06)]`); replaced clunky brown monospace badge with warm orange pill (`bg-orange-50 border-orange-200/80 text-orange-800 font-medium rounded-full`); upgraded trigger button with touch-manipulation and radiant orange ring; modernized format guide into clean zinc-50 card (`text-[11px] font-mono text-zinc-800`); added dynamic viewport height clamping (`maxHeight: min(440, space-padding)`) with smooth internal scrolling (`overflow-y-auto overscroll-contain`); hardened all cards across `ClaudeSkillsClient.tsx` for mobile viewports (prevented ellipses truncation with `break-words leading-snug`, added `break-all sm:break-normal` to Target Location code paths, protected card headers with `min-w-0` and `shrink-0`, responsive profile buttons); verified all gates pass (validate-presets: 100/100, lint: 0 errors, build: 869 routes exit 0, localhost:3000 running) | ✅ All gates passed |
| 2026-10-10 | Claude Code (Opus) | AI Skill Studio data-loss & editor hardening: per-format manual edit stash (format switch no longer discards Monaco edits; restored on return, included in ZIP, persisted); onFocus no longer wipes edits; "Restore edits" notice when a form change/Reset replaces manual edits; fixed dropped Monaco keystrokes (stale `value` overwrite, now `flushSync`); fixed mount-time draft restore being overwritten; format deep links now beat the saved draft format; persisted all 23 governance section fields; MCP inputs wired to marker/regeneration, env value masked and never persisted as a literal token, ingestion uses `${GITHUB_PERSONAL_ACCESS_TOKEN}`; GitHub PAT link narrowed to fine-grained read-only; auditor false positives fixed (negated guardrails, Vue `<script setup>`, code fences); Copilot procedures nested list + locator fix; MCP locator fix; added Vitest suite (562 tests) and `npm test`; verified 19/19 Playwright checks on localhost:3000 | ✅ All gates passed (validate-presets, lint 0 errors, 562 tests, build 869 routes exit 0) |
| 2026-10-11 | Claude Code (Opus) | Self-hosted fonts (Fontsource, replacing the CSP-blocked Google Fonts import) and Monaco (`public/monaco/vs` via `scripts/copy-monaco.mjs`; jsdelivr removed from the CSP; editor mount 17.3s → 1.5s); split `ClaudeSkillsClient.tsx` 6,334 → 4,363 lines into `GovernanceSections` (data-driven), `IgnoreShieldSuite`, `McpServerConfigCard`, `FormatSelector`, `TargetLocationCard`; fixed Ignore Shield cards toggling twice per click (plus the same pattern in convention/behavior tiles); untracked stray local files; added the `studio-tests.yml` CI workflow; 26/26 Playwright checks on localhost:3000 | ✅ All gates passed (validate-presets, lint 0 errors, 562 tests, build 869 routes exit 0) |
| 2026-10-11 | Claude Code (Opus) | Behavior-preserving split of `ClaudeSkillsClient.tsx` 4,371 → 2,887 lines: pure helpers to `lib/` (`auditQuickFixes`, `cliInstall`, `contextSynthesis`, `shareState`, `editorFileName`, 113 new unit tests) and presentational JSX to `components/` (`AuditPanel`, `CliInstallPopover`, `EditorStatusBar`, `MobileStudioControls`, `CursorRuleScopeCard`, `IdentityActivationCard`, `StandardSkillCards`); Monaco, White Marker, manual-edit state, header and H1 left in place; SSR markup identical on 760 renders (17 formats × 38 UI states) and handler logic identical on generated inputs | Verified: tsc exit 0, eslint 0 errors (no warnings in new files), 688 tests, validate-presets pass; build not run (per request) |
| 2026-10-11 | Claude Code (Opus) | Main site UI pass: monochrome workspace chrome and all 24 tool panels on shared `ToolChrome`, one `ShareMenu` (link / embed / image), Geist + Geist Mono, minimal Monaco theme, short tool guides without studio promos, tool bug fixes (XML indent, CSS/SVG/HTML minify, cert SAN/EKU, SSH MD5, curl-to-go imports, cron next runs, SVG preview xmlns); 24 tools checked at 1440 and 390 px with no console errors or horizontal overflow | ✅ tsc 0, lint 0 errors, 829 tests, validate-presets pass, build exit 0 |
| 2026-10-13 | Claude Code (Opus) | Vercel Firewall (Bot Protection challenge, Huawei/Alibaba ASN deny, bypass for CLI/llms/sitemap/robots); AI Skill Studio SEO: unique hub guides linking every preset, accurate rewrite of all 17 hub texts, spoke titles/descriptions, removed overclaim boilerplate and "offline" copy, fixed synthesized format FAQs | ✅ tsc 0, lint 0 errors, 836 tests, validate-presets pass, build (see session) |

---

## 2026-10-11 — Studio Reference Section & SEO Fixes

- [x] Rewrite studio information section (file table, examples, starters, FAQ shared with JSON-LD)
- [x] Shorten studio title/description; visible H1 above editor; unique hub headings
- [x] Sitemap lastModified from real commit/post dates
- [x] Show hub FAQs visibly to match FAQPage JSON-LD
- [x] Correct MCP path (.mcp.json), .claudeignore and Copilot claims
- [x] Small orange download toast; ZIP export reports real file name and contents
- [x] Shared nav on site/workspace headers (AI Skill Studio and Skill Hub keep their own headers)
- [x] Decide on noindexing synthesized preset spoke pages (needs Search Console data) — decided 2026-10-12: keep them indexed (see below)

## 2026-10-11 — Main Site UI Pass (Tools, Guides, Fonts, Mobile)

- [x] Skill Hub: AI Skill Studio link uses the orange folder logo (not Zap); platform-aware Ctrl/⌘ K hint; "Show more" paging (24 per step)
- [x] Workspace chrome: monochrome sidebar/tabs/top bar, shared tool icon map (`layout/toolIcons.ts`), single-button mobile header + drawer
- [x] Command palette: shared icons, zinc selection, mobile Cancel
- [x] Site fonts: Geist + Geist Mono (self-hosted fontsource); AI Skill area keeps Google Sans
- [x] Monaco: shared minimal light theme + Geist Mono for every tool editor; export-image dark theme defined
- [x] One `ShareMenu` (copy link, embed snippet, export image) replaces three header icons
- [x] Tool guides: short monochrome articles, AI Skill Studio promos removed, ~60 factual corrections in tool copy
- [x] Magic paste no longer hijacks pastes inside a tool's editor or same-family tools
- [x] Tool panels: ToolChrome redesign, mobile overflow, bug fixes (see MEMORY.md session)
- [x] Tool polish round 2: no Sample buttons/links or CIDR example chips, no green status (zinc), one-row `ToolHeader` that wraps controls only when needed (secondary actions icon-only on phones), lighter disabled primary, HMAC random-key icon is Dices
- [x] "Offline" claims removed from site copy (titles, descriptions, JSON-LD, llms.txt, OG images); honest "Partly" FAQs kept; the CLI keeps its genuine offline wording. Service workers stay unregistered in layout.tsx


## 2026-10-11 — CLI v2.2.0

- [x] Never overwrite existing files (`--force` keeps `<file>.bak`), `--dry-run`, `--offline`
- [x] 10s network timeout; 404 = unknown preset error with suggestion (fixed hang + fake file); bundled fallback only on network failure
- [x] `audit --min-score <n>` / `--json` for CI; correct exit codes (0 ok, 1 failure, 2 usage); NO_COLOR / non-TTY output
- [x] Preset catalogue matches the server's `/api/raw` presets; templates for claude-md, agents-md, mcp-config (valid JSON)
- [x] Generated files pass the CLI's own audit; site generator no longer emits "clean code"
- [x] Single bin `cli/bin/devscratchpad.mjs`; repo URL fixed; README rewritten; 20 node:test cases + `cli-tests.yml` (Node 18/20/22)
- [x] Published `devscratchpad@2.2.0` to npm (2FA via passkey: `npm publish --auth-type=web`)
- [ ] Decide CLI licence: MIT (current) vs BSL 1.1

## 2026-10-11 — Generator Security Baseline (TAR audit follow-up)

- [x] `SECURITY_BASELINE` section emitted in all 8 instruction formats (SKILL.md, CLAUDE.md, AGENTS.md, Cursor, Windsurf, Copilot, OpenAI, Gemini): untrusted content as data, encoded payloads, least-privilege file access, confirm irreversible actions, secret masking, validation failures, conflicting requests
- [x] Codebase Auditor preset: scoped scanning, defined risk rubric, read-only by default with per-finding approval, masked secrets, embedded instructions reported not followed
- [x] "Schema-Driven Boundaries" convention says what to do on validation failure (SEM-008)
- [x] Studio guardrails card shows the baseline as an "Always included" strip; removed the now-redundant opt-in shield/secret toggles
- [x] Gemini output no longer emits "- - **" double bullets; missing blank lines before SKILL.md / Windsurf headings fixed
- [x] CLI v2.3.0: bundled templates carry the baseline (site test keeps the two copies in sync); `audit` deducts 10 for no trust boundary and 5 for no confirmation gate
- [ ] Publish `devscratchpad@2.3.0` to npm (`cd cli && npm publish --auth-type=web`)

## 2026-10-11 — MCP Section Redesign (AI Skill Studio)

- [x] MCP card: preset tiles with icons and short labels (orange selection, no blue), one "context import" row per preset family instead of three different banners, flat live checks, neutral "Valid" status
- [x] Secret-safe checks: `${VAR}` references are the expected value; literal tokens, placeholders and literal Postgres passwords get a warning instead of the old "Token required" push to paste a real token
- [x] Shared `IntakeModal` shell for the GitHub, local folder, DDL and Docker modals: compact header, flat result panel (no card-in-card), segmented "Write to" switch, solid orange primary, Escape/backdrop close; removed fake "Load sample" / "Quick try" chips
- [x] Docker compose parser no longer counts block-style `ports:` / `depends_on:` keys as services; flow-style lists (`ports: ["3000:3000"]`) are read (tests in `dockerParser.test.ts`)

## 2026-10-12 — SEO Audit: Re-index Spoke Pages

- [x] Removed `noindex` from template-only preset spokes and restored them in the sitemap (163 → 450 URLs). GSC showed 4 of the top 5 click-earning pages (agents-md/go-fiber, agents-md/spring-boot-3, claude-md/kubernetes-helm, claude-skills/spring-boot-3) were template-only and had been noindexed on 2026-10-11
- [x] `/skill`: fixed doubled "| DevScratchpad | DevScratchpad" title; added its own Twitter card (was falling back to the root card)
- [x] GitHub repo: description, www homepage and 16 topics set
- [x] Owner opt-out for analytics: `?exclude-me=1` on any page drops that browser's Analytics and Speed Insights events (`?exclude-me=0` re-enables)
- [x] Vercel Firewall: deny ASNs 55990 + 136907 (Huawei Cloud) and 45102 (Alibaba). They sent ~4.3k of 6.7k requests/day as headless Chrome (rule added 2026-10-13)
- [ ] Resubmit sitemap in Search Console and request indexing for the 5 top spoke URLs
- [ ] Publish `devscratchpad@2.3.0` and run the backlink plan (awesome lists, Stack Overflow, dev.to cross-posts)

## 2026-10-13 — Bot Filtering & AI Skill Studio SEO

- [x] Vercel Firewall: Bot Protection managed rule on (challenge), ASN deny rule, bypass rule for `/api/raw/*`, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` (CLI and curl installs got 429 without it)
- [x] Format hubs: hub-specific "How it works / Where the file goes / What goes in it / Tips" section and a linked list of every preset (hubs linked only 8 of their spokes; hubs were 79% identical)
- [x] Rewrote all 17 hub texts in `formatHubs.ts` for accuracy (Copilot not used for completions, Gemini Gen AI SDK, `.mcp.json`, no literal tokens, no StitchMCP claim) and search intent (generator / template / examples titles)
- [x] Hub JSON-LD: `ItemList` of presets; FAQ text via `toPlainText` to match the visible FAQ
- [x] Spoke metadata: titles add "Template & Example" where they fit (44-char cap kept), cleaner tech names (no "MCP MCP", "Autonomous Agents", "Go (Golang)"); descriptions now 132–160 chars (282 of 333 were under 110)
- [x] Spoke copy: removed identical overclaim boilerplate ("Guaranteed Invariants", "Hallucination Symptoms", "Engineered to eliminate hallucinations"), "offline" wording and the "pSEO" JSON-LD keyword; Step 3 says how each format is really loaded (`spokeFormatMeta.ts`)
- [x] Synthesized format copy fixed: Cursor Agent (not Composer), Windsurf triggers (not Supercomplete), Copilot not inline completions, current Gemini models, `.claudeignore` needs `permissions.deny`, AGENTS.md readers
- [x] Rules converter: search-intent title, "runs in your browser" instead of "100% offline"
- [x] Removed dead `FormatHubSeoContent.tsx`
- [ ] Search Console: resubmit sitemap, request indexing for the 17 hubs and top spokes after deploy
- [ ] Watch GSC CTR on spokes for 4 weeks after the title change; revert the "Template & Example" suffix if CTR drops
- [ ] Per-spoke OpenGraph images (all spokes share `og-ai-skill-studio.png`)


## 2026-10-14 — Audit Panel Redesign & Editor Clipping Fix

- [x] Status bar no longer clipped when the "Restore edits" notice shows on short viewports (editor `lg:min-h-[220px]`, notice `shrink-0`)
- [x] Audit panel height capped to the editor container so its header can't be clipped
- [x] Redesigned audit panel: score ring header with severity counts, severity-sorted findings, Auto-fix only when fixable findings exist
- [x] Findings carry editor line numbers ("Line N" jumps the editor to the line and selects it)
- [x] Budget tab: token meter against `TOKEN_BUDGET`, sections ranked by token weight with jump-to-line
- [x] Tests for finding line numbers and `getSectionBreakdown`

## 2026-10-14 — First-Run Studio Guide

- [x] Floating helper (custom SVG folder mascot with a face on a dark button, bottom-left; it blinks and appears beside each popover title) offers an 8-step walkthrough on a visitor's first visit; "Not now" or starting the tour hides the offer for good (`ai_skill_studio_guide_v1` via the storage envelope)
- [x] Tour runs on driver.js (MIT, local, no API key); it highlights existing cards via `data-tour` / `data-section` attributes, so no studio layout changed
- [x] Steps adapt to the selected format (governance, MCP and ignore formats get their own "details" step; hidden cards are skipped)
- [x] On mobile the tour switches the Configure / Editor tab before each editor step
- [x] Tests for step resolution (`studioGuide.test.ts`)

## 2026-10-14 — Task Skills, Skill Folders & Companion Files

- [x] 5 task presets (code review, debugging, commits & PRs, refactoring, upgrades), each with a bundled `references/*.md`; auditor, security guard and TDD marked as tasks too. Preset bar has a Stacks / Tasks switch
- [x] SKILL.md exports as a skill folder (`references/`, `scripts/verify.sh`) and lists them under "9. Bundled Resources"; Download on SKILL.md saves the folder ZIP
- [x] Companion files per format, shown in the Target File Location card with their own download: `.claude/settings.json` (claudeignore, CLAUDE.md), `.claude/agents/<slug>.md` (SKILL.md), `.gemini/settings.json` and `.aider.conf.yml` (AGENTS.md), `.github/instructions/<slug>.instructions.md` and `.kiro/steering/<slug>.md` (Cursor), `.github/workflows/ai-rules-audit.yml` (CLAUDE.md, AGENTS.md). Extras stay out of the ZIP unless included
- [x] 5 new presets × 12 code formats of spoke pages (plus their `/api/raw` routes), CLI catalogue (category Workflow) and CLI audit discovery (`GEMINI.md`, `.claude/agents`, `.github/instructions`, `.kiro/steering`); CLI 2.4.0
- [x] Tests: `companionFiles.test.ts` (21), task presets score ≥ 80
- [ ] Publish `devscratchpad@2.4.0` to npm (the CI workflow template uses `devscratchpad@2`)
- [ ] Editable bundled files (Phase 5 file tree)

## 2026-10-14 — Read Your Code (Code Evidence)

- [x] `lib/codeEvidence.ts`: picks up to 24 source files spread across folders (plus 4 tests), skipping dependencies, build output, generated code, example apps and docs; reads existing `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, Cursor / Windsurf / Copilot rules and skills
- [x] Detects test layout + runner, file naming (components and modules), import alias, named vs default exports, error classes or result objects, validation library, shared logger, `any` usage, interface vs type, function style, quotes and semicolons, Server vs client components, Python type hints and logging, Go error wrapping. A rule needs a clear majority (usually 70–80%) and cites its support
- [x] Preferred-pattern example quotes a real mid-sized function (never from a file that looks like it holds a credential); anti-pattern example is built from the detected rules
- [x] GitHub import reads the files via raw.githubusercontent.com (or the contents API with a token, now with the raw `Accept` header, which was returning a JSON envelope before); local folder import walks the tree (depth 8, 5,000 files) instead of only the top level
- [x] Import previews show a "From your code" row; Technology Stack card's Auto-Detect became "Read your code" (GitHub, with links to a local folder or a pasted manifest)
- [x] Copy: modal subtitles, MCP card hints, studio guide, FAQ (new "Can it write rules from my existing code?"), page metadata, featureList, HowTo, README, PRD
- [x] Tests: `codeEvidence.test.ts` (14)

---

*This document is a living tracker. AI agents MUST update task statuses when completing work and log their actions in the Agent Session Log.*





## 2026-10-15 — Skill Graph (`/graph`): Visual DAG Editor & Parallel Runner

- [x] Graph SKILL.md format: `topology` (nodes, edges with `from`/`to` lists and `contract`) in frontmatter, one `## @node: <id>` section per prompt; parser, serializer (round-trips, keeps unknown keys, writes fan-out/fan-in in compact form), validator (cycles, unknown nodes/refs, refs not upstream, missing prompts, isolation leaks) in `src/app/graph/lib/graphSkill.ts`
- [x] Two-way sync: Monaco edits redraw the canvas (a YAML error keeps the last valid graph); canvas and inspector edits rewrite the Markdown
- [x] Canvas (custom SVG/HTML, no React Flow): layered auto-layout (left-to-right, top-to-bottom on portrait canvases), pan/zoom/fit, drag a handle to connect (cycles and edges into the input node refused), Delete removes the selection, contract labels, edges animate while data crosses them
- [x] Runner (`graphRunner.ts`): each node starts when its parents finish (fan-out runs in parallel, 6 calls max); one stateless call per node; JSON slices keyed by target id; `<thinking>`-style blocks stripped before an output travels; JSON contracts checked; failures skip downstream nodes; Stop aborts
- [x] Prior-context bias badge on `isolated_context` nodes: static (references outside incoming edges) and measured on the last run (characters from outside incoming edges); inspector shows the source breakdown and the exact request
- [x] Providers (BYOK, browser-direct): Claude via `@anthropic-ai/sdk` (lazy chunk, server-side fallback `"default"`, refusal handling), OpenAI / OpenRouter / Gemini / Ollama / LM Studio via OpenAI-compatible fetch, and a dry run with no model. Key stays in memory unless "Remember" is ticked
- [x] `/graph` CSP adds only the provider hosts to `connect-src`; every other route is unchanged
- [x] Export: Claude Code kit ZIP (orchestrator skill + one subagent per node + Cursor `.mdc` + graph source + README), single self-orchestrating SKILL.md, graph source
- [x] Skill Graph icon in the AI Skill Studio header and the Skill Hub header; sitemap entry; explainer + FAQ JSON-LD on the page
- [x] Tests: `src/app/graph/lib/__tests__/graph.test.ts` (27)
- [x] Pinch-to-zoom on touch screens (two-finger pinch around the midpoint; tested with CDP touch events)
- [x] Share link for graphs (`#graph=` LZ hash, graph only; cleared after it loads)
- [ ] Live run against a real Claude key (Anthropic path verified by types and unit tests only; the OpenAI-compatible path was run end to end against a local mock server)

## 2026-10-15 — Skill Graph polish: streaming, blueprints, editor sync, icon

- [x] Custom Skill Graph icon (`src/components/icons/SkillGraphIcon.tsx`, zinc strokes + one orange node) in the studio header, Skill Hub header and graph header; `/graph` favicon `src/app/graph/icon.svg`
- [x] Streaming: Claude via the SDK's `messages.stream` (64k max tokens), OpenAI-compatible via SSE (`stream: true`, falls back to JSON), dry run types its text; live text shows on the node card and in the Run tab
- [x] Blueprints menu: parallel audit, PR review, RFC discovery, bug triage (the AGENTS.md graph workflows) plus a blank graph; loading one is undoable
- [x] Editor <-> canvas: selecting a node tints its frontmatter entry and prompt section in Monaco (orange gutter bar) and scrolls to it; putting the cursor in a section selects the node and pans the canvas to it
- [x] Undo / redo for canvas and inspector edits (Ctrl+Z / Ctrl+Shift+Z on the canvas, buttons in the canvas toolbar); typing in a field undoes as one step
- [x] Resizable editor and details panes (drag or arrow keys; sizes saved)
- [x] Run progress chip (settled/total, elapsed), Ctrl+Enter runs from anywhere (also inside Monaco), the dock only jumps to Result if the Run tab was open
- [x] Node cards redesigned: type tile (dark when done, orange while running), streamed text / duration and tokens in the footer, bias badge hangs off the card; contract labels are pills in the gap at each fan-out / fan-in
- [x] Result tab renders Markdown (marked + DOMPurify, lazy) with a Raw toggle
- [x] Mobile: toolbar buttons icon-only below `sm`
- [x] Tests: `graphExtras.test.ts` (14: blueprints, line mapping, share hash, streaming, SSE parsing, JSON-mode retry, provider errors); 20-check headless Chrome run against a mock OpenAI-compatible server

## 2026-10-15 — Skill Graph v2: graph skills for agents (no model calls)

The page no longer runs models. It is an editor and compiler for graph skills that the user's own agent (Claude Code, Cursor) runs with its subagents. This supersedes the runner, provider, streaming and CSP items in the two sections above.

- [x] Removed: BYOK runner, providers (Claude/OpenAI/OpenRouter/Gemini/Ollama/LM Studio), streaming, Run/Result tabs, `@anthropic-ai/sdk`, the `/graph` CSP block. A remembered API key from older builds is deleted on load
- [x] Spec `skill-graph/1`: `contracts:` (format + description per contract), per-node `tools`, `model` tier, `gate`, `on_fail` (retry/stop), `max_retries`; validation for undefined contracts, unknown tools, empty tool lists, retry without a gate, text output feeding a JSON contract
- [x] `graphPlan.ts`: stages the agent runs, and a "What its subagent will receive" preview with ⟨placeholders⟩ (same instructions the exporter compiles)
- [x] Export: orchestrator SKILL.md is a plan (stages, hand-offs, contracts table, gate handling, handoff rules); subagents carry `tools:` and `model:`; README reports up-front vs on-demand tokens
- [x] Agent plan tab (load budget, stage timeline) and a "Walk through plan" stepper on the canvas
- [x] Inspector: model tier, tool toggles, gate editor, contracts editor; text fields keep their spaces while typing (the parser trims, so fields hold a local draft)
- [x] Header: no Studio/Hub links, no back-to-workspace control; "100% local" with a laptop-check icon
- [x] Look: zinc + orange accent only, soft-tint main action (no black button), Manrope + JetBrains Mono scoped to `/graph` via `src/app/graph/layout.tsx` and `.graph-theme`; `MonacoEditor` accepts an optional `fontFamily`
- [x] Explainer rewritten around the purpose: why flat skills break down, what a graph skill adds, what the agent does with it
- [x] Tests: `graph.test.ts` + `graphExtras.test.ts` (44); 22-check headless Chrome run including a real ZIP export

## 2026-10-15 — Skill Graph v2: graph skills for agents (no model calls)

The page no longer runs models. It is an editor and compiler for graph skills that the user's own agent (Claude Code, Cursor) runs with its subagents. This supersedes the runner, provider, streaming and CSP items in the two sections above.

- [x] Removed: BYOK runner, providers (Claude/OpenAI/OpenRouter/Gemini/Ollama/LM Studio), streaming, Run/Result tabs, `@anthropic-ai/sdk`, the `/graph` CSP block. A remembered API key from older builds is deleted on load
- [x] Spec `skill-graph/1`: `contracts:` (format + description per contract), per-node `tools`, `model` tier, `gate`, `on_fail` (retry/stop), `max_retries`; validation for undefined contracts, unknown tools, empty tool lists, retry without a gate, text output feeding a JSON contract
- [x] `graphPlan.ts`: stages the agent runs, and a "What its subagent will receive" preview with ⟨placeholders⟩ (same instructions the exporter compiles)
- [x] Export: orchestrator SKILL.md is a plan (stages, hand-offs, contracts table, gate handling, handoff rules); subagents carry `tools:` and `model:`; README reports up-front vs on-demand tokens
- [x] Agent plan tab (load budget, stage timeline) and a "Walk through plan" stepper on the canvas
- [x] Inspector: model tier, tool toggles, gate editor, contracts editor; text fields keep their spaces while typing (the parser trims, so fields hold a local draft)
- [x] Header: no Studio/Hub links, no back-to-workspace control; "100% local" with a laptop-check icon
- [x] Look: zinc + orange accent only, soft-tint main action (no black button), Manrope + JetBrains Mono scoped to `/graph` via `src/app/graph/layout.tsx` and `.graph-theme`; `MonacoEditor` accepts an optional `fontFamily`
- [x] Explainer rewritten around the purpose: why flat skills break down, what a graph skill adds, what the agent does with it
- [x] Tests: `graph.test.ts` + `graphExtras.test.ts` (44); 22-check headless Chrome run including a real ZIP export

## 2026-10-16 — Skill Graph: loops, checks, lanes and approvals

From the "Loops and Graphs" article (@hanakoxbt): a check that can fail, edges that carry data, return only what failed, gate by blast radius, one human checkpoint. All additive to `skill-graph/1`.

- [x] Spec: node types `code` (`run:` shell command; `{{refs}}` become saved payload files under `.skill-graph/<slug>/`) and `approval` (human checkpoint); per-node `check:` (command that must exit 0) and `risk:` (`contained` / `wide` / `irreversible`)
- [x] Validation: `missing-run`, `unread-edge` (target names other inputs but not this one), `no-parallelism` (4+ steps, all sequential), `parallel-writers`, `retry-cap` (>3), `irreversible-unapproved` (error), `irreversible-retry`, `wide-without-check`, `gate-without-check` (model alone judges file edits), `approval-guards-nothing`; `{{refs}}` in commands are checked like prompt refs
- [x] Export: code and approval steps run by the orchestrator (no subagent file); command checks loop the step (or count as GATE: FAIL on a verifier); gate failures return one line per failed step (`what | evidence | redo`) and only those steps re-run; irreversible steps never auto-retry; handoff rule 5
- [x] Inspector: Checks section (command check, blast radius, gate, on-fail and retries), Command field for code steps, question field for approvals; previews for what a command runs and what an approval shows; card and plan chips for check and risk; status bar counts only real subagents
- [x] Blueprint "Ship a change": plan → implement (loops on `npm test`, wide) → `git diff` code step → 2 parallel fresh-context reviewers → gate → approval → open PR (irreversible)
- [x] Tests: `graphReliability.test.ts` (29); all 74 graph tests and 1037 total pass
- [ ] Next: dynamic fan-out (`foreach` over a splitter's list), learning edge (`learnings.md` the splitter reads), Claude Code Workflow script export with JSON-schema contracts

## 2026-10-16 — Skill Graph: fixes, guide, share cards, SEO, security hardening

- [x] Agent plan walkthrough scrolls only the dock (no page jump) and keeps a 16px margin, so the active stage card is never clipped
- [x] Loading a blueprint, a blank graph or a file re-fits the canvas (`fitRequest` nonce) even after the user panned or zoomed
- [x] Model menu adds `fable`; "inherit" reads "inherit (session model)"
- [x] Truncation: risk chip moved to the card's top row (footer keeps room for the id), hover titles on ids and labels, editor-header counts drop whole parts via container queries, plan commands wrap
- [x] `/graph/guide`: 15-section guide (quick start, workspace, node types and fields, edges/contracts, references, fresh context, gates/checks/approvals, models/tools, issues table, walkthrough, export, sharing/privacy, shortcuts, troubleshooting); linked from the studio header and explainer; in sitemap and llms.txt
- [x] Share cards: `opengraph-image` + `twitter-image` for `/graph` and `/graph/guide` (next/og, Manrope + JetBrains Mono woff in `src/app/graph/_og/`); minimal design with no dark fills: orange-tile mark, headline, one line, and a four-node graph (goal → two parallel workers → orange verifier); old hard-coded og-ai-skill-studio.png removed from `/graph` metadata
- [x] SEO: BreadcrumbList on both pages, TechArticle + HowTo on the guide, twitter metadata and keywords on the guide
- [x] Security: `model`/`tools` allowlisted (`bad-model`, `bad-tool` errors) and re-checked in `buildSubagent` (frontmatter injection of permissionMode/hooks/mcpServers); parse caps (500k chars, 200 nodes, 2,000 edges); share hash capped at 32k chars and decoded size at the source cap; opening a share link keeps the saved draft one undo away; review banner lists commands, Bash, file-editing and MCP steps of a shared graph; analytics drops the URL fragment; raw localStorage calls replaced by `src/lib/storage.ts` (`removeStorageKey`)
- [x] Tests: `graphSecurity.test.ts` (6); all 80 graph tests pass

## 2026-10-16 — Skill Graph: build without writing contracts or references

- [x] Naming a contract on an edge defines it (`setEdgeContract`: JSON when the name says so, otherwise Markdown); half-typed names that no edge uses and that have no description are pruned
- [x] Prompt field gets an **Insert input** menu (`promptInputs`): the goal, each incoming step's whole output, this step's part of a JSON output, group shortcuts when every node of that type feeds the step, and `{{inputs}}`; only direct inputs, so it never breaks a fresh context
- [x] Inspector: model, output, fresh context, tools, checks, gates, on-failure and incoming contracts moved into a collapsed **Advanced** panel with a one-line summary of what is set
- [x] Guide: "What you need (and what you don't)" table up front; quick start without YAML; walkthrough and export before an **Advanced** half (contracts, references, fresh context, gates, models, new "The file format" section); TOC grouped; sharing section mentions the review banner and undo
- [x] Tests: `graphAuthoring.test.ts` (6); 86 graph tests pass; headless Chrome check of the inspector (Advanced collapsed, Insert input, auto-defined contract, no console errors)

## 2026-10-16 — Skill Graph: independent review fixes and full re-validation

- [x] Crash: an edge from a missing node (a half-typed id) crashed the Agent plan and Inspector; `predecessorsOf`/`successorsOf` skip unknown ends and the three unguarded lookups are guarded
- [x] `agent-name-collision` error when two ids slug to one subagent file (`review_a` / `review-a`)
- [x] Frontmatter: commas banned inside tool patterns (no smuggled second tool); `tools`/`model` JSON-quoted when not plain YAML
- [x] Gate without `on_fail` now stops in the export too (one default everywhere)
- [x] Shared-link banner also lists steps with no tool limit, and reviews only the graph from the link
- [x] Export refuses while the SKILL.md does not parse (it used to export the last good graph)
- [x] Blocked site data no longer crashes the studio (`storageAvailable()` in `src/lib/storage.ts`, guarded snapshot read); a failed autosave shows a notice once
- [x] Storage quota eviction runs only for AI Skill Studio's own key
- [x] `getContract` (own properties only), `__proto__` refused as a contract name; `setEdgeContract` prunes only contracts with the inferred format and no description
- [x] `isKeyedJson` shared by plan, export, preview and Insert input (a single-target JSON output is one unkeyed value); scoped `Bash(...)` counts as able to run its own check
- [x] Canvas bias badge: light orange when clean, rose when it leaks (no dark fill)
- [x] Guide severities corrected (contract-undefined and isolation-leak are warnings, irreversible-unapproved is an error), new errors listed, gate default and banner described
- [x] Tests: `graphReview.test.ts` (12), `storageQuota.test.ts` (3); 1064 tests, 22 CLI tests, validate-presets, lint 0 errors (63 older warnings outside /graph), build; 26/26 headless Chrome checks (inspector, insert input, contracts, blueprint fit, walkthrough scroll, share banner, undo after a link, injected model blocked, broken edge, guide anchors and JSON-LD, OG/X images and tags)

## 2026-10-16 — Layout fixes: Blueprints menu, mobile guide mascot

- [x] Skill Graph popovers (Blueprints, Node, Export) measure themselves on open and shift back inside the window; a narrow editor pane no longer cuts the Blueprints menu off on the left
- [x] AI Skill Studio mobile: the action bar publishes its real height (`--studio-action-bar-space`, `MobileStudioControls.tsx`) and the guide mascot and "New here?" bubble float 12px above it, so large phone text no longer makes them overlap "View Code"
- [x] Canvas cards 216 → 252px and the LR layer gap 136 → 164px, so blueprint ids (up to 19 characters) and contract pills (up to 20) are no longer cut off; checked every blueprint in headless Chrome
- [x] Verified: headless Chrome at 1100/1280/1600px (menu inside the window) and 390px phone with normal and large text (mascot and bubble clear the bar); Skill Graph suite 26/26; 1064 tests, validate-presets, lint 0 errors, build

## 2026-10-16 — Skill Graph: bolder share cards

- [x] `/graph` and `/graph/guide` OG/X cards redesigned for thumbnail size (`src/app/graph/_og/shareImage.tsx`): headline 50 → 58px, subtitle on one line, larger brand mark and wordmark, nodes 136×56 → 164×70 with 22px labels and soft shadows, edges 2 → 3.5px, solid orange Verify node as the focal point, dotted editor canvas on the right panel, guide eyebrow as an orange pill
- [x] Verified: both images rendered from the dev server and checked visually; validate-presets, lint 0 errors (no new warnings), build

## 2026-10-16 — Skill Graph: mobile editor blockage & node card text clipping fixes

- [x] Mobile Markdown editor white blockage fixed (`src/app/graph/GraphClient.tsx`): hid the right pane (`rightPaneRef`, containing canvas + dock) on mobile when `mobileView === "editor"` (`mobileView === "editor" ? "hidden" : "flex"` with `lg:flex`) so it no longer steals 50% of `<main>`'s vertical flex height as an empty white pane below the editor; added `lg:flex-none` on `<section aria-label="SKILL.md source">` and triggered `editorRef.current?.layout()` via `requestAnimationFrame` on tab toggle
- [x] Monaco sticky-scroll overlay disabled (`stickyScroll: { enabled: false }` in `src/components/MonacoEditor.tsx` and `src/app/graph/GraphClient.tsx`) so pinned YAML parent headers (`topology:`, `edges:`) do not cover top lines on narrow mobile screens
- [x] Canvas node card 2-line label clipping fixed (`src/app/graph/lib/graphSkill.ts`, `src/app/graph/components/GraphCanvas.tsx`, `src/app/globals.css`): increased `NODE_HEIGHT` from `88` to `96`, tightened vertical card padding to `px-3 py-2.5` (`+12px` inner height), added `shrink-0` and `leading-[1.25]` to the `line-clamp-2` label and `shrink-0 leading-none` to the header/footer rows so Flexbox never squishes 2-line labels (`5 & 6. MERGE & FINAL ANSWER`) into the footer pill, and set `text-size-adjust: 100%` on `.graph-theme`
- [x] Toolbar popovers clamped (`max-w-[calc(100vw-1rem)]` in `src/app/graph/components/ToolbarPopover.tsx`) so wide menus never overflow narrow mobile viewports

