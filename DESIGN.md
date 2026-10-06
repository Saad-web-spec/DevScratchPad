# DevScratchpad — Design System & Technical Architecture

## Document Metadata
- Version: 1.0.0
- Last Updated: 2026-09-20
- Compatibility: StitchMCP `upload_design_md`, Cursor IDE, Claude Code, Windsurf Cascade

---

## 1. Design Tokens & Visual Language

### 1.1 Color Palette

| Token Name | Hex Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#09090B` | `bg-zinc-950` | Primary page background, single unified canvas |
| `--bg-elevated` | `#121215` | `bg-[#121215]` | Tool cards, modals, floating panels |
| `--bg-surface` | `#18181B` | `bg-zinc-900` | Input fields, code editor backgrounds |
| `--border-default` | `#27272A` | `border-zinc-800` | Card borders, separator lines |
| `--border-focus` | `#3F3F46` | `border-zinc-700` | Focused input borders |
| `--text-primary` | `#FAFAFA` | `text-zinc-50` | Primary headings, body text |
| `--text-secondary` | `#A1A1AA` | `text-zinc-400` | Labels, descriptions, muted text |
| `--text-muted` | `#71717A` | `text-zinc-500` | Timestamps, footnotes |
| `--accent-blue` | `#2563EB` | `text-blue-600` | Primary action buttons, active links |
| `--accent-blue-hover` | `#1D4ED8` | `hover:bg-blue-700` | Button hover states |
| `--accent-emerald` | `#10B981` | `text-emerald-500` | Success states, valid indicators |
| `--accent-amber` | `#F59E0B` | `text-amber-500` | Warning states, heuristic alerts |
| `--accent-red` | `#EF4444` | `text-red-500` | Error states, critical audit findings |
| `--accent-purple` | `#8B5CF6` | `text-violet-500` | AI/ML related badges and highlights |

### 1.2 Typography

| Role | Font Family | Tailwind Class | Weight | Size |
| :--- | :--- | :--- | :--- | :--- |
| Headings (H1) | Inter / Geist Sans | `font-sans` | 700 (Bold) | 2rem / 32px |
| Headings (H2) | Inter / Geist Sans | `font-sans` | 600 (Semibold) | 1.5rem / 24px |
| Body Text | Inter / Geist Sans | `font-sans` | 400 (Regular) | 0.875rem / 14px |
| Code / Editor | JetBrains Mono / Fira Code | `font-mono` | 400 (Regular) | 13px |
| Badges / Labels | Inter / Geist Sans | `font-sans` | 500 (Medium) | 0.75rem / 12px |

