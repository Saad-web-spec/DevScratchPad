"use client";

import React, { useEffect, useState, useRef } from "react";
import { List, ChevronDown, ChevronRight } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  isMobile?: boolean;
}

export function TableOfContents({ isMobile = false }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find all h2 and h3 elements in the article
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    elements.forEach((el, index) => {
      // Exclude callout banners, widgets, or elements explicitly marked with data-toc-ignore
      if (
        el.hasAttribute("data-toc-ignore") ||
        el.closest("[data-toc-ignore], .toc-ignore, aside, footer")
      ) {
        return;
      }

      let id = el.id;
      if (!id) {
        const textSlug =
          el.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "";
        id = `heading-${index}-${textSlug || "section"}`;
        el.id = id;
      }

      items.push({
        id,
        text: el.textContent?.trim() || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);

    if (items.length > 0) {
      setActiveId(items[0].id);
    }

    // Scroll spy using requestAnimationFrame for butter-smooth accuracy
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + 110;
          let current = items[0]?.id || "";

          for (const item of items) {
            const el = document.getElementById(item.id);
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY;
              if (scrollPosition >= top) {
                current = item.id;
              } else {
                break;
              }
            }
          }

          if (current) {
            setActiveId(current);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Auto-scroll the TOC container so the active heading stays in view within the TOC list
  useEffect(() => {
    if (!activeId || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const activeEl = container.querySelector<HTMLElement>(`[data-toc-id="${activeId}"]`);
    if (!activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();

    if (itemRect.top < containerRect.top + 8) {
      container.scrollBy({
        top: itemRect.top - containerRect.top - 16,
        behavior: "smooth",
      });
    } else if (itemRect.bottom > containerRect.bottom - 8) {
      container.scrollBy({
        top: itemRect.bottom - containerRect.bottom + 16,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      if (history.pushState) {
        history.pushState(null, "", `#${id}`);
      }
      setActiveId(id);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    }
  };

  if (headings.length === 0) return null;

  // Mobile Collapsible Accordion Mode
  if (isMobile) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-2xs mb-8">
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-zinc-100/70 hover:bg-zinc-100 transition-colors text-left"
          aria-expanded={isMobileOpen}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-800">
            <List className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Table of Contents ({headings.length} sections)</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isMobileOpen ? "rotate-180 text-zinc-700" : ""
            }`}
          />
        </button>

        {isMobileOpen && (
          <div className="p-3 max-h-80 overflow-y-auto overscroll-contain border-t border-zinc-200 space-y-0.5 text-xs">
            <ul className="space-y-0.5">
              {headings.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li
                    key={item.id}
                    style={{ paddingLeft: item.level === 3 ? "12px" : "0px" }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleLinkClick(e, item.id)}
                      className={`block py-1.5 px-2 rounded-md text-xs leading-snug transition-colors ${
                        isActive
                          ? "bg-orange-50 text-orange-950 font-semibold border-l-2 border-orange-600 pl-2.5"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 font-normal"
                      }`}
                    >
                      {item.level === 3 ? `↳ ${item.text}` : item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Desktop Sticky Scrollable Sidebar Mode
  return (
    <nav
      aria-label="Table of Contents"
      className="bg-white/95 backdrop-blur-xs border border-zinc-200 rounded-xl overflow-hidden shadow-xs flex flex-col max-h-[calc(100vh-6.5rem)]"
    >
      {/* Fixed Header of TOC Card */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-800">
          <List className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>Table of Contents</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200/60 px-1.5 py-0.5 rounded font-medium">
          {headings.length}
        </span>
      </div>

      {/* Independently Scrollable Container: Never Cut Off, Never Stuck */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto overscroll-contain py-2 px-2 space-y-0.5 text-xs scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 focus:outline-none"
        style={{ scrollbarGutter: "stable" }}
      >
        <ul className="space-y-0.5">
          {headings.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                data-toc-id={item.id}
                style={{ paddingLeft: item.level === 3 ? "10px" : "0px" }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleLinkClick(e, item.id)}
                  title={item.text}
                  className={`group flex items-start gap-1.5 py-1 px-2 rounded-md transition-all text-xs leading-snug ${
                    isActive
                      ? "bg-orange-50 text-orange-950 font-semibold border-l-2 border-orange-600 pl-2.5"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 font-normal"
                  }`}
                >
                  {item.level === 3 && (
                    <span
                      className={`text-[10px] transition-colors shrink-0 mt-0.5 ${
                        isActive ? "text-orange-600 font-bold" : "text-zinc-400 group-hover:text-zinc-500"
                      }`}
                    >
                      ↳
                    </span>
                  )}
                  <span className="line-clamp-2">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
