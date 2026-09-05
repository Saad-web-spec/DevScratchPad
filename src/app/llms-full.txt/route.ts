import { NextResponse } from "next/server";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { PRESET_ROUTES } from "@/app/claude-skills/lib/presetRegistry";

const SITE_URL = "https://www.devscratchpad.tech";

export async function GET() {
  const tools = Object.values(TOOLS_REGISTRY);

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

  const presetsDetailed = PRESET_ROUTES.map((p) => {
    return `### ${p.title}
- **URL**: ${SITE_URL}/ai-skill-studio/${p.formatSlug}/${p.presetSlug}
- **Target Specification**: ${p.format}
- **Description**: ${p.description}
`;
  }).join("\n---\n\n");

  const content = `# DevScratchpad — Full Documentation for AI Agents & Search Engines
> The authoritative reference for DevScratchpad's privacy-backed developer utilities, cryptographic tools, and AI agent prompt specifications.

DevScratchpad (${SITE_URL}) operates entirely on client-side code execution. No network requests are made when processing user data, ensuring 100% data confidentiality for enterprise and sensitive workloads.

---

## Detailed Tool Specifications

${toolsDetailed}

---

## AI Skill Studio Specification Presets

${presetsDetailed}

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
