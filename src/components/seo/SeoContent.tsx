import Link from"next/link";
import { ShieldCheck, ArrowRight, HelpCircle, CheckCircle2 } from"lucide-react";
import { TOOLS_REGISTRY, type ToolMeta } from"@/lib/tools/registry";

const RELATED_MAP: Record<string, string[]> = {
"json-formatter": ["json-to-typescript","yaml-json","css-svg-minifier","diff-checker"],
"jwt-decoder": ["base64-decoder","hmac-generator","url-encoder","hash-generator"],
"unix-timestamp": ["cron-visualizer","jwt-decoder","cidr-calculator"],
"curl-converter": ["url-encoder","graphql-formatter","json-formatter"],
"diff-checker": ["json-formatter","markdown-previewer","xml-formatter"],
"xml-formatter": ["json-formatter","sql-formatter","yaml-json"],
"sql-formatter": ["json-formatter","xml-formatter","diff-checker"],
"base64-decoder": ["jwt-decoder","url-encoder","hmac-generator"],
"url-encoder": ["base64-decoder","curl-converter","jwt-decoder"],
"hash-generator": ["hmac-generator","jwt-decoder","base64-decoder"],
"regex-tester": ["diff-checker","markdown-previewer","json-formatter"],
"json-to-typescript": ["json-formatter","yaml-json","graphql-formatter"],
"cron-visualizer": ["unix-timestamp","cidr-calculator","regex-tester"],
"yaml-json": ["json-formatter","json-to-typescript","xml-formatter"],
"css-svg-minifier": ["json-formatter","diff-checker","markdown-previewer"],
"graphql-formatter": ["json-formatter","curl-converter","json-to-typescript"],
"markdown-previewer": ["diff-checker","css-svg-minifier","regex-tester"],
"hmac-generator": ["hash-generator","jwt-decoder","base64-decoder"],
"cidr-calculator": ["unix-timestamp","cron-visualizer","hash-generator"],
};

