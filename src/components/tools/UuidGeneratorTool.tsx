"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { RefreshCw, Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import {
  ToolHeader,
  PaneBar,
  btnPrimary,
  btnGhost,
  btnIcon,
  inputBase,
  selectBase,
  segmentTrack,
  segmentBtn,
  chipBtn,
  captionText,
  iconProps,
  ICON_STROKE,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import {
  MAX_IDS,
  NANOID_DEFAULT_SIZE,
  clampCount,
  generateIds,
  inspectId,
  serializeIds,
  styleId,
  type IdFormat,
  type IdType,
} from "@/components/tools/generators/ids";
import { CopyIconButton, CopyTextButton, useCopyState } from "@/components/tools/generators/CopyControls";
import { downloadText } from "@/components/tools/generators/clipboard";

interface UuidGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const ID_TYPES: { id: IdType; label: string; desc: string }[] = [
  { id: "uuid-v4", label: "UUID v4", desc: "122 random bits (RFC 9562). The default choice for opaque ids." },
  { id: "uuid-v7", label: "UUID v7", desc: "Unix-ms timestamp + random bits. Sorts by creation time, index-friendly." },
  { id: "ulid", label: "ULID", desc: "26-char Crockford Base32, time-sortable, case-insensitive." },
  { id: "nanoid", label: "NanoID", desc: "Compact URL-safe random id from a 64-symbol alphabet." },
];

const COUNT_CHIPS: { value: number; label: string }[] = [
  { value: 1, label: "1" },
  { value: 10, label: "10" },
  { value: 100, label: "100" },
  { value: 1000, label: "1K" },
  { value: 10000, label: "10K" },
];

const FORMATS: { id: IdFormat; label: string }[] = [
  { id: "lines", label: "Lines" },
  { id: "json", label: "JSON" },
  { id: "csv", label: "CSV" },
];

const NANOID_SIZES = [8, 10, 12, 16, 21, 24, 32, 48, 64];

/** Rows rendered as DOM nodes in the list view; Copy all / Download always use every id. */
const LIST_CAP = 500;

