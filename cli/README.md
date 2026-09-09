# devscratchpad

> **Zero-dependency, offline-first AI rulebook manager for Cursor, Claude Code, Windsurf, GitHub Copilot & Gemini.**

Manage, install, and audit production-grade AI agent guidelines directly from your terminal. Built with 100% privacy and zero remote telemetry.

- 💻 **Interactive Web CLI**: [https://www.devscratchpad.tech/cli](https://www.devscratchpad.tech/cli)
- 📖 **In-Depth Engineering Guide**: [https://www.devscratchpad.tech/blog/how-to-manage-ai-rules-with-cli-guide](https://www.devscratchpad.tech/blog/how-to-manage-ai-rules-with-cli-guide)
- 🎨 **Visual AI Skill Studio**: [https://www.devscratchpad.tech/ai-skill-studio](https://www.devscratchpad.tech/ai-skill-studio)

---

## ⚡ Quick Start (No Install Needed)

Run instantly with \`npx\`:

```bash
# Browse all available formats and tech presets
npx devscratchpad list

# Install Cursor rules (.cursor/rules/nextjs-15.mdc)
npx devscratchpad add cursor-rules/nextjs-15

# Install Claude Code skill (.claude/skills/fastapi/SKILL.md)
npx devscratchpad add claude-skills/fastapi

# Install Windsurf Cascade rules (.windsurf/rules/tailwind-v4.md)
npx devscratchpad add windsurf/tailwind-v4

# Install GitHub Copilot repo instructions (.github/copilot-instructions.md)
npx devscratchpad add copilot/typescript-strict

# Audit existing project rules for quality and hallucinations
npx devscratchpad audit

# Scaffold starter rules for a new project
npx devscratchpad init
```

---

## 🎯 Features

- **9 Supported Formats**:
  - **Cursor Rules** (\`.cursor/rules/*.mdc\`)
  - **Claude Code Skills** (\`.claude/skills/*/SKILL.md\`)
  - **Project Guidelines** (\`CLAUDE.md\`)
  - **Multi-Agent Directives** (\`AGENTS.md\`)
  - **Model Context Protocol** (\`claude.json\`)
  - **Windsurf Cascade** (\`.windsurf/rules/*.md\`)
  - **GitHub Copilot** (\`.github/copilot-instructions.md\`)
  - **OpenAI Instructions** (\`.openai/system-instructions.md\`)
  - **Gemini Structured Prompts** (\`.gemini/*.json\`)
- **23+ Technology Presets**: Next.js 15, React 19, Tailwind v4, FastAPI, Strict TypeScript, Docker, PostgreSQL, Go, Rust, and more.
- **Rule Quality Auditor**: Static heuristics check for missing negative guardrails, trigger specificity, and monolithic prompt degradation.
- **Offline Reliability**: Bundled local fallbacks ensure `devscratchpad` functions even without internet access.
- **Zero Dependencies**: Pure Node.js runtime with strict workspace boundary assertions.

---

## 🌐 Web Companion, Guide & Tools

- **[Interactive Web CLI & Terminal Simulator](https://www.devscratchpad.tech/cli)**: Test commands online, preview directory structures, and explore formats in your browser.
- **[Complete CLI Engineering Guide](https://www.devscratchpad.tech/blog/how-to-manage-ai-rules-with-cli-guide)**: In-depth tutorial covering zero-install execution, negative constraint engineering, and CI/CD quality auditing.
- **[AI Skill Studio](https://www.devscratchpad.tech/ai-skill-studio)**: Full-featured visual rule generator with live preview and quality scoring.
- **[Universal AI Rules Converter](https://www.devscratchpad.tech/ai-skill-studio/rules-converter)**: Convert legacy `.cursorrules` or prompt markdown to any modern agent format with 100% client-side privacy.
- **[Developer Tools Suite](https://www.devscratchpad.tech/developer-tools)**: 28 offline utilities (Formatters, Encoders, Crypto, JWT, RegEx).

---

## 🔒 Security & Privacy

- **100% Client-Side**: No code or prompts are sent to any external server.
- **Path Confinement**: All file writes are strictly confined within your project root to prevent path traversal.
- **No Telemetry**: Zero tracking, zero analytics in the CLI.

---

## 📄 License

MIT © [DevScratchpad Team](https://www.devscratchpad.tech)
