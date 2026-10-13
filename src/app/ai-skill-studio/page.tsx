import { Metadata } from "next";
import { ClaudeSkillsClient } from "../claude-skills/ClaudeSkillsClient";

import { AiSkillStudioSeoContent } from "./AiSkillStudioSeoContent";
import { STUDIO_FAQS, toPlainText } from "./components/studioFaqs";

export const metadata: Metadata = {
  // Absolute title stays under ~60 chars so Google does not truncate it in results
  title: { absolute: "AI Skill Studio: CLAUDE.md & Cursor Rules Generator" },
  description:
    "Generate CLAUDE.md, AGENTS.md, Cursor rules, SKILL.md and Copilot instructions from your stack or your own code. Free, runs in your browser.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/ai-skill-studio",
  },
  keywords: [
    "AI Skill Studio",
    "ai skill studio",
    "Claude skills",
    "claude skill",
    "claude skill generator",
    "Claude Code skills",
    "claude code skill generator",
    "SKILL.md generator",
    "Cursor rules generator",
    "Cursor skills",
    ".cursorrules generator",
    "CLAUDE.md generator",
    "AGENTS.md builder",
    "PRD.md generator",
    "DESIGN.md builder",
    "TASK.md tracker",
    "MEMORY.md agent brain",
    "cursor mdc rules",
    "cursorignore generator",
    "claudeignore generator",
    "llms.txt generator",
    "ARCHITECTURE.md generator",
    "MCP config generator",
    "model context protocol generator",
    "claude code skill template",
    "claude code agent skills",
    "cursor project rules",
  ],
  openGraph: {
    title: "AI Skill Studio: CLAUDE.md & Cursor Rules Generator | DevScratchpad",
    description:
      "Generate CLAUDE.md, AGENTS.md, Cursor rules, SKILL.md and Copilot instructions from your stack or your own code. Free, runs in your browser.",
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
        alt: "AI Skill Studio: CLAUDE.md, Cursor rules and agent skills generator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Skill Studio: CLAUDE.md & Cursor Rules Generator | DevScratchpad",
    description:
      "Generate CLAUDE.md, AGENTS.md, Cursor rules, SKILL.md and Copilot instructions from your stack or your own code. Free, runs in your browser.",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        width: 1200,
        height: 630,
        alt: "AI Skill Studio: CLAUDE.md, Cursor rules and agent skills generator",
      },
    ],
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
        "Generate AI agent configuration files for Claude Code (SKILL.md), Cursor IDE (.cursor/rules/*.mdc), Anthropic CLAUDE.md, AGENTS.md, PRD.md, DESIGN.md, TASK.md, MEMORY.md, .cursorignore, .claudeignore, llms.txt, and ARCHITECTURE.md.",
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
        "Multi-agent governance suite (PRD.md, DESIGN.md, TASK.md, MEMORY.md)",
        ".cursorignore & .claudeignore context shields to mask secrets and eliminate token bloat",
        "llms.txt and ARCHITECTURE.md machine documentation blueprints",
        "Runs in your browser; nothing you type or import is uploaded",
        "Reads a GitHub repository or local folder (manifest, source files, existing AI rules) and writes rules from the conventions the code follows",
        "Task skills for code review, debugging, commits and PRs, refactoring and upgrades, exported as skill folders with reference files and a verify script",
        "Companion files: .claude/settings.json, Claude Code subagents, Copilot and Kiro scoped rules, and a CI audit workflow",
        "ZIP export with every file in its folder, plus a terminal CLI",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@devscratchpad.tech",
        contactType: "customer support",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#faq",
      // Same list the visible FAQ renders, so the structured text always matches the page
      mainEntity: STUDIO_FAQS.map((faq) => ({
        "@type": "Question",
        name: toPlainText(faq.question),
        acceptedAnswer: {
          "@type": "Answer",
          text: toPlainText(faq.answer),
        },
      })),
    },
    {
      "@type": "HowTo",
      "@id": "https://www.devscratchpad.tech/ai-skill-studio#howto",
      name: "How to create a CLAUDE.md, AGENTS.md or Cursor rules file",
      description:
        "Pick a file format and a preset for your stack, edit the rules, then copy, download or export the files.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Pick a format and a preset",
          text: "Choose the file you need under Target Standard & File Format, then pick one of the Presets for your stack. Or click Read your code to pull your conventions from a GitHub repository or local folder.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Edit the rules",
          text: "Change the commands, conventions and \"never\" rules in the form. The editor updates as you type, and you can also edit the file there directly.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Copy, download or export",
          text: "Use Copy or Download for the current file, or Export ZIP to get every file in its folder, ready to unzip into your repo.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />
      <ClaudeSkillsClient
        heading={{
          title: "AI Skill Studio: CLAUDE.md, Cursor rules and agent skills generator",
          description:
            "Pick the file your AI coding tool reads, start from a preset or your own code, and download it ready to drop into your repo. Runs in your browser; nothing is uploaded.",
        }}
      />
      <AiSkillStudioSeoContent />
    </>
  );
}
