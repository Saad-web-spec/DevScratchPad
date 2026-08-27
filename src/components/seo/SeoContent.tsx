import { ShieldCheck } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/registry";

export function SeoContent({ tool }: { tool: ToolMeta }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `${tool.name} Online`,
    "url": `https://tools.saadengineer.works/${tool.slug}`,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": tool.description,
  };

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-[#27272A] max-w-4xl pb-24 mx-auto px-4 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="mt-6 mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {tool.name} Online
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
        {tool.description}
      </p>

      <h2 className="mt-6 mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        How to use {tool.shortName || tool.name}
      </h2>

      <ol className="list-decimal pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
        {tool.howToUse.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      {tool.edgeCases.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Edge Cases &amp; Limitations
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
            {tool.edgeCases.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}

      {tool.shortcuts.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Keyboard Shortcuts
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
            {tool.shortcuts.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 flex items-start gap-3 p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            100% Client-Side Privacy
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All inputs are processed entirely inside your browser&apos;s memory
            using JavaScript. No data is ever transmitted to any server. Your
            tokens, JSON payloads, cURL commands, and timestamps never leave
            your machine.
          </p>
        </div>
      </div>
    </div>
  );
}
