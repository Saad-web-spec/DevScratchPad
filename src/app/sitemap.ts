import { MetadataRoute } from "next";
import { TOOL_SLUGS } from "@/lib/tools/registry";

const SITE_URL = "https://tools.saadengineer.works";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = TOOL_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...routes,
  ];
}
