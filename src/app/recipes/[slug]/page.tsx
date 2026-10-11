import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeMeta, RECIPE_SLUGS, RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { getToolMeta } from "@/lib/tools/registry";
import { Wrench, ArrowRight, ChevronRight, Home, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GuideCta, SectionHeading, guide } from "@/components/seo/guideUi";

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

  const solutionSteps = (recipe.solutionSteps && recipe.solutionSteps.length > 0)
    ? recipe.solutionSteps
    : [
        recipe.solution,
        ...(recipe.codeSnippet ? ["Apply the verified code pattern to eliminate the runtime error."] : []),
        ...(targetTool ? [`Verify your fix offline using the ${targetTool.name} tool.`] : [])
      ];

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE_URL}/recipes/${slug}#howto`,
    "name": recipe.title,
    "description": recipe.seoDescription,
    "image": `${SITE_URL}/recipes/${slug}/opengraph-image`,
    "totalTime": "PT5M",
    ...(targetTool ? {
      "tool": [
        {
          "@type": "HowToTool",
          "name": targetTool.name,
          "url": `${SITE_URL}/tools/${targetTool.slug}`
        }
      ]
    } : {}),
    "step": solutionSteps.map((step, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "name": step.includes(":") ? step.split(":")[0].trim() : step.replace(/\.$/, ""),
      "text": step,
      "url": `${SITE_URL}/recipes/${slug}#step-${idx + 1}`
    }))
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-16 sm:pt-8">

        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
          <nav className="flex min-w-0 items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/" aria-label="Home" className="inline-flex min-h-10 items-center hover:text-zinc-900 transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-300" />
            <Link href="/recipes" className="inline-flex min-h-10 items-center font-medium text-zinc-700 hover:text-zinc-900 transition-colors">
              Recipes
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 hidden sm:inline" />
            <span className="text-zinc-500 truncate max-w-xs hidden sm:inline">{recipe.title}</span>
          </nav>

          <Link
            href="/recipes"
            className="inline-flex min-h-10 shrink-0 items-center font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            All Recipes
          </Link>
        </div>

        {/* Header Section with eyebrow and tool link */}
        <header className="space-y-4 border-t border-zinc-200 pt-8 mt-2 pb-10 sm:pb-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={guide.eyebrow}>
              Verified Developer Solution • 100% Offline
            </span>
            {targetTool && (
              <Link
                href={`/tools/${targetTool.slug}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
              >
                <Wrench className="w-3 h-3 text-zinc-400" />
                <span>{targetTool.name}</span>
              </Link>
            )}
          </div>

          <h1 className={`${guide.h1} leading-tight`}>
            {recipe.title}
          </h1>

          <p className={`${guide.lead} max-w-3xl`}>
            {recipe.seoDescription}
          </p>
        </header>

        {/* 2-Column or Stacked Problem & Solution Matrix */}
        <div className="grid grid-cols-1 gap-10 border-t border-zinc-200 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12">
          {/* Column 1: The Problem (Error Analysis) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
                <AlertCircle className="w-4 h-4 text-zinc-400" />
                The Problem (Error Root Cause)
              </h2>
              <span className={guide.chip}>
                Exception
              </span>
            </div>
            <p className={guide.body}>
              {recipe.problem}
            </p>
            <p className="text-xs text-zinc-400">
              Identified via runtime validation &amp; stack traces
            </p>
          </section>

          {/* Column 2: The Solution (Verified Fix) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
                <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                The Solution (Step-by-Step Fix)
              </h2>
              <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                Verified
              </span>
            </div>
            <p className={guide.body}>
              {recipe.solution}
            </p>
            {solutionSteps && solutionSteps.length > 0 && (
              <div className="pt-2">
                <span className={`${guide.eyebrow} block mb-1`}>
                  Action Steps:
                </span>
                <ol className="border-b border-zinc-200">
                  {solutionSteps.map((step, idx) => (
                    <li key={idx} id={`step-${idx + 1}`} className="flex items-start gap-3 border-t border-zinc-200 py-3 scroll-mt-24">
                      <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-white text-[11px] font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-zinc-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Deterministic, non-destructive resolution</span>
            </p>
          </section>
        </div>

        {/* Code Example Snippet with Styled Terminal Box */}
        {recipe.codeSnippet && (
          <section className="space-y-1 border-t border-zinc-200 py-10 sm:py-12">
            <SectionHeading
              title="Code Standard: Bad Pattern vs Verified Fix"
              action={<span className="text-xs text-zinc-400">Live Syntax</span>}
            />
            <CodeBlock code={recipe.codeSnippet} title="Anti-Pattern vs Verified Fix" />
          </section>
        )}

        {/* Interactive Tool CTA */}
        {targetTool && (
          <section className="border-t border-zinc-200 py-10 sm:py-12">
            <GuideCta
              title={`Test and resolve this using ${targetTool.name}`}
              titleAs="h2"
              description="Execute directly in your browser memory. Zero API keys, zero network tracking, completely client-side."
              href={`/tools/${targetTool.slug}`}
              label={`Launch ${targetTool.name}`}
            />
          </section>
        )}

        {/* FAQ Section with hairline rows */}
        <section className="space-y-4 border-t border-zinc-200 py-10 sm:py-12">
          <h2 className={guide.h2}>
            Frequently Asked Questions
          </h2>
          <div>
            {recipe.faq.map((item, i) => (
              <div key={i} className="border-t border-zinc-200 py-4 space-y-1.5">
                <h3 className={`${guide.h3} flex items-start gap-2`}>
                  <span className="font-mono text-zinc-400">Q:</span>
                  <span>{item.question}</span>
                </h3>
                <p className={`${guide.body} pl-6`}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Recipes Section */}
        {relatedRecipes.length > 0 && (
          <section className="space-y-5 border-t border-zinc-200 pt-10 sm:pt-12">
            <SectionHeading
              title="Related Troubleshooting Guides"
              action={
                <Link href="/recipes" className={guide.link}>
                  View Directory <ArrowRight className="w-4 h-4 text-zinc-400" />
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedRecipes.map((related) => (
                <Link
                  key={related.slug}
                  href={`/recipes/${related.slug}`}
                  className={`${guide.card} justify-between`}
                >
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs text-zinc-500">
                      {related.targetToolSlug}
                    </span>
                    <h3 className="text-sm font-medium leading-snug text-zinc-900 line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                  <span className="mt-3 flex items-center gap-1 text-xs font-medium text-zinc-900">
                    Read Guide <ArrowRight className="w-3.5 h-3.5 text-zinc-400 transition-colors group-hover:text-zinc-900" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(howToSchema).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
