import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/* ---------------------------------------------------------------------------
 * Shared presentation for the guide / article content that sits under the
 * tools, on the home page, and on the Guides, Recipes and Developer Tools
 * pages. Monochrome only (black, white, zinc), system font, one type scale,
 * so every guide surface reads the same. Presentation only: no copy here.
 * ------------------------------------------------------------------------- */

export const guide = {
  /** Centred reading column. */
  column: "mx-auto w-full max-w-4xl px-4 sm:px-6",
  /** A top-level guide section: hairline on top, whitespace around. */
  section: "border-t border-zinc-200 py-10 sm:py-12",
  eyebrow: "text-xs font-medium uppercase tracking-wider text-zinc-500",
  h1: "text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl",
  h2: "text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl",
  h3: "text-[15px] font-medium leading-snug text-zinc-900",
  lead: "text-[15px] leading-relaxed text-zinc-600 sm:text-base",
  body: "text-sm leading-relaxed text-zinc-600 sm:text-[15px]",
  small: "text-[13px] leading-relaxed text-zinc-500",
  btnPrimary:
    "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700",
  btnSecondary:
    "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
  /** Quiet text link with a trailing arrow. */
  link: "inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-500",
  chip: "inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-600",
  code: "rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-800",
  /** Bordered link tile (one level deep, never nested). */
  card: "group flex flex-col rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 sm:p-5",
  /** List row separated by a hairline, used for tool lists. */
  row: "group flex min-h-14 items-center justify-between gap-4 border-t border-zinc-200 py-3.5",
} as const;

type HeadingTag = "h2" | "h3" | "h4";

interface SectionHeadingProps {
  title: ReactNode;
  as?: HeadingTag;
  id?: string;
  /** Optional link or meta shown on the right (wraps under the title on mobile). */
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, as: Tag = "h2", id, action, className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-1 ${className}`}>
      <Tag id={id} className={guide.h2}>
        {title}
      </Tag>
      {action}
    </div>
  );
}

/** Small text link with an arrow, for "view all" style actions. */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`group ${guide.link}`}>
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-zinc-900" aria-hidden="true" />
    </Link>
  );
}

interface ToolRowProps {
  href: string;
  title: ReactNode;
  description?: ReactNode;
  titleAs?: "h3" | "h4" | "p";
}

/** Hairline-separated tool row: name, one-line description, arrow. */
export function ToolRow({ href, title, description, titleAs: Title = "h3" }: ToolRowProps) {
  return (
    <Link href={href} className={guide.row}>
      <div className="min-w-0">
        <Title className="text-sm font-medium text-zinc-900 transition-colors group-hover:text-zinc-600 sm:text-[15px]">
          {title}
        </Title>
        {description ? <p className="mt-0.5 line-clamp-1 text-[13px] text-zinc-500">{description}</p> : null}
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-900"
        aria-hidden="true"
      />
    </Link>
  );
}

interface GuideCtaProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleAs?: HeadingTag;
  /** Short label shown as a chip next to the title. */
  badge?: ReactNode;
  description?: ReactNode;
  href: string;
  label: ReactNode;
  /** Use the diagonal arrow for jumps into another product area. */
  outbound?: boolean;
}

/** Flat call-to-action row: text on the left, one black button on the right. */
export function GuideCta({
  eyebrow,
  title,
  titleAs: Title = "h3",
  badge,
  description,
  href,
  label,
  outbound = false,
}: GuideCtaProps) {
  const Icon = outbound ? ArrowUpRight : ArrowRight;
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <div className={guide.eyebrow}>{eyebrow}</div> : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title className="text-base font-semibold tracking-tight text-zinc-900">{title}</Title>
          {badge ? <span className={guide.chip}>{badge}</span> : null}
        </div>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">{description}</p> : null}
      </div>
      <Link href={href} className={`${guide.btnPrimary} w-full sm:w-auto`}>
        <span>{label}</span>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
