import { Metadata } from "next";
import Link from "next/link";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { getCategoryByRegistryName } from "@/lib/tools/categories";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ArrowLink, ToolRow, guide } from "@/components/seo/guideUi";

export const metadata: Metadata = {
  title: "28 Private Developer Tools Directory",
  description: "Explore the complete directory of 28 free privacy-first developer utilities across 5 categories with bidirectional technical guides. Zero server transmission.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/developer-tools",
  },
  openGraph: {
    title: "28 Private Developer Tools Directory | DevScratchpad",
    description: "Explore the complete directory of 28 free privacy-first developer utilities across 5 categories with bidirectional technical guides.",
    url: "https://www.devscratchpad.tech/developer-tools",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "28 Private Developer Tools Directory across 5 Categories — DevScratchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "28 Private Developer Tools Directory | DevScratchpad",
    description: "Explore the complete directory of 28 free privacy-first developer utilities across 5 categories with bidirectional technical guides.",
    images: [
      {
        url: "https://www.devscratchpad.tech/opengraph-image",
        width: 1200,
        height: 630,
        alt: "28 Private Developer Tools Directory across 5 Categories — DevScratchpad",
      },
    ],
  },
};

export default function DeveloperToolsPage() {
  const allTools = Object.values(TOOLS_REGISTRY);

  // Group tools by category
  const groupedTools = allTools.reduce((acc, tool) => {
    const cat = tool.category || "Utilities";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {} as Record<string, typeof allTools>);

  const categories = Object.keys(groupedTools).sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://www.devscratchpad.tech/developer-tools#webpage",
        "url": "https://www.devscratchpad.tech/developer-tools",
        "name": "Developer Tools Directory (28 Browser-Based Utilities)",
        "description": "Explore the complete directory of 100% client-side, privacy-first developer utilities.",
        "publisher": {
          "@type": "Organization",
          "@id": "https://www.devscratchpad.tech/#organization",
          "name": "DevScratchpad",
        },
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": allTools.length,
          "itemListElement": allTools.map((t, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `https://www.devscratchpad.tech/tools/${t.slug}`,
            "name": t.name,
            "description": t.description,
          })),
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14">
        <div className="max-w-3xl space-y-3 pb-10 sm:pb-12">
          <span className={`${guide.eyebrow} block`}>
            Client-Side Utilities
          </span>
          <h1 className={guide.h1}>
            Developer Tools Directory
          </h1>
          <p className={guide.lead}>
            All tools execute strictly client-side in browser memory with zero network latency and zero server data transmission.
          </p>
        </div>

        <div className="border-t border-zinc-200 pt-10 sm:pt-12 space-y-12">
          {categories.map((category) => {
            const catMeta = getCategoryByRegistryName(category);
            const hubUrl = catMeta ? `/developer-tools/${catMeta.slug}` : undefined;

            return (
              <section key={category} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  <div className="flex items-baseline gap-2.5">
                    {hubUrl ? (
                      <Link
                        href={hubUrl}
                        className="group inline-flex items-center gap-1.5"
                      >
                        <h2 className={`${guide.h2} transition-colors group-hover:text-zinc-600`}>
                          {category}
                        </h2>
                      </Link>
                    ) : (
                      <h2 className={guide.h2}>
                        {category}
                      </h2>
                    )}
                    <span className="text-[13px] text-zinc-400">
                      ({groupedTools[category].length} tools)
                    </span>
                  </div>

                  {hubUrl && (
                    <ArrowLink href={hubUrl}>View Category Hub</ArrowLink>
                  )}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
                {groupedTools[category].map((tool) => (
                  <ToolRow
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    title={tool.name}
                    description={tool.description}
                  />
                ))}
              </div>
            </section>
          );
        })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
