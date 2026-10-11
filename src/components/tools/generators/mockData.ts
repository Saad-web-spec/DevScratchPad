/**
 * Mock data engine for the Mock Data Generator tool.
 *
 * Schema values are JSON. Strings containing `{{module.method}}` are resolved with faker;
 * a value that is exactly one token (e.g. "{{number.int}}") keeps the method's native type,
 * so numbers and booleans come out as JSON numbers / booleans instead of strings.
 * Nested objects and arrays are resolved recursively.
 *
 * Faker locales are lazy-loaded one at a time (`@faker-js/faker/locale/<id>`); the package
 * root would pull every locale into one chunk.
 */

import type { Faker } from "@faker-js/faker";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type MockFormat = "json" | "ndjson" | "csv" | "sql";

export const MAX_ROWS = 10000;
/** Rows rendered in the output editor; Copy / Download always use every row. */
export const PREVIEW_ROWS = 500;

export const MOCK_FORMATS: { id: MockFormat; label: string; ext: string; language: string; mime: string }[] = [
  { id: "json", label: "JSON", ext: "json", language: "json", mime: "application/json" },
  { id: "ndjson", label: "JSON Lines", ext: "ndjson", language: "json", mime: "application/x-ndjson" },
  { id: "csv", label: "CSV", ext: "csv", language: "plaintext", mime: "text/csv" },
  { id: "sql", label: "SQL INSERT", ext: "sql", language: "sql", mime: "application/sql" },
];

export function formatMeta(format: string) {
  return MOCK_FORMATS.find((f) => f.id === format) ?? MOCK_FORMATS[0];
}

type LocaleModule = { faker: Faker };

export const FAKER_LOCALES: { id: string; label: string; load: () => Promise<LocaleModule> }[] = [
  { id: "en", label: "English (US)", load: () => import("@faker-js/faker/locale/en") },
  { id: "en_GB", label: "English (UK)", load: () => import("@faker-js/faker/locale/en_GB") },
  { id: "en_IN", label: "English (India)", load: () => import("@faker-js/faker/locale/en_IN") },
  { id: "de", label: "German", load: () => import("@faker-js/faker/locale/de") },
  { id: "fr", label: "French", load: () => import("@faker-js/faker/locale/fr") },
  { id: "es", label: "Spanish", load: () => import("@faker-js/faker/locale/es") },
  { id: "it", label: "Italian", load: () => import("@faker-js/faker/locale/it") },
  { id: "pt_BR", label: "Portuguese (Brazil)", load: () => import("@faker-js/faker/locale/pt_BR") },
  { id: "nl", label: "Dutch", load: () => import("@faker-js/faker/locale/nl") },
  { id: "pl", label: "Polish", load: () => import("@faker-js/faker/locale/pl") },
  { id: "tr", label: "Turkish", load: () => import("@faker-js/faker/locale/tr") },
  { id: "ur", label: "Urdu", load: () => import("@faker-js/faker/locale/ur") },
  { id: "ja", label: "Japanese", load: () => import("@faker-js/faker/locale/ja") },
  { id: "ko", label: "Korean", load: () => import("@faker-js/faker/locale/ko") },
  { id: "zh_CN", label: "Chinese (Simplified)", load: () => import("@faker-js/faker/locale/zh_CN") },
];

const localeCache = new Map<string, Promise<Faker>>();

export function loadFaker(localeId: string): Promise<Faker> {
  const entry = FAKER_LOCALES.find((l) => l.id === localeId) ?? FAKER_LOCALES[0];
  let pending = localeCache.get(entry.id);
  if (!pending) {
    pending = entry.load().then((mod) => mod.faker);
    // A failed chunk load should be retryable
    pending.catch(() => localeCache.delete(entry.id));
    localeCache.set(entry.id, pending);
  }
  return pending;
}

export const SCHEMA_PRESETS: { id: string; label: string; table: string; schema: string }[] = [
  {
    id: "users",
    label: "Users",
    table: "users",
    schema: `{
  "id": "{{string.uuid}}",
  "firstName": "{{person.firstName}}",
  "lastName": "{{person.lastName}}",
  "email": "{{internet.email}}",
  "avatar": "{{image.avatar}}",
  "company": "{{company.name}}",
  "registeredAt": "{{date.past}}"
}`,
  },
  {
    id: "products",
    label: "Products",
    table: "products",
    schema: `{
  "id": "{{string.uuid}}",
  "sku": "{{string.alphanumeric({\\"length\\":10,\\"casing\\":\\"upper\\"})}}",
  "name": "{{commerce.productName}}",
  "department": "{{commerce.department}}",
  "price": "{{number.float({\\"min\\":5,\\"max\\":500,\\"fractionDigits\\":2})}}",
  "inStock": "{{datatype.boolean}}",
  "createdAt": "{{date.past}}"
}`,
  },
  {
    id: "orders",
    label: "Orders",
    table: "orders",
    schema: `{
  "orderId": "{{string.uuid}}",
  "customer": "{{person.fullName}}",
  "email": "{{internet.email}}",
  "items": "{{number.int({\\"min\\":1,\\"max\\":8})}}",
  "total": "{{number.float({\\"min\\":10,\\"max\\":2000,\\"fractionDigits\\":2})}}",
  "status": "{{helpers.arrayElement([\\"pending\\",\\"paid\\",\\"shipped\\",\\"refunded\\"])}}",
  "placedAt": "{{date.recent}}"
}`,
  },
  {
    id: "addresses",
    label: "Addresses",
    table: "addresses",
    schema: `{
  "street": "{{location.streetAddress}}",
  "city": "{{location.city}}",
  "state": "{{location.state}}",
  "zip": "{{location.zipCode}}",
  "country": "{{location.countryCode}}",
  "lat": "{{location.latitude}}",
  "lng": "{{location.longitude}}"
}`,
  },
  {
    id: "nested",
    label: "Nested profile",
    table: "profiles",
    schema: `{
  "id": "{{number.int({\\"min\\":1000,\\"max\\":9999})}}",
  "username": "{{internet.username}}",
  "contact": {
    "email": "{{internet.email}}",
    "phone": "{{phone.number}}"
  },
  "job": "{{person.jobTitle}} at {{company.name}}",
  "tags": ["{{word.noun}}", "{{word.noun}}"],
  "active": "{{datatype.boolean}}"
}`,
  },
];

