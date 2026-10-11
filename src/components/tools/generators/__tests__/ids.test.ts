import { describe, expect, it } from "vitest";
import { MAX_IDS, generateIds, inspectId, serializeIds, styleId } from "../ids";

describe("generateIds", () => {
  it("creates RFC 9562 v4 and v7 UUIDs", () => {
    for (const id of generateIds("uuid-v4", 50)) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    for (const id of generateIds("uuid-v7", 50)) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("keeps v7 and ULID batches sorted inside one millisecond", () => {
    // Monotonic state never steps backwards, so use instants after the real clock
    const base = Date.now() + 1e9;
    const now = () => base;
    const v7 = generateIds("uuid-v7", 2000, { now });
    expect([...v7].sort()).toEqual(v7);
    expect(new Set(v7).size).toBe(v7.length);
    const ulids = generateIds("ulid", 2000, { now: () => base + 1 });
    expect([...ulids].sort()).toEqual(ulids);
    expect(new Set(ulids).size).toBe(ulids.length);
  });

  it("embeds the timestamp in v7 and ULID", () => {
    const ms = Date.now() + 2e9;
    const v7 = inspectId(generateIds("uuid-v7", 1, { now: () => ms + 10 })[0]);
    expect(v7 && "timestamp" in v7 && v7.timestamp?.getTime()).toBe(ms + 10);
    const ulid = inspectId(generateIds("ulid", 1, { now: () => ms + 20 })[0]);
    expect(ulid && "timestamp" in ulid && ulid.timestamp?.getTime()).toBe(ms + 20);
  });

  it("creates NanoIDs from the 64-char URL-safe alphabet", () => {
    const ids = generateIds("nanoid", 200, { nanoidSize: 12 });
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });

  it("clamps the count and stays unique in bulk", () => {
    const ids = generateIds("uuid-v4", MAX_IDS + 500);
    expect(ids).toHaveLength(MAX_IDS);
    expect(new Set(ids).size).toBe(MAX_IDS);
    expect(generateIds("ulid", 0)).toHaveLength(1);
  });
});

describe("formatting and inspection", () => {
  it("styles and serializes", () => {
    const id = "0190b5e4-1c2d-7abc-8def-0123456789ab";
    expect(styleId(id, "uuid-v7", { uppercase: true, hyphens: false })).toBe("0190B5E41C2D7ABC8DEF0123456789AB");
    expect(styleId("01J9ZQ3X4Y5Z6A7B8C9D0E1F2G", "ulid", { lowercase: true })).toBe("01j9zq3x4y5z6a7b8c9d0e1f2g");
    expect(serializeIds(["a", "b"], "json")).toBe('[\n  "a",\n  "b"\n]');
    expect(serializeIds(["a", "b"], "csv")).toBe("a,b");
  });

  it("decodes UUID versions including v1", () => {
    const v1 = inspectId("c232ab00-9414-11ec-b3c8-9e6bdeced846");
    expect(v1 && "version" in v1 && v1.version).toBe(1);
    expect(v1 && "timestamp" in v1 && v1.timestamp?.toISOString()).toBe("2022-02-22T19:22:22.000Z");
    const v4 = inspectId("{F47AC10B-58CC-4372-A567-0E02B2C3D479}");
    expect(v4 && "normalized" in v4 && v4.normalized).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(inspectId("not an id!")).toEqual({ error: "Not a UUID, ULID or NanoID." });
  });
});
