/**
 * Single source of truth for the AI Skill Studio FAQ.
 *
 * Rendered visibly by AiSkillStudioSeoContent and serialized into the FAQPage
 * JSON-LD in ai-skill-studio/page.tsx. Google requires structured FAQ text to
 * match the visible text, so both read from this list.
 *
 * Backticks mark inline code. The visible renderer turns them into <code>
 * elements, and toPlainText() strips them for JSON-LD, so the text content of
 * both stays identical.
 */
export interface StudioFaq {
  question: string;
  answer: string;
}

export const STUDIO_FAQS: StudioFaq[] = [
  {
    question: "CLAUDE.md vs AGENTS.md: which do I need?",
    answer:
      "Claude Code reads `CLAUDE.md`. `AGENTS.md` is the shared file that OpenAI Codex, Cursor, GitHub Copilot's coding agent and a growing list of other agents read. If your team uses more than one tool, put the rules in `AGENTS.md` and add the line `@AGENTS.md` to `CLAUDE.md` so Claude Code imports the same file.",
  },
  {
    question: "Why is Cursor ignoring my rules?",
    answer:
      "Usually it's the frontmatter. A rule with `alwaysApply: false` and no `globs` only loads when the agent decides its `description` is relevant, or when you @-mention it. Check that the file is in `.cursor/rules/`, that `globs` match the files you are editing, and that the description says when the rule applies. Rules don't affect Tab autocomplete at all.",
  },
  {
    question: "How long should CLAUDE.md be?",
    answer:
      "Aim for under 200 lines. Claude Code loads the whole file into every session, so each line costs context and competes with the others for attention. Keep build and test commands, the folder layout and hard \"never\" rules in it. Move long procedures into skills or separate docs that the file points to.",
  },
  {
    question: "Where do Claude Code skills go?",
    answer:
      "Each skill is a folder with a `SKILL.md` inside: `.claude/skills/<skill-name>/SKILL.md` for one project, or `~/.claude/skills/<skill-name>/SKILL.md` for all of your projects. Claude Code keeps only each skill's name and description in context, and loads the full file when a task matches it or when you type `/skill-name`.",
  },
  {
    question: "How do I stop AI tools from reading my .env files?",
    answer:
      "For Cursor, list secrets such as `.env*`, `*.pem` and `*.key` in `.cursorignore` at the repo root. For Claude Code, add deny rules like `Read(./.env)` and `Read(./.env.*)` under `permissions.deny` in `.claude/settings.json`, which is the setting Claude Code documents for blocking file reads. Neither replaces keeping secrets out of the repo.",
  },
  {
    question: "Do AI tools read PRD.md, TASK.md or ARCHITECTURE.md automatically?",
    answer:
      "No. Agents load their own rules file (`CLAUDE.md`, `AGENTS.md` or Cursor rules) and nothing else on their own. Name the other docs in that file, for example \"Read PRD.md and TASK.md before you start\", and the agent opens them when it needs them. In `CLAUDE.md` you can also write `@PRD.md`, but that loads the file into every session.",
  },
  {
    question: "Does AI Skill Studio upload my code?",
    answer:
      "No. Presets, manifest parsing, editing and ZIP export all run in your browser, and nothing you type or import is sent to DevScratchpad. The optional GitHub import is the only network call, and your browser sends it straight to GitHub's API.",
  },
];

/** Strips the backtick code markers so JSON-LD text matches the rendered text content. */
export function toPlainText(text: string): string {
  return text.replace(/`/g, "");
}
