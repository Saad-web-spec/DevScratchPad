import { Metadata } from "next";
import Link from "next/link";
import { TOOLS_REGISTRY } from "@/lib/tools/registry";
import { Sparkles, Terminal, FileCode, Shield, Code, Settings } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Free Developer Tools Directory | DevScratchpad",
  description: "Browse our complete collection of 100% offline, privacy-first developer utilities. Converters, formatters, and security tools.",
  alternates: {
    canonical: "https://www.devscratchpad.tech/developer-tools",
  }
};

// Helper to map categories to icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Network": return <Terminal className="w-5 h-5 text-blue-500" />;
    case "Converters": return <FileCode className="w-5 h-5 text-emerald-500" />;
    case "Security": return <Shield className="w-5 h-5 text-red-500" />;
    case "Formatters": return <Code className="w-5 h-5 text-indigo-500" />;
    default: return <Settings className="w-5 h-5 text-zinc-500" />;
  }
};

export default function DeveloperToolsPage() {
  const allTools = Object.values(TOOLS_REGISTRY);

  // Group tools by category
  const groupedTools = allTools.reduce((acc, tool) => {
    const cat = tool.category || "Utilities";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {} as Record<string, typeof allTools>);

  const categories = Object.keys(groupedTools).sort();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Developer Tools Directory
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive suite of 100% offline, private developer utilities. Everything runs instantly in your browser.
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => (
            <section key={category} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
                {getCategoryIcon(category)}
                <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">{category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedTools[category].map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group bg-white border border-zinc-200 p-5 rounded-xl hover:shadow-md hover:border-zinc-300 transition-all flex flex-col"
                  >
                    <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors text-lg mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
