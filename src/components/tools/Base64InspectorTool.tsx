"use client";

import { useState, useEffect, useMemo } from "react";
import {
  inspectAndConvert,
  type DetectedFormat,
  type InspectorConversions,
} from "@/lib/tools/base64-inspector";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Copy, Trash2, Check, Binary, Image as ImageIcon, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface Base64InspectorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_SAMPLE = "DevScratchpad — 100% Client-Side Privacy Suite ⚡";

const SAMPLES: { label: string; value: string; format?: DetectedFormat }[] = [
  { label: "Sample Text", value: DEFAULT_SAMPLE },
  { label: "Base64", value: "RGV2U2NyYXRjaHBhZCDigJQgMTAwJSBDbGllbnQtU2lkZSBQcml2YWN5IFN1aXRlIOKaoc+P" },
  { label: "Hex", value: "44 65 76 53 63 72 61 74 63 68 70 61 64" },
  { label: "Binary", value: "01000100 01100101 01110110 01010011 01100011 01110010 01100001 01110100 01100011 01101000" },
  {
    label: "Data URL (PNG)",
    value:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzAAAO9wB/58pdaMAAAAAElFTkSuQmCC",
  },
];

export function Base64InspectorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: Base64InspectorToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE);
  const [forcedFormat, setForcedFormat] = useState<DetectedFormat | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"cards" | "hexdump">("cards");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("base64-inspector", "Base64 / Hex / Binary Inspector", input, JSON.stringify(conversions, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input]);

  // Conversions computation
  const conversions: InspectorConversions = useMemo(() => {
    const start = performance.now();
    try {
      const result = inspectAndConvert(input, forcedFormat);
      const end = performance.now();
      onValidationChange(true);
      onStatsChange(input.length, Math.round((end - start) * 10) / 10);
      return result;
    } catch (err: any) {
      onValidationChange(false, err.message);
      return inspectAndConvert(input);
    }
  }, [input, forcedFormat, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onLogHistory?.(input);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDownloadImage = () => {
    if (!conversions.dataUrlInfo.fullDataUrl) return;
    const a = document.createElement("a");
    a.href = conversions.dataUrlInfo.fullDataUrl;
    const ext = conversions.dataUrlInfo.mimeType?.split("/")[1] || "png";
    a.download = `devscratchpad-image.${ext}`;
    a.click();
  };

  const FORMAT_PILLS: { id: DetectedFormat | "auto"; label: string }[] = [
    { id: "auto", label: "Auto-Detect" },
    { id: "plain-text", label: "Plain Text" },
    { id: "base64", label: "Base64" },
    { id: "hex", label: "Hex" },
    { id: "binary", label: "Binary" },
    { id: "url-encoded", label: "URL Encoded" },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Controls Bar */}
      <div className="h-12 border-b border-zinc-200 px-4 flex items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Detected:</span>
            <span className="font-semibold text-blue-600 uppercase tracking-wide">
              {conversions.detectedFormat}
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {FORMAT_PILLS.map((p) => {
            const isSelected = p.id === "auto" ? forcedFormat === undefined : forcedFormat === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setForcedFormat(p.id === "auto" ? undefined : p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  isSelected
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100/70 border border-zinc-200/60">
          <ShareButton toolSlug="base64-inspector" data={input} />
          <EmbedButton toolSlug="base64-inspector" data={input} />
          <ExportImageButton code={conversions.hexDump || input} language="text" />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 overflow-hidden" id="base64-export-card">
        {/* Left / Top: Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="h-10 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
              <Binary className="w-4 h-4 text-zinc-500" />
              <span>Input Data / String</span>
              <span className="text-zinc-600 font-mono text-[11px]">
                ({conversions.byteLength} bytes / {conversions.charLength} chars)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setInput(s.value);
                    setForcedFormat(s.format);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => setInput("")}
                className="p-1 rounded text-zinc-600 hover:text-zinc-600 hover:bg-zinc-50 transition-colors ml-1"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste any text, Base64 string, Hex stream, Binary bits, or Data URL image..."
              className="w-full h-full min-h-[220px] font-mono text-xs text-zinc-900 bg-transparent resize-none border-0 outline-none focus:ring-0 leading-relaxed placeholder:text-zinc-600"
              spellCheck={false}
            />
          </div>

          {/* Live Image Preview Banner if Data URL or Image Base64 is Detected */}
          {conversions.dataUrlInfo.isImage && conversions.dataUrlInfo.fullDataUrl && (
            <div className="border-t border-zinc-100 p-6 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-800">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Live Image Preview</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono uppercase">
                    {conversions.dataUrlInfo.mimeType}
                  </span>
                </div>
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>

              <div className="flex items-center justify-center p-4 bg-zinc-900 rounded-lg border border-zinc-800 min-h-[120px] max-h-[240px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversions.dataUrlInfo.fullDataUrl}
                  alt="Decoded base64 preview"
                  className="max-h-[200px] max-w-full object-contain rounded shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right / Bottom: Multi-Encoding Output Grid */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50">
          <div className="h-10 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-100/70 border border-zinc-200/60">
              <button
                onClick={() => setActiveTab("cards")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  activeTab === "cards"
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                )}
              >
                Multi-Format Cards
              </button>
              <button
                onClick={() => setActiveTab("hexdump")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  activeTab === "hexdump"
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
                )}
              >
                Canonical Hex Dump
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-3">
            {activeTab === "cards" ? (
              <>
                {/* Plain Text UTF-8 */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">Plain Text (UTF-8)</span>
                    <button
                      onClick={() => handleCopy(conversions.plainText, "text")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy plain text"
                    >
                      {copiedKey === "text" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-zinc-800 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-zinc-50 p-2 rounded border border-zinc-100">
                    {conversions.plainText || "<empty>"}
                  </pre>
                </div>

                {/* Base64 Standard */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">Base64 (Standard RFC 4648)</span>
                    <button
                      onClick={() => handleCopy(conversions.base64, "b64")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy Base64"
                    >
                      {copiedKey === "b64" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-blue-700 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-blue-50/50 p-2 rounded border border-blue-100">
                    {conversions.base64 || "<empty>"}
                  </pre>
                </div>

                {/* Base64 URL-Safe */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">Base64 (URL-Safe, Unpadded)</span>
                    <button
                      onClick={() => handleCopy(conversions.base64Url, "b64url")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy URL-safe Base64"
                    >
                      {copiedKey === "b64url" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-indigo-700 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-indigo-50/50 p-2 rounded border border-indigo-100">
                    {conversions.base64Url || "<empty>"}
                  </pre>
                </div>

                {/* Hex Stream */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">Hex Stream (Spaced Bytes)</span>
                    <button
                      onClick={() => handleCopy(conversions.hexStream, "hex")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy Hex"
                    >
                      {copiedKey === "hex" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-emerald-700 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-blue-50/50 p-2 rounded border border-emerald-100">
                    {conversions.hexStream || "<empty>"}
                  </pre>
                </div>

                {/* Binary Bits */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">Binary (8-bit Octets)</span>
                    <button
                      onClick={() => handleCopy(conversions.binary, "bin")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy Binary"
                    >
                      {copiedKey === "bin" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-amber-800 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-amber-50/50 p-2 rounded border border-amber-100">
                    {conversions.binary || "<empty>"}
                  </pre>
                </div>

                {/* URL Encoded */}
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-800">URL / Percent Encoded</span>
                    <button
                      onClick={() => handleCopy(conversions.urlEncoded, "url")}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                      title="Copy URL encoded"
                    >
                      {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-purple-700 break-all whitespace-pre-wrap max-h-24 overflow-y-auto bg-purple-50/50 p-2 rounded border border-purple-100">
                    {conversions.urlEncoded || "<empty>"}
                  </pre>
                </div>
              </>
            ) : (
              /* Canonical Hex Dump View */
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 shadow-xs h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400">Canonical Hex Dump</span>
                  <button
                    onClick={() => handleCopy(conversions.hexDump, "hexdump")}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {copiedKey === "hexdump" ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Dump</span>
                  </button>
                </div>
                <pre className="flex-1 font-mono text-xs text-blue-400 overflow-auto bg-black p-3 rounded border border-zinc-800 leading-relaxed">
                  {conversions.hexDump || "00000000"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
