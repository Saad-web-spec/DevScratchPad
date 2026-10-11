import { describe, expect, it } from "vitest";
import { calendarInfo, formatIsoInZone, formatRfc2822, parseTimestampInput, wallToInstant } from "../time";

function ok(raw: string, unit: Parameters<typeof parseTimestampInput>[1] = "auto", tz = "UTC") {
  const r = parseTimestampInput(raw, unit, tz);
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe("parseTimestampInput", () => {
  it("auto-detects seconds, ms, µs and ns", () => {
    expect(ok("1700000000").unit).toBe("s");
    expect(ok("1700000000").ms).toBe(1700000000000);
    expect(ok("1700000000123").unit).toBe("ms");
    expect(ok("1700000000123456").unit).toBe("us");
    const ns = ok("1700000000123456789");
    expect(ns.unit).toBe("ns");
    expect(ns.ms).toBe(1700000000123);
    expect(ns.exact.ns).toBe("1700000000123456789");
    expect(ns.exact.s).toBe("1700000000");
  });

  it("honours an explicit unit, decimals and negative epochs", () => {
    expect(ok("1700000000", "ms").ms).toBe(1700000000);
    expect(ok("1.5").ms).toBe(1500);
    expect(new Date(ok("-1").ms).toISOString()).toBe("1969-12-31T23:59:59.000Z");
    expect(ok("-1").exact.s).toBe("-1");
    expect(ok("-1500", "ms").exact.s).toBe("-2");
  });

  it("rejects values outside the Date range", () => {
    expect(parseTimestampInput("9".repeat(25), "auto", "UTC").ok).toBe(false);
    expect(parseTimestampInput("99999999999999", "s", "UTC").ok).toBe(false);
  });

  it("reads naive dates in the selected zone and absolute dates as-is", () => {
    expect(new Date(ok("2026-10-11 09:30", "auto", "Asia/Karachi").ms).toISOString()).toBe("2026-10-11T04:30:00.000Z");
    expect(new Date(ok("2026-10-11", "auto", "Asia/Kolkata").ms).toISOString()).toBe("2026-10-10T18:30:00.000Z");
    expect(new Date(ok("2026-01-01T00:00:00Z", "auto", "Asia/Tokyo").ms).toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(new Date(ok("2026-01-01T09:00:00+09:00").ms).toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(new Date(ok("Sat, 10 Oct 2026 23:44:47 GMT").ms).toISOString()).toBe("2026-10-10T23:44:47.000Z");
  });

  it("rejects impossible and DST-skipped wall times", () => {
    expect(parseTimestampInput("2026-02-30", "auto", "UTC").ok).toBe(false);
    expect(parseTimestampInput("2026-03-08 02:30", "auto", "America/New_York").ok).toBe(false);
    expect(parseTimestampInput("hello", "auto", "UTC").ok).toBe(false);
  });
});

describe("formatting", () => {
  it("formats ISO 8601 and RFC 2822 with zone offsets", () => {
    expect(formatIsoInZone(0, "UTC")).toBe("1970-01-01T00:00:00.000Z");
    expect(formatIsoInZone(0, "Asia/Kolkata")).toBe("1970-01-01T05:30:00.000+05:30");
    expect(formatIsoInZone(Date.UTC(2026, 0, 15, 12), "America/New_York")).toBe("2026-01-15T07:00:00.000-05:00");
    expect(formatRfc2822(Date.UTC(2026, 9, 10, 23, 44, 47), "Asia/Karachi")).toBe("Sun, 11 Oct 2026 04:44:47 +0500");
  });

  it("returns the earlier instant in a fall-back overlap", () => {
    // 2026-11-01 01:30 happens twice in New York; the first is EDT (05:30Z)
    expect(new Date(wallToInstant(Date.UTC(2026, 10, 1, 1, 30), "America/New_York") as number).toISOString()).toBe(
      "2026-11-01T05:30:00.000Z"
    );
  });

  it("computes day of year and ISO week", () => {
    expect(calendarInfo(Date.UTC(2021, 0, 1), "UTC")).toEqual({ dayOfYear: 1, isoWeek: 53, isoWeekYear: 2020 });
    expect(calendarInfo(Date.UTC(2026, 11, 31), "UTC")).toEqual({ dayOfYear: 365, isoWeek: 53, isoWeekYear: 2026 });
  });
});
