"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import {
  encodeUrl,
  decodeUrl,
  validateUrl,
  type UrlEncodeMode,
} from "@/lib/tools/url";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Play, Copy, Trash2, ArrowLeftRight, Check , Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { StatusBar } from "@/components/layout/StatusBar";

interface UrlEncoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_URL =
  "https://example.com/search?query=web development & tools=scratchpad 2025#overview section";

export function UrlEncoderTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: UrlEncoderToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_URL);
  const [output, setOutput] = useState<string>("");
  const [action, setAction] = useState<"encode" | "decode">("encode");
  const [encodeMode, setEncodeMode] = useState<UrlEncodeMode>("component");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [isValid, setIsValid] = useState(true);
  const [execMs, setExecMs] = useState(0);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("url", "URL Encoder", input, output);
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
    const validation = validateUrl(input, action, encodeMode);
    const end = performance.now();
    const ms = end - start;

    setIsValid(validation.valid);
    setExecMs(ms);
    onValidationChange(validation.valid, validation.error);

    if (validation.valid) {
      try {
        const res =
          action === "encode"
            ? encodeUrl(input, encodeMode)
            : decodeUrl(input, encodeMode);
        setOutput(res);
      } catch (err: any) {
        setOutput("");
      }
    } else {
      setOutput("");
    }

    onStatsChange(input.length, ms);
  }, [input, action, encodeMode, onValidationChange, onStatsChange]);

  const handleAction = () => {
    const start = performance.now();
    try {
      const res =
        action === "encode"
          ? encodeUrl(input, encodeMode)
          : decodeUrl(input, encodeMode);
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
    const newAction = action === "encode" ? "decode" : "encode";
    setAction(newAction);
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
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex min-w-0 flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-zinc-100" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">URL Encoder & Decoder</h2>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <ExportImageButton code={output || input} language="plaintext" />
          <EmbedButton toolSlug="url-encoder" data={input} />
          <ShareButton toolSlug="url-encoder" data={input} />
          {/* Action Switcher */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setAction("encode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                action === "encode"
                  ? "bg-white dark:bg-zinc-950 text-zinc-100 dark:text-zinc-100 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => setAction("decode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                action === "decode"
                  ? "bg-white dark:bg-zinc-950 text-zinc-100 dark:text-zinc-100 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              Decode
            </button>
          </div>

          {/* Mode Selector */}
          <select
            value={encodeMode}
            onChange={(e) => setEncodeMode(e.target.value as UrlEncodeMode)}
            className="h-9 bg-[#18181B] border border-[#27272A] text-zinc-300 text-xs rounded-md px-2 focus:outline-none font-medium"
          >
            <option value="component">Component (encodeURIComponent)</option>
            <option value="full">Full URI (encodeURI)</option>
          </select>

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
            className="h-9 px-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{action === "encode" ? "Encode" : "Decode"}</span>
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
          {action === "encode" ? "Raw Input" : "Encoded Input"}
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
          {action === "encode" ? "Encoded Output" : "Decoded Output"}
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {action === "encode" ? "Raw URL / Text Input" : "Encoded URL Input"}
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
              {action === "encode" ? "Encoded URL Output" : "Decoded URL Output"}
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

export const UrlTool = UrlEncoderTool;
