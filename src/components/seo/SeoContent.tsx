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
    <section className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-6 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
        {tool.name} Online
      </h1>
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        How to use {tool.shortName}
      </h2>

      <ul className="space-y-2 mb-6">
        {tool.howToUse.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            {step}
          </li>
        ))}
      </ul>

      {tool.edgeCases.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Edge Cases &amp; Limitations
          </h3>
          <ul className="space-y-1.5 mb-6">
            {tool.edgeCases.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </>
      )}

      {tool.shortcuts.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Keyboard Shortcuts
          </h3>
          <ul className="space-y-1.5 mb-6">
            {tool.shortcuts.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <ShieldCheck className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">
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
    </section>
  );
}
