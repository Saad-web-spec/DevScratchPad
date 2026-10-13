/**
 * Per-format facts for preset spoke pages. Plain module (no "use client") so
 * the server page can use `activation` in its HowTo JSON-LD and the client
 * spoke content can show the same text.
 */
export interface SpokeFormatMeta {
  pill: string;
  scope: string;
  formatType: string;
  /** Tools that read the file. */
  aiSupport: string;
  /** How the file gets loaded once it is in place. True for every format; no "automatic" claims for files nothing loads. */
  activation: string;
}

const FORMAT_META: Record<string, SpokeFormatMeta> = {
  "cursor-rules": {
    pill: "CURSOR RULES",
    scope: "Glob pattern match",
    formatType: "Frontmatter MDC (.mdc)",
    aiSupport: "Cursor",
    activation:
      "Cursor picks up rules in .cursor/rules/ automatically. This one attaches when files matching its globs are in the request, or when you @-mention it.",
  },
  "claude-skills": {
    pill: "CLAUDE SKILL",
    scope: "Description match or /skill-name",
    formatType: "Folder skill (SKILL.md)",
    aiSupport: "Claude Code",
    activation:
      "Claude Code lists the skill at startup and loads it when a request matches its description. You can also run it with /<skill-name>.",
  },
  "claude-md": {
    pill: "CLAUDE.MD",
    scope: "Every session",
    formatType: "Project memory (.md)",
    aiSupport: "Claude Code",
    activation: "Claude Code reads CLAUDE.md at the start of every session. Run /memory to see which files it loaded.",
  },
  "agents-md": {
    pill: "AGENTS.MD",
    scope: "Repo root, nearest file wins",
    formatType: "Plain Markdown (.md)",
    aiSupport: "Codex, Cursor, Copilot coding agent",
    activation:
      "Codex, Cursor, GitHub Copilot's coding agent and other agents read AGENTS.md when they start a task. For Claude Code, add @AGENTS.md to CLAUDE.md.",
  },
  "mcp-config": {
    pill: "MCP CONFIG",
    scope: "Local stdio or remote server",
    formatType: "JSON (.mcp.json)",
    aiSupport: "Claude Code, Claude Desktop, Cursor",
    activation:
      "Restart the client so it starts the server. Claude Code asks you to approve servers from .mcp.json; run /mcp to check their status.",
  },
  "windsurf-rules": {
    pill: "WINDSURF RULES",
    scope: "Per-rule trigger",
    formatType: "Markdown with frontmatter (.md)",
    aiSupport: "Windsurf Cascade",
    activation: "Cascade reads rules in .windsurf/rules/ and applies this one according to its trigger.",
  },
  "copilot-instructions": {
    pill: "COPILOT",
    scope: "Whole repository",
    formatType: "Markdown (.md)",
    aiSupport: "Copilot Chat, code review, coding agent",
    activation:
      "Copilot Chat, Copilot code review and the coding agent add the file to requests in this repository. It does not change completions as you type.",
  },
  "openai-instructions": {
    pill: "OPENAI",
    scope: "Pasted or sent per request",
    formatType: "Markdown (.md)",
    aiSupport: "ChatGPT and the OpenAI API",
    activation:
      "Nothing loads this file automatically. Paste it into ChatGPT custom instructions, a Project or a custom GPT, or send it as instructions in the API.",
  },
  "gemini-prompts": {
    pill: "GEMINI",
    scope: "Sent per request",
    formatType: "JSON system instruction",
    aiSupport: "Gemini API and Google AI Studio",
    activation:
      "Nothing loads this file automatically. Pass it as the system instruction in your Gemini API call, or paste it into Google AI Studio.",
  },
  cursorignore: {
    pill: ".CURSORIGNORE",
    scope: "Indexing and AI features",
    formatType: "gitignore syntax",
    aiSupport: "Cursor",
    activation:
      "Cursor applies .cursorignore automatically. Matching files leave the index and AI features, but commands the agent runs in the terminal can still read them.",
  },
  claudeignore: {
    pill: ".CLAUDEIGNORE",
    scope: "Pattern list",
    formatType: "gitignore syntax",
    aiSupport: "Claude Code (via permissions.deny)",
    activation:
      "Claude Code does not enforce .claudeignore by itself. Copy the sensitive paths into permissions.deny in .claude/settings.json, which it does enforce.",
  },
  "llms-txt": {
    pill: "LLMS.TXT",
    scope: "Fetched on request",
    formatType: "Markdown index (.txt)",
    aiSupport: "Any LLM tool that fetches it",
    activation:
      "Nothing loads llms.txt automatically. Serve it at your site root, or point agents to it from CLAUDE.md or AGENTS.md.",
  },
  "architecture-md": {
    pill: "ARCHITECTURE.MD",
    scope: "Read when referenced",
    formatType: "Markdown (.md)",
    aiSupport: "Any coding agent",
    activation:
      "Agents read it when your CLAUDE.md or AGENTS.md points to it. Add a line such as \"Read ARCHITECTURE.md before structural changes\".",
  },
};

const FALLBACK_META: SpokeFormatMeta = {
  pill: "AI RULEBOOK",
  scope: "Project context",
  formatType: "Markdown / config",
  aiSupport: "AI coding assistants",
  activation: "Point your agent to the file from its rules file (CLAUDE.md, AGENTS.md or .cursor/rules/) so it reads it.",
};

export function getSpokeFormatMeta(formatSlug: string): SpokeFormatMeta {
  return FORMAT_META[formatSlug] ?? FALLBACK_META;
}
