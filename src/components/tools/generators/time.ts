/**
 * Time zone and timestamp helpers built on `Intl` only (no date library).
 *
 * "Wall time" below means the clock reading in a zone, stored as a UTC millisecond
 * number (Date.UTC(y, m, d, h, mi, s)). Converting wall time to an instant needs the
 * zone offset at that instant, which Intl gives us through `formatToParts`.
 */

export const UTC_ZONE = "UTC";

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      era: "short",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** Browser time zone (IANA name), e.g. "Asia/Karachi". */
export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || UTC_ZONE;
  } catch {
    return UTC_ZONE;
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    partsFormatter(tz);
    return true;
  } catch {
    return false;
  }
}

/** All IANA zones the browser knows, with a small fallback list for older engines. */
export function listTimeZones(): string[] {
  try {
    const zones = Intl.supportedValuesOf("timeZone");
    if (zones.length) return zones.includes(UTC_ZONE) ? zones : [UTC_ZONE, ...zones];
  } catch {
    // Older browsers: fall through
  }
  return [
    UTC_ZONE,
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Paris",
    "Europe/Moscow",
    "Africa/Cairo",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
}

export interface WallParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Clock reading of `ms` in `timeZone`. */
export function wallParts(ms: number, timeZone: string): WallParts {
  if (timeZone === UTC_ZONE) {
    const d = new Date(ms);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
    };
  }
  const parts = partsFormatter(timeZone).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const era = parts.find((p) => p.type === "era")?.value ?? "AD";
  const y = get("year");
  return {
    year: era === "BC" || era === "B" ? 1 - y : y,
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Wall time as a UTC-ms number (seconds precision; the millisecond part of `ms` is kept). */
export function toWallMs(ms: number, timeZone: string): number {
  const p = wallParts(ms, timeZone);
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  d.setUTCHours(p.hour, p.minute, p.second, ((ms % 1000) + 1000) % 1000);
  return d.getTime();
}

/** Offset of `timeZone` from UTC at instant `ms`, in minutes (east positive, e.g. +300 for UTC+5). */
export function zoneOffsetMinutes(ms: number, timeZone: string): number {
  if (timeZone === UTC_ZONE) return 0;
  return Math.round((toWallMs(ms, timeZone) - ms) / 60000);
}

/**
 * Instant for a wall time in `timeZone`, or null when that wall time does not exist
 * (a DST spring-forward gap). In a fall-back overlap the earlier instant is returned.
 */
export function wallToInstant(wallMs: number, timeZone: string): number | null {
  if (timeZone === UTC_ZONE) return wallMs;
  const off1 = zoneOffsetMinutes(wallMs, timeZone);
  let guess = wallMs - off1 * 60000;
  const off2 = zoneOffsetMinutes(guess, timeZone);
  if (off2 !== off1) guess = wallMs - off2 * 60000;
  if (toWallMs(guess, timeZone) !== wallMs) return null;
  // Prefer the earlier of two valid instants in an overlap
  const earlier = guess - 3600000;
  if (toWallMs(earlier, timeZone) === wallMs) return earlier;
  return guess;
}

const pad = (n: number, len = 2) => String(Math.abs(n)).padStart(len, "0");

export function formatOffset(minutes: number, separator = ":"): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}${separator}${pad(abs % 60)}`;
}

function formatYear(year: number): string {
  if (year >= 0 && year <= 9999) return pad(year, 4);
  return (year < 0 ? "-" : "+") + pad(year, 6);
}

/** ISO 8601 with the zone's offset, e.g. 2026-10-11T04:44:47.000+05:00 (Z for UTC). */
export function formatIsoInZone(ms: number, timeZone: string, withMillis = true): string {
  const p = wallParts(ms, timeZone);
  const millis = ((ms % 1000) + 1000) % 1000;
  const off = zoneOffsetMinutes(ms, timeZone);
  const base = `${formatYear(p.year)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
  return `${base}${withMillis ? `.${pad(millis, 3)}` : ""}${off === 0 && timeZone === UTC_ZONE ? "Z" : formatOffset(off)}`;
}

/** "2026-10-11 04:44:47" in the zone (sortable, compact; used for run lists). */
export function formatWallShort(ms: number, timeZone: string): string {
  const p = wallParts(ms, timeZone);
  return `${formatYear(p.year)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** RFC 2822 in the zone, e.g. "Sun, 11 Oct 2026 04:44:47 +0500". */
export function formatRfc2822(ms: number, timeZone: string): string {
  const p = wallParts(ms, timeZone);
  return `${weekdayInZone(ms, timeZone)}, ${pad(p.day)} ${MONTH_NAMES[p.month - 1]} ${formatYear(p.year)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)} ${formatOffset(zoneOffsetMinutes(ms, timeZone), "")}`;
}

/** Long human-readable form in the zone, e.g. "Sunday, October 11, 2026 at 4:44:47 AM GMT+5". */
export function formatHuman(ms: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toUTCString();
  }
}

/** Weekday name of an instant in a zone. */
export function weekdayInZone(ms: number, timeZone: string): string {
  const p = wallParts(ms, timeZone);
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  return DAY_NAMES[d.getUTCDay()];
}

/** Day of year (1-366) and ISO-8601 week (week, week-year) for an instant in a zone. */
export function calendarInfo(ms: number, timeZone: string): { dayOfYear: number; isoWeek: number; isoWeekYear: number } {
  const p = wallParts(ms, timeZone);
  const date = new Date(0);
  date.setUTCFullYear(p.year, p.month - 1, p.day);
  const start = new Date(0);
  start.setUTCFullYear(p.year, 0, 1);
  const dayOfYear = Math.round((date.getTime() - start.getTime()) / 86400000) + 1;
  // ISO week: the week with the year's first Thursday is week 1
  const dow = date.getUTCDay() || 7;
  const thursday = new Date(date.getTime() + (4 - dow) * 86400000);
  const isoWeekYear = thursday.getUTCFullYear();
  const yearStart = new Date(0);
  yearStart.setUTCFullYear(isoWeekYear, 0, 1);
  const isoWeek = Math.floor((thursday.getTime() - yearStart.getTime()) / 86400000 / 7) + 1;
  return { dayOfYear, isoWeek, isoWeekYear };
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000000],
  ["month", 2592000000],
  ["week", 604800000],
  ["day", 86400000],
  ["hour", 3600000],
  ["minute", 60000],
  ["second", 1000],
];

const relativeFormatter = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }) : null;

/** "in 3 hours", "2 days ago", "now". */
export function formatRelative(ms: number, now: number): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  if (abs < 1000) return "now";
  for (const [unit, size] of RELATIVE_UNITS) {
    if (abs >= size || unit === "second") {
      const value = Math.trunc(diff / size);
      return relativeFormatter ? relativeFormatter.format(value, unit) : `${value} ${unit}s`;
    }
  }
  return "now";
}

/** Compact "in 2h 05m" style countdown for run lists. */
export function formatCountdown(ms: number, now: number): string {
  const diff = Math.max(0, ms - now);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${pad(m)}m`;
  if (m > 0) return `in ${m}m ${pad(sec)}s`;
  return `in ${sec}s`;
}

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

