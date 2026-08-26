"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { jsonToTs, validateJsonForTs } from "@/lib/tools/json-to-ts";
import { ShareButton } from "@/components/ShareButton";
import { Play, Copy, Trash2, Check } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

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
      setActiveTab("output");
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JSON to TypeScript Converter</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Generate TypeScript interfaces from JSON data</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <ShareButton toolSlug="json-to-typescript" data={input} />
          <div className="flex items-center gap-1.5">
            <label htmlFor="root-name-input" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
              Root:
            </label>
            <input
              id="root-name-input"
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="RootObject"
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 w-28 md:w-36 font-mono"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-zinc-800 p-1 border-b border-[#e2e8f0] dark:border-zinc-700 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          JSON Input
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          TypeScript Output
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">JSON Input</span>
            <button
              onClick={() => setInput("")}
              className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
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
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">TypeScript Interfaces</span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="typescript"
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
