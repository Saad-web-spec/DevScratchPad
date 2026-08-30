"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Save, Menu, MoreVertical } from "lucide-react";

interface TopBarProps {
  onOpenCommandPalette?: () => void;
  onOpenMobileMenu?: () => void;
}

export function TopBar({ onOpenCommandPalette, onOpenMobileMenu }: TopBarProps) {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveWorkspace = () => {
    window.dispatchEvent(new Event("save-workspace"));
    setIsOverflowOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 md:px-4 shrink-0 transition-colors">
      {/* Left side: Hamburger menu (mobile) + Brand logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors md:hidden focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 select-none" title="DevScratchpad">
            <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-b from-zinc-600 to-black drop-shadow-sm">D</span>
            <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-b from-zinc-600 to-black drop-shadow-sm">S</span>
          </div>
          <span className="font-semibold text-base md:text-lg tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
            DevScratchpad
          </span>
        </div>
      </div>

      {/* Middle: Search bar button */}
      <div className="flex items-center mx-2 flex-1 max-w-xs md:max-w-none md:flex-initial">
        <button
          onClick={onOpenCommandPalette}
          className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-[#131d33] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-cyan-500/40 transition-all text-xs sm:text-sm w-full sm:w-64 justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors" />
            <span className="truncate">Search tools...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium text-zinc-400 dark:text-zinc-400 group-hover:border-blue-300 dark:group-hover:border-zinc-600">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={handleSaveWorkspace}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg transition-all text-sm font-medium shadow-xs active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace</span>
          </button>
        </div>

        {/* Mobile Overflow Menu */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <button
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleSaveWorkspace}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition-colors text-left"
              >
                <Save className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Save Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
