import { getAllDynamicPresetRoutes, getPresetBySlug } from "@/app/claude-skills/lib/presetRegistry";
import { generateContentFromRoute } from "@/app/claude-skills/lib/ruleGenerator";

export function generateStaticParams() {
  return getAllDynamicPresetRoutes().map((route) => ({
    formatSlug: route.formatSlug,
    presetSlug: route.presetSlug,
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formatSlug: string; presetSlug: string }> }
) {
  const { formatSlug, presetSlug } = await params;
  const route = getPresetBySlug(formatSlug, presetSlug);

  if (!route) {
    return new Response(
      `Error: Preset not found for format "${formatSlug}" and slug "${presetSlug}". Available formats include: cursor-rules, claude-skills, claude-md, agents-md, mcp-config, windsurf-rules, copilot-instructions, openai-instructions, gemini-prompts.`,
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  }

  const content = generateContentFromRoute(route);

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
