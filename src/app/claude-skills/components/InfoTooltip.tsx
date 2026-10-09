"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InfoTooltipProps {
  title?: string;
  description: string;
  example?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

interface Coords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function InfoTooltip({
  title = "How to Edit",
  description,
  example,
  align = "right",
  className,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12; // safety margin from viewport edges

    // Responsive width: adapts to screen size, max 320px
    const maxWidth = Math.min(320, viewportWidth - padding * 2);

    let left = rect.left;
    if (align === "right") {
      left = rect.right - maxWidth;
    } else if (align === "center") {
      left = rect.left + rect.width / 2 - maxWidth / 2;
    }

    // Strictly clamp left position so it never overflows off left or right screen edge on mobile
    left = Math.max(padding, Math.min(left, viewportWidth - maxWidth - padding));

    // Vertical positioning: default below the button with a 6px gap
    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    let top: number | undefined = rect.bottom + 6;
    let bottom: number | undefined = undefined;
    let maxHeight = Math.min(440, Math.max(160, spaceBelow - 6));

    // If bottom space is tight (< 180px) and there's more room above, flip above button
    if (spaceBelow < 180 && spaceAbove > spaceBelow) {
      top = undefined;
      bottom = viewportHeight - rect.top + 6;
      maxHeight = Math.min(440, Math.max(160, spaceAbove - 6));
    }

    setCoords({ top, bottom, left, width: maxWidth, maxHeight });
  }, [align]);

  // Recalculate position when opened or when scrolling / resizing
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleScrollOrResize() {
      updatePosition();
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Click outside and Escape key listeners
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className={cn("relative inline-flex items-center align-middle", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label={`${title}: ${description}`}
        aria-expanded={isOpen}
        className={cn(
          "w-4 h-4 rounded-full inline-flex items-center justify-center transition-all cursor-pointer border shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500/25 touch-manipulation",
          isOpen
            ? "bg-orange-100 text-orange-700 border-orange-300 ring-2 ring-orange-500/20 shadow-2xs"
            : "bg-zinc-100 hover:bg-orange-50 text-zinc-400 hover:text-orange-600 border-zinc-200/90 hover:border-orange-200/90 shadow-2xs"
        )}
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {isOpen && mounted && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "fixed",
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: `${coords.maxHeight}px`,
          }}
          className="z-[9999] p-3.5 sm:p-4 bg-white/98 backdrop-blur-xl border border-zinc-200/90 rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.12),0_2px_10px_rgba(234,88,12,0.06)] text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto select-text font-sans overflow-y-auto overscroll-contain"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-orange-100/90 border border-orange-200/80 flex items-center justify-center shrink-0 text-orange-600 shadow-2xs">
                <Info className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-zinc-900 tracking-tight truncate">{title}</span>
            </div>
            <span className="text-[10px] font-medium tracking-tight text-orange-800 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              How to edit
            </span>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed font-sans mt-2.5 whitespace-pre-line">
            {description}
          </p>

          {example && (
            <div className="mt-3 pt-2.5 border-t border-zinc-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5 font-sans">
                Format Guide
              </span>
              <pre className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 text-[11px] font-mono text-zinc-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto select-all shadow-2xs">
                {example}
              </pre>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
