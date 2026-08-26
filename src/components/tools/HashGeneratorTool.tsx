"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { generateAllHashes, type HashResults } from "@/lib/tools/hash";
import { Copy, Trash2, Check, Hash, Sparkles, Link as LinkIcon } from "lucide-react";
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
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      id: "sha1",
      name: "SHA-1",
      bits: "160-bit",
      value: hashes.sha1,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      id: "sha256",
      name: "SHA-256",
      bits: "256-bit",
      value: hashes.sha256,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      id: "sha512",
      name: "SHA-512",
      bits: "512-bit",
      value: hashes.sha512,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Hash Generator</h2>
          <p className="text-[11px] text-slate-400">Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512)</p>
        </div>

        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setIsUppercase(!isUppercase)}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
              isUppercase
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            )}
          >
            {isUppercase ? "UPPERCASE" : "lowercase"}
          </button>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors border border-slate-200"
          >
            {copiedKey === "all" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedKey === "all" ? "Copied All" : "Copy All"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full gap-6">
        {/* Input Panel */}
        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm bg-white flex flex-col shrink-0">
          <div className="h-9 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Input String / Text
            </span>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="min-h-[150px] relative shrink-0">
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
                padding: { top: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Hashes Output Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Generated Hashes
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {HASH_CARDS.map((card) => {
              const displayVal = card.value
                ? isUppercase
                  ? card.value.toUpperCase()
                  : card.value.toLowerCase()
                : "—";

              return (
                <div
                  key={card.id}
                  className="bg-white border border-[#e2e8f0] hover:border-slate-300 rounded-xl p-4 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-[130px] shrink-0">
                    <span className="text-xs font-bold text-slate-800">
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

                  <div className="flex-1 min-w-0 bg-[#f8fafc] px-3 py-2 rounded-lg border border-[#e2e8f0] font-mono text-xs text-slate-700 break-all select-all">
                    {displayVal}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {card.value ? `${card.value.length} chars` : ""}
                    </span>
                    <button
                      onClick={() => handleCopy(card.value, card.id)}
                      disabled={!card.value}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                        copiedKey === card.id
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                      )}
                    >
                      {copiedKey === card.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedKey === card.id ? "Copied" : "Copy"}
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
