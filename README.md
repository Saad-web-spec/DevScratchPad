<div align="center">

# ⚡ DevScratchpad

**The privacy-first developer utility suite & scratchpad with zero server transmission.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devscratchpad.tech-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://devscratchpad.tech)
[![npm version](https://img.shields.io/npm/v/devscratchpad?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/devscratchpad)
[![CLI Terminal](https://img.shields.io/badge/CLI-npx%20devscratchpad-2DD4BF?style=for-the-badge&logo=gnubash&logoColor=white)](https://devscratchpad.tech/cli)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1%20(Source--Available)-orange?style=for-the-badge)](./LICENSE)

<br/>

[**Headless CLI (`npx devscratchpad`)**](https://devscratchpad.tech/cli) • [**AI Skill Studio**](https://devscratchpad.tech/ai-skill-studio) • [**Explore 28+ Tools**](https://devscratchpad.tech) • [**Engineering Blog**](https://devscratchpad.tech/blog) • [**Report a Bug**](https://github.com/Saad-web-spec/DevScratchPad/issues/new) • [**Submit a PR**](./CONTRIBUTING.md)

</div>

---

## 🤖 Flagship: AI Skill Studio & Rule Architect

> **[Open AI Skill Studio in Browser →](https://devscratchpad.tech/ai-skill-studio)**  
> The premier 100% offline builder to configure, audit, and export production-grade steering instructions for Claude Code (`SKILL.md`), Cursor IDE (`.cursor/rules/*.mdc`), Anthropic (`CLAUDE.md`), and Multi-Agent frameworks (`AGENTS.md`).

### Target Format Specifications
| Format | Target Platform | Output Directory | Description |
| :--- | :--- | :--- | :--- |
| **`SKILL.md`** | Claude Code & Agentic CLI | `.claude/skills/<name>/SKILL.md` | Packaged modular skills with YAML frontmatter and dynamic context loading. |
| **`.mdc`** | Cursor IDE (Modern Standard) | `.cursor/rules/<name>.mdc` | Modular Cursor rulebooks scoped with globs and `alwaysApply` flags. |
| **`CLAUDE.md`** | Anthropic Root Guidelines | `/CLAUDE.md` | Repository-wide instructions using token-dense semantic XML tags. |
| **`AGENTS.md`** | Multi-Agent Frameworks | `/AGENTS.md` | Demarcated rule blocks for Antigravity, CrewAI, and AutoGen systems. |
| **`claude.json`** | MCP Runtime | `~/.claude.json` | Executable commands and environment bindings for Model Context Protocol servers. |

### Key Studio Capabilities
- 📦 **Manifest Auto-Detection:** Drop your `package.json`, `Cargo.toml`, `pyproject.toml`, or `go.mod` to auto-detect your stack and generate tailored rules in seconds.
- 🩺 **Static Analysis Audit Panel:** Real-time scoring across 5 critical dimensions (Trigger Specificity, Rule Density, Negative Guardrails, Format Compliance, Architectural Boundaries) with one-click ⚡ Auto-Fix.
- 🏷️ **Trigger Tagging & Heuristic Validation:** Real-time activation trigger chips with heuristic warning feedback for broad catch-all words to prevent context token bloat.
- 💻 **Terminal One-Liner Stream:** Native `curl`, `PowerShell`, `wget`, and CLI installation endpoints (`/api/raw/[formatSlug]/[presetSlug]`) to install rule files directly from terminal into local project roots.
- ⚡ **Curated Production Presets:** Statically pre-rendered presets ready for immediate use:
  - [Next.js 15 App Router Cursor Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/nextjs-15)
  - [.NET 8 & C# 12 Minimal APIs Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/csharp-dotnet-8)
  - [Spring Boot 3 & Java 21 Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/spring-boot-3)
  - [Django 5 & Ninja Cursor Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/python-django)
  - [Bun & Elysia TypeBox Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/bun-elysia)
  - [Playwright E2E Browser Testing Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/playwright-e2e)
  - [Expo & React Native Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/react-native-expo)
  - [Kubernetes & Helm Manifest Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/kubernetes-helm)
  - [Terraform & OpenTofu IaC Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/terraform-iac)
  - [Cursor Rules Pro (.mdc)](https://devscratchpad.tech/ai-skill-studio/cursor-rules/cursor-rules-pro)
  - [React 19 SPA Cursor Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/react-19)
  - [FastAPI Python Cursor Rules](https://devscratchpad.tech/ai-skill-studio/cursor-rules/fastapi)
  - [Codebase Auditor Claude Skill](https://devscratchpad.tech/ai-skill-studio/claude-skills/codebase-auditor)
  - [Security Vulnerability Guard](https://devscratchpad.tech/ai-skill-studio/claude-skills/security-guard)
- 🔗 **Zero-Backend State Sharing:** Ultra-compact permalink generation with LZ compression or canonical SEO URLs with zero server storage.
- 🗜️ **Export Unified AI Kit (.zip):** Download an all-in-one ZIP archive pre-structured for immediate placement into your project's repository.

---

## 💻 Zero-Install CLI: `npx devscratchpad`

> **[Interactive Web Simulator & Documentation →](https://devscratchpad.tech/cli)**  
> Scaffold, audit, and install battle-tested AI agent and IDE rulebooks into your project workspace with zero npm dependencies and 100% offline privacy.

### Quick Start (No Installation Needed)

```bash
# Browse all available formats and tech presets
npx devscratchpad list

# Install Next.js 15 App Router rules for Cursor (.cursor/rules/nextjs-15.mdc)
npx devscratchpad add cursor-rules/nextjs-15

# Install FastAPI & Pydantic v2 skill for Claude Code (.claude/skills/fastapi/SKILL.md)
npx devscratchpad add fastapi -f claude-skills

# Scan and score repository AI rule health (0-100)
npx devscratchpad audit

# Scaffold universal multi-agent starter guidelines (.mdc + CLAUDE.md)
npx devscratchpad init

# Modern package runners are fully supported:
pnpm dlx devscratchpad add tailwind-v4 -f windsurf
bunx devscratchpad add typescript-strict -f copilot
```

### Supported Formats & Target Outputs

| Format | Target Assistant / IDE | Target Filesystem Output | Flag Syntax |
| :--- | :--- | :--- | :--- |
| **Cursor Rules** | Cursor IDE | `.cursor/rules/<preset>.mdc` | `-f cursor-rules` |
| **Claude Skill** | Claude Code CLI | `.claude/skills/<preset>/SKILL.md` | `-f claude-skills` |
| **Windsurf Cascade** | Windsurf Editor | `.windsurf/rules/<preset>.md` | `-f windsurf` |
| **GitHub Copilot** | Copilot Chat | `.github/copilot-instructions.md` | `-f copilot` |
| **OpenAI Instructions** | ChatGPT / Codex | `.openai/system-instructions.md` | `-f openai` |
| **Google Gemini** | Gemini Structured Specs | `.gemini/<preset>.json` | `-f gemini` |

### Key CLI Capabilities
- 🚀 **Zero Dependency Bloat**: Operates purely on native Node.js standard libraries (`node:fs`, `node:path`, `node:https`). Installs in under 1.5s via `npx`.
- 🩺 **Static Rule Quality Audit**: `npx devscratchpad audit` statically scans existing repository rules for missing negative guardrails, broad globs, and token density issues.
- 🔒 **100% Client-Side Confined**: Zero telemetry, zero analytics, zero prompt tracking. Run with `--dry-run` to inspect exact local filesystem actions.
- 🔄 **Reciprocal Studio Integration**: Every CLI command outputs deep links to the visual [AI Skill Studio](https://devscratchpad.tech/ai-skill-studio) for interactive editing.

---

## 🔒 100% Zero-Server Privacy Guarantee

> **Why DevScratchpad?** Most online formatters and decoders secretly transmit your sensitive API keys, JWT tokens, environment secrets, and customer payloads to remote tracking servers. 

**DevScratchpad is 100% client-side:**
- **Zero API Endpoints:** Every formatter, parser, hash generator, and converter executes in pure browser JavaScript & WASM.
- **Zero Telemetry on Payloads:** Your inputs never touch a server or database.
- **Auditable & Source-Available:** Inspect the network tab or the source code in this repository to verify that no network requests leave your machine.

---

## ✨ Features & Architecture

- ⚡ **Next.js 16 & Turbopack:** 100% Static Site Generated (SSG) with sub-millisecond TTFB.
- 🎨 **Unified Spatial Dark UI:** High-contrast pitch-black canvas (`#09090B`), elevated cards (`#121215`), and standardized monospace inputs.
- 💻 **Monaco Code Editor:** VS Code's editor engine built-in with syntax highlighting, auto-wrap, error lines, and dual-pane diff comparison.
- ⏱️ **Local Status Bars:** Embedded 32px Monaco status footers displaying real-time execution speeds (ms), character volume, and syntax error lines.
- ⌨️ **Command Palette:** Global <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> navigation to jump between tools in milliseconds.
- 🔗 **Zero-Backend Sharing:** Payloads are serialized directly into URL hash fragments (`#data=...`), enabling private sharing with no server storage.
- 💾 **Local Workspace History:** FIFO 15-entry local history buffer and workspace snapshot bookmarking.

---

## 🛠️ The 28 Developer Utilities Matrix

| Category | Tool Name | Route | What It Does |
| :--- | :--- | :--- | :--- |
| **AI & Agentic Tools** | [AI Skill Studio](https://devscratchpad.tech/ai-skill-studio) | `/ai-skill-studio` | Configure, audit, and export production skills (`SKILL.md`, `.mdc`, `CLAUDE.md`, `AGENTS.md`, MCP). |
| **Code Formatting** | [JSON Formatter](https://devscratchpad.tech/tools/json-formatter) | `/tools/json-formatter` | Multi-indent formatting, minification, and real-time syntax error line tracking. |
| | [JSON Validator](https://devscratchpad.tech/tools/json-validator) | `/tools/json-validator` | Secure, strict JSON syntax validator to catch missing commas and string issues. |
| | [XML Formatter](https://devscratchpad.tech/tools/xml-formatter) | `/tools/xml-formatter` | Format, beautify, and minify XML data structures with indentation controls. |
| | [SQL Formatter](https://devscratchpad.tech/tools/sql-formatter) | `/tools/sql-formatter` | Multi-dialect query beautifier (PostgreSQL, MySQL, SQLite) with keyword casing. |
| | [GraphQL Formatter](https://devscratchpad.tech/tools/graphql-formatter) | `/tools/graphql-formatter` | Formats and validates GraphQL queries and schemas using the official AST parser. |
| **Security & Crypto** | [Base64 & Hex Inspector](https://devscratchpad.tech/tools/base64-inspector) | `/tools/base64-inspector` | Multi-encoding converter, canonical hex dump, and live Data URL image previewer. |
| | [JWT Decoder](https://devscratchpad.tech/tools/jwt) | `/tools/jwt` | Safely decodes Header, Payload & Signature; auto-converts `exp`/`iat` timestamps. |
| | [X.509 Certificate Decoder](https://devscratchpad.tech/tools/cert-decoder) | `/tools/cert-decoder` | Decodes PEM certificates and CSRs with SANs, validity countdown, and fingerprints. |
| | [SSH Key Generator](https://devscratchpad.tech/tools/ssh-key-generator) | `/tools/ssh-key-generator` | In-browser Ed25519/RSA/ECDSA keypair generator with OpenSSH Randomart. |
| | [Password Hash & Verifier](https://devscratchpad.tech/tools/password-hash) | `/tools/password-hash` | Bcrypt ($2a/$2b), Argon2id, and PBKDF2 hashing and live verification matching. |
| | [Hash Generator](https://devscratchpad.tech/tools/hash) | `/tools/hash` | Computes MD5, SHA-1, SHA-256, and SHA-512 in parallel client-side. |
| | [HMAC Generator](https://devscratchpad.tech/tools/hmac-generator) | `/tools/hmac-generator` | Computes SHA256 & SHA512 HMAC signatures in Hex & Base64 for webhook testing. |
| | [UUID Generator](https://devscratchpad.tech/tools/uuid-generator) | `/tools/uuid-generator` | Fast bulk v4 UUID generator using the native browser Crypto API. |
| **Network & Time** | [Cron Visualizer](https://devscratchpad.tech/tools/cron) | `/tools/cron` | Translates complex cron schedules into plain English with a 5-column breakdown grid. |
| | [IP / CIDR Calculator](https://devscratchpad.tech/tools/cidr-calculator) | `/tools/cidr-calculator` | Calculates IPv4 network address, broadcast, wildcard mask, and usable host bounds. |
| **Code Converters** | [cURL to Fetch](https://devscratchpad.tech/tools/curl-to-fetch) | `/tools/curl-to-fetch` | Transforms cURL commands into executable JavaScript (`fetch`). |
| | [cURL to Python](https://devscratchpad.tech/tools/curl-to-python) | `/tools/curl-to-python` | Transforms cURL commands into Python (`requests`). |
| | [JSON to TypeScript](https://devscratchpad.tech/tools/json-to-ts) | `/tools/json-to-ts` | Generates strongly-typed TypeScript interfaces from raw JSON. |
| | [JSON to Zod](https://devscratchpad.tech/tools/json-to-zod) | `/tools/json-to-zod` | Generates strict Zod schemas from raw JSON. |
| | [SVG to JSX](https://devscratchpad.tech/tools/svg-to-jsx) | `/tools/svg-to-jsx` | Convert raw SVG code to React JSX functional components. |
| | [YAML to JSON](https://devscratchpad.tech/tools/yaml-to-json) | `/tools/yaml-to-json` | Convert YAML configurations into JSON payloads. |
| **Diff & Optimization** | [Diff Checker](https://devscratchpad.tech/tools/diff) | `/tools/diff` | Monaco side-by-side or inline code diffing with character-level additions. |
| | [CSS & SVG Minifier](https://devscratchpad.tech/tools/minifier) | `/tools/minifier` | Strips comments and whitespace; displays byte savings and compression ratio. |
| | [Regex Tester](https://devscratchpad.tech/tools/regex) | `/tools/regex` | Real-time RegExp testing with flags (`g`, `i`, `m`, `s`), match lists. |



## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18.17+ or 20+
- npm, yarn, or pnpm

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/Saad-web-spec/DevScratchPad.git

# 2. Enter the project directory
cd DevScratchPad

# 3. Install dependencies
npm install

# 4. Start the Turbopack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💻 Local Development & Verification

Run DevScratchpad locally on your machine for personal use and security verification:

```bash
git clone https://github.com/Saad-web-spec/DevScratchPad.git
cd DevScratchPad
npm install
npm run dev
```

---

## 🤝 Contributing

Contributions, feature ideas, and new utility tools are very welcome! Please check out our [**Contributing Guide**](./CONTRIBUTING.md) to get started.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingNewTool`)
3. Commit your Changes (`git commit -m 'feat: add amazing new developer tool'`)
4. Push to the Branch (`git push origin feature/AmazingNewTool`)
5. Open a Pull Request

---

## 💖 Support & Sponsorship

If DevScratchpad has saved you time or improved your workflow, consider starring ⭐ this repository and supporting its ongoing development!

---

## 📄 License & Commercial Protection

DevScratchpad is distributed under the **Business Source License 1.1 (BSL 1.1)**.

- ✅ **Free for Personal, Research & Educational Use:** Anyone may view, audit, run locally, and contribute to the source code.
- 🛡️ **Commercial & Competitor Restrictions:** Publicly hosting DevScratchpad (or any derivative) as a competing website, SaaS, API, or commercial platform is strictly prohibited without prior written commercial licensing agreement.
- See the full legal terms in [`LICENSE`](./LICENSE).

<div align="center">
  <sub>Built with ❤️ by <a href="https://saadengineer.works">Saad</a> &bull; Powered by Next.js 16 &amp; Monaco Editor</sub>
</div>
