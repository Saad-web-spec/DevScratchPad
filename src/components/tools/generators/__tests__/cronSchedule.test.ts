import { describe, expect, it } from "vitest";
import { nextRuns, parseCron, type CronSchedule } from "../cronSchedule";

function schedule(expr: string): CronSchedule {
  const r = parseCron(expr);
  if (!r.ok) throw new Error(r.error);
  return r.schedule;
}

const iso = (ms: number[]) => ms.map((m) => new Date(m).toISOString());
const at = (s: string) => Date.parse(s);

describe("parseCron", () => {
  it("rejects bad field counts, ranges and steps with field-specific errors", () => {
    const fieldCount = parseCron("* * *");
    expect(fieldCount.ok).toBe(false);
    expect(!fieldCount.ok && fieldCount.error).toMatch(/Expected 5 fields/);
    const minute = parseCron("60 * * * *");
    expect(!minute.ok && minute.error).toMatch(/Minute: 60 is out of range/);
    expect(!parseCron("5-1 * * * *").ok).toBe(true);
    expect(!parseCron("*/0 * * * *").ok).toBe(true);
    expect(!parseCron("* * * 13 *").ok).toBe(true);
    expect(!parseCron("* * * * 8").ok).toBe(true);
    expect(!parseCron("1,,2 * * * *").ok).toBe(true);
    expect(!parseCron("@reboot").ok).toBe(true);
  });

  it("expands steps, ranges, lists and names", () => {
    expect(schedule("5/20 * * * *").minutes).toEqual([5, 25, 45]);
    expect(schedule("*/15 9-17 * * 1-5").minutes).toEqual([0, 15, 30, 45]);
    expect(schedule("0 9-17/4 * * *").hours).toEqual([9, 13, 17]);
    expect(schedule("0 9 * JAN,jul *").months).toEqual([1, 7]);
    expect(schedule("@daily").expanded).toBe("0 0 * * *");
  });
});

describe("nextRuns (UTC)", () => {
  it("handles step + range + weekday range", () => {
    // 2026-10-11 is a Sunday
    const runs = nextRuns(schedule("*/15 9-17 * * 1-5"), at("2026-10-11T04:44:47Z"), 3, "UTC");
    expect(iso(runs)).toEqual(["2026-10-12T09:00:00.000Z", "2026-10-12T09:15:00.000Z", "2026-10-12T09:30:00.000Z"]);
  });

  it("is strictly after the start instant", () => {
    const runs = nextRuns(schedule("0 * * * *"), at("2026-01-01T10:00:00Z"), 2, "UTC");
    expect(iso(runs)).toEqual(["2026-01-01T11:00:00.000Z", "2026-01-01T12:00:00.000Z"]);
  });

  it("rolls over months and finds leap days", () => {
    expect(iso(nextRuns(schedule("0 0 1 * *"), at("2026-01-31T12:00:00Z"), 2, "UTC"))).toEqual([
      "2026-02-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z",
    ]);
    expect(iso(nextRuns(schedule("0 0 29 2 *"), at("2026-03-01T00:00:00Z"), 1, "UTC"))).toEqual(["2028-02-29T00:00:00.000Z"]);
  });

  it("returns nothing for impossible dates", () => {
    expect(nextRuns(schedule("0 0 30 2 *"), at("2026-01-01T00:00:00Z"), 3, "UTC")).toEqual([]);
  });

  it("ORs day-of-month and day-of-week when both are restricted (Vixie)", () => {
    // June 2026: the 1st is a Monday; next Mondays 8, 15; 1st of July is a Wednesday
    const runs = nextRuns(schedule("0 12 1 * 1"), at("2026-06-01T13:00:00Z"), 5, "UTC");
    expect(iso(runs)).toEqual([
      "2026-06-08T12:00:00.000Z",
      "2026-06-15T12:00:00.000Z",
      "2026-06-22T12:00:00.000Z",
      "2026-06-29T12:00:00.000Z",
      "2026-07-01T12:00:00.000Z",
    ]);
  });

  it("ANDs the day fields when one starts with *", () => {
    // Odd days that are Mondays
    const runs = nextRuns(schedule("0 0 */2 * 1"), at("2026-10-01T00:00:00Z"), 3, "UTC");
    for (const ms of runs) {
      const d = new Date(ms);
      expect(d.getUTCDay()).toBe(1);
      expect(d.getUTCDate() % 2).toBe(1);
    }
    expect(runs).toHaveLength(3);
  });

  it("treats 7 as Sunday and supports wrapping weekday ranges ending at 7", () => {
    expect(iso(nextRuns(schedule("0 0 * * 7"), at("2026-10-12T00:00:00Z"), 1, "UTC"))).toEqual(["2026-10-18T00:00:00.000Z"]);
    const days = nextRuns(schedule("0 0 * * 5-7"), at("2026-10-12T00:00:00Z"), 3, "UTC").map((m) => new Date(m).getUTCDay());
    expect(days).toEqual([5, 6, 0]);
  });

  it("supports L, nL, n#k and W", () => {
    expect(iso(nextRuns(schedule("0 0 L * *"), at("2026-02-10T00:00:00Z"), 2, "UTC"))).toEqual([
      "2026-02-28T00:00:00.000Z",
      "2026-03-31T00:00:00.000Z",
    ]);
    // Last Friday of October 2026 is the 30th
    expect(iso(nextRuns(schedule("0 0 * * 5L"), at("2026-10-01T00:00:00Z"), 1, "UTC"))).toEqual(["2026-10-30T00:00:00.000Z"]);
    // Second Monday of October 2026 is the 12th
    expect(iso(nextRuns(schedule("0 0 * * 1#2"), at("2026-10-01T00:00:00Z"), 1, "UTC"))).toEqual(["2026-10-12T00:00:00.000Z"]);
    // 2026-08-15 is a Saturday, so 15W fires on Friday the 14th
    expect(iso(nextRuns(schedule("0 0 15W * *"), at("2026-08-01T00:00:00Z"), 1, "UTC"))).toEqual(["2026-08-14T00:00:00.000Z"]);
  });

  it("supports a leading seconds field", () => {
    expect(iso(nextRuns(schedule("*/10 * * * * *"), at("2026-01-01T12:00:05Z"), 2, "UTC"))).toEqual([
      "2026-01-01T12:00:10.000Z",
      "2026-01-01T12:00:20.000Z",
    ]);
  });
});

describe("nextRuns (time zones)", () => {
  it("evaluates on the zone's wall clock across a DST change", () => {
    // US DST starts 2026-03-08: 09:00 EST is 14:00Z, 09:00 EDT is 13:00Z
    const runs = nextRuns(schedule("0 9 * * *"), at("2026-03-07T00:00:00Z"), 2, "America/New_York");
    expect(iso(runs)).toEqual(["2026-03-07T14:00:00.000Z", "2026-03-08T13:00:00.000Z"]);
  });

  it("skips wall times that do not exist in a spring-forward gap", () => {
    const runs = nextRuns(schedule("30 2 * * *"), at("2026-03-07T12:00:00Z"), 2, "America/New_York");
    // 2026-03-08 02:30 does not exist; next is 2026-03-09 02:30 EDT (06:30Z)
    expect(iso(runs)).toEqual(["2026-03-09T06:30:00.000Z", "2026-03-10T06:30:00.000Z"]);
  });

  it("uses fixed offsets for zones without DST", () => {
    const runs = nextRuns(schedule("0 9 * * *"), at("2026-10-11T00:00:00Z"), 1, "Asia/Karachi");
    expect(iso(runs)).toEqual(["2026-10-11T04:00:00.000Z"]);
  });
});
