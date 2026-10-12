import { MetadataRoute } from "next";
import { execFileSync } from "node:child_process";
import { TOOL_SLUGS } from "@/lib/tools/registry";
import { RECIPE_SLUGS } from "@/lib/recipes/registry";
import { getAllCategories } from "@/lib/tools/categories";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { ROUTES } from "@/lib/routes";
import { PRESET_ROUTES, getAllDynamicPresetRoutes } from "./claude-skills/lib/presetRegistry";
import { getAllFormatHubs } from "./claude-skills/lib/formatHubs";

const SITE_URL = "https://www.devscratchpad.tech";

// Used when git history is unavailable at build time (e.g. a shallow clone). Bump it when content changes.
const FALLBACK_LAST_MODIFIED = new Date("2026-10-11T00:00:00Z");

const lastModifiedCache = new Map<string, Date>();

/**
 * Date of the last commit that touched the given source paths. Google ignores lastmod values
 * that change on every build, so pages report when their content actually changed.
 */
function lastModifiedOf(...paths: string[]): Date {
  const cacheKey = paths.join("|");
  const cached = lastModifiedCache.get(cacheKey);
  if (cached) return cached;
  let date = FALLBACK_LAST_MODIFIED;
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (iso) date = new Date(iso);
  } catch {
    // git missing or not a repository: keep the fallback
  }
  lastModifiedCache.set(cacheKey, date);
  return date;
}

const TOOLS_SOURCES = ["src/app/tools", "src/lib/tools", "src/components/tools", "src/components/seo"];
const STUDIO_SOURCES = ["src/app/ai-skill-studio", "src/app/claude-skills"];
const SPOKE_SOURCES = [
  "src/app/claude-skills/lib/presetRegistry.ts",
  "src/app/ai-skill-studio/[formatSlug]/[presetSlug]",
  "src/app/ai-skill-studio/components/ProgrammaticSpokeSeoContent.tsx",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = TOOL_SLUGS.map((slug) => ({
    url: `${SITE_URL}${ROUTES.tool(slug)}`,
    lastModified: lastModifiedOf(...TOOLS_SOURCES),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const recipeRoutes = RECIPE_SLUGS.map((slug) => ({
    url: `${SITE_URL}${ROUTES.recipe(slug)}`,
    lastModified: lastModifiedOf("src/lib/recipes", "src/app/recipes"),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));


  const blogIndex = {
    url: `${SITE_URL}/blog`,
    lastModified: new Date(Math.max(...BLOG_POSTS.map((post) => Date.parse(post.updatedAt)))),
    changeFrequency: "daily" as const,
    priority: 0.9,
  };

  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryHubRoutes = getAllCategories().map((category) => ({
    url: `${SITE_URL}/developer-tools/${category.slug}`,
    lastModified: lastModifiedOf("src/app/developer-tools", "src/lib/tools"),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const formatHubRoutes = getAllFormatHubs().map((hub) => ({
    url: `${SITE_URL}/ai-skill-studio/${hub.slug}`,
    lastModified: lastModifiedOf(...STUDIO_SOURCES),
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
        lastModified: lastModifiedOf(...SPOKE_SOURCES),
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
        lastModified: lastModifiedOf(...SPOKE_SOURCES),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      });
    }
  }

  return [
    {
      url: SITE_URL,
      lastModified: lastModifiedOf("src/app/page.tsx", ...TOOLS_SOURCES),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    blogIndex,
    {
      url: `${SITE_URL}/ai-skill-studio`,
      lastModified: lastModifiedOf(...STUDIO_SOURCES),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/skill`,
      lastModified: lastModifiedOf("src/app/skill", "src/app/ai-skill-studio/skills", "src/app/claude-skills/lib/presetRegistry.ts"),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },

    {
      url: `${SITE_URL}/about`,
      lastModified: lastModifiedOf("src/app/about"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/cli`,
      lastModified: lastModifiedOf("src/app/cli", "cli"),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/ai-skill-studio/rules-converter`,
      lastModified: lastModifiedOf("src/app/ai-skill-studio/rules-converter", "src/app/claude-skills/lib/rulesConverter.ts"),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/developer-tools`,
      lastModified: lastModifiedOf("src/app/developer-tools", "src/lib/tools"),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/recipes`,
      lastModified: lastModifiedOf("src/lib/recipes", "src/app/recipes"),
      changeFrequency: "daily" as const,
      priority: 0.95,
    },
    ...categoryHubRoutes,
    ...formatHubRoutes,
    ...routes,
    ...blogRoutes,
    ...presetRoutes,
    ...recipeRoutes,
  ];
}
