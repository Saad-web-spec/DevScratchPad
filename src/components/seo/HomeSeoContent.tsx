import Link from"next/link";
import { ShieldCheck, ArrowRight, HelpCircle, Sparkles, Zap } from"lucide-react";
import { TOOLS_REGISTRY } from"@/lib/tools/registry";

const CATEGORIES = [
  {
  name:"Code Formatting",
  tools: ["json-formatter","xml-formatter","sql-formatter","graphql-formatter"],
  },
  {
  name:"Security & Identifiers",
  tools: ["uuid-generator","jwt-decoder","hash-generator","hmac-generator","base64-decoder"],
  },
  {
  name:"Networking & Unix",
  tools: ["unix-timestamp","cron-visualizer","cidr-calculator"],
  },
  {
  name:"Code & Type Converters",
  tools: ["json-to-typescript","svg-to-jsx","case-converter","curl-converter","yaml-json","url-encoder"],
  },
  {
  name:"Diff & Text Optimization",
  tools: ["diff-checker","css-svg-minifier","markdown-previewer","regex-tester"],
  },
];

export function HomeSeoContent() {
 const allTools = Object.values(TOOLS_REGISTRY);

 const jsonLdGraph = {
"@context":"https://schema.org",
"@graph": [
 {
"@type":"SoftwareApplication",
"@id":"https://www.devscratchpad.tech/#webapp",
"name":"DevScratchpad",
"url":"https://www.devscratchpad.tech",
"applicationCategory":"DeveloperApplication",
"operatingSystem":"All",
"browserRequirements":"Requires JavaScript",
"offers": {
"@type":"Offer",
"price":"0",
"priceCurrency":"USD"
 },
"description":"Free online developer tools. 100% client-side and private.",
 },
 {
"@type":"WebSite",
"@id":"https://www.devscratchpad.tech/#website",
"url":"https://www.devscratchpad.tech",
"name":"DevScratchpad",
"description":"22+ Free online developer tools for formatting, converting, and analyzing data securely.",
 },
 {
"@type":"ItemList",
"@id":"https://www.devscratchpad.tech/#tools",
"name":"DevScratchpad Tools",
"itemListElement": allTools.map((tool, idx) => ({
"@type":"ListItem",
"position": idx + 1,
"url": `https://www.devscratchpad.tech/tools/${tool.slug}`,
"name": tool.name
 }))
 },
 {
"@type":"FAQPage",
"@id":"https://www.devscratchpad.tech/#faq",
"mainEntity": [
 {
"@type":"Question",
"name":"What tools does DevScratchpad offer?",
"acceptedAnswer": {
"@type":"Answer",
"text":"DevScratchpad provides over 22 developer tools including JSON/XML/SQL/GraphQL formatters, JWT decoders, UUID/ULID generators, SVG to JSX converter, string case converter, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more."
 }
 },
 {
"@type":"Question",
"name":"Is DevScratchpad really free?",
"acceptedAnswer": {
"@type":"Answer",
"text":"Yes, DevScratchpad is 100% free to use with no hidden fees, premium tiers, or account registration required."
 }
 },
 {
"@type":"Question",
"name":"Does DevScratchpad work offline?",
"acceptedAnswer": {
"@type":"Answer",
"text":"Yes! Once the website loads in your browser, all tools execute strictly using client-side JavaScript, meaning they work fully offline without any network dependency."
 }
 },
 {
"@type":"Question",
"name":"Is my data safe with DevScratchpad?",
"acceptedAnswer": {
"@type":"Answer",
"text":"Absolutely. Your data never leaves your device. All inputs, text, tokens, and payloads are processed locally in your browser's memory and are never transmitted to any remote servers or databases."
 }
 }
 ]
 }
 ]
 };

 return (
 <div className="mt-12 pt-8 border-t border-zinc-200 ] max-w-4xl pb-24 mx-auto px-4 w-full">
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
 />
 <h1 className="mt-6 mb-3 text-3xl font-black text-zinc-900 tracking-tight">
 100% Offline, Private Developer Tools
 </h1>
  <p className="text-zinc-600 text-base leading-relaxed mb-6 font-medium">
  DevScratchpad is a suite of 20+ privacy-first developer utilities. Every tool runs entirely within your browser using client-side processing. <strong className="text-zinc-900">Zero server transmission.</strong> Once loaded, it works entirely offline. Your data, payloads, and tokens never leave your machine.
  </p>

  {/* Smart Paste (Auto-Detection) Professional Monochromatic Card */}
  <div className="mb-10 p-4 sm:p-5 bg-zinc-50 border border-zinc-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M12 11l-2 3h3l-1 4 4-5h-3l1-2z" fill="currentColor" />
        </svg>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900">
            Smart Clipboard Detection
          </h2>
          <span className="text-[10px] font-mono font-medium tracking-wide px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded">
            Auto-Detect
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
          Copy any raw <strong>JWT</strong>, <strong>cURL</strong>, <strong>JSON</strong>, <strong>SVG</strong>, <strong>SQL</strong>, or <strong>Timestamp</strong> and press <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[11px] font-mono text-zinc-900 shadow-2xs font-medium">Ctrl + V</kbd> (or <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[11px] font-mono text-zinc-900 shadow-2xs font-medium">⌘V</kbd>) anywhere. DevScratchpad identifies the format and switches tools for you automatically.
        </p>
      </div>
    </div>
  </div>

  {CATEGORIES.map((category) => (
 <section key={category.name} className="mb-10">
 <h2 className="mb-4 text-xl font-bold text-zinc-900">
 {category.name}
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {category.tools.map((slug) => {
 const tool = TOOLS_REGISTRY[slug];
 if (!tool) return null;
 return (
 <Link
 key={tool.slug}
 href={`/tools/${tool.slug}`}
 className="group flex items-center justify-between p-3.5 bg-zinc-50 ] hover:bg-zinc-100 border border-zinc-200 ] rounded-xl transition-all"
 >
 <div>
 <h3 className="text-sm font-medium text-zinc-900 group-hover:text-blue-500 transition-colors">
 {tool.name}
 </h3>
 <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
 {tool.description}
 </p>
 </div>
 <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"/>
 </Link>
 );
 })}
 </div>
 </section>
 ))}

  <h2 className="mt-12 mb-6 text-xl font-bold text-zinc-900">
  Why DevScratchpad?
  </h2>
  <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm leading-relaxed mb-10">
  <li><strong>⚡ Magic Paste Auto-Detection:</strong> Never waste time searching through sidebars. Just press <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-xs font-mono text-zinc-800">Ctrl + V</kbd> anywhere and DevScratchpad auto-detects JWTs, cURL, SVGs, JSON, SQL, Unix timestamps, and Cron expressions instantly.</li>
  <li><strong>Zero Server Transmission:</strong> Everything happens 100% in your browser. We don&apos;t have any backend databases or tracking servers that log your confidential tokens.</li>
  <li><strong>Lightning Fast:</strong> Zero API latency. Formatting, conversion, and decoding execute instantly in local browser memory.</li>
  <li><strong>Offline &amp; PWA Ready:</strong> Installable as a Progressive Web App that functions without an active internet connection.</li>
  <li><strong>Free &amp; Open:</strong> Accessible to all engineers worldwide without ads, sign-ups, or usage limits.</li>
  </ul>

  <h2 className="mt-8 mb-4 text-xl font-bold text-zinc-900 flex items-center gap-2">
  <HelpCircle className="w-5 h-5 text-zinc-400"/>
  Frequently Asked Questions
  </h2>
  <div className="space-y-3 mb-10">
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
  <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
  How does Magic Paste (Ctrl + V) work?
  </h3>
  <p className="text-xs text-zinc-600 leading-relaxed">
  When you press Ctrl+V (or ⌘V) anywhere on the page, DevScratchpad client-side parser inspects your clipboard. If it detects a recognizable format (like a JWT token, cURL snippet, raw SVG, valid JSON, SQL query, or timestamp), it switches you directly to the relevant tool and pre-populates your formatted output with zero friction.
  </p>
  </div>
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
  <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
  What tools does DevScratchpad offer?
  </h3>
  <p className="text-xs text-zinc-600 leading-relaxed">
  DevScratchpad provides over 20 developer tools including SVG to JSX, JSON/XML/SQL formatters, JWT decoders, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more.
  </p>
  </div>
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
  <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
  Is DevScratchpad really free?
  </h3>
  <p className="text-xs text-zinc-600 leading-relaxed">
  Yes, DevScratchpad is 100% free to use with no hidden fees, premium tiers, or account registration required.
  </p>
  </div>
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
  <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
  Does DevScratchpad work offline?
  </h3>
  <p className="text-xs text-zinc-600 leading-relaxed">
  Yes! Once the website loads in your browser, all tools execute strictly using client-side JavaScript, meaning they work fully offline without any network dependency.
  </p>
  </div>
  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
  <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">
  Is my data safe with DevScratchpad?
  </h3>
  <p className="text-xs text-zinc-600 leading-relaxed">
  Absolutely. Your data never leaves your device. All inputs, text, tokens, and payloads are processed locally in your browser&apos;s memory and are never transmitted to any remote servers or databases.
  </p>
  </div>
  </div>

 <div className="mt-8 flex items-start gap-3 p-4 bg-zinc-50 ] border border-zinc-200 ] rounded-xl mb-10">
 <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"/>
 <div>
 <p className="text-sm font-bold text-zinc-900 mb-1">
 100% Client-Side Privacy Guarantee
 </p>
 <p className="text-xs text-zinc-600 leading-relaxed">
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
