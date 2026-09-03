import { Metadata } from "next";
import { ClaudeSkillsClient } from "../claude-skills/ClaudeSkillsClient";

export const metadata: Metadata = {
  title: "AI Skill Studio – Free SKILL.md, CLAUDE.md & Cursor Skills | DevScratchpad",
  description:
    "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc skills with 100% client-side privacy. Zero API keys required.",
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
  ],
  openGraph: {
    title: "AI Skill Studio – Free SKILL.md, CLAUDE.md & Cursor Skills",
    description:
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc skills with 100% client-side privacy. Zero API keys required.",
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
        alt: "AI Skill Studio – Free SKILL.md, CLAUDE.md & Cursor Skills",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Skill Studio – Free SKILL.md, CLAUDE.md & Cursor Skills",
    description:
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc skills with 100% client-side privacy. Zero API keys required.",
    images: ["https://www.devscratchpad.tech/og-ai-skill-studio.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Skill Studio",
  description:
    "Generate production-grade AI agent configuration files for Claude Code (SKILL.md), Cursor IDE (.cursorrules), CLAUDE.md, and AGENTS.md multi-agent systems.",
  url: "https://www.devscratchpad.tech/ai-skill-studio",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function AISkillStudioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClaudeSkillsClient />
    </>
  );
}
