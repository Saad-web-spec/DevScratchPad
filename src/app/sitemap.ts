import { MetadataRoute } from "next";
import { TOOL_SLUGS } from "@/lib/tools/registry";
import { BLOG_SLUGS } from "@/lib/blog/posts";
import { ROUTES } from "@/lib/routes";
import { PRESET_ROUTES, getAllDynamicPresetRoutes } from "./claude-skills/lib/presetRegistry";
import { getAllFormatHubs } from "./claude-skills/lib/formatHubs";

const SITE_URL = "https://www.devscratchpad.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = TOOL_SLUGS.map((slug) => ({
    url: `${SITE_URL}${ROUTES.tool(slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogIndex = {
    url: `${SITE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  };

  const blogRoutes = BLOG_SLUGS.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const formatHubRoutes = getAllFormatHubs().map((hub) => ({
    url: `${SITE_URL}/ai-skill-studio/${hub.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.95,
  }));

  // Full deduplicated set of dynamic spoke routes + any format-specific routes
  const dynamicSpokes = getAllDynamicPresetRoutes();
  const seenSpokeUrls = new Set<string>();
  const presetRoutes: MetadataRoute.Sitemap = [];

  for (const route of dynamicSpokes) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      presetRoutes.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      });
    }
  }

  for (const route of PRESET_ROUTES) {
    const url = `${SITE_URL}/ai-skill-studio/${route.formatSlug}/${route.presetSlug}`;
    if (!seenSpokeUrls.has(url)) {
      seenSpokeUrls.add(url);
      presetRoutes.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      });
    }
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    blogIndex,
    {
      url: `${SITE_URL}/ai-skill-studio`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/developer-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...formatHubRoutes,
    ...routes,
    ...blogRoutes,
    ...presetRoutes,
  ];
}
