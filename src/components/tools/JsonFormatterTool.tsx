"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { formatJson, minifyJson, validateJson } from "@/lib/tools/json";
import { Play, Copy, Trash2, Maximize2, Minimize2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

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
    } catch (err: any) {
      // Validation already catches this, but just in case
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
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">JSON Formatter & Validator</h2>
          <p className="text-[11px] text-slate-400">Format, validate, and minify JSON data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(input);
              } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Share
          </button>
          <select 
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>

          <button onClick={handleMinify} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors border border-slate-200">
            <Minimize2 className="w-3.5 h-3.5" />
            Minify
          </button>
          
          <button onClick={handleFormat} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm shadow-blue-100">
            <Play className="w-3.5 h-3.5" />
            Format
          </button>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Input</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative">
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
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Output</span>
            <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative">
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
