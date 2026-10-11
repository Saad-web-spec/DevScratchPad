import { Metadata } from "next";
import { RECIPE_REGISTRY } from "@/lib/recipes/registry";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { guide } from "@/components/seo/guideUi";
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
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Header with eyebrow label */}
        <div className="space-y-3 max-w-3xl">
          <p className={guide.eyebrow}>
            Developer Troubleshooting &amp; Verified Recipes
          </p>
          <h1 className={guide.h1}>
            Troubleshooting Recipes &amp; Quick Fixes
          </h1>
          <p className={guide.lead}>
            Curated solutions for common developer exceptions, terminal errors, and format conversions. Each recipe pairs an actionable explanation with a 100% offline browser utility.
          </p>
        </div>
        
        <RecipeDirectory recipes={recipes} />
      </main>
      <SiteFooter />
    </div>
  );
}
