import Link from "next/link";
import Image from "next/image";

/** Shared link styles: muted by default, darker on hover, visible keyboard focus. */
const LINK =
  "inline-block py-1 sm:py-0 rounded-sm hover:text-zinc-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";
const LINK_STRONG =
  "inline-block py-1 sm:py-0 rounded-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";
/** Column headings are h2: a footer h4 straight after the page h1 skips heading levels. */
const HEADING = "text-xs font-mono font-semibold text-zinc-900 uppercase tracking-wider";

export function SiteFooter() {
  return (
    <footer className="w-full bg-white border-t border-zinc-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-3 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 text-sm">
              <Image
                src="/icon.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 rounded object-contain"
              />
              DevScratchpad
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Client-side developer tools. Inputs are processed in your browser: no payload telemetry, no database.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Source available (BSL 1.1)
            </div>
          </div>

          {/* Col 2: Popular Converters */}
          <div className="space-y-2.5">
            <h2 className={HEADING}>Converters</h2>
            <ul className="space-y-0.5 sm:space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/curl-to-python" className={LINK}>cURL to Python</Link></li>
              <li><Link href="/tools/curl-to-fetch" className={LINK}>cURL to Fetch</Link></li>
              <li><Link href="/tools/json-to-ts" className={LINK}>JSON to TypeScript</Link></li>
              <li><Link href="/tools/json-to-zod" className={LINK}>JSON to Zod Schema</Link></li>
              <li><Link href="/tools/yaml" className={LINK}>YAML to JSON</Link></li>
              <li><Link href="/tools/svg-to-jsx" className={LINK}>SVG to JSX (React)</Link></li>
            </ul>
          </div>

          {/* Col 3: Formatters & Security */}
          <div className="space-y-2.5">
            <h2 className={HEADING}>Utilities</h2>
            <ul className="space-y-0.5 sm:space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/tools/json-formatter" className={LINK}>JSON Formatter</Link></li>
              <li><Link href="/tools/json-schema-validator" className={LINK}>JSON Syntax Validator</Link></li>
              <li><Link href="/tools/jwt" className={LINK}>JWT Token Decoder</Link></li>
              <li><Link href="/tools/uuid-generator" className={LINK}>UUID v4 Generator</Link></li>
              <li><Link href="/tools/cron" className={LINK}>Cron Schedule Visualizer</Link></li>
              <li><Link href="/developer-tools" className={LINK_STRONG}>All 28 Developer Tools →</Link></li>
            </ul>
          </div>

          {/* Col 4: AI agent rules & skills */}
          <div className="space-y-2.5">
            <h2 className={HEADING}>AI Skills</h2>
            <ul className="space-y-0.5 sm:space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/ai-skill-studio" className={LINK}>AI Skill Studio</Link></li>
              <li><Link href="/skill" className={LINK}>Skill Library</Link></li>
              <li><Link href="/ai-skill-studio/rules-converter" className={LINK}>Rules Converter</Link></li>
              <li><Link href="/cli" className={LINK}>CLI (npx devscratchpad)</Link></li>
            </ul>
          </div>

          {/* Col 5: Engineering Blog */}
          <div className="space-y-2.5">
            <h2 className={HEADING}>Engineering Guides</h2>
            <ul className="space-y-0.5 sm:space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/blog/cron-expression-cheat-sheet" className={LINK}>Cron Expression Cheat Sheet</Link></li>
              <li><Link href="/blog/convert-curl-to-python" className={LINK}>cURL to Python requests</Link></li>
              <li><Link href="/blog/jwt-token-decode-guide" className={LINK}>JWT Token Security Guide</Link></li>
              <li><Link href="/recipes" className={LINK}>Troubleshooting Recipes</Link></li>
              <li><Link href="/blog" className={LINK_STRONG}>View All Guides →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-3">
          <p>© {new Date().getFullYear()} DevScratchpad. Source-Available (BSL 1.1).</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/about" className={LINK}>about</Link>
            <Link href="/ai-skill-studio" className={LINK}>ai-skill-studio</Link>
            <Link href="/developer-tools" className={LINK}>directory</Link>
            <Link href="/blog" className={LINK}>guides</Link>
            <a href="https://github.com/Saad-web-spec/DevScratchPad" target="_blank" rel="noopener noreferrer" className={LINK}>github</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
