"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { loadFromStorageEnvelope, saveToStorageEnvelope } from "@/lib/storage";
import { GUIDE_STORAGE_KEY, resolveGuideSteps, type GuideState, type GuideTab } from "../lib/studioGuide";

interface StudioGuideProps {
  /** Switches the studio's mobile tab so the next step's element is visible (no visual effect at lg and up). */
  onRequestTab: (tab: GuideTab) => void;
}

/** Waits two frames so a tab switch has rendered before driver.js measures the element. */
function afterPaint(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/** Below lg the popover docks to the bottom of the screen; this much room is kept free above it. */
const SHEET_SPACE = 210;
/** Body class while the tour runs: unsticks the studio header and hides floating widgets (globals.css). */
const RUNNING_CLASS = "studio-guide-running";

/**
 * Scrolls the page so the step's element sits fully in the visible band before driver.js measures it.
 * driver.js only scrolls elements that are off-screen, so an element already on screen but under the
 * mobile sheet would otherwise stay hidden. Too-tall elements are top-aligned instead of centered.
 */
function revealInBand(selector: string, bottomInset: number) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const band = window.innerHeight - bottomInset;
  let delta = 0;
  if (rect.height > band) {
    delta = rect.top - Math.max(0, Math.min(8, window.innerHeight - rect.height));
  } else if (rect.top < 8 || rect.bottom > band - 8) {
    delta = rect.top - (band - rect.height) / 2;
  }
  if (delta !== 0) window.scrollBy({ top: delta, behavior: "instant" });
}

/** The guide's character: a white folder with a face and an orange tab (eyes blink via `.guide-mascot-eye` in globals.css). */
function GuideMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M6 10a2.5 2.5 0 0 1 2.5-2.5h5l2.4 2.6h7.6A2.5 2.5 0 0 1 26 12.6V14H6z" fill="#fb923c" />
      <rect x="5" y="12" width="22" height="14" rx="3.5" fill="#fff" />
      <ellipse className="guide-mascot-eye" cx="12.5" cy="18.2" rx="1.4" ry="1.9" fill="#18181b" />
      <ellipse className="guide-mascot-eye" cx="19.5" cy="18.2" rx="1.4" ry="1.9" fill="#18181b" />
      <path d="M14.2 21.8q1.8 1.3 3.6 0" fill="none" stroke="#18181b" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9.6" cy="21" r="1.1" fill="#fdba74" opacity="0.8" />
      <circle cx="22.4" cy="21" r="1.1" fill="#fdba74" opacity="0.8" />
    </svg>
  );
}

/**
 * Floating helper (folder mascot) that walks first-time visitors through the studio.
 * Runs fully in the browser with driver.js (MIT); it only highlights existing elements, never adds layout.
 */
export function StudioGuide({ onRequestTab }: StudioGuideProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const driverRef = useRef<Driver | null>(null);
  const mascotRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    // Same key as legacy fallback: this state never existed under the studio's v1 key
    const saved = loadFromStorageEnvelope<GuideState>(GUIDE_STORAGE_KEY, GUIDE_STORAGE_KEY);
    if (saved?.seen) return;
    // Let the studio settle before offering the guide
    const timer = window.setTimeout(() => setShowIntro(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => driverRef.current?.destroy(), []);

  const markSeen = useCallback(() => {
    setShowIntro(false);
    saveToStorageEnvelope<GuideState>(GUIDE_STORAGE_KEY, { seen: true });
  }, []);

  const startTour = useCallback(async () => {
    markSeen();
    if (driverRef.current?.isActive()) return;

    const steps = resolveGuideSteps((selector) => document.querySelector(selector) !== null);
    if (steps.length === 0) return;

    const { driver } = await import("driver.js");

    // Desktop: popovers sit beside the element. Below lg: one bottom sheet, elements revealed above it.
    const isWide = window.matchMedia("(min-width: 1024px)").matches;
    const bottomInset = isWide ? 0 : SHEET_SPACE;

    const show = (index: number, run: () => void) => {
      onRequestTab(steps[index].tab);
      afterPaint(() => {
        revealInBand(steps[index].selector, bottomInset);
        run();
      });
    };

    const go = (tour: Driver, index: number) => {
      if (index < 0) return;
      if (index >= steps.length) {
        tour.destroy();
        return;
      }
      show(index, () => tour.moveTo(index));
    };

    const tour = driver({
      steps: steps.map((step) => ({
        element: step.selector,
        popover: { title: step.title, description: step.description, side: step.side, align: "start" },
      })),
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: isWide ? "studio-guide-popover" : "studio-guide-popover studio-guide-sheet",
      overlayColor: "#09090b",
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      smoothScroll: true,
      // Each popover "speaks" with the mascot's face next to its title
      onPopoverRender: (popover) => {
        const face = mascotRef.current?.querySelector("svg")?.cloneNode(true);
        if (!face) return;
        const avatar = document.createElement("span");
        avatar.className = "studio-guide-avatar";
        avatar.appendChild(face);
        popover.title.prepend(avatar);
      },
      onNextClick: (_el, _step, { driver: d }) => go(d, (d.getActiveIndex() ?? -1) + 1),
      onPrevClick: (_el, _step, { driver: d }) => go(d, (d.getActiveIndex() ?? 0) - 1),
      onDoneClick: (_el, _step, { driver: d }) => d.destroy(),
      onDestroyed: () => {
        document.body.classList.remove(RUNNING_CLASS);
        driverRef.current = null;
      },
    });

    driverRef.current = tour;
    document.body.classList.add(RUNNING_CLASS);
    show(0, () => tour.drive());
  }, [markSeen, onRequestTab]);

  if (!isMounted) return null;

  return (
    <div data-guide-hide className="fixed z-[60] left-3 bottom-20 lg:left-5 lg:bottom-5 flex items-end gap-2.5 font-gemini print:hidden">
      <button
        ref={mascotRef}
        type="button"
        onClick={startTour}
        aria-label="Open the studio guide"
        title="Guide: walk through the studio"
        className="w-11 h-11 shrink-0 rounded-full bg-zinc-900 ring-1 ring-white/10 shadow-lg shadow-black/25 grid place-items-center transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-95 cursor-pointer"
      >
        <GuideMascot className="w-8 h-8" />
      </button>

      {showIntro && (
        <div
          role="dialog"
          aria-label="Studio guide"
          className="relative mb-1.5 w-[min(16rem,calc(100vw-5rem))] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl shadow-black/10 animate-in fade-in slide-in-from-left-1 duration-200 before:absolute before:-left-1.5 before:bottom-3 before:w-3 before:h-3 before:rotate-45 before:bg-white before:border-l before:border-b before:border-zinc-200"
        >
          <p className="text-xs font-semibold text-zinc-900">New here?</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            I can walk you through the studio, from picking a file to downloading it. Takes about a minute.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={startTour}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
            >
              Show me
            </button>
            <button
              type="button"
              onClick={markSeen}
              className="px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 rounded-md transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
