import { TOOLS_REGISTRY } from"@/lib/tools/registry";
import { ToolRow, guide } from "./guideUi";

const kbdClass = "whitespace-nowrap rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[0.8em] font-medium text-zinc-900";
const strongClass = "font-medium text-zinc-900";
const whyItemClass = "border-t border-zinc-200 py-3.5 text-sm leading-relaxed text-zinc-600 sm:text-[15px]";
const faqItemClass = "border-t border-zinc-200 py-4";
const faqAnswerClass = "mt-1.5 text-sm leading-relaxed text-zinc-600 sm:text-[15px]";

const CATEGORIES = [
  {
    name: "Code Formatting",
    tools: ["json-formatter", "json-schema-validator", "xml-formatter", "sql-formatter", "graphql-formatter"],
  },
  {
    name: "Security & Identifiers",
    tools: ["uuid-generator", "jwt", "hash", "hmac-generator", "base64-inspector", "cert-decoder", "ssh-key-generator", "password-hash", "mock-data-generator"],
  },
  {
    name: "Networking & Time",
    tools: ["cron", "cidr-calculator", "epoch-converter"],
  },
  {
    name: "Code Converters",
    tools: ["json-to-ts", "json-to-zod", "json-to-go", "svg-to-jsx", "curl-to-python", "curl-to-fetch", "curl-to-go", "yaml"],
  },
  {
    name: "Diff & Text Optimization",
    tools: ["diff", "minifier", "regex"],
  },
];

