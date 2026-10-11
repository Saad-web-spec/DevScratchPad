import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";

export const metadata: Metadata = {
  title: {
    absolute: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
  },
  description:
    "28 free offline developer tools with 100% client-side privacy. Format JSON, convert code, decode JWTs, and generate keys locally with zero server transmission.",
  keywords: [
    "DevScratchpad",
    "Dev Scratchpad",
    "devscratchpad.tech",
    "developer scratchpad",
    "dev scratch pad",
    "offline developer tools",
    "privacy developer tools",
    "client-side developer tools",
    "free developer utilities",
    "AI Skill Studio",
    "Claude Code skills",
    "Cursor rules generator",
    "CLAUDE.md generator",
    "AGENTS.md generator",
    "npx devscratchpad",
  ],
  alternates: {
    canonical: "https://www.devscratchpad.tech",
  },
  openGraph: {
    title: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
    description:
      "28 free developer tools that run in your browser, plus AI Skill Studio for CLAUDE.md, AGENTS.md, Cursor rules and agent skills. Nothing you paste is uploaded.",
    url: "https://www.devscratchpad.tech",
    siteName: "DevScratchpad",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad: free developer tools and AI Skill Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
    description:
      "28 free developer tools that run in your browser, plus AI Skill Studio for CLAUDE.md, AGENTS.md, Cursor rules and agent skills. Nothing you paste is uploaded.",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad: free developer tools and AI Skill Studio",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <WorkspaceShell>
      <HomeSeoContent />
    </WorkspaceShell>
  );
}
