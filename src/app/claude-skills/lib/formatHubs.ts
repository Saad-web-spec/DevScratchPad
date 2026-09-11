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

export const FORMAT_HUBS: Record<string, FormatHubMeta> = {
  "cursor-rules": {
    slug: "cursor-rules",
    format: "cursor_mdc",
    name: "Cursor Rules (.mdc)",
    badge: "Cursor Rules",
    targetFile: "<rule-name>.mdc",
    targetDir: ".cursor/rules/",
    seoTitle: "Cursor Rules (.mdc) Generator",
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
    badge: "Claude Skill",
    targetFile: "SKILL.md",
    targetDir: ".claude/skills/<skill-name>/",
    seoTitle: "Claude Skills (SKILL.md) Generator",
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
    badge: "CLAUDE.md",
    targetFile: "CLAUDE.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "CLAUDE.md Guide & Generator",
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
    badge: "AGENTS.md",
    targetFile: "AGENTS.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "AGENTS.md Multi-Agent Rules",
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
    badge: "MCP Config",
    targetFile: "claude_desktop_config.json",
    targetDir: "~/Library/Application Support/Claude/ or %APPDATA%/Claude/",
    seoTitle: "MCP Server Config Generator",
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
  },
  "windsurf-rules": {
    slug: "windsurf-rules",
    format: "windsurf_cascade",
    name: "Windsurf Cascade Rules",
    badge: "Windsurf",
    targetFile: "<rule-name>.md",
    targetDir: ".windsurf/rules/",
    seoTitle: "Windsurf Cascade Rules Generator",
    seoDescription: "Generate production-grade Windsurf Cascade AI rules (.windsurf/rules/*.md). Enforce multi-step execution flows, tech stack guardrails, and zero-token waste.",
    heroHeading: "Windsurf Cascade Rules Directory & Generator",
    heroSubheading: "Targeted workflow rules for Windsurf Cascade. Guide AI code agents through context inspection, architectural alignment, and surgical diffs.",
    overview: "Windsurf Cascade rules (.windsurf/rules/*.md) provide structured, phase-driven instructions for Codeium's Windsurf editor. They define agent personas, execution checklists, and negative constraints to keep Cascade focused and prevent hallucinated patterns.",
    filePlacementGuide: [
      {
        path: ".windsurf/rules/nextjs.md",
        scope: "Global repository / Cascade active flows",
        description: "Enforces React Server Components, Server Actions, and Next.js conventions in Windsurf."
      },
      {
        path: ".windsurf/rules/backend.md",
        scope: "Backend services, APIs, and database migrations",
        description: "Enforces schema validation, parameterized queries, and defensive error propagation."
      }
    ],
    syntaxHighlights: [
      {
        title: "Execution Workflow Directives",
        explanation: "Windsurf Cascade thrives on explicit step-by-step checklists to guide agent reasoning across files.",
        codeSample: `## Cascade Execution Workflow
1. Inspect surrounding files and project manifests.
2. Formulate surgical edits adhering to repository conventions.
3. Run test suites and typecheck verification.`
      }
    ],
    bestPractices: [
      "Keep individual rule files focused on single concerns (e.g. styling, security, data access).",
      "Include negative constraints (e.g. 'Never use any') to eliminate common model shortcuts.",
      "Specify testing commands so Cascade automatically runs verification before completing flows."
    ],
    faqs: [
      {
        question: "Where are Windsurf rules stored?",
        answer: "Save rule markdown files directly in `.windsurf/rules/` in your project root directory."
      },
      {
        question: "Does Windsurf Cascade auto-load rules?",
        answer: "Yes, Windsurf Cascade reads rules inside `.windsurf/rules/` automatically whenever interacting with matching codebase contexts."
      }
    ]
  },
  "copilot-instructions": {
    slug: "copilot-instructions",
    format: "copilot_instructions",
    name: "GitHub Copilot Instructions",
    badge: "Copilot",
    targetFile: "copilot-instructions.md",
    targetDir: ".github/",
    seoTitle: "GitHub Copilot Instructions Generator",
    seoDescription: "Create repository-level instructions for GitHub Copilot (.github/copilot-instructions.md). Enforce coding standards, testing rules, and architectural guidelines across pull requests.",
    heroHeading: "GitHub Copilot Instructions Generator",
    heroSubheading: "Standardize GitHub Copilot Chat and completions across your entire team with root repository instruction files.",
    overview: "GitHub Copilot reads instructions from `.github/copilot-instructions.md` automatically during chat sessions and code reviews. Defining explicit tech stack conventions, banned libraries, and test requirements eliminates repetitive prompts and keeps team contributions aligned.",
    filePlacementGuide: [
      {
        path: ".github/copilot-instructions.md",
        scope: "Entire repository (Copilot Chat & Inline Completions)",
        description: "Master instruction file parsed by GitHub Copilot across VS Code, JetBrains, and GitHub PR reviews."
      }
    ],
    syntaxHighlights: [
      {
        title: "Team Engineering Guidelines",
        explanation: "Use clear markdown headings to separate architectural rules, banned APIs, and testing workflows.",
        codeSample: `# GitHub Copilot Repository Instructions
## Tech Stack: Next.js 15, TypeScript 5.x, Tailwind CSS
## Core Rules:
- Always enforce strict type safety without loose 'any'.
- Use Server Actions with Zod safeParse validation.`
      }
    ],
    bestPractices: [
      "Commit `.github/copilot-instructions.md` to your default branch so all team members inherit the same AI rules.",
      "Keep instructions concise and action-oriented; prioritize what NOT to do to prevent anti-patterns.",
      "Update the file whenever dependencies or major architecture conventions change."
    ],
    faqs: [
      {
        question: "Does GitHub Copilot support custom instructions?",
        answer: "Yes! GitHub Copilot natively recognizes `.github/copilot-instructions.md` in repository roots to guide Copilot Chat and inline suggestions."
      },
      {
        question: "Does this work in pull request reviews?",
        answer: "Yes, Copilot for Pull Requests consults your repository instructions when analyzing diffs and suggesting automated reviews."
      }
    ]
  },
  "openai-instructions": {
    slug: "openai-instructions",
    format: "openai_instructions",
    name: "OpenAI Custom Instructions",
    badge: "OpenAI",
    targetFile: "openai-custom-instructions.md",
    targetDir: "prompts/",
    seoTitle: "OpenAI Custom Instructions Generator",
    seoDescription: "Generate tailored system prompts and custom instructions for OpenAI models, ChatGPT Custom GPTs, and OpenAI Playground.",
    heroHeading: "OpenAI Custom Instructions & System Prompts",
    heroSubheading: "Targeted system instructions for ChatGPT, GPT-4o, and o-series reasoning models.",
    overview: "OpenAI system instructions set the foundation for model behavior, response formatting, and technical boundaries. Crafting concise, role-anchored instructions with negative constraints produces higher-fidelity code and prevents verbose boilerplate.",
    filePlacementGuide: [
      {
        path: "prompts/openai-custom-instructions.md",
        scope: "ChatGPT Custom Instructions / Custom GPTs / Playground",
        description: "System instruction blueprint for personal ChatGPT profiles or team Custom GPT knowledge bases."
      }
    ],
    syntaxHighlights: [
      {
        title: "System Persona & Guardrails",
        explanation: "Set the engineer role, technical boundaries, and brevity requirements to avoid chatty responses.",
        codeSample: `You are a Senior TypeScript Architect.
Philosophy: Strict type-safety, zero-any policy.
Provide concise code diffs without boilerplate fluff.`
      }
    ],
    bestPractices: [
      "Place negative constraints ('Never do X') near the top of the system prompt for maximum compliance.",
      "Explicitly instruct the model to provide minimal diffs preserving existing comments.",
      "Save instructions in version control under `prompts/` to keep team prompts aligned."
    ],
    faqs: [
      {
        question: "How do I use this in ChatGPT?",
        answer: "Open ChatGPT Settings > Personalization > Custom Instructions, and paste the generated text into 'How would you like ChatGPT to respond?'."
      },
      {
        question: "Can I use this in the OpenAI API?",
        answer: "Yes, pass the generated content as the `developer` or `system` message in Chat Completion requests."
      }
    ]
  },
  "gemini-prompts": {
    slug: "gemini-prompts",
    format: "gemini_prompts",
    name: "Gemini System Instructions",
    badge: "Gemini",
    targetFile: "gemini-system-instructions.json",
    targetDir: "prompts/",
    seoTitle: "Gemini System Instructions Generator",
    seoDescription: "Generate structured system instructions JSON for Google AI Studio, Gemini 1.5 Pro/Flash, and Gemini 2.0 SDK integrations.",
    heroHeading: "Gemini API System Instructions Generator",
    heroSubheading: "JSON-formatted system instruction blocks ready for Google AI Studio and Gemini Python/TypeScript SDKs.",
    overview: "Google Gemini API supports structured systemInstruction payloads defining developer personas and verification protocols. This generator outputs valid JSON schemas configured with safety settings and temperature parameters.",
    filePlacementGuide: [
      {
        path: "prompts/gemini-system-instructions.json",
        scope: "Google AI Studio / Gemini SDK API Calls",
        description: "Config schema with system_instruction parts, temperature, top_p, and safety parameters."
      }
    ],
    syntaxHighlights: [
      {
        title: "Standardized Gemini JSON Schema",
        explanation: "Configure model behavior and system_instruction parts directly.",
        codeSample: `{
  "system_instruction": {
    "parts": [{ "text": "You are a Senior Systems Engineer..." }]
  }
}`
      }
    ],
    bestPractices: [
      "Keep system_instruction parts declarative and concise.",
      "Specify deterministic guidelines to reduce sampling variance.",
      "Store schemas in `prompts/` alongside your application source code."
    ],
    faqs: [
      {
        question: "How do I use this with Gemini SDK?",
        answer: "Import the generated JSON and pass it directly to `systemInstruction` when calling `googleAI.getGenerativeModel()`."
      }
    ]
  },
  "cursorignore": {
    slug: "cursorignore",
    format: "cursorignore",
    name: ".cursorignore Shield",
    badge: ".cursorignore",
    targetFile: ".cursorignore",
    targetDir: "./ (Repository Root)",
    seoTitle: ".cursorignore Generator & Shield",
    seoDescription: "Generate production-grade .cursorignore files. Prevent Cursor from indexing secrets, build caches, and bulky lockfiles to optimize AI context window tokens.",
    heroHeading: ".cursorignore Context Shield Generator",
    heroSubheading: "Mask credentials, filter build artifacts, and save 50,000+ context tokens per prompt in Cursor IDE.",
    overview: ".cursorignore functions like a .gitignore exclusively for Cursor's AI indexing engine. By excluding build outputs (.next, dist, target), lockfiles (package-lock.json), test fixtures, and secret files (.env, *.pem), you prevent sensitive credentials from leaking into prompts while dramatically reducing context window bloat and improving model reasoning speed.",
    filePlacementGuide: [
      {
        path: "./.cursorignore",
        scope: "Repository Root",
        description: "Excludes paths from codebase indexing, codebase chat search, and background agent context scanning."
      }
    ],
    syntaxHighlights: [
      {
        title: "Credential & Secret Masking",
        explanation: "Keep private keys and API tokens out of LLM prompts.",
        codeSample: `# Secrets & Credentials
.env*
!.env.example
*.pem
*.key
service-account*.json`
      },
      {
        title: "Lockfile & Build Cache Suppression",
        explanation: "Lockfiles alone can consume 40,000+ context tokens, degrading reasoning.",
        codeSample: `# Dependency Bloat
node_modules/
package-lock.json
pnpm-lock.yaml
yarn.lock`
      }
    ],
    bestPractices: [
      "Always place .cursorignore in your repository root next to .gitignore.",
      "Mask all .env files and service account JSON credentials to eliminate data leakage.",
      "Exclude massive lockfiles (package-lock.json, Cargo.lock) to keep context tokens reserved for code.",
      "Ignore coverage reports, build artifacts, and source maps."
    ],
    faqs: [
      {
        question: "Does .cursorignore replace .gitignore?",
        answer: "No. .gitignore controls what git tracks in version control, while .cursorignore specifically controls what Cursor's AI indexes and reads for context."
      },
      {
        question: "Why should I ignore lockfiles in .cursorignore?",
        answer: "Lockfiles often contain tens of thousands of lines of package hashes. If indexed by the AI, they exhaust context window limits and cause the model to hallucinate or miss relevant application code."
      }
    ]
  },
  "claudeignore": {
    slug: "claudeignore",
    format: "claudeignore",
    name: ".claudeignore Shield",
    badge: ".claudeignore",
    targetFile: ".claudeignore",
    targetDir: "./ (Repository Root)",
    seoTitle: ".claudeignore Generator & Shield",
    seoDescription: "Generate tailored .claudeignore files for Claude Code CLI. Prevent terminal AI agents from reading private credentials, build artifacts, and vendor files.",
    heroHeading: ".claudeignore Privacy & Boundary Generator",
    heroSubheading: "Establish strict inspection and modification boundaries for Anthropic's Claude Code terminal agent.",
    overview: "Claude Code automatically respects .claudeignore at your project root. When running autonomous workflows or codebase refactors, .claudeignore ensures Claude Code never inspects, greps, or modifies restricted directories, local secrets, or compiled artifacts.",
    filePlacementGuide: [
      {
        path: "./.claudeignore",
        scope: "Repository Root",
        description: "Specifies directory and file patterns that Claude Code CLI will never read, search, or edit."
      }
    ],
    syntaxHighlights: [
      {
        title: "Terminal Agent Boundary Control",
        explanation: "Restricts Claude Code from touching sensitive configuration or temporary data.",
        codeSample: `# Claude Code CLI Boundaries
.env*
secrets/
coverage/
*.log`
      }
    ],
    bestPractices: [
      "Add .claudeignore to project root before launching Claude Code terminal sessions.",
      "Ignore large generated databases (sqlite.db) and test fixtures to keep agent searches fast.",
      "Combine with CLAUDE.md for comprehensive guidance and boundary enforcement."
    ],
    faqs: [
      {
        question: "How does Claude Code detect .claudeignore?",
        answer: "Claude Code automatically searches for .claudeignore in the current working directory upon initialization."
      }
    ]
  },
  "llms-txt": {
    slug: "llms-txt",
    format: "llms_txt",
    name: "llms.txt Codebase Roadmap",
    badge: "llms.txt",
    targetFile: "llms.txt",
    targetDir: "./ (Repository Root / Domain Root)",
    seoTitle: "llms.txt Codebase Roadmap Generator",
    seoDescription: "Generate standardized llms.txt and llms-full.txt files. Provide clean, concise markdown roadmaps optimized for LLM ingestion and autonomous agents.",
    heroHeading: "llms.txt Codebase Roadmap Generator",
    heroSubheading: "Provide AI coding assistants with a clean, concise, machine-readable index of your architecture, rules, and APIs.",
    overview: "The llms.txt specification is an open standard designed to make websites and repositories easily ingestible by Large Language Models. Placing an llms.txt file in your repository or web root provides a curated index of documentation, architectural patterns, and core constraints formatted in concise Markdown without unnecessary HTML or UI fluff.",
    filePlacementGuide: [
      {
        path: "./llms.txt",
        scope: "Repository Root or Domain Root (https://example.com/llms.txt)",
        description: "Primary orientation index read by agents, search engines, and web-crawling LLMs."
      }
    ],
    syntaxHighlights: [
      {
        title: "Standardized llms.txt Markdown Format",
        explanation: "H1 Title, blockquote summary, and structured sections with bullet points.",
        codeSample: `# Project Name

> Brief machine-readable orientation for LLMs.

## Core Invariants
- Enforce strict typing with zero runtime any.
- All mutations flow through Server Actions.`
      }
    ],
    bestPractices: [
      "Keep llms.txt brief and high-density (under 200 lines) so it consumes minimal prompt tokens.",
      "Link to deeper specification files like ARCHITECTURE.md or AGENTS.md for complex submodules.",
      "Update llms.txt whenever major framework versions or API contracts change."
    ],
    faqs: [
      {
        question: "What is llms.txt?",
        answer: "llms.txt is a standardized proposal created to provide LLMs with concise, markdown-formatted information about a project or website, eliminating HTML scraping overhead."
      },
      {
        question: "Can I serve llms.txt on my website?",
        answer: "Yes! Serving https://yourdomain.com/llms.txt allows AI assistants (like Perplexity, Cursor, or ChatGPT) to quickly understand your developer documentation."
      }
    ]
  },
  "architecture-md": {
    slug: "architecture-md",
    format: "architecture_md",
    name: "ARCHITECTURE.md Specification",
    badge: "ARCHITECTURE.md",
    targetFile: "ARCHITECTURE.md",
    targetDir: "./ (Repository Root)",
    seoTitle: "ARCHITECTURE.md Generator for Agents",
    seoDescription: "Generate production-grade ARCHITECTURE.md documents. Define data flows, state invariants, and negative architectural guardrails for AI coding assistants.",
    heroHeading: "ARCHITECTURE.md System Spec Generator",
    heroSubheading: "Teach AI agents your system architecture, unidirectional data flows, and non-negotiable boundaries.",
    overview: "AI coding agents frequently propose solutions that work in isolation but violate broader architectural patterns. ARCHITECTURE.md establishes high-level invariants: state management boundaries, data mutation rules, service contracts, and forbidden anti-patterns that every AI agent must obey before proposing code changes.",
    filePlacementGuide: [
      {
        path: "./ARCHITECTURE.md",
        scope: "Repository Root",
        description: "Authoritative architectural blueprint read by AI pair programmers and human engineers alike."
      }
    ],
    syntaxHighlights: [
      {
        title: "State Flow & Boundary Directives",
        explanation: "Defines unidirectional data flows and schema validation gates.",
        codeSample: `## Data Flow & State Management
1. Unidirectional flow: state flows top-down.
2. Boundary validation: all inputs validated with Zod.
3. Surgical edits: preserve surrounding code.`
      }
    ],
    bestPractices: [
      "Document architectural invariants rather than fleeting implementation details.",
      "Explicitly list anti-patterns that AI models commonly attempt to introduce.",
      "Keep the document updated during major architectural refactors."
    ],
    faqs: [
      {
        question: "How is ARCHITECTURE.md different from CLAUDE.md or .cursorrules?",
        answer: "CLAUDE.md and .cursorrules contain editor-specific triggers and commands. ARCHITECTURE.md provides deep architectural principles, data flows, and invariant contracts that apply across all tools."
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
