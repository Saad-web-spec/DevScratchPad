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
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-3 md:px-4 shrink-0">
      {/* Left side: Hamburger menu (mobile) + Brand logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
            DS
          </div>
          <span className="font-semibold text-base md:text-lg tracking-tight text-slate-900 truncate">
            DevScratchpad
          </span>
        </div>
      </div>

      {/* Middle: Search bar button */}
      <div className="flex items-center mx-2 flex-1 max-w-xs md:max-w-none md:flex-initial">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-[#e2e8f0] transition-colors text-xs sm:text-sm w-full sm:w-64 justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">Search tools...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions (Desktop) & Overflow Menu (Mobile) */}
      <div className="flex items-center gap-2">
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-6 bg-[#e2e8f0] mx-1"></div>
          <button
            onClick={handleSaveWorkspace}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace</span>
          </button>
        </div>

        {/* Mobile Overflow Menu */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <button
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleSaveWorkspace}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
