import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolMeta, TOOL_SLUGS } from "@/lib/tools/registry";
import { WorkspaceShell } from "@/components/WorkspaceShell";

const SITE_URL = "https://tools.saadengineer.works";

export async function generateStaticParams() {
  return TOOL_SLUGS.map((slug) => ({ "tool-slug": slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "tool-slug": string }>;
}): Promise<Metadata> {
  const { "tool-slug": slug } = await params;
  const tool = getToolMeta(slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
    };
  }

  return {
    title: `${tool.name} – Free Online Developer Utility`,
    description: `Fast, client-side ${tool.name}. 100% private, zero server transmission. Process data instantly in browser memory.`,
    openGraph: {
      title: `${tool.name} – Free Online Developer Utility`,
      description: `Fast, client-side ${tool.name}. 100% private, zero server transmission. Process data instantly in browser memory.`,
      url: `${SITE_URL}/${slug}`,
      type: "website",
      siteName: "DevScratchpad",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} – Free Online Developer Utility`,
      description: `Fast, client-side ${tool.name}. 100% private, zero server transmission. Process data instantly in browser memory.`,
    },
    alternates: {
      canonical: `${SITE_URL}/${slug}`,
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

  return <WorkspaceShell initialToolSlug={slug} toolMeta={toolMeta} />;
}
