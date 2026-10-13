import { OutputFormat } from "./presetRegistry";

export interface FormatHubMeta {
  slug: string;
  format: OutputFormat;
  name: string;
  badge: string;
  targetFile: string;
  targetDir: string;
  seoTitle: string;
  seoDescription: string;
  heroHeading: string;
  heroSubheading: string;
  overview: string;
  filePlacementGuide: { path: string; scope: string; description: string }[];
  syntaxHighlights: { title: string; explanation: string; codeSample: string }[];
  bestPractices: string[];
  faqs: { question: string; answer: string }[];
}

/*
 * Hub copy is shown on /ai-skill-studio/<slug> (FormatHubGuide + FAQ) and in
 * llms-full.txt. Backticks mark inline code; the page renders them as <code>
 * and strips them for JSON-LD. Keep claims to what each tool documents, and
 * say "convention" for files no tool loads by itself.
 */
export const FORMAT_HUBS: Record<string, FormatHubMeta> = {
  "cursor-rules": {
    slug: "cursor-rules",
    format: "cursor_mdc",
    name: "Cursor Rules (.mdc)",
    badge: "Cursor Rules",
    targetFile: "<rule-name>.mdc",
    targetDir: ".cursor/rules/",
    seoTitle: "Cursor Rules Generator (.mdc) & Examples",
    seoDescription:
      "Generate Cursor project rules (.cursor/rules/*.mdc) for your stack, with globs, alwaysApply and examples. Free, runs in your browser, nothing is uploaded.",
    heroHeading: "Cursor rules generator: .cursor/rules/*.mdc for your stack",
    heroSubheading:
      "Pick a preset for your stack, scope it with globs, and download the .mdc file. Runs in your browser; nothing is uploaded.",
    overview:
      "Cursor project rules live in `.cursor/rules/` as `.mdc` files: Markdown with a short frontmatter block. The frontmatter decides when a rule reaches the model. `alwaysApply: true` adds it to every request, `globs` attach it when matching files are in play, and a `description` lets the agent pull it in when the task fits. A rule with none of these is used only when you @-mention it. The single `.cursorrules` file in the repo root still works but is deprecated, so new projects should use `.cursor/rules/`.",
    filePlacementGuide: [
      {
        path: ".cursor/rules/nextjs.mdc",
        scope: "globs: app/**/*.tsx",
        description: "Framework conventions that load only when route or component files are in play.",
      },
      {
        path: ".cursor/rules/testing.mdc",
        scope: "globs: **/*.test.ts",
        description: "Test runner commands and mocking rules, attached when a test file is in the request.",
      },
      {
        path: "packages/api/.cursor/rules/api.mdc",
        scope: "Nested folder",
        description: "In a monorepo, a `.cursor/rules` folder inside a package applies to files in that package.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Frontmatter",
        explanation:
          "Three fields decide when the rule loads. Keep `alwaysApply` false and use `globs` for anything that only matters to part of the codebase.",
        codeSample: `---
description: Next.js App Router conventions for routes and server code
globs: app/**/*.ts,app/**/*.tsx
alwaysApply: false
---`,
      },
      {
        title: "Rule body",
        explanation: "Short instructions the model can check: name the files, commands and patterns, and say what never to do.",
        codeSample: `- Server Components by default; add "use client" only for state, effects or browser APIs.
- Validate Server Action input with Zod safeParse and return typed errors.
- Never import from next/router; use next/navigation.
- Run \`pnpm lint && pnpm test\` before finishing.`,
      },
    ],
    bestPractices: [
      "Write one rule per concern (framework, data layer, tests) instead of one long file, so each loads only where it applies.",
      "Keep `alwaysApply: true` for the few lines every request needs, such as the package manager and test command.",
      "Write the `description` as when-to-use text; the agent reads it to decide whether to pull the rule in.",
      "Reference real files (`@components/ui/button.tsx`) instead of pasting long examples into the rule.",
      "Commit `.cursor/rules/` so the whole team gets the same rules.",
    ],
    faqs: [
      {
        question: ".cursorrules vs .cursor/rules: which should I use?",
        answer:
          "Use `.cursor/rules/*.mdc`. The single `.cursorrules` file is still read but deprecated, and it applies to every request. Project rules can be scoped with globs, loaded on demand and split by concern.",
      },
      {
        question: "Does Cursor read AGENTS.md too?",
        answer:
          "Yes. Cursor reads `AGENTS.md` in the project root as a plain Markdown alternative to project rules, without frontmatter or scoping. Use it for instructions you share with other agents, and `.mdc` rules for scoped ones.",
      },
      {
        question: "Why is my Cursor rule not being applied?",
        answer:
          "Check the frontmatter first: a rule with `alwaysApply: false`, no `globs` and no `description` loads only when you @-mention it. Then check that the glob matches the files in your request and that the file sits in `.cursor/rules/` with the `.mdc` extension.",
      },
    ],
  },
  "claude-skills": {
    slug: "claude-skills",
    format: "skill_md",
    name: "Claude Code Skills (SKILL.md)",
    badge: "Claude Skill",
    targetFile: "SKILL.md",
    targetDir: ".claude/skills/<skill-name>/",
    seoTitle: "Claude Code Skill Generator (SKILL.md)",
    seoDescription:
      "Create Claude Code skills: a SKILL.md with a name, a description and step-by-step instructions, saved in .claude/skills/. Free, runs in your browser.",
    heroHeading: "Claude Code skill generator: SKILL.md files for your workflows",
    heroSubheading:
      "Write the description Claude uses to pick the skill, add the steps and the limits, and download it into .claude/skills/. Runs in your browser; nothing is uploaded.",
    overview:
      "A Claude Code skill is a folder with a `SKILL.md` file: YAML frontmatter with a `name` and a `description`, then Markdown instructions. At startup Claude reads only each skill's name and description. When a request matches the description, it loads the full file, plus any scripts or reference files the skill points to. You can also run a skill directly with `/skill-name`. Project skills live in `.claude/skills/`, personal ones in `~/.claude/skills/`.",
    filePlacementGuide: [
      {
        path: ".claude/skills/codebase-auditor/SKILL.md",
        scope: "Project",
        description: "Committed with the repo, so everyone working on the project gets the skill.",
      },
      {
        path: "~/.claude/skills/commit-style/SKILL.md",
        scope: "Personal",
        description: "Available in every project on your machine and not shared with the team.",
      },
      {
        path: ".claude/skills/release/scripts/changelog.sh",
        scope: "Bundled file",
        description: "Scripts, templates and references sit next to SKILL.md. Claude reads or runs them only when the instructions say so.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Frontmatter",
        explanation: "Claude matches your request against the description, so say what the skill does and when to use it.",
        codeSample: `---
name: db-migration
description: Writes and reviews Prisma migrations. Use when schema.prisma changes or the user asks for a migration.
---`,
      },
      {
        title: "Instructions",
        explanation: "Numbered steps, the commands to run, and what needs your approval.",
        codeSample: `## Steps
1. Read prisma/schema.prisma and the latest migration.
2. Run \`pnpm prisma migrate dev --create-only --name <change>\`.
3. Show the generated SQL and wait for approval before applying it.`,
      },
    ],
    bestPractices: [
      "Keep `name` lowercase with hyphens; it is also the `/name` you type to run the skill.",
      "Put trigger words in the description (file names, tasks, phrases people use), because it is all Claude sees before loading the skill.",
      "Keep SKILL.md focused and move long references into separate files the skill links to, so they load only when needed.",
      "Say what needs confirmation (deploys, migrations, deleting files) and what the skill must never do.",
      "Test it by asking for the task in plain words and checking that Claude picks the skill.",
    ],
    faqs: [
      {
        question: "Where do Claude Code skills go?",
        answer:
          "In `.claude/skills/<skill-name>/SKILL.md` for a project, or `~/.claude/skills/<skill-name>/SKILL.md` for every project on your machine. Plugins can ship skills too.",
      },
      {
        question: "Does Claude load every skill into context?",
        answer:
          "No. Only each skill's name and description load at startup. The rest of SKILL.md and any bundled files load when a task matches or you run `/skill-name`.",
      },
      {
        question: "Skill or CLAUDE.md: which should I use?",
        answer:
          "Use `CLAUDE.md` for what Claude needs in every session, such as commands and conventions. Use a skill for a procedure you need only sometimes, such as a release checklist or a migration review, so it does not take up context the rest of the time.",
      },
    ],
  },
  "claude-md": {
    slug: "claude-md",
    format: "claude_md",
    name: "CLAUDE.md Repository Guidelines",
    badge: "CLAUDE.md",
    targetFile: "CLAUDE.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "CLAUDE.md Generator, Template & Examples",
    seoDescription:
      "Generate a CLAUDE.md for Claude Code with your build and test commands, conventions and rules. Templates for popular stacks; runs in your browser.",
    heroHeading: "CLAUDE.md generator: project instructions for Claude Code",
    heroSubheading:
      "Pick your stack, fill in the commands and rules Claude should follow, and download CLAUDE.md for your repo root. Runs in your browser; nothing is uploaded.",
    overview:
      "`CLAUDE.md` is the file Claude Code reads at the start of every session. It loads in full, so it should hold what Claude needs every time: how to build, test and lint, how the code is organised, and the rules it must follow. Claude Code reads it from the repo root (or `.claude/CLAUDE.md`), from `~/.claude/CLAUDE.md` for personal defaults, and from subfolders when it works on files there. You can pull in other files with `@path/to/file`, and `/init` drafts a first version from your codebase.",
    filePlacementGuide: [
      {
        path: "./CLAUDE.md",
        scope: "Project",
        description: "Shared with the team through git. The main place for commands and conventions.",
      },
      {
        path: "~/.claude/CLAUDE.md",
        scope: "Personal, all projects",
        description: "Your own preferences, such as language or commit style, applied everywhere.",
      },
      {
        path: "packages/api/CLAUDE.md",
        scope: "Subfolder",
        description: "Loaded when Claude reads or edits files in that folder. Useful for monorepo packages.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Commands",
        explanation: "Exact commands Claude can run as written, including how to run a single test.",
        codeSample: `## Commands
- Dev: \`pnpm dev\`
- Test one file: \`pnpm vitest run src/lib/date.test.ts\`
- Typecheck: \`pnpm tsc --noEmit\`
- Lint: \`pnpm lint\``,
      },
      {
        title: "Rules and imports",
        explanation: "Short rules with reasons, and `@` imports for longer documents.",
        codeSample: `## Rules
- Server Components by default; "use client" only for interactivity.
- Never edit files in src/generated/; run \`pnpm codegen\` instead.
- Read @docs/architecture.md before changing the data layer.`,
      },
    ],
    bestPractices: [
      "Keep it short. Everything in CLAUDE.md loads every session, so cut anything Claude can learn from the code.",
      "Write commands exactly as they should be run, including the one for a single test file.",
      "Give each 'never' rule a reason, so Claude can handle cases the rule does not name.",
      "Move procedures you need only sometimes into skills or imported docs.",
      "Update it when commands or conventions change; stale instructions are worse than none.",
    ],
    faqs: [
      {
        question: "Where should CLAUDE.md go?",
        answer:
          "In the root of your repo, committed to git. Claude Code also reads `~/.claude/CLAUDE.md` for personal defaults and `CLAUDE.md` files in subfolders when it works there.",
      },
      {
        question: "How long should CLAUDE.md be?",
        answer:
          "As short as it can be while still listing your commands and rules. It loads in full every session, so a long file costs context and buries the important lines. Move detail into imported docs or skills.",
      },
      {
        question: "Can I use CLAUDE.md with AGENTS.md or Cursor rules?",
        answer:
          "Yes. Claude Code reads `CLAUDE.md`; Codex, Cursor and other tools read `AGENTS.md` or `.cursor/rules/`. To keep one source, put shared rules in `AGENTS.md` and add `@AGENTS.md` to `CLAUDE.md`.",
      },
    ],
  },
  "agents-md": {
    slug: "agents-md",
    format: "agents_md",
    name: "AGENTS.md Multi-Agent Rules",
    badge: "AGENTS.md",
    targetFile: "AGENTS.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "AGENTS.md Generator, Template & Examples",
    seoDescription:
      "Generate an AGENTS.md for Codex, Cursor, GitHub Copilot and other coding agents: setup, commands, code style and checks. Free, runs in your browser.",
    heroHeading: "AGENTS.md generator: one instructions file for every coding agent",
    heroSubheading:
      "Pick your stack, fill in the setup and test commands, and download AGENTS.md for your repo root. Runs in your browser; nothing is uploaded.",
    overview:
      "`AGENTS.md` is an open, tool-neutral format for instructions to coding agents: a plain Markdown file in the repo root with no required fields. OpenAI Codex, Cursor, GitHub Copilot's coding agent, Google Jules and a growing list of other tools read it. Think of it as a README for agents: how to set up the project, which commands to run, the code style, and what to check before a change is done. In a monorepo, an `AGENTS.md` in a subfolder applies there and the nearest file wins. Claude Code reads `CLAUDE.md` instead, so add `@AGENTS.md` to it to share one file.",
    filePlacementGuide: [
      {
        path: "./AGENTS.md",
        scope: "Repo root",
        description: "Setup, commands and conventions for the whole project.",
      },
      {
        path: "packages/web/AGENTS.md",
        scope: "Subfolder",
        description: "Rules for one package. Agents use the AGENTS.md nearest to the files they edit.",
      },
      {
        path: "./CLAUDE.md",
        scope: "Claude Code",
        description: "A one-line `@AGENTS.md` import so Claude Code follows the same instructions.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Setup and checks",
        explanation: "The commands agents need most, and what must pass before a change counts as done.",
        codeSample: `## Setup
- Install: \`pnpm install\`
- Dev server: \`pnpm dev\`

## Before a change is done
- \`pnpm lint\` and \`pnpm test\` pass
- No new TypeScript errors (\`pnpm tsc --noEmit\`)`,
      },
      {
        title: "Boundaries",
        explanation: "What agents may do on their own and what needs a person.",
        codeSample: `## Boundaries
- Do not edit .env* files or commit secrets.
- Ask before adding a dependency or changing the database schema.
- One change per pull request; title it feat:, fix: or chore:.`,
      },
    ],
    bestPractices: [
      "Start with the commands: install, dev, test, lint. Agents use them more than any prose.",
      "List the checks a change must pass, so the agent runs them before it says it is done.",
      "Write boundaries as concrete actions: files not to touch, steps that need approval.",
      "Keep tool-specific details in that tool's file (`.cursor/rules/`, `CLAUDE.md`) and shared rules in AGENTS.md.",
      "Add nested AGENTS.md files for monorepo packages with their own commands.",
    ],
    faqs: [
      {
        question: "Which tools read AGENTS.md?",
        answer:
          "OpenAI Codex, Cursor, GitHub Copilot's coding agent, Google Jules and a growing list of other agents. Claude Code reads `CLAUDE.md`, which can import it with `@AGENTS.md`.",
      },
      {
        question: "AGENTS.md vs CLAUDE.md: which do I need?",
        answer:
          "If you only use Claude Code, `CLAUDE.md` is enough. If your team uses several agents, keep shared instructions in `AGENTS.md` and import it from `CLAUDE.md`, so there is one source of truth.",
      },
      {
        question: "Does AGENTS.md need a special format?",
        answer:
          "No. It is plain Markdown with no required sections or frontmatter. Headings for setup, commands, code style and checks help agents find what they need.",
      },
    ],
  },
  "mcp-config": {
    slug: "mcp-config",
    format: "mcp_json",
    name: "Model Context Protocol (MCP)",
    badge: "MCP Config",
    targetFile: ".mcp.json",
    targetDir: "./ (Repository Root)",
    seoTitle: "MCP Config Generator (.mcp.json)",
    seoDescription:
      "Generate MCP server configs for Claude Code (.mcp.json), Claude Desktop and Cursor: GitHub, Postgres, filesystem and more, with secrets kept in env vars.",
    heroHeading: "MCP config generator: .mcp.json for Claude Code, Claude Desktop and Cursor",
    heroSubheading:
      "Pick the servers, keep tokens in environment variables, and download the config for your client. Runs in your browser; nothing is uploaded.",
    overview:
      "The Model Context Protocol (MCP) is an open standard that lets AI tools call external servers for data and actions, such as GitHub issues, a Postgres database or files on disk. Each client lists its servers in a JSON file under an `mcpServers` key: a command that starts a local server (with `args` and `env`), or a URL for a remote one. Claude Code reads a project's `.mcp.json` from the repo root and asks before using its servers. Claude Desktop uses `claude_desktop_config.json`, and Cursor uses `.cursor/mcp.json`.",
    filePlacementGuide: [
      {
        path: "./.mcp.json",
        scope: "Claude Code, project",
        description: "Committed with the repo so the team shares the same servers. Claude Code asks for approval before using them.",
      },
      {
        path: "~/Library/Application Support/Claude/claude_desktop_config.json",
        scope: "Claude Desktop",
        description: "On Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`. Restart Claude Desktop after editing.",
      },
      {
        path: ".cursor/mcp.json",
        scope: "Cursor, project",
        description: "Use `~/.cursor/mcp.json` for servers available in every project.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Local server",
        explanation: "A command the client starts on your machine. Give a filesystem server only the folders it needs.",
        codeSample: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./src", "./docs"]
    }
  }
}`,
      },
      {
        title: "Remote server with a token",
        explanation:
          "Claude Code expands `${VAR}` from your environment when it loads `.mcp.json`, so the token never lands in git.",
        codeSample: `{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer \${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}`,
      },
    ],
    bestPractices: [
      "Never commit tokens. Use `${VAR}` references in `.mcp.json` and set the values in your shell.",
      "Give filesystem servers only the folders they need, never your home directory or a drive root.",
      "Use read-only database users and fine-grained, read-only GitHub tokens unless the agent has to write.",
      "Only add servers you trust: a server sees what you send it and acts with the credentials you give it.",
      "Restart the client after editing the config; most read it only at startup.",
    ],
    faqs: [
      {
        question: "Where does the MCP config file go?",
        answer:
          "For Claude Code, `.mcp.json` in the repo root, or `claude mcp add` for personal servers. Claude Desktop uses `claude_desktop_config.json` (Settings > Developer > Edit Config). Cursor uses `.cursor/mcp.json` in the project or `~/.cursor/mcp.json` for all projects.",
      },
      {
        question: "Can I use the same config in VS Code?",
        answer:
          "Mostly. VS Code reads `.vscode/mcp.json`, where the top-level key is `servers` instead of `mcpServers`. The server entries have the same shape.",
      },
      {
        question: "How do I keep API tokens out of the file?",
        answer:
          "Write `${GITHUB_PERSONAL_ACCESS_TOKEN}` instead of the token. Claude Code expands environment variables in `.mcp.json`, so the real value stays in your shell or secret manager.",
      },
    ],
  },
  "windsurf-rules": {
    slug: "windsurf-rules",
    format: "windsurf_cascade",
    name: "Windsurf Cascade Rules",
    badge: "Windsurf",
    targetFile: "<rule-name>.md",
    targetDir: ".windsurf/rules/",
    seoTitle: "Windsurf Rules Generator (.windsurf/rules)",
    seoDescription:
      "Generate Windsurf Cascade rules for your stack in .windsurf/rules/, with always-on, glob and model-decision triggers. Free, runs in your browser.",
    heroHeading: "Windsurf rules generator: Cascade rules for your stack",
    heroSubheading:
      "Pick a preset, set when the rule should apply, and download the Markdown file for .windsurf/rules/. Runs in your browser; nothing is uploaded.",
    overview:
      "Windsurf's Cascade agent reads workspace rules from Markdown files in `.windsurf/rules/`. Each rule has an activation mode set by `trigger` in its frontmatter: always on, on a glob match, when the model decides the rule's description is relevant, or only when you @-mention it. Global rules that apply to every workspace are kept in Windsurf's settings. Windsurf limits the length of each rule file, so short, specific rules work better than one long file.",
    filePlacementGuide: [
      {
        path: ".windsurf/rules/nextjs.md",
        scope: "trigger: glob",
        description: "Framework conventions attached when route or component files are in play.",
      },
      {
        path: ".windsurf/rules/testing.md",
        scope: "trigger: model_decision",
        description: "Loaded when Cascade judges the description relevant, such as when you ask for tests.",
      },
      {
        path: "Global rules (Windsurf settings)",
        scope: "All workspaces",
        description: "Personal preferences that should apply in every project.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Activation",
        explanation: "The frontmatter sets when Cascade applies the rule.",
        codeSample: `---
trigger: glob
globs: src/**/*.test.ts
---`,
      },
      {
        title: "Rule body",
        explanation: "Concrete instructions Cascade can follow and check.",
        codeSample: `- Use Vitest; never add Jest.
- One describe block per module, named after the file.
- Run \`pnpm vitest run <file>\` after editing a test.`,
      },
    ],
    bestPractices: [
      "Use `always_on` only for rules every request needs.",
      "Give model-decision rules a clear description; Cascade decides from it.",
      "Split rules by concern (styling, data access, tests) to stay within the length limit.",
      "Commit `.windsurf/rules/` so the whole team gets the same rules.",
    ],
    faqs: [
      {
        question: "Where are Windsurf rules stored?",
        answer:
          "Workspace rules are Markdown files in `.windsurf/rules/` in your project. Global rules apply to every workspace and are edited in Windsurf's settings.",
      },
      {
        question: "Does Windsurf load every rule automatically?",
        answer:
          "Only rules with `trigger: always_on`. Others load on a glob match, when Cascade decides the description fits the task, or when you @-mention them.",
      },
      {
        question: "Can I reuse my Cursor rules in Windsurf?",
        answer:
          "The rule text carries over; the frontmatter does not. Cursor uses `globs` and `alwaysApply`, Windsurf uses `trigger` and `globs`. The rules converter in AI Skill Studio rewrites one into the other.",
      },
    ],
  },
  "copilot-instructions": {
    slug: "copilot-instructions",
    format: "copilot_instructions",
    name: "GitHub Copilot Instructions",
    badge: "Copilot",
    targetFile: "copilot-instructions.md",
    targetDir: ".github/",
    seoTitle: "copilot-instructions.md Generator",
    seoDescription:
      "Generate .github/copilot-instructions.md for GitHub Copilot Chat, code review and the coding agent, with your stack's conventions. Free, in your browser.",
    heroHeading: "GitHub Copilot instructions generator: .github/copilot-instructions.md",
    heroSubheading:
      "Give GitHub Copilot Chat, code review and the coding agent the same project instructions for everyone on your team.",
    overview:
      "`.github/copilot-instructions.md` holds repository-wide instructions for GitHub Copilot. Copilot adds it to Copilot Chat requests, code review and the Copilot coding agent in that repository; it is not used for code completions as you type. For rules that apply to some files only, add `.github/instructions/<name>.instructions.md` files with an `applyTo` glob in the frontmatter. The coding agent also reads `AGENTS.md`.",
    filePlacementGuide: [
      {
        path: ".github/copilot-instructions.md",
        scope: "Whole repository",
        description: "Conventions every Copilot request in the repository should follow.",
      },
      {
        path: ".github/instructions/tests.instructions.md",
        scope: "Files matching applyTo",
        description: "Path-specific rules, for example for test files only.",
      },
      {
        path: "./AGENTS.md",
        scope: "Copilot coding agent",
        description: "Read by the coding agent alongside the instructions file, and shared with other agents.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Repository instructions",
        explanation: "Short statements about the stack, the commands and the patterns to avoid.",
        codeSample: `# Project instructions
- Stack: Next.js 15, TypeScript strict, Tailwind CSS v4, pnpm.
- Run \`pnpm test\` and \`pnpm lint\` before proposing a change.
- Use next/navigation, never next/router.
- Data access goes through src/server/db.ts; no queries in components.`,
      },
      {
        title: "Path-specific instructions",
        explanation: "A separate file whose `applyTo` glob limits where it applies.",
        codeSample: `---
applyTo: "**/*.test.ts"
---
- Use Vitest and Testing Library; no snapshot tests for components.`,
      },
    ],
    bestPractices: [
      "Write short, self-contained statements; Copilot follows specific instructions better than broad ones.",
      "Describe the stack, the commands and the patterns to avoid, and skip advice like 'write clean code'.",
      "Use `.instructions.md` files with `applyTo` for rules that matter only to some files.",
      "Commit the file to the default branch so everyone, including code review, uses it.",
    ],
    faqs: [
      {
        question: "Does copilot-instructions.md affect code completions?",
        answer:
          "No. It is used by Copilot Chat, Copilot code review and the Copilot coding agent, not by the completions that appear as you type.",
      },
      {
        question: "Where does the Copilot instructions file go?",
        answer:
          "At `.github/copilot-instructions.md` in your repository. Path-specific files go in `.github/instructions/` and end in `.instructions.md`.",
      },
      {
        question: "Does Copilot use it in pull request reviews?",
        answer: "Yes. Copilot code review reads the repository's custom instructions when it reviews a pull request.",
      },
    ],
  },
  "openai-instructions": {
    slug: "openai-instructions",
    format: "openai_instructions",
    name: "OpenAI Custom Instructions",
    badge: "OpenAI",
    targetFile: "openai-custom-instructions.md",
    targetDir: "prompts/",
    seoTitle: "ChatGPT Custom Instructions Generator",
    seoDescription:
      "Generate coding instructions for ChatGPT custom instructions, Projects and custom GPTs, or the system message in the OpenAI API. Free, in your browser.",
    heroHeading: "ChatGPT and OpenAI custom instructions generator for coding",
    heroSubheading:
      "Turn your stack and coding rules into instructions you can paste into ChatGPT or send to the API. Runs in your browser; nothing is uploaded.",
    overview:
      "OpenAI tools take instructions in a few places. In ChatGPT, custom instructions (Settings > Personalization) apply to all your chats, a Project's instructions apply to chats in that project, and a custom GPT has its own. In the API, the same text goes in the `instructions` parameter of the Responses API, or in a system or developer message. This file is a versioned copy you paste into one of those; nothing reads it from your repo automatically. Codex, OpenAI's coding agent, reads `AGENTS.md` instead.",
    filePlacementGuide: [
      {
        path: "prompts/openai-custom-instructions.md",
        scope: "Your repo",
        description: "A versioned copy, so changes to the instructions are reviewed like code.",
      },
      {
        path: "ChatGPT > Settings > Personalization",
        scope: "All chats",
        description: "Custom instructions applied to every conversation.",
      },
      {
        path: "ChatGPT Project or custom GPT",
        scope: "One project or GPT",
        description: "Instructions limited to that project's chats or that GPT.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Role and rules",
        explanation: "The stack and the rules that matter most go first.",
        codeSample: `You are helping on a Next.js 15 + TypeScript project.
- Answer with code first, then a short explanation.
- Use Server Components by default and Zod for input validation.
- Never use \`any\`; ask if a type is unclear.`,
      },
      {
        title: "Using it in the API",
        explanation: "Send the file as `instructions` in the Responses API.",
        codeSample: `const response = await client.responses.create({
  model: process.env.OPENAI_MODEL,
  instructions: fs.readFileSync("prompts/openai-custom-instructions.md", "utf8"),
  input: "Add a delete action to the posts table.",
});`,
      },
    ],
    bestPractices: [
      "Put the stack and the non-negotiable rules first; they matter more than tone.",
      "Ask for the output you want: a diff, a full file, or code followed by a short explanation.",
      "Keep personal preferences in ChatGPT custom instructions and project rules in a Project or custom GPT.",
      "Keep the canonical copy in git and paste from it, so the team uses the same version.",
    ],
    faqs: [
      {
        question: "Where do I paste this in ChatGPT?",
        answer:
          "In Settings > Personalization > Custom instructions for all chats, in a Project's instructions for that project's chats, or in the Configure tab of a custom GPT.",
      },
      {
        question: "Can I use it with the OpenAI API?",
        answer:
          "Yes. Pass it as `instructions` in the Responses API, or as the system or developer message in Chat Completions.",
      },
      {
        question: "Does Codex read this file?",
        answer:
          "No. Codex reads `AGENTS.md` from your repository. Use the AGENTS.md generator for instructions shared by Codex and other agents.",
      },
    ],
  },
  "gemini-prompts": {
    slug: "gemini-prompts",
    format: "gemini_prompts",
    name: "Gemini System Instructions",
    badge: "Gemini",
    targetFile: "gemini-system-instructions.json",
    targetDir: "prompts/",
    seoTitle: "Gemini System Instructions Generator",
    seoDescription:
      "Generate Gemini system instructions as JSON for the Gemini API and Google AI Studio, with your stack's role, rules and checks. Free, in your browser.",
    heroHeading: "Gemini system instructions generator for the Gemini API",
    heroSubheading:
      "Build a system instruction for the Gemini API or Google AI Studio from your stack and rules. Runs in your browser; nothing is uploaded.",
    overview:
      "The Gemini API takes a system instruction separately from the conversation: `system_instruction` in the REST API, or `systemInstruction` in the request config of the Google Gen AI SDKs. Google AI Studio has a System instructions field for the same text. This generator writes the instruction as JSON with one part per section (role, guidelines, constraints, procedures, checks), so you can version it and load it in code. For the Gemini CLI, use a `GEMINI.md` file in your project instead.",
    filePlacementGuide: [
      {
        path: "prompts/gemini-system-instructions.json",
        scope: "Your repo",
        description: "Versioned with your code and loaded by your app when it calls the Gemini API.",
      },
      {
        path: "Google AI Studio > System instructions",
        scope: "AI Studio",
        description: "Paste the text parts to try the instruction before you use it in code.",
      },
    ],
    syntaxHighlights: [
      {
        title: "REST request",
        explanation: "The system instruction sits next to `contents`, as a list of text parts.",
        codeSample: `{
  "system_instruction": {
    "parts": [
      { "text": "You are a senior Go engineer on a Fiber API." },
      { "text": "Return errors from handlers; never panic." }
    ]
  },
  "contents": [{ "role": "user", "parts": [{ "text": "Add a health check route." }] }]
}`,
      },
      {
        title: "Google Gen AI SDK",
        explanation: "Join the parts and pass them as `config.systemInstruction`.",
        codeSample: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const res = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL,
  contents: "Add a health check route.",
  config: {
    systemInstruction: file.system_instruction.parts.map((p) => p.text).join("\\n"),
  },
});`,
      },
    ],
    bestPractices: [
      "Keep each part to one topic, so you can change or test parts on their own.",
      "State the role and the hard constraints first; put examples last.",
      "Load the JSON from your repo instead of pasting the prompt into code, so changes get reviewed.",
      "Try changes in Google AI Studio before you ship them.",
    ],
    faqs: [
      {
        question: "How do I use the JSON with the Gemini SDK?",
        answer:
          "Load the file, join the text of `system_instruction.parts`, and pass it as `config.systemInstruction` to `ai.models.generateContent()` in the Google Gen AI SDK. In the REST API, send the object as `system_instruction`.",
      },
      {
        question: "Does the Gemini CLI use this file?",
        answer:
          "No. The Gemini CLI reads `GEMINI.md` context files from your project. Use this JSON for API calls, and a Markdown context file such as GEMINI.md or AGENTS.md for coding agents.",
      },
    ],
  },
  "cursorignore": {
    slug: "cursorignore",
    format: "cursorignore",
    name: ".cursorignore Shield",
    badge: ".cursorignore",
    targetFile: ".cursorignore",
    targetDir: "./ (Repository Root)",
    seoTitle: ".cursorignore Generator & Examples",
    seoDescription:
      "Generate a .cursorignore that keeps secrets, build output and generated code out of Cursor's indexing and AI features. Free, runs in your browser.",
    heroHeading: ".cursorignore generator: keep secrets and build output away from Cursor",
    heroSubheading:
      "Choose what to exclude, add your own patterns, and download .cursorignore for your repo root. Runs in your browser; nothing is uploaded.",
    overview:
      "`.cursorignore` uses `.gitignore` syntax to list files Cursor should leave out of codebase indexing and AI features such as chat, Agent, inline edit and @-mentions. Cursor already skips files in `.gitignore` when indexing, so `.cursorignore` is for files you track or keep locally but do not want sent to a model: `.env` files, keys, large fixtures and generated code. Exclusion is best effort: commands the agent runs in the terminal, and MCP tools, can still read ignored files. To keep files out of the index but still usable on request, use `.cursorindexingignore`.",
    filePlacementGuide: [
      {
        path: "./.cursorignore",
        scope: "Repo root",
        description: "Excludes matching files from indexing and AI features.",
      },
      {
        path: "./.cursorindexingignore",
        scope: "Repo root",
        description: "Excludes files from the index only; you can still add them to a request.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Secrets",
        explanation: "Keep keys and environment files out of prompts. `!` re-includes a file a wider pattern excluded.",
        codeSample: `# Secrets and credentials
.env*
!.env.example
*.pem
*.key
service-account*.json`,
      },
      {
        title: "Generated and bulky files",
        explanation: "Tracked files a model rarely needs, which only crowd out your source code.",
        codeSample: `# Build output and generated code
.next/
dist/
coverage/
src/generated/
*.min.js

# Large fixtures
fixtures/**/*.json`,
      },
    ],
    bestPractices: [
      "Start with secrets: `.env*` (except `.env.example`), keys, certificates and service-account files.",
      "Add generated code and build output that is tracked in git; `.gitignore` already covers the rest for indexing.",
      "Do not treat it as a security boundary. Keep real secrets out of the repo and out of the agent's shell.",
      "Use `!pattern` to re-include a file that a wider pattern excluded, such as `!.env.example`.",
    ],
    faqs: [
      {
        question: "Does .cursorignore replace .gitignore?",
        answer:
          "No. `.gitignore` decides what git tracks; `.cursorignore` decides what Cursor's indexing and AI features can use. Cursor already respects `.gitignore` for indexing, so list only the extra files.",
      },
      {
        question: "Is a file in .cursorignore hidden from the agent completely?",
        answer:
          "No. Cursor treats it as best effort: ignored files stay out of indexing, chat context and edits, but terminal commands and MCP tools the agent runs can still read them.",
      },
      {
        question: ".cursorignore vs .cursorindexingignore?",
        answer:
          "`.cursorignore` excludes files from indexing and AI features. `.cursorindexingignore` only keeps files out of the index, so codebase search skips them but you can still add them to a request.",
      },
    ],
  },
  "claudeignore": {
    slug: "claudeignore",
    format: "claudeignore",
    name: ".claudeignore Shield",
    badge: ".claudeignore",
    targetFile: ".claudeignore",
    targetDir: "./ (Repository Root)",
    seoTitle: ".claudeignore Generator for Claude Code",
    seoDescription:
      "Generate a .claudeignore pattern list for Claude Code, plus the permissions.deny rules that actually block reads of secrets and build output.",
    heroHeading: ".claudeignore generator: keep Claude Code out of secrets and build output",
    heroSubheading:
      "Choose the paths Claude Code should stay out of, then mirror the sensitive ones as deny rules it enforces. Runs in your browser; nothing is uploaded.",
    overview:
      "A `.claudeignore` file keeps one reviewable list of the paths Claude Code should stay out of: local secrets, build output and vendor folders. Claude Code's documented way to enforce that list is permission rules, so mirror sensitive paths as `Read(...)` entries under `permissions.deny` in `.claude/settings.json`. Claude Code then refuses to read those files, even when asked.",
    filePlacementGuide: [
      {
        path: "./.claudeignore",
        scope: "Repo root",
        description: "Your list of directory and file patterns Claude Code should not read, search or edit.",
      },
      {
        path: ".claude/settings.json",
        scope: "Enforcement",
        description: "Deny rules for the sensitive paths, which Claude Code enforces. Commit it so the team shares them.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Pattern list",
        explanation: "Paths Claude Code should stay out of, in `.gitignore` style.",
        codeSample: `# Claude Code boundaries
.env*
secrets/
coverage/
*.log`,
      },
      {
        title: "Enforced deny rules",
        explanation: "The same sensitive paths as permission rules in `.claude/settings.json`.",
        codeSample: `{
  "permissions": {
    "deny": ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"]
  }
}`,
      },
    ],
    bestPractices: [
      "Mirror secret paths such as `.env*` as `Read(...)` rules under `permissions.deny` in `.claude/settings.json`, which Claude Code enforces.",
      "Exclude large generated databases (`*.sqlite`) and fixtures to keep searches fast.",
      "Use it with `CLAUDE.md`: the rules file says how to work, the deny rules say what is off limits.",
    ],
    faqs: [
      {
        question: "Does Claude Code enforce .claudeignore?",
        answer:
          "Claude Code documents permission rules, not .claudeignore, as the way to block file access. Keep .claudeignore as your list of excluded paths and copy the sensitive ones into permissions.deny in .claude/settings.json, for example Read(./.env) and Read(./secrets/**).",
      },
      {
        question: "How do I stop Claude Code reading my .env file?",
        answer:
          "Add deny rules to `.claude/settings.json`, such as `Read(./.env)` and `Read(./.env.*)` under `permissions.deny`. Claude Code then refuses to read those files.",
      },
    ],
  },
  "llms-txt": {
    slug: "llms-txt",
    format: "llms_txt",
    name: "llms.txt Codebase Roadmap",
    badge: "llms.txt",
    targetFile: "llms.txt",
    targetDir: "./ (Repository Root / Domain Root)",
    seoTitle: "llms.txt Generator & Examples",
    seoDescription:
      "Generate an llms.txt file: a Markdown index of your project's docs for language models, following the llms.txt proposal. Free, runs in your browser.",
    heroHeading: "llms.txt generator: a Markdown map of your project for LLMs",
    heroSubheading:
      "List your key docs with one-line notes and download llms.txt for your repo or site root. Runs in your browser; nothing is uploaded.",
    overview:
      "llms.txt is a proposal, published by Jeremy Howard in 2024, for a Markdown file at `/llms.txt` that gives language models a short guide to a site or project: an H1 with the name, a blockquote summary, then sections of links with one-line notes. An `## Optional` section marks links a tool can skip when context is short. Some sites also publish `llms-full.txt` with the full text of their docs. Tools and agents read it only when they fetch it; no major search engine has said it uses llms.txt for ranking.",
    filePlacementGuide: [
      {
        path: "https://example.com/llms.txt",
        scope: "Site root",
        description: "For documentation sites, next to robots.txt and sitemap.xml.",
      },
      {
        path: "./llms.txt",
        scope: "Repo root",
        description: "A map of the codebase and its docs for agents working in the repo.",
      },
    ],
    syntaxHighlights: [
      {
        title: "File structure",
        explanation: "H1 name, blockquote summary, then H2 sections of links with notes.",
        codeSample: `# Acme API

> TypeScript SDK and REST API for Acme payments.

## Docs
- [Quickstart](https://acme.dev/docs/quickstart.md): install and first request
- [Errors](https://acme.dev/docs/errors.md): error codes and retries

## Optional
- [Changelog](https://acme.dev/changelog.md)`,
      },
    ],
    bestPractices: [
      "Link to Markdown versions of pages where you have them; they are cheaper for models to read.",
      "Write a one-line note for each link so a model can choose what to fetch.",
      "Put nice-to-have links under `## Optional`.",
      "Regenerate it when docs move, so the links do not break.",
    ],
    faqs: [
      {
        question: "What is llms.txt?",
        answer:
          "A proposed standard for a Markdown file at `/llms.txt` that tells language models what a site or project is and where its most useful docs are, as a short list of links with notes.",
      },
      {
        question: "Does llms.txt help SEO?",
        answer:
          "Not directly. Google has not said it uses llms.txt, and search ranking does not depend on it. It helps tools and agents that fetch it, such as coding assistants reading your docs.",
      },
      {
        question: "What is llms-full.txt?",
        answer:
          "A common companion file with the full text of your docs in one Markdown file, for tools that want everything at once instead of following links.",
      },
    ],
  },
  "architecture-md": {
    slug: "architecture-md",
    format: "architecture_md",
    name: "ARCHITECTURE.md Specification",
    badge: "ARCHITECTURE.md",
    targetFile: "ARCHITECTURE.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "ARCHITECTURE.md Generator & Template",
    seoDescription:
      "Generate an ARCHITECTURE.md: a short map of your codebase, its data flow and the invariants people and AI agents must not break. Free, in your browser.",
    heroHeading: "ARCHITECTURE.md generator: a codemap and invariants for your repo",
    heroSubheading:
      "Describe the modules, how data flows and the rules that must hold, and download ARCHITECTURE.md. Runs in your browser; nothing is uploaded.",
    overview:
      "ARCHITECTURE.md is a convention, popularised by Aleksey Kladov's 2021 post, for a short document that explains a codebase from above: the main modules, where to find things, how data moves between them, and the invariants that must always hold. It changes less often than code, so it stays accurate. For AI agents it answers the question they most often get wrong: where a change belongs. Agents read it when your `CLAUDE.md` or `AGENTS.md` points to it, or when they explore the repo.",
    filePlacementGuide: [
      {
        path: "./ARCHITECTURE.md",
        scope: "Repo root",
        description: "Next to README.md. Link it from CLAUDE.md or AGENTS.md so agents read it before structural changes.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Codemap",
        explanation: "Where things live, and what does not belong there.",
        codeSample: `## Codemap
- src/app/: routes and pages; no data access here.
- src/server/: database queries and Server Actions.
- src/lib/: pure helpers, no I/O.`,
      },
      {
        title: "Invariants",
        explanation: "Rules that must always hold, written so a reviewer can check them.",
        codeSample: `## Invariants
- Only src/server/ imports the database client.
- Every Server Action validates input with Zod before writing.
- src/lib/ has no side effects and no network calls.`,
      },
    ],
    bestPractices: [
      "Describe what changes rarely: module boundaries and rules, not function names.",
      "Write invariants as checkable statements, such as 'only X imports Y'.",
      "Keep it short enough to read in a few minutes.",
      "Reference it from CLAUDE.md or AGENTS.md so agents load it.",
    ],
    faqs: [
      {
        question: "How is ARCHITECTURE.md different from CLAUDE.md or AGENTS.md?",
        answer:
          "CLAUDE.md and AGENTS.md tell an agent how to work: commands, conventions and checks. ARCHITECTURE.md explains how the code is organised and which rules must hold, for people and agents alike. Link it from your rules file.",
      },
      {
        question: "Do AI tools read ARCHITECTURE.md automatically?",
        answer:
          "Not by default. Point to it from `CLAUDE.md` (for example with `@ARCHITECTURE.md`) or from `AGENTS.md`, so agents read it before structural changes.",
      },
    ],
  },
  "prd-md": {
    slug: "prd-md",
    format: "prd_md",
    name: "PRD.md",
    badge: "Product Requirements",
    targetFile: "PRD.md",
    targetDir: "./",
    seoTitle: "PRD.md Generator for AI Coding Agents",
    seoDescription:
      "Generate a PRD.md product requirements doc that AI coding agents can follow: goals, users, numbered requirements, scope and milestones. Free, in your browser.",
    heroHeading: "PRD.md generator: product requirements for AI coding agents",
    heroSubheading:
      "Write goals, users, numbered requirements and milestones an agent can check its work against. Runs in your browser; nothing is uploaded.",
    overview:
      "PRD.md is a product requirements document kept in the repo as Markdown. It is a convention, not a file any tool loads by itself: your `CLAUDE.md` or `AGENTS.md` tells the agent to read it before building a feature. Because requirements are numbered (FR-1, FR-2) and scope is explicit, the agent can build what was asked, cite the requirement it is working on, and leave out what is marked out of scope.",
    filePlacementGuide: [
      {
        path: "./PRD.md",
        scope: "Repo root",
        description: "Read before feature work, when your rules file says so.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Requirements and scope",
        explanation: "Numbered requirements and an explicit out-of-scope list.",
        codeSample: `## Functional requirements
- FR-1: Users can export a project as a ZIP from the editor toolbar.
- FR-2: The export includes every file at its repo path.

## Out of scope
- Cloud sync and accounts.`,
      },
      {
        title: "Personas",
        explanation: "Who the product is for and what they need, in a table agents can scan.",
        codeSample: `## Users
| Persona | Role | Primary need |
| :--- | :--- | :--- |
| Alex | Full-stack developer | Private, in-browser tools |`,
      },
    ],
    bestPractices: [
      "Number requirements so agents and reviewers can refer to them.",
      "List what is out of scope; it stops agents adding features nobody asked for.",
      "Include measurable non-functional requirements: performance, privacy, accessibility.",
      "Tell the agent in CLAUDE.md or AGENTS.md when to read it.",
    ],
    faqs: [
      {
        question: "Why keep a PRD.md in the repo?",
        answer:
          "So the agent works from the same requirements as the team. Without one it fills gaps with guesses; with one it can check its work against numbered requirements and an explicit out-of-scope list.",
      },
      {
        question: "Do AI agents read PRD.md automatically?",
        answer: "No. Add a line such as 'Read PRD.md before starting a feature' to your CLAUDE.md or AGENTS.md.",
      },
    ],
  },
  "design-md": {
    slug: "design-md",
    format: "design_md",
    name: "DESIGN.md",
    badge: "Design System & Architecture",
    targetFile: "DESIGN.md",
    targetDir: "./",
    seoTitle: "DESIGN.md Generator for AI Agents",
    seoDescription:
      "Generate a DESIGN.md with design tokens, component patterns and UI rules so AI coding agents build interfaces that match your design system.",
    heroHeading: "DESIGN.md generator: design tokens and UI rules for AI agents",
    heroSubheading:
      "Record colours, type, spacing, component patterns and what never to do, so generated UI matches your design system. Runs in your browser; nothing is uploaded.",
    overview:
      "DESIGN.md describes your design system in Markdown: colour and spacing tokens, the type scale, component patterns, and the UI mistakes to avoid. Agents that generate UI tend to invent new colours, spacing and components; a DESIGN.md gives them the existing ones to reuse. Like the other planning docs it is a convention, so tell the agent in `CLAUDE.md` or `AGENTS.md` to read it before UI work.",
    filePlacementGuide: [
      {
        path: "./DESIGN.md",
        scope: "Repo root",
        description: "Read before UI work, when your rules file says so.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Design tokens",
        explanation: "Tokens named by role, with the values your CSS or theme uses.",
        codeSample: `## Tokens
- canvas: #09090B
- surface: #18181B
- border: #27272A
- accent: #EA580C`,
      },
      {
        title: "Component rules",
        explanation: "Which components to reuse, and the mistakes not to repeat.",
        codeSample: `## Components
- Buttons: <Button variant="primary|secondary|ghost"> from @/components/ui.
- Never nest a card inside another card.
- Icons: lucide-react, 16px in buttons, 20px in headings.`,
      },
    ],
    bestPractices: [
      "Name tokens by role (canvas, surface, border, accent), not by colour.",
      "Point to existing components to reuse instead of describing new ones.",
      "Write negative rules for mistakes you have seen agents make.",
      "Keep it in sync with your actual CSS or theme file.",
    ],
    faqs: [
      {
        question: "What goes in a DESIGN.md?",
        answer:
          "Design tokens (colours, spacing, radii, type), the components to reuse and how, layout rules, and a short list of things never to do, such as nesting cards or adding new colours.",
      },
      {
        question: "Do AI agents read DESIGN.md automatically?",
        answer: "No. Add 'Read DESIGN.md before UI work' to your CLAUDE.md or AGENTS.md.",
      },
    ],
  },
  "task-md": {
    slug: "task-md",
    format: "task_md",
    name: "TASK.md",
    badge: "Active Sprint Tracker",
    targetFile: "TASK.md",
    targetDir: "./",
    seoTitle: "TASK.md Generator: Task Tracker for Agents",
    seoDescription:
      "Generate a TASK.md that AI coding agents read and update: the current milestone, a task checklist, verification commands and a session log.",
    heroHeading: "TASK.md generator: a task list your agents keep up to date",
    heroSubheading:
      "Track the current milestone, the checks a task must pass and a log of each agent session. Runs in your browser; nothing is uploaded.",
    overview:
      "TASK.md is a Markdown checklist for the current milestone that agents read at the start of a session and update at the end. It records what is done, in progress and next, the commands that must pass before a task counts as done, and a short log of each session. It is a convention: your `CLAUDE.md` or `AGENTS.md` should tell the agent to read and update it.",
    filePlacementGuide: [
      {
        path: "./TASK.md",
        scope: "Repo root",
        description: "Read at session start and updated at the end, when your rules file says so.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Checklist and checks",
        explanation: "Task states and the commands that decide when a task is done.",
        codeSample: `## Milestone 2: Export
- [x] ZIP export from the toolbar
- [/] Include hidden files in the export
- [ ] Export progress indicator

## Verification
npm run lint && npm test && npm run build`,
      },
      {
        title: "Session log",
        explanation: "One row per agent session, so the next session knows what happened.",
        codeSample: `## Session log
| Date | Agent | Change | Result |
| :--- | :--- | :--- | :--- |
| 2026-10-12 | Claude Code | Hidden files in ZIP | Checks passed |`,
      },
    ],
    bestPractices: [
      "Mark tasks `[x]` done, `[/]` in progress and `[ ]` pending.",
      "List the exact commands a task must pass before it is marked done.",
      "Ask agents to add a session log row when they finish.",
      "Keep only the current milestone in detail; archive finished ones.",
    ],
    faqs: [
      {
        question: "How do agents use TASK.md?",
        answer:
          "They read it at session start to pick up the active task, run the verification commands after making changes, and log what they did before finishing.",
      },
      {
        question: "Do agents update TASK.md automatically?",
        answer: "Only if your rules tell them to. Add 'Read TASK.md first and update it when you finish' to your CLAUDE.md or AGENTS.md.",
      },
    ],
  },
  "memory-md": {
    slug: "memory-md",
    format: "memory_md",
    name: "MEMORY.md",
    badge: "Persistent Agent Brain",
    targetFile: "MEMORY.md",
    targetDir: "./",
    seoTitle: "MEMORY.md Generator for AI Coding Agents",
    seoDescription:
      "Generate a MEMORY.md that keeps decisions (ADRs), gotchas and key paths across AI agent sessions, so new sessions do not repeat old mistakes.",
    heroHeading: "MEMORY.md generator: decisions and lessons that outlast a session",
    heroSubheading:
      "Record architecture decisions, known gotchas and key paths so every new agent session starts from them. Runs in your browser; nothing is uploaded.",
    overview:
      "Agents start each session without memory of the last one. MEMORY.md is a Markdown file where decisions (as numbered architecture decision records), known gotchas and important paths are written down, so the next session starts from them instead of rediscovering them. It is a convention: tell the agent in `CLAUDE.md` or `AGENTS.md` to read it at the start and add lessons at the end.",
    filePlacementGuide: [
      {
        path: "./MEMORY.md",
        scope: "Repo root",
        description: "Read at session start; agents append lessons and decisions, when your rules file says so.",
      },
    ],
    syntaxHighlights: [
      {
        title: "Architecture decision record",
        explanation: "A numbered decision with its reason, so it is not reopened by the next session.",
        codeSample: `### ADR-001: Process files in the browser
- Decision: All parsing runs client-side; no upload endpoints.
- Reason: Users paste secrets and private code.
- Consequence: Large files are limited by browser memory.`,
      },
      {
        title: "Gotchas",
        explanation: "Traps an agent would otherwise hit again.",
        codeSample: `## Gotchas
- Monaco must be imported with next/dynamic and ssr: false.
- \`npm run build\` uses webpack, not Turbopack; do not change it.`,
      },
    ],
    bestPractices: [
      "Number decisions (ADR-001, ADR-002) and never rewrite old ones; add a new one that supersedes it.",
      "Write down gotchas the moment an agent hits them.",
      "Keep entries short and factual so the file stays cheap to load.",
      "Remove entries that are no longer true.",
    ],
    faqs: [
      {
        question: "How does MEMORY.md help AI agents?",
        answer:
          "It gives each new session the decisions and lessons from earlier ones: what was decided and why, and which traps to avoid. Without it, agents repeat past mistakes or reopen settled questions.",
      },
      {
        question: "Do agents read MEMORY.md automatically?",
        answer: "No. Add 'Read MEMORY.md at the start of each session and record new lessons in it' to your CLAUDE.md or AGENTS.md.",
      },
    ],
  },
};