### 1.3 Spacing & Layout

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--spacing-page` | `px-4 sm:px-6 lg:px-8` | Page-level horizontal padding |
| `--spacing-card` | `p-4 sm:p-6` | Internal card padding |
| `--spacing-gap` | `gap-4 sm:gap-6` | Grid and flex gaps |
| `--radius-card` | `rounded-xl` (12px) | Card and modal corner radius |
| `--radius-button` | `rounded-lg` (8px) | Button corner radius |
| `--radius-input` | `rounded-md` (6px) | Input field corner radius |
| `--max-content` | `max-w-7xl` (80rem) | Maximum content width |

### 1.4 Elevation & Shadows

| Level | CSS / Tailwind | Usage |
| :--- | :--- | :--- |
| Level 0 | None | Canvas background |
| Level 1 | `border border-zinc-800` | Standard cards |
| Level 2 | `border border-zinc-800 shadow-lg shadow-black/20` | Modals, command palette |
| Level 3 | `ring-1 ring-zinc-700 shadow-xl shadow-black/30` | Floating tooltips, dropdowns |

---

## 2. Component Anatomy & Patterns

### 2.1 Tool Page Layout (Single-Canvas Architecture)
Every developer tool follows a unified layout pattern:

```
┌─────────────────────────────────────────────────────┐
│  Pitch-Black Canvas (#09090B)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Tool Header: Icon + Title + Description      │  │
│  │  Badge chips: [Category] [Format] [Privacy]   │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Action Toolbar: [Format] [Minify] [Copy]     │  │
│  │  [Clear] [Share] [History] [Sample]           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Monaco Editor Panel (#18181B)                 │  │
│  │  Syntax highlighting + line numbers            │  │
│  │  ┌───────────────────────────────────────────┐│  │
│  │  │ Status Bar (32px, #121215)                ││  │
│  │  │ [Execution: 2.3ms] [Chars: 1,847] [L:45] ││  │
│  │  └───────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Output Panel / Secondary Editor              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Critical Rule**: NEVER nest cards inside cards. Every tool uses a single-canvas flat layout with a unified `#09090B` background. Elevated surfaces (`#121215`) are used only for distinct functional regions (editor panels, status bars, modals).

### 2.2 Monaco Editor Integration
- **Import**: Always use `next/dynamic` with `ssr: false` to prevent SSR hydration errors.
- **Theme**: Custom dark theme matching `--bg-surface` (`#18181B`).
- **Status Footer**: 32px bar at editor bottom showing:
  - Execution speed (milliseconds)
  - Character count
  - Line count
  - Error line indicator (red dot + line number on parse failure)
- **Word Wrap**: Enabled by default for all text-based tools.
- **Read-Only Mode**: Output panels use `readOnly: true`.

### 2.3 Badge & Chip System
- **Category Badge**: `bg-zinc-800 text-zinc-300 rounded-full px-3 py-1 text-xs font-medium`
- **Format Badge**: `bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 text-xs`
- **Privacy Badge**: `bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1 text-xs`
- **Warning Chip**: `bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded-md px-2 py-0.5 text-xs`

### 2.4 Button Hierarchy

| Priority | Style | Usage |
| :--- | :--- | :--- |
| Primary | `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2` | Main actions (Format, Generate, Export) |
| Secondary | `bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg px-4 py-2` | Secondary actions (Copy, Clear) |
| Ghost | `hover:bg-zinc-800 text-zinc-400 rounded-lg px-3 py-2` | Tertiary actions (History, Settings) |
| Danger | `bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg px-4 py-2` | Destructive actions (Clear All) |

---

## 3. Client-Side Architecture

### 3.1 Zero-API Execution Pipeline
All data processing occurs within the browser sandbox:

```
User Input → Monaco Editor → Client-Side Engine → Output Panel
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              Pure JS/TS      Web Crypto API    WASM Modules
              (formatters,    (SHA, HMAC,       (future heavy
               parsers,        bcrypt,           compute)
               converters)     Ed25519)
```

**Invariant**: No `fetch()` call or API route (`/api/*`) ever transmits user-provided payloads to any server. The only API routes that exist serve static preset content (`/api/raw/[formatSlug]/[presetSlug]`).

### 3.2 State Management & Sharing

#### URL Hash State Serialization
- Tool states are serialized into URL hash fragments: `#data=<LZ-compressed-base64>`
- Uses `lz-string` library for compression.
- Zero server storage — the entire workspace state lives in the URL.
- Maximum URL length safety: ~8KB compressed payload.

#### Local Storage Layer
- **Storage Envelopes**: Versioned JSON wrappers (`storageEnvelope.ts`) with migration guards.
- **FIFO History Buffer**: 15-entry circular buffer per tool.
- **Quota Overflow Protection**: Graceful degradation when localStorage quota is exceeded.

### 3.3 Key Technical Dependencies

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `next` | 16.3.3 | Framework (App Router, SSG, Turbopack) |
| `react` / `react-dom` | 19.2.8 | UI runtime |
| `@monaco-editor/react` | ^4.7.0 | Code editor (VS Code engine) |
| `tailwindcss` | v4 | Utility-first styling |
| `lz-string` | ^1.5.0 | URL hash state compression |
| `jszip` | ^3.10.1 | In-memory ZIP archive generation |
| `bcryptjs` | ^3.0.3 | Client-side password hashing |
| `crypto-js` | ^4.2.0 | AES, HMAC, hash algorithms |
| `marked` | ^18.0.11 | Markdown rendering |
| `serwist` | ^9.5.12 | Service worker / PWA offline support |
| `ajv` | ^8.20.0 | JSON Schema validation |
| `lucide-react` | ^1.39.0 | Icon library |

---

## 4. AI Skill Studio Engine Architecture

### 4.1 Rule Generator Pipeline

```
Preset Registry (presetRegistry.ts)
        │
        ▼
Manifest Parser (manifestParser.ts)  ←──  User drops package.json / Cargo.toml
        │
        ▼
Rule Generator Engine (ruleGenerator.ts)
        │
        ├── cursor_mdc format
        ├── skill_md format
        ├── claude_md format
        ├── agents_md format
        ├── mcp_json format
        ├── windsurf_cascade format
        ├── copilot_instructions format
        ├── openai_instructions format
        ├── gemini_prompts format
        ├── cursorignore format
        ├── claudeignore format
        ├── llms_txt format
        └── architecture_md format
        │
        ▼
Static Analysis Auditor (ruleAuditor.ts)
        │
        ▼
Export: Copy / Download / ZIP (zipExporter.ts) / Share URL (stateSharing.ts)
```

### 4.2 Static Audit Scoring Dimensions

| Dimension | Weight | What It Measures |
| :--- | :--- | :--- |
| Trigger Specificity | 25% | Are activation triggers precise (file globs, language tags) or overly broad? |
| Rule Density | 20% | Does the ruleset provide sufficient instruction depth per category? |
| Negative Guardrails | 20% | Are explicit "never do X" constraints present to prevent anti-patterns? |
| Format Compliance | 20% | Does the output conform to the target platform's required syntax (YAML frontmatter, JSON schema, etc.)? |
| Architectural Boundaries | 15% | Are module responsibilities, data flow directions, and forbidden imports specified? |

---

## 5. Directory Architecture

```
DevScratchPad/
├── PRD.md                      # Product Requirements Document
├── DESIGN.md                   # This file — Design System & Architecture
├── TASK.md                     # Active sprint tracker
├── MEMORY.md                   # Persistent agent memory & ADRs
├── AGENTS.md                   # Multi-agent steering rules
├── CLAUDE.md                   # Claude Code CLI entry point
├── README.md                   # Public-facing documentation
├── CONTRIBUTING.md             # Contributor guidelines
├── LICENSE                     # BSL 1.1
├── package.json                # Node.js manifest
├── next.config.ts              # Next.js 16 configuration
├── tsconfig.json               # TypeScript configuration
├── postcss.config.mjs          # PostCSS (Tailwind v4)
├── cli/                        # Headless CLI source
│   ├── bin/devscratchpad.mjs   # CLI entry point
│   └── package.json            # CLI package manifest
├── community-presets/          # Community-contributed preset JSONs
├── schemas/                    # JSON schemas for validation
│   └── preset-schema.json
├── scripts/                    # Build & utility scripts
├── public/                     # Static assets (icons, manifest.json)
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── ai-skill-studio/    # AI Skill Studio feature
    │   ├── claude-skills/      # Claude Skills engine & UI
    │   │   ├── lib/            # Core engine modules
    │   │   │   ├── presetRegistry.ts    # 13-format preset definitions
    │   │   │   ├── ruleGenerator.ts     # Multi-format rule synthesis
    │   │   │   ├── ruleAuditor.ts       # Static quality scoring (0-100)
    │   │   │   ├── manifestParser.ts    # package.json / Cargo.toml parser
    │   │   │   ├── formatHubs.ts        # Format hub metadata & SEO
    │   │   │   ├── zipExporter.ts       # In-memory ZIP archive
    │   │   │   ├── stateSharing.ts      # LZ-compressed URL sharing
    │   │   │   ├── slugUtils.ts         # POSIX-safe slug generation
    │   │   │   ├── rulesConverter.ts    # Cross-format rule conversion
    │   │   │   └── storageEnvelope.ts   # Versioned storage wrapper
    │   │   └── components/     # AI Studio UI components
    │   ├── tools/              # Developer utility tool pages
    │   ├── blog/               # Engineering blog
    │   ├── cli/                # CLI documentation page
    │   └── workspace/          # Workspace management
    ├── components/             # Shared UI components
    ├── hooks/                  # Custom React hooks
    └── lib/                    # Shared libraries
        ├── tools/              # Tool-specific logic (27 modules)
        ├── routes.ts           # Route definitions
        ├── storage.ts          # LocalStorage abstraction
        └── utils.ts            # Common utilities
```

---

## 6. Negative Design Guardrails (Anti-Patterns)

These patterns are **strictly forbidden** across the entire codebase:

| ID | Anti-Pattern | Why It's Forbidden |
| :--- | :--- | :--- |
| NG-1 | Server-side API routes that accept user payload data | Violates the core zero-server privacy guarantee |
| NG-2 | Nested card-in-card containers | Creates visual depth confusion; violates single-canvas spatial design |
| NG-3 | `import` of Monaco Editor without `next/dynamic` + `ssr: false` | Causes SSR hydration mismatch errors |
| NG-4 | Direct `localStorage.setItem()` without storage envelope wrapper | Bypasses migration guards and quota protection |
| NG-5 | External analytics/tracking on tool input fields | Violates privacy guarantee — only page-view analytics allowed |
| NG-6 | Using `any` type in TypeScript | Defeats type safety across the codebase |
| NG-7 | Inline styles instead of Tailwind utility classes | Breaks design consistency and increases CSS bundle size |
| NG-8 | Double borders or redundant visual separators | Creates visual noise in the pitch-black spatial theme |
| NG-9 | Synchronous heavy computation on main thread | Blocks UI rendering; use Web Workers for crypto/parsing |
| NG-10 | Committing `.env` files or API tokens | Security violation |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Behavior |
| :--- | :--- | :--- |
| Mobile | < 640px (`sm`) | Single-column stack, collapsed toolbars |
| Tablet | 640px–1024px (`md`) | Two-column where applicable |
| Desktop | 1024px+ (`lg`) | Full layout, side-by-side editor panels |
| Wide | 1280px+ (`xl`) | Maximum content width (`max-w-7xl`) |

---

*This document defines the authoritative design system, architecture, and visual language for DevScratchpad. AI agents MUST follow these tokens, patterns, and guardrails when proposing UI or architectural changes.*
