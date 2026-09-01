"use client";

import { useState, useEffect, useCallback } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import {
  generateBatchIds,
  type IdType,
  type OutputFormat,
} from "@/lib/tools/uuid-generator";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { RefreshCw, Copy, Check, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface UuidGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const ID_TYPES: { id: IdType; label: string; desc: string }[] = [
  { id: "uuid-v4", label: "UUID v4", desc: "Random RFC 4122" },
  { id: "uuid-v7", label: "UUID v7", desc: "Time-ordered Epoch" },
  { id: "ulid", label: "ULID", desc: "Sortable 26-char Base32" },
  { id: "nanoid", label: "NanoID", desc: "Compact URL-friendly" },
];

export function UuidGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: UuidGeneratorToolProps) {
  const [idType, setIdType] = useState<IdType>("uuid-v4");
  const [count, setCount] = useState<number>(10);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [format, setFormat] = useState<OutputFormat>("list");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const start = performance.now();
    const result = generateBatchIds(idType, count, { uppercase, hyphens, format });
    setOutput(result);
    onValidationChange(true);
    onStatsChange(result.length, performance.now() - start);
    onLogHistory?.(`${idType} x${count}`);
  }, [idType, count, uppercase, hyphens, format, onValidationChange, onStatsChange, onLogHistory]);

  useEffect(() => {
    generate();
  }, [generate]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot("uuid-generator", "UUID Generator", `${idType} (${count})`, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [idType, count, output]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-[#f8fafc] shrink-0">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-zinc-900" />
          <h1 className="text-sm font-semibold text-zinc-800 whitespace-nowrap">
            UUID / ULID Generator
          </h1>
        </div>

        {/* ID Type Pills */}
        <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg overflow-x-auto no-scrollbar shrink-0">
          {ID_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setIdType(type.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                idType === type.id
                  ? "bg-white text-zinc-900 shadow-none font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportImageButton code={output} language={format === "json" ? "json" : "plaintext"} />
          <EmbedButton toolSlug="uuid-generator" data={`${idType}-${count}`} />
          <ShareButton toolSlug="uuid-generator" data={`${idType}-${count}`} />

          <button
            onClick={generate}
            className="h-8 px-3 text-xs font-semibold rounded-md shadow-none transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Settings Panel */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50/50 p-4 sm:p-5 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-2">
              Quantity ({count})
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 5, 10, 25, 50, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => setCount(num)}
                  className={cn(
                    "py-1.5 text-xs font-mono rounded-md border transition-all",
                    count === num
                      ? "bg-zinc-900 text-white border-zinc-900 font-semibold shadow-none"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "list", label: "Lines" },
                { id: "json", label: "JSON" },
                { id: "comma", label: "CSV" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as OutputFormat)}
                  className={cn(
                    "py-1.5 text-xs font-medium rounded-md border transition-all",
                    format === fmt.id
                      ? "bg-zinc-900 text-white border-zinc-900 font-semibold shadow-none"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-200">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-zinc-700">Uppercase Letters</span>
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
              />
            </label>

            {(idType === "uuid-v4" || idType === "uuid-v7") && (
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-zinc-700">Include Hyphens</span>
                <input
                  type="checkbox"
                  checked={hyphens}
                  onChange={(e) => setHyphens(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                />
              </label>
            )}
          </div>

          <div className="p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-600 mt-auto">
            <p className="font-semibold text-zinc-900 mb-0.5">
              {ID_TYPES.find((t) => t.id === idType)?.label}
            </p>
            <p className="text-[11px] text-zinc-500">
              {ID_TYPES.find((t) => t.id === idType)?.desc}. Generated 100% locally with high-entropy cryptographic randomness.
            </p>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Generated Identifiers ({count})
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
              <span>{copied ? "Copied All!" : "Copy All"}</span>
            </button>
          </div>

          <div className="flex-1 relative w-full overflow-x-hidden">
            <MonacoEditor
              key={`${idType}-${count}-${format}-${uppercase}-${hyphens}`}
              height="100%"
              defaultLanguage={format === "json" ? "json" : "plaintext"}
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
