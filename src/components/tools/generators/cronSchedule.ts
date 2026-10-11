/**
 * Cron expression parser and next-run calculator (no dependencies).
 *
 * Supports Vixie / POSIX cron (5 fields) plus an optional leading seconds field (6 fields)
 * and a trailing year field (7 fields), names (JAN-DEC, SUN-SAT), 7 as Sunday, lists,
 * ranges, steps (`*\/n`, `a-b/n`, `a/n`), the @hourly-style macros, and the Quartz
 * day extensions `L`, `L-n`, `nW`, `LW` (day of month) and `nL`, `n#k` (day of week).
 *
 * Day matching follows Vixie cron: when both day fields are restricted (neither starts
 * with `*`), a day matches if EITHER field matches; otherwise both must match.
 */

import { toWallMs, wallToInstant } from "./time";

export interface CronFieldSummary {
  name: string;
  raw: string;
  allowed: string;
  /** Human-readable expansion of the field, e.g. "0, 15, 30, 45" or "every minute". */
  meaning: string;
}

type DayPredicate = (year: number, month: number, day: number, weekday: number) => boolean;

export interface CronSchedule {
  source: string;
  /** Expression after macro expansion (what the describer receives). */
  expanded: string;
  hasSeconds: boolean;
  hasYear: boolean;
  seconds: number[];
  minutes: number[];
  hours: number[];
  months: number[];
  years: number[] | null;
  domStar: boolean;
  dowStar: boolean;
  dom: DayPredicate;
  dow: DayPredicate;
  fields: CronFieldSummary[];
}

export type CronParseResult =
  | { ok: true; schedule: CronSchedule }
  | { ok: false; error: string; fieldIndex?: number };

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CRON_MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

interface FieldSpec {
  name: string;
  min: number;
  max: number;
  allowed: string;
  names?: string[];
  /** Offset added to a name's index (months are 1-based). */
  nameOffset?: number;
  unit: string;
}

const SPEC = {
  second: { name: "Second", min: 0, max: 59, allowed: "0-59", unit: "second" },
  minute: { name: "Minute", min: 0, max: 59, allowed: "0-59", unit: "minute" },
  hour: { name: "Hour", min: 0, max: 23, allowed: "0-23", unit: "hour" },
  dom: { name: "Day of month", min: 1, max: 31, allowed: "1-31, L, W", unit: "day" },
  month: { name: "Month", min: 1, max: 12, allowed: "1-12, JAN-DEC", names: MONTH_NAMES, nameOffset: 1, unit: "month" },
  dow: { name: "Day of week", min: 0, max: 7, allowed: "0-7, SUN-SAT, L, #", names: DAY_NAMES, nameOffset: 0, unit: "weekday" },
  year: { name: "Year", min: 1970, max: 2199, allowed: "1970-2199", unit: "year" },
} satisfies Record<string, FieldSpec>;

class CronError extends Error {}

function parseValue(token: string, spec: FieldSpec): number {
  if (/^\d+$/.test(token)) {
    const n = Number(token);
    if (n < spec.min || n > spec.max) throw new CronError(`${spec.name}: ${token} is out of range (${spec.allowed}).`);
    return n;
  }
  if (spec.names) {
    const idx = spec.names.indexOf(token.toUpperCase());
    if (idx !== -1) return idx + (spec.nameOffset ?? 0);
  }
  throw new CronError(`${spec.name}: "${token}" is not a valid value (${spec.allowed}).`);
}

