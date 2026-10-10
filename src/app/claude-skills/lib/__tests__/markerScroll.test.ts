import { describe, expect, it } from "vitest";
import { computeFollowScrollTop, findFirstChangedLine } from "../markerScroll";

describe("findFirstChangedLine", () => {
  it("returns null for identical content", () => {
    expect(findFirstChangedLine("a\nb", "a\nb")).toBeNull();
  });

  it("finds an edited middle line", () => {
    expect(findFirstChangedLine("a\nb\nc", "a\nbX\nc")).toBe(2);
  });

  it("maps an appended line to the new line", () => {
    expect(findFirstChangedLine("a\nb", "a\nb\nc")).toBe(3);
  });

  it("maps a removed trailing line to the new last line", () => {
    expect(findFirstChangedLine("a\nb\nc", "a\nb")).toBe(2);
  });
});

describe("computeFollowScrollTop", () => {
  const view = { scrollTop: 0, height: 400 };

  it("does not scroll when the marked range is already visible", () => {
    expect(computeFollowScrollTop(view, { top: 100, bottom: 200 }, null)).toBeNull();
  });

  it("centers a range that fits but is below the viewport", () => {
    expect(computeFollowScrollTop(view, { top: 1000, bottom: 1100 }, null)).toBe(850);
  });

  it("pins a range taller than the viewport near its start", () => {
    expect(computeFollowScrollTop(view, { top: 1000, bottom: 2000 }, null)).toBe(976);
  });

  it("leaves the view alone when it already sits inside a tall range", () => {
    expect(computeFollowScrollTop({ scrollTop: 1200, height: 400 }, { top: 1000, bottom: 2000 }, null)).toBeNull();
  });

  it("follows the changed line once it leaves the viewport", () => {
    expect(computeFollowScrollTop(view, { top: 0, bottom: 2000 }, { top: 900, bottom: 920 })).toBe(710);
  });

  it("does not scroll while the changed line stays visible", () => {
    expect(computeFollowScrollTop(view, { top: 0, bottom: 2000 }, { top: 200, bottom: 220 })).toBeNull();
  });

  it("never returns a negative scroll position", () => {
    expect(computeFollowScrollTop({ scrollTop: 500, height: 400 }, { top: 0, bottom: 20 }, null)).toBe(0);
  });
});
