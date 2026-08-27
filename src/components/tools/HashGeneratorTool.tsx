"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { generateAllHashes, type HashResults } from "@/lib/tools/hash";
import { ShareButton } from "@/components/ShareButton";
import { Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface HashGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_TEXT = "DevScratchpad – Fast, Private & Beautiful Developer Tools";

export function HashGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: HashGeneratorToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_TEXT);
  const [hashes, setHashes] = useState<HashResults>({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
  });
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("hash", "Hash Generator", input, JSON.stringify(hashes, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, hashes]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Compute hashes when input changes
  useEffect(() => {
    let isCancelled = false;
    const start = performance.now();

    onValidationChange(true);

    generateAllHashes(input).then((res) => {
      if (!isCancelled) {
        setHashes(res);
        const end = performance.now();
        onStatsChange(input.length, end - start);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [input, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    const valueToCopy = isUppercase ? text.toUpperCase() : text.toLowerCase();
    navigator.clipboard.writeText(valueToCopy);
    setCopiedKey(key);
    onLogHistory?.(input);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const formatValue = (h: string) => (isUppercase ? h.toUpperCase() : h.toLowerCase());
    const allText = [
      `MD5:    ${formatValue(hashes.md5)}`,
      `SHA-1:  ${formatValue(hashes.sha1)}`,
      `SHA-256:${formatValue(hashes.sha256)}`,
      `SHA-512:${formatValue(hashes.sha512)}`,
    ].join("\n");

    navigator.clipboard.writeText(allText);
    setCopiedKey("all");
    onLogHistory?.(input);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const HASH_CARDS = [
    {
      id: "md5",
      name: "MD5",
      bits: "128-bit",
      value: hashes.md5,
      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    },
    {
      id: "sha1",
      name: "SHA-1",
      bits: "160-bit",
      value: hashes.sha1,
      color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    },
    {
      id: "sha256",
      name: "SHA-256",
      bits: "256-bit",
      value: hashes.sha256,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    },
    {
      id: "sha512",
      name: "SHA-512",
      bits: "512-bit",
      value: hashes.sha512,
      color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-800 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Hash Generator</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512)</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="hash-generator" data={input} />
          <button
            onClick={() => setIsUppercase(!isUppercase)}
            className={cn(
              "px-2.5 py-1.5 rounded text-xs font-medium transition-colors border",
              isUppercase
                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400"
                : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            )}
          >
            {isUppercase ? "UPPERCASE" : "lowercase"}
          </button>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded text-xs font-medium transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            {copiedKey === "all" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedKey === "all" ? "Copied All" : "Copy All"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 md:p-8 max-w-5xl mx-auto w-full gap-6 md:gap-8">
        {/* Input Panel */}
        <div className="border border-[#e2e8f0] dark:border-[#27272A] rounded-xl overflow-hidden bg-white dark:bg-[#09090B] flex flex-col shrink-0 w-full max-w-full">
          <div className="h-9 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-[#27272A] flex items-center justify-between px-3 md:px-4 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Input String / Text
            </span>
            <button
              onClick={() => setInput("")}
              className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="min-h-[150px] relative shrink-0 w-full max-w-full overflow-x-hidden">
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
                padding: { top: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Hashes Output */}
        <div className="w-full max-w-full">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1 mb-4">
            Generated Hashes
          </h3>

          <div className="flex flex-col">
            {HASH_CARDS.map((card) => {
              const displayVal = card.value
                ? isUppercase
                  ? card.value.toUpperCase()
                  : card.value.toLowerCase()
                : "—";

              return (
                <div
                  key={card.id}
                  className="py-3 px-4 bg-white dark:bg-[#121215] border border-[#e2e8f0] dark:border-[#27272A] rounded-lg mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 md:gap-3 group min-w-0 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-[120px] shrink-0">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {card.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        card.color
                      )}
                    >
                      {card.bits}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 bg-[#f8fafc] dark:bg-[#09090B] px-3 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#27272A] font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
                    {displayVal}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {card.value ? `${card.value.length} chars` : ""}
                    </span>
                    <button
                      onClick={() => handleCopy(card.value, card.id)}
                      disabled={!card.value}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                        copiedKey === card.id
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-white hover:bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-700"
                      )}
                    >
                      {copiedKey === card.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === card.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const HashTool = HashGeneratorTool;
