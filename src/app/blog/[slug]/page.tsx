import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { getBlogPost, BLOG_SLUGS, BLOG_POSTS } from "@/lib/blog/posts";
import { getToolMeta } from "@/lib/tools/registry";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { InteractiveToolWidget } from "@/components/blog/InteractiveToolWidget";
import { FaqAccordion } from "@/components/blog/FaqAccordion";
import { CodeBlockEnricher } from "@/components/blog/CodeBlockEnricher";
import { GuideCta, guide } from "@/components/seo/guideUi";

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

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
    title: post.seoTitle,
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
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${post.title} — DevScratchpad Technical Guide`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.seoTitle} | DevScratchpad`,
      description: post.seoDescription,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${post.title} — DevScratchpad Technical Guide`,
        },
      ],
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
        />
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start relative">

          {/* Left Column: Main Content */}
          <div className="flex-1 w-full min-w-0">
            {/* Minimalist Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-zinc-400">
              <Link href="/" className="inline-flex min-h-10 items-center text-zinc-500 hover:text-zinc-900 transition-colors sm:min-h-0">
                root
              </Link>
              <span>/</span>
              <Link href="/blog" className="inline-flex min-h-10 items-center text-zinc-500 hover:text-zinc-900 transition-colors sm:min-h-0">
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
              className="mt-2 inline-flex min-h-10 items-center text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <span>← Back to Learning Hub</span>
            </Link>

            {/* Main Article Document */}
            <article className="relative mt-6 mb-12">
              {/* Inject the Client Component to enrich code blocks with Copy buttons */}
              <CodeBlockEnricher />

              {/* Article Header Metadata */}
              <header className="border-b border-zinc-200 pb-8 mb-8">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-zinc-500 mb-4">
                  <span className={guide.chip}>
                    {post.category.toUpperCase()}
                  </span>
                  {post.type === "cheat-sheet" && (
                    <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                      CHEAT SHEET
                    </span>
                  )}
                  <span className="text-zinc-300">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {post.readTime}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span>{post.difficulty}</span>
                  <span className="text-zinc-300">•</span>
                  <time suppressHydrationWarning>
                    {formatUtcDate(post.publishedAt)}
                  </time>
                  <span className="text-zinc-300">•</span>
                  <span className="font-medium text-zinc-700">100% Client-Side Verified</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[2.125rem] font-semibold tracking-tight text-zinc-900 leading-tight mb-3">
                  {post.title}
                </h1>

                <p className={`${guide.lead} max-w-3xl mb-4`}>
                  {post.description}
                </p>

                {/* Tags list */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Mobile Table of Contents */}
              <div className="block lg:hidden">
                <TableOfContents isMobile />
              </div>

          {/* Interactive Preset Sandbox (if provided) */}
          {post.interactivePreset && (
            <InteractiveToolWidget
              preset={post.interactivePreset}
              toolMeta={toolMeta}
            />
          )}

          {/* Rendered Markdown Body */}
          <div className="prose max-w-none [&_table]:block [&_table]:overflow-x-auto!">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>

          {/* Integrated Interactive Tool Card */}
          {toolMeta ? (
            <div className="mt-12">
              <GuideCta
                title={`Live Tool: ${toolMeta.name}`}
                badge="Client-Side Engine"
                description={toolMeta.description}
                href={`/tools/${toolMeta.slug}`}
                label="Launch Tool Workspace"
              />
            </div>
          ) : null}

          {/* Interactive FAQ Accordion */}
          {post.faqs && post.faqs.length > 0 && (
            <FaqAccordion faqs={post.faqs} />
          )}
        </article>

        {/* Related Guides Section */}
        {relatedPosts.length > 0 && (
          <section className="mb-12 border-t border-zinc-200 pt-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <h3 className={guide.h2}>
                Related Guides & References
              </h3>
              <Link href="/blog" className={guide.link}>
                view learning hub →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedPosts.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className={guide.card}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-500">
                        {other.category}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs text-zinc-400">
                        {other.readTime}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-[15px] font-medium text-zinc-900 tracking-tight flex items-start justify-between gap-3">
                      <span className="line-clamp-2">{other.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors shrink-0 mt-0.5" />
                    </h4>
                    <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {other.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
          </div> {/* End Left Column */}

          {/* Right Column: Sticky Sidebar TOC */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-20 self-start">
            <TableOfContents />
          </div>

        </div> {/* End Flex Container */}
      </main>

      <SiteFooter />
    </div>
  );
}
