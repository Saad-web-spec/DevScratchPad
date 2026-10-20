import type { Metadata } from "next";
import { GraphLanding } from "./GraphLanding";
import { GRAPH_FAQS, GraphSeoContent } from "./GraphSeoContent";

const PAGE_URL = "https://www.devscratchpad.tech/graph";

export const metadata: Metadata = {
  title: "Skill Graph: Multi-Agent SKILL.md Builder",
  description:
    "Design skills as a graph of steps, contracts, fresh-context verifiers and gates. Check it in your browser and compile it into a Claude Code skill with subagents, or a Cursor rule.",
  keywords: [
    "SKILL.md graph",
    "visual agent workflow editor",
    "multi-agent skill builder",
    "Claude Code subagents generator",
    "agent DAG editor",
    "subagent orchestration skill",
    "fresh context verifier",
    "graph skill guide",
    "Cursor rules multi-agent",
    "DevScratchpad",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Skill Graph: Multi-Agent SKILL.md Builder | DevScratchpad",
    description: "Write a skill as a graph of steps, contracts and gates, then compile it into an orchestrating skill and one subagent per step for Claude Code or Cursor.",
    url: PAGE_URL,
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Graph: Multi-Agent SKILL.md Builder",
    description: "Write a skill as a graph of steps, contracts and gates, then compile it into an orchestrating skill and one subagent per step for Claude Code or Cursor.",
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${PAGE_URL}#app`,
      name: "Skill Graph",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "All",
      url: PAGE_URL,
      image: `${PAGE_URL}/opengraph-image`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: "Browser-based editor and compiler for graph skills: steps, contracts, fresh-context verifiers and gates, compiled into Claude Code subagents and Cursor rules.",
      publisher: { "@type": "Organization", name: "DevScratchpad", url: "https://www.devscratchpad.tech" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "DevScratchpad", item: "https://www.devscratchpad.tech" },
        { "@type": "ListItem", position: 2, name: "Skill Graph", item: PAGE_URL },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: GRAPH_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function GraphPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, "\\u003c") }} />
      <GraphLanding>
        <GraphSeoContent />
      </GraphLanding>
    </>
  );
}
