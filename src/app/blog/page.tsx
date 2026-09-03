import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Calendar, ChevronRight, Terminal, ArrowUpRight } from "lucide-react";
import { BLOG_POSTS, LEARNING_TRACKS, QUICK_CHEATS } from "@/lib/blog/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HubSearchAndFilter } from "@/components/blog/HubSearchAndFilter";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: "Developer Learning Hub, Cheat Sheets & Engineering Guides | DevScratchpad",
  description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers. Cron syntax, JWT RFC standards, cURL conversions, and offline cryptography.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Developer Learning Hub, Cheat Sheets & Engineering Guides | DevScratchpad",
    description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers.",
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "DevScratchpad",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Learning Hub, Cheat Sheets & Engineering Guides | DevScratchpad",
    description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers.",
  },
};

export default function BlogIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "DevScratchpad Developer Learning Hub",
    "url": `${SITE_URL}/blog`,
    "description": "Comprehensive technical guides, cheat sheets, and reference architectures for modern software engineers.",
    "publisher": {
      "@type": "Organization",
      "name": "DevScratchpad",
      "url": SITE_URL,
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": BLOG_POSTS.map((post, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "TechArticle",
          "headline": post.title,
          "description": post.seoDescription,
          "datePublished": post.publishedAt,
          "dateModified": post.updatedAt,
          "url": `${SITE_URL}/blog/${post.slug}`,
          "articleSection": post.category,
          "keywords": post.tags?.join(", "),
          "author": {
            "@type": "Organization",
            "name": "DevScratchpad",
          },
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Interactive Hub Search, Tracks, Cheats & Filterable Post Directory */}
        <HubSearchAndFilter
          posts={BLOG_POSTS}
          tracks={LEARNING_TRACKS}
          cheats={QUICK_CHEATS}
        />

        {/* Minimalist Dark Offline Workspace Banner */}
        <div className="mt-8 bg-zinc-900 text-zinc-100 rounded-xl p-6 sm:p-8 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>100% Client-Side Engine // Zero Telemetry</span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Looking for client-side formatters, decoders, and converters?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Explore 25+ offline utilities including JSON Formatter, cURL converters, JWT decoder, UUID generator, and Bcrypt verifier.
            </p>
          </div>
          <Link
            href="/developer-tools"
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Browse All Tools (25+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
