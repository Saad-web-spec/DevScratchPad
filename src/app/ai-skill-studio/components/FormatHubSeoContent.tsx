import React from "react";
import Link from "next/link";
import {
  FolderTree,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
} from "lucide-react";
import { FormatHubMeta, getAllFormatHubs } from "@/app/claude-skills/lib/formatHubs";
import { getPresetsByFormat } from "@/app/claude-skills/lib/presetRegistry";

export function FormatHubSeoContent({ hub }: { hub: FormatHubMeta }) {
  const otherHubs = getAllFormatHubs().filter((h) => h.slug !== hub.slug);
  const presets = getPresetsByFormat(hub.slug);

  return (
    <article className="w-full bg-white border-t border-zinc-200 mt-8 py-16 px-4 sm:px-6 lg:px-8 text-zinc-800 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* 1. Header, Target Placement Spec & Overview */}
        <section className="space-y-6 border-b border-zinc-200 pb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
            <span>Format Pillar Hub &amp; Architectural Placement Guide</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
              {hub.heroHeading}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 max-w-4xl leading-relaxed">
              {hub.heroSubheading}
            </p>
          </div>

          <p className="text-sm sm:text-base text-zinc-700 max-w-4xl leading-relaxed bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-2xs">
            {hub.overview}
          </p>

          {/* Target File & Directory Specification Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
                Target Filename
              </span>
              <code className="text-xs sm:text-sm font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded inline-block">
                {hub.targetFile}
              </code>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
                Target Directory
              </span>
              <code className="text-xs sm:text-sm font-mono font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded inline-block">
                {hub.targetDir}
              </code>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
                Format Protocol Key
              </span>
              <code className="text-xs sm:text-sm font-mono font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded inline-block">
                {hub.format}
              </code>
            </div>
          </div>
        </section>

        {/* 2. Tech Stack Presets Showcase Grid */}
        {presets.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-orange-600" />
                Available {hub.name} Stack Presets
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Generate production-ready {hub.name} configurations customized for your framework, database, and tooling:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <Link
                  key={preset.presetSlug}
                  href={`/ai-skill-studio/${hub.slug}/${preset.presetSlug}`}
                  className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all flex flex-col justify-between group text-inherit no-underline"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase tracking-wider group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-900 transition-colors">
                        {preset.category}
                      </span>
                      <code className="text-[11px] font-mono text-zinc-400 group-hover:text-orange-600 transition-colors">
                        {preset.targetFile}
                      </code>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {preset.techName}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Configure Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 2. File Placement Guide */}
        {hub.filePlacementGuide && hub.filePlacementGuide.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-orange-600" />
                File Placement &amp; Directory Scope Guide
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Correct path placement is critical. AI coding assistants search exact folder trees to discover and activate {hub.name} guidelines:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hub.filePlacementGuide.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-2xs hover:border-orange-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase tracking-wider">
                        {item.scope}
                      </span>
                      <span className="text-[10px] font-mono text-orange-600 font-semibold">
                        Step {idx + 1}
                      </span>
                    </div>
                    <h3 className="font-mono text-xs sm:text-sm font-bold text-zinc-900 break-all bg-zinc-50 border border-zinc-200/80 p-2 rounded-lg">
                      {item.path}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Syntax Highlights & Code Samples */}
        {hub.syntaxHighlights && hub.syntaxHighlights.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-orange-600" />
                Syntax Highlights &amp; Structure Reference
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Key directives and formatting patterns used by {hub.name} configuration files:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hub.syntaxHighlights.map((sh, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div className="p-5 space-y-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-orange-600" />
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                        {sh.title}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {sh.explanation}
                    </p>
                  </div>
                  <pre className="p-4 bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed overflow-x-auto m-0">
                    <code>{sh.codeSample}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Best Practices & Behavioral Guardrails */}
        {hub.bestPractices && hub.bestPractices.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                Production Best Practices &amp; Behavioral Guardrails
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Battle-tested principles to ensure your {hub.name} rules provide maximum steering precision with minimal token overhead:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {hub.bestPractices.map((bp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                    {bp}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Frequently Asked Questions */}
        {hub.faqs && hub.faqs.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                Frequently Asked Questions about {hub.name}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Common questions regarding configuration, IDE integration, and activation rules:
              </p>
            </div>

            <div className="space-y-3">
              {hub.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 bg-white p-5 space-y-2 shadow-2xs"
                >
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Cross-Format Hub Directory */}
        <section className="space-y-6 pt-6 border-t border-zinc-200">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Explore Other AI Agent Formats
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              DevScratchpad generates, audits, and bundles rulebooks across 17 distinct AI assistant formats:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherHubs.map((other) => (
              <Link
                key={other.slug}
                href={`/ai-skill-studio/${other.slug}`}
                className="flex flex-col justify-between border border-zinc-200/90 rounded-xl p-4 bg-white shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all text-inherit no-underline group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 group-hover:border-orange-300 group-hover:bg-orange-50 group-hover:text-orange-900 transition-colors">
                      {other.badge}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 group-hover:text-orange-600 transition-colors">
                      {other.targetFile}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-sm group-hover:text-orange-600 transition-colors">
                    {other.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {other.seoDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Zero-Server Privacy Guarantee Stamp */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                100% Client-Side Privacy Guarantee
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed max-w-2xl">
                All rulebook generation, manifest detection, and file exports execute locally inside your browser memory using HTML5 APIs. Zero prompts, manifests, or source code are ever transmitted to any remote server.
              </p>
            </div>
          </div>
          <Link
            href="/ai-skill-studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shrink-0 shadow-xs"
          >
            <span>Launch Interactive Studio</span>
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          </Link>
        </section>
      </div>
    </article>
  );
}
