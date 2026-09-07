import Link from "next/link";
import { Sparkles, ChevronRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { TOOLS_REGISTRY, type ToolMeta } from "@/lib/tools/registry";
import { getCategoryByRegistryName, getCategoryForTool } from "@/lib/tools/categories";
import { SeoArticle } from "./SeoArticle";

export function SeoContent({ tool }: { tool: ToolMeta }) {
  const allTools = Object.values(TOOLS_REGISTRY);
  const category = getCategoryForTool(tool.slug) || getCategoryByRegistryName(tool.category);
  const sameCategory = allTools.filter((t) => t.slug !== tool.slug && t.category === tool.category);
  const otherCategory = allTools.filter((t) => t.slug !== tool.slug && t.category !== tool.category);

  // Prefer same category, fallback to others if needed to fill 3 spots
  const relatedTools = [...sameCategory, ...otherCategory].slice(0, 3);
  const primaryRecommendation = category?.aiStudioRecommendations?.[0];

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
          "Works Fully Offline",
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
              text: `Yes. Because this tool runs strictly on client-side JavaScript with zero external API calls, once the web application is loaded in your browser it will continue working offline.`,
            },
          },
          {
            "@type": "Question",
            name: `How does URL state sharing work?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `When you click Share Payload, your state is encoded directly into a URL hash fragment (#data=...) without storing anything on a database server.`,
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

      {/* Visual Breadcrumb Navigation */}
      <div className="w-full bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-2">
          <nav className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Link href="/developer-tools" className="hover:text-zinc-900 transition-colors">
              Developer Tools
            </Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <Link
                  href={`/developer-tools/${category.slug}`}
                  className="hover:text-zinc-900 transition-colors"
                >
                  {category.shortTitle}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-semibold truncate max-w-[200px] sm:max-w-none">
              {tool.name}
            </span>
          </nav>
        </div>
      </div>

      <SeoArticle
        title={`${tool.name} (Offline & Secure)`}
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

      {/* Contextual AI Skill Studio Cross-Link Spotlight Card */}
      {primaryRecommendation && (
        <div className="w-full bg-white border-t border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="border border-orange-200 bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  <img src="/orange-star.png" className="w-3 h-3 object-contain shrink-0" alt="Star" />
                  <span>AI Skill Studio Recommended Preset</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
                  {primaryRecommendation.title}
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-xl">
                  {primaryRecommendation.description}
                </p>
              </div>
              <Link
                href={primaryRecommendation.link}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shrink-0 shadow-xs"
              >
                <span>Launch AI Rulebook</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Internal Linking: Related Developer Utilities */}
      {relatedTools.length > 0 && (
        <div className="w-full bg-zinc-50 border-t border-zinc-200">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-500" />
                Related Developer Utilities
              </h3>
              {category && (
                <Link
                  href={`/developer-tools/${category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 hover:border-zinc-300 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-all shadow-2xs group shrink-0"
                >
                  <span>Explore all {category.name} tools</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/tools/${rel.slug}`}
                  className="group flex flex-col p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-100/60 transition-all shadow-2xs"
                >
                  <p className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {rel.name}
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {rel.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
