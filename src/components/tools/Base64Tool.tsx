"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { encodeBase64, decodeBase64, validateBase64 } from "@/lib/tools/base64";
import { ShareButton } from "@/components/ShareButton";
import { Play, Copy, Trash2, ArrowLeftRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { StatusBar } from "@/components/layout/StatusBar";

interface Base64ToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_TEXT = "Hello, World! 🚀 DevScratchpad Base64 Utility";

export function Base64Tool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: Base64ToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_TEXT);
  const [output, setOutput] = useState<string>("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [isValid, setIsValid] = useState(true);
  const [execMs, setExecMs] = useState(0);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("base64", "Base64 Decoder", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time conversion & validation
  useEffect(() => {
    const start = performance.now();
    const validation = validateBase64(input, mode, urlSafe);
    const end = performance.now();
    const ms = end - start;

    setIsValid(validation.valid);
    setExecMs(ms);
    onValidationChange(validation.valid, validation.error);

    if (validation.valid) {
      try {
        const res =
          mode === "encode"
            ? encodeBase64(input, urlSafe)
            : decodeBase64(input, urlSafe);
        setOutput(res);
      } catch (err: any) {
        setOutput("");
      }
    } else {
      setOutput("");
    }

    onStatsChange(input.length, ms);
  }, [input, mode, urlSafe, onValidationChange, onStatsChange]);

  const handleAction = () => {
    const start = performance.now();
    try {
      const res =
        mode === "encode"
          ? encodeBase64(input, urlSafe)
          : decodeBase64(input, urlSafe);
      setOutput(res);
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
    const newMode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setInput(oldOutput);
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
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Base64 Encoder & Decoder</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Convert text to Base64 and back with UTF-8 support</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <ShareButton toolSlug="base64-decoder" data={input} />

          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setMode("encode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "encode"
                  ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "decode"
                  ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              Decode
            </button>
          </div>

          {/* URL Safe Toggle */}
          <label className="flex items-center gap-1 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>URL-Safe</span>
          </label>

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

          {/* Process Button */}
          <button
            onClick={handleAction}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{mode === "encode" ? "Encode" : "Decode"}</span>
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
          {mode === "encode" ? "Raw Input" : "Base64 Input"}
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
          {mode === "encode" ? "Base64 Output" : "Decoded Text"}
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {mode === "encode" ? "Raw Text Input" : "Base64 Input"}
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
        <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {mode === "encode" ? "Base64 Output" : "Decoded Text"}
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

      {/* Embedded 32px Status Bar */}
      <StatusBar
        isValid={isValid}
        inputLength={input.length}
        executionMs={execMs}
      />
    </div>
  );
}

export const Base64DecoderTool = Base64Tool;
