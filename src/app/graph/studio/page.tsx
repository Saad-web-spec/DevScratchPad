import type { Metadata } from "next";
import { GraphClient } from "../GraphClient";

const PAGE_URL = "https://www.devscratchpad.tech/graph/studio";

export const metadata: Metadata = {
  title: "Skill Graph Studio: Edit, Check and Export Graph Skills",
  description:
    "The Skill Graph editor: draw the steps of a multi-agent skill, check every handoff, walk through the plan and export a Claude Code kit with one subagent per step, or a Cursor rule. Runs in your browser.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Skill Graph Studio | DevScratchpad",
    description: "Draw a multi-agent skill as a graph, check it and export it for Claude Code and Cursor. Runs in your browser.",
    url: PAGE_URL,
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "website",
  },
};

/** The editor. Share links (#g=…) open here; /graph is the landing page and forwards old /graph#… links. */
export default function GraphStudioPage() {
  return <GraphClient />;
}
