"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Library,
  Menu,
  ScrollText,
  FilePen,
  SquareTerminal,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "./toolIcons";

/**
 * The site's single primary navigation, shared by every header (content pages,
 * tool workspace, Skill Library, AI Skill Studio) so moving between sections
 * keeps the same brand mark, links and active state.
 *
 * Active state comes from `usePathname()`. The only `next.config` rewrites map
 * `/tools/*` aliases onto other `/tools/*` routes, so server and client always
 * agree on the active item and there is no hydration mismatch.
 */

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

/** True for `base` itself or any nested route below it (segment-aware, so `/skill` never matches `/skills`). */
function inSection(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: "Tools",
    icon: Wrench,
    isActive: (p) => p === "/" || inSection(p, "/tools") || inSection(p, "/developer-tools"),
  },
  { href: "/ai-skill-studio", label: "AI Skill Studio", icon: FilePen, isActive: (p) => inSection(p, "/ai-skill-studio") },
  { href: "/skill", label: "Skill Library", icon: Library, isActive: (p) => inSection(p, "/skill") },
  { href: "/blog", label: "Guides", icon: BookOpen, isActive: (p) => inSection(p, "/blog") },
  { href: "/recipes", label: "Recipes", icon: ScrollText, isActive: (p) => inSection(p, "/recipes") },
  { href: "/cli", label: "CLI", icon: SquareTerminal, isActive: (p) => inSection(p, "/cli") },
];

/**
 * Brand mark (icon + "DevScratchpad") linking home. Every header renders this so the brand is identical everywhere.
 * `labelClassName` lets a crowded header visually hide the wordmark on small screens; use `sr-only`-based classes
 * (not `hidden`) so the link keeps its accessible name.
 */
export function BrandLink({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex shrink-0 items-center gap-2 rounded-md", FOCUS_RING, className)}
    >
      <Image
        src="/icon.png"
        alt=""
        width={24}
        height={24}
        loading="eager"
        className="h-6 w-6 rounded-md object-contain"
      />
      <span
        className={cn(
          "text-sm font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-600",
          labelClassName
        )}
      >
        DevScratchpad
      </span>
    </Link>
  );
}

/**
 * Vertical (two-column) list of the primary links with icons, used inside mobile menus and drawers.
 * `onNavigate` runs after a link is chosen so the caller can close its panel.
 */
export function PrimaryNavList({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="grid grid-cols-2 gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-10 min-w-0 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-zinc-100 font-medium text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  FOCUS_RING
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={ICON_STROKE}
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-900"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Mobile-only menu: a 40px icon button that opens the primary links in a full-width panel under the header
 * (closes on Escape, outside click, or choosing a link).
 *
 * The panel is `fixed` just below a 56px (`h-14`) header. Inside a header that uses `backdrop-blur`, `fixed`
 * resolves against the header instead of the viewport; both give the same position for a sticky top-0 header.
 */
export function PrimaryNavMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("md:hidden", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className={cn(
          "grid size-10 place-items-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
          isOpen && "bg-zinc-100 text-zinc-900",
          FOCUS_RING
        )}
      >
        {isOpen ? (
          <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5" />
        ) : (
          <Menu aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5" />
        )}
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="fixed inset-x-0 top-14 z-50 border-b border-zinc-200 bg-white px-3 pb-3 pt-2"
        >
          <PrimaryNavList onNavigate={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

/**
 * Primary site navigation: inline text links from `md` up. Below `md` it renders `PrimaryNavMenu` unless
 * `showMobileMenu` is false (the tool workspace puts the same links in its tool drawer instead, and
 * `SiteHeader` places `PrimaryNavMenu` itself so the trigger sits at the far right).
 */
export function PrimaryNav({ className, showMobileMenu = true }: { className?: string; showMobileMenu?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center", className)}>
      {/* Desktop / tablet: inline text links */}
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors lg:px-2.5 xl:text-sm",
                    active
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                    FOCUS_RING
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showMobileMenu && <PrimaryNavMenu />}
    </div>
  );
}
