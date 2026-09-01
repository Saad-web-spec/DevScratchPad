import { MetadataRoute } from"next";
import { TOOL_SLUGS } from"@/lib/tools/registry";
import { BLOG_SLUGS } from"@/lib/blog/posts";
import { ROUTES } from"@/lib/routes";

const SITE_URL ="https://www.devscratchpad.tech";

export default function sitemap(): MetadataRoute.Sitemap {
 const routes = TOOL_SLUGS.map((slug) => ({
 url: `${SITE_URL}${ROUTES.tool(slug)}`,
 lastModified: new Date(),
 changeFrequency:"weekly"as const,
 priority: 0.8,
 }));

 const blogIndex = {
 url: `${SITE_URL}/blog`,
 lastModified: new Date(),
 changeFrequency:"weekly"as const,
 priority: 0.7,
 };

 const blogRoutes = BLOG_SLUGS.map((slug) => ({
 url: `${SITE_URL}/blog/${slug}`,
 lastModified: new Date(),
 changeFrequency:"weekly"as const,
 priority: 0.6,
 }));

 return [
 {
 url: SITE_URL,
 lastModified: new Date(),
 changeFrequency:"weekly",
 priority: 1.0,
 },
 blogIndex,
 ...routes,
 ...blogRoutes,
 ];
}
