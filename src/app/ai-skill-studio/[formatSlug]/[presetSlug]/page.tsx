import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  getAllDynamicPresetRoutes,
  getPresetBySlug,
  getPresetRouteMetadata,
} from "../../../claude-skills/lib/presetRegistry";
import { getFormatHub, getAllFormatHubs } from "../../../claude-skills/lib/formatHubs";
import { ClaudeSkillsClient } from "../../../claude-skills/ClaudeSkillsClient";
import { ProgrammaticSpokeSeoContent } from "../../components/ProgrammaticSpokeSeoContent";

export function generateStaticParams() {
  return getAllDynamicPresetRoutes().map((route) => ({
    formatSlug: route.formatSlug,
    presetSlug: route.presetSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formatSlug: string; presetSlug: string }>;
}): Promise<Metadata> {
  const { formatSlug, presetSlug } = await params;
  const metadata = getPresetRouteMetadata(formatSlug, presetSlug);
  if (!metadata) {
    return { title: "Preset Not Found" };
  }
  return metadata;
}

export default async function ProgrammaticPresetPage({
  params,
}: {
  params: Promise<{ formatSlug: string; presetSlug: string }>;
}) {
  const { formatSlug, presetSlug } = await params;
  const route = getPresetBySlug(formatSlug, presetSlug);

  if (!route) {
    notFound();
  }

  // Canonicalize any alias URL request to the primary spoke URL
  if (presetSlug !== route.presetSlug) {
    permanentRedirect(`/ai-skill-studio/${formatSlug}/${route.presetSlug}`);
  }

  const hub = getFormatHub(formatSlug);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#software`,
        name: route.title,
        description: route.description,
        url: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}`,
        downloadUrl: `https://www.devscratchpad.tech/api/raw/${formatSlug}/${route.presetSlug}`,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: route.category,
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript. Requires modern browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: route.keyRules,
      },
      {
        "@type": "HowTo",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#howto`,
        name: `How to Install ${route.techName} ${hub?.name || "Rule"} via Terminal`,
        description: `Install and configure ${route.techName} ${hub?.name || "rules"} in your project in 3 simple terminal steps using the DevScratchpad raw API endpoint.`,
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Open Project Directory",
            text: `Open your terminal and navigate to your project root folder where the ${route.targetFile} file will reside.`,
            url: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#step-1`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Fetch Rule File via Terminal Command",
            text: `Run curl or PowerShell to stream the rule directly from https://www.devscratchpad.tech/api/raw/${formatSlug}/${route.presetSlug} and write it to ${route.targetFile}.`,
            url: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#step-2`,
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Verify and Activate with AI Agent",
            text: `Launch your AI coding assistant (Cursor IDE, Claude Code CLI, Windsurf, or Codex). The assistant will automatically discover ${route.targetFile} and apply the architectural guardrails.`,
            url: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#step-3`,
          },
        ],
      },
      {
        "@type": "TechArticle",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#article`,
        headline: route.title,
        description: route.description,
        articleSection: route.category,
        keywords: [
          route.techName,
          hub?.name || "AI Rules",
          "Cursor rules",
          "Claude Code skills",
          "pSEO",
          "Developer Tools",
        ],
        author: {
          "@type": "Organization",
          name: "DevScratchpad",
          url: "https://www.devscratchpad.tech",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#breadcrumb`,
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
            name: hub?.name || formatSlug,
            item: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: route.techName,
            item: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}`,
          },
        ],
      },
      ...(route.faqs && route.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${route.presetSlug}#faq`,
              mainEntity: route.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      {/* Top Breadcrumb Navigation Bar matching /ai-skill-studio */}
      <div className="bg-white border-b border-zinc-200 px-4 py-2 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-zinc-600 truncate mr-3 font-medium">
            <Link href="/" className="hover:text-zinc-900 transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <Link href="/ai-skill-studio" className="hover:text-zinc-900 transition-colors shrink-0">
              AI Skill Studio
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <Link
              href={`/ai-skill-studio/${formatSlug}`}
              className="text-orange-600 hover:text-orange-700 transition-colors shrink-0 font-semibold"
            >
              {hub?.name || formatSlug}
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0 hidden sm:inline" />
            <span className="text-zinc-900 font-bold truncate hidden sm:inline">
              {route.techName}
            </span>
          </nav>

          <Link
            href={`/ai-skill-studio/${formatSlug}`}
            className="flex items-center text-xs font-mono text-zinc-600 hover:text-orange-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            {hub?.badge || "Hub"} Directory
          </Link>
        </div>
      </div>

      {/* Cross-Format Switcher */}
      <div className="bg-white border-b border-zinc-200 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 mr-1">Also available for:</span>
          {getAllFormatHubs()
            .filter((h) => getPresetBySlug(h.slug, route.presetSlug) !== null)
            .map((h) => {
              const isCurrent = h.slug === formatSlug;
              return (
                <Link 
                  key={h.slug}
                  href={`/ai-skill-studio/${h.slug}/${route.presetSlug}`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isCurrent 
                      ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-default pointer-events-none" 
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-orange-300 hover:text-orange-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm"
                  }`}
                >
                  {h.badge}
                </Link>
              );
            })}
        </div>
      </div>

      <ClaudeSkillsClient
        initialFormat={route.format}
        initialPresetId={route.presetId}
        formatSlug={route.formatSlug}
        presetSlug={route.presetSlug}
      />

      {/* Stack-Specific Rich Programmatic Spoke Content for Search Engines & Users */}
      <ProgrammaticSpokeSeoContent route={route} />
    </div>
  );
}
