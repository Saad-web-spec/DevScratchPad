"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { jsonToTs, validateJsonForTs } from "@/lib/tools/json-to-ts";
import { Play, Copy, Trash2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonToTsToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_JSON = `{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874"\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net"\n  },\n  "tags": ["developer", "admin"],\n  "isActive": true\n}`;

export function JsonToTsTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: JsonToTsToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_JSON);
  const [output, setOutput] = useState<string>("");
  const [rootName, setRootName] = useState<string>("RootObject");
  const [copied, setCopied] = useState(false);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time conversion & validation
  useEffect(() => {
    const start = performance.now();
    const validation = validateJsonForTs(input);
    onValidationChange(validation.valid, validation.error, validation.line);

    if (validation.valid && input.trim()) {
      try {
        const tsResult = jsonToTs(input, rootName);
        setOutput(tsResult);
      } catch (err: any) {
        setOutput("");
        onValidationChange(false, err.message);
      }
    } else if (!input.trim()) {
      setOutput("");
    }

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, rootName, onValidationChange, onStatsChange]);

  // Dispatch custom events when input/output change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output },
        })
      );
      window.dispatchEvent(
        new CustomEvent("workspace-saved", {
          detail: { input, output },
        })
      );
    }
  }, [input, output]);

  const handleGenerate = () => {
    const start = performance.now();
    try {
      const tsResult = jsonToTs(input, rootName);
      setOutput(tsResult);
      onValidationChange(true);
      onLogHistory?.(input);
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
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">JSON to TypeScript Converter</h2>
          <p className="text-[11px] text-slate-400">Generate TypeScript interfaces from JSON data</p>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <label htmlFor="root-name-input" className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Root Interface:
            </label>
            <input
              id="root-name-input"
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="RootObject"
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-36 font-mono"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm shadow-blue-100"
          >
            <Play className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">JSON Input</span>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Clear"
            >
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
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">TypeScript Interfaces</span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              height="100%"
              defaultLanguage="typescript"
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
