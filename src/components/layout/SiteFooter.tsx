import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full bg-white border-t border-zinc-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Image
                src="/icon.png"
                alt="DevScratchpad Favicon"
                width={20}
                height={20}
                className="w-5 h-5 rounded object-contain"
              />
              DevScratchpad
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              100% client-side developer utility suite. Zero telemetry on payloads, no databases, all execution runs locally in your browser memory.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Auditable Open Source
            </div>
          </div>

          {/* Col 2: Popular Converters */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-semibold text-zinc-900 uppercase tracking-wider">Converters</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/curl-to-python" className="hover:text-zinc-900 transition-colors">cURL to Python</Link></li>
              <li><Link href="/tools/curl-to-fetch" className="hover:text-zinc-900 transition-colors">cURL to Fetch</Link></li>
              <li><Link href="/tools/json-to-ts" className="hover:text-zinc-900 transition-colors">JSON to TypeScript</Link></li>
              <li><Link href="/tools/json-to-zod" className="hover:text-zinc-900 transition-colors">JSON to Zod Schema</Link></li>
              <li><Link href="/tools/yaml-to-json" className="hover:text-zinc-900 transition-colors">YAML to JSON</Link></li>
              <li><Link href="/tools/svg-to-jsx" className="hover:text-zinc-900 transition-colors">SVG to JSX (React)</Link></li>
            </ul>
          </div>

          {/* Col 3: Formatters & Security */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-semibold text-zinc-900 uppercase tracking-wider">Utilities</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/json-formatter" className="hover:text-zinc-900 transition-colors">JSON Formatter</Link></li>
              <li><Link href="/tools/json-validator" className="hover:text-zinc-900 transition-colors">JSON Syntax Validator</Link></li>
              <li><Link href="/tools/jwt" className="hover:text-zinc-900 transition-colors">JWT Token Decoder</Link></li>
              <li><Link href="/tools/uuid-generator" className="hover:text-zinc-900 transition-colors">UUID v4 Generator</Link></li>
              <li><Link href="/tools/cron" className="hover:text-zinc-900 transition-colors">Cron Schedule Visualizer</Link></li>
              <li><Link href="/developer-tools" className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors">All 20+ Utilities →</Link></li>
            </ul>
          </div>

          {/* Col 4: Engineering Blog */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-semibold text-zinc-900 uppercase tracking-wider">Engineering Guides</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/blog/cron-expression-cheat-sheet" className="hover:text-zinc-900 transition-colors">Cron Expression Cheat Sheet</Link></li>
              <li><Link href="/blog/convert-curl-to-python" className="hover:text-zinc-900 transition-colors">cURL to Python requests</Link></li>
              <li><Link href="/blog/jwt-token-decode-guide" className="hover:text-zinc-900 transition-colors">JWT Token Security Guide</Link></li>
              <li><Link href="/blog" className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors">View All Guides →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-3">
          <p>© {new Date().getFullYear()} DevScratchpad. MIT Licensed.</p>
          <div className="flex items-center gap-4">
            <Link href="/developer-tools" className="hover:text-zinc-700 transition-colors">directory</Link>
            <Link href="/blog" className="hover:text-zinc-700 transition-colors">guides</Link>
            <a href="https://github.com/Saad-web-spec/DevScratchPad" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 transition-colors">github</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
