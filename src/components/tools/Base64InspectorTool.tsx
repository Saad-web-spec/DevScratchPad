"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import {
  inspectAndConvert,
  type DetectedFormat,
} from "@/lib/tools/base64-inspector";
import { ShareMenu } from "@/components/ShareMenu";
import { Trash2, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import {
  ToolHeader,
  PaneBar,
  MobilePaneTabs,
  btnGhost,
  selectBase,
  segmentTrack,
  segmentBtn,
  iconProps,
  ICON_STROKE,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { useCopyFlash, CopyIconButton, CopyGhostButton, formatBytes } from "@/components/tools/security/securityUi";

interface Base64InspectorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_SAMPLE = "DevScratchpad — 100% Client-Side Privacy Suite ⚡";

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  "plain-text": "Plain text",
  base64: "Base64",
  "base64-url": "Base64 URL",
  "data-url": "Data URL",
  hex: "Hex",
  binary: "Binary",
  "url-encoded": "URL encoded",
};

const FORCEABLE: DetectedFormat[] = ["plain-text", "base64", "hex", "binary", "url-encoded"];

/** Long outputs are previewed (rendering megabytes of text freezes the page); Copy always copies everything. */
const PREVIEW_CHARS = 20_000;
const preview = (text: string) => (text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text);

export function Base64InspectorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: Base64InspectorToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE);
  const [forcedFormat, setForcedFormat] = useState<DetectedFormat | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"cards" | "hexdump">("cards");
  const [mobilePane, setMobilePane] = useState<"input" | "output">("input");
  const { copiedKey, copy } = useCopyFlash();

  // Restore from history
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Conversions run on a deferred copy of the input so typing stays responsive on large pastes.
  const deferredInput = useDeferredValue(input);
  const conversions = useMemo(() => inspectAndConvert(deferredInput, forcedFormat), [deferredInput, forcedFormat]);
  const isValid = !conversions.error;

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("base64-inspector", "Base64 / Hex / Binary Inspector", input, JSON.stringify(conversions, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, conversions]);

  useEffect(() => {
    onValidationChange(isValid, conversions.error);
    onStatsChange(deferredInput.length, 0);
  }, [isValid, conversions.error, deferredInput.length, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, key: string) => {
    if (copy(text, key)) onLogHistory?.(input);
  };

  const handleDownloadImage = () => {
    if (!conversions.dataUrlInfo.fullDataUrl) return;
    const a = document.createElement("a");
    a.href = conversions.dataUrlInfo.fullDataUrl;
    const ext = conversions.dataUrlInfo.mimeType?.split("/")[1] || "png";
    a.download = `devscratchpad-image.${ext}`;
    a.click();
  };

  const rows = useMemo(
    () => [
      { id: "text", label: "Plain text (UTF-8)", value: conversions.plainText },
      { id: "b64", label: "Base64", value: conversions.base64 },
      { id: "b64url", label: "Base64 URL-safe (unpadded)", value: conversions.base64Url },
      { id: "hex", label: "Hex", value: conversions.hexStream },
      { id: "bin", label: "Binary", value: conversions.binary },
      { id: "url", label: "URL encoded", value: conversions.urlEncoded },
    ],
    [conversions]
  );
  const hexDumpPreview = useMemo(() => preview(conversions.hexDump), [conversions.hexDump]);
  const showImage = conversions.dataUrlInfo.isImage && conversions.dataUrlInfo.fullDataUrl;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Top Controls Bar (Unified Clean Header) */}
      <ToolHeader
        icon={getToolIcon("base64-inspector")}
        title="Base64 / Hex / Binary Inspector"
        utilities={
          <ShareMenu
            toolSlug="base64-inspector"
            data={input}
            imageCode={conversions.hexDump || input}
            imageLanguage="text"
          />
        }
        options={
          <select
            value={forcedFormat ?? "auto"}
            onChange={(e) => setForcedFormat(e.target.value === "auto" ? undefined : (e.target.value as DetectedFormat))}
            className={selectBase}
            aria-label="Input format"
            title="Input format"
          >
            <option value="auto">
              Auto{forcedFormat === undefined ? ` · ${FORMAT_LABELS[conversions.detectedFormat]}` : "-detect"}
            </option>
            {FORCEABLE.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "Input" },
          { id: "output", label: "Encodings" },
        ]}
        active={mobilePane}
        onChange={setMobilePane}
      />

      {/* Main Workspace Layout (Dual Pane) */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row" id="base64-export-card">
        {/* Left Pane: Input */}
        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col md:border-r md:border-zinc-200",
            mobilePane !== "input" && "hidden md:flex"
          )}
        >
          <PaneBar label="Input">
            <button type="button" onClick={() => setInput("")} disabled={!input} className={btnGhost} title="Clear input">
              <Trash2 {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text, Base64, hex, binary bits, a URL-encoded string or a data: URL…"
            aria-label="Input"
            className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-3 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 md:p-4"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />

          <div className="flex h-9 shrink-0 items-center gap-2 border-t border-zinc-200 bg-zinc-50 px-3 text-[11px] text-zinc-500">
            {conversions.error ? (
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-red-600">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span className="truncate">{conversions.error}</span>
              </span>
            ) : (
              <span className="truncate">
                Read as <span className="font-medium text-zinc-900">{FORMAT_LABELS[conversions.detectedFormat]}</span>
              </span>
            )}
            <span className="ml-auto shrink-0 tabular-nums">
              {input.length.toLocaleString()} chars · {formatBytes(conversions.byteLength)}
            </span>
          </div>

          {/* Live Image Preview (Docked Bottom) */}
          {showImage && (
            <div className="shrink-0 border-t border-zinc-200">
              <PaneBar label={<>Image · <span className="normal-case">{conversions.dataUrlInfo.mimeType}</span></>}>
                <button type="button" onClick={handleDownloadImage} className={btnGhost}>
                  <Download {...iconProps} />
                  <span>Download</span>
                </button>
              </PaneBar>
              {/* Checkerboard background for transparency */}
              <div className="flex max-h-48 items-center justify-center overflow-hidden bg-[image:conic-gradient(#e4e4e7_25%,#fafafa_0_50%,#e4e4e7_0_75%,#fafafa_0)] bg-[length:16px_16px] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversions.dataUrlInfo.fullDataUrl}
                  alt="Decoded image preview"
                  className="max-h-40 max-w-full object-contain [image-rendering:pixelated]"
                />
              </div>
            </div>
          )}
        </section>

        {/* Right Pane: Encodings / Hex dump */}
        <section
          className={cn("flex min-h-0 min-w-0 flex-1 flex-col", mobilePane !== "output" && "hidden md:flex")}
        >
          <PaneBar label={activeTab === "cards" ? "Encodings" : "Hex dump"} className="pr-1">
            {activeTab === "hexdump" && (
              <CopyIconButton
                copied={copiedKey === "hexdump"}
                onClick={() => handleCopy(conversions.hexDump, "hexdump")}
                label="Copy hex dump"
              />
            )}
            <div className={segmentTrack}>
              <button type="button" onClick={() => setActiveTab("cards")} className={segmentBtn(activeTab === "cards")}>
                All
              </button>
              <button type="button" onClick={() => setActiveTab("hexdump")} className={segmentBtn(activeTab === "hexdump")}>
                Hex dump
              </button>
            </div>
          </PaneBar>

          {activeTab === "cards" ? (
            <div className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">
              {rows.map((row) => (
                <div key={row.id} className="px-3 py-2 md:px-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-zinc-700">{row.label}</span>
                    <CopyIconButton
                      copied={copiedKey === row.id}
                      onClick={() => handleCopy(row.value, row.id)}
                      disabled={!row.value}
                      label={`Copy ${row.label}`}
                      className="-mr-2 md:-mr-1.5"
                    />
                  </div>
                  <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap break-all pb-1 font-mono text-[13px] leading-relaxed text-zinc-900">
                    {row.value ? preview(row.value) : <span className="text-zinc-400">empty</span>}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <pre className="min-h-0 flex-1 overflow-auto whitespace-pre p-3 font-mono text-xs leading-relaxed text-zinc-700 md:p-4">
                {hexDumpPreview || "00000000"}
              </pre>
              {conversions.hexDump.length > PREVIEW_CHARS && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 pl-3 text-[11px] text-zinc-500">
                  <span className="truncate">Preview truncated. Copy gets the full dump.</span>
                  <CopyGhostButton copied={copiedKey === "hexdump"} onClick={() => handleCopy(conversions.hexDump, "hexdump")} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
