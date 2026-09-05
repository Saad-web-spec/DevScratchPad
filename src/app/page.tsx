import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";

export const metadata: Metadata = {
  title: "DevScratchpad — Free Offline Developer Tools & Scratchpad",
  description:
    "DevScratchpad is a free, 100% offline, privacy-first developer utility suite. Client-side JSON formatting, JWT decoding, cURL converters, Base64 inspection, and AI Skill Studio with zero server transmission.",
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
  ],
  alternates: {
    canonical: "https://www.devscratchpad.tech",
  },
  openGraph: {
    title: "DevScratchpad — Free Offline Developer Tools & Scratchpad",
    description:
      "DevScratchpad is a free, 100% offline, privacy-first developer utility suite. Client-side JSON formatting, JWT decoding, cURL converters, Base64 inspection, and AI Skill Studio with zero server transmission.",
    url: "https://www.devscratchpad.tech",
    siteName: "DevScratchpad",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScratchpad — Free Offline Developer Tools & Scratchpad",
    description:
      "DevScratchpad is a free, 100% offline, privacy-first developer utility suite. Zero server transmission.",
  },
};

export default function HomePage() {
  return (
    <WorkspaceShell>
      <HomeSeoContent />
    </WorkspaceShell>
  );
}
