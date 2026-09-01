"use client";

import { useState, useEffect, useCallback } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import {
  convertTextCase,
  deduplicateLines,
  sortLinesAsc,
  sortLinesDesc,
  trimLines,
  stripEmptyLines,
  getTextStats,
  type CaseType,
} from "@/lib/tools/case-converter";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import {
  Type,
  Copy,
  Check,
  Trash2,
  ArrowDownAZ,
  ArrowUpAZ,
  Layers,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface CaseConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const CASES: { id: CaseType; label: string; sample: string }[] = [
  { id: "camelCase", label: "camelCase", sample: "myVariableName" },
  { id: "PascalCase", label: "PascalCase", sample: "MyVariableName" },
  { id: "snake_case", label: "snake_case", sample: "my_variable_name" },
  { id: "CONSTANT_CASE", label: "CONSTANT_CASE", sample: "MY_VARIABLE_NAME" },
  { id: "kebab-case", label: "kebab-case", sample: "my-variable-name" },
  { id: "Title Case", label: "Title Case", sample: "My Variable Name" },
  { id: "Sentence case", label: "Sentence case", sample: "My variable name" },
  { id: "dot.case", label: "dot.case", sample: "my.variable.name" },
  { id: "path/case", label: "path/case", sample: "my/variable/name" },
];

const DEFAULT_TEXT = `user_account_settings\nuserAuthenticationToken\nget-user-profile-by-id\nAPI_GATEWAY_TIMEOUT\norder.billing.address`;

export function CaseConverterTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: CaseConverterToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_TEXT);
  const [targetCase, setTargetCase] = useState<CaseType>("camelCase");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(getTextStats(DEFAULT_TEXT));

  // Restore input from history / magic paste
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot("case-converter", "Case Converter", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  // Real-time conversion & stats
  useEffect(() => {
    const start = performance.now();
    const result = convertTextCase(input, targetCase);
    setOutput(result);
    setStats(getTextStats(input));
    onValidationChange(true);
    onStatsChange(input.length, performance.now() - start);
  }, [input, targetCase, onValidationChange, onStatsChange]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDeduplicate = () => {
    setInput((prev) => deduplicateLines(prev));
  };

  const handleSortAsc = () => {
    setInput((prev) => sortLinesAsc(prev));
  };

  const handleSortDesc = () => {
    setInput((prev) => sortLinesDesc(prev));
  };

  const handleTrim = () => {
    setInput((prev) => trimLines(prev));
  };

  const handleStripEmpty = () => {
    setInput((prev) => stripEmptyLines(prev));
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-[#f8fafc] shrink-0">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-zinc-900" />
          <h1 className="text-sm font-semibold text-zinc-800 whitespace-nowrap">
            String Case &amp; Text Converter
          </h1>
        </div>

        {/* Case Selector Pills */}
        <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg overflow-x-auto no-scrollbar shrink-0">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setTargetCase(c.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded-md transition-all whitespace-nowrap",
                targetCase === c.id
                  ? "bg-white text-zinc-900 shadow-none font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportImageButton code={output || input} language="plaintext" />
          <EmbedButton toolSlug="case-converter" data={input} />
          <ShareButton toolSlug="case-converter" data={input} />
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="h-9 border-b border-zinc-200 bg-white flex items-center justify-between px-3 md:px-4 shrink-0 overflow-x-auto no-scrollbar text-xs gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mr-1">
            Actions:
          </span>
          <button
            onClick={handleDeduplicate}
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Remove Duplicate Lines"
          >
            <Layers className="w-3 h-3" />
            <span>Deduplicate</span>
          </button>
          <button
            onClick={handleSortAsc}
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Sort Lines A-Z"
          >
            <ArrowDownAZ className="w-3 h-3" />
            <span>Sort A-Z</span>
          </button>
          <button
            onClick={handleSortDesc}
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Sort Lines Z-A"
          >
            <ArrowUpAZ className="w-3 h-3" />
            <span>Sort Z-A</span>
          </button>
          <button
            onClick={handleTrim}
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Trim Whitespace"
          >
            <Scissors className="w-3 h-3" />
            <span>Trim</span>
          </button>
          <button
            onClick={handleStripEmpty}
            className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium transition-colors"
            title="Remove Empty Lines"
          >
            Strip Empty
          </button>
        </div>

        {/* Live Text Statistics */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono shrink-0">
          <span>{stats.lines} lines</span>
          <span>•</span>
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.chars} chars</span>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className="flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Input Text
            </span>
            <button
              onClick={() => setInput("")}
              className="text-zinc-400 hover:text-red-600 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="plaintext"
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
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden bg-[#fafafa]">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              {targetCase} Output
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied
                  ? "text-zinc-900 font-medium"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          <div className="flex-1 relative w-full overflow-x-hidden">
            <MonacoEditor
              key={targetCase}
              height="100%"
              defaultLanguage="plaintext"
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
