"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { renderMarkdown } from "@/lib/tools/markdown";
import { Trash2, Link as LinkIcon } from "lucide-react";

interface MarkdownPreviewerToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function MarkdownPreviewerTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: MarkdownPreviewerToolProps) {
  const [input, setInput] = useState<string>('# Hello Markdown');
  const [htmlOutput, setHtmlOutput] = useState<string>("");

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
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Markdown Previewer</h2>
          <p className="text-[11px] text-slate-400">Preview Markdown as HTML</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { try { window.location.hash = 'data=' + btoa(input); } catch(e) {} }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Markdown</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              height="100%"
              defaultLanguage="markdown"
              theme="vs"
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
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div 
              dangerouslySetInnerHTML={{ __html: htmlOutput }} 
              className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
