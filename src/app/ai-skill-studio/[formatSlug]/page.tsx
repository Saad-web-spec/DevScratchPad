import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileCode2,
  FolderTree,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
} from "lucide-react";
import { getAllFormatHubs, getFormatHub } from "../../claude-skills/lib/formatHubs";
import { getPresetsByFormat } from "../../claude-skills/lib/presetRegistry";

export function generateStaticParams() {
  return getAllFormatHubs().map((hub) => ({
    formatSlug: hub.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}): Promise<Metadata> {
  const { formatSlug } = await params;
  const hub = getFormatHub(formatSlug);
  if (!hub) return { title: "Format Not Found" };

  return {
    title: hub.seoTitle,
    description: hub.seoDescription,
    openGraph: {
      title: `${hub.seoTitle} | DevScratchpad`,
      description: hub.seoDescription,
      type: "website",
      siteName: "DevScratchpad",
      locale: "en_US",
      url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
      images: [
        {
          url: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          secureUrl: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${hub.seoTitle} — 13 Formats & 5-Layer AI Agent Suite — DevScratchpad`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${hub.seoTitle} | DevScratchpad`,
      description: hub.seoDescription,
      images: [
        {
          url: "https://www.devscratchpad.tech/ai-skill-studio/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${hub.seoTitle} — 13 Formats & 5-Layer AI Agent Suite — DevScratchpad`,
        },
      ],
    },
    alternates: {
      canonical: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
    },
  };
}

export default async function FormatHubPage({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}) {
  const { formatSlug } = await params;
  const hub = getFormatHub(formatSlug);

  if (!hub) {
    notFound();
  }

  const presets = getPresetsByFormat(formatSlug);
  const allHubs = getAllFormatHubs().filter((h) => h.slug !== formatSlug);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#webpage`,
        url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
        name: hub.heroHeading,
        description: hub.seoDescription,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: presets.length,
          itemListElement: presets.map((p, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}/${p.presetSlug}`,
            name: p.title,
            description: p.description,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.devscratchpad.tech",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "AI Skill Studio",
            item: "https://www.devscratchpad.tech/ai-skill-studio",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: hub.name,
            item: `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `https://www.devscratchpad.tech/ai-skill-studio/${hub.slug}#faq`,
        mainEntity: hub.faqs.map((faq) => ({
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
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
      />

      {/* Top Breadcrumb Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-600 font-medium">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link href="/ai-skill-studio" className="hover:text-zinc-900 transition-colors">
              AI Skill Studio
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-orange-600 font-bold">{hub.name}</span>
          </nav>

          <Link
            href="/ai-skill-studio"
            className="flex items-center text-xs font-mono text-zinc-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            All Formats
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
        {/* Hero Section */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span className="font-semibold">Pillar Specification &amp; Hub Directory</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900">
              {hub.heroHeading}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 max-w-3xl leading-relaxed">
              {hub.heroSubheading}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/ai-skill-studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 transition-colors shadow-xs"
            >
              <FileCode2 className="w-4 h-4" />
              Open Blank Studio Editor
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 bg-white border border-zinc-200 px-3.5 py-2 rounded-lg shadow-2xs">
              <FolderTree className="w-4 h-4 text-orange-600" />
              <span>Target: <code className="text-zinc-900 font-bold">{hub.targetDir}{hub.targetFile}</code></span>
            </div>
          </div>
        </section>

        {/* Overview & Architecture Box */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
              01 / SPECIFICATION &amp; RUNTIME BEHAVIOR
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              How {hub.name} Operates in Production
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-4xl">
              {hub.overview}
            </p>
          </div>

          {/* Syntax highlights */}
          {hub.syntaxHighlights && hub.syntaxHighlights.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {hub.syntaxHighlights.map((item, idx) => (
                <div key={idx} className="border border-zinc-200 bg-zinc-50/60 rounded-xl p-4.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900">{item.title}</span>
                    <span className="font-mono text-[10px] text-zinc-500 font-semibold">Spec Syntax</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{item.explanation}</p>
                  <pre className="text-xs font-mono bg-zinc-900 p-3 rounded-md border border-zinc-800 overflow-x-auto text-orange-200 leading-relaxed">
                    <code>{item.codeSample}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Directory & Placement Specs */}
        <section className="space-y-4">
          <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
            02 / REPOSITORY PLACEMENT
          </div>
          <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-200 bg-white shadow-2xs">
            {hub.filePlacementGuide.map((guide, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded font-bold">
                      {guide.path}
                    </code>
                    <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold">{guide.scope}</span>
                  </div>
                  <p className="text-xs text-zinc-600">{guide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spokes Matrix: Ready-to-Use Presets for this Format */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
                03 / PRESET SPOKE MATRIX
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-orange-600" />
                Available Tech Stack Presets ({presets.length})
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Click any tech stack below to open the client-side editor preloaded with this verified configuration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <Link
                key={preset.presetSlug}
                href={`/ai-skill-studio/${hub.slug}/${preset.presetSlug}`}
                className="group border border-zinc-200 hover:border-orange-500 rounded-xl p-5 bg-white hover:bg-orange-50/20 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 group-hover:bg-orange-100 group-hover:text-orange-800 transition-colors">
                      {preset.category}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 group-hover:text-orange-600 flex items-center gap-1 font-semibold">
                      Launch <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-700 transition-colors">
                    {preset.techName}
                  </h3>
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {preset.keyRules && preset.keyRules.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">Enforced Invariant:</span>
                    <p className="text-[11px] text-zinc-700 line-clamp-1 italic font-medium">
                      &ldquo;{preset.keyRules[0]}&rdquo;
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Best Practices */}
        <section className="space-y-4">
          <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
            04 / BEST PRACTICES
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {hub.bestPractices.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-4 rounded-xl border border-zinc-200 bg-white shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#ea580c] mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sibling Format Hubs (Lateral Route Directory Chips) */}
        <section className="space-y-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-700 uppercase tracking-wider font-bold">
              Other Format Directories
            </span>
            <span className="text-[11px] font-mono text-zinc-500 font-medium">Hub Network</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {allHubs.map((otherHub) => (
              <Link
                key={otherHub.slug}
                href={`/ai-skill-studio/${otherHub.slug}`}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 hover:border-orange-500 hover:bg-orange-50/20 transition shadow-2xs group"
              >
                <div className="truncate pr-2">
                  <span className="text-[10px] font-mono text-orange-700 font-bold uppercase block">{otherHub.badge}</span>
                  <span className="font-mono text-xs text-zinc-800 group-hover:text-orange-700 truncate font-semibold">/{otherHub.slug}</span>
                </div>
                <span className="text-zinc-400 group-hover:text-orange-600 text-xs transition-transform group-hover:translate-x-0.5 shrink-0">&rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section */}
        {hub.faqs && hub.faqs.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-zinc-200">
            <div className="text-xs font-mono tracking-wider text-orange-700 uppercase font-semibold">
              05 / FREQUENTLY ASKED QUESTIONS
            </div>
            <div className="space-y-3">
              {hub.faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-2 shadow-2xs">
                  <h3 className="text-sm font-bold text-zinc-900">{faq.question}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
