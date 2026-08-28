"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { encodeBase64, decodeBase64, validateBase64 } from "@/lib/tools/base64";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { Play, Copy, Trash2, ArrowLeftRight, Check , Binary } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { StatusBar, ValidationBadge, FloatingErrorBadge } from '@/components/layout/StatusBar';

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
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
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

  // Real-time validation
  useEffect(() => {
    const start = performance.now();
    let ms = 0;
    
    if (input) {
      try {
        if (mode === "encode") {
          encodeBase64(input, urlSafe);
        } else {
          decodeBase64(input, urlSafe);
        }
        ms = performance.now() - start;
        setIsValid(true);
        setErrorMsg(undefined);
        onValidationChange(true);
        
        // Auto-process on input change
        const res = mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe);
        setOutput(res);
      } catch (err: any) {
        ms = performance.now() - start;
        setIsValid(false);
        setErrorMsg(err.message);
        onValidationChange(false, err.message);
        setOutput("");
      }
    } else {
      setIsValid(true);
      setErrorMsg(undefined);
      onValidationChange(true);
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
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-zinc-100" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Base64 Encoder & Decoder</h2>
        </div>

        <div className="flex items-center gap-2">
          <EmbedButton toolSlug="base64-decoder" data={input} />
          <ShareButton toolSlug="base64-decoder" data={input} />

          {/* Mode Switcher */}
          <div className="bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg flex items-center h-8">
            <button
              onClick={() => setMode("encode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "encode"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 text-xs"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                mode === "decode"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 text-xs"
              )}
            >
              Decode
            </button>
          </div>

          {/* URL Safe Toggle */}
          <label className="flex items-center gap-1 cursor-pointer text-xs text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="rounded border-zinc-600 text-zinc-100 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>URL-Safe</span>
          </label>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!output}
            className="h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Swap input and output"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>

          {/* Process Button */}
          <button
            onClick={handleAction}
            className="h-8 px-3 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{mode === "encode" ? "Encode" : "Decode"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-zinc-800 p-1 border-b border-[#e2e8f0] dark:border-zinc-700 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 text-xs"
          )}
        >
          {mode === "encode" ? "Raw Input" : "Base64 Input"}
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 text-xs"
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
                copied ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
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
