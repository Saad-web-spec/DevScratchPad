import { NextResponse } from "next/server";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { PRESET_ROUTES } from "@/app/claude-skills/lib/presetRegistry";

const SITE_URL = "https://www.devscratchpad.tech";

export async function GET() {
  const tools = Object.values(TOOLS_REGISTRY);

  const toolsSection = tools
    .map(
      (t) =>
        `- [${t.name}](${SITE_URL}/tools/${t.slug}): ${t.description} (Category: ${t.category})`
    )
    .join("\n");

  const presetsSection = PRESET_ROUTES.map(
    (p) =>
      `- [${p.title}](${SITE_URL}/ai-skill-studio/${p.formatSlug}/${p.presetSlug}): ${p.description}`
  ).join("\n");

  const content = `# DevScratchpad
> 100% Offline, Privacy-Backed Developer Tools & AI Skill Studio

DevScratchpad (${SITE_URL}) is an open developer utility suite built for security, speed, and client-side privacy. Every tool operates exclusively within the browser's local memory—zero server transmission, zero remote logging, and zero network latency.

## Architecture & Privacy Guarantees
- Zero Server Data Transmission: All inputs, secret keys, passwords, JWT tokens, and payloads are processed locally via browser APIs (Web Crypto API, WebAssembly, and local DOM parsers).
- Offline-First PWA: Progressive Web App architecture caching assets for full offline functionality.
- Smart Auto-Detection (Magic Paste): Direct clipboard inspection (Ctrl+V / ⌘V) automatically recognizes JWT tokens, cURL commands, SVG markup, JSON, SQL queries, and timestamps to launch the corresponding tool instantly.

## Developer Utilities
${toolsSection}

## AI Skill Studio Presets
${presetsSection}

## Learning Hub & Guides
- [Cron Expression Reference](${SITE_URL}/blog/cron-expression-cheat-sheet): Complete syntax breakdown, 5-field/6-field formats, and scheduling recipes.
- [Learning Hub Directory](${SITE_URL}/blog): Guides and cheat-sheets for developer productivity.

## Extended Context
- Comprehensive AI Documentation: ${SITE_URL}/llms-full.txt
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}