export type EpochUnit = "auto" | "s" | "ms" | "us" | "ns";

export const EPOCH_UNIT_LABEL: Record<Exclude<EpochUnit, "auto">, string> = {
  s: "seconds",
  ms: "milliseconds",
  us: "microseconds",
  ns: "nanoseconds",
};

/** Largest instant a JS Date can hold: ±8.64e15 ms (±275,760 years). */
const MAX_DATE_MS = 8.64e15;

export type ParsedTimestamp =
  | {
      ok: true;
      ms: number;
      /** Sub-millisecond remainder for µs / ns input, kept so the epoch rows stay exact. */
      kind: "epoch" | "date";
      unit?: Exclude<EpochUnit, "auto">;
      /** How a date string without an offset was interpreted. */
      zoneNote?: string;
      exact: { s: string; ms: string; us: string; ns: string };
    }
  | { ok: false; error: string };

/** Picks the unit from magnitude: up to 11 digits is seconds, 12-14 ms, 15-17 µs, otherwise ns. */
export function detectEpochUnit(intDigits: number): Exclude<EpochUnit, "auto"> {
  if (intDigits <= 11) return "s";
  if (intDigits <= 14) return "ms";
  if (intDigits <= 17) return "us";
  return "ns";
}

const UNIT_POW: Record<Exclude<EpochUnit, "auto">, number> = { s: 9, ms: 6, us: 3, ns: 0 };

