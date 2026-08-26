"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { parseCurlCommand, generateFetch, generatePythonRequests, generateGoHttp } from "@/lib/tools/curl";
import { Copy, Trash2, Check, FileTerminal, Link as LinkIcon } from "lucide-react";
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
    <div className="flex flex-col h-full bg-white">
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">cURL Converter</h2>
          <p className="text-[11px] text-slate-400">Transform cURL commands into executable code</p>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">cURL Input</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative">
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

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Generated Code</span>
            <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative">
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
