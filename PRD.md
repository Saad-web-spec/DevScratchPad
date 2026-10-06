# DevScratchpad — Product Requirements Document (PRD)

## Document Metadata
- Version: 1.0.0
- Status: Active
- Last Updated: 2026-09-20
- Owner: Saad
- Stack: Next.js 16.3.3 · React 19.2.8 · Tailwind CSS v4 · Monaco Editor
- License: BSL 1.1

## 1. Executive Summary & Vision
DevScratchpad is the privacy-first developer utility suite and AI agent governance platform. It provides 28+ developer tools (formatters, decoders, converters, crypto utilities) and a flagship AI Skill Studio — all running 100% client-side with zero server transmission of user data. The platform also ships a zero-dependency headless CLI (`npx devscratchpad`) for terminal-native workflows.

## 2. Problem Statement
- Most online developer tools (formatters, JWT decoders, hash generators) silently transmit sensitive API keys, tokens, and payloads to remote servers.
- AI coding agents (Claude, Cursor, Windsurf, Copilot, Gemini) lack standardized, portable rule governance — leading to context bloat, rule drift, and fragmented configurations across IDEs.
- No unified open-source platform exists that combines privacy-first developer utilities with a multi-format AI rule generation, auditing, and distribution pipeline.

## 3. Value Proposition
- **Zero-Server Privacy**: Every tool executes in the browser sandbox using Web Crypto API and WASM. No input ever leaves the client machine.
- **Multi-Format AI Governance**: Generate, audit, and export rules for 13 target formats (Cursor .mdc, Claude SKILL.md, CLAUDE.md, AGENTS.md, Windsurf, Copilot, OpenAI, Gemini, MCP, .cursorignore, .claudeignore, llms.txt, ARCHITECTURE.md).
- **Headless CLI Distribution**: Install battle-tested presets directly into any project via `npx devscratchpad add <preset>`.

## 4. User Personas

| Persona | Role | Primary Need |
| :--- | :--- | :--- |
| **Alex** | Full-Stack Engineer | Fast, private JSON/JWT/XML formatting without trusting third-party sites |
| **Priya** | DevOps / SRE | Cron visualization, CIDR calculation, hash verification for CI pipelines |
| **Marcus** | Security Auditor | Offline certificate decoding, SSH key generation, password hashing |
| **Zara** | AI Prompt & Agent Architect | Multi-format rule generation, static quality auditing (0-100), and CLI preset distribution |

## 5. Functional Requirements

### FR-1: Client-Side Developer Utilities (28+ Tools)
All tools execute entirely in the browser with zero API calls:

| Category | Tools |
| :--- | :--- |
| Code Formatting | JSON Formatter, JSON Validator, XML Formatter, SQL Formatter, GraphQL Formatter |
| Security & Crypto | Base64 & Hex Inspector, JWT Decoder, X.509 Cert Decoder, SSH Key Generator, Password Hash & Verifier, Hash Generator (MD5/SHA), HMAC Generator, UUID Generator |
| Network & Time | Cron Visualizer, IP/CIDR Calculator |
| Code Converters | cURL→Fetch, cURL→Python, JSON→TypeScript, JSON→Zod, SVG→JSX, YAML→JSON |
| Diff & Optimization | Diff Checker (Monaco), CSS & SVG Minifier, Regex Tester |

Each tool provides:
- Monaco Editor with syntax highlighting
- 32px status footer (execution time in ms, character count, error line)
- Copy/Clear/Share actions
- URL hash state sharing (`#data=...`)
- FIFO 15-entry local workspace history

### FR-2: AI Skill Studio & Rule Architect
- **13 Output Formats**: Cursor .mdc, Claude SKILL.md, CLAUDE.md, AGENTS.md, MCP JSON, Windsurf Cascade, Copilot Instructions, OpenAI Instructions, Gemini JSON, .cursorignore, .claudeignore, llms.txt, ARCHITECTURE.md.
- **Manifest Auto-Detection**: Drop `package.json`, `Cargo.toml`, `pyproject.toml`, or `go.mod` to auto-detect tech stack and generate tailored rules.
- **Static Analysis Auditor (0-100 Score)**:
  - Trigger Specificity: 25%
  - Rule Density: 20%
  - Negative Guardrails: 20%
  - Format Compliance: 20%
  - Architectural Boundaries: 15%
