import Link from "next/link";
import { ArrowRight, Terminal, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
              ⚡
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">
              DevScratchpad
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <Link
              href="/developer-tools"
              className="px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Directory
            </Link>
            <Link
              href="/blog"
              className="px-3 py-1.5 font-medium text-zinc-900 bg-zinc-100/80 rounded-md transition-colors"
            >
              Guides & References
            </Link>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>100% Client-Side Processing</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition-all shadow-none"
          >
            <span>Open Tool Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
