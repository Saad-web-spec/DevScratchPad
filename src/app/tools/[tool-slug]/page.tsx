import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Wrench } from "lucide-react";
import { getToolMeta, TOOL_SLUGS } from "@/lib/tools/registry";
import { RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { SeoContent } from "@/components/seo/SeoContent";

const SITE_URL ="https://www.devscratchpad.tech";

export async function generateStaticParams() {
 return TOOL_SLUGS.map((slug) => ({"tool-slug": slug }));
}

export async function generateMetadata({
 params,
}: {
 params: Promise<{"tool-slug": string }>;
}): Promise<Metadata> {
 const {"tool-slug": slug } = await params;
 const tool = getToolMeta(slug);

 if (!tool) {
 return {
 title:"Tool Not Found",
 };
 }

 return {
 metadataBase: new URL(SITE_URL),
 title: tool.seoTitle,
 description: tool.seoDescription,
 openGraph: {
 title: `${tool.seoTitle} | DevScratchpad`,
 description: tool.seoDescription,
 url: `${SITE_URL}/tools/${slug}`,
 type: "website",
 siteName: "DevScratchpad",
 images: [
 {
 url: `${SITE_URL}/tools/${slug}/opengraph-image`,
 width: 1200,
 height: 630,
 alt: `${tool.name} — Free Offline Developer Tool | DevScratchpad`,
 },
 ],
 },
 twitter: {
 card: "summary_large_image",
 title: `${tool.seoTitle} | DevScratchpad`,
 description: tool.seoDescription,
 images: [
 {
 url: `${SITE_URL}/tools/${slug}/opengraph-image`,
 width: 1200,
 height: 630,
 alt: `${tool.name} — Free Offline Developer Tool | DevScratchpad`,
 },
 ],
 },
 alternates: {
 canonical: `${SITE_URL}/tools/${slug}`,
 },
 };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ "tool-slug": string }>;
}) {
  const { "tool-slug": slug } = await params;
  const toolMeta = getToolMeta(slug);

  if (!toolMeta) {
    notFound();
  }
  
  const toolRecipes = Object.values(RECIPE_REGISTRY).filter(r => r.targetToolSlug === slug);

  return (
    <WorkspaceShell initialToolSlug={slug} toolMeta={toolMeta}>
      {toolMeta.relatedBlogSlug && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-2">
          <Link
            href={`/blog/${toolMeta.relatedBlogSlug}`}
            className="group flex items-center justify-between p-4 rounded-xl bg-orange-50 border border-orange-200 hover:border-orange-300 transition-colors no-underline"
          >
            <div className="flex items-center gap-3 text-orange-900">
              <BookOpen className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <span className="font-semibold block sm:inline mr-2">📖 Deep Dive Guide:</span>
                <span className="text-sm font-medium">{toolMeta.seoTitle} explained →</span>
              </div>
            </div>
          </Link>
        </div>
      )}
      <SeoContent tool={toolMeta} />
      
      {toolRecipes.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-500" />
              Troubleshooting Recipes &amp; Fixes
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
              <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
              <span>{toolRecipes.length} Verified Solutions</span>
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {toolRecipes.map(recipe => (
              <Link 
                key={recipe.slug} 
                href={`/recipes/${recipe.slug}`}
                className="block p-4 rounded-xl bg-white border border-zinc-200 hover:border-orange-500 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-zinc-900 mb-1">{recipe.title}</h3>
                <p className="text-sm text-zinc-600 line-clamp-2">{recipe.problem}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

