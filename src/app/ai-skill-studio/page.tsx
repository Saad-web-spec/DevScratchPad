import { Metadata } from "next";
import { ClaudeSkillsClient } from "../claude-skills/ClaudeSkillsClient";

import { AiSkillStudioSeoContent } from "./AiSkillStudioSeoContent";

export const metadata: Metadata = {
  title: "Free SKILL.md & Cursor Rules Generator",
  description:
    "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc rules with 100% client-side privacy. Zero API keys required.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/ai-skill-studio",
  },
  keywords: [
    "AI Skill Studio",
    "SKILL.md generator",
    "Claude Code skills",
    "Cursor rules generator",
    "Cursor skills",
    ".cursorrules generator",
    "CLAUDE.md generator",
    "AGENTS.md builder",
    "AI prompt architect",
    "cursor mdc rules",
    "claude code skill template",
    "claude code agent skills",
    "cursor project rules",
    "offline cursor rules generator",
  ],
  openGraph: {
    title: "AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator",
    description:
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc rules with 100% client-side privacy. Zero API keys required.",
    url: "https://www.devscratchpad.tech/ai-skill-studio",
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        secureUrl: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        width: 1200,
        height: 630,
        alt: "AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator",
    description:
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc rules with 100% client-side privacy. Zero API keys required.",
    images: ["https://www.devscratchpad.tech/og-ai-skill-studio.png"],
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#webapp",
      name: "AI Skill Studio",
      description:
        "Generate production-grade AI agent configuration files for Claude Code (SKILL.md), Cursor IDE (.cursor/rules/*.mdc), Anthropic CLAUDE.md, and AGENTS.md multi-agent systems.",
      url: "https://www.devscratchpad.tech/ai-skill-studio",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Claude Code SKILL.md generator with YAML frontmatter",
        "Cursor IDE .cursor/rules/*.mdc modular rulebook builder",
        "Anthropic project root CLAUDE.md generator",
        "Multi-agent protocol AGENTS.md generator",
        "100% client-side privacy with zero server uploads",
        "Package manifest ingestion for package.json, Cargo.toml, pyproject.toml, and go.mod",
        "Unified AI suite ZIP archive exporter",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the difference between Cursor .mdc rules and legacy .cursorrules?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The legacy .cursorrules file is a single monolithic file loaded on every AI interaction, rapidly consuming context window tokens. Modern Cursor Project Rules (.cursor/rules/*.mdc) allow modular rulebooks with file glob patterns and alwaysApply: false, so rules attach only when relevant code is being modified.",
          },
        },
        {
          "@type": "Question",
          name: "How does Claude Code detect and run custom skills from SKILL.md?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Claude Code searches .claude/skills/<skill-name>/SKILL.md in your project directory (or globally in ~/.claude/skills/). It indexes the YAML frontmatter (name and description). When your request aligns with the skill description or when you trigger its slash command, Claude automatically loads the full markdown instructions.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use the generated rules in Windsurf, GitHub Copilot, or Aider?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The generated CLAUDE.md and AGENTS.md files use standard Markdown and XML structures compatible with Windsurf Cascade, GitHub Copilot workspace instructions, and Aider system prompts.",
          },
        },
        {
          "@type": "Question",
          name: "Does AI Skill Studio send my manifest files or code to any server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All manifest parsing (package.json, Cargo.toml, etc.), rule generation, Monaco editing, and ZIP archive creation are executed 100% client-side via JavaScript in your browser memory. No backend network requests are made.",
          },
        },
        {
          "@type": "Question",
          name: "Where should I put the generated files in my repository?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Exporting the AI Kit ZIP will automatically arrange the files in the correct directory structure: Cursor rules go to .cursor/rules/<name>.mdc, Claude skills go to .claude/skills/<name>/SKILL.md, Anthropic guidelines go to CLAUDE.md at repo root, and multi-agent rules go to AGENTS.md at repo root.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#howto",
      name: "How to Generate Production-Ready Claude Code Skills & Cursor Rules",
      description:
        "Step-by-step guide to generating, customizing, and exporting production-grade agent steering files.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Select Preset or Import Manifest",
          text: "Select a pre-built architecture preset (such as Next.js 15, FastAPI, Cursor .mdc Pro, or Codebase Auditor) or drop your project's package.json or Cargo.toml to auto-detect dependencies and language idiom.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Configure Guardrails and Code References",
          text: "Customize agent behaviors, architectural conventions, execution procedures, and before/after code snippets directly in the studio.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Export AI Suite ZIP or Copy Markdown",
          text: "Copy the formatted rule directly into your clipboard, or click 'Export AI Kit (.zip)' to download a complete pre-structured directory containing .cursor/rules/, .claude/skills/, CLAUDE.md, and AGENTS.md.",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.devscratchpad.tech",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "AI Skill Studio",
          item: "https://www.devscratchpad.tech/ai-skill-studio",
        },
      ],
    },
  ],
};

export default function AISkillStudioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <ClaudeSkillsClient />
      <AiSkillStudioSeoContent />
    </>
  );
}
