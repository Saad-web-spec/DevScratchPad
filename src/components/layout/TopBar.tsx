"use client";

import { Search, Save, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModKeyLabel } from "@/lib/useModKeyLabel";
import { InstallAppButton } from "./InstallAppButton";
import { BrandLink, PrimaryNav } from "./PrimaryNav";
import { ICON_STROKE } from "./toolIcons";

interface TopBarProps {
  onOpenCommandPalette?: () => void;
  onOpenMobileMenu?: () => void;
  /** Whether the mobile tool drawer is open (drives `aria-expanded` on the menu button). */
  isMobileMenuOpen?: boolean;
  /** Id of the mobile drawer element, for `aria-controls`. */
  mobileMenuId?: string;
}

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

/** Dispatches the workspace-wide save event that each tool listens for. */
export function saveWorkspace() {
  window.dispatchEvent(new Event("save-workspace"));
}

/**
 * Workspace header. Desktop: brand, primary links, search, install + save.
 * Mobile: one menu button (opens the tool drawer, which also carries the site links and workspace actions),
 * the brand, and a search button.
 */
export function TopBar({ onOpenCommandPalette, onOpenMobileMenu, isMobileMenuOpen, mobileMenuId }: TopBarProps) {
  const modKey = useModKeyLabel();
  const shortcut = `${modKey}+K`;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-zinc-200 flex items-center gap-1 md:gap-3 pl-1.5 pr-1.5 md:px-4 shrink-0">
      {/* Left side: Menu button (mobile) + Brand logo + primary navigation */}
      <div className="flex min-w-0 items-center gap-1 md:gap-4 lg:gap-6">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={cn(
            "grid size-10 place-items-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden",
            FOCUS_RING
          )}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={isMobileMenuOpen ?? false}
          aria-controls={mobileMenuId}
        >
          <Menu aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5" />
        </button>

        <BrandLink className="px-1 md:px-0" />

        <PrimaryNav showMobileMenu={false} />
      </div>

      {/* Search: icon button on phones, compact field from sm (icon-only at md where the nav needs the room) */}
      <div className="flex min-w-0 flex-1 items-center justify-end">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Search tools"
          aria-keyshortcuts="Control+K Meta+K"
          title={`Search tools (${shortcut})`}
          className={cn(
            "group flex items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
            "size-10 sm:h-8 sm:w-64 sm:justify-between sm:gap-2 sm:border sm:border-zinc-200 sm:bg-zinc-50 sm:px-2.5 sm:text-zinc-500 sm:hover:border-zinc-300 sm:hover:bg-white",
            "md:w-auto lg:w-52 xl:w-64",
            FOCUS_RING
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search
              aria-hidden="true"
              strokeWidth={ICON_STROKE}
              className="size-5 shrink-0 sm:size-4 sm:text-zinc-400 sm:group-hover:text-zinc-700"
            />
            <span className="hidden truncate text-sm sm:inline md:hidden lg:inline">Search tools…</span>
          </span>
          <kbd className="hidden shrink-0 rounded border border-zinc-200 bg-white px-1.5 py-px font-sans text-[10px] font-medium text-zinc-400 sm:inline-block md:hidden lg:inline-block">
            {modKey} K
          </kbd>
        </button>
      </div>

      {/* Right side: Workspace actions (on mobile they live in the tool drawer) */}
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <InstallAppButton className="hidden lg:flex" />
        <button
          type="button"
          onClick={saveWorkspace}
          title="Save workspace"
          aria-label="Save workspace"
          className={cn(
            "flex h-8 items-center gap-2 rounded-lg bg-zinc-900 px-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 xl:px-3",
            FOCUS_RING
          )}
        >
          <Save aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
          <span className="hidden xl:inline">Save Workspace</span>
        </button>
      </div>
    </header>
  );
}
