"use client";

import { useState, useEffect, useMemo } from "react";
import { generateAllHashes, EMPTY_HASHES, type HashResults } from "@/lib/tools/hash";
import { ShareMenu } from "@/components/ShareMenu";
import { Copy, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, btnPrimary, btnIcon, segmentTrack, segmentBtn, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { useCopyFlash, useDebouncedValue, CopyIconButton, formatBytes } from "@/components/tools/security/securityUi";

interface HashGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_TEXT = "DevScratchpad – Fast, Private & Beautiful Developer Tools";

const HASH_ROWS: { id: keyof HashResults; name: string; bits: string; legacy?: boolean }[] = [
  { id: "md5", name: "MD5", bits: "128-bit", legacy: true },
  { id: "sha1", name: "SHA-1", bits: "160-bit", legacy: true },
  { id: "sha256", name: "SHA-256", bits: "256-bit" },
  { id: "sha384", name: "SHA-384", bits: "384-bit" },
  { id: "sha512", name: "SHA-512", bits: "512-bit" },
];

export function HashGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: HashGeneratorToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_TEXT);
  // Digests tagged with the exact input they were computed from, so stale results never show.
  const [computed, setComputed] = useState<{ source: string; hashes: HashResults }>({ source: "", hashes: EMPTY_HASHES });
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const { copiedKey, copy } = useCopyFlash();

  // Hash ~150ms after typing stops so large pastes never block the textarea.
  const debouncedInput = useDebouncedValue(input, 150);
  const hashes = computed.hashes;
  // While a newer input is pending, keep the previous digests on screen but dimmed.
  const isStale = computed.source !== input;
  const byteLength = useMemo(() => new TextEncoder().encode(input).length, [input]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("hash", "Hash Generator", input, JSON.stringify(hashes, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, hashes]);

  // Restore from history / share link
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Compute hashes when the (debounced) input changes
  useEffect(() => {
    let isCancelled = false;
    const start = performance.now();

    onValidationChange(true);

    generateAllHashes(debouncedInput).then((res) => {
      if (isCancelled) return;
      setComputed({ source: debouncedInput, hashes: res });
      onStatsChange(debouncedInput.length, Math.round((performance.now() - start) * 10) / 10);
    });

    return () => {
      isCancelled = true;
    };
  }, [debouncedInput, onValidationChange, onStatsChange]);

  const formatValue = (h: string) => (isUppercase ? h.toUpperCase() : h.toLowerCase());

  const handleCopy = (text: string, key: string) => {
    if (copy(formatValue(text), key)) onLogHistory?.(input);
  };

  const allText = HASH_ROWS.filter((row) => hashes[row.id])
    .map((row) => `${`${row.name}:`.padEnd(9)}${formatValue(hashes[row.id])}`)
    .join("\n");

  const handleCopyAll = () => {
    if (copy(allText, "all")) onLogHistory?.(input);
  };

  const hasOutput = Boolean(hashes.sha256);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-white md:overflow-hidden">
      {/* Tool Header */}
      <ToolHeader
        icon={getToolIcon("hash")}
        title="Hash Generator"
        utilities={<ShareMenu toolSlug="hash" data={input} imageCode={allText || input} imageLanguage="plaintext" />}
        options={
          <div className={segmentTrack} role="group" aria-label="Letter case">
            <button type="button" onClick={() => setIsUppercase(false)} aria-pressed={!isUppercase} className={segmentBtn(!isUppercase)}>
              lowercase
            </button>
            <button type="button" onClick={() => setIsUppercase(true)} aria-pressed={isUppercase} className={segmentBtn(isUppercase)}>
              UPPERCASE
            </button>
          </div>
        }
        actions={
          <>
            <button type="button" onClick={handleCopyAll} disabled={!hasOutput} className={btnPrimary}>
              {copiedKey === "all" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedKey === "all" ? "Copied" : "Copy all"}</span>
            </button>
          </>
        }
      />

      {/* Main Content Area: input left, digests right (stacked on mobile) */}
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <section className="flex shrink-0 flex-col border-b border-zinc-200 md:min-h-0 md:w-5/12 md:shrink md:border-b-0 md:border-r">
          <PaneBar label="Input text">
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className={btnIcon}
              title="Clear input"
              aria-label="Clear input"
            >
              <Trash2 {...iconProps} />
            </button>
          </PaneBar>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to hash…"
            aria-label="Input text"
            spellCheck={false}
            className="block min-h-36 w-full flex-1 resize-y bg-transparent p-3 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 md:min-h-0 md:resize-none md:p-4"
          />
          <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-3 text-[11px] tabular-nums text-zinc-500">
            <span>{input.length.toLocaleString()} chars</span>
            <span>{formatBytes(byteLength)} UTF-8</span>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col md:min-h-0">
          <PaneBar label="Digests" className="pr-3 md:pr-3">
            <span className="text-[11px] text-zinc-400">Hex</span>
          </PaneBar>
          <div className="divide-y divide-zinc-200 md:min-h-0 md:flex-1 md:overflow-y-auto">
            {HASH_ROWS.map((row) => {
              const value = hashes[row.id];
              return (
                <div key={row.id} className="flex items-start gap-3 py-2.5 pl-3 pr-1.5 md:pl-4 md:pr-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900">{row.name}</span>
                      <span className="text-[11px] text-zinc-400">{row.bits}</span>
                      {row.legacy && <span className="text-[11px] text-zinc-400">· not collision-safe</span>}
                    </div>
                    <p
                      className={cn(
                        "mt-1 select-all break-all font-mono text-[13px] leading-relaxed text-zinc-800 transition-opacity",
                        isStale && "opacity-40"
                      )}
                    >
                      {value ? formatValue(value) : <span className="text-zinc-300">—</span>}
                    </p>
                  </div>
                  <CopyIconButton
                    copied={copiedKey === row.id}
                    onClick={() => handleCopy(value, row.id)}
                    disabled={!value}
                    label={`Copy ${row.name} hash`}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
