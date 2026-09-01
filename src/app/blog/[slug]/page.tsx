import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Terminal, ArrowRight, ArrowUpRight } from "lucide-react";
import { marked } from "marked";
import { getBlogPost, BLOG_SLUGS, BLOG_POSTS } from "@/lib/blog/posts";
import { getToolMeta } from "@/lib/tools/registry";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const SITE_URL = "https://www.devscratchpad.tech";

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
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.seoTitle} | DevScratchpad`,
      description: post.seoDescription,
      images: [`${SITE_URL}/opengraph-image`],
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
  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.seoDescription,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "image": `${SITE_URL}/opengraph-image`,
    "author": {
      "@type": "Organization",
      "name": "DevScratchpad"
    },
    "publisher": {
      "@type": "Organization",
      "name": "DevScratchpad",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/favicon.ico`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Minimalist Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            root
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-zinc-900 transition-colors">
            guides
          </Link>
          <span>/</span>
          <span className="text-zinc-800 truncate max-w-[200px] sm:max-w-none">
            {post.slug}
          </span>
        </div>

        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span>all_guides.md</span>
        </Link>

        {/* Main Article Document Card */}
        <article className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-10 md:p-12 mb-12">
          {/* Article Header Metadata */}
          <header className="border-b border-zinc-200 pb-6 mb-8">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-zinc-500 mb-4">
              <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded font-medium">
                REFERENCE GUIDE
              </span>
              <span>•</span>
              <time>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <span>•</span>
              <span>100% Client-Side Verified</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 leading-tight mb-3">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl">
              {post.description}
            </p>
          </header>

          {/* Rendered Markdown Body */}
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>

          {/* Integrated Interactive Tool Card (Monochromatic IDE Style) */}
          {toolMeta && (
            <div className="mt-12 p-5 sm:p-6 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Live Tool: {toolMeta.name}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
                    Client-Side
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
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </article>

        {/* More Guides Section */}
        {otherPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                More Developer Guides
              </h3>
              <Link href="/blog" className="text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors">
                view all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherPosts.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="group bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-400 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
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
