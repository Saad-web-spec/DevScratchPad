"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Clock, Calendar, Trash2, CornerDownLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ShareMenu } from "@/components/ShareMenu";
import { ToolHeader, btnPrimary, btnGhost, segmentTrack, segmentBtn, chipBtn, captionText, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { CopyIconButton, ResultRow, useCopyState } from "@/components/tools/generators/CopyControls";
import { LOCAL_ZONE, TimeZoneSelect, resolveZone } from "@/components/tools/generators/TimeZoneSelect";
import {
  EPOCH_UNIT_LABEL,
  UTC_ZONE,
  calendarInfo,
  formatHuman,
  formatIsoInZone,
  formatOffset,
  formatRelative,
  formatRfc2822,
  formatWallShort,
  isValidTimeZone,
  localTimeZone,
  parseTimestampInput,
  zoneOffsetMinutes,
  type EpochUnit,
} from "@/components/tools/generators/time";

interface TimestampConverterToolProps {
  restoredInput?: string | null;
}

const UNITS: { id: EpochUnit; label: string; title: string }[] = [
  { id: "auto", label: "Auto", title: "Detect the unit from the number of digits" },
  { id: "s", label: "s", title: "Seconds" },
  { id: "ms", label: "ms", title: "Milliseconds" },
  { id: "us", label: "µs", title: "Microseconds" },
  { id: "ns", label: "ns", title: "Nanoseconds" },
];

const EXAMPLES: { label: string; value: string }[] = [
  { label: "Unix 0", value: "0" },
  { label: "Seconds", value: "1700000000" },
  { label: "Milliseconds", value: "1700000000000" },
  { label: "Y2038", value: "2147483647" },
  { label: "ISO + offset", value: "2026-01-01T09:30:00+05:00" },
  { label: "Zone date", value: "2026-07-04 18:00" },
  { label: "RFC 2822", value: "Tue, 19 Jan 2038 03:14:07 GMT" },
];

interface RestoredState {
  timestamp?: string;
  unit?: EpochUnit;
  zone?: string;
}

export function TimestampConverterTool({ restoredInput }: TimestampConverterToolProps) {
  const parsedInput = parseRestored(restoredInput);
  const [inputValue, setInputValue] = useState(() => parsedInput?.timestamp || Math.floor(Date.now() / 1000).toString());
  const [unit, setUnit] = useState<EpochUnit>(parsedInput?.unit ?? "auto");
  const [zone, setZone] = useState<string>(parsedInput?.zone ?? LOCAL_ZONE);
  const { copiedKey, copy } = useCopyState();

  // Restored links / history entries arriving after mount
  const [prevRestored, setPrevRestored] = useState(restoredInput);
  if (restoredInput !== prevRestored) {
    setPrevRestored(restoredInput);
    const restored = parseRestored(restoredInput);
    if (restored?.timestamp) {
      setInputValue(restored.timestamp);
      if (restored.unit) setUnit(restored.unit);
      if (restored.zone) setZone(restored.zone);
    }
  }

  const tz = resolveZone(zone);
  const local = useMemo(() => localTimeZone(), []);
  const parsed = useMemo(() => parseTimestampInput(inputValue, unit, tz), [inputValue, unit, tz]);

  const rows = useMemo(() => {
    if (!parsed.ok) return [];
    const ms = parsed.ms;
    const cal = calendarInfo(ms, tz);
    const offset = formatOffset(zoneOffsetMinutes(ms, tz));
    const list: { key: string; label: string; value: string; hint?: string; mono?: boolean }[] = [
      { key: "s", label: "Unix seconds", value: parsed.exact.s },
      { key: "ms", label: "Unix milliseconds", value: parsed.exact.ms },
    ];
    if (parsed.unit === "us" || parsed.unit === "ns") {
      list.push({ key: "us", label: "Unix microseconds", value: parsed.exact.us });
      list.push({ key: "ns", label: "Unix nanoseconds", value: parsed.exact.ns });
    }
    list.push(
      { key: "iso-utc", label: "ISO 8601 (UTC)", value: formatIsoInZone(ms, UTC_ZONE) },
      ...(tz !== UTC_ZONE ? [{ key: "iso-zone", label: `ISO 8601 (${offset})`, value: formatIsoInZone(ms, tz) }] : []),
      { key: "rfc", label: "RFC 2822", value: formatRfc2822(ms, tz) },
      { key: "http", label: "HTTP date (UTC)", value: new Date(ms).toUTCString() },
      { key: "zone", label: tz === UTC_ZONE ? "UTC" : tz.replace(/_/g, " "), value: formatHuman(ms, tz), mono: false },
      ...(tz !== local ? [{ key: "local", label: `Local (${local.replace(/_/g, " ")})`, value: formatHuman(ms, local), mono: false }] : []),
      {
        key: "cal",
        label: "Calendar",
        value: `Day ${cal.dayOfYear} · ISO week ${cal.isoWeek} of ${cal.isoWeekYear}`,
        mono: false,
      }
    );
    return list;
  }, [parsed, tz, local]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot(
        "epoch-converter",
        "Epoch Converter",
        JSON.stringify({ timestamp: inputValue, unit, zone }),
        parsed.ok ? formatIsoInZone(parsed.ms, UTC_ZONE) : ""
      );
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [inputValue, unit, zone, parsed]);

  const handleNow = () => {
    const now = Date.now();
    setInputValue(unit === "ms" ? String(now) : unit === "us" ? `${now}000` : unit === "ns" ? `${now}000000` : String(Math.floor(now / 1000)));
  };

  const detection = !parsed.ok
    ? null
    : parsed.kind === "epoch"
      ? `${unit === "auto" ? "Detected" : "Reading as"} ${EPOCH_UNIT_LABEL[parsed.unit ?? "s"]}`
      : parsed.zoneNote ?? "Absolute date (has its own offset)";

  const imageCode = rows.map((r) => `${r.label.padEnd(22)} ${r.value}`).join("\n");

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-y-auto overflow-x-hidden">
      <ToolHeader
        icon={getToolIcon("epoch-converter")}
        title="Epoch / Timestamp Converter"
        className="sticky top-0 z-10"
        utilities={
          <ShareMenu
            toolSlug="epoch-converter"
            data={JSON.stringify({ timestamp: inputValue, unit, zone })}
            imageCode={imageCode || undefined}
            imageLanguage="plaintext"
          />
        }
        options={<TimeZoneSelect value={zone} onChange={setZone} />}
        actions={
          <button type="button" onClick={handleNow} className={btnPrimary} title="Use the current time">
            <Clock {...iconProps} />
            <span>Now</span>
          </button>
        }
      />

      <LiveClock onUse={(value) => setInputValue(value)} />

      <div className="max-w-3xl mx-auto w-full px-3 py-4 sm:px-4 md:px-6 md:py-6 space-y-5">
        {/* Input Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="timestamp-input" className={captionText}>
              Timestamp or date
            </label>
            <button
              type="button"
              onClick={() => setInputValue("")}
              disabled={!inputValue}
              className={cn(btnGhost, "-mr-2")}
              title="Clear input"
            >
              <Trash2 {...iconProps} />
              <span>Clear</span>
            </button>
          </div>
          <input
            id="timestamp-input"
            type="text"
            inputMode="text"
            spellCheck={false}
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={cn(
              "w-full min-w-0 h-12 px-3 md:px-4 bg-white border rounded-lg text-base md:text-lg font-mono text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-1",
              parsed.ok || !inputValue.trim()
                ? "border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                : "border-red-300 focus:border-red-500 focus:ring-red-500"
            )}
            placeholder="1700000000, 1700000000000 or 2026-01-01T09:30:00Z"
            aria-invalid={!parsed.ok && Boolean(inputValue.trim())}
            aria-describedby="timestamp-status"
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div role="group" aria-label="Epoch unit" className={segmentTrack}>
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={unit === u.id}
                  title={u.title}
                  onClick={() => setUnit(u.id)}
                  className={cn(segmentBtn(unit === u.id), "min-w-9 font-mono")}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <p id="timestamp-status" className="min-w-0 text-xs text-zinc-500">
              {parsed.ok ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-zinc-900" aria-hidden="true" />
                  {detection}
                </span>
              ) : inputValue.trim() ? (
                <span className="inline-flex items-start gap-1.5 text-red-600">
                  <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                  {parsed.error}
                </span>
              ) : (
                "Dates without an offset are read in the selected time zone."
              )}
            </p>
          </div>
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setInputValue(ex.value)}
                className={cn(chipBtn(inputValue === ex.value), "h-10 md:h-7 md:px-2.5 md:text-[11px]")}
                title={ex.value}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {parsed.ok ? (
          <div className="divide-y divide-zinc-100 border-y border-zinc-200">
            {rows.map((row) => (
              <ResultRow
                key={row.key}
                label={row.label}
                value={row.value}
                mono={row.mono !== false}
                copied={copiedKey === row.key}
                onCopy={() => void copy(row.value, row.key)}
              />
            ))}
            <RelativeRow ms={parsed.ms} copied={copiedKey === "relative"} onCopy={(text) => void copy(text, "relative")} />
          </div>
        ) : (
          <div className="py-12 border-y border-zinc-200 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Calendar className="size-6 text-zinc-300" strokeWidth={ICON_STROKE} aria-hidden="true" />
            <p className="text-sm">Enter an epoch value or a date to see every format.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Current-time strip. Owns its own one-second tick so the rest of the tool
 * does not re-render every second.
 */
const LiveClock = memo(function LiveClock({ onUse }: { onUse: (value: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  const { copiedKey, copy } = useCopyState();
  const zone = useMemo(() => localTimeZone(), []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      // Align to the next whole second so the display never skips
      timer = setTimeout(tick, 1000 - (t % 1000) + 5);
    };
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => clearTimeout(timer);
  }, []);

  const seconds = String(Math.floor(now / 1000));
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50 pl-3 pr-1 md:pl-4">
      <span className={cn(captionText, "shrink-0")}>Now</span>
      <span className="font-mono text-sm font-medium tabular-nums text-zinc-900" aria-live="off">
        {seconds}
      </span>
      <span className="hidden min-w-0 truncate font-mono text-xs text-zinc-500 sm:inline">{formatWallShort(now, zone)}</span>
      <div className="ml-auto flex shrink-0 items-center">
        <CopyIconButton copied={copiedKey === "now"} onCopy={() => void copy(String(Math.floor(Date.now() / 1000)), "now")} label="current Unix seconds" />
        <button
          type="button"
          onClick={() => onUse(String(Math.floor(Date.now() / 1000)))}
          className={btnGhost}
          title="Convert the current time"
        >
          <CornerDownLeft {...iconProps} />
          <span className="hidden sm:inline">Use</span>
        </button>
      </div>
    </div>
  );
});

/** Relative time row with its own slow tick ("in 3 hours" stays current without re-rendering the tool). */
function RelativeRow({ ms, copied, onCopy }: { ms: number; copied: boolean; onCopy: (text: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const text = formatRelative(ms, now);
  return <ResultRow label="Relative" value={text} mono={false} copied={copied} onCopy={() => onCopy(formatRelative(ms, Date.now()))} />;
}

const UNIT_IDS = new Set<string>(UNITS.map((u) => u.id));

/** Restored payloads are JSON for this tool; anything else (magic paste, stale links) is ignored. */
function parseRestored(raw: string | null | undefined): RestoredState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as { timestamp?: unknown; unit?: unknown; zone?: unknown };
      return {
        timestamp: typeof obj.timestamp === "string" || typeof obj.timestamp === "number" ? String(obj.timestamp) : undefined,
        unit: typeof obj.unit === "string" && UNIT_IDS.has(obj.unit) ? (obj.unit as EpochUnit) : undefined,
        zone: typeof obj.zone === "string" && (obj.zone === LOCAL_ZONE || isValidTimeZone(obj.zone)) ? obj.zone : undefined,
      };
    }
    if (typeof parsed === "number") return { timestamp: String(parsed) };
  } catch {
    if (/^\s*-?\d{1,19}(\.\d+)?\s*$/.test(raw)) return { timestamp: raw.trim() };
    // Pasted ISO / RFC 2822 dates
    if (raw.length <= 64 && !Number.isNaN(Date.parse(raw.trim()))) return { timestamp: raw.trim() };
  }
  return null;
}
