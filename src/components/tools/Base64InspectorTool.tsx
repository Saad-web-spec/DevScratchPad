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
      {/* Top Controls Bar (Unified Clean Header) */}
      <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-600">
            <Sparkles className="w-3 h-3 text-neutral-500" />
            <span>Detected:</span>
            <span className="font-semibold text-neutral-800 uppercase tracking-wide">
              {conversions.detectedFormat}
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200 mx-1" />

          <div className="flex items-center p-0.5 rounded-md bg-neutral-100/50 border border-neutral-200">
            {FORMAT_PILLS.map((p) => {
              const isSelected = p.id === "auto" ? forcedFormat === undefined : forcedFormat === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setForcedFormat(p.id === "auto" ? undefined : p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap",
                    isSelected
                      ? "bg-white text-neutral-900 shadow-sm ring-1 ring-black/5"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ShareButton toolSlug="base64-inspector" data={input} />
          <EmbedButton toolSlug="base64-inspector" data={input} />
          <ExportImageButton code={conversions.hexDump || input} language="text" />
        </div>
      </div>

      {/* Main Workspace Layout (Strict Dual-Pane Grid) */}
      <div className="flex-1 min-h-[600px] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 overflow-hidden bg-neutral-50/30" id="base64-export-card">
        {/* Left Pane: Input Editor */}
        <div className="flex flex-col h-full bg-white relative">
          <div className="flex-1 p-0 overflow-y-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste any text, Base64 string, Hex stream, Binary bits, or Data URL image..."
              className="w-full h-full p-4 font-mono text-sm text-neutral-900 bg-transparent resize-none border-0 outline-none focus:ring-0 leading-relaxed placeholder:text-neutral-400"
              spellCheck={false}
            />
          </div>

          {/* Action Bar (Bottom of Editor) */}
          <div className="h-10 border-t border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <div className="text-[11px] font-mono text-neutral-500">
              {input.length} chars &bull; {new Blob([input]).size} bytes
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInput("")}
                className="px-2 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50 transition-colors flex items-center gap-1.5"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Live Image Preview (Docked Bottom) */}
          {conversions.dataUrlInfo.isImage && conversions.dataUrlInfo.fullDataUrl && (
            <div className="border-t border-neutral-200 bg-white shrink-0 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-800">
                  <ImageIcon className="w-4 h-4 text-neutral-500" />
                  <span>Live Preview</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-mono uppercase">
                    {conversions.dataUrlInfo.mimeType}
                  </span>
                </div>
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-100 text-[11px] font-medium hover:bg-neutral-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Checkerboard background for transparency */}
              <div
                className="flex items-center justify-center p-4 border border-neutral-200 rounded-lg overflow-hidden max-h-48"
                style={{
                  backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"10\" height=\"10\" fill=\"%23e5e5e5\"/><rect x=\"10\" width=\"10\" height=\"10\" fill=\"%23f5f5f5\"/><rect y=\"10\" width=\"10\" height=\"10\" fill=\"%23f5f5f5\"/><rect x=\"10\" y=\"10\" width=\"10\" height=\"10\" fill=\"%23e5e5e5\"/></svg>')",
                  backgroundSize: "20px 20px"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversions.dataUrlInfo.fullDataUrl}
                  alt="Preview"
                  className="max-h-[150px] max-w-full object-contain shadow-sm border border-neutral-200/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Multi-Encoding Output Grid */}
        <div className="flex flex-col h-full bg-neutral-50/30">
          <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center p-0.5 rounded-md bg-neutral-100/50 border border-neutral-200">
              <button
                onClick={() => setActiveTab("cards")}
                className={cn(
                  "px-3 py-1 rounded text-[11px] font-medium transition-colors",
                  activeTab === "cards"
                    ? "bg-white text-neutral-900 shadow-sm ring-1 ring-black/5 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                Multi-Format Cards
              </button>
              <button
                onClick={() => setActiveTab("hexdump")}
                className={cn(
                  "px-3 py-1 rounded text-[11px] font-medium transition-colors",
                  activeTab === "hexdump"
                    ? "bg-white text-neutral-900 shadow-sm ring-1 ring-black/5 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                Canonical Hex Dump
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "cards" ? (
              <>
                {/* Plain Text UTF-8 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Plain Text (UTF-8)</span>
                    <button
                      onClick={() => handleCopy(conversions.plainText, "text")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy plain text"
                    >
                      {copiedKey === "text" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.plainText || "<empty>"}
                  </pre>
                </div>

                {/* Base64 Standard */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Base64 (Standard RFC 4648)</span>
                    <button
                      onClick={() => handleCopy(conversions.base64, "b64")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy Base64"
                    >
                      {copiedKey === "b64" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.base64 || "<empty>"}
                  </pre>
                </div>

                {/* Base64 URL-Safe */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Base64 (URL-Safe, Unpadded)</span>
                    <button
                      onClick={() => handleCopy(conversions.base64Url, "b64url")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy URL-safe Base64"
                    >
                      {copiedKey === "b64url" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.base64Url || "<empty>"}
                  </pre>
                </div>

                {/* Hex Stream */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Hex Stream (Spaced Bytes)</span>
                    <button
                      onClick={() => handleCopy(conversions.hexStream, "hex")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy Hex"
                    >
                      {copiedKey === "hex" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.hexStream || "<empty>"}
                  </pre>
                </div>

                {/* Binary Bits */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Binary (8-bit Octets)</span>
                    <button
                      onClick={() => handleCopy(conversions.binary, "bin")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy Binary"
                    >
                      {copiedKey === "bin" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.binary || "<empty>"}
                  </pre>
                </div>

                {/* URL Encoded */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">URL / Percent Encoded</span>
                    <button
                      onClick={() => handleCopy(conversions.urlEncoded, "url")}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Copy URL encoded"
                    >
                      {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-sm text-neutral-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {conversions.urlEncoded || "<empty>"}
                  </pre>
                </div>
              </>
            ) : (
              /* Canonical Hex Dump View - Dark Slate Theme */
              <div className="p-0 rounded-lg border border-neutral-200 bg-neutral-900 shadow-sm h-full flex flex-col overflow-hidden min-h-[300px]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                  <span className="text-xs font-mono text-neutral-400">Canonical Hex Dump</span>
                  <button
                    onClick={() => handleCopy(conversions.hexDump, "hexdump")}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                  >
                    {copiedKey === "hexdump" ? <Check className="w-3.5 h-3.5 text-neutral-100" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Dump</span>
                  </button>
                </div>
                <pre className="flex-1 font-mono text-sm text-neutral-300 overflow-auto p-4 leading-relaxed">
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
