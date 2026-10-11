import { describe, expect, it } from "vitest";
import { SCHEMA_PRESETS, generateRows, loadFaker, parseSchema, serializeRows } from "../mockData";

describe("mock data", () => {
  it("keeps native types for single-token templates and resolves nested values", async () => {
    const faker = await loadFaker("en");
    const parsed = parseSchema(
      JSON.stringify({
        n: "{{number.int({\"min\":1,\"max\":3})}}",
        b: "{{datatype.boolean}}",
        when: "{{date.past}}",
        mixed: "{{person.firstName}} {{person.lastName}}",
        nested: { tags: ["{{word.noun}}", 7], fixed: "plain" },
      })
    );
    if (!parsed.ok) throw new Error(parsed.error);
    const rows = await generateRows(parsed.schema, 20, faker, { chunk: 5 });
    expect(rows).toHaveLength(20);
    for (const row of rows ?? []) {
      expect(typeof row.n).toBe("number");
      expect(row.n as number).toBeGreaterThanOrEqual(1);
      expect(row.n as number).toBeLessThanOrEqual(3);
      expect(typeof row.b).toBe("boolean");
      expect(row.when as string).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(row.mixed as string).toMatch(/\S+ \S+/);
      const nested = row.nested as { tags: unknown[]; fixed: string };
      expect(typeof nested.tags[0]).toBe("string");
      expect(nested.tags[1]).toBe(7);
      expect(nested.fixed).toBe("plain");
    }
  });

  it("reports the field path for unknown faker methods", async () => {
    const faker = await loadFaker("en");
    const parsed = parseSchema('{"a": {"b": "{{nope.method}}"}}');
    if (!parsed.ok) throw new Error(parsed.error);
    await expect(generateRows(parsed.schema, 1, faker)).rejects.toThrow(/a\.b/);
  });

  it("generates every bundled preset", async () => {
    const faker = await loadFaker("en");
    for (const preset of SCHEMA_PRESETS) {
      const parsed = parseSchema(preset.schema);
      if (!parsed.ok) throw new Error(`${preset.id}: ${parsed.error}`);
      const rows = await generateRows(parsed.schema, 3, faker);
      expect(rows).toHaveLength(3);
    }
  });

  it("rejects non-object schemas", () => {
    expect(parseSchema("[1,2]").ok).toBe(false);
    expect(parseSchema("{").ok).toBe(false);
    expect(parseSchema("  ").ok).toBe(false);
  });

  it("serializes CSV and SQL safely", () => {
    const rows = [{ name: "O'Brien, Pat", n: 3, ok: true, meta: { a: 1 }, none: null }];
    const keys = ["name", "n", "ok", "meta", "none"];
    expect(serializeRows(rows, "csv", keys)).toBe('name,n,ok,meta,none\n"O\'Brien, Pat",3,true,"{""a"":1}",');
    expect(serializeRows(rows, "sql", keys, "my table")).toBe(
      `INSERT INTO "my table" (name, n, ok, meta, none) VALUES ('O''Brien, Pat', 3, TRUE, '{"a":1}', NULL);`
    );
    expect(serializeRows(rows, "ndjson", keys)).toBe('{"name":"O\'Brien, Pat","n":3,"ok":true,"meta":{"a":1},"none":null}');
  });
});
