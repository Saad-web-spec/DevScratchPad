import React from "react";
import { Terminal } from "lucide-react";

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
    <article className="max-w-4xl mx-auto border-t border-neutral-200 my-10 pt-10 px-6 lg:px-0">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Main Prose */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            {explanation}
          </p>
          
          {howToUse && howToUse.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">How to use</h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-600 leading-relaxed">
                {howToUse.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {edgeCases && edgeCases.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Technical Considerations</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-600 leading-relaxed">
                {edgeCases.map((caseItem, idx) => (
                  <li key={idx}>{caseItem}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-neutral-500 mt-8 mb-4">
            <strong>100% Client-Side Privacy:</strong> This tool executes entirely within your browser's runtime environment. No payloads, tokens, or inputs are transmitted to external servers. Safe for offline usage.
          </p>

          {codeExamples && codeExamples.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-2">
                <Terminal className="w-4 h-4 text-neutral-500" />
                CLI / API Equivalents
              </h3>
              <div className="space-y-3">
                {codeExamples.map((ex, idx) => (
                  <div key={idx} className="border border-neutral-200 rounded overflow-hidden bg-neutral-50">
                    <div className="px-3 py-1.5 border-b border-neutral-200 bg-white flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                        {ex.language}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-neutral-800 overflow-x-auto m-0">
                      <code>{ex.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side Technical Specs / Shortcuts Table */}
        <div className="w-full md:w-64 shrink-0">
          <div className="border border-neutral-200 divide-y divide-neutral-200 rounded bg-white">
            <div className="p-3 bg-neutral-50">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Keyboard Shortcuts
              </h3>
            </div>
            <ul className="divide-y divide-neutral-100">
              {shortcuts.map((shortcut, idx) => {
                const parts = shortcut.split(/\s+[—–-]\s+/);
                const keys = parts[0] || shortcut;
                const desc = parts.slice(1).join(' — ') || keys;
                return (
                  <li key={idx} className="p-3 flex flex-col gap-1">
                    <span className="text-xs font-mono text-neutral-800 font-medium">
                      {keys.trim()}
                    </span>
                    <span className="text-[11px] text-neutral-500 leading-snug">
                      {desc || keys}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}