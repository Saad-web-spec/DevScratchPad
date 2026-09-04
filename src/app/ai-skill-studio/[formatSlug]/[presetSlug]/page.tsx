import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRESET_ROUTES, getPresetRouteMetadata } from "../../../claude-skills/lib/presetRegistry";
import { AiSkillStudioSeoContent } from "../../AiSkillStudioSeoContent";
import { ClaudeSkillsClient } from "../../../claude-skills/ClaudeSkillsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return PRESET_ROUTES.map((route) => ({
    formatSlug: route.formatSlug,
    presetSlug: route.presetSlug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ formatSlug: string; presetSlug: string }> }): Promise<Metadata> {
  const { formatSlug, presetSlug } = await params;
  const metadata = getPresetRouteMetadata(formatSlug, presetSlug);
  if (!metadata) {
    return { title: "Not Found" };
  }
  return metadata;
}

export default async function ProgrammaticPresetPage({ params }: { params: Promise<{ formatSlug: string; presetSlug: string }> }) {
  const { formatSlug, presetSlug } = await params;
  const route = PRESET_ROUTES.find((r) => r.formatSlug === formatSlug && r.presetSlug === presetSlug);

  if (!route) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": route.title,
    "description": route.description,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-orange-500/30 selection:text-orange-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Top Banner Navigation */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/ai-skill-studio" className="flex items-center text-sm text-zinc-400 hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Formats
          </Link>
          <div className="text-sm text-zinc-500 font-medium hidden sm:block">
            {route.title}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <ClaudeSkillsClient initialFormat={route.format} initialPresetId={route.presetId} />
      </div>

      {/* SEO Content Section for Search Engines */}
      <AiSkillStudioSeoContent />
    </div>
  );
}