export const DEFAULT_SCHEMA = SCHEMA_PRESETS[0].schema;

const SINGLE_TOKEN = /^\{\{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\s*(?:\(([\s\S]*)\))?\s*\}\}$/;
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function toJson(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "bigint") return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [k, v] of Object.entries(value)) out[k] = toJson(v);
    return out;
  }
  return String(value);
}

/** Calls `faker.module.method(args)` directly so the native return type survives. */
function callTyped(faker: Faker, path: string, argsText: string | undefined): { ok: true; value: unknown } | { ok: false } {
  const parts = path.split(".");
  if (parts.some((p) => FORBIDDEN_KEYS.has(p))) return { ok: false };
  let owner: unknown = faker;
  let target: unknown = faker;
  for (const part of parts) {
    if (target === null || (typeof target !== "object" && typeof target !== "function")) return { ok: false };
    owner = target;
    target = (target as Record<string, unknown>)[part];
  }
  if (typeof target !== "function") return { ok: false };
  let args: unknown[] = [];
  if (argsText !== undefined && argsText.trim() !== "") {
    try {
      const parsed: unknown = JSON.parse(`[${argsText}]`);
      args = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      args = [argsText];
    }
  }
  return { ok: true, value: (target as (...a: unknown[]) => unknown).apply(owner, args) };
}

function resolveValue(value: JsonValue, faker: Faker, path: string): JsonValue {
  if (typeof value === "string") {
    if (!value.includes("{{")) return value;
    const single = SINGLE_TOKEN.exec(value);
    if (single) {
      try {
        const typed = callTyped(faker, single[1], single[2]);
        if (typed.ok) return toJson(typed.value);
      } catch {
        // Fall back to faker's own template parser for a precise error message
      }
    }
    try {
      return faker.helpers.fake(value);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`${path || "value"}: ${message}`);
    }
  }
  if (Array.isArray(value)) return value.map((v, i) => resolveValue(v, faker, `${path}[${i}]`));
  if (value && typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, faker, path ? `${path}.${k}` : k);
    return out;
  }
  return value;
}

/** Parses the schema text; the template must be a JSON object. */
export function parseSchema(text: string): { ok: true; schema: { [key: string]: JsonValue } } | { ok: false; error: string } {
  if (!text.trim()) return { ok: false, error: "The schema is empty. Pick a sample or write a JSON object of faker templates." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, error: `Schema is not valid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "The schema must be a JSON object, e.g. { \"name\": \"{{person.fullName}}\" }." };
  }
  return { ok: true, schema: parsed as { [key: string]: JsonValue } };
}

const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Generates rows in chunks, yielding to the browser between chunks so typing and
 * scrolling stay responsive. Returns null when `isStale()` reports a newer run.
 */
export async function generateRows(
  schema: { [key: string]: JsonValue },
  count: number,
  faker: Faker,
  options: { chunk?: number; onProgress?: (done: number) => void; isStale?: () => boolean } = {}
): Promise<{ [key: string]: JsonValue }[] | null> {
  const chunk = options.chunk ?? 250;
  const rows: { [key: string]: JsonValue }[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(resolveValue(schema, faker, "") as { [key: string]: JsonValue });
    if ((i + 1) % chunk === 0 && i + 1 < count) {
      options.onProgress?.(i + 1);
      await yieldToMain();
      if (options.isStale?.()) return null;
    }
  }
  return rows;
}

const SIMPLE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function sqlIdentifier(name: string): string {
  return SIMPLE_IDENT.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

function sqlValue(v: JsonValue | undefined): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  const text = typeof v === "string" ? v : JSON.stringify(v);
  return `'${text.replace(/'/g, "''")}'`;
}

function csvCell(v: JsonValue | undefined): string {
  if (v === null || v === undefined) return "";
  const text = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Column order: schema keys first, then any extra keys rows may carry. */
function columnsOf(rows: { [key: string]: JsonValue }[], schemaKeys: string[]): string[] {
  const cols = [...schemaKeys];
  const seen = new Set(cols);
  for (const row of rows.slice(0, 50)) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
    }
  }
  return cols;
}

export function serializeRows(
  rows: { [key: string]: JsonValue }[],
  format: MockFormat,
  schemaKeys: string[],
  tableName = "mock_data"
): string {
  switch (format) {
    case "ndjson":
      return rows.map((r) => JSON.stringify(r)).join("\n");
    case "csv": {
      const cols = columnsOf(rows, schemaKeys);
      const lines = [cols.map((c) => csvCell(c)).join(",")];
      for (const row of rows) lines.push(cols.map((c) => csvCell(row[c])).join(","));
      return lines.join("\n");
    }
    case "sql": {
      const cols = columnsOf(rows, schemaKeys);
      const table = sqlIdentifier(tableName.trim() || "mock_data");
      const colList = cols.map(sqlIdentifier).join(", ");
      return rows.map((row) => `INSERT INTO ${table} (${colList}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`).join("\n");
    }
    case "json":
    default:
      return JSON.stringify(rows, null, 2);
  }
}
