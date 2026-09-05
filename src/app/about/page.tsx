import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Cpu, Lock, Sparkles, Terminal, ArrowRight, FolderGit2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: "About DevScratchpad — 100% Offline, Privacy-Backed Developer Tools",
  description:
    "Learn about DevScratchpad: an open-source, client-side developer utility platform. Zero server transmission, client-side cryptography, and AI Skill Studio.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About DevScratchpad — 100% Offline, Privacy-Backed Developer Tools",
    description:
      "DevScratchpad is an open-source developer platform built for speed and security. Free online tools that execute 100% in-browser.",
    url: `${SITE_URL}/about`,
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#webpage`,
      url: `${SITE_URL}/about`,
      name: "About DevScratchpad",
      description:
        "DevScratchpad is an open-source, privacy-backed developer platform providing 30+ client-side utilities and AI agent prompt generators.",
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "DevScratchpad",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        sameAs: ["https://github.com/Saad-web-spec/DevScratchPad"],
      },
      mainEntity: {
        "@type": "SoftwareApplication",
        name: "DevScratchpad",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "All (Web Browser, Offline PWA)",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="mb-12 border-b border-zinc-200 pb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 text-zinc-800 mb-4 border border-zinc-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Source & Privacy First</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            About DevScratchpad
          </h1>
          <p className="mt-3 text-base text-zinc-600 leading-relaxed max-w-3xl">
            DevScratchpad is an active, open-source developer productivity suite providing over 30 offline-first utilities and an AI agent prompt steering studio. Every feature runs 100% inside your browser memory with <strong>zero server data transmission</strong>.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-zinc-700" />
              Why We Built DevScratchpad
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Modern developers frequently work with confidential credentials: production JWT tokens, proprietary JSON payloads, private SSH keys, and sensitive API cURL requests. Many legacy online formatters transmit this payload data to remote servers or log it into cloud analytics databases.
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              DevScratchpad was engineered as a <strong>zero-trust client-side alternative</strong>. By utilizing browser Web Workers, WebAssembly, and native Web Cryptography APIs, all transformations and cryptographic operations occur exclusively in local memory on your device.
            </p>
          </section>

          {/* Key Capabilities */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-zinc-700" />
              Core Architecture & Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  100% Client-Side Privacy
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  No remote servers receive your clipboard or input data. The code is auditable in our public GitHub repository.
                </p>
              </div>

              <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  Smart Magic Paste (Ctrl + V)
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Direct clipboard auto-detection recognizes JWTs, cURL commands, SVG markup, JSON, SQL, and timestamps to launch tools instantly.
                </p>
              </div>

              <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  AI Skill Studio
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Specialized generator for Claude Code agent skills (<code className="text-xs font-mono">SKILL.md</code>), Cursor Project Rules (<code className="text-xs font-mono">.cursor/rules/*.mdc</code>), and multi-agent systems (<code className="text-xs font-mono">AGENTS.md</code>).
                </p>
              </div>

              <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  Offline Progressive Web App (PWA)
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Installable on desktop and mobile. Once cached, all tools execute without an active internet connection.
                </p>
              </div>
            </div>
          </section>

          {/* Open Source / Verification */}
          <section className="p-6 bg-zinc-100 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4" />
                Auditable & Open Source
              </h3>
              <p className="text-xs text-zinc-600">
                Inspect the source code, verify our zero-server claims, or contribute utilities on GitHub.
              </p>
            </div>
            <a
              href="https://github.com/Saad-web-spec/DevScratchPad"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shrink-0 transition-colors"
            >
              <span>View Repository</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </section>

          {/* Quick Links */}
          <section className="pt-6 border-t border-zinc-200 flex flex-wrap gap-4 text-xs font-medium text-zinc-600">
            <Link href="/developer-tools" className="hover:text-zinc-900 transition-colors">
              Explore 30+ Developer Tools →
            </Link>
            <Link href="/ai-skill-studio" className="hover:text-zinc-900 transition-colors">
              Launch AI Skill Studio →
            </Link>
            <Link href="/blog" className="hover:text-zinc-900 transition-colors">
              Engineering Guides & Cheat Sheets →
            </Link>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