export function SeoContent({ tool }: { tool: ToolMeta }) {
 const relatedSlugs = RELATED_MAP[tool.slug] || ["json-formatter","jwt-decoder","diff-checker"];
 const relatedTools = relatedSlugs
 .map((s) => TOOLS_REGISTRY[s])
 .filter(Boolean);

 const jsonLdGraph = {
"@context":"https://schema.org",
"@graph": [
 {
"@type":"WebApplication",
"@id": `https://www.devscratchpad.tech/${tool.slug}#webapp`,
"name": `${tool.name} Online`,
"url": `https://www.devscratchpad.tech/${tool.slug}`,
"applicationCategory":"DeveloperApplication",
"operatingSystem":"All",
"browserRequirements":"Requires JavaScript",
"offers": {
"@type":"Offer",
"price":"0",
"priceCurrency":"USD"
 },
"description": tool.seoDescription || tool.description,
 },
 {
"@type":"HowTo",
"@id": `https://www.devscratchpad.tech/${tool.slug}#howto`,
"name": `How to use ${tool.name} Online`,
"description": `Step-by-step guide to use ${tool.name} with 100% in-browser client-side privacy.`,
"step": tool.howToUse.map((step, idx) => ({
"@type":"HowToStep",
"position": idx + 1,
"name": `Step ${idx + 1}`,
"text": step,
 })),
 },
 {
"@type":"FAQPage",
"@id": `https://www.devscratchpad.tech/${tool.slug}#faq`,
"mainEntity": [
 {
"@type":"Question",
"name": `Is this ${tool.shortName || tool.name} safe for sensitive data & credentials?`,
"acceptedAnswer": {
"@type":"Answer",
"text": `Yes, 100%. All processing runs client-side in your local browser memory. No text, tokens, payloads, or logs are ever transmitted to any remote server or analytics engine.`
 }
 },
 {
"@type":"Question",
"name": `Can I use ${tool.shortName || tool.name} offline without internet?`,
"acceptedAnswer": {
"@type":"Answer",
"text": `Yes. Because this tool runs strictly on client-side JavaScript with zero external API calls, once the web application is loaded in your browser it will continue working offline.`
 }
 },
 {
"@type":"Question",
"name": `How does URL state sharing work?`,
"acceptedAnswer": {
"@type":"Answer",
"text": `When you click Share Payload, your state is encoded directly into a URL hash fragment (#data=...) without storing anything on a database server.`
 }
 }
 ]
 },
 {
"@type":"BreadcrumbList",
"itemListElement": [
 {"@type":"ListItem","position": 1,"name":"DevScratchpad","item":"https://www.devscratchpad.tech"},
 {"@type":"ListItem","position": 2,"name": tool.name,"item": `https://www.devscratchpad.tech/${tool.slug}` }
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
 <h1 className="mt-6 mb-3 text-2xl font-bold text-zinc-900">
 {tool.name} (Offline & Secure)
 </h1>
 <p className="text-zinc-600 text-sm leading-relaxed mb-6">
 {tool.seoDescription || tool.description}
 </p>

 <h2 className="mt-8 mb-4 text-xl font-bold text-zinc-900 flex items-center gap-2">
 <CheckCircle2 className="w-5 h-5 text-blue-500"/>
 How to use {tool.shortName || tool.name}
 </h2>

 <ol className="list-decimal pl-5 space-y-2.5 text-zinc-600 text-sm leading-relaxed mb-8">
 {tool.howToUse.map((step, i) => (
 <li key={i}>{step}</li>
 ))}
 </ol>

 {tool.edgeCases.length > 0 && (
 <>
 <h3 className="mt-8 mb-3 text-lg font-semibold text-zinc-800">
 Edge Cases &amp; Important Considerations
 </h3>
 <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm leading-relaxed mb-8">
 {tool.edgeCases.map((c, i) => (
 <li key={i}>{c}</li>
 ))}
 </ul>
 </>
 )}

 {tool.shortcuts.length > 0 && (
 <>
 <h3 className="mt-8 mb-3 text-lg font-semibold text-zinc-800">
 Keyboard Shortcuts
 </h3>
 <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm leading-relaxed mb-8">
 {tool.shortcuts.map((s, i) => (
 <li key={i}>{s}</li>
 ))}
 </ul>
 </>
 )}

 {/* Frequently Asked Questions for Rich Snippets */}
 <h3 className="mt-8 mb-4 text-lg font-semibold text-zinc-800 flex items-center gap-2">
 <HelpCircle className="w-5 h-5 text-zinc-400"/>
 Frequently Asked Questions
 </h3>
 <div className="space-y-3 mb-8">
 <div className="p-4 bg-zinc-50 ] border border-zinc-200 ] rounded-xl">
 <h4 className="text-sm font-semibold text-zinc-900 mb-1.5">
 Is this {tool.shortName || tool.name} safe for sensitive corporate data?
 </h4>
 <p className="text-xs text-zinc-600 leading-relaxed">
 Yes, 100%. All processing runs client-side in your local browser memory. No text, tokens, payloads, or logs are ever transmitted to any remote server or analytics engine.
 </p>
 </div>
 <div className="p-4 bg-zinc-50 ] border border-zinc-200 ] rounded-xl">
 <h4 className="text-sm font-semibold text-zinc-900 mb-1.5">
 Can I use this tool offline?
 </h4>
 <p className="text-xs text-zinc-600 leading-relaxed">
 Yes. Because this tool runs strictly on client-side JavaScript with zero external API dependencies, once loaded it functions completely offline.
 </p>
 </div>
 </div>

 {/* Privacy Guarantee Banner */}
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

 {/* Internal Linking: Related Developer Utilities */}
 {relatedTools.length > 0 && (
 <div className="mt-10 pt-6 border-t border-zinc-200 ]">
 <h3 className="text-base font-semibold text-zinc-900 mb-4">
 Related Developer Utilities
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {relatedTools.map((rel) => (
 <Link
 key={rel.slug}
 href={`/${rel.slug}`}
 className="group flex items-center justify-between p-3.5 bg-zinc-50 ] hover:bg-zinc-100 :bg-white border border-zinc-200 ] rounded-xl transition-all"
 >
 <div>
 <p className="text-sm font-medium text-zinc-900 group-hover:text-blue-500 transition-colors">
 {rel.name}
 </p>
 <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
 {rel.description}
 </p>
 </div>
 <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"/>
 </Link>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
