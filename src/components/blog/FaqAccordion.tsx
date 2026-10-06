"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { BlogFaq } from "@/lib/blog/types";

interface FaqAccordionProps {
  faqs: BlogFaq[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="my-10 pt-8 border-t border-zinc-200">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-4 h-4 text-zinc-700" />
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
          Frequently Asked Questions (FAQ)
        </h3>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                suppressHydrationWarning
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-zinc-800" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 bg-zinc-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
