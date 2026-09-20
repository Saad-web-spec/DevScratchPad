@AGENTS.md

# DevScratchpad — Claude Code CLI Entry Point

> Claude Code reads this file automatically on session startup.

## Context Hierarchy

Read these files in order before executing any task:

1. **[MEMORY.md](./MEMORY.md)** — Tech stack, ADRs, gotchas, and agent execution protocol
2. **[PRD.md](./PRD.md)** — Product vision, functional requirements, and roadmap
3. **[DESIGN.md](./DESIGN.md)** — Design tokens, component patterns, and negative guardrails
4. **[TASK.md](./TASK.md)** — Active sprint, task statuses, and verification commands

## Common Commands

- **Build**: `npm run build`
- **Dev Server**: `npm run dev`
- **Lint**: `npm run lint`
- **Validate Presets**: `npm run validate-presets`
- **CLI Smoke Test**: `node ./cli/bin/devscratchpad.mjs list`

## Code Style & Architecture

- **Next.js 16 App Router**: Server Components by default. No pages/ router.
- **React 19**: Use `use()` hook and Server Actions where applicable.
- **Tailwind CSS v4**: Utility classes only. No inline styles. No `tailwind.config.js`.
- **Monaco Editor**: Always import via `next/dynamic` with `{ ssr: false }`.
- **TypeScript**: Strict mode. Zero `any` types.
- **Privacy**: Zero API routes for user payloads. All processing in browser sandbox.
- **Storage**: Always use `src/lib/storage.ts` envelope wrapper. Never raw `localStorage`.
- **CLI**: Zero npm dependencies — Node.js standard libraries only.

## Completion Protocol

After completing any task:
1. Run all verification commands (build, lint, validate-presets)
2. Update `TASK.md` — mark completed items with `[x]`
3. Log your session in `MEMORY.md` → Session History
4. Preserve all existing comments and docstrings unrelated to your changes
