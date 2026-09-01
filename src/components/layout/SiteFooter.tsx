import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
              <span className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center text-xs">⚡</span>
              DevScratchpad
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              100% offline, client-side developer utilities. No telemetry on payloads, no servers, zero data transmission.
            </p>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Auditable & Open Source
            </div>
          </div>

          {/* Col 2: Popular Converters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Converters</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/curl-to-python" className="hover:text-blue-600 transition-colors">cURL to Python</Link></li>
              <li><Link href="/tools/curl-to-fetch" className="hover:text-blue-600 transition-colors">cURL to Fetch</Link></li>
              <li><Link href="/tools/json-to-ts" className="hover:text-blue-600 transition-colors">JSON to TypeScript</Link></li>
              <li><Link href="/tools/json-to-zod" className="hover:text-blue-600 transition-colors">JSON to Zod Schema</Link></li>
              <li><Link href="/tools/yaml-to-json" className="hover:text-blue-600 transition-colors">YAML to JSON</Link></li>
              <li><Link href="/tools/svg-to-jsx" className="hover:text-blue-600 transition-colors">SVG to JSX (React)</Link></li>
            </ul>
          </div>

          {/* Col 3: Formatters & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Utilities & Security</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/json-formatter" className="hover:text-blue-600 transition-colors">JSON Formatter</Link></li>
              <li><Link href="/tools/json-validator" className="hover:text-blue-600 transition-colors">JSON Syntax Validator</Link></li>
              <li><Link href="/tools/jwt" className="hover:text-blue-600 transition-colors">JWT Token Decoder</Link></li>
              <li><Link href="/tools/uuid-generator" className="hover:text-blue-600 transition-colors">UUID v4 Generator</Link></li>
              <li><Link href="/tools/cron" className="hover:text-blue-600 transition-colors">Cron Schedule Visualizer</Link></li>
              <li><Link href="/developer-tools" className="hover:text-blue-600 font-medium text-blue-600 transition-colors">Browse all 20+ Tools →</Link></li>
            </ul>
          </div>

          {/* Col 4: Engineering Blog */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Guides & Cheat Sheets</h4>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/blog/cron-expression-cheat-sheet" className="hover:text-blue-600 transition-colors">Cron Expression Cheat Sheet</Link></li>
              <li><Link href="/blog/convert-curl-to-python" className="hover:text-blue-600 transition-colors">cURL to Python requests Guide</Link></li>
              <li><Link href="/blog/jwt-token-decode-guide" className="hover:text-blue-600 transition-colors">JWT Token Decoding Guide</Link></li>
              <li><Link href="/blog" className="hover:text-blue-600 font-medium text-blue-600 transition-colors">View All Guides →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <p>© {new Date().getFullYear()} DevScratchpad. Built for engineers worldwide under MIT License.</p>
          <div className="flex items-center gap-4">
            <Link href="/developer-tools" className="hover:text-zinc-800">Directory</Link>
            <Link href="/blog" className="hover:text-zinc-800">Blog</Link>
            <a href="https://github.com/Saad-web-spec/DevScratchPad" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-800">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
