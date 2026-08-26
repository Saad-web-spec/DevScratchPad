"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { renderMarkdown } from "@/lib/tools/markdown";
import { ShareButton } from "@/components/ShareButton";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownPreviewerToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function MarkdownPreviewerTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: MarkdownPreviewerToolProps) {
  const [input, setInput] = useState<string>('# Hello Markdown');
  const [htmlOutput, setHtmlOutput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output: htmlOutput },
        })
      );
    }
  }, [input, htmlOutput]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  useEffect(() => {
    let mounted = true;
    const start = performance.now();
    
    const updatePreview = async () => {
      try {
        const html = await renderMarkdown(input);
        if (mounted) {
          setHtmlOutput(html);
          onValidationChange(true);
        }
      } catch (err: any) {
        if (mounted) {
          onValidationChange(false, err.message);
        }
      } finally {
        if (mounted) {
          const end = performance.now();
          onStatsChange(input.length, end - start);
        }
      }
    };
    
    updatePreview();
    
    return () => {
      mounted = false;
    };
  }, [input, onValidationChange, onStatsChange]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-slate-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Markdown Previewer</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">Preview Markdown as HTML</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="markdown-previewer" data={input} />
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-slate-900 p-1 border-b border-[#e2e8f0] dark:border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Markdown Input
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Rendered Preview
        </button>
      </div>

      {/* Dual Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-slate-800 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Markdown</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="markdown"
              value={input}
              onChange={(value) => setInput(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Right: Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 w-full max-w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div 
              dangerouslySetInnerHTML={{ __html: htmlOutput }} 
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
