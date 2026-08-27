"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { generateAllHashes, type HashResults } from "@/lib/tools/hash";
import { ShareButton } from "@/components/ShareButton";
import { Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ValidationBadge } from "@/components/layout/StatusBar";

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
    setTimeout(() => setCopiedKey(null), 1500);
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
    setTimeout(() => setCopiedKey(null), 1500);
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
          <ValidationBadge isValid={true} />
          <ShareButton toolSlug="hash-generator" data={input} />
          <button
            onClick={() => setIsUppercase(!isUppercase)}
            className={cn(
              "h-9 px-3 rounded-md text-xs font-medium transition-colors border",
              isUppercase
                ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold"
                : "bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-zinc-300"
            )}
          >
            {isUppercase ? "UPPERCASE" : "lowercase"}
          </button>

          <button
            onClick={handleCopyAll}
            className={cn(
              "h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
              copiedKey === "all" && "text-emerald-400 border-emerald-500/40"
            )}
          >
            {copiedKey === "all" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>{copiedKey === "all" ? "Copied!" : "Copy All"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 md:p-10 max-w-5xl mx-auto w-full gap-8">
        {/* Input - flat on canvas, no card wrapper */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Input Text
            </span>
            <button
              onClick={() => setInput("")}
              className="h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
          <div className="min-h-[120px] rounded-lg overflow-hidden border border-[#27272A] bg-[#09090B]">
            <MonacoEditor
              height="120px"
              defaultLanguage="plaintext"
              value={input}
              onChange={(value) => setInput(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                lineNumbers: "off",
                glyphMargin: false,
                folding: false,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Hashes Output — clean stacked rows */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-5">
            Generated Hashes
          </span>

          <div className="space-y-3">
            {HASH_CARDS.map((card) => {
              const displayVal = card.value
                ? isUppercase
                  ? card.value.toUpperCase()
                  : card.value.toLowerCase()
                : "—";

              return (
                <div
                  key={card.id}
                  className="group bg-[#121215] border border-[#27272A] rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-zinc-600 transition-colors"
                >
                  {/* Label */}
                  <div className="flex items-center gap-3 sm:w-[140px] shrink-0">
                    <span className="text-sm font-semibold text-zinc-200">
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

                  {/* Hash value — flat, no inner border */}
                  <div className="flex-1 min-w-0 font-mono text-[13px] text-zinc-400 break-all select-all leading-relaxed">
                    {displayVal}
                  </div>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(card.value, card.id)}
                    disabled={!card.value}
                    className={cn(
                      "h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                      copiedKey === card.id && "text-emerald-400 border-emerald-500/40"
                    )}
                  >
                    {copiedKey === card.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>{copiedKey === card.id ? "Copied!" : "Copy"}</span>
                  </button>
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
