import { NextResponse } from "next/server";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { getAllCategories } from "@/lib/tools/categories";
import { getAllDynamicPresetRoutes, getPresetBySlug, PRESET_ROUTES } from "@/app/claude-skills/lib/presetRegistry";
import { getAllFormatHubs } from "@/app/claude-skills/lib/formatHubs";
import { BLOG_POSTS } from "@/lib/blog/posts";

const SITE_URL = "https://www.devscratchpad.tech";

export async function GET() {
  const tools = Object.values(TOOLS_REGISTRY);

  const toolsSection = tools
    .map(
      (t) =>
        `- [${t.name}](${SITE_URL}/tools/${t.slug}): ${t.description} (Category: ${t.category})`
    )
    .join("\n");

  const categories = getAllCategories();
  const categoryHubsSection = categories
    .map(
      (c) =>
        `- [${c.name}](${SITE_URL}/developer-tools/${c.slug}): ${c.seoDescription} (${c.toolSlugs.length} offline tools)`
    )
    .join("\n");

  const formatHubs = getAllFormatHubs();
  const formatHubsSection = formatHubs
    .map((h) => `- [${h.name}](${SITE_URL}/ai-skill-studio/${h.slug}): ${h.seoDescription}`)
    .join("\n");

  const dynamicSpokes = getAllDynamicPresetRoutes();
  const seenSpokeUrls = new Set<string>();
  const presetsList: string[] = [];

  for (const route of dynamicSpokes) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      const p = getPresetBySlug(route.formatSlug, route.presetSlug);
      if (p) {
        presetsList.push(`- [${p.title}](${url}): ${p.description}`);
      }
    }
  }

  for (const route of PRESET_ROUTES) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      presetsList.push(`- [${route.title}](${url}): ${route.description}`);
    }
  }

  const presetsSection = presetsList.join("\n");

  const engineeringGuidesSection = BLOG_POSTS.map(
    (p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.seoDescription || p.description} (${p.category})`
  ).join("\n");

  const content = `# DevScratchpad
> 100% Offline, Privacy-Backed Developer Tools & AI Skill Studio

DevScratchpad (${SITE_URL}) is an open developer utility suite built for security, speed, and client-side privacy. Every tool operates exclusively within the browser's local memory—zero server transmission, zero remote logging, and zero network latency.

## Primary Platforms & Hubs
- [Developer Tools Directory](${SITE_URL}/developer-tools): Complete directory of 28 offline, client-side developer utilities across 5 categories.
- [AI Skill Studio](${SITE_URL}/ai-skill-studio): Universal AI prompt engineering studio generating Claude Code skills, Cursor rules (.mdc), AGENTS.md specs, and MCP configs.
- [Developer Learning Hub](${SITE_URL}/blog): In-depth technical guides, cheat sheets, and architectural references for modern engineering teams.

## Architecture & Privacy Guarantees
- Zero Server Data Transmission: All inputs, secret keys, passwords, JWT tokens, and payloads are processed locally via browser APIs (Web Crypto API, WebAssembly, and local DOM parsers).
- Offline-First PWA: Progressive Web App architecture caching assets for full offline functionality.
- Smart Auto-Detection (Magic Paste): Direct clipboard inspection (Ctrl+V / ⌘V) automatically recognizes JWT tokens, cURL commands, SVG markup, JSON, SQL queries, and timestamps to launch the corresponding tool instantly.

## Developer Tools Category Hubs
${categoryHubsSection}

## Developer Utilities
${toolsSection}

## AI Skill Studio Format Hubs
${formatHubsSection}

## AI Skill Studio Presets
${presetsSection}

## Engineering Guides & Cheat Sheets
${engineeringGuidesSection}

## Learning Hub & Guides
- [About DevScratchpad](${SITE_URL}/about): Mission, open-source repository, zero-trust client architecture.
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
