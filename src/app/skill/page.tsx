import { Metadata } from "next";
import { SkillsLibraryClient } from "../ai-skill-studio/skills/SkillsLibraryClient";

export const metadata: Metadata = {
  title: "AI Skill Library & Hub (136+ Rules & Prompts) | DevScratchpad",
  description: "Browse, audit, copy, and download 136+ curated production-grade rules and skills across Cursor (.mdc), Claude Code (SKILL.md), Gemini Prompts, Windsurf, Copilot, ChatGPT, and MCP Servers. 100% client-side privacy.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/skill",
  },
  icons: {
    icon: "/ai-skill-icon.png",
  },
  openGraph: {
    title: "AI Skill Library & Hub — 136+ Production Rules | DevScratchpad",
    description: "Browse, audit, copy, and download 136+ curated production-grade rules across Cursor, Claude, Gemini, Windsurf, Copilot, ChatGPT, and MCP. 100% offline privacy.",
    url: "https://www.devscratchpad.tech/skill",
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        secureUrl: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
        width: 1200,
        height: 630,
        alt: "AI Skill Library & Hub — DevScratchpad",
        type: "image/png",
      },
    ],
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.devscratchpad.tech/skill#catalog",
  name: "AI Skill Library & Hub",
  description: "A directory of 136+ top-rated AI agent skills, prompts, and rules for Cursor, Claude Code, Gemini, Windsurf, Copilot, ChatGPT, and MCP.",
  url: "https://www.devscratchpad.tech/skill",
};

export default function SkillRootPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />
      <SkillsLibraryClient />
    </>
  );
}
