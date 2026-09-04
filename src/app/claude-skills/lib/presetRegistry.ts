import { Metadata } from "next";

export type OutputFormat = "skill_md" | "claude_md" | "cursor_mdc" | "agents_md" | "mcp_json";

export interface ProgrammaticPresetRoute {
  formatSlug: string;
  presetSlug: string;
  format: OutputFormat;
  presetId: string;
  title: string;
  description: string;
}

export const PRESET_ROUTES: ProgrammaticPresetRoute[] = [
  { formatSlug: "cursor-rules", presetSlug: "nextjs-15", format: "cursor_mdc", presetId: "nextjs-pro", title: "Next.js 15 Cursor Rules Generator (.mdc) | Free & Offline", description: "Generate strict Next.js 15 App Router Cursor rules with React Server Components, Server Actions, and Zod validation." },
  { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", format: "cursor_mdc", presetId: "cursor-mdc-pro", title: "Cursor Rules Pro (.mdc) Generator | Free & Offline", description: "Generate modular, strict Cursor rules enforcing minimal diffs, zero-any typing, and pragmatic architecture." },
  { formatSlug: "cursor-rules", presetSlug: "react-19", format: "cursor_mdc", presetId: "react-spa", title: "React 19 Cursor Rules Generator (.mdc) | Free & Offline", description: "Generate modern React 19 SPA Cursor rules enforcing custom hooks, TanStack query caching, and avoiding redundant useEffects." },
  { formatSlug: "cursor-rules", presetSlug: "fastapi", format: "cursor_mdc", presetId: "fastapi-ai", title: "Python FastAPI Cursor Rules (.mdc) | Free & Offline", description: "Generate strict Python FastAPI Cursor rules with Pydantic v2 schemas and AI agent integrations." },
  { formatSlug: "cursor-rules", presetSlug: "vibe-coder", format: "cursor_mdc", presetId: "vibe-coder", title: "Vibe Coder Cursor Rules (.mdc) | Free & Offline", description: "Generate high-velocity, pragmatic vibe coding Cursor rules prioritizing fast feedback loops and flat structures." },
  { formatSlug: "cursor-rules", presetSlug: "security-guard", format: "cursor_mdc", presetId: "security-guard", title: "Security Guard Cursor Rules (.mdc) | Free & Offline", description: "Generate strict security Cursor rules focused on mitigating SQL injection, XSS, and insecure endpoints." },
  { formatSlug: "claude-skills", presetSlug: "codebase-auditor", format: "skill_md", presetId: "claude-auditor", title: "Codebase Auditor Claude Skill (.md) | Free & Offline", description: "Generate a Claude Code codebase auditing skill to identify structural health, security flaws, and performance anti-patterns." },
  { formatSlug: "claude-skills", presetSlug: "nextjs-15", format: "skill_md", presetId: "nextjs-pro", title: "Next.js 15 Claude Skill (.md) | Free & Offline", description: "Generate a Next.js 15 Claude Code skill to enforce RSCs, Server Actions, and Tailwind CSS v4." },
  { formatSlug: "claude-skills", presetSlug: "security-guard", format: "skill_md", presetId: "security-guard", title: "Security Guard Claude Skill (.md) | Free & Offline", description: "Generate a security auditing Claude Code skill focused on identifying vulnerabilities and API key leaks." },
  { formatSlug: "claude-skills", presetSlug: "fastapi", format: "skill_md", presetId: "fastapi-ai", title: "Python FastAPI Claude Skill (.md) | Free & Offline", description: "Generate a strict Python FastAPI Claude Code skill prioritizing asynchronous routing and Pydantic validation." },
  { formatSlug: "claude-md", presetSlug: "nextjs-15", format: "claude_md", presetId: "nextjs-pro", title: "Next.js 15 CLAUDE.md Generator | Free & Offline", description: "Generate a Next.js 15 CLAUDE.md repository instruction file with App Router conventions." },
  { formatSlug: "claude-md", presetSlug: "fastapi", format: "claude_md", presetId: "fastapi-ai", title: "FastAPI CLAUDE.md Generator | Free & Offline", description: "Generate a Python FastAPI CLAUDE.md repository instruction file with async backend conventions." },
  { formatSlug: "agents-md", presetSlug: "nextjs-15", format: "agents_md", presetId: "nextjs-pro", title: "Next.js 15 AGENTS.md Generator | Free & Offline", description: "Generate a Next.js 15 AGENTS.md specification file for autonomous AI coding agents." },
  { formatSlug: "mcp-config", presetSlug: "github", format: "mcp_json", presetId: "github", title: "GitHub MCP Server Config Generator | Free & Offline", description: "Generate a GitHub Model Context Protocol (MCP) server configuration block." },
  { formatSlug: "mcp-config", presetSlug: "postgres", format: "mcp_json", presetId: "postgres", title: "PostgreSQL MCP Server Config Generator | Free & Offline", description: "Generate a PostgreSQL Model Context Protocol (MCP) server configuration block." },
  { formatSlug: "mcp-config", presetSlug: "filesystem", format: "mcp_json", presetId: "filesystem", title: "Filesystem MCP Server Config Generator | Free & Offline", description: "Generate a local Filesystem Model Context Protocol (MCP) server configuration block." }
];

export function getPresetRouteMetadata(formatSlug: string, presetSlug: string): Metadata | null {
  const route = PRESET_ROUTES.find(r => r.formatSlug === formatSlug && r.presetSlug === presetSlug);
  if (!route) return null;
  
  return {
    title: route.title,
    description: route.description,
    openGraph: {
      title: route.title,
      description: route.description,
      type: "website",
    },
    alternates: {
      canonical: `/ai-skill-studio/${formatSlug}/${presetSlug}`,
    },
  };
}