/** Expands a numeric field (no Quartz day tokens) into a sorted list of values. */
function expandNumeric(raw: string, spec: FieldSpec, allowQuestion = false): number[] {
  const values = new Set<number>();
  for (const part of raw.split(",")) {
    if (part === "") throw new CronError(`${spec.name}: empty item in list "${raw}".`);
    const pieces = part.split("/");
    if (pieces.length > 2) throw new CronError(`${spec.name}: "${part}" has more than one "/".`);
    const [rangePart, stepPart] = pieces;
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) < 1) {
        throw new CronError(`${spec.name}: step "/${stepPart}" must be a whole number of 1 or more.`);
      }
      step = Number(stepPart);
    }
    let lo: number;
    let hi: number;
    if (rangePart === "*" || (allowQuestion && rangePart === "?")) {
      lo = spec.min;
      hi = spec.max === 7 ? 6 : spec.max; // `*` in day-of-week is 0-6
    } else if (rangePart.includes("-")) {
      const bounds = rangePart.split("-");
      if (bounds.length !== 2 || !bounds[0] || !bounds[1]) throw new CronError(`${spec.name}: "${rangePart}" is not a valid range.`);
      lo = parseValue(bounds[0], spec);
      hi = parseValue(bounds[1], spec);
      if (lo > hi) throw new CronError(`${spec.name}: range ${rangePart} runs backwards (start must be ≤ end).`);
    } else if (rangePart === "") {
      throw new CronError(`${spec.name}: missing value before "/${stepPart}".`);
    } else {
      lo = parseValue(rangePart, spec);
      hi = stepPart !== undefined ? (spec.max === 7 ? 6 : spec.max) : lo;
    }
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Nearest weekday (Mon-Fri) to `target` within the same month (Quartz `W`). */
function nearestWeekday(year: number, month: number, target: number): number {
  const last = daysInMonth(year, month);
  const day = Math.min(target, last);
  const wd = weekdayOf(year, month, day);
  if (wd === 6) return day === 1 ? 3 : day - 1; // Saturday: Friday before, or Monday the 3rd
  if (wd === 0) return day === last ? day - 2 : day + 1; // Sunday: Monday after, or Friday before
  return day;
}

function listMeaning(values: number[], spec: FieldSpec, full: boolean, labels?: string[]): string {
  if (full) return `every ${spec.unit}`;
  const shown = values.slice(0, 16).map((v) => (labels ? labels[v - (spec.nameOffset ?? 0)] ?? String(v) : String(v)));
  return shown.join(", ") + (values.length > 16 ? ` … (${values.length} values)` : "");
}

function parseDom(raw: string): { predicate: DayPredicate; meaning: string } {
  if (raw === "*" || raw === "?") return { predicate: () => true, meaning: "every day" };
  const plain: number[] = [];
  const specials: { test: DayPredicate; label: string }[] = [];
  for (const part of raw.split(",")) {
    const upper = part.toUpperCase();
    let m: RegExpExecArray | null;
    if (upper === "L") {
      specials.push({ test: (y, mo, d) => d === daysInMonth(y, mo), label: "last day" });
    } else if ((m = /^L-(\d+)$/.exec(upper))) {
      const n = Number(m[1]);
      if (n > 30) throw new CronError(`Day of month: "${part}" offset must be 0-30.`);
      specials.push({ test: (y, mo, d) => d === daysInMonth(y, mo) - n, label: `${n} day${n === 1 ? "" : "s"} before the last` });
    } else if (upper === "LW") {
      specials.push({ test: (y, mo, d) => d === nearestWeekday(y, mo, daysInMonth(y, mo)), label: "last weekday" });
    } else if ((m = /^(\d+)W$/.exec(upper))) {
      const n = Number(m[1]);
      if (n < 1 || n > 31) throw new CronError(`Day of month: "${part}" must be 1W-31W.`);
      specials.push({ test: (y, mo, d) => d === nearestWeekday(y, mo, n), label: `weekday nearest the ${n}` });
    } else {
      plain.push(...expandNumeric(part, SPEC.dom, true));
    }
  }
  const set = new Set(plain);
  const sorted = [...set].sort((a, b) => a - b);
  const parts = [] as string[];
  if (sorted.length) parts.push(listMeaning(sorted, SPEC.dom, sorted.length === 31));
  parts.push(...specials.map((s) => s.label));
  return {
    predicate: (y, mo, d, wd) => set.has(d) || specials.some((s) => s.test(y, mo, d, wd)),
    meaning: parts.join(", "),
  };
}

