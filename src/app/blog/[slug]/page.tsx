import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Terminal, ArrowRight, ArrowUpRight, Clock, ShieldCheck, Tag, Sparkles } from "lucide-react";
import { marked } from "marked";
import { getBlogPost, BLOG_SLUGS, BLOG_POSTS } from "@/lib/blog/posts";
import { getToolMeta } from "@/lib/tools/registry";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { InteractiveToolWidget } from "@/components/blog/InteractiveToolWidget";
import { FaqAccordion } from "@/components/blog/FaqAccordion";

const SITE_URL = "https://www.devscratchpad.tech";

function formatUtcDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export async function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.seoTitle} | DevScratchpad`,
    description: post.seoDescription,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: `${post.seoTitle} | DevScratchpad`,
      description: post.seoDescription,
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: "DevScratchpad",
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.seoTitle} | DevScratchpad`,
      description: post.seoDescription,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const toolMeta = getToolMeta(post.relatedToolSlug);
  const htmlContent = await marked.parse(post.content);

  // Determine related guides (from explicit list or same category)
  const relatedPosts = BLOG_POSTS.filter(
    (p) =>
      p.slug !== slug &&
      (post.relatedGuideSlugs?.includes(p.slug) || p.category === post.category)
  ).slice(0, 4);

  // Structured Data (Schema.org)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": post.title,
    "description": post.seoDescription,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "image": `${SITE_URL}/opengraph-image`,
    "articleSection": post.category,
    "keywords": post.tags?.join(", "),
    "author": {
      "@type": "Organization",
      "name": "DevScratchpad",
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "DevScratchpad",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Learning Hub",
        "item": `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": post.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Minimalist Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            root
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-zinc-900 transition-colors">
            learning-hub
          </Link>
          <span>/</span>
          <span className="text-zinc-500">{post.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</span>
          <span>/</span>
          <span className="text-zinc-800 truncate max-w-[220px] sm:max-w-none">
            {post.slug}
          </span>
        </div>

        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span>← Back to Learning Hub</span>
        </Link>

        {/* Main Article Document Card */}
        <article className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-10 md:p-12 mb-12 shadow-sm">
          {/* Article Header Metadata */}
          <header className="border-b border-zinc-200 pb-6 mb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 mb-4">
              <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded font-medium">
                {post.category.toUpperCase()}
              </span>
              {post.type === "cheat-sheet" && (
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium">
                  CHEAT SHEET
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {post.readTime}
              </span>
              <span>•</span>
              <span>{post.difficulty}</span>
              <span>•</span>
              <time suppressHydrationWarning>
                {formatUtcDate(post.publishedAt)}
              </time>
              <span>•</span>
              <span className="text-emerald-700 font-medium">100% Client-Side Verified</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 leading-tight mb-3">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl mb-4">
              {post.description}
            </p>

            {/* Tags list */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Interactive Table of Contents */}
          <TableOfContents />

          {/* Interactive Preset Sandbox (if provided) */}
          {post.interactivePreset && (
            <InteractiveToolWidget
              preset={post.interactivePreset}
              toolMeta={toolMeta}
            />
          )}

          {/* Rendered Markdown Body */}
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>

          {/* Integrated Interactive Tool Card (Monochromatic IDE Style) */}
          {toolMeta && (
            <div className="mt-12 p-5 sm:p-6 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Live Tool: {toolMeta.name}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
                    Client-Side Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
                  {toolMeta.description}
                </p>
              </div>

              <Link
                href={`/tools/${toolMeta.slug}`}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md text-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-none"
              >
                <span>Launch Tool Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Interactive FAQ Accordion */}
          {post.faqs && post.faqs.length > 0 && (
            <FaqAccordion faqs={post.faqs} />
          )}
        </article>

        {/* Related Guides Section */}
        {relatedPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Related Guides & References
              </h3>
              <Link href="/blog" className="text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors">
                view learning hub →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {relatedPosts.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="group bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                        {other.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {other.readTime}
                      </span>
                    </div>
                    <h4 className="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors text-sm tracking-tight flex items-center justify-between">
                      <span className="line-clamp-1">{other.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 shrink-0 ml-1" />
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {other.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
