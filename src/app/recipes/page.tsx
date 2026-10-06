import { Metadata } from "next";
import { RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RecipeDirectory } from "./RecipeDirectory";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Developer Troubleshooting Recipes & Guides",
  description: "A curated registry of high-intent, deeply realistic developer troubleshooting recipes and conversion guides.",
  alternates: {
    canonical: `${SITE_URL}/recipes`,
  },
  openGraph: {
    title: "Developer Troubleshooting Recipes & Guides | DevScratchpad",
    description: "A curated registry of high-intent, deeply realistic developer troubleshooting recipes and conversion guides.",
    url: `${SITE_URL}/recipes`,
    type: "website",
    siteName: "DevScratchpad",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Developer Troubleshooting Recipes & Guides — DevScratchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Developer Troubleshooting Recipes & Guides | DevScratchpad",
    description: "A curated registry of high-intent, deeply realistic developer troubleshooting recipes and conversion guides.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Developer Troubleshooting Recipes & Guides — DevScratchpad",
      },
    ],
  },
};

export default function RecipesIndexPage() {
  const recipes = Object.values(RECIPE_REGISTRY);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Developer Troubleshooting Recipes & Guides",
    url: `${SITE_URL}/recipes`,
    description:
      "Curated solutions for common developer exceptions, terminal errors, and format conversions.",
    publisher: {
      "@type": "Organization",
      name: "DevScratchpad",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Developer Troubleshooting Recipes",
      numberOfItems: recipes.length,
      itemListElement: recipes.map((recipe, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: recipe.title,
        description: recipe.problem,
        url: `${SITE_URL}/recipes/${recipe.slug}`,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        {/* Header with pill badge */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span>Developer Troubleshooting &amp; Verified Recipes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            Troubleshooting Recipes &amp; Quick Fixes
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Curated solutions for common developer exceptions, terminal errors, and format conversions. Each recipe pairs an actionable explanation with a 100% offline browser utility.
          </p>
        </div>
        
        <RecipeDirectory recipes={recipes} />
      </main>
      <SiteFooter />
    </div>
  );
}
