import { Metadata } from "next";
import { SkillsLibraryClient } from "./SkillsLibraryClient";

export const metadata: Metadata = {
  title: "AI Skill Library & Hub | DevScratchpad",
  description: "Discover, audit, test, and upload battle-tested AI agent skills across 17 formats for Claude, Cursor, Copilot, Windsurf, and Gemini.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/ai-skill-studio/skills",
  },
  icons: {
    icon: "/ai-skill-icon.png",
  },
  openGraph: {
    title: "AI Skill Library & Hub — 300+ AI Agent Rules | DevScratchpad",
    description: "Discover, audit, test, and upload battle-tested AI agent skills across 17 formats for Claude, Cursor, Copilot, Windsurf, and Gemini. 100% offline privacy.",
    url: "https://www.devscratchpad.tech/ai-skill-studio/skills",
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/og-ai-skill-studio.png", // Will be updated to a dedicated library OG
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
  "@id": "https://www.devscratchpad.tech/ai-skill-studio/skills#catalog",
  name: "AI Skill Library & Hub",
  description: "A directory of hundreds of top-rated AI agent skills, prompts, and rules for Cursor, Claude Code, and Copilot.",
  url: "https://www.devscratchpad.tech/ai-skill-studio/skills",
};

export default function AiSkillLibraryPage() {
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
