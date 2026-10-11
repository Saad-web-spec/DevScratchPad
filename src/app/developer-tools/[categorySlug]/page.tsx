import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  FolderTree,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionHeading, ToolRow, guide } from "@/components/seo/guideUi";
import {
  CATEGORY_SLUGS,
  getCategoryBySlug,
  getToolsForCategory,
  getAllCategories,
} from "@/lib/tools/categories";

const SITE_URL = "https://www.devscratchpad.tech";

const statPillClass =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({
    categorySlug: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  const canonicalUrl = `${SITE_URL}/developer-tools/${category.slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.seoTitle} | DevScratchpad`,
      description: category.seoDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "DevScratchpad",
      images: [
        {
          url: "https://www.devscratchpad.tech/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${category.name} — Free Offline Developer Tools | DevScratchpad`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.seoTitle} | DevScratchpad`,
      description: category.seoDescription,
      images: [
        {
          url: "https://www.devscratchpad.tech/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${category.name} — Free Offline Developer Tools | DevScratchpad`,
        },
      ],
    },
  };
}

export default async function CategoryHubPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const tools = getToolsForCategory(categorySlug);
  const otherCategories = getAllCategories().filter((c) => c.slug !== categorySlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/developer-tools/${category.slug}#webpage`,
        url: `${SITE_URL}/developer-tools/${category.slug}`,
        name: category.seoTitle,
        description: category.seoDescription,
        publisher: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "DevScratchpad",
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: tools.length,
          itemListElement: tools.map((tool, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `${SITE_URL}/tools/${tool.slug}`,
            name: tool.name,
            description: tool.description,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/developer-tools/${category.slug}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Developer Tools",
            item: `${SITE_URL}/developer-tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: `${SITE_URL}/developer-tools/${category.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/developer-tools/${category.slug}#faq`,
        mainEntity: category.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      {/* Top Visual Breadcrumb Bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex min-h-11 items-center justify-between gap-4">
          <nav className="flex min-w-0 items-center gap-1.5 text-xs sm:text-[13px] text-zinc-500 font-medium">
            <Link href="/" className="inline-flex min-h-10 shrink-0 items-center hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <Link href="/developer-tools" className="inline-flex min-h-10 shrink-0 items-center hover:text-zinc-900 transition-colors">
              Developer Tools
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="min-w-0 truncate text-zinc-900">
              {category.name}
            </span>
          </nav>

          <Link
            href="/developer-tools"
            className="hidden min-h-10 shrink-0 items-center text-xs sm:text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors sm:inline-flex"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>All Categories</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14">
        {/* Hero Section */}
        <section className="space-y-3 pb-10 sm:pb-12">
          <span className={`${guide.eyebrow} block`}>
            {category.badge}
          </span>

          <h1 className={`${guide.h1} max-w-3xl`}>
            {category.introHeading}
          </h1>

          <p className={`${guide.lead} max-w-3xl`}>
            {category.introDescription}
          </p>

          {/* Key Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className={statPillClass}>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>100% Client-Side</span>
            </div>
            <div className={statPillClass}>
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Zero Server Transmission</span>
            </div>
            <div className={statPillClass}>
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>{tools.length} Offline Tools</span>
            </div>
            <div className={statPillClass}>
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>WebCrypto &amp; Wasm Powered</span>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className={`${guide.section} space-y-5`}>
          <SectionHeading
            title={`Category Tools (${tools.length})`}
            action={<span className="text-[13px] text-zinc-400">Click any tool to launch</span>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className={`${guide.card} justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-sm sm:text-[15px] font-medium text-zinc-900 tracking-tight">
                      {tool.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 shrink-0 transition-colors" />
                  </div>
                  <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                    {tool.description}
                  </p>

                  {/* How-To Workflow Tags */}
                  {tool.howToUse && tool.howToUse.length > 0 && (
                    <ul className="space-y-1 mb-3.5">
                      {tool.howToUse.slice(0, 2).map((step, sIdx) => (
                        <li
                          key={sIdx}
                          className="flex items-baseline gap-1.5 text-xs text-zinc-500 max-w-full"
                          title={step}
                        >
                          <span className="text-zinc-300 font-mono text-[11px] shrink-0">#{sIdx + 1}</span>
                          <span className="truncate">{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                  <span>100% Offline</span>
                  <span className="font-medium text-zinc-900">Open Tool →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Deep Technical Guide */}
        <section className={`${guide.section} space-y-8`}>
          <div className="space-y-2">
            <div className={guide.eyebrow}>
              Technical Architecture &amp; Execution
            </div>
            <h2 className={guide.h2}>
              How {category.name} Operates Offline in Browser Memory
            </h2>
            <p className={`${guide.body} max-w-3xl`}>
              {category.deepGuide.overview}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-2">
              <h3 className={`${guide.h3} flex items-center gap-2`}>
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>Runtime Security &amp; Isolation</span>
              </h3>
              <p className={guide.body}>
                {category.deepGuide.technicalArchitecture}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className={`${guide.h3} flex items-center gap-2`}>
                <FolderTree className="w-4 h-4 text-zinc-400" />
                <span>Recommended Usage Workflows</span>
              </h3>
              <ul className="border-b border-zinc-200">
                {category.deepGuide.usageWorkflows.map((workflow, idx) => (
                  <li key={idx} className="flex items-start gap-3 border-t border-zinc-200 py-2.5 text-sm leading-relaxed text-zinc-600">
                    <span className="text-xs font-mono text-zinc-400 shrink-0 mt-0.5">
                      0{idx + 1}.
                    </span>
                    <span>{workflow}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="space-y-2">
            <h3 className={guide.h3}>
              Key Engineering Advantages
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12">
              {category.keyBenefits.map((benefit, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 border-t border-zinc-200 py-2.5 text-sm leading-relaxed text-zinc-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQs Section */}
        <section className={`${guide.section} space-y-4`}>
          <h2 className={guide.h2}>
            Frequently Asked Questions ({category.shortTitle})
          </h2>

          <div className="max-w-3xl">
            {category.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border-t border-zinc-200 py-4 space-y-1.5"
              >
                <h3 className={guide.h3}>
                  {faq.question}
                </h3>
                <p className={guide.body}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal Link Equity: Other Category Hubs */}
        <section className="border-t border-zinc-200 pt-10 sm:pt-12 space-y-4">
          <SectionHeading
            title="Explore Other Developer Tool Hubs"
            action={
              <Link href="/developer-tools" className={guide.link}>
                Full Directory →
              </Link>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
            {otherCategories.map((other) => (
              <ToolRow
                key={other.slug}
                href={`/developer-tools/${other.slug}`}
                title={other.shortTitle}
                description={`${other.toolSlugs.length} tools offline`}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
