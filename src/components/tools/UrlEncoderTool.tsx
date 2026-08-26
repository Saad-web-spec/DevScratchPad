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
import { Play, Copy, Trash2, ArrowLeftRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

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

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, action, encodeMode, onValidationChange, onStatsChange]);

  const handleAction = () => {
    const start = performance.now();
    try {
      const res =
        action === "encode"
          ? encodeUrl(input, encodeMode)
          : decodeUrl(input, encodeMode);
      setOutput(res);
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
    const newAction = action === "encode" ? "decode" : "encode";
    setAction(newAction);
    setInput(oldOutput);
  };

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
          <h2 className="text-sm font-semibold text-slate-800">URL Encoder & Decoder</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Safely encode and decode URL components and query parameters</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
          <ShareButton toolSlug="url-encoder" data={input} />
          {/* Action Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setAction("encode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                action === "encode"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => setAction("decode")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                action === "decode"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Decode
            </button>
          </div>

          {/* Mode Selector */}
          <select
            value={encodeMode}
            onChange={(e) => setEncodeMode(e.target.value as UrlEncodeMode)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="component">Component (encodeURIComponent)</option>
            <option value="full">Full URI (encodeURI)</option>
          </select>

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

          {/* Process Button */}
          <button
            onClick={handleAction}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{action === "encode" ? "Encode" : "Decode"}</span>
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
          {action === "encode" ? "Raw Input" : "Encoded Input"}
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
          {action === "encode" ? "Encoded Output" : "Decoded Output"}
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {action === "encode" ? "Raw URL / Text Input" : "Encoded URL Input"}
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
              defaultLanguage="plaintext"
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
              {action === "encode" ? "Encoded URL Output" : "Decoded URL Output"}
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
              defaultLanguage="plaintext"
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

export const UrlTool = UrlEncoderTool;