- **One-Click Auto-Fix**: ⚡ button to resolve detected deficiencies automatically.
- **Trigger Tagging & Heuristic Validation**: Real-time activation trigger chips with warning feedback for overly broad catch-all words.
- **Terminal One-Liner Stream**: Native `curl`, `PowerShell`, `wget` installation endpoints (`/api/raw/[formatSlug]/[presetSlug]`).
- **Curated Production Presets**: 14+ statically pre-rendered presets (Next.js 15, .NET 8, Spring Boot 3, Django 5, FastAPI, React Native Expo, Kubernetes, Terraform, etc.).
- **Zero-Backend State Sharing**: LZ-compressed permalink generation with zero server storage.
- **Export Unified AI Kit (.zip)**: Download pre-structured ZIP archive for immediate repository placement.

### FR-3: Headless CLI (`npx devscratchpad`)
- **Zero npm Dependencies**: Operates on native Node.js standard libraries (`node:fs`, `node:path`, `node:https`).
- **Commands**:
  - `list` — Browse all available formats and tech presets
  - `add <preset> [-f <format>]` — Install preset into local project directory
  - `audit` — Scan and score repository AI rule health (0-100)
  - `init` — Scaffold universal multi-agent starter guidelines
- **Cross-runner support**: `npx`, `pnpm dlx`, `bunx` all fully supported.
- **Reciprocal Studio Integration**: CLI outputs deep links to web AI Skill Studio for interactive editing.

### FR-4: Community Preset Registry & CI Automation
- **Decentralized Contribution Pipeline**: Community contributors submit presets via GitHub Pull Requests to `/community-presets/`.
- **Automated Quality Gates**:
  - Schema validation against `schemas/preset-schema.json`
  - Quality linter score >= 80/100
  - Security scan for malicious scripts
- **Static Deployment**: Merged presets compile to static JSON index distributed via GitHub Pages or CDN edge.

### FR-5: Offline PWA & Navigation
- **Serwist Service Worker**: Full offline capability after initial load.
- **Command Palette**: Global Ctrl+K / Cmd+K navigation to jump between tools instantly.
- **Workspace History**: FIFO 15-entry local storage buffer with snapshot bookmarking.

## 6. Non-Functional Requirements

### NFR-1: 100% Zero-Server Privacy Guarantee
- Zero API endpoints for user payloads.
- All crypto operations use Web Crypto API and in-browser WASM.
- Zero telemetry on tool inputs. Vercel Analytics tracks only page views, never payloads.
- Auditable: users can inspect Network tab to verify zero data transmission.

### NFR-2: Performance
- Static Site Generated (SSG) with sub-millisecond TTFB via Next.js 16 static export.
- Tool execution under 50ms for standard payloads.
- Monaco Editor lazy-loaded via `next/dynamic` with `ssr: false` to prevent hydration errors.

### NFR-3: Browser Compatibility
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.
- Web Workers for heavy crypto/parsing operations to prevent main thread blocking.
- Responsive layout for desktop-first usage (1024px+), with graceful mobile degradation.

### NFR-4: Licensing & IP Protection
- BSL 1.1: Free for personal, research, and educational use.
- Commercial/competitor hosting restrictions without prior written agreement.

## 7. Roadmap & Milestone Phasing

| Milestone | Status | Core Deliverables |
| :--- | :--- | :--- |
| **1.0 — Foundation & SEO** | ✅ Complete | 28 tools, SSG deployment, JSON-LD structured data, sitemap generation |
| **1.1 — AI Skill Studio** | ✅ Complete | 13-format rule generator, static auditor (0-100), manifest auto-detect, curated presets |
| **1.2 — Headless CLI** | ✅ Complete | `npx devscratchpad` with list/add/audit/init commands |
| **2.0 — Community Registry** | 🔄 In Progress | Decentralized preset contributions, CI automation, quality gates |
| **2.1 — VFS Multi-File Bundling** | 📋 Planned | In-memory Virtual File System for multi-file skill packages (scripts/, references/, assets/) |
| **3.0 — Rule Importer & Token Linter** | 📋 Planned | Two-way auditor: import existing rules, analyze token waste, suggest optimizations |

## 8. Success Metrics
- GitHub Stars growth trajectory
- npm weekly downloads for `devscratchpad` CLI
- Community preset contributions per month
- Lighthouse Performance score >= 95
- Zero reported privacy/security incidents

## 9. References
- [Live Demo](https://devscratchpad.tech)
- [AI Skill Studio](https://devscratchpad.tech/ai-skill-studio)
- [CLI Documentation](https://devscratchpad.tech/cli)
- [Contributing Guide](./CONTRIBUTING.md)
- [License](./LICENSE)

---
*This document is the authoritative source of product requirements for DevScratchpad. All AI agents operating in this repository MUST consult this PRD before proposing feature changes or architectural modifications.*
