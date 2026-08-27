"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { yamlToJson, jsonToYaml, validateYaml, validateJsonForYaml } from "@/lib/tools/yaml";
import { ShareButton } from "@/components/ShareButton";
import { Play, Copy, Trash2, ArrowLeftRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "@/components/layout/StatusBar";

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
  const [isValid, setIsValid] = useState(true);
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [execMs, setExecMs] = useState(0);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time conversion & validation
  useEffect(() => {
    const start = performance.now();
    const isYamlMode = mode === "yaml-to-json";
    const validation = isYamlMode ? validateYaml(input) : validateJsonForYaml(input);
    const end = performance.now();
    const ms = end - start;
    
    setIsValid(validation.valid);
    setErrorLine(validation.line);
    setExecMs(ms);
    onValidationChange(validation.valid, validation.error, validation.line);

    if (validation.valid && input.trim()) {
      try {
        const result = isYamlMode ? yamlToJson(input, indent) : jsonToYaml(input);
        setOutput(result);
      } catch (err: any) {
        setOutput("");
        setIsValid(false);
        onValidationChange(false, err.message);
      }
    } else if (!input.trim()) {
      setOutput("");
    } else {
      setOutput("");
    }

    onStatsChange(input.length, ms);
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
      setIsValid(true);
      onValidationChange(true);
      onLogHistory?.(input);
      setActiveTab("output");
    } catch (err: any) {
      setIsValid(false);
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    const ms = end - start;
    setExecMs(ms);
    onStatsChange(input.length, ms);
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">YAML / JSON Converter</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Convert YAML to JSON and JSON to YAML bidirectionally</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <ShareButton toolSlug="yaml-json" data={input} />
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setMode("yaml-to-json")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "yaml-to-json"
                  ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              YAML to JSON
            </button>
            <button
              onClick={() => setMode("json-to-yaml")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "json-to-yaml"
                  ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 rounded text-xs font-medium transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Swap input and output"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Convert</span>
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
          {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
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
          {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
            </span>
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
              defaultLanguage={inputLang}
              language={inputLang}
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
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
            </span>
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
              defaultLanguage={outputLang}
              language={outputLang}
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

      {/* Embedded 32px Status Bar */}
      <StatusBar
        isValid={isValid}
        errorLine={errorLine}
        inputLength={input.length}
        executionMs={execMs}
      />
    </div>
  );
}
