"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTTON, BUTTON_ACCENT } from "./theme";

interface ToolbarPopoverProps {
  label: ReactNode;
  /** Accessible name when the label is an icon or abbreviated text. */
  ariaLabel?: string;
  align?: "left" | "right";
  /** `accent` renders the trigger as the page's main action (soft violet). */
  variant?: "default" | "accent";
  panelClassName?: string;
  /** Receives a close function so menu items can dismiss the panel. */
  children: (close: () => void) => ReactNode;
  /** Open state is lifted when a parent needs to open the panel itself. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ToolbarPopover({ label, ariaLabel, align = "left", variant = "default", panelClassName, children, open: controlledOpen, onOpenChange }: ToolbarPopoverProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  /** Horizontal nudge that keeps the open panel inside the window (a narrow pane can push it past an edge). */
  const [shift, setShift] = useState(0);
  const shiftRef = useRef(0);

  useLayoutEffect(() => {
    if (!open) return;
    const fit = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const margin = 8;
      // Measure where the panel sits without the current nudge, then move it just enough.
      const rect = panel.getBoundingClientRect();
      const left = rect.left - shiftRef.current;
      const right = rect.right - shiftRef.current;
      const next = left < margin ? margin - left : right > window.innerWidth - margin ? Math.max(margin - left, window.innerWidth - margin - right) : 0;
      shiftRef.current = next;
      setShift(next);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setInnerOpen(false);
        onOpenChange?.(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInnerOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const accent = variant === "accent";
  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className={cn(accent ? BUTTON_ACCENT : BUTTON, open && (accent ? "border-orange-300 bg-orange-100" : "border-zinc-300 bg-zinc-50 text-zinc-900"))}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", accent ? "text-orange-500" : "text-zinc-400", open && "rotate-180")} />
      </button>
      {open && (
        <div
          id={panelId}
          ref={panelRef}
          style={shift ? { transform: `translateX(${shift}px)` } : undefined}
          className={cn(
            "absolute top-full z-50 mt-1.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  children: ReactNode;
  hint?: string;
  onClick: () => void;
}

export function MenuItem({ icon, children, hint, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:bg-zinc-100 focus-visible:outline-hidden"
    >
      {icon && <span className="mt-0.5 shrink-0 text-zinc-500">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-semibold">{children}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{hint}</span>}
      </span>
    </button>
  );
}
