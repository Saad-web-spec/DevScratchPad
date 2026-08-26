"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Save, Menu, MoreVertical, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface TopBarProps {
  onOpenCommandPalette?: () => void;
  onOpenMobileMenu?: () => void;
}

export function TopBar({ onOpenCommandPalette, onOpenMobileMenu }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-3 md:px-4 shrink-0 transition-colors">
      {/* Left side: Hamburger menu (mobile) + Brand logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors md:hidden focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 dark:bg-gradient-to-tr dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm dark:shadow-md dark:shadow-blue-500/25 transition-all">
            DS
          </div>
          <span className="font-semibold text-base md:text-lg tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-slate-300 truncate">
            DevScratchpad
          </span>
        </div>
      </div>

      {/* Middle: Search bar button */}
      <div className="flex items-center mx-2 flex-1 max-w-xs md:max-w-none md:flex-initial">
        <button
          onClick={onOpenCommandPalette}
          className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50 dark:bg-[#0e1526] hover:bg-slate-100 dark:hover:bg-[#131d33] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-cyan-500/40 transition-all text-xs sm:text-sm w-full sm:w-64 justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors" />
            <span className="truncate">Search tools...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-400 dark:text-slate-400 group-hover:border-blue-300 dark:group-hover:border-slate-600">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Theme toggle + Actions */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle with Glow */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-amber-400/10 transition-all focus:outline-none active:scale-95"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 transition-transform hover:rotate-45" /> : <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />}
        </button>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <button
            onClick={handleSaveWorkspace}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-blue-600 dark:via-indigo-600 dark:to-violet-600 dark:hover:from-blue-500 dark:hover:via-indigo-500 dark:hover:to-violet-500 text-white rounded-lg transition-all text-sm font-medium shadow-xs dark:shadow-md dark:shadow-indigo-500/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace</span>
          </button>
        </div>

        {/* Mobile Overflow Menu */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <button
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="More actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0e1526] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleSaveWorkspace}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors text-left"
              >
                <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Save Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
