"use client";

import { useState, useRef, useEffect } from"react";
import { Search, Save, Menu, MoreVertical, Lock } from"lucide-react";
import Link from "next/link";
import { InstallAppButton } from "./InstallAppButton";

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
 <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-3 md:px-4 shrink-0 transition-colors">
 {/* Left side: Hamburger menu (mobile) + Brand logo */}
 <div className="flex items-center gap-2.5">
 <button
 onClick={onOpenMobileMenu}
 className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors md:hidden focus:outline-none"
 aria-label="Open Navigation Menu"
 >
 <Menu className="w-5 h-5"/>
 </button>

 <div className="flex items-center gap-2.5">
 <span className="font-semibold text-base md:text-lg tracking-tight text-zinc-900 truncate">
 DevScratchpad
 </span>
 </div>
 </div>

 {/* Middle: Search bar button */}
 <div className="flex items-center mx-2 flex-1 max-w-xs md:max-w-none md:flex-initial">
 <button
 onClick={onOpenCommandPalette}
 className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all text-xs sm:text-sm w-full sm:w-64 justify-between"
 >
 <div className="flex items-center gap-2 min-w-0">
 <Search className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-blue-500 transition-colors"/>
 <span className="truncate">Search tools...</span>
 </div>
 <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-medium text-zinc-400 group-hover:border-blue-300">
 ⌘K
 </kbd>
 </button>
 </div>

 {/* Right side: Actions */}
 <div className="flex items-center gap-2">

 {/* Desktop Action Buttons */}
 <div className="hidden md:flex items-center gap-3">
 <InstallAppButton />
 <Link
   href="/ai-skill-studio"
   className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors font-semibold shadow-xs hover:shadow-sm"
   title="AI Skill Studio"
 >
    <img src="/ai-skill-icon.png" className="w-4 h-3.5 object-contain" alt="AI Skill Studio" />
   <span>AI Skill Studio</span>
 </Link>
 <div className="bg-neutral-900 text-neutral-100 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5"><Lock className="w-3 h-3" /> 100% Local</div>
 <div className="w-px h-6 bg-zinc-200 mx-1"></div>
 <button
 onClick={handleSaveWorkspace}
 className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-all text-sm font-medium shadow-none active:scale-95"
 >
 <Save className="w-4 h-4"/>
 <span>Save Workspace</span>
 </button>
 </div>

 {/* Mobile Overflow Menu */}
 <div className="relative md:hidden"ref={dropdownRef}>
 <button
 onClick={() => setIsOverflowOpen((prev) => !prev)}
 className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none"
 aria-label="More actions"
 >
 <MoreVertical className="w-5 h-5"/>
 </button>

 {isOverflowOpen && (
 <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
 <Link
 href="/ai-skill-studio"
 onClick={() => setIsOverflowOpen(false)}
 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-900 hover:bg-zinc-50 font-semibold transition-colors text-left border-b border-zinc-100"
 >
 <img src="/ai-skill-icon.png" className="w-3.5 h-3.5 object-contain" alt="AI Skill Studio" />
 <span>AI Skill Studio</span>
 </Link>
 <button
 onClick={handleSaveWorkspace}
 className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 font-medium transition-colors text-left"
 >
 <Save className="w-4 h-4 text-zinc-500"/>
 <span>Save Workspace</span>
 </button>
 </div>
 )}
 </div>
 </div>
 </header>
 );
}
