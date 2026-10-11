"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { Play, Download, Trash2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolHeader, PaneBar, MobilePaneTabs, btnPrimary, btnGhost, selectBase, inputBase, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import {
  DEFAULT_SCHEMA,
  FAKER_LOCALES,
  MAX_ROWS,
  MOCK_FORMATS,
  PREVIEW_ROWS,
  SCHEMA_PRESETS,
  formatMeta,
  generateRows,
  loadFaker,
  parseSchema,
  serializeRows,
  type JsonValue,
  type MockFormat,
} from "@/components/tools/generators/mockData";
import { CopyTextButton, useCopyState } from "@/components/tools/generators/CopyControls";
import { downloadText } from "@/components/tools/generators/clipboard";

interface MockDataGeneratorToolProps {
  onValidationChange?: (isValid: boolean, error?: string) => void;
  onStatsChange?: (length: number, ms: number) => void;
  restoredInput?: string | null;
}

type Row = { [key: string]: JsonValue };

const clampRows = (n: number) => Math.min(Math.max(Math.floor(n) || 1, 1), MAX_ROWS);

export function MockDataGeneratorTool({ restoredInput, onStatsChange, onValidationChange }: MockDataGeneratorToolProps) {
  const parsedInput = parseRestored(restoredInput);
  const [schemaText, setSchemaText] = useState(parsedInput?.schema || DEFAULT_SCHEMA);
  // Draft text so the field can be emptied while typing; the count is clamped on use
  const [rowsDraft, setRowsDraft] = useState(String(parsedInput?.rows || 10));
  const [format, setFormat] = useState<MockFormat>(parsedInput?.format || "json");
  const [locale, setLocale] = useState(parsedInput?.locale || "en");
  const [tableName, setTableName] = useState("mock_data");

  // Preview (first PREVIEW_ROWS rows) goes to the editor; the full text lives in a ref for Copy / Download
  const [preview, setPreview] = useState("");
  const [outputMeta, setOutputMeta] = useState<{ total: number; format: MockFormat; ms: number } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"schema" | "output">("schema");
  const [autoRun, setAutoRun] = useState(1);
  const fullOutputRef = useRef("");
  const dataRef = useRef<{ rows: Row[]; keys: string[] } | null>(null);
  const runId = useRef(0);
  const { copiedKey, copy } = useCopyState();

  const rowCount = clampRows(Number(rowsDraft));
  const schemaCheck = useMemo(() => parseSchema(schemaText), [schemaText]);

  // Restored links / history entries arriving after mount
  const [prevRestored, setPrevRestored] = useState(restoredInput);
  if (restoredInput !== prevRestored) {
    setPrevRestored(restoredInput);
    const restored = parseRestored(restoredInput);
    if (restored) {
      if (restored.schema) setSchemaText(restored.schema);
      if (restored.rows) setRowsDraft(String(restored.rows));
      if (restored.format) setFormat(restored.format);
      if (restored.locale) setLocale(restored.locale);
      setAutoRun((n) => n + 1);
    }
  }

  /** Serializes already-generated rows (format / table changes don't need new data). */
  const publish = (rows: Row[], keys: string[], fmt: MockFormat, table: string, ms: number) => {
    const full = serializeRows(rows, fmt, keys, table);
    fullOutputRef.current = full;
    setPreview(rows.length > PREVIEW_ROWS ? serializeRows(rows.slice(0, PREVIEW_ROWS), fmt, keys, table) : full);
    setOutputMeta({ total: rows.length, format: fmt, ms });
    onStatsChange?.(full.length, ms);
  };

  const generateData = async () => {
    const id = ++runId.current;
    setError(null);
    const parsed = parseSchema(schemaText);
    if (!parsed.ok) {
      setError(parsed.error);
      onValidationChange?.(false, parsed.error);
      return;
    }
    const count = clampRows(Number(rowsDraft));
    setRowsDraft(String(count));
    setProgress({ done: 0, total: count });
    try {
      const faker = await loadFaker(locale);
      if (id !== runId.current) return;
      const start = performance.now();
      const rows = await generateRows(parsed.schema, count, faker, {
        onProgress: (done) => {
          if (id === runId.current) setProgress({ done, total: count });
        },
        isStale: () => id !== runId.current,
      });
      if (!rows || id !== runId.current) return;
      const keys = Object.keys(parsed.schema);
      dataRef.current = { rows, keys };
      publish(rows, keys, format, tableName, performance.now() - start);
      onValidationChange?.(true);
      setActiveTab("output");
    } catch (e) {
      if (id !== runId.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setError(`Generation failed: ${message}`);
      onValidationChange?.(false, message);
    } finally {
      if (id === runId.current) setProgress(null);
    }
  };

  // Generate once after mount (and after a restore), off the first paint
  useEffect(() => {
    const t = setTimeout(() => void generateData(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const changeFormat = (next: MockFormat) => {
    setFormat(next);
    const data = dataRef.current;
    if (data) publish(data.rows, data.keys, next, tableName, outputMeta?.ms ?? 0);
  };

  const changeTable = (next: string) => {
    setTableName(next);
    const data = dataRef.current;
    if (data && format === "sql") publish(data.rows, data.keys, "sql", next, outputMeta?.ms ?? 0);
  };

  const applyPreset = (presetId: string) => {
    const preset = SCHEMA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSchemaText(preset.schema);
    setTableName(preset.table);
    setActiveTab("schema");
  };

  const outFormat = formatMeta(outputMeta?.format ?? format);
  const handleDownload = () => downloadText(`mock-data.${outFormat.ext}`, fullOutputRef.current, outFormat.mime);
  const busy = progress !== null;
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const imageCode = useMemo(() => preview.split("\n").slice(0, 60).join("\n"), [preview]);

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Toolbar */}
      <ToolHeader
        icon={getToolIcon("mock-data-generator")}
        title="Mock Data Generator"
        utilities={
          <ShareMenu
            toolSlug="mock-data-generator"
            data={JSON.stringify({ schema: schemaText, rows: rowCount, format, locale })}
            imageCode={imageCode || undefined}
            imageLanguage={outFormat.language}
          />
        }
        options={
          <>
            <label className="flex items-center gap-2">
              <span className="text-[13px] md:text-xs font-medium text-zinc-500">Rows</span>
              <input
                type="number"
                inputMode="numeric"
                className={cn(inputBase, "w-20 md:w-24 font-mono")}
                value={rowsDraft}
                onChange={(e) => setRowsDraft(e.target.value)}
                onBlur={() => setRowsDraft(String(clampRows(Number(rowsDraft))))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void generateData();
                }}
                min={1}
                max={MAX_ROWS}
                aria-label="Number of rows"
              />
            </label>
            <select className={selectBase} value={format} onChange={(e) => changeFormat(e.target.value as MockFormat)} aria-label="Output format">
              {MOCK_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <select className={cn(selectBase, "max-w-[9.5rem]")} value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Faker locale" title="Locale (loaded on demand)">
              {FAKER_LOCALES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            {format === "sql" && (
              <input
                type="text"
                className={cn(inputBase, "w-28 font-mono")}
                value={tableName}
                onChange={(e) => changeTable(e.target.value)}
                aria-label="SQL table name"
                title="SQL table name"
                spellCheck={false}
              />
            )}
          </>
        }
        actions={
          <button type="button" onClick={() => void generateData()} className={cn(btnPrimary, "min-w-28")} aria-busy={busy}>
            {busy ? <Loader2 {...iconProps} className="size-4 shrink-0 animate-spin" /> : <Play {...iconProps} />}
            {busy && progress && progress.total > 500 ? `${pct}%` : "Generate"}
          </button>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "schema", label: "Schema" },
          { id: "output", label: "Output" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Editor Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className={cn("flex-1 md:border-r border-zinc-200 flex flex-col min-h-0 min-w-0", activeTab !== "schema" && "hidden md:flex")}>
          <PaneBar
            label={
              schemaCheck.ok ? (
                <>
                  Schema <span className="ml-1 font-mono normal-case tracking-normal text-zinc-400">{"{{module.method}}"}</span>
                </>
              ) : (
                <span className="normal-case tracking-normal text-red-600">Schema · {schemaText.trim() ? "invalid JSON" : "empty"}</span>
              )
            }
          >
            <select
              value=""
              onChange={(e) => applyPreset(e.target.value)}
              className={cn(selectBase, "border-transparent bg-transparent")}
              aria-label="Start from a schema template"
            >
              <option value="" disabled>
                Templates
              </option>
              {SCHEMA_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setSchemaText("")} className={btnGhost} title="Clear schema" aria-label="Clear schema">
              <Trash2 {...iconProps} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </PaneBar>
          <div className="flex-1 relative min-h-[240px]">
            <MonacoEditor
              height="100%"
              language="json"
              value={schemaText}
              onChange={(val) => setSchemaText(val || "")}
              options={{ minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
            />
          </div>
        </div>
        <div className={cn("flex-1 flex flex-col min-h-0 min-w-0", activeTab !== "output" && "hidden md:flex")}>
          <PaneBar
            label={
              outputMeta ? (
                <>
                  {outputMeta.total > PREVIEW_ROWS
                    ? `First ${PREVIEW_ROWS} of ${outputMeta.total.toLocaleString()} rows`
                    : `${outputMeta.total.toLocaleString()} ${outputMeta.total === 1 ? "row" : "rows"}`}
                  <span className="ml-1.5 font-mono normal-case tracking-normal text-zinc-400">.{outFormat.ext}</span>
                </>
              ) : (
                "Output"
              )
            }
          >
            <CopyTextButton
              copied={copiedKey === "out"}
              onCopy={() => void copy(fullOutputRef.current, "out")}
              disabled={!outputMeta}
              title="Copy every row"
            />
            <button type="button" onClick={handleDownload} disabled={!outputMeta} className={btnGhost} title={`Download .${outFormat.ext}`} aria-label={`Download .${outFormat.ext}`}>
              <Download {...iconProps} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </PaneBar>
          {error && (
            <div className="flex shrink-0 items-start gap-2 border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 md:px-4">
              <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
              <span className="min-w-0 break-words font-mono">{error}</span>
            </div>
          )}
          <div className="flex-1 relative min-h-[240px]">
            <MonacoEditor
              height="100%"
              language={outFormat.language}
              value={preview}
              options={{ readOnly: true, minimap: { enabled: false }, tabSize: 2, wordWrap: "on" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const FORMAT_IDS = new Set<string>(MOCK_FORMATS.map((f) => f.id));
const LOCALE_IDS = new Set<string>(FAKER_LOCALES.map((l) => l.id));

/** Restored payloads are `{ schema, rows, format, locale? }`; anything else (magic paste, stale links) is ignored. */
function parseRestored(raw: string | null | undefined): { schema?: string; rows?: number; format?: MockFormat; locale?: string } | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const obj = parsed as { schema?: unknown; rows?: unknown; format?: unknown; locale?: unknown };
    return {
      schema: typeof obj.schema === "string" ? obj.schema : undefined,
      rows: typeof obj.rows === "number" && Number.isFinite(obj.rows) ? clampRows(obj.rows) : undefined,
      format: typeof obj.format === "string" && FORMAT_IDS.has(obj.format) ? (obj.format as MockFormat) : undefined,
      locale: typeof obj.locale === "string" && LOCALE_IDS.has(obj.locale) ? obj.locale : undefined,
    };
  } catch {
    return null;
  }
}
