"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { formatGraphQL } from "@/lib/tools/graphql";
import { ShareButton } from "@/components/ShareButton";
import { Play, Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GraphqlFormatterToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function GraphqlFormatterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: GraphqlFormatterToolProps) {
  const [input, setInput] = useState<string>('query {\n  hello\n}');
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output },
        })
      );
    }
  }, [input, output]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  const handleFormat = () => {
    const start = performance.now();
    try {
      const result = formatGraphQL(input);
      if (result.valid) {
        setOutput(result.formatted || "");
        onValidationChange(true);
        onLogHistory?.(input);
        setActiveTab("output");
      } else {
        onValidationChange(false, result.error);
      }
    } catch (err: any) {
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">GraphQL Formatter</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Format and validate GraphQL queries</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="graphql-formatter" data={input} />
          
          <button onClick={handleFormat} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs">
            <Play className="w-3.5 h-3.5" />
            <span>Format</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] p-1 border-b border-[#e2e8f0] shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Input Query
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Formatted Result
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Input</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="graphql"
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
        <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Output</span>
            <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="graphql"
              theme="vs"
              value={output}
              options={{
                readOnly: true,
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
      </div>
    </div>
  );
}
