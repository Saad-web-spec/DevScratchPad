"use client";

import { useState, useEffect, useMemo } from "react";
import { ShareMenu } from "@/components/ShareMenu";
import { Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ValidationBadge } from "@/components/layout/StatusBar";
import { ToolHeader, PaneBar, btnGhost, selectBase, chipBtn, captionText, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { nextRuns, parseCron, type CronSchedule } from "@/components/tools/generators/cronSchedule";
import { CopyIconButton, CopyTextButton, useCopyState } from "@/components/tools/generators/CopyControls";
import { LOCAL_ZONE, TimeZoneSelect, resolveZone } from "@/components/tools/generators/TimeZoneSelect";
import { formatCountdown, formatIsoInZone, formatWallShort, weekdayInZone } from "@/components/tools/generators/time";

interface CronVisualizerToolProps {
 onValidationChange: (isValid: boolean, error?: string) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const PRESETS = [
 { label:"Every minute", cron:"* * * * *"},
 { label:"Every 5 minutes", cron:"*/5 * * * *"},
 { label:"Every hour", cron:"0 * * * *"},
 { label:"Daily at midnight", cron:"0 0 * * *"},
 { label:"Daily at 9:00 AM", cron:"0 9 * * *"},
 { label:"Weekdays at 9:00 AM", cron:"0 9 * * 1-5"},
 { label:"Every 15 min, 9-5 weekdays", cron:"*/15 9-17 * * 1-5"},
 { label:"Every Sunday at midnight", cron:"0 0 * * 0"},
 { label:"1st of every month", cron:"0 0 1 * *"},
 { label:"Quarterly", cron:"0 0 1 */3 *"},
 { label:"Last day of month", cron:"0 18 L * *"},
 { label:"@weekly", cron:"@weekly"},
];

const FIELD_NAMES: Record<number, string[]> = {
 5: ["Minute", "Hour", "Day of month", "Month", "Day of week"],
 6: ["Second", "Minute", "Hour", "Day of month", "Month", "Day of week"],
 7: ["Second", "Minute", "Hour", "Day of month", "Month", "Day of week", "Year"],
};

const RUN_COUNTS = [5, 10, 25];

type Describe = (expr: string, logicalAnd: boolean) => string;

export function CronVisualizerTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: CronVisualizerToolProps) {
 const [input, setInput] = useState<string>(() => restoredInput || "*/15 9-17 * * 1-5");
 const [zone, setZone] = useState<string>(LOCAL_ZONE);
 const [runCount, setRunCount] = useState<number>(10);
 const [describe, setDescribe] = useState<Describe | null>(null);
 const { copiedKey, copy } = useCopyState();

 // Restore from history
 const [prevRestored, setPrevRestored] = useState(restoredInput);
 if (restoredInput !== prevRestored) {
 setPrevRestored(restoredInput);
 if (restoredInput) setInput(restoredInput);
 }

 // cronstrue (the plain-English describer) loads after first paint; parsing and next runs don't need it
 useEffect(() => {
 let alive = true;
 import("cronstrue")
 .then((mod) => {
 if (!alive) return;
 setDescribe(() => (expr: string, logicalAnd: boolean) =>
 mod.default.toString(expr, {
 throwExceptionOnParseError: true,
 use24HourTimeFormat: false,
 verbose: true,
 logicalAndDayFields: logicalAnd,
 })
 );
 })
 .catch(() => {
 // Description is optional; validation and next runs still work
 });
 return () => {
 alive = false;
 };
 }, []);

 const parsed = useMemo(() => (input.trim() ? parseCron(input) : null), [input]);
 const isValid = !parsed || parsed.ok;

 const output = useMemo(() => {
 if (!parsed?.ok || !describe) return "";
 try {
 return describe(parsed.schedule.expanded, parsed.schedule.domStar || parsed.schedule.dowStar);
 } catch {
 return "";
 }
 }, [parsed, describe]);

 // Real-time validation & stats
 useEffect(() => {
 const start = performance.now();
 onValidationChange(isValid, parsed && !parsed.ok ? parsed.error : undefined);
 onStatsChange(input.length, performance.now() - start);
 }, [input, parsed, isValid, onValidationChange, onStatsChange]);

 // Dispatch custom events when input/output change
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output },
 })
 );
 window.dispatchEvent(
 new CustomEvent("workspace-saved", {
 detail: { input, output },
 })
 );
 }
 }, [input, output]);

 useEffect(() => {
 const handleSave = () => addSnapshot("cron", "Cron Visualizer", input, output);
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 const handleSelectPreset = (cron: string) => {
 setInput(cron);
 onLogHistory?.(cron);
 };

 const tz = resolveZone(zone);
 const errorMessage = parsed && !parsed.ok ? parsed.error : null;

 // Field rows: parsed meanings when valid, raw tokens (with the bad one marked) when not
 const fieldRows = useMemo(() => {
 if (parsed?.ok) return parsed.schedule.fields.map((f) => ({ ...f, bad: false }));
 const parts = input.trim().split(/\s+/).filter(Boolean);
 const names = FIELD_NAMES[parts.length] ?? FIELD_NAMES[5];
 return names.map((name, i) => ({
 name,
 raw: parts[i] ?? "",
 allowed: "",
 meaning: "",
 bad: Boolean(parsed && !parsed.ok && parsed.fieldIndex === i),
 }));
 }, [parsed, input]);

 const imageCode = output ? `${input.trim()}\n# ${output}` : input;

 return (
 <div className="flex flex-col h-full bg-white overflow-y-auto w-full overflow-x-hidden">
 {/* Tool Header */}
 <ToolHeader
 icon={getToolIcon("cron")}
 title="Cron Expression Visualizer"
 className="sticky top-0 z-10"
 utilities={<ShareMenu toolSlug="cron" data={input} imageCode={imageCode} imageLanguage="plaintext" />}
 options={<TimeZoneSelect value={zone} onChange={setZone} label="Time zone for next runs" />}
 />

 <div className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-6 space-y-5 md:space-y-6">
 {/* Cron Input Field */}
 <div className="space-y-2.5">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <label htmlFor="cron-expression-input" className={captionText}>
 Cron Expression
 </label>
 {input.trim() && <ValidationBadge isValid={isValid} />}
 </div>
 <div className="-mr-2 flex items-center">
 <CopyTextButton copied={copiedKey === "expr"} onCopy={() => void copy(input.trim(), "expr")} disabled={!input.trim()} />
 <button
 type="button"
 onClick={() => setInput("")}
 disabled={!input}
 className={btnGhost}
 title="Clear input"
 >
 <Trash2 {...iconProps}/>
 <span>Clear</span>
 </button>
 </div>
 </div>

 <input
 id="cron-expression-input"
 type="text"
 value={input}
 spellCheck={false}
 autoComplete="off"
 onChange={(e) => setInput(e.target.value)}
 placeholder="e.g. */15 * * * * or 0 9 * * 1-5"
 aria-invalid={!isValid}
 aria-describedby="cron-description"
 className={cn(
 "w-full h-12 font-mono text-base md:text-lg tracking-wide bg-white border text-zinc-900 rounded-lg px-3 md:px-4 transition-colors placeholder:text-zinc-400 focus:ring-1 focus:outline-none",
 isValid ? "border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900" : "border-red-300 focus:border-red-500 focus:ring-red-500"
 )}
 />

 {/* Plain-English description or the parse error */}
 <div id="cron-description" className="min-h-7">
 {errorMessage ? (
 <p className="flex items-start gap-2 text-sm text-red-600">
 <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true"/>
 <span className="break-words">{errorMessage}</span>
 </p>
 ) : output ? (
 <div className="flex items-start justify-between gap-2">
 <p className="text-base md:text-lg font-medium leading-snug text-zinc-900 break-words">{output}</p>
 <CopyIconButton copied={copiedKey === "desc"} onCopy={() => void copy(output, "desc")} label="description" className="-mt-1.5 -mr-1" />
 </div>
 ) : parsed?.ok ? (
 <p className="text-sm text-zinc-400">{describe ? "No plain-English description for this syntax." : "Describing…"}</p>
 ) : (
 <p className="text-sm text-zinc-400">Five fields: minute, hour, day of month, month, day of week.</p>
 )}
 </div>

 {/* Presets */}
 <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Common schedules">
 {PRESETS.map((preset) => (
 <button
 key={preset.cron}
 type="button"
 onClick={() => handleSelectPreset(preset.cron)}
 className={cn(chipBtn(input.trim() === preset.cron), "h-10 md:h-7 md:px-2.5 md:text-[11px]")}
 title={preset.cron}
 >
 {preset.label}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
 {/* Field breakdown */}
 <section className="border border-zinc-200 rounded-lg overflow-hidden" aria-label="Field breakdown">
 <PaneBar label="Fields" />
 <ul className="divide-y divide-zinc-100">
 {fieldRows.map((field) => (
 <li key={field.name} className={cn("flex items-start gap-3 px-3 py-2.5 md:px-4", field.bad && "bg-red-50")}>
 <span className="w-24 shrink-0 pt-0.5 text-xs font-medium text-zinc-500 sm:w-28">{field.name}</span>
 <span className={cn("w-16 shrink-0 break-all font-mono text-sm font-semibold sm:w-20", field.bad ? "text-red-600" : "text-zinc-900")}>
 {field.raw || "–"}
 </span>
 <span className="min-w-0 flex-1 text-[13px] leading-snug text-zinc-600 break-words">
 {field.meaning}
 {field.allowed && <span className="block font-mono text-[11px] text-zinc-400">{field.allowed}</span>}
 </span>
 </li>
 ))}
 </ul>
 </section>

 {/* Next runs */}
 <NextRuns schedule={parsed?.ok ? parsed.schedule : null} timeZone={tz} count={runCount} onCountChange={setRunCount} />
 </div>
 </div>
 </div>
 );
}

/**
 * Upcoming run list. Owns a 15-second tick so countdowns stay current
 * without re-rendering the rest of the tool.
 */
function NextRuns({
 schedule,
 timeZone,
 count,
 onCountChange,
}: {
 schedule: CronSchedule | null;
 timeZone: string;
 count: number;
 onCountChange: (n: number) => void;
}) {
 const [now, setNow] = useState(() => Date.now());
 const { copiedKey, copy } = useCopyState();

 useEffect(() => {
 const timer = setInterval(() => setNow(Date.now()), 15000);
 return () => clearInterval(timer);
 }, []);

 const runs = useMemo(() => (schedule ? nextRuns(schedule, now, count, timeZone) : []), [schedule, now, count, timeZone]);
 const allText = runs.map((ms) => formatIsoInZone(ms, timeZone, false)).join("\n");

 return (
 <section className="border border-zinc-200 rounded-lg overflow-hidden" aria-label="Next runs">
 <PaneBar label={<>Next runs <span className="normal-case tracking-normal text-zinc-400">· {timeZone.replace(/_/g, " ")}</span></>}>
 <select
 value={count}
 onChange={(e) => onCountChange(Number(e.target.value))}
 className={cn(selectBase, "border-transparent bg-transparent")}
 aria-label="Number of runs"
 >
 {RUN_COUNTS.map((n) => (
 <option key={n} value={n}>{n} runs</option>
 ))}
 </select>
 <CopyTextButton copied={copiedKey === "all"} onCopy={() => void copy(allText, "all")} disabled={!runs.length}>
 <span className="hidden sm:inline">Copy all</span>
 <span className="sm:hidden">All</span>
 </CopyTextButton>
 </PaneBar>
 {!schedule ? (
 <p className="px-4 py-8 text-center text-sm text-zinc-400">Enter a valid expression to see when it runs.</p>
 ) : runs.length === 0 ? (
 <p className="px-4 py-8 text-center text-sm text-zinc-500">This schedule never fires (no matching date in the next 400 years).</p>
 ) : (
 <ol className="divide-y divide-zinc-100">
 {runs.map((ms, i) => {
 const iso = formatIsoInZone(ms, timeZone, false);
 return (
 <li key={ms} className="flex items-center gap-2 py-0.5 pl-3 pr-1 md:pl-4">
 <span className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-400 select-none">{i + 1}</span>
 <span className="w-9 shrink-0 text-xs font-medium text-zinc-500">{weekdayInZone(ms, timeZone)}</span>
 <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-zinc-900" title={iso}>{formatWallShort(ms, timeZone)}</span>
 <span className="hidden shrink-0 text-xs tabular-nums text-zinc-500 sm:inline">{formatCountdown(ms, now)}</span>
 <CopyIconButton copied={copiedKey === `run-${i}`} onCopy={() => void copy(iso, `run-${i}`)} label={`run ${i + 1}`} />
 </li>
 );
 })}
 </ol>
 )}
 </section>
 );
}