export function HomeSeoContent() {
 const allTools = Object.values(TOOLS_REGISTRY);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": "https://www.devscratchpad.tech/#tools",
        "name": "DevScratchpad Tools",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "url": "https://www.devscratchpad.tech/ai-skill-studio",
            "name": "AI Skill Studio"
          },
          ...allTools.map((tool, idx) => ({
            "@type": "ListItem",
            "position": idx + 2,
            "url": `https://www.devscratchpad.tech/tools/${tool.slug}`,
            "name": tool.name
          }))
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.devscratchpad.tech/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What tools does DevScratchpad offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "DevScratchpad provides 28 offline developer tools including SVG to JSX, JSON/XML/SQL formatters, JWT decoders, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more."
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
"text":"Partly. All tools run on client-side JavaScript with no API calls, so a tool that is already open keeps working if your connection drops. Pages are not cached for offline use, so loading a new tool needs a connection."
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
 <div className="w-full border-t border-zinc-200 bg-white">
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }}
 />
 <div className={`${guide.column} pb-16`}>
  <section className="max-w-3xl space-y-3 pb-10 pt-10 sm:pb-12 sm:pt-14">
  <h1 className={guide.h1}>
  100% Offline, Private Developer Tools
  </h1>
  <p className={guide.lead}>
  DevScratchpad is a suite of 28 offline, privacy-first developer utilities. Every tool runs entirely within your browser using client-side processing. <strong className="font-semibold text-zinc-900">Zero server transmission.</strong> Your data, payloads, and tokens never leave your machine.
  </p>
  </section>

  {/* Smart Paste (Auto-Detection) */}
  <section className={`${guide.section} space-y-2`}>
    <h2 className={guide.h2}>
      Smart Clipboard Detection
    </h2>
    <p className={`max-w-3xl ${guide.body}`}>
      Copy a raw <strong className={strongClass}>JWT</strong>, <strong className={strongClass}>cURL</strong> command, <strong className={strongClass}>JSON</strong>, <strong className={strongClass}>SQL</strong>, <strong className={strongClass}>GraphQL</strong> operation, PEM certificate, or SSH key and press <kbd className={kbdClass}>Ctrl + V</kbd> (or <kbd className={kbdClass}>⌘V</kbd>) anywhere outside a form field. DevScratchpad identifies the format and switches tools for you automatically.
    </p>
  </section>

  <div className={`${guide.section} space-y-10`}>
  {CATEGORIES.map((category) => (
 <section key={category.name} className="space-y-3">
 <h2 className={guide.h2}>
 {category.name}
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
 {category.tools.map((slug) => {
 const tool = TOOLS_REGISTRY[slug];
 if (!tool) return null;
 return (
 <ToolRow
 key={tool.slug}
 href={`/tools/${tool.slug}`}
 title={tool.name}
 description={tool.description}
 />
 );
 })}
 </div>
 </section>
 ))}
  </div>

  <section className={`${guide.section} space-y-4`}>
  <h2 className={guide.h2}>
  Why DevScratchpad?
  </h2>
  <ul className="max-w-3xl">
  <li className={whyItemClass}><strong className={strongClass}>Magic Paste Auto-Detection:</strong> Never waste time searching through sidebars. Just press <kbd className={kbdClass}>Ctrl + V</kbd> and DevScratchpad auto-detects JWTs, cURL, JSON, SQL, GraphQL, certificates, SSH keys, and simple cron expressions instantly.</li>
  <li className={whyItemClass}><strong className={strongClass}>Zero Server Transmission:</strong> Everything happens 100% in your browser. We don&apos;t have any backend databases or tracking servers that log your confidential tokens.</li>
  <li className={whyItemClass}><strong className={strongClass}>Lightning Fast:</strong> Zero API latency. Formatting, conversion, and decoding execute instantly in local browser memory.</li>
  <li className={whyItemClass}><strong className={strongClass}>Installable App:</strong> Install DevScratchpad as an app in supported browsers (Chrome, Edge). It needs a connection to load.</li>
  <li className={whyItemClass}><strong className={strongClass}>Free &amp; Open:</strong> Accessible to all engineers worldwide without ads, sign-ups, or usage limits.</li>
  </ul>
  </section>

  <section className={`${guide.section} space-y-4`}>
  <h2 className={guide.h2}>
  Frequently Asked Questions
  </h2>
  <div className="max-w-3xl">
  <div className={faqItemClass}>
  <h3 className={guide.h3}>
  How does Magic Paste (Ctrl + V) work?
  </h3>
  <p className={faqAnswerClass}>
  When you press Ctrl+V (or ⌘V) outside a form field, the DevScratchpad client-side parser inspects your clipboard. If it detects a recognizable format (like a JWT token, cURL snippet, valid JSON, SQL query, GraphQL operation, or PEM certificate), it switches you directly to the relevant tool and pre-populates your formatted output with zero friction.
  </p>
  </div>
  <div className={faqItemClass}>
  <h3 className={guide.h3}>
  What tools does DevScratchpad offer?
  </h3>
  <p className={faqAnswerClass}>
  DevScratchpad provides 28 offline developer tools including SVG to JSX, JSON/XML/SQL formatters, JWT decoders, Hash/HMAC generators, Base64/URL encoders, timestamp converters, CIDR calculators, diff checkers, and more.
  </p>
  </div>
  <div className={faqItemClass}>
  <h3 className={guide.h3}>
  Is DevScratchpad really free?
  </h3>
  <p className={faqAnswerClass}>
  Yes, DevScratchpad is 100% free to use with no hidden fees, premium tiers, or account registration required.
  </p>
  </div>
  <div className={faqItemClass}>
  <h3 className={guide.h3}>
  Does DevScratchpad work offline?
  </h3>
  <p className={faqAnswerClass}>
  Partly. All tools run on client-side JavaScript with no API calls, so a tool that is already open keeps working if your connection drops. Pages are not cached for offline use, so loading a new tool needs a connection.
  </p>
  </div>
  <div className={faqItemClass}>
  <h3 className={guide.h3}>
  Is my data safe with DevScratchpad?
  </h3>
  <p className={faqAnswerClass}>
  Absolutely. Your data never leaves your device. All inputs, text, tokens, and payloads are processed locally in your browser&apos;s memory and are never transmitted to any remote servers or databases.
  </p>
  </div>
  </div>
  </section>

 <div className={guide.section}>
 <div className="max-w-3xl">
 <p className="text-sm font-semibold text-zinc-900">
 100% Client-Side Privacy Guarantee
 </p>
 <p className={`mt-1 ${guide.body}`}>
 All inputs are processed entirely inside your browser&apos;s memory
 using JavaScript. No data is ever transmitted to any server. Your
 tokens, JSON payloads, cURL commands, and timestamps never leave
 your machine.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
