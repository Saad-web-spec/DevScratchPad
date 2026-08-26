"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { yamlToJson, jsonToYaml, validateYaml, validateJsonForYaml } from "@/lib/tools/yaml";
import { Play, Copy, Trash2, ArrowLeftRight, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface YamlConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_YAML = `server:
  port: 8080
  host: localhost
database:
  name: dev_db
  connections:
    max: 100
    idle: 10
features:
  - auth
  - logging
  - metrics
logging:
  level: info
  format: json
`;

export function YamlConverterTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: YamlConverterToolProps) {
  const [mode, setMode] = useState<"yaml-to-json" | "json-to-yaml">("yaml-to-json");
  const [input, setInput] = useState<string>(DEFAULT_YAML);
  const [output, setOutput] = useState<string>("");
  const [indent, setIndent] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time conversion & validation
  useEffect(() => {
    const start = performance.now();
    const isYamlMode = mode === "yaml-to-json";
    const validation = isYamlMode ? validateYaml(input) : validateJsonForYaml(input);
    
    onValidationChange(validation.valid, validation.error, validation.line);

    if (validation.valid && input.trim()) {
      try {
        const result = isYamlMode ? yamlToJson(input, indent) : jsonToYaml(input);
        setOutput(result);
      } catch (err: any) {
        setOutput("");
        onValidationChange(false, err.message);
      }
    } else if (!input.trim()) {
      setOutput("");
    } else {
      setOutput("");
    }

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, mode, indent, onValidationChange, onStatsChange]);

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

  const handleConvert = () => {
    const start = performance.now();
    try {
      const isYamlMode = mode === "yaml-to-json";
      const result = isYamlMode ? yamlToJson(input, indent) : jsonToYaml(input);
      setOutput(result);
      onValidationChange(true);
      onLogHistory?.(input);
      setActiveTab("output");
    } catch (err: any) {
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  };

  const handleSwap = () => {
    if (!output) return;
    const oldOutput = output;
    const newMode = mode === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json";
    setMode(newMode);
    setInput(oldOutput);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputLang = mode === "yaml-to-json" ? "yaml" : "json";
  const outputLang = mode === "yaml-to-json" ? "json" : "yaml";

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">YAML / JSON Converter</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Convert YAML to JSON and JSON to YAML bidirectionally</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
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
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setMode("yaml-to-json")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "yaml-to-json"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              YAML to JSON
            </button>
            <button
              onClick={() => setMode("json-to-yaml")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "json-to-yaml"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              JSON to YAML
            </button>
          </div>

          {/* Indent selector when converting to JSON */}
          {mode === "yaml-to-json" && (
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded text-xs font-medium transition-colors border border-slate-200"
            title="Swap input and output"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Convert</span>
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
          {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
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
          {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
            </span>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage={inputLang}
              language={inputLang}
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
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
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
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage={outputLang}
              language={outputLang}
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
