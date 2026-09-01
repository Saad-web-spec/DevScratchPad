import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Wrench, Clock, Calendar, ShieldCheck, Terminal, BookOpen, Share2 } from "lucide-react";
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

  // Other posts for footer recommendations
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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-medium">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <Link href="/blog" className="hover:text-zinc-900 transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <span className="text-zinc-800 truncate max-w-[200px] sm:max-w-none">
            {post.title}
          </span>
        </div>

        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-xs font-semibold text-zinc-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to all guides
        </Link>

        {/* Article Container */}
        <article className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm mb-12">
          {/* Article Header Metadata */}
          <header className="border-b border-zinc-100 pb-8 mb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mb-4">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200/60">
                Developer Reference
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                5 min read
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                <ShieldCheck className="w-3 h-3" />
                100% Client-Side
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-3">
              {post.title}
            </h1>

            <p className="text-base text-zinc-600 leading-relaxed">
              {post.description}
            </p>
          </header>

          {/* Rendered Markdown Body with custom high-density .prose typography */}
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>

          {/* Interactive Related Tool CTA Card */}
          {toolMeta && (
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      Try the {toolMeta.name} Online
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Free & Offline
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-md">
                    {toolMeta.description}
                  </p>
                </div>
              </div>

              <Link
                href={`/tools/${toolMeta.slug}`}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-all shadow-none whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <span>Open Tool</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </article>

        {/* Read More / Next Guides Section */}
        {otherPosts.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              More Developer Guides & References
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherPosts.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="group bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors text-sm mb-1.5">
                      {other.title}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {other.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 text-xs font-semibold text-blue-600">
                    <span>Read Article</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
