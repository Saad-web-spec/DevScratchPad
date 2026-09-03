"use client";

import React, { useEffect, useState } from "react";
import { List, ChevronRight } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Find all h2 and h3 elements in the article
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    elements.forEach((el, index) => {
      // If element doesn't have an id, generate one
      let id = el.id;
      if (!id) {
        id = `heading-${index}-${el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || ""}`;
        el.id = id;
      }
      items.push({
        id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);

    // Setup intersection observer for scroll spy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 mb-8">
      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 pb-2 border-b border-zinc-200">
        <List className="w-3.5 h-3.5" />
        <span>Table of Contents</span>
      </div>

      <ul className="space-y-1 text-xs">
        {headings.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              style={{ paddingLeft: item.level === 3 ? "12px" : "0px" }}
            >
              <a
                href={`#${item.id}`}
                className={`block py-1 transition-colors hover:text-zinc-900 ${
                  isActive
                    ? "text-zinc-900 font-semibold"
                    : "text-zinc-500 font-normal"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
