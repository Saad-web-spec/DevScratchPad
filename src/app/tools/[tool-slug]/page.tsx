import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getToolMeta, TOOL_SLUGS } from "@/lib/tools/registry";
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
 alt: tool.name,
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
 alt: tool.name,
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
    </WorkspaceShell>
  );
}

