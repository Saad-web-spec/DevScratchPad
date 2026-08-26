"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { minifyCss, minifySvg, validateCss, validateSvg } from "@/lib/tools/minify";
import { Play, Copy, Trash2, Check, Zap, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinifierToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_CSS = `/* Main Application Layout Styles */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.nav-link {
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
}
`;

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- Circle icon background -->
  <circle cx="12" cy="12" r="10"></circle>
  <!-- Inner path -->
  <polyline points="12 6 12 12 14 14"></polyline>
</svg>`;

export function MinifierTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: MinifierToolProps) {
  const [mode, setMode] = useState<"css" | "svg">("css");
  const [input, setInput] = useState<string>(DEFAULT_CSS);
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time validation
  useEffect(() => {
    const start = performance.now();
    const validation = mode === "css" ? validateCss(input) : validateSvg(input);
    onValidationChange(validation.valid, validation.error);

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, mode, onValidationChange, onStatsChange]);

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

  const handleMinify = () => {
    const start = performance.now();
    try {
      const minified = mode === "css" ? minifyCss(input) : minifySvg(input);
      setOutput(minified);
      onValidationChange(true);
      onLogHistory?.(input);
    } catch (err: any) {
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  };

  const handleModeChange = (newMode: "css" | "svg") => {
    setMode(newMode);
    setInput(newMode === "css" ? DEFAULT_CSS : DEFAULT_SVG);
    setOutput("");
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savedBytes = input.length - output.length;
  const savingsPercent = input.length > 0 && output.length > 0
    ? ((savedBytes / input.length) * 100).toFixed(1)
    : "0";

  const editorLang = mode === "css" ? "css" : "xml";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">CSS & SVG Minifier</h2>
          <p className="text-[11px] text-slate-400">Fast client-side minification removing whitespace, comments, and newlines</p>
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
          {/* Mode Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="minifier-mode-select" className="text-xs text-slate-500 font-medium">
              Mode:
            </label>
            <select
              id="minifier-mode-select"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as "css" | "svg")}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="css">CSS Minifier</option>
              <option value="svg">SVG Minifier</option>
            </select>
          </div>

          {/* Compression savings badge */}
          {output && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              <Zap className="w-3 h-3 text-emerald-600" />
              Saved {savedBytes > 0 ? savedBytes : 0} B ({savingsPercent}%)
            </span>
          )}

          {/* Minify Button */}
          <button
            onClick={handleMinify}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm shadow-blue-100"
          >
            <Play className="w-3.5 h-3.5" />
            Minify
          </button>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {mode === "css" ? "Raw CSS Input" : "Raw SVG Input"}
            </span>
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
              defaultLanguage={editorLang}
              language={editorLang}
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
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Minified Output
            </span>
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
              defaultLanguage={editorLang}
              language={editorLang}
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
