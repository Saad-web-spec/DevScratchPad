import { Metadata } from "next";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";

export const metadata: Metadata = {
  title: "Developer Tools Workspace (100% Offline & Private) — DevScratchpad",
  description:
    "100% offline, privacy-first developer tools workspace. JSON formatter, YAML to JSON, cURL converter, JWT decoder, Base64 encoder, SSH key generator, and more with zero server latency.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/workspace",
  },
};

export default function WorkspacePage() {
  return (
    <WorkspaceShell>
      <HomeSeoContent />
    </WorkspaceShell>
  );
}
