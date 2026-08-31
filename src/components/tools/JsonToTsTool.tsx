"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { validateJsonForTs } from "@/lib/tools/json-to-ts";
import { convertJsonToSchema, type TargetLanguage } from "@/lib/tools/polyglot-schema";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Play, Copy, Trash2, Check, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBar } from "@/components/layout/StatusBar";

interface JsonToTsToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_JSON = `{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874"\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net"\n  },\n  "tags": ["developer", "admin"],\n  "isActive": true\n}`;

const LANGUAGES: { id: TargetLanguage; label: string; monacoLang: string }[] = [
  { id: "typescript", label: "TypeScript", monacoLang: "typescript" },
  { id: "zod", label: "Zod Schema", monacoLang: "typescript" },
  { id: "go", label: "Go Struct", monacoLang: "go" },
  { id: "python", label: "Python (Pydantic)", monacoLang: "python" },
  { id: "rust", label: "Rust (Serde)", monacoLang: "rust" },
];

export function JsonToTsTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: JsonToTsToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_JSON);
  const [output, setOutput] = useState<string>("");
  const [targetLang, setTargetLang] = useState<TargetLanguage>("typescript");
  const [rootName, setRootName] = useState<string>("User");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [isValid, setIsValid] = useState(true);
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [execMs, setExecMs] = useState(0);

  // Restore from history / magic paste
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time conversion & validation
  useEffect(() => {
    const start = performance.now();
    const validation = validateJsonForTs(input);
    const end = performance.now();
    const ms = end - start;

    setIsValid(validation.valid);
    setErrorLine(validation.line);
    setExecMs(ms);
    onValidationChange(validation.valid, validation.error, validation.line);

    if (validation.valid && input.trim()) {
      try {
        const result = convertJsonToSchema(input, targetLang, rootName);
        setOutput(result);
      } catch (err: any) {
        setOutput("");
        setIsValid(false);
        onValidationChange(false, err.message);
      }
    } else if (!input.trim()) {
      setOutput("");
    }

    onStatsChange(input.length, ms);
  }, [input, targetLang, rootName, onValidationChange, onStatsChange]);

  const handleGenerate = () => {
    const start = performance.now();
    try {
      const result = convertJsonToSchema(input, targetLang, rootName);
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

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentMonacoLang =
    LANGUAGES.find((l) => l.id === targetLang)?.monacoLang || "typescript";

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-[#f8fafc] shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-zinc-900" />
          <h2 className="text-sm font-semibold text-zinc-800 whitespace-nowrap">
            JSON to Types &amp; Schemas
          </h2>
        </div>

        {/* Target Language Selector Pills */}
        <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg overflow-x-auto no-scrollbar shrink-0">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setTargetLang(lang.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                targetLang === lang.id
                  ? "bg-white text-zinc-900 shadow-xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportImageButton code={output || input} language={currentMonacoLang} />
          <EmbedButton toolSlug="json-to-typescript" data={input} />
          <ShareButton toolSlug="json-to-typescript" data={input} />

          <div className="hidden sm:flex items-center gap-1.5">
            <label
              htmlFor="root-name-input"
              className="text-xs text-zinc-500 font-medium whitespace-nowrap"
            >
              Root:
            </label>
            <input
              id="root-name-input"
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="User"
              className="h-8 bg-white border border-zinc-200 text-zinc-900 text-xs rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-24 font-mono"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="h-8 px-3 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate</span>
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
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          JSON Input
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          {LANGUAGES.find((l) => l.id === targetLang)?.label} Output
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div
          className={cn(
            "flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden",
            activeTab !== "input" && "hidden md:flex"
          )}
        >
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              JSON Input
            </span>
            <button
              onClick={() => setInput("")}
              className="text-zinc-400 hover:text-red-600 transition-colors"
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
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 w-full overflow-x-hidden bg-[#fafafa]",
            activeTab !== "output" && "hidden md:flex"
          )}
        >
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              {LANGUAGES.find((l) => l.id === targetLang)?.label} Definitions
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
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              key={targetLang}
              height="100%"
              defaultLanguage={currentMonacoLang}
              value={output}
              onChange={(value) => setOutput(value || "")}
              options={{
                readOnly: false,
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

      {/* Embedded Status Bar */}
      <StatusBar
        isValid={isValid}
        errorLine={errorLine}
        inputLength={input.length}
        executionMs={execMs}
      />
    </div>
  );
}
