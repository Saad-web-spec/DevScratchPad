import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, Terminal } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.png"
              alt="DevScratchpad Favicon"
              width={24}
              height={24}
              className="w-6 h-6 rounded-md object-contain"
              priority
            />
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
              href="/recipes"
              className="px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Recipes & Fixes
            </Link>
            <Link
              href="/blog"
              className="px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Guides & References
            </Link>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cli"
            className="hidden md:flex bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs px-2.5 py-1 rounded-md items-center gap-1.5 transition-colors font-mono font-medium shadow-xs shrink-0"
            title="DevScratchpad CLI (npx devscratchpad)"
          >
            <Terminal className="w-3.5 h-3.5 text-orange-600" />
            <span>npx CLI</span>
          </Link>

          <Link
            href="/ai-skill-studio"
            className="flex bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-2 sm:px-2.5 py-1 rounded-md items-center gap-1.5 transition-colors font-semibold shadow-xs hover:shadow-sm shrink-0"
            title="AI Skill Studio"
          >
            <img src="/ai-skill-icon.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="AI Skill Studio" />
            <span className="hidden xs:inline sm:inline">AI Studio</span>
          </Link>
          <div className="hidden lg:flex bg-neutral-900 text-neutral-100 text-xs px-2.5 py-1 rounded-md items-center gap-1.5"><Lock className="w-3 h-3" /> 100% Local</div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition-all shadow-none shrink-0"
          >
            <span className="hidden sm:inline">Open Tool Workspace</span>
            <span className="sm:hidden">Tools</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
