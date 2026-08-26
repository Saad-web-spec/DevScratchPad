"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { encodeBase64, decodeBase64, validateBase64 } from "@/lib/tools/base64";
import { Play, Copy, Trash2, ArrowLeftRight, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

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

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, mode, urlSafe, onValidationChange, onStatsChange]);

  const handleAction = () => {
    const start = performance.now();
    try {
      const res =
        mode === "encode"
          ? encodeBase64(input, urlSafe)
          : decodeBase64(input, urlSafe);
      setOutput(res);
      onValidationChange(true);
      onLogHistory?.(input);
    } catch (err: any) {
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
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
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Base64 Encoder & Decoder</h2>
          <p className="text-[11px] text-slate-400">Convert text to Base64 and back with UTF-8 support</p>
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
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setMode("encode")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                mode === "encode"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                mode === "decode"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Decode
            </button>
          </div>

          {/* URL Safe Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            URL-Safe
          </label>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded text-xs font-medium transition-colors border border-slate-200"
            title="Swap input and output"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>

          {/* Process / Execute Button */}
          <button
            onClick={handleAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm shadow-blue-100"
          >
            <Play className="w-3.5 h-3.5" />
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
        </div>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {mode === "encode" ? "Raw Text Input" : "Base64 Input"}
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
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {mode === "encode" ? "Base64 Output" : "Decoded Text"}
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

export const Base64DecoderTool = Base64Tool;
