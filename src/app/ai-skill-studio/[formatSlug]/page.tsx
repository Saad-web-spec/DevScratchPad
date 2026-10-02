import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatHub, getAllFormatSlugsWithAliases } from "../../claude-skills/lib/formatHubs";
import { ClaudeSkillsClient } from "../../claude-skills/ClaudeSkillsClient";
import { AiSkillStudioSeoContent } from "../AiSkillStudioSeoContent";

export function generateStaticParams() {
  return getAllFormatSlugsWithAliases().map((slug) => ({
    formatSlug: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}): Promise<Metadata> {
  const { formatSlug } = await params;
  const hub = getFormatHub(formatSlug);
  if (!hub) return { title: "Format Not Found" };

  return {
    title: hub.seoTitle,
    description: hub.seoDescription,
    openGraph: {
      title: `${hub.seoTitle} | DevScratchpad`,
      description: hub.seoDescription,
      type: "website",
      siteName: "DevScratchpad",
      locale: "en_US",
      url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
      images: [
        {
          url: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          secureUrl: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${hub.seoTitle} — 13 Formats & 5-Layer AI Agent Suite — DevScratchpad`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${hub.seoTitle} | DevScratchpad`,
      description: hub.seoDescription,
      images: [
        {
          url: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${hub.seoTitle} — 13 Formats & 5-Layer AI Agent Suite — DevScratchpad`,
        },
      ],
    },
    alternates: {
      canonical: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
    },
  };
}

export default async function FormatHubPage({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}) {
  const { formatSlug } = await params;
  const hub = getFormatHub(formatSlug);

  if (!hub) {
    notFound();
  }

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#webapp`,
        url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
        name: hub.name,
        description: hub.seoDescription,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.devscratchpad.tech",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "AI Skill Studio",
            item: "https://www.devscratchpad.tech/ai-skill-studio",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: hub.name,
            item: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />
      <ClaudeSkillsClient
        initialFormat={hub.format}
        formatSlug={hub.slug}
      />
      <AiSkillStudioSeoContent />
    </>
  );
}
