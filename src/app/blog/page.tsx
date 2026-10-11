import type { Metadata } from "next";
import { BLOG_POSTS, LEARNING_TRACKS, QUICK_CHEATS } from "@/lib/blog/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HubSearchAndFilter } from "@/components/blog/HubSearchAndFilter";
import { GuideCta } from "@/components/seo/guideUi";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: "Developer Learning Hub & Guides",
  description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers. Cron syntax, JWT RFC standards, cURL conversions, and client-side cryptography.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Developer Learning Hub & Guides | DevScratchpad",
    description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers. Bidirectionally linked with 28 browser-based developer tools.",
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "DevScratchpad",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Developer Learning Hub & Technical Guides — DevScratchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Learning Hub & Guides | DevScratchpad",
    description: "Exhaustive technical guides, cheat sheets, and practical reference architectures for developers bidirectionally linked with 28 developer tools.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Developer Learning Hub & Technical Guides — DevScratchpad",
      },
    ],
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Interactive Hub Search, Tracks, Cheats & Filterable Post Directory */}
        <HubSearchAndFilter
          posts={BLOG_POSTS}
          tracks={LEARNING_TRACKS}
          cheats={QUICK_CHEATS}
        />

        {/* Minimalist Workspace Banner */}
        <div className="mt-12 border-t border-zinc-200 pt-10">
          <GuideCta
            eyebrow="100% Client-Side Engine // Zero Telemetry"
            title="Looking for client-side formatters, decoders, and converters?"
            description="Explore 28 browser-based utilities including JSON Formatter, cURL converters, JWT decoder, UUID generator, and Bcrypt verifier."
            href="/developer-tools"
            label="Browse All 28 Tools"
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