function parseDow(raw: string): { predicate: DayPredicate; meaning: string } {
  if (raw === "*" || raw === "?") return { predicate: () => true, meaning: "every weekday" };
  const plain: number[] = [];
  const specials: { test: DayPredicate; label: string }[] = [];
  const ordinals = ["", "1st", "2nd", "3rd", "4th", "5th"];
  for (const part of raw.split(",")) {
    let m: RegExpExecArray | null;
    if ((m = /^(\w+)L$/i.exec(part))) {
      const wd = parseValue(m[1], SPEC.dow) % 7;
      specials.push({
        test: (y, mo, d, w) => w === wd && d + 7 > daysInMonth(y, mo),
        label: `last ${DAY_LABELS[wd]}`,
      });
    } else if ((m = /^(\w+)#(\d+)$/.exec(part))) {
      const wd = parseValue(m[1], SPEC.dow) % 7;
      const k = Number(m[2]);
      if (k < 1 || k > 5) throw new CronError(`Day of week: "${part}" occurrence must be #1-#5.`);
      specials.push({ test: (_y, _mo, d, w) => w === wd && Math.ceil(d / 7) === k, label: `${ordinals[k]} ${DAY_LABELS[wd]}` });
    } else {
      plain.push(...expandNumeric(part, SPEC.dow, true).map((v) => v % 7));
    }
  }
  const set = new Set(plain);
  const sorted = [...set].sort((a, b) => a - b);
  const parts = [] as string[];
  if (sorted.length) parts.push(sorted.length === 7 ? "every weekday" : sorted.map((v) => DAY_LABELS[v]).join(", "));
  parts.push(...specials.map((s) => s.label));
  return {
    predicate: (y, mo, d, wd) => set.has(wd) || specials.some((s) => s.test(y, mo, d, wd)),
    meaning: parts.join(", "),
  };
}

/** Parses a cron expression; errors name the offending field. */
export function parseCron(input: string): CronParseResult {
  const source = input.trim();
  if (!source) return { ok: false, error: "Enter a cron expression." };

  let expanded = source.replace(/\s+/g, " ");
  if (expanded.startsWith("@")) {
    const macro = expanded.toLowerCase();
    if (macro === "@reboot") return { ok: false, error: "@reboot runs once when the cron daemon starts; it has no schedule." };
    const mapped = CRON_MACROS[macro];
    if (!mapped) return { ok: false, error: `Unknown macro "${expanded}". Use @yearly, @monthly, @weekly, @daily or @hourly.` };
    expanded = mapped;
  }

  const parts = expanded.split(" ");
  if (parts.length < 5 || parts.length > 7) {
    return {
      ok: false,
      error: `Expected 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}. 6 fields add seconds first; 7 add a year last.`,
    };
  }
  const hasSeconds = parts.length >= 6;
  const hasYear = parts.length === 7;
  const offset = hasSeconds ? 1 : 0;
  const [secRaw, minRaw, hourRaw, domRaw, monRaw, dowRaw, yearRaw] = hasSeconds
    ? [parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]]
    : ["0", parts[0], parts[1], parts[2], parts[3], parts[4], undefined];

  let fieldIndex = 0;
  try {
    fieldIndex = 0;
    const seconds = expandNumeric(secRaw, SPEC.second);
    fieldIndex = offset;
    const minutes = expandNumeric(minRaw, SPEC.minute);
    fieldIndex = offset + 1;
    const hours = expandNumeric(hourRaw, SPEC.hour);
    fieldIndex = offset + 2;
    const dom = parseDom(domRaw);
    fieldIndex = offset + 3;
    const months = expandNumeric(monRaw, SPEC.month);
    fieldIndex = offset + 4;
    const dow = parseDow(dowRaw);
    fieldIndex = offset + 5;
    const years = yearRaw !== undefined && yearRaw !== "*" && yearRaw !== "?" ? expandNumeric(yearRaw, SPEC.year) : null;

    const fields: CronFieldSummary[] = [];
    if (hasSeconds) fields.push({ name: SPEC.second.name, raw: secRaw, allowed: SPEC.second.allowed, meaning: listMeaning(seconds, SPEC.second, seconds.length === 60) });
    fields.push(
      { name: SPEC.minute.name, raw: minRaw, allowed: SPEC.minute.allowed, meaning: listMeaning(minutes, SPEC.minute, minutes.length === 60) },
      { name: SPEC.hour.name, raw: hourRaw, allowed: SPEC.hour.allowed, meaning: listMeaning(hours, SPEC.hour, hours.length === 24) },
      { name: SPEC.dom.name, raw: domRaw, allowed: SPEC.dom.allowed, meaning: dom.meaning },
      { name: SPEC.month.name, raw: monRaw, allowed: SPEC.month.allowed, meaning: listMeaning(months, SPEC.month, months.length === 12, MONTH_LABELS) },
      { name: SPEC.dow.name, raw: dowRaw, allowed: SPEC.dow.allowed, meaning: dow.meaning }
    );
    if (hasYear && yearRaw !== undefined) {
      fields.push({ name: SPEC.year.name, raw: yearRaw, allowed: SPEC.year.allowed, meaning: years ? listMeaning(years, SPEC.year, false) : "every year" });
    }

    return {
      ok: true,
      schedule: {
        source,
        expanded,
        hasSeconds,
        hasYear,
        seconds,
        minutes,
        hours,
        months,
        years,
        domStar: domRaw.startsWith("*") || domRaw === "?",
        dowStar: dowRaw.startsWith("*") || dowRaw === "?",
        dom: dom.predicate,
        dow: dow.predicate,
        fields,
      },
    };
  } catch (err) {
    if (err instanceof CronError) return { ok: false, error: err.message, fieldIndex };
    throw err;
  }
}

