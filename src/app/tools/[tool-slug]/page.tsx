import type { Metadata } from"next";
import { notFound } from"next/navigation";
import { getToolMeta, TOOL_SLUGS } from"@/lib/tools/registry";
import { WorkspaceShell } from"@/components/WorkspaceShell";
import { SeoContent } from"@/components/seo/SeoContent";

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
 type:"website",
 siteName:"DevScratchpad",
 },
 twitter: {
 card:"summary_large_image",
 title: `${tool.seoTitle} | DevScratchpad`,
 description: tool.seoDescription,
 },
 alternates: {
 canonical: `${SITE_URL}/tools/${slug}`,
 },
 };
}

export default async function ToolPage({
 params,
}: {
 params: Promise<{"tool-slug": string }>;
}) {
 const {"tool-slug": slug } = await params;
 const toolMeta = getToolMeta(slug);

 if (!toolMeta) {
 notFound();
 }

 return (
 <WorkspaceShell initialToolSlug={slug} toolMeta={toolMeta}>
 <SeoContent tool={toolMeta} />
 </WorkspaceShell>
 );
}
