"use client";

import { Shield, Search, ExternalLink, Save } from "lucide-react";

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
          DS
        </div>
        <span className="font-semibold text-lg tracking-tight text-slate-900">DevScratchpad</span>
      </div>

      <div className="flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-[#e2e8f0] transition-colors text-sm w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search tools...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">

        <div className="w-px h-6 bg-[#e2e8f0] mx-1"></div>
        <button 
          onClick={() => window.dispatchEvent(new Event('save-workspace'))}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Workspace</span>
        </button>
      </div>
    </header>
  );
}
