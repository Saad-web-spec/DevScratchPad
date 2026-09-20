<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# DevScratchpad — Multi-Agent Governance Protocol

> **Scope**: This specification governs all autonomous AI coding agents operating in this repository — including Antigravity (Gemini), Claude Code, Cursor Agent, Windsurf Cascade, GitHub Copilot, OpenAI Codex, and any multi-agent orchestration framework.

## Mandatory Context Ingestion

Before executing ANY task, every agent MUST read the following files in order:

1. **[MEMORY.md](./MEMORY.md)** — Persistent agent brain: tech context, ADRs, gotchas, and the 5-step execution protocol.
2. **[PRD.md](./PRD.md)** — Product requirements: vision, personas, functional/non-functional requirements, and roadmap.
3. **[DESIGN.md](./DESIGN.md)** — Design system & architecture: color tokens, component patterns, negative guardrails, and directory structure.
4. **[TASK.md](./TASK.md)** — Active sprint tracker: current milestone, task statuses, verification commands, and agent session log.

## Agent Execution Loop

```
1. INGEST   → Read MEMORY.md → PRD.md → DESIGN.md
2. PLAN     → Check TASK.md for current sprint and active tasks
3. EXECUTE  → Apply surgical changes following DESIGN.md patterns
4. VERIFY   → Run: npm run validate-presets && npm run lint && npm run build
5. UPDATE   → Mark tasks in TASK.md, log learnings in MEMORY.md
```

## Verification Requirements

Every agent task MUST be verified with:
1. `npm run validate-presets` — Preset schema validation (must exit 0)
2. `npm run lint` — ESLint across all TypeScript source (must exit 0)
3. `npm run build` — Next.js 16 production build (must exit 0)

## Non-Negotiable Constraints

- **Zero Server Transmission**: No API route may accept or transmit user-provided payload data.
- **Single-Canvas Layout**: Never introduce nested card-in-card containers.
- **Monaco Dynamic Import**: Always use `next/dynamic` with `{ ssr: false }` for Monaco Editor.
- **Tailwind v4 Only**: No `tailwind.config.js` — use CSS-first configuration via `postcss.config.mjs`.
- **CLI Zero Dependencies**: The CLI (`cli/bin/devscratchpad.mjs`) uses only Node.js standard libraries.
- **Documentation Integrity**: Preserve all existing comments and docstrings unrelated to your changes.
- **License Compliance**: All code is BSL 1.1. Contributors must acknowledge license terms.
