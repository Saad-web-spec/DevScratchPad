"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { parseCurlCommand, generateFetch, generatePythonRequests, generateGoHttp } from "@/lib/tools/curl";
import { Copy, Trash2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface CurlConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
}

type LangTarget = 'javascript' | 'python' | 'go';

export function CurlConverterTool({ onValidationChange, onStatsChange }: CurlConverterToolProps) {
  const [input, setInput] = useState<string>("curl -X POST https://api.example.com/data \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Authorization: Bearer token123\" \\\n  -d '{\"key\":\"value\"}'");
  const [output, setOutput] = useState<string>("");
  const [target, setTarget] = useState<LangTarget>('javascript');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("curl", "cURL Converter", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  useEffect(() => {
    const start = performance.now();
    const parsed = parseCurlCommand(input);
    let code = "";
    
    if (parsed.error && input.trim().length > 0) {
      onValidationChange(false, parsed.error);
    } else {
      onValidationChange(true);
      if (target === 'javascript') code = generateFetch(parsed);
      if (target === 'python') code = generatePythonRequests(parsed);
      if (target === 'go') code = generateGoHttp(parsed);
      setOutput(code);
    }
    
    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, target, onValidationChange, onStatsChange]);

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
          <h2 className="text-sm font-semibold text-slate-800">cURL Converter</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Transform cURL commands into executable code</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(input);
              } catch {}
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <select 
            value={target}
            onChange={(e) => setTarget(e.target.value as LangTarget)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="javascript">JavaScript (fetch)</option>
            <option value="python">Python (requests)</option>
            <option value="go">Go (net/http)</option>
          </select>
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
          cURL Input
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
          Generated Code
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">cURL Input</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="shell"
              theme="vs"
              value={input}
              onChange={(value) => setInput(value || "")}
              options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", padding: { top: 16 } }}
            />
          </div>
        </div>

        {/* Right: Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Generated Code</span>
            <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              language={target}
              theme="vs"
              value={output}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: "on", padding: { top: 16 } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
