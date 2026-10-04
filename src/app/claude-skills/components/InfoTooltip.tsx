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
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number | undefined = rect.bottom + 6;
    let bottom: number | undefined = undefined;

    // If bottom space is tight (< 160px) and there's more room above, flip above button
    if (spaceBelow < 160 && spaceAbove > spaceBelow) {
      top = undefined;
      bottom = viewportHeight - rect.top + 6;
    }

    setCoords({ top, bottom, left, width: maxWidth });
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
          "w-4 h-4 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer border shrink-0 focus:outline-none focus:ring-1 focus:ring-orange-500/40",
          isOpen
            ? "bg-zinc-800 text-orange-400 border-zinc-700 shadow-xs"
            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 border-zinc-200/90"
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
          }}
          className="z-[9999] p-3 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl text-left animate-in fade-in zoom-in-95 duration-100 pointer-events-auto select-text font-sans"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-xs font-bold text-zinc-100 truncate">{title}</span>
            </div>
            <span className="text-[10px] font-mono text-orange-400 bg-orange-950/80 border border-orange-800/80 px-1.5 py-0.5 rounded shrink-0">
              How to edit
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed mt-2 whitespace-pre-line">
            {description}
          </p>

          {example && (
            <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1 font-semibold">
                Format Guide:
              </span>
              <pre className="p-2 bg-zinc-950/90 rounded-md border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-tight max-h-32 overflow-y-auto">
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
