import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLink, PrimaryNav, PrimaryNavMenu } from "./PrimaryNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto pl-4 pr-1.5 sm:px-6 h-14 flex items-center gap-2 sm:gap-3">
        {/* Brand + primary navigation (inline links from md; on mobile the menu button sits at the far right) */}
        <div className="flex flex-1 min-w-0 items-center gap-4 lg:gap-6">
          <BrandLink labelClassName="max-[359px]:sr-only" />
          <PrimaryNav showMobileMenu={false} />
        </div>

        {/* Single primary action */}
        <Link
          href="/"
          className="flex h-9 md:h-8 shrink-0 items-center gap-1.5 px-3 sm:px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          <span className="hidden lg:inline">Open workspace</span>
          <span className="lg:hidden">Workspace</span>
          <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
        </Link>

        <PrimaryNavMenu />
      </div>
    </header>
  );
}
