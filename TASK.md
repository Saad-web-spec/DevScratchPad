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
  - [x] .cursorignore
  - [x] .claudeignore
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
- [ ] Support for scripts/, references/, assets/ directories in skills
- [ ] Preview code files within studio tabs
- [ ] Export as structured .zip or self-extracting shell script
- [ ] CLI `add` command support for multi-file bundles

## Phase 6: Rule Importer & Two-Way Auditor 📋

- [ ] Import existing .cursorrules / .mdc files
- [ ] Import existing CLAUDE.md / SKILL.md files
- [ ] Token count analysis and waste detection
- [ ] Cross-format conversion (e.g., .mdc → SKILL.md)
- [ ] Optimization suggestions with before/after preview
- [ ] Bulk repository rule health dashboard

## Phase 7: PromptCraft Studio — Multi-Route Architecture (Hub + Dedicated Studios) ✅

- [x] Web Worker isolation (`src/app/promptcraft-studio/worker/inference.worker.ts`)
  - [x] `@huggingface/transformers` v3 in-browser pipeline (`onnx-community/Qwen2.5-0.5B-Instruct` q4 ONNX)
  - [x] WebGPU hardware probe with graceful WASM fallback
  - [x] Real-time streaming generation loop
  - [x] Real-time download progress callbacks (`progress_callback`)
- [x] 3-Page Clean Multi-Route Architecture
  - [x] Pitch Dark & Orange Sleek Hub Page (`/promptcraft-studio`): `#09090B` canvas, glowing Fox-Orange typography (`#FF6B00 → #EA580C`), glowing Fox logo, platform overview, architecture breakdown, visual route launchers.
  - [x] Dedicated Image Prompt Studio (`/promptcraft-studio/images`): Clean photographic workspace for Midjourney v6.1 & Flux.1 with optical lens glass, aspect ratios (1:1, 16:9, 9:16, 4:5, 2:3, 4:3), lighting, stylize slider, raw mode switch, and output terminal. Zero timeline clutter.
  - [x] Dedicated Video Prompt Studio (`/promptcraft-studio/video`): Clean cinematic workspace for Kling 2.0, Runway Gen-3 & Sora with camera vectors, motion intensity (1-10), FPS (24/30/60), duration (5s/10s), temporal video timeline builder, and output terminal.
- [x] Dismissible Model Notification Badge (`ModelNotificationBadge.tsx`)
  - [x] Floating notification with live download % progress bar, MBs loaded / ~310 MB, and filename
  - [x] Single-click `✕` dismiss action that permanently hides the badge so it never bloats the screen
- [x] Unified Header with Transparent Fox Logo (`StudioHeader.tsx`)
  - [x] Transparent Fox Logo (`/promptcraft-fox-clean.png`) + "PromptCraft Studio"
  - [x] Mode switcher tabs: `Overview` (`/promptcraft-studio`) | `🖼️ Images` (`/promptcraft-studio/images`) | `🎬 Video` (`/promptcraft-studio/video`)
  - [x] Direct button linking to **AI Skill Studio** (`/ai-skill-studio`) with sparkles icon
  - [x] Compact WebGPU status badge (green pulse when ready)
- [x] Output & Export Layer (`OutputPanel.tsx`)
  - [x] Mode-filtered engine tabs (shows only image engines on image page, video engines on video page)
  - [x] Monaco-style `#09090B` code box with blinking cursor and real-time streaming
  - [x] 32px status bar (chars, words, tok/s, elapsed ms)
  - [x] Side-by-side & unified Diff Inspector
  - [x] Structured JSON exporter & .txt downloader
  - [x] URL hash state sharing (`#data=...` via LZ-String)
- [x] Hydration error permanently resolved: Client components mounted safely without SSR attribute mismatch

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

# 4. CLI smoke test
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

---

*This document is a living tracker. AI agents MUST update task statuses when completing work and log their actions in the Agent Session Log.*