/** Exact decimal string arithmetic: epoch value in `unit` → integer nanoseconds as bigint (truncated toward zero). */
function toNanos(sign: string, intPart: string, fracPart: string, unit: Exclude<EpochUnit, "auto">): bigint {
  const pow = UNIT_POW[unit];
  const frac = (fracPart + "0".repeat(pow)).slice(0, pow);
  const digits = (intPart.replace(/^0+(?=\d)/, "") || "0") + frac;
  const v = BigInt(digits);
  return sign === "-" ? -v : v;
}

/** Floor division for bigint (rounds toward negative infinity, like Math.floor). */
function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  return a % b !== BigInt(0) && (a < BigInt(0)) !== (b < BigInt(0)) ? q - BigInt(1) : q;
}

function exactFromNanos(ns: bigint): { s: string; ms: string; us: string; ns: string } {
  return {
    s: floorDiv(ns, BigInt(1000000000)).toString(),
    ms: floorDiv(ns, BigInt(1000000)).toString(),
    us: floorDiv(ns, BigInt(1000)).toString(),
    ns: ns.toString(),
  };
}

const NAIVE_DATE_RE =
  /^(-?\d{4,6})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?$/;

/**
 * Parses an epoch number (seconds / ms / µs / ns) or a date string.
 * Date strings without an offset ("2026-03-29 02:30") are read as wall time in `timeZone`;
 * strings with Z or an offset, and RFC 2822 dates, are absolute.
 */
export function parseTimestampInput(raw: string, unit: EpochUnit, timeZone: string): ParsedTimestamp {
  const value = raw.trim().replace(/_/g, "");
  if (!value) return { ok: false, error: "Enter an epoch timestamp or a date." };

  const num = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (num) {
    const [, sign, intPart, fracPart = ""] = num;
    const digits = intPart.replace(/^0+(?=\d)/, "").length;
    const resolved = unit === "auto" ? detectEpochUnit(digits) : unit;
    const ns = toNanos(sign, intPart, fracPart, resolved);
    const ms = Number(floorDiv(ns, BigInt(1000000)));
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) {
      return { ok: false, error: `Out of range: ${value} ${EPOCH_UNIT_LABEL[resolved]} is beyond ±275,760 years.` };
    }
    return { ok: true, ms, kind: "epoch", unit: resolved, exact: exactFromNanos(ns) };
  }

  const naive = NAIVE_DATE_RE.exec(value);
  if (naive) {
    const [, y, mo, d, h = "0", mi = "0", s = "0", frac = ""] = naive;
    const month = Number(mo);
    const day = Number(d);
    if (month < 1 || month > 12) return { ok: false, error: `Month ${mo} is out of range (01-12).` };
    const wall = new Date(0);
    wall.setUTCFullYear(Number(y), month - 1, day);
    if (wall.getUTCDate() !== day) return { ok: false, error: `${value.slice(0, 10)} is not a real calendar date.` };
    if (Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return { ok: false, error: "Time must be within 00:00:00-23:59:59." };
    const millis = Number((frac + "000").slice(0, 3));
    wall.setUTCHours(Number(h), Number(mi), Number(s), millis);
    const instant = wallToInstant(wall.getTime(), timeZone);
    if (instant === null) {
      return { ok: false, error: `${value} does not exist in ${timeZone} (skipped by a daylight-saving change).` };
    }
    const ns = BigInt(instant) * BigInt(1000000) + BigInt((frac + "000000000").slice(3, 9));
    return { ok: true, ms: instant, kind: "date", zoneNote: `Read as ${timeZone} time`, exact: exactFromNanos(ns) };
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { ok: false, error: "Not a number or a recognised date. Try 1700000000, 2026-01-01T09:30:00Z or an RFC 2822 date." };
  }
  return { ok: true, ms: parsed, kind: "date", exact: exactFromNanos(BigInt(parsed) * BigInt(1000000)) };
}
