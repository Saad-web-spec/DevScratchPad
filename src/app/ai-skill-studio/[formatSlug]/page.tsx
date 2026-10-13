import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getFormatHub, getAllFormatHubs } from "../../claude-skills/lib/formatHubs";
import { ClaudeSkillsClient } from "../../claude-skills/ClaudeSkillsClient";
import { getPresetsByFormat } from "../../claude-skills/lib/presetRegistry";
import { AiSkillStudioSeoContent } from "../AiSkillStudioSeoContent";
import { toPlainText } from "../components/studioFaqs";

export function generateStaticParams() {
  return getAllFormatHubs().map((hub) => ({
    formatSlug: hub.slug,
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

  const isAlias = formatSlug.toLowerCase() !== hub.slug;

  return {
    title: hub.seoTitle,
    description: hub.seoDescription,
    ...(isAlias ? { robots: { index: false, follow: true } } : {}),
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
          alt: `${hub.seoTitle} | DevScratchpad AI Skill Studio`,
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
          alt: `${hub.seoTitle} | DevScratchpad AI Skill Studio`,
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

  // Redirect legacy dot-extension or short aliases to canonical hyphenated URL
  if (formatSlug.toLowerCase() !== hub.slug) {
    permanentRedirect(`/ai-skill-studio/${hub.slug}`);
  }

  const presets = getPresetsByFormat(hub.slug);

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
      ...(presets.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#presets`,
              name: `${hub.badge} presets`,
              numberOfItems: presets.length,
              itemListElement: presets.map((preset, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: preset.techName,
                url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}/${preset.presetSlug}`,
              })),
            },
          ]
        : []),
      ...(hub.faqs && hub.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#faq`,
              // Plain text of the visible FAQ, which renders backticks as <code>
              mainEntity: hub.faqs.map((faq) => ({
                "@type": "Question",
                name: toPlainText(faq.question),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: toPlainText(faq.answer),
                },
              })),
            },
          ]
        : []),
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
        heading={{ title: hub.heroHeading, description: hub.heroSubheading }}
      />
      <AiSkillStudioSeoContent activeFormatSlug={hub.slug} formatFaqs={hub.faqs} />
    </>
  );
}
