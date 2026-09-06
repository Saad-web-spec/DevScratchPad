import { NextResponse } from "next/server";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { getAllCategories } from "@/lib/tools/categories";
import { getAllDynamicPresetRoutes, getPresetBySlug, PRESET_ROUTES } from "@/app/claude-skills/lib/presetRegistry";
import { getAllFormatHubs } from "@/app/claude-skills/lib/formatHubs";
import { BLOG_POSTS } from "@/lib/blog/posts";

const SITE_URL = "https://www.devscratchpad.tech";

export async function GET() {
  const tools = Object.values(TOOLS_REGISTRY);

  const categoriesDetailed = getAllCategories()
    .map((c) => {
      const toolList = c.toolSlugs
        .map((s) => {
          const t = TOOLS_REGISTRY[s];
          return `  - **${t?.name || s}** (${SITE_URL}/tools/${s}): ${t?.description || ""}`;
        })
        .join("\n");
      const workflows = c.deepGuide.usageWorkflows.map((w, i) => `  ${i + 1}. ${w}`).join("\n");
      const benefits = c.keyBenefits.map((b) => `  - ${b}`).join("\n");

      return `### ${c.name}
- **URL**: ${SITE_URL}/developer-tools/${c.slug}
- **Short Title**: ${c.shortTitle}
- **Description**: ${c.seoDescription}
- **Technical Architecture**: ${c.deepGuide.technicalArchitecture}
- **Key Engineering Benefits**:
${benefits}
- **Standard Workflows**:
${workflows}
- **Included Offline Utilities**:
${toolList}
`;
    })
    .join("\n---\n\n");

  const toolsDetailed = tools
    .map((t) => {
      const steps = t.howToUse?.map((step, i) => `  ${i + 1}. ${step}`).join("\n") || "  1. Paste input into the editor.";
      const edgeCases = t.edgeCases && t.edgeCases.length > 0
        ? `\n- **Edge Cases & Limitations**:\n${t.edgeCases.map((ec) => `  - ${ec}`).join("\n")}`
        : "";
      const shortcuts = t.shortcuts && t.shortcuts.length > 0
        ? `\n- **Key Shortcuts**: ${t.shortcuts.join(", ")}`
        : "";

      return `### ${t.name}
- **URL**: ${SITE_URL}/tools/${t.slug}
- **Category**: ${t.category}
- **Description**: ${t.description}
- **How to Use**:
${steps}${edgeCases}${shortcuts}
`;
    })
    .join("\n---\n\n");

  const formatHubsDetailed = getAllFormatHubs()
    .map((h) => {
      return `### ${h.name}
- **URL**: ${SITE_URL}/ai-skill-studio/${h.slug}
- **Target File**: ${h.targetFile}
- **Target Directory**: ${h.targetDir}
- **Description**: ${h.seoDescription}
- **Overview**: ${h.overview}
`;
    })
    .join("\n---\n\n");

  const dynamicSpokes = getAllDynamicPresetRoutes();
  const seenSpokeUrls = new Set<string>();
  const presetsDetailedList: string[] = [];

  for (const route of dynamicSpokes) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      const p = getPresetBySlug(route.formatSlug, route.presetSlug);
      if (p) {
        presetsDetailedList.push(`### ${p.title}
- **URL**: ${url}
- **Target Specification**: ${p.format}
- **Description**: ${p.description}
`);
      }
    }
  }

  for (const route of PRESET_ROUTES) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      presetsDetailedList.push(`### ${route.title}
- **URL**: ${url}
- **Target Specification**: ${route.format}
- **Description**: ${route.description}
`);
    }
  }

  const presetsDetailed = presetsDetailedList.join("\n---\n\n");

  const engineeringGuidesDetailed = BLOG_POSTS.map((p) => {
    const faqs = p.faqs && p.faqs.length > 0
      ? `\n- **Frequently Asked Questions**:\n${p.faqs.map((f) => `  - **Q: ${f.question}**\n    A: ${f.answer}`).join("\n")}`
      : "";
    const tags = p.tags && p.tags.length > 0 ? `\n- **Tags**: ${p.tags.join(", ")}` : "";

    return `### ${p.title}
- **URL**: ${SITE_URL}/blog/${p.slug}
- **Category**: ${p.category}
- **Type**: ${p.type} | Read Time: ${p.readTime} | Difficulty: ${p.difficulty}
- **Summary**: ${p.seoDescription || p.description}${tags}${faqs}
`;
  }).join("\n---\n\n");

  const content = `# DevScratchpad — Full Documentation for AI Agents & Search Engines
> The authoritative reference for DevScratchpad's privacy-backed developer utilities, cryptographic tools, and AI agent prompt specifications.

DevScratchpad (${SITE_URL}) operates entirely on client-side code execution. No network requests are made when processing user data, ensuring 100% data confidentiality for enterprise and sensitive workloads.

---

## Primary Platforms & Root Hubs
- [Developer Tools Directory](${SITE_URL}/developer-tools): Complete directory of 28 offline, client-side developer utilities across 5 categories.
- [AI Skill Studio](${SITE_URL}/ai-skill-studio): Universal AI prompt engineering studio generating Claude Code skills, Cursor rules (.mdc), AGENTS.md specs, and MCP configs.
- [Developer Learning Hub](${SITE_URL}/blog): In-depth technical guides, cheat sheets, and architectural references for modern engineering teams.

---

## Developer Tools Category Hubs

${categoriesDetailed}

---

## Detailed Tool Specifications

${toolsDetailed}

---

## AI Skill Studio Format Hubs

${formatHubsDetailed}

---

## AI Skill Studio Specification Presets

${presetsDetailed}

---

## Engineering Guides & Cheat Sheets

${engineeringGuidesDetailed}

---

## Security & Verification Standards
- **Zero-Trust Client Isolation**: Code execution uses Web Workers, Web Crypto API, and pure TypeScript parsers.
- **No Third-Party Payload Logging**: Analytics capture only high-level page views (via Vercel Web Analytics); no query parameters, clipboard contents, or tool inputs are tracked.
- **Offline Reliability**: Service Workers cache critical bundles via Serwist/PWA for uninterrupted air-gapped development.
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}
