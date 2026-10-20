import type { Metadata } from "next";
import { DownloadClient } from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download a Skill Graph Kit",
  description: "Download the Claude Code and Cursor kit for a graph skill. The kit is built in your browser from the link; nothing is uploaded.",
  alternates: { canonical: "https://www.devscratchpad.tech/graph/download" },
  // Every visit carries a different graph in its link; there is nothing here for a search engine.
  robots: { index: false, follow: true },
};

/** /graph/download#g=… — the kit for the graph in the link, as one .zip. The connector's compile_graph links here. */
export default function GraphDownloadPage() {
  return <DownloadClient />;
}
