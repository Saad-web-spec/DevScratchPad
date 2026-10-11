import React from "react";
import { guide } from "./guideUi";

interface SeoArticleProps {
  title: string;
  explanation: string;
  codeExamples?: { language: string; code: string }[];
  shortcuts: string[];
  howToUse?: string[];
  edgeCases?: string[];
}

export function SeoArticle({ title, explanation, codeExamples, shortcuts, howToUse, edgeCases }: SeoArticleProps) {
  return (
    <article className={`${guide.column} pb-10 pt-4 sm:pb-12 sm:pt-6`}>
      <div className="max-w-3xl space-y-10">
        <header className="space-y-3">
          <h1 className={guide.h1}>{title}</h1>
          <p className={guide.lead}>{explanation}</p>
        </header>

        {howToUse && howToUse.length > 0 && (
          <section className="space-y-3">
            <h2 className={guide.h2}>How to use</h2>
            <ol className="space-y-2.5">
              {howToUse.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span aria-hidden="true" className="w-5 shrink-0 pt-px text-sm tabular-nums text-zinc-400 sm:text-[15px]">
                    {idx + 1}.
                  </span>
                  <span className={guide.body}>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {edgeCases && edgeCases.length > 0 && (
          <section className="space-y-3">
            <h2 className={guide.h2}>Technical Considerations</h2>
            <ul className="space-y-2.5">
              {edgeCases.map((caseItem, idx) => (
                <li key={idx} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                  <span className={guide.body}>{caseItem}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Keyboard shortcuts, only when the tool has any */}
        {shortcuts.length > 0 && (
          <section className="space-y-3">
            <h2 className={guide.h2}>Keyboard Shortcuts</h2>
            <ul className="space-y-2">
              {shortcuts.map((shortcut, idx) => {
                const parts = shortcut.split(/\s+[—–-]\s+/);
                const keys = parts[0] || shortcut;
                const desc = parts.slice(1).join(' — ') || keys;
                return (
                  <li key={idx} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <kbd className="whitespace-nowrap rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-800">
                      {keys.trim()}
                    </kbd>
                    <span className={guide.body}>{desc || keys}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {codeExamples && codeExamples.length > 0 && (
          <section className="space-y-3">
            <h2 className={guide.h2}>CLI / API Equivalents</h2>
            <div className="space-y-3">
              {codeExamples.map((ex, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg border border-zinc-200">
                  <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      {ex.language}
                    </span>
                  </div>
                  <pre className="m-0 overflow-x-auto p-3 font-mono text-xs leading-relaxed text-zinc-800">
                    <code>{ex.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="border-t border-zinc-200 pt-6 text-[13px] leading-relaxed text-zinc-500">
          <strong className="font-medium text-zinc-900">100% Client-Side Privacy:</strong> This tool executes entirely within your browser&apos;s runtime environment. No payloads, tokens, or inputs are transmitted to external servers.
        </p>
      </div>
    </article>
  );
}
