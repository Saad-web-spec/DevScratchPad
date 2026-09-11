import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";

export const metadata: Metadata = {
  title: {
    absolute: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
  },
  description:
    "DevScratchpad is a free, 100% offline, privacy-first developer utility suite. 28 tools across 5 categories, AI Skill Studio supporting 13 formats & 5-layer agent suite, and CLI with zero server transmission.",
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
    "5-layer AI Agent suite",
    "13 AI formats",
    "npx devscratchpad",
  ],
  alternates: {
    canonical: "https://www.devscratchpad.tech",
  },
  openGraph: {
    title: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
    description:
      "DevScratchpad is a free, 100% offline developer suite: 28 tools across 5 categories, AI Skill Studio supporting 13 formats & 5-layer agent suite, and CLI with zero server transmission.",
    url: "https://www.devscratchpad.tech",
    siteName: "DevScratchpad",
    type: "website",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio (13 Formats, 5-Layer Agent Suite, 28 Tools)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio",
    description:
      "DevScratchpad is a free, 100% offline developer suite: 28 tools across 5 categories, 13-format AI Skill Studio, 5-layer agent suite, and CLI. Zero server transmission.",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DevScratchpad — Free Offline Developer Tools & AI Skill Studio (13 Formats, 5-Layer Agent Suite, 28 Tools)",
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
