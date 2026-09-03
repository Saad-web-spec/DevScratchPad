import { Metadata } from "next";
import { ClaudeSkillsClient } from "./claude-skills/ClaudeSkillsClient";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";

export const metadata: Metadata = {
  title: "AI Skill Studio — DevScratchpad",
  description:
    "AI Skill Studio: Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md project guidelines, Cursor .mdc rules, and AI agent instructions with deep nuances and client-side privacy.",
  alternates: {
    canonical: "https://www.devscratchpad.tech",
  },
  openGraph: {
    title: "AI Skill Studio — DevScratchpad",
    description:
      "AI Skill Studio: Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md project guidelines, and Cursor rules with deep nuances, flexible conventions, and client-side privacy.",
    url: "https://www.devscratchpad.tech",
    type: "website",
  },
  twitter: {
    title: "AI Skill Studio — DevScratchpad",
    description:
      "AI Skill Studio: Generate production-grade Claude Code skills (SKILL.md), CLAUDE.md project guidelines, and Cursor rules with deep nuances.",
  },
};

export default function HomePage() {
  return (
    <>
      <ClaudeSkillsClient />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-zinc-200">
        <HomeSeoContent />
      </div>
    </>
  );
}
