/**
 * Visual language of the /graph studio (its own, separate from the rest of the site): zinc neutrals
 * with orange as the single accent (selection, the active stage, the main action). Node types are
 * told apart by their icon, not by color. Typography comes from `.graph-theme` (Manrope +
 * JetBrains Mono, globals.css).
 */
import { Bot, CircleDot, Cpu, Merge, ShieldCheck, Split, SquareTerminal, UserCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "../lib/graphSkill";

/** The icon that tells node types apart (on the canvas cards and in the Inspector header). */
export const TYPE_ICON: Record<NodeType, LucideIcon> = {
  input: CircleDot,
  orchestrator: Split,
  worker: Cpu,
  verifier: ShieldCheck,
  synthesizer: Merge,
  agent: Bot,
  code: SquareTerminal,
  approval: UserCheck,
};

export const FOCUS_RING = "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1";

export const FIELD =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 transition-colors hover:border-zinc-300 focus-visible:outline-hidden focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20";

export const LABEL = "mb-1 block text-[11.5px] font-semibold text-zinc-600";

/** Neutral toolbar / form button. */
export const BUTTON = cn(
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
  FOCUS_RING
);

/** The page's main action: a soft orange tint, never a heavy dark fill. */
export const BUTTON_ACCENT = cn(
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-[13px] font-semibold text-orange-800 transition-colors hover:border-orange-300 hover:bg-orange-100",
  FOCUS_RING
);

/**
 * Pages around the studio (landing, kit download): the one call to action per view. The same soft tint as
 * the studio's Export button (BUTTON_ACCENT); a saturated fill looked glossy. Size comes from the caller.
 */
export const BUTTON_PRIMARY = cn(
  "inline-flex items-center justify-center gap-2 rounded-md border border-orange-200 bg-orange-50 font-semibold text-orange-800 transition-colors hover:border-orange-300 hover:bg-orange-100",
  FOCUS_RING
);

/** The quieter action beside it. */
export const BUTTON_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white font-semibold text-zinc-900 transition-colors hover:bg-zinc-50",
  FOCUS_RING
);

export const SMALL_BUTTON = cn(
  "inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-colors",
  FOCUS_RING
);

export interface NodeTheme {
  /** Icon tile on the node card. */
  tile: string;
  /** Small type label. */
  label: string;
  /** Solid dot color (menus, plan). */
  dot: string;
}

const NEUTRAL: NodeTheme = { tile: "bg-zinc-100 text-zinc-700", label: "text-zinc-500", dot: "bg-zinc-400" };

/** Every type looks the same; the icon carries the meaning. Kept as a map so a type can be singled out later. */
export const NODE_THEME: Record<NodeType, NodeTheme> = {
  input: NEUTRAL,
  orchestrator: NEUTRAL,
  worker: NEUTRAL,
  verifier: NEUTRAL,
  synthesizer: NEUTRAL,
  agent: NEUTRAL,
  code: NEUTRAL,
  approval: NEUTRAL,
};
