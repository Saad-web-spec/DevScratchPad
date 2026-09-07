export interface FormatHubMeta {
  slug: string;
  format: "cursor_mdc" | "skill_md" | "claude_md" | "agents_md" | "mcp_json";
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

export const FORMAT_HUBS: Record<string, FormatHubMeta> = {
  "cursor-rules": {
    slug: "cursor-rules",
    format: "cursor_mdc",
    name: "Cursor Rules (.mdc)",
    badge: "Cursor IDE",
    targetFile: "<rule-name>.mdc",
    targetDir: ".cursor/rules/",
    seoTitle: "Cursor Rules (.mdc) Generator & Directory — Free Offline AI Guardrails",
    seoDescription: "Explore and generate modular Cursor Project Rules (.cursor/rules/*.mdc). Enforce strict tech stack conventions, glob-scoped rules, and surgical code diffs.",
    heroHeading: "Cursor Rules (.mdc) Directory & Generator",
    heroSubheading: "Modular, glob-targeted rules for Cursor AI. Keep token overhead near zero while steering the LLM with production architectural guardrails.",
    overview: "Cursor Project Rules (.cursor/rules/*.mdc) represent the modern standard for AI-assisted development in Cursor IDE. Unlike legacy monolithic .cursorrules files which flood the context window on every prompt, .mdc rules attach conditionally using file glob patterns (e.g. `src/components/**/*.tsx`) and frontmatter directives (`alwaysApply: false`). This guarantees that your model only loads rules relevant to the exact files being edited.",
    filePlacementGuide: [
      {
        path: ".cursor/rules/nextjs.mdc",
        scope: "src/app/**/*",
        description: "Enforces React Server Components, Server Actions, and Next.js 15 conventions on App Router routes."
      },
      {
        path: ".cursor/rules/database.mdc",
        scope: "src/db/**/*, prisma/schema.prisma",
        description: "Enforces database indexing, migrations, parameterized SQL, and ORM type safety."
      },
      {
        path: ".cursor/rules/testing.mdc",
        scope: "**/*.test.ts, **/*.spec.tsx",
        description: "Enforces Vitest or Playwright testing conventions, mocking standards, and coverage requirements."
      }
    ],
    syntaxHighlights: [
      {
        title: "YAML Frontmatter Scoping",
        explanation: "Every .mdc file begins with YAML frontmatter specifying its description and target file globs.",
        codeSample: `---
description: Next.js 15 App Router and Server Actions standard
globs: src/app/**/*.{ts,tsx}
alwaysApply: false
---`
      },
      {
        title: "Behavioral Guardrails",
        explanation: "Direct instructions constraining how Cursor proposes modifications.",
        codeSample: `## Behaviors
- Deliver surgical diffs; never rewrite entire 200-line files.
- Inspect surrounding imports and tsconfig paths before adding packages.
- Always use typed Zod schemas for input validation.`
      }
    ],
    bestPractices: [
      "Keep rules modular: create distinct .mdc files per subsystem (API, UI, Database, Testing) rather than one gigantic file.",
      "Set `alwaysApply: false` and rely on precise `globs` to save context window tokens.",
      "Provide concrete 'Good' and 'Discouraged' code snippets so the model can visually anchor on the desired syntax.",
      "Specify banned patterns explicitly (e.g. 'Never import pages/ router APIs into app/').",
      "Include verification commands (e.g. `npm test`, `npm run lint`) at the end of each rule."
    ],
    faqs: [
      {
        question: "What is the difference between .cursor/rules/*.mdc and legacy .cursorrules?",
        answer: "The legacy .cursorrules file is a single monolithic document loaded on every single user interaction, quickly consuming context window limits and causing rule confusion. Modern .mdc rules support YAML frontmatter with file globs and 'alwaysApply: false', activating only when relevant files are being edited."
      },
      {
        question: "Where should I save .mdc files in my project?",
        answer: "Save your rules in the `.cursor/rules/` directory at the root of your repository (for example: `.cursor/rules/react-19.mdc`). Cursor automatically detects and indexes this directory."
      },
      {
        question: "Can I use wildcards in glob patterns?",
        answer: "Yes. You can use standard globbing syntax such as `src/components/**/*.{ts,tsx}`, `api/**/*.py`, or comma-separated lists to bind rules to specific directory trees."
      }
    ]
  },
  "claude-skills": {
    slug: "claude-skills",
    format: "skill_md",
    name: "Claude Code Skills (SKILL.md)",
    badge: "Claude Code CLI",
    targetFile: "SKILL.md",
    targetDir: ".claude/skills/<skill-name>/",
    seoTitle: "Claude Code Skills (SKILL.md) Generator & Catalog | Free & Offline",
    seoDescription: "Discover and generate modular Claude Code CLI skills (SKILL.md). Equip Claude with specialized terminal capabilities, workflow procedures, and auditing routines.",
    heroHeading: "Claude Code Skills (SKILL.md) Directory",
    heroSubheading: "Modular, on-demand capabilities for Anthropic's Claude Code agent CLI. Loaded dynamically based on natural language task descriptions.",
    overview: "Claude Code Skills are modular capabilities packaged into a SKILL.md file with YAML frontmatter. Claude Code reads the `description` field and intelligently decides when to load the full skill instructions into its context window, or allows manual execution via slash commands (e.g. `/audit` or `/migrate`). Skills allow you to teach Claude custom refactoring workflows, complex auditing protocols, and deployment procedures.",
    filePlacementGuide: [
      {
        path: ".claude/skills/codebase-auditor/SKILL.md",
        scope: "Project Level",
        description: "Audits codebase for dead code, unhandled async errors, and security vulnerabilities."
      },
      {
        path: "~/.claude/skills/personal-style/SKILL.md",
        scope: "Global User Level",
        description: "Applies your personal coding conventions and git commit style across all repositories on your machine."
      }
    ],
    syntaxHighlights: [
      {
        title: "YAML Frontmatter Description",
        explanation: "Claude Code uses the description to semantically match user prompts with available skills.",
        codeSample: `---
name: codebase-auditor
description: Audit codebases for security vulnerabilities, dead code, and architectural anti-patterns. Trigger when asked to review or evaluate code.
---`
      },
      {
        title: "Sequential Execution Procedures",
        explanation: "Step-by-step procedures tell Claude the exact sequence of commands and inspection steps.",
        codeSample: `## Step-by-Step Procedure
1. Inspect package manifest (package.json, Cargo.toml) to map dependencies.
2. Search for sensitive tokens or unparameterized queries.
3. Categorize findings into CRITICAL, HIGH, and MEDIUM.`
      }
    ],
    bestPractices: [
      "Write clear, trigger-rich descriptions in the frontmatter so Claude knows exactly when to auto-activate the skill.",
      "Structure skills into discrete phases (Discovery, Analysis, Remediation, Verification).",
      "Include negative constraints (e.g., 'Never execute destructive migrations without user approval').",
      "Add slash command alias support for frequent manual invocations."
    ],
    faqs: [
      {
        question: "How does Claude Code discover SKILL.md files?",
        answer: "Claude Code scans the `.claude/skills/<name>/SKILL.md` directory in your current workspace, as well as the global `~/.claude/skills/` directory in your user home folder."
      },
      {
        question: "Does Claude load all skills into context at once?",
        answer: "No. Claude only keeps skill metadata (name and description) in its index. The full instruction body is loaded on demand when the task warrants it, keeping context windows lightweight."
      }
    ]
  },
  "claude-md": {
    slug: "claude-md",
    format: "claude_md",
    name: "CLAUDE.md Repository Guidelines",
    badge: "Claude CLI & Desktop",
    targetFile: "CLAUDE.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "CLAUDE.md Repository Guidelines Generator & Best Practices Guide",
    seoDescription: "Generate standard CLAUDE.md repository guides. Provide Claude Code with essential build commands, architectural invariants, code styles, and testing workflows.",
    heroHeading: "CLAUDE.md Repository Guidelines Directory",
    heroSubheading: "The root onboarding manual for Anthropic's Claude Code CLI. Gives Claude instant mastery over your build systems, test suites, and project architecture.",
    overview: "A CLAUDE.md file placed at the root of a Git repository acts as Claude's persistent onboarding manual. Whenever Claude Code launches in a project directory, it parses CLAUDE.md before running any commands. It provides essential facts about package managers, build commands, test runners, directory architecture, and non-negotiable coding conventions.",
    filePlacementGuide: [
      {
        path: "./CLAUDE.md",
        scope: "Repository Root",
        description: "Primary instructions file read immediately upon Claude Code session startup."
      }
    ],
    syntaxHighlights: [
      {
        title: "Commands Section",
        explanation: "Provide exact build, test, and lint commands so Claude never has to guess.",
        codeSample: `## Common Commands
- Build: \`npm run build\`
- Test: \`npm test -- --watch=false\`
- Typecheck: \`npx tsc --noEmit\`
- Lint: \`npm run lint\``
      },
      {
        title: "Architecture & Rules",
        explanation: "Define immutable project invariants and module responsibilities.",
        codeSample: `## Code Style & Architecture
- Next.js 15 App Router: Server Components by default.
- Data Mutations: Server Actions with Zod safeParse.
- Styling: Tailwind CSS v4 utility classes only.`
      }
    ],
    bestPractices: [
      "Keep CLAUDE.md concise and high-density (under 200 lines).",
      "Always document the single command to run tests and typecheck.",
      "State forbidden patterns explicitly (e.g. 'Do not use npm install; use pnpm only').",
      "Keep commands updated whenever dependencies or build tooling changes."
    ],
    faqs: [
      {
        question: "Where should CLAUDE.md be placed?",
        answer: "CLAUDE.md should be located in the root directory of your repository. Claude Code automatically looks for and loads this file when you run claude in terminal."
      },
      {
        question: "Can I use CLAUDE.md alongside Cursor .mdc rules?",
        answer: "Yes! They complement each other. CLAUDE.md provides overall project build/test commands and repository orientation, while .cursor/rules/*.mdc provides granular, file-glob scoped editing rules."
      }
    ]
  },
  "agents-md": {
    slug: "agents-md",
    format: "agents_md",
    name: "AGENTS.md Multi-Agent Rules",
    badge: "Autonomous Agents",
    targetFile: "AGENTS.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "AGENTS.md Multi-Agent System Protocol Generator & Specification",
    seoDescription: "Create production-ready AGENTS.md files for autonomous coding agents (Antigravity, Codex, Devin, Claude). Define agent roles, permissions, and validation gates.",
    heroHeading: "AGENTS.md Multi-Agent System Protocol Directory",
    heroSubheading: "Unified steering specifications for autonomous AI coding agents. Establish agent boundaries, verification gates, and delegation contracts.",
    overview: "AGENTS.md is an emerging universal open standard for steering autonomous coding agents across different AI tooling ecosystems. Placed at repository root, AGENTS.md instructs autonomous agents on environment setup, allowed operations, branching strategies, automated testing gates, and documentation integrity rules.",
    filePlacementGuide: [
      {
        path: "./AGENTS.md",
        scope: "Repository Root",
        description: "Universal specification read by multi-agent frameworks, IDE coding assistants, and CI agents."
      }
    ],
    syntaxHighlights: [
      {
        title: "Agent Verification Gates",
        explanation: "Non-negotiable verification steps the agent must execute before declaring a task complete.",
        codeSample: `## Verification Requirements
Every agent task must be verified with:
1. \`npm run build\` (must exit 0)
2. \`npm test\` (all tests green)
3. No newly introduced TypeScript errors`
      }
    ],
    bestPractices: [
      "Define clean permission boundaries (e.g. 'Read-only access to .env files; never write credentials').",
      "Specify required git branching rules (e.g. 'Create feature branches with prefix feat/').",
      "Enforce documentation integrity: do not delete existing comments or docstrings."
    ],
    faqs: [
      {
        question: "What is AGENTS.md used for?",
        answer: "AGENTS.md provides standardized instructions for autonomous AI agents that operate in codebases without human intervention at every step. It defines constraints, testing requirements, and architecture rules."
      }
    ]
  },
  "mcp-config": {
    slug: "mcp-config",
    format: "mcp_json",
    name: "Model Context Protocol (MCP)",
    badge: "MCP Servers",
    targetFile: "claude_desktop_config.json",
    targetDir: "~/Library/Application Support/Claude/ or %APPDATA%/Claude/",
    seoTitle: "Model Context Protocol (MCP) Config Generator & Claude Desktop Templates",
    seoDescription: "Pre-configured Model Context Protocol (MCP) server configurations for Claude Desktop, Cursor, and Windsurf. Connect GitHub, PostgreSQL, SQLite, and Brave Search.",
    heroHeading: "Model Context Protocol (MCP) Configuration Directory",
    heroSubheading: "Pre-tested, production MCP server configs. Connect your AI coding agents directly to databases, GitHub repos, search engines, and local filesystems.",
    overview: "The Model Context Protocol (MCP) is an open specification pioneered by Anthropic that standardizes how AI applications connect to external tools, databases, and APIs. With an MCP server configured in your client (such as Claude Desktop or Cursor), your AI assistant can directly inspect database schemas, run SQL queries, search GitHub issues, and fetch web documentation safely.",
    filePlacementGuide: [
      {
        path: "%APPDATA%/Claude/claude_desktop_config.json",
        scope: "Claude Desktop (Windows)",
        description: "MCP client configuration registering all stdio and SSE server instances."
      },
      {
        path: "~/Library/Application Support/Claude/claude_desktop_config.json",
        scope: "Claude Desktop (macOS)",
        description: "MCP client configuration on macOS."
      },
      {
        path: ".cursor/mcp.json",
        scope: "Cursor Workspace",
        description: "Project-level MCP server declarations for Cursor IDE."
      }
    ],
    syntaxHighlights: [
      {
        title: "Standard JSON Configuration",
        explanation: "Declare server executables and environment variables under the mcpServers key.",
        codeSample: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}`
      }
    ],
    bestPractices: [
      "Never commit plaintext API tokens to public Git repositories; use environment variables where supported.",
      "Scope filesystem servers strictly to the working project folder instead of root `/` or `C:\\`.",
      "Prefer read-only database credentials for development AI sessions."
    ],
    faqs: [
      {
        question: "How do I install an MCP server in Claude Desktop?",
        answer: "Open Claude Desktop Settings > Developer > Edit Config. This opens `claude_desktop_config.json`. Paste the generated JSON block into the `mcpServers` object, save the file, and restart Claude Desktop."
      },
      {
        question: "Can I use MCP servers in Cursor or Windsurf?",
        answer: "Yes! Modern versions of Cursor and Windsurf support the Model Context Protocol. You can add the same stdio server configs in their respective MCP settings panels."
      }
    ]
  }
};

export function getFormatHub(formatSlug: string): FormatHubMeta | null {
  return FORMAT_HUBS[formatSlug] || null;
}

export function getAllFormatHubs(): FormatHubMeta[] {
  return Object.values(FORMAT_HUBS);
}
