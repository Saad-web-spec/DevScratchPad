"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { formatJson, minifyJson, validateJson } from "@/lib/tools/json";
import { Play, Copy, Trash2, Minimize2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ShareButton } from "@/components/ShareButton";

interface JsonFormatterToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function JsonFormatterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: JsonFormatterToolProps) {
  const [input, setInput] = useState<string>('{\n  "hello": "world"\n}');
  const [output, setOutput] = useState<string>("");
  const [indent, setIndent] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("json-formatter", "JSON Formatter", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time validation
  useEffect(() => {
    const start = performance.now();
    const { valid, error, line } = validateJson(input);
    const end = performance.now();
    
    onValidationChange(valid, error, line);
    onStatsChange(input.length, end - start);
  }, [input, onValidationChange, onStatsChange]);

  const handleFormat = () => {
    const start = performance.now();
    try {
      const formatted = formatJson(input, indent);
      setOutput(formatted);
      onValidationChange(true);
      onLogHistory?.(input);
      setActiveTab("output");
    } catch (err: any) {
      // Validation already catches this
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  };

  const handleMinify = () => {
    const start = performance.now();
    try {
      const minified = minifyJson(input);
      setOutput(minified);
      onLogHistory?.(input);
      setActiveTab("output");
    } catch (err) {}
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
          <h2 className="text-sm font-semibold text-slate-800">JSON Formatter & Validator</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Format, validate, and minify JSON data</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="json-formatter" data={input} />
          <select 
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>

          <button onClick={handleMinify} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors border border-slate-200">
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>
          
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
          Input Editor
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
          Output Result
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
              defaultLanguage="json"
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
              defaultLanguage="json"
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