export const FORMAT_SLUG_ALIASES: Record<string, string> = {
  // Dot-extension file format aliases
  "claude.md": "claude-md",
  "prd.md": "prd-md",
  "design.md": "design-md",
  "task.md": "task-md",
  "memory.md": "memory-md",
  "agents.md": "agents-md",
  "cursor.mdc": "cursor-rules",
  "cursorrules": "cursor-rules",
  "llms.txt": "llms-txt",
  "architecture.md": "architecture-md",
  "mcp.json": "mcp-config",
  "copilot-instructions.md": "copilot-instructions",
  "openai-custom-instructions.md": "openai-instructions",
  "gemini-system-instructions.json": "gemini-prompts",
  // Short brand aliases
  "claude": "claude-skills",
  "cursor": "cursor-rules",
  "openai": "openai-instructions",
  "gemini": "gemini-prompts",
  "mcp": "mcp-config",
  "copilot": "copilot-instructions",
  "windsurf": "windsurf-rules",
};

export const FORMAT_TO_URL_SLUG: Record<OutputFormat, string> = {
  cursor_mdc: "cursor-rules",
  skill_md: "claude-skills",
  claude_md: "claude-md",
  agents_md: "agents-md",
  mcp_json: "mcp-config",
  windsurf_cascade: "windsurf-rules",
  copilot_instructions: "copilot-instructions",
  openai_instructions: "openai-instructions",
  gemini_prompts: "gemini-prompts",
  cursorignore: "cursorignore",
  claudeignore: "claudeignore",
  llms_txt: "llms-txt",
  architecture_md: "architecture-md",
  prd_md: "prd-md",
  design_md: "design-md",
  task_md: "task-md",
  memory_md: "memory-md",
};

export function getFormatHub(formatSlug: string): FormatHubMeta | null {
  if (!formatSlug) return null;
  const canonical = FORMAT_SLUG_ALIASES[formatSlug.toLowerCase()] || formatSlug;
  return FORMAT_HUBS[canonical] || null;
}

export function getAllFormatHubs(): FormatHubMeta[] {
  return Object.values(FORMAT_HUBS);
}

export function getAllFormatSlugsWithAliases(): string[] {
  const primarySlugs = Object.keys(FORMAT_HUBS);
  const aliasSlugs = Object.keys(FORMAT_SLUG_ALIASES);
  return Array.from(new Set([...primarySlugs, ...aliasSlugs]));
}
