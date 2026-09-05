import { Metadata } from "next";
import Link from "next/link";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Developer Tools Directory (20+ Offline Utilities)",
  description: "Explore the complete directory of 100% offline, privacy-first developer utilities. JSON formatters, cURL converters, JWT decoders, and regex testers.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/developer-tools",
  },
  openGraph: {
    title: "Developer Tools Directory (20+ Offline Utilities)",
    description: "Explore the complete directory of 100% offline, privacy-first developer utilities. JSON formatters, cURL converters, JWT decoders, and regex testers.",
    url: "https://www.devscratchpad.tech/developer-tools",
  },
  twitter: {
    title: "Developer Tools Directory (20+ Offline Utilities)",
    description: "Explore the complete directory of 100% offline, privacy-first developer utilities. JSON formatters, cURL converters, JWT decoders, and regex testers.",
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
        "name": "Developer Tools Directory (20+ Offline Utilities)",
        "description": "Explore the complete directory of 100% offline, privacy-first developer utilities.",
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
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Client-Side Utilities
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Developer Tools Directory
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 max-w-2xl leading-relaxed">
            All tools execute strictly client-side in browser memory with zero network latency and zero server data transmission.
          </p>
        </div>

        {/* Featured AI Agent Architecture Spotlight */}
        <div className="mb-12">
          <div className="border border-orange-200 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white p-5 sm:p-6 rounded-xl relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                  <span>Featured AI Agent Studio</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                  AI Skill Studio — SKILL.md, CLAUDE.md & Cursor Rules
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Generate production-grade Claude Code skills, Cursor <code className="font-mono text-xs bg-orange-100/60 px-1 py-0.5 rounded">.mdc</code> rules, and multi-agent system directives. 100% client-side privacy with zero API keys required.
                </p>
              </div>
              <Link
                href="/ai-skill-studio"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-all shrink-0 shadow-sm"
              >
                <span>Launch AI Studio</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-12 mb-16">
          {categories.map((category) => (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-zinc-800">
                  {category}
                </h2>
                <span className="text-xs font-mono text-zinc-400">
                  {groupedTools[category].length} tools
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {groupedTools[category].map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group bg-white border border-zinc-200 p-4 rounded-lg hover:border-zinc-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors text-sm tracking-tight mb-1 flex items-center justify-between">
                        <span>{tool.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 shrink-0 ml-1" />
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
