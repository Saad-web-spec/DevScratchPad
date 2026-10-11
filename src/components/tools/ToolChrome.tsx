"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { EditorProps } from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/components/layout/toolIcons";

/**
 * Shared chrome for the tool panels: one black / white / zinc vocabulary for
 * headers, pane bars, mobile pane tabs, buttons and form controls.
 *
 * Sizing rule: interactive controls are 40px tall on mobile and 32px from `md` up.
 * Icons are lucide at 16px (`size-4`) with a 1.75 stroke.
 */

/** Stroke width for every lucide icon inside the tool panels (shared with the sidebar and tab strip). */
export { ICON_STROKE };

/**
 * Shared Monaco options for tool panes. Module-level so every render passes the same object
 * (a fresh literal per render makes the editor wrapper re-apply options on each keystroke).
 * Font family/theme come from MonacoEditor's own defaults.
 */
export const EDITOR_OPTIONS: EditorProps["options"] = {
  minimap: { enabled: false },
  fontSize: 13,
  wordWrap: "on",
  scrollBeyondLastLine: false,
  padding: { top: 16 },
};

/** Spread onto a lucide icon inside a button: `<Copy {...iconProps} />`. */
export const iconProps = { className: "size-4 shrink-0", strokeWidth: ICON_STROKE, "aria-hidden": true } as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1";

/** Primary action: solid black, always the rightmost button of a control row. */
export const btnPrimary = `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-zinc-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:pointer-events-none disabled:bg-zinc-100 disabled:text-zinc-400 md:h-8 md:text-xs ${focusRing}`;

/** Secondary action: white with a hairline border. */
export const btnSecondary = `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:h-8 md:text-xs ${focusRing}`;

/** Quiet text button for pane bars (Copy, Clear, Download). */
export const btnGhost = `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:h-8 md:px-2 md:text-xs ${focusRing}`;

/** Icon-only button: 40px hit area on mobile, 32px from md up. Always pair with aria-label + title. */
export const btnIcon = `inline-flex size-10 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:size-8 ${focusRing}`;

/** Native select sized for touch. */
export const selectBase = `h-10 shrink-0 cursor-pointer rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 md:h-8 md:px-2 md:text-xs ${focusRing}`;

/** Single-line text / number input sized for touch. */
export const inputBase = `h-10 rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 md:h-8 md:px-2.5 md:text-xs ${focusRing}`;

/** Larger field used in form-style tools (labels above inputs). */
export const fieldBase =
  "w-full min-h-10 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";

/** Segmented control track + segment. Selected segment is a white pill on zinc-100. */
export const segmentTrack = "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-zinc-100 p-0.5";
export function segmentBtn(active: boolean) {
  return cn(
    `h-9 whitespace-nowrap rounded-[5px] px-2.5 text-[13px] font-medium transition-colors md:h-7 md:text-xs ${focusRing}`,
    active ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-900"
  );
}

/** Toggle chip (presets, quantities, flags). Selected chip is solid black. */
export function chipBtn(active: boolean) {
  return cn(
    `inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 text-[13px] font-medium transition-colors md:h-8 md:text-xs ${focusRing}`,
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
  );
}

/** Small uppercase caption used above fields and on pane bars. */
export const captionText = "text-[11px] font-semibold uppercase tracking-wider text-zinc-500";

interface ToolHeaderProps {
  icon: LucideIcon;
  title: ReactNode;
  /** Icon-only utilities (export image, embed, share). Sit next to the title on mobile. */
  utilities?: ReactNode;
  /** Options such as selects and segmented toggles. Rendered left of the actions. */
  options?: ReactNode;
  /** Buttons. Put the primary action last so it is always rightmost. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Tool title row. Title (with the share utilities at its right edge) and controls share one
 * row whenever they fit; the controls wrap underneath only when they do not. On phones the
 * secondary action buttons collapse to their icon (title/aria-label still describe them).
 */
export function ToolHeader({ icon: Icon, title, utilities, options, actions, className }: ToolHeaderProps) {
  const hasControls = Boolean(options || actions);
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-200 bg-white px-3 py-2 md:min-h-14 md:px-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-[1_1_auto] items-center gap-2">
        <Icon className="size-4 shrink-0 text-zinc-900" strokeWidth={ICON_STROKE} aria-hidden="true" />
        <span className="truncate text-sm font-semibold text-zinc-900">{title}</span>
        {utilities && <div className="-mr-1.5 ml-auto flex shrink-0 items-center md:mr-0">{utilities}</div>}
      </div>
      {hasControls && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {options}
          {actions && (
            <div className="flex shrink-0 items-center gap-2 max-sm:[&>button:not(:last-child):has(>svg)>span]:hidden">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PaneBarProps {
  label: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Thin caption bar on top of an editor pane, with optional actions on the right. */
export function PaneBar({ label, children, className }: PaneBarProps) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 pl-3 md:h-9 md:pr-0.5",
        className
      )}
    >
      <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      {children && <div className="flex shrink-0 items-center">{children}</div>}
    </div>
  );
}

interface MobilePaneTabsProps<T extends string> {
  tabs: { id: T; label: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
  /** Breakpoint from which both panes are visible side by side and the tabs hide. */
  hideFrom?: "md" | "lg";
  className?: string;
}

/** Input / output switcher shown only on narrow screens where panes stack. */
export function MobilePaneTabs<T extends string>({ tabs, active, onChange, hideFrom = "md", className }: MobilePaneTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex shrink-0 gap-1 border-b border-zinc-200 bg-zinc-100 p-1",
        hideFrom === "md" ? "md:hidden" : "lg:hidden",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            `h-9 min-w-0 flex-1 truncate rounded-md px-2 text-[13px] font-medium transition-colors ${focusRing}`,
            active === tab.id ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