/** Share links carry `uuid-v7-25`; history entries carry `uuid-v7 x25`; old snapshots `uuid-v7 (25)`. */
function parseRestored(raw: string | null | undefined): { type: IdType; count: number } | null {
  if (!raw) return null;
  const m = /^\s*(uuid-v4|uuid-v7|ulid|nanoid)(?:\s*(?:-|x|\()\s*(\d+))?/i.exec(raw);
  if (!m) return null;
  return { type: m[1].toLowerCase() as IdType, count: m[2] ? clampCount(Number(m[2])) : 10 };
}

export function UuidGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: UuidGeneratorToolProps) {
  const initial = parseRestored(restoredInput);
  const [idType, setIdType] = useState<IdType>(initial?.type ?? "uuid-v4");
  const [count, setCount] = useState<number>(initial?.count ?? 10);
  const [countDraft, setCountDraft] = useState<string>(String(initial?.count ?? 10));
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [ulidLowercase, setUlidLowercase] = useState<boolean>(false);
  const [nanoSize, setNanoSize] = useState<number>(NANOID_DEFAULT_SIZE);
  const [format, setFormat] = useState<IdFormat>("lines");
  const [ids, setIds] = useState<string[]>(() => generateIds(initial?.type ?? "uuid-v4", initial?.count ?? 10));
  const [inspectInput, setInspectInput] = useState("");
  const { copiedKey, copy } = useCopyState();

  /** Generates on demand (clicks / option changes), never while the user types. */
  const regenerate = useCallback(
    (type: IdType, n: number, size: number) => {
      const start = performance.now();
      const next = generateIds(type, n, { nanoidSize: size });
      setIds(next);
      onValidationChange(true);
      onStatsChange(next.reduce((n, id) => n + id.length + 1, 0), performance.now() - start);
      onLogHistory?.(`${type} x${next.length}`);
    },
    [onValidationChange, onStatsChange, onLogHistory]
  );

  // Restored links / history entries arriving after mount
  const [prevRestored, setPrevRestored] = useState(restoredInput);
  if (restoredInput !== prevRestored) {
    setPrevRestored(restoredInput);
    const parsed = parseRestored(restoredInput);
    if (parsed) {
      setIdType(parsed.type);
      setCount(parsed.count);
      setCountDraft(String(parsed.count));
      setIds(generateIds(parsed.type, parsed.count, { nanoidSize: nanoSize }));
    }
  }

  const styled = useMemo(
    () => ids.map((id) => styleId(id, idType, { uppercase, hyphens, lowercase: ulidLowercase })),
    [ids, idType, uppercase, hyphens, ulidLowercase]
  );
  const output = useMemo(() => serializeIds(styled, format), [styled, format]);

  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot("uuid-generator", "UUID Generator", `${idType} (${count})`, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [idType, count, output]);

  const selectType = (type: IdType) => {
    setIdType(type);
    regenerate(type, count, nanoSize);
  };

  const selectCount = (n: number) => {
    const clamped = clampCount(n);
    setCount(clamped);
    setCountDraft(String(clamped));
    regenerate(idType, clamped, nanoSize);
  };

  /** Custom quantity commits on Enter / blur so typing "10000" doesn't generate 1, 10, 100 ... */
  const commitCountDraft = () => {
    const n = clampCount(Number(countDraft));
    setCountDraft(String(n));
    if (n !== count) selectCount(n);
  };

  const ext = format === "json" ? "json" : format === "csv" ? "csv" : "txt";
  const handleDownload = () => downloadText(`${idType}-${styled.length}.${ext}`, output, format === "json" ? "application/json" : "text/plain");

  const typeMeta = ID_TYPES.find((t) => t.id === idType) ?? ID_TYPES[0];
  const isUuid = idType === "uuid-v4" || idType === "uuid-v7";
  const inspection = useMemo(() => inspectId(inspectInput), [inspectInput]);
  // Image export stays readable: the first 40 ids are plenty for a snippet
  const imageCode = useMemo(() => serializeIds(styled.slice(0, 40), format), [styled, format]);

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <ToolHeader
        icon={getToolIcon("uuid-generator")}
        title="UUID / ULID Generator"
        utilities={
          <ShareMenu
            toolSlug="uuid-generator"
            data={`${idType}-${count}`}
            imageCode={imageCode}
            imageLanguage={format === "json" ? "json" : "plaintext"}
          />
        }
        options={
          /* ID Type Pills */
          <div
            role="group"
            aria-label="Identifier type"
            className={cn(segmentTrack, "max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}
          >
            {ID_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={idType === type.id}
                onClick={() => selectType(type.id)}
                className={cn(segmentBtn(idType === type.id), "shrink-0")}
              >
                {type.label}
              </button>
            ))}
          </div>
        }
        actions={
          <button type="button" onClick={() => regenerate(idType, count, nanoSize)} className={btnPrimary}>
            <RefreshCw {...iconProps} />
            <span>Generate</span>
          </button>
        }
      />

      {/* Main Workspace Layout: stacks and scrolls as one column on mobile */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden w-full max-w-full">
        {/* Settings Panel */}
        <div className="w-full md:w-72 lg:w-80 md:border-r border-zinc-200 bg-white p-4 flex flex-col gap-5 shrink-0 md:overflow-y-auto">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className={captionText}>Quantity</span>
              <span className="font-mono text-[11px] text-zinc-400">max {MAX_IDS.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {COUNT_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={count === chip.value}
                  onClick={() => selectCount(chip.value)}
                  className={cn(chipBtn(count === chip.value), "px-0 font-mono")}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2">
              <span className="w-14 shrink-0 text-[13px] text-zinc-500 md:text-xs">Custom</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_IDS}
                value={countDraft}
                onChange={(e) => setCountDraft(e.target.value)}
                onBlur={commitCountDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitCountDraft();
                }}
                className={cn(inputBase, "w-full min-w-0 font-mono")}
                aria-label="Custom quantity"
              />
            </label>
          </div>

          <div>
            <span className={cn(captionText, "mb-2 block")}>Output Format</span>
            <div role="group" aria-label="Output format" className={cn(segmentTrack, "grid w-full grid-cols-3")}>
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  aria-pressed={format === fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={segmentBtn(format === fmt.id)}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-zinc-100 border-y border-zinc-200">
            {isUuid && (
              <>
                <label className="flex min-h-11 items-center justify-between gap-3 cursor-pointer md:min-h-9">
                  <span className="text-[13px] md:text-xs font-medium text-zinc-700">Uppercase</span>
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                    className="size-4 rounded border-zinc-300 accent-zinc-900"
                  />
                </label>
                <label className="flex min-h-11 items-center justify-between gap-3 cursor-pointer md:min-h-9">
                  <span className="text-[13px] md:text-xs font-medium text-zinc-700">Hyphens</span>
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={(e) => setHyphens(e.target.checked)}
                    className="size-4 rounded border-zinc-300 accent-zinc-900"
                  />
                </label>
              </>
            )}
            {idType === "ulid" && (
              <label className="flex min-h-11 items-center justify-between gap-3 cursor-pointer md:min-h-9">
                <span className="text-[13px] md:text-xs font-medium text-zinc-700">Lowercase</span>
                <input
                  type="checkbox"
                  checked={ulidLowercase}
                  onChange={(e) => setUlidLowercase(e.target.checked)}
                  className="size-4 rounded border-zinc-300 accent-zinc-900"
                />
              </label>
            )}
            {idType === "nanoid" && (
              <label className="flex min-h-11 items-center justify-between gap-3 md:min-h-9">
                <span className="text-[13px] md:text-xs font-medium text-zinc-700">Length</span>
                <select
                  value={nanoSize}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setNanoSize(size);
                    regenerate(idType, count, size);
                  }}
                  className={cn(selectBase, "font-mono")}
                  aria-label="NanoID length"
                >
                  {NANOID_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} chars
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="py-2.5 text-xs leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-900">{typeMeta.label}.</span> {typeMeta.desc} Generated locally with{" "}
              <code className="font-mono text-[11px]">crypto.getRandomValues</code>.
            </p>
          </div>

          {/* Inspector: decode a pasted id */}
          <div>
            <label htmlFor="uuid-inspect" className={cn(captionText, "mb-2 block")}>
              Inspect an ID
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" strokeWidth={ICON_STROKE} aria-hidden="true" />
              <input
                id="uuid-inspect"
                type="text"
                spellCheck={false}
                autoComplete="off"
                value={inspectInput}
                onChange={(e) => setInspectInput(e.target.value)}
                placeholder="Paste a UUID, ULID or NanoID"
                className={cn(inputBase, "w-full pl-8 pr-10 font-mono md:pr-9")}
              />
              {inspectInput && (
                <button
                  type="button"
                  onClick={() => setInspectInput("")}
                  className={cn(btnIcon, "absolute right-0 top-1/2 -translate-y-1/2")}
                  title="Clear"
                  aria-label="Clear inspected id"
                >
                  <X {...iconProps} />
                </button>
              )}
            </div>
            {inspection && "error" in inspection && <p className="mt-2 text-xs text-red-600">{inspection.error}</p>}
            {inspection && !("error" in inspection) && (
              <dl className="mt-2 divide-y divide-zinc-100 text-xs">
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-zinc-500">Type</dt>
                  <dd className="text-right font-medium text-zinc-900">{inspection.label}</dd>
                </div>
                {inspection.variant && (
                  <div className="flex justify-between gap-3 py-1.5">
                    <dt className="text-zinc-500">Variant</dt>
                    <dd className="text-right text-zinc-900">{inspection.variant}</dd>
                  </div>
                )}
                {inspection.timestamp && !Number.isNaN(inspection.timestamp.getTime()) && (
                  <div className="flex justify-between gap-3 py-1.5">
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="text-right font-mono text-zinc-900">{inspection.timestamp.toISOString()}</dd>
                  </div>
                )}
                {inspection.note && <p className="py-1.5 text-zinc-500">{inspection.note}</p>}
              </dl>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="order-first md:order-none flex-1 flex flex-col min-w-0 min-h-[420px] md:min-h-0 bg-white border-b border-zinc-200 md:border-b-0">
          <PaneBar
            label={
              <>
                {styled.length.toLocaleString()} {styled.length === 1 ? "ID" : "IDs"}
                <span className="ml-1.5 normal-case tracking-normal text-zinc-400">· {typeMeta.label}</span>
              </>
            }
          >
            <CopyTextButton copied={copiedKey === "all"} onCopy={() => void copy(output, "all")} title="Copy every id">
              Copy all
            </CopyTextButton>
            <button type="button" onClick={handleDownload} className={btnGhost} title={`Download .${ext}`} aria-label={`Download .${ext}`}>
              <Download {...iconProps} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </PaneBar>

          {format === "lines" ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ol className="divide-y divide-zinc-100">
                {styled.slice(0, LIST_CAP).map((id, i) => (
                  <li key={`${i}-${id}`} className="group flex items-center gap-2 py-0.5 pl-3 pr-1 hover:bg-zinc-50 md:pl-4">
                    <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-400 select-none md:w-10">{i + 1}</span>
                    <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-900 md:text-[13px]">{id}</span>
                    <CopyIconButton
                      copied={copiedKey === `id-${i}`}
                      onCopy={() => void copy(id, `id-${i}`)}
                      label={`id ${i + 1}`}
                      className="md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                    />
                  </li>
                ))}
              </ol>
              {styled.length > LIST_CAP && (
                <p className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
                  Showing the first {LIST_CAP.toLocaleString()} of {styled.length.toLocaleString()}. Copy all or Download includes every id.
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 relative w-full min-h-0 overflow-x-hidden">
              <MonacoEditor
                height="100%"
                language={format === "json" ? "json" : "plaintext"}
                value={output}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
