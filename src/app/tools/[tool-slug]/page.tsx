import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getToolMeta, TOOL_SLUGS } from "@/lib/tools/registry";
import { RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { SeoContent } from "@/components/seo/SeoContent";
import { SectionHeading, guide } from "@/components/seo/guideUi";

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
 alt: `${tool.name} — Free Private Developer Tool | DevScratchpad`,
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
 alt: `${tool.name} — Free Private Developer Tool | DevScratchpad`,
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
      <SeoContent tool={toolMeta} />
      
      {toolRecipes.length > 0 && (
        <div className={`${guide.column} pb-10`}>
          <section className={`${guide.section} max-w-3xl space-y-4`}>
            <SectionHeading title="Troubleshooting Recipes & Fixes" />
            <ul className="border-b border-zinc-200">
              {toolRecipes.map(recipe => (
                <li key={recipe.slug}>
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    className={guide.row}
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium leading-snug text-zinc-900 transition-colors group-hover:text-zinc-600 sm:text-[15px]">{recipe.title}</h3>
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-zinc-500">{recipe.problem}</p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-900"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </WorkspaceShell>
  );
}
