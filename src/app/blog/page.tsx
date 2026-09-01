import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Calendar, Sparkles, Terminal, Shield, Code, ChevronRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: "Developer Blog — Guides, Tutorials & Cheat Sheets | DevScratchpad",
  description: "Comprehensive developer guides, cheat sheets, and tutorials for Cron syntax, JWT tokens, cURL conversion, and privacy-first engineering.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Developer Blog — Guides, Tutorials & Cheat Sheets | DevScratchpad",
    description: "Comprehensive developer guides, cheat sheets, and tutorials for Cron syntax, JWT tokens, cURL conversion, and privacy-first engineering.",
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "DevScratchpad",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Blog — Guides, Tutorials & Cheat Sheets | DevScratchpad",
    description: "Comprehensive developer guides, cheat sheets, and tutorials for Cron syntax, JWT tokens, cURL conversion, and privacy-first engineering.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

// Helper for category tags and reading times
const getPostDetails = (slug: string) => {
  switch (slug) {
    case "cron-expression-cheat-sheet":
      return { category: "DevOps & Scheduling", readTime: "5 min read", icon: Terminal, color: "text-amber-600 bg-amber-50 border-amber-200" };
    case "convert-curl-to-python":
      return { category: "API & Python Requests", readTime: "7 min read", icon: Code, color: "text-blue-600 bg-blue-50 border-blue-200" };
    case "jwt-token-decode-guide":
      return { category: "Security & Auth", readTime: "6 min read", icon: Shield, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    default:
      return { category: "Engineering Guide", readTime: "5 min read", icon: BookOpen, color: "text-zinc-600 bg-zinc-50 border-zinc-200" };
  }
};

export default function BlogIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "DevScratchpad Engineering Blog",
    "url": `${SITE_URL}/blog`,
    "description": "Guides, Tutorials & Cheat Sheets for developers.",
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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Blog Hero */}
        <div className="mb-12 border-b border-zinc-200 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-700 mb-4 shadow-none">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Engineering Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Developer Guides & Cheat Sheets
          </h1>
          <p className="mt-3 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
            Practical, in-depth technical references and tutorials designed to help you build, test, and debug faster. Zero fluff.
          </p>
        </div>

        {/* Featured / Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {BLOG_POSTS.map((post) => {
            const details = getPostDetails(post.slug);
            const Icon = details.icon;
            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="group flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg hover:border-zinc-300 transition-all duration-200"
              >
                {/* Category & Read Time */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${details.color}`}>
                    <Icon className="w-3 h-3" />
                    {details.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {details.readTime}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mb-2.5 line-clamp-2 leading-snug">
                  {post.title}
                </h2>

                {/* Description */}
                <p className="text-zinc-600 text-xs sm:text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                  {post.description}
                </p>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 text-xs">
                  <time className="text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <span className="flex items-center font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                    Read Guide
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Workspace CTA Banner */}
        <div className="bg-zinc-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-emerald-400 text-xs font-semibold rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Client-Side Suite
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Need to test, format, or decode right now?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore our complete suite of 20+ offline developer utilities including JSON Formatter, cURL converters, JWT decoders, and regex analyzers.
            </p>
          </div>
          <Link
            href="/developer-tools"
            className="px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl text-sm transition-all whitespace-nowrap shadow-none shrink-0 flex items-center gap-2"
          >
            <span>Explore All 20+ Tools</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
