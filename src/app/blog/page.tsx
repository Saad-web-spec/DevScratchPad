import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Calendar, ChevronRight, Terminal, ArrowUpRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: "Engineering Guides, Cheat Sheets & Tutorials | DevScratchpad",
  description: "In-depth technical guides, cheat sheets, and practical references for developers. Cron syntax, JWT tokens, cURL to Python, and client-side engineering.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Engineering Guides, Cheat Sheets & Tutorials | DevScratchpad",
    description: "In-depth technical guides, cheat sheets, and practical references for developers.",
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "DevScratchpad",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Guides, Cheat Sheets & Tutorials | DevScratchpad",
    description: "In-depth technical guides, cheat sheets, and practical references for developers.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const getPostMetadata = (slug: string) => {
  switch (slug) {
    case "cron-expression-cheat-sheet":
      return { tag: "DEVOPS & UNIX", readTime: "5 min read", number: "01" };
    case "convert-curl-to-python":
      return { tag: "API & AUTOMATION", readTime: "6 min read", number: "02" };
    case "jwt-token-decode-guide":
      return { tag: "AUTH & SECURITY", readTime: "6 min read", number: "03" };
    default:
      return { tag: "REFERENCE", readTime: "5 min read", number: "04" };
  }
};

export default function BlogIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "DevScratchpad Engineering Blog",
    "url": `${SITE_URL}/blog`,
    "description": "Technical Guides, Cheat Sheets & References for engineers.",
    "blogPost": BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.seoDescription,
      "datePublished": post.publishedAt,
      "dateModified": post.updatedAt,
      "url": `${SITE_URL}/blog/${post.slug}`,
      "author": {
        "@type": "Organization",
        "name": "DevScratchpad"
      }
    }))
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Header Section */}
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Documentation & Guides
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Engineering References & Cheat Sheets
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 max-w-2xl leading-relaxed">
            Exhaustive, copy-pasteable guides and reference architectures for everyday developer problems.
          </p>
        </div>

        {/* Articles List (High-Density Linear Style) */}
        <div className="space-y-4 mb-16">
          {BLOG_POSTS.map((post) => {
            const meta = getPostMetadata(post.slug);
            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="group block bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 transition-all duration-150 relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded">
                        {meta.tag}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {meta.readTime}
                      </span>
                      <span className="text-xs text-zinc-300">•</span>
                      <time className="text-xs text-zinc-400 font-mono">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors tracking-tight flex items-center gap-1.5">
                      {post.title}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 shrink-0" />
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 leading-relaxed max-w-3xl">
                      {post.description}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center text-xs font-mono font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors pt-1">
                    <span>Read →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Minimalist Dark Workspace Card */}
        <div className="bg-zinc-900 text-zinc-100 rounded-xl p-6 sm:p-8 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>100% Client-Side Engine</span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Looking for client-side formatters and converters?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Explore 20+ offline utilities including JSON Formatter, cURL converters, JWT decoder, and UUID generator.
            </p>
          </div>
          <Link
            href="/developer-tools"
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Browse Directory (20+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
