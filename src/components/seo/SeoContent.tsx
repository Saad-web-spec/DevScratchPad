import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TOOLS_REGISTRY, type ToolMeta } from "@/lib/tools/registry";
import { getCategoryByRegistryName, getCategoryForTool } from "@/lib/tools/categories";
import { SeoArticle } from "./SeoArticle";
import { ArrowLink, SectionHeading, ToolRow, guide } from "./guideUi";

export function SeoContent({ tool }: { tool: ToolMeta }) {
  const allTools = Object.values(TOOLS_REGISTRY);
  const category = getCategoryForTool(tool.slug) || getCategoryByRegistryName(tool.category);
  const sameCategory = allTools.filter((t) => t.slug !== tool.slug && t.category === tool.category);
  const otherCategory = allTools.filter((t) => t.slug !== tool.slug && t.category !== tool.category);

  // Prefer same category, fallback to others if needed to fill 3 spots
  const relatedTools = [...sameCategory, ...otherCategory].slice(0, 3);

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.devscratchpad.tech",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Developer Tools",
      item: "https://www.devscratchpad.tech/developer-tools",
    },
  ];

  if (category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: category.name,
      item: `https://www.devscratchpad.tech/developer-tools/${category.slug}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: tool.name,
      item: `https://www.devscratchpad.tech/tools/${tool.slug}`,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: tool.name,
      item: `https://www.devscratchpad.tech/tools/${tool.slug}`,
    });
  }

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `https://www.devscratchpad.tech/tools/${tool.slug}#webapp`,
        name: `${tool.name} Online`,
        url: `https://www.devscratchpad.tech/tools/${tool.slug}`,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: tool.category,
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript, HTML5, Web Crypto API",
        isAccessibleForFree: true,
        softwareVersion: "1.0",
        publisher: {
          "@type": "Organization",
          "@id": "https://www.devscratchpad.tech/#organization",
          name: "DevScratchpad",
        },
        featureList: [
          "100% Client-Side In-Browser Execution",
          "Zero Server Transmission Privacy Guarantee",
          "Runs Entirely In Your Browser",
          ...(tool.shortcuts || []),
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: tool.seoDescription || tool.description,
      },
      {
        "@type": "HowTo",
        "@id": `https://www.devscratchpad.tech/tools/${tool.slug}#howto`,
        name: `How to use ${tool.name} Online`,
        description: `Step-by-step guide to use ${tool.name} with 100% in-browser client-side privacy.`,
        step: tool.howToUse.map((step, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: `Step ${idx + 1}`,
          text: step,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `https://www.devscratchpad.tech/tools/${tool.slug}#faq`,
        mainEntity: [
          ...(tool.edgeCases && tool.edgeCases.length > 0
            ? [
                {
                  "@type": "Question",
                  name: `What are some edge cases for ${tool.shortName || tool.name}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: tool.edgeCases.join(" "),
                  },
                },
              ]
            : []),
          {
            "@type": "Question",
            name: `Is this ${tool.shortName || tool.name} safe for sensitive data & credentials?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, 100%. All processing runs client-side in your local browser memory. No text, tokens, payloads, or logs are ever transmitted to any remote server or analytics engine.`,
            },
          },
          {
            "@type": "Question",
            name: `Can I use ${tool.shortName || tool.name} offline without internet?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Partly. This tool runs on client-side JavaScript with no external API calls, so once it is open it keeps working if your connection drops. Pages are not cached for offline use, so loading a tool needs a connection.`,
            },
          },
          {
            "@type": "Question",
            name: `How does URL state sharing work?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `When you click the share (link) icon, your input is compressed into a URL hash fragment (#data=...) and the link is copied to your clipboard, without storing anything on a database server.`,
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
    ],
  };

  const explanation = tool.seoDescription || tool.description;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      <div className="w-full border-t border-zinc-200 bg-white">
        {/* Visual Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className={`${guide.column} pt-6 sm:pt-10`}>
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-zinc-500">
            <Link href="/" className="inline-flex min-h-10 items-center transition-colors hover:text-zinc-900 sm:min-h-0">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
            <Link href="/developer-tools" className="inline-flex min-h-10 items-center transition-colors hover:text-zinc-900 sm:min-h-0">
              Developer Tools
            </Link>
            {category && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
                <Link
                  href={`/developer-tools/${category.slug}`}
                  className="inline-flex min-h-10 items-center transition-colors hover:text-zinc-900 sm:min-h-0"
                >
                  {category.shortTitle}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
            <span className="max-w-full truncate text-zinc-900">
              {tool.name}
            </span>
          </div>
        </nav>

        <SeoArticle
          title={`${tool.name} (Private & Secure)`}
          explanation={explanation}
          howToUse={tool.howToUse}
          edgeCases={tool.edgeCases}
          shortcuts={
            tool.shortcuts || [
              "Ctrl/Cmd + V — Smart Magic Paste",
              "Ctrl/Cmd + K — Open Command Palette",
            ]
          }
        />

        {/* Internal Linking: Related Developer Utilities */}
        {relatedTools.length > 0 && (
          <div className={guide.column}>
            <section className={`${guide.section} max-w-3xl space-y-4`}>
              <SectionHeading
                title="Related Developer Utilities"
                action={
                  category && (
                    <ArrowLink href={`/developer-tools/${category.slug}`}>
                      Explore all {category.name} tools
                    </ArrowLink>
                  )
                }
              />

              <ul className="border-b border-zinc-200">
                {relatedTools.map((rel) => (
                  <li key={rel.slug}>
                    <ToolRow href={`/tools/${rel.slug}`} title={rel.name} description={rel.description} titleAs="p" />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