function dayMatches(s: CronSchedule, y: number, mo: number, d: number): boolean {
  const wd = weekdayOf(y, mo, d);
  // Vixie: a field starting with "*" (e.g. "*/2") makes the two day fields AND together
  if (s.domStar || s.dowStar) return s.dom(y, mo, d, wd) && s.dow(y, mo, d, wd);
  return s.dom(y, mo, d, wd) || s.dow(y, mo, d, wd);
}

const nextIn = (list: number[], v: number) => list.find((x) => x > v);

/** How far ahead the search looks before giving up (covers leap-day and rare weekday combos). */
const SEARCH_YEARS = 400;

/**
 * Next `count` run instants (epoch ms) strictly after `fromMs`, evaluated on the wall clock
 * of `timeZone`. Wall times skipped by a DST change are not run; repeated ones run once.
 */
export function nextRuns(s: CronSchedule, fromMs: number, count: number, timeZone: string): number[] {
  const unit = s.hasSeconds ? 1000 : 60000;
  const runs: number[] = [];
  const startWall = toWallMs(fromMs, timeZone);
  let wall = Math.floor(startWall / unit) * unit + unit;
  const limitYear = new Date(startWall).getUTCFullYear() + SEARCH_YEARS;
  const monthSet = new Set(s.months);
  const hourSet = new Set(s.hours);
  const minuteSet = new Set(s.minutes);
  const secondSet = new Set(s.seconds);
  const at = (y: number, mo: number, d: number, h: number, mi: number, sec: number) => Date.UTC(y, mo - 1, d, h, mi, sec);

  for (let iter = 0; runs.length < count && iter < 2000000; iter++) {
    const t = new Date(wall);
    const y = t.getUTCFullYear();
    if (y > limitYear) break;
    const mo = t.getUTCMonth() + 1;
    const d = t.getUTCDate();
    const h = t.getUTCHours();
    const mi = t.getUTCMinutes();
    const sec = t.getUTCSeconds();

    if (s.years && !s.years.includes(y)) {
      const ny = nextIn(s.years, y);
      if (ny === undefined) break;
      wall = at(ny, 1, 1, 0, 0, 0);
      continue;
    }
    if (!monthSet.has(mo)) {
      const nm = nextIn(s.months, mo);
      wall = nm === undefined ? at(y + 1, s.months[0], 1, 0, 0, 0) : at(y, nm, 1, 0, 0, 0);
      continue;
    }
    if (!dayMatches(s, y, mo, d)) {
      wall = at(y, mo, d + 1, 0, 0, 0);
      continue;
    }
    if (!hourSet.has(h)) {
      const nh = nextIn(s.hours, h);
      wall = nh === undefined ? at(y, mo, d + 1, 0, 0, 0) : at(y, mo, d, nh, 0, 0);
      continue;
    }
    if (!minuteSet.has(mi)) {
      const nmi = nextIn(s.minutes, mi);
      wall = nmi === undefined ? at(y, mo, d, h + 1, 0, 0) : at(y, mo, d, h, nmi, 0);
      continue;
    }
    if (!secondSet.has(sec)) {
      const ns = nextIn(s.seconds, sec);
      wall = ns === undefined ? at(y, mo, d, h, mi + 1, 0) : at(y, mo, d, h, mi, ns);
      continue;
    }

    const instant = wallToInstant(wall, timeZone);
    if (instant !== null && instant > fromMs && (runs.length === 0 || instant > runs[runs.length - 1])) {
      runs.push(instant);
    }
    wall += unit;
  }
  return runs;
}
