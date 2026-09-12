import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeMeta, RECIPE_SLUGS, RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { getToolMeta } from "@/lib/tools/registry";
import { Wrench, ArrowRight, ChevronRight, Home, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SiteFooter } from "@/components/layout/SiteFooter";

const SITE_URL = "https://www.devscratchpad.tech";

export async function generateStaticParams() {
  return RECIPE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeMeta(slug);

  if (!recipe) {
    return { title: "Recipe Not Found" };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: recipe.seoTitle,
    description: recipe.seoDescription,
    openGraph: {
      title: `${recipe.seoTitle} | DevScratchpad`,
      description: recipe.seoDescription,
      url: `${SITE_URL}/recipes/${slug}`,
      type: "article",
      siteName: "DevScratchpad",
      images: [
        {
          url: `${SITE_URL}/recipes/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${recipe.title} — DevScratchpad`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${recipe.seoTitle} | DevScratchpad`,
      description: recipe.seoDescription,
      images: [
        {
          url: `${SITE_URL}/recipes/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${recipe.title} — DevScratchpad`,
        },
      ],
    },
    alternates: {
      canonical: `${SITE_URL}/recipes/${slug}`,
    },
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = getRecipeMeta(slug);

  if (!recipe) {
    notFound();
  }

  const targetTool = getToolMeta(recipe.targetToolSlug);
  const relatedRecipes = Object.values(RECIPE_REGISTRY).filter(r => r.targetToolSlug === recipe.targetToolSlug && r.slug !== slug).slice(0, 3);

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Recipes",
        "item": `${SITE_URL}/recipes`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": recipe.title,
        "item": `${SITE_URL}/recipes/${slug}`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": recipe.faq.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">
        
        {/* Navigation / Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-500 border-b border-zinc-200/80 pb-4">
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-zinc-900 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <Link href="/recipes" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
              Recipes
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 hidden sm:inline" />
            <span className="text-zinc-700 font-medium truncate max-w-xs hidden sm:inline">{recipe.title}</span>
          </nav>

          <Link
            href="/recipes"
            className="flex items-center text-xs font-mono text-zinc-600 hover:text-orange-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            All Recipes
          </Link>
        </div>

        {/* Header Section with AI Studio Style Pill Badge */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
              <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
              <span>Verified Developer Solution • 100% Offline</span>
            </div>
            {targetTool && (
              <Link
                href={`/tools/${targetTool.slug}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors"
              >
                <Wrench className="w-3 h-3 text-orange-600" />
                <span>{targetTool.name}</span>
              </Link>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            {recipe.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl">
            {recipe.seoDescription}
          </p>
        </header>

        {/* 2-Column or Stacked Problem & Solution Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Column 1: The Problem (Error Analysis) */}
          <section className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 space-y-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/80 pb-3">
                <span className="flex items-center gap-2 text-rose-800 font-semibold text-xs font-mono uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  The Problem (Error Root Cause)
                </span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 uppercase font-semibold">
                  Exception
                </span>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed font-sans">
                {recipe.problem}
              </p>
            </div>
            <div className="pt-3 border-t border-rose-200/60 text-[11px] font-mono text-rose-700 flex items-center gap-1.5">
              <span>Identified via runtime validation &amp; stack traces</span>
            </div>
          </section>

          {/* Column 2: The Solution (Verified Fix) */}
          <section className="rounded-xl border border-orange-200 bg-orange-50/50 p-6 space-y-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                <span className="flex items-center gap-2 text-orange-950 font-semibold text-xs font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  The Solution (Step-by-Step Fix)
                </span>
                <span className="text-[10px] font-mono text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-200 uppercase font-semibold">
                  Verified
                </span>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed font-sans">
                {recipe.solution}
              </p>
            </div>
            <div className="pt-3 border-t border-orange-200 text-[11px] font-mono text-orange-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deterministic, non-destructive resolution</span>
            </div>
          </section>
        </div>

        {/* Code Example Snippet with Styled Terminal Box */}
        {recipe.codeSnippet && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Code Standard: Bad Pattern vs Verified Fix
              </h2>
              <span className="text-xs font-mono text-zinc-500">Live Syntax</span>
            </div>
            <CodeBlock code={recipe.codeSnippet} title="Anti-Pattern vs Verified Fix" />
          </section>
        )}

        {/* Branded Interactive Tool CTA Card */}
        {targetTool && (
          <section className="bg-gradient-to-br from-orange-50 via-white to-orange-50/60 p-8 sm:p-10 rounded-2xl border border-orange-200 text-center space-y-4 shadow-xs">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-1">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                Test and resolve this using {targetTool.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600">
                Execute directly in your browser memory. Zero API keys, zero network tracking, completely client-side.
              </p>
            </div>
            <div>
              <Link 
                href={`/tools/${targetTool.slug}`}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-xs hover:shadow-sm text-sm"
              >
                <span>Launch {targetTool.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* FAQ Section with Clean Accordion-Style White Cards */}
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-3">
            {recipe.faq.map((item, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-900 flex items-start gap-2">
                  <span className="text-orange-600 font-mono font-bold">Q:</span>
                  <span>{item.question}</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pl-6">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Recipes Section */}
        {relatedRecipes.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Related Troubleshooting Guides
              </h2>
              <Link href="/recipes" className="text-xs font-mono text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
                View Directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedRecipes.map((related) => (
                <Link
                  key={related.slug}
                  href={`/recipes/${related.slug}`}
                  className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded">
                      {related.targetToolSlug}
                    </span>
                    <h3 className="font-semibold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                  <span className="mt-3 text-xs text-orange-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read Guide <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbsSchema).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
