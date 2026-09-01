import React from "react";
import { CheckCircle2, Terminal } from "lucide-react";

interface SeoArticleProps {
  title: string;
  explanation: string;
  codeExamples?: { language: string; code: string }[];
  shortcuts: string[];
}

export function SeoArticle({ title, explanation, codeExamples, shortcuts }: SeoArticleProps) {
  return (
    <article className="w-full bg-white border-t border-zinc-200">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 tracking-tight mb-3">
              {title}
            </h2>
            <div className="prose prose-sm prose-zinc text-zinc-600 leading-relaxed max-w-none">
              <p>{explanation}</p>
            </div>
          </div>

          {codeExamples && codeExamples.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                Examples
              </h3>
              <div className="space-y-3">
                {codeExamples.map((ex, idx) => (
                  <div key={idx} className="border border-zinc-200 rounded-md overflow-hidden bg-zinc-50">
                    <div className="px-3 py-1.5 border-b border-zinc-200 bg-white flex items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                        {ex.language}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-zinc-800 overflow-x-auto m-0">
                      <code>{ex.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="w-full md:w-72 shrink-0 space-y-6">
          <div className="border border-zinc-200 rounded-md bg-zinc-50 p-4">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-500" />
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2.5">
              {shortcuts.map((shortcut, idx) => {
                const [keys, ...descParts] = shortcut.split("—");
                const desc = descParts.join("—").trim();
                return (
                  <li key={idx} className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-zinc-800 font-medium">
                      {keys.trim()}
                    </span>
                    <span className="text-[11px] text-zinc-500 leading-snug">
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
