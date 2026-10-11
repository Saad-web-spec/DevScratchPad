# devscratchpad

AI agent rulebooks from your terminal. Install, scaffold and audit rule files for Cursor, Claude Code, Windsurf, GitHub Copilot, OpenAI and Gemini.

- Zero dependencies (Node.js standard library only), Node 18.3+
- Never overwrites your files unless you pass `--force` (and then keeps a `.bak`)
- Zero telemetry; the only network request downloads a public preset, with bundled templates as an offline fallback

Website: [devscratchpad.tech/cli](https://www.devscratchpad.tech/cli) · Guide: [How to manage AI rules with the CLI](https://www.devscratchpad.tech/blog/how-to-manage-ai-rules-with-cli-guide)

## Quick start

```bash
npx devscratchpad list                          # formats and presets
npx devscratchpad add cursor-rules/nextjs-15    # .cursor/rules/nextjs-15.mdc
npx devscratchpad add claude-skills/fastapi     # .claude/skills/fastapi/SKILL.md
npx devscratchpad init                          # 7-file AI agent suite
npx devscratchpad audit --min-score 80          # score rule files, fail below 80
```

Works the same with `pnpm dlx devscratchpad` and `bunx devscratchpad`.

## Commands

| Command | What it does |
| --- | --- |
| `add <format>/<preset>` | Install one rulebook. Also `add <preset> -f <format>`. |
| `init` | Write `.cursor/rules/cursor-rules-pro.mdc`, `CLAUDE.md`, `AGENTS.md`, `.cursorignore`, `.claudeignore`, `llms.txt`, `ARCHITECTURE.md`. Existing files are skipped. |
| `audit [dir]` | Score every AI rule file (0–100) with concrete fixes: negative guardrails, a trust boundary against instructions hidden in file contents, confirmation gates for irreversible actions, length, globs and vague directives. |
| `list` | Show all formats and presets. |

## Options

| Option | Applies to | Effect |
| --- | --- | --- |
| `--force` | add, init | Replace existing files; the previous version is saved as `<file>.bak` |
| `--dry-run` | add, init | Print what would be written; change nothing |
| `--offline` | add, init | Skip the network and use bundled templates |
| `--min-score <n>` | audit | Exit 1 if any file scores below `n` (or no rule files exist) |
| `--json` | audit, list | Machine-readable output |
| `--no-color` | all | Disable colours (`NO_COLOR` is honoured too) |

Exit codes: `0` success, `1` failure (unknown preset, audit below `--min-score`, write error), `2` usage error.

## Formats

`cursor-rules`, `claude-skills`, `claude-md`, `agents-md`, `windsurf`, `copilot`, `mcp-config`, `openai`, `gemini`, `cursorignore`, `claudeignore`, `llms-txt`, `architecture-md`

Presets include `nextjs-15`, `react-19`, `tailwind-v4`, `fastapi`, `python-django`, `go-fiber`, `rust-axum`, `prisma`, `docker-devops`, `kubernetes-helm`, `codebase-auditor`, `security-guard` and more. Run `npx devscratchpad list` for the full list. MCP server presets (`github`, `postgres`, `filesystem`, …) work with `mcp-config`.

## Use in CI

```yaml
- run: npx devscratchpad@2 audit --min-score 80
```

## Development

```bash
cd cli
npm test   # node:test suite, runs offline
```

## License

MIT © [DevScratchpad](https://www.devscratchpad.tech)
