import { Metadata } from "next";
import { ClaudeSkillsClient } from "../claude-skills/ClaudeSkillsClient";

export const metadata: Metadata = {
  title: "AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator",
  description:
    "Free browser-based generator for SKILL.md, CLAUDE.md, Cursor .mdc rules, and AGENTS.md. 100% client-side, zero API key required, offline-capable AI agent configuration architect.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/ai-skill-studio",
  },
  keywords: [
    "AI Skill Studio",
    "SKILL.md generator",
    "Claude Code skills",
    "Cursor rules generator",
    ".cursorrules generator",
    "CLAUDE.md generator",
    "AGENTS.md builder",
    "AI prompt architect",
    "cursor mdc rules",
  ],
  openGraph: {
    title: "AI Skill Studio - Free SKILL.md, CLAUDE.md & Cursor Rules Generator",
    description:
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md project guidelines, and Cursor rules with deep nuances, flexible conventions, and client-side privacy.",
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
      "Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md guidelines, and Cursor .mdc rules with client-side privacy.",
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
