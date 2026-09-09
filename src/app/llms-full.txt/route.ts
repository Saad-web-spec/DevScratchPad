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
- [AI Skill Studio](${SITE_URL}/ai-skill-studio): Cursor Rules (.mdc), Claude Skills (SKILL.md), CLAUDE.md, AGENTS.md, Windsurf Cascade, GitHub Copilot, OpenAI, Gemini Prompts & MCP Config Generator with 100% offline privacy.
- [Universal Rules Converter](${SITE_URL}/ai-skill-studio/rules-converter): Zero-telemetry client-side migration engine for legacy .cursorrules, .mdc, and prompt instructions to modern agent formats.
- [Headless Terminal CLI](${SITE_URL}/ai-skill-studio): Zero-install command-line management tool (\`npx devscratchpad\`) for rulebook installation and repository auditing.
- [Developer Learning Hub](${SITE_URL}/blog): In-depth technical guides, cheat sheets, and architectural references for modern engineering teams.

---

## Headless Terminal CLI (\`npx devscratchpad\`)

The DevScratchpad CLI is a dependency-free, zero-install Node.js utility enabling developers to manage, audit, and scaffold AI rulebooks directly inside their workspace.

### Core CLI Commands
1. **Browse Presets & Formats**:
   \`\`\`bash
   npx devscratchpad list
   \`\`\`
   Outputs all 7 format categories and 23+ technology presets grouped by domain (Fullstack, Frontend, Backend, Systems, Testing, Security).

2. **Install Rules Directly into Repository**:
   \`\`\`bash
   # Shorthand format/preset syntax:
   npx devscratchpad add cursor-rules/nextjs-15
   npx devscratchpad add claude-skills/fastapi
   npx devscratchpad add windsurf/tailwind-v4
   npx devscratchpad add copilot/typescript-strict

   # Flag syntax:
   npx devscratchpad add nextjs-15 --format cursor-rules
   \`\`\`
   Automatically creates the target directory structure (\`.cursor/rules/\`, \`.claude/skills/<preset>/\`, \`.windsurf/rules/\`, etc.) and downloads the production-hardened specification. If offline, the CLI falls back seamlessly to bundled local templates.

3. **Static Rule Quality Audit**:
   \`\`\`bash
   npx devscratchpad audit [dir]
   \`\`\`
   Scans repository rulebooks (\`.cursorrules\`, \`CLAUDE.md\`, \`AGENTS.md\`, \`.windsurfrules\`, \`.github/copilot-instructions.md\`, \`.cursor/rules/*.mdc\`, \`.claude/skills/*/SKILL.md\`) and grades them on a 0–100 quality scale evaluating:
   - **Negative Guardrails**: Detection of deterministic constraints (\`never\`, \`avoid\`, \`must not\`).
   - **Rule Density**: Enforces concise bounds without monolithic prompt degradation (>300 lines).
   - **Trigger & Glob Specificity**: Validates frontmatter \`globs:\` in Cursor rules.
   - **Vague Directives**: Flags ambiguous instructions like "clean code" or "write good code".

4. **Initialize Repository Starter Rules**:
   \`\`\`bash
   npx devscratchpad init
   \`\`\`
   Sets up a universal multi-agent configuration in the current working directory.

### CLI Security Invariants
- **Strict Path Confinement**: Enforces target path boundary checks (\`resolvedTarget.startsWith(cwdRoot)\`) to strictly prohibit directory traversal attacks.
- **Input Sanitization**: Slugs are sanitized against \`^[a-zA-Z0-9_-]+$\` to avoid command or script injection.
- **Zero Runtime Dependencies**: Operates purely on native Node.js standard libraries (\`node:fs\`, \`node:path\`, \`node:https\`).

---

## Universal AI Rules Converter & Reverse Importer

Located at [${SITE_URL}/ai-skill-studio/rules-converter](${SITE_URL}/ai-skill-studio/rules-converter), the Universal Rules Converter solves configuration lock-in across the AI developer ecosystem:
- **Input Formats**: Legacy \`.cursorrules\`, Cursor \`.mdc\` files, \`CLAUDE.md\`, \`AGENTS.md\`, Windsurf rules, GitHub Copilot instructions, or raw system prompts.
- **Intermediate Representation (IR)**: Client-side parser extracts metadata, target file globs, role specifications, core architectural guidelines, prohibited practices, styling rules, and database conventions.
- **Target Export Formats**: Instant 1-click transformation into any of the 9 supported assistant formats.
- **Seamless Studio Hand-off**: Clicking "Customize in AI Skill Studio" packs the parsed IR into a URL hash state (\`#import=...\`), launching the full interactive editor with zero server communication.

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
