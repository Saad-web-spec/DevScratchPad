import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FolderTree,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  CATEGORY_SLUGS,
  getCategoryBySlug,
  getToolsForCategory,
  getAllCategories,
} from "@/lib/tools/categories";

const SITE_URL = "https://www.devscratchpad.tech";

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
          url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.seoTitle} | DevScratchpad`,
      description: category.seoDescription,
      images: [
        {
          url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
          width: 1200,
          height: 630,
          alt: category.name,
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
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      {/* Top Visual Breadcrumb Bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-600 font-medium">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Link href="/developer-tools" className="hover:text-zinc-900 transition-colors">
              Developer Tools
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-bold truncate max-w-[200px] sm:max-w-none">
              {category.name}
            </span>
          </nav>

          <Link
            href="/developer-tools"
            className="flex items-center text-xs font-mono text-zinc-600 hover:text-zinc-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>All Categories</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-12">
        {/* Hero Section */}
        <section className="space-y-4 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span className="font-semibold">{category.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            {category.introHeading}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
            {category.introDescription}
          </p>

          {/* Key Stats Pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Client-Side</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Zero Server Transmission</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>{tools.length} Offline Tools</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
              <span>WebCrypto &amp; Wasm Powered</span>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-zinc-800">
              Category Tools ({tools.length})
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              Click any tool to launch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group bg-white border border-zinc-200 p-5 rounded-xl hover:border-zinc-400 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors text-base tracking-tight">
                      {tool.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-3">
                    {tool.description}
                  </p>

                  {/* How-To Workflow Tags */}
                  {tool.howToUse && tool.howToUse.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {tool.howToUse.slice(0, 2).map((step, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200/80 px-2 py-0.5 rounded-md truncate max-w-full font-mono"
                          title={step}
                        >
                          <span className="text-zinc-400 text-[10px] mr-1">#{sIdx + 1}</span>
                          <span className="truncate">{step}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>100% Offline</span>
                  <span className="text-blue-600 font-medium group-hover:underline">Open Tool →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Contextual AI Skill Studio Spotlight Banner */}
        <section className="border border-orange-200 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white p-6 sm:p-7 rounded-xl relative overflow-hidden shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-200/60 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                <span>AI Skill Studio Cross-Domain Spotlight</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                Recommended AI Agent Presets for {category.shortTitle}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
                Amplify your engineering workflows by pairing these offline developer tools with production-ready agent rulebooks and skill definitions.
              </p>
            </div>
            <Link
              href="/ai-skill-studio"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-all shrink-0 shadow-sm"
            >
              <span>Explore All Presets</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {category.aiStudioRecommendations.map((rec) => (
              <Link
                key={rec.link}
                href={rec.link}
                className="group bg-white/90 border border-orange-200/70 hover:border-orange-400 p-4 rounded-lg transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {rec.badge && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        {rec.badge}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5 ml-auto shrink-0" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-[11px] text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-zinc-100 text-[11px] font-medium text-orange-700">
                  Launch Rulebook →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Deep Technical Guide */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2 border-b border-zinc-100 pb-4">
            <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
              Technical Architecture &amp; Execution
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-zinc-700" />
              How {category.name} Operates Offline in Browser Memory
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-4xl">
              {category.deepGuide.overview}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-5 rounded-xl">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Runtime Security &amp; Isolation</span>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {category.deepGuide.technicalArchitecture}
              </p>
            </div>

            <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-5 rounded-xl">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-800 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-orange-600" />
                <span>Recommended Usage Workflows</span>
              </h3>
              <ul className="space-y-2 text-xs text-zinc-600 leading-relaxed">
                {category.deepGuide.usageWorkflows.map((workflow, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0 mt-0.5">
                      0{idx + 1}.
                    </span>
                    <span>{workflow}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-800 mb-3">
              Key Engineering Advantages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.keyBenefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5">
            <HelpCircle className="w-4 h-4 text-zinc-500" />
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Frequently Asked Questions ({category.shortTitle})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 p-5 rounded-xl space-y-2 shadow-2xs"
              >
                <h3 className="text-sm font-semibold text-zinc-900">
                  {faq.question}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal Link Equity: Other Category Hubs */}
        <section className="border-t border-zinc-200 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Explore Other Developer Tool Hubs</span>
            </h2>
            <Link
              href="/developer-tools"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Full Directory →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherCategories.map((other) => (
              <Link
                key={other.slug}
                href={`/developer-tools/${other.slug}`}
                className="p-3.5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                    <span>{other.shortTitle}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                    {other.toolSlugs.length} tools offline
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
