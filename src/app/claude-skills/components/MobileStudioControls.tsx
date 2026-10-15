"use client";

import React, { useEffect, useRef } from "react";
import { ArrowLeft, Check, Copy, Sliders, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab = "form" | "editor";

export interface MobileViewSwitcherProps {
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  lineCount: number;
}

/** Configure / Editor & Export tab switcher shown above the workspace below the lg breakpoint. */
export function MobileViewSwitcher({ mobileTab, setMobileTab, lineCount }: MobileViewSwitcherProps) {
  return (
    <div className="lg:hidden px-3 pt-3 max-w-7xl mx-auto w-full">
      <div className="flex items-center p-1 bg-zinc-200/80 rounded-xl border border-zinc-300/80 shadow-inner">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            mobileTab === "form"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          )}
        >
          <Sliders className="w-3.5 h-3.5 text-orange-500" />
          <span>Configure</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            mobileTab === "editor"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          )}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Editor & Export</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-200 font-mono leading-none">
            {lineCount}L
          </span>
        </button>
      </div>
    </div>
  );
}

export interface MobileActionBarProps {
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  currentFileName: string;
  lineCount: number;
  copied: boolean;
  handleCopy: () => void;
}

/** CSS variable with the space the bar takes at the bottom of the screen, so other floating UI (the guide) sits above it. */
export const ACTION_BAR_SPACE_VAR = "--studio-action-bar-space";

/** Floating action bar pinned to the bottom of the viewport below the lg breakpoint: jump to the code, or copy it. */
export function MobileActionBar({
  mobileTab,
  setMobileTab,
  currentFileName,
  lineCount,
  copied,
  handleCopy,
}: MobileActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  // Publish the bar's real height (it grows with the phone's text size) for anything that must clear it.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = () => {
      // Hidden (lg and up) means no rects; offsetParent is always null for fixed elements, so it cannot tell.
      const visible = bar.getClientRects().length > 0;
      root.style.setProperty(ACTION_BAR_SPACE_VAR, visible ? `${Math.ceil(window.innerHeight - bar.getBoundingClientRect().top)}px` : "0px");
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty(ACTION_BAR_SPACE_VAR);
    };
  }, []);

  return (
    <div ref={barRef} data-guide-hide className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
      {mobileTab === "form" ? (
        <button
          type="button"
          onClick={() => {
            setMobileTab("editor");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="w-full bg-zinc-900/95 hover:bg-black text-white px-4 py-3 rounded-xl shadow-2xl border border-zinc-700/90 flex items-center justify-between backdrop-blur-md transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold truncate">{currentFileName} Ready</span>
            <span className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 shrink-0">
              {lineCount}L
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-orange-400 shrink-0">
            <span>View Code</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-zinc-900/95 p-1.5 rounded-xl shadow-2xl border border-zinc-700/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setMobileTab("form");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-95 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
