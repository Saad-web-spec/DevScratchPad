import Link from "next/link";
import { Sparkles } from "lucide-react";
import { TOOLS_REGISTRY, type ToolMeta } from"@/lib/tools/registry";
import { SeoArticle } from "./SeoArticle";

export function SeoContent({ tool }: { tool: ToolMeta }) {
 const allTools = Object.values(TOOLS_REGISTRY);
 const sameCategory = allTools.filter(t => t.slug !== tool.slug && t.category === tool.category);
 const otherCategory = allTools.filter(t => t.slug !== tool.slug && t.category !== tool.category);
 
 // Prefer same category, fallback to others if needed to fill 3 spots
 const relatedTools = [...sameCategory, ...otherCategory].slice(0, 3);

 const jsonLdGraph = {
"@context":"https://schema.org",
"@graph": [
      {
        "@type": "WebApplication",
        "@id": `https://www.devscratchpad.tech/tools/${tool.slug}#webapp`,
        "name": `${tool.name} Online`,
        "url": `https://www.devscratchpad.tech/tools/${tool.slug}`,
        "applicationCategory": "DeveloperApplication",
        "applicationSubCategory": tool.category,
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript, HTML5, Web Crypto API",
        "isAccessibleForFree": true,
        "softwareVersion": "1.0",
        "publisher": {
          "@type": "Organization",
          "@id": "https://www.devscratchpad.tech/#organization",
          "name": "DevScratchpad",
        },
        "featureList": [
          "100% Client-Side In-Browser Execution",
          "Zero Server Transmission Privacy Guarantee",
          "Works Fully Offline",
          ...(tool.shortcuts || []),
        ],
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "description": tool.seoDescription || tool.description,
      },
 {
"@type":"HowTo",
"@id": `https://www.devscratchpad.tech/tools/${tool.slug}#howto`,
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
"@id": `https://www.devscratchpad.tech/tools/${tool.slug}#faq`,
"mainEntity": [
 ...(tool.edgeCases && tool.edgeCases.length > 0 ? [
   {
     "@type":"Question",
     "name": `What are some edge cases for ${tool.shortName || tool.name}?`,
     "acceptedAnswer": {
       "@type":"Answer",
       "text": tool.edgeCases.join(" ")
     }
   }
 ] : []),
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
 {"@type":"ListItem","position": 2,"name": tool.name,"item": `https://www.devscratchpad.tech/tools/${tool.slug}` }
 ]
 }
 ]
 };

  const explanation = tool.seoDescription || tool.description;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <SeoArticle
        title={`${tool.name} (Offline & Secure)`}
        explanation={explanation}
        howToUse={tool.howToUse}
        edgeCases={tool.edgeCases}
        shortcuts={tool.shortcuts || ["Ctrl/Cmd + V — Smart Magic Paste", "Ctrl/Cmd + K — Open Command Palette"]}
      />
      
      {/* Internal Linking: Related Developer Utilities */}
      {relatedTools.length > 0 && (
        <div className="w-full bg-white border-t border-zinc-200">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h3 className="text-base font-semibold text-zinc-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-500" />
              Related Developer Utilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/tools/${rel.slug}`}
                  className="group flex flex-col p-4 bg-zinc-50 border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-100 transition-all"
                >
                  <p className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {rel.name}
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {rel.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
