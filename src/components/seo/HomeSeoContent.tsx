import Link from "next/link";
import { ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";

const CATEGORIES = [
  {
    name: "Code Formatting",
    tools: ["json-formatter", "xml-formatter", "sql-formatter", "graphql-formatter"],
  },
  {
    name: "Security & Crypto",
    tools: ["jwt-decoder", "hash-generator", "hmac-generator", "base64-decoder"],
  },
  {
    name: "Networking & Unix",
    tools: ["unix-timestamp", "cron-visualizer", "cidr-calculator"],
  },
  {
    name: "Code Converters",
    tools: ["curl-converter", "json-to-typescript", "yaml-json", "url-encoder"],
  },
  {
    name: "Diff & Optimization",
    tools: ["diff-checker", "css-svg-minifier", "markdown-previewer", "regex-tester"],
  },
];

export function HomeSeoContent() {
  const allTools = Object.values(TOOLS_REGISTRY);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://tools.saadengineer.works/#webapp",
        "name": "DevScratchpad",
        "url": "https://tools.saadengineer.works",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "Free online developer tools. 100% client-side and private.",
      },
      {
        "@type": "WebSite",
        "@id": "https://tools.saadengineer.works/#website",
        "url": "https://tools.saadengineer.works",
        "name": "DevScratchpad",
        "description": "19+ Free online developer tools for formatting, converting, and analyzing data securely.",
      },
      {
        "@type": "ItemList",
        "@id": "https://tools.saadengineer.works/#tools",
        "name": "DevScratchpad Tools",
        "itemListElement": allTools.map((tool, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `https://tools.saadengineer.works/${tool.slug}`,
          "name": tool.name
        }))
      },
      {
        "@type": "FAQPage",
        "@id": "https://tools.saadengineer.works/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What tools does DevScratchpad offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "DevScratchpad provides over 19 developer tools including JSON/XML/SQL formatters, JWT decoders, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more."
            }
          },
          {
            "@type": "Question",
            "name": "Is DevScratchpad really free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, DevScratchpad is 100% free to use with no hidden fees, premium tiers, or account registration required."
            }
          },
          {
            "@type": "Question",
            "name": "Does DevScratchpad work offline?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Once the website loads in your browser, all tools execute strictly using client-side JavaScript, meaning they work fully offline without any network dependency."
            }
          },
          {
            "@type": "Question",
            "name": "Is my data safe with DevScratchpad?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Your data never leaves your device. All inputs, text, tokens, and payloads are processed locally in your browser's memory and are never transmitted to any remote servers or databases."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-[#27272A] max-w-4xl pb-24 mx-auto px-4 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <h1 className="mt-6 mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Free Online Developer Tools — 100% Client-Side &amp; Private
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-10">
        DevScratchpad is a suite of 19+ privacy-first, blazing-fast developer utilities. Every tool runs entirely within your browser using client-side processing, meaning zero server transmission. Your data, payloads, and tokens never leave your machine.
      </p>

      {CATEGORIES.map((category) => (
        <section key={category.name} className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category.tools.map((slug) => {
              const tool = TOOLS_REGISTRY[slug];
              if (!tool) return null;
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="group flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-[#121215] hover:bg-zinc-100 dark:hover:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] rounded-xl transition-all"
                >
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <h2 className="mt-12 mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Why DevScratchpad?
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-10">
        <li><strong>Zero Server Transmission:</strong> Everything happens in your browser. We don&apos;t even have a backend database to store your data.</li>
        <li><strong>Lightning Fast:</strong> No API latency. Processing happens instantly on your device.</li>
        <li><strong>Offline Capable:</strong> Works without an internet connection once loaded.</li>
        <li><strong>Free &amp; Open:</strong> Accessible to all developers without sign-ups or limits.</li>
      </ul>

      <h2 className="mt-8 mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-zinc-400" />
        Frequently Asked Questions
      </h2>
      <div className="space-y-3 mb-10">
        <div className="p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            What tools does DevScratchpad offer?
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            DevScratchpad provides over 19 developer tools including JSON/XML/SQL formatters, JWT decoders, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more.
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Is DevScratchpad really free?
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Yes, DevScratchpad is 100% free to use with no hidden fees, premium tiers, or account registration required.
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Does DevScratchpad work offline?
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Yes! Once the website loads in your browser, all tools execute strictly using client-side JavaScript, meaning they work fully offline without any network dependency.
          </p>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Is my data safe with DevScratchpad?
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Absolutely. Your data never leaves your device. All inputs, text, tokens, and payloads are processed locally in your browser&apos;s memory and are never transmitted to any remote servers or databases.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-3 p-4 bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-xl mb-10">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            100% Client-Side Privacy Guarantee
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
