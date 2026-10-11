/**
 * Identifier generation for the UUID / ULID tool.
 *
 * Every random bit comes from `crypto.getRandomValues` (the old helpers used `Math.random`
 * for v7, ULID and NanoID). UUID v7 and ULID are monotonic: ids created in the same
 * millisecond increment the random part, so a bulk batch stays sortable.
 */

export type IdType = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid";
export type IdFormat = "lines" | "json" | "csv";

export const MAX_IDS = 10000;
export const NANOID_DEFAULT_SIZE = 21;
export const NANOID_MIN_SIZE = 4;
export const NANOID_MAX_SIZE = 64;

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** NanoID's URL-safe alphabet: exactly 64 symbols, so `byte & 63` is unbiased. */
const NANOID_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

const B0 = BigInt(0);
const B1 = BigInt(1);
const B5 = BigInt(5);
const B8 = BigInt(8);
const B31 = BigInt(31);
const RAND74_MAX = (B1 << BigInt(74)) - B1;
const RAND80_MAX = (B1 << BigInt(80)) - B1;
const MASK62 = (B1 << BigInt(62)) - B1;

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  // getRandomValues is limited to 65,536 bytes per call
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  return out;
}

function randomBigInt(bits: number): bigint {
  const bytes = randomBytes(Math.ceil(bits / 8));
  let v = B0;
  for (const b of bytes) v = (v << B8) | BigInt(b);
  return v & ((B1 << BigInt(bits)) - B1);
}

const HEX: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

function bytesToUuid(b: Uint8Array, o = 0): string {
  return (
    HEX[b[o]] + HEX[b[o + 1]] + HEX[b[o + 2]] + HEX[b[o + 3]] + "-" +
    HEX[b[o + 4]] + HEX[b[o + 5]] + "-" +
    HEX[b[o + 6]] + HEX[b[o + 7]] + "-" +
    HEX[b[o + 8]] + HEX[b[o + 9]] + "-" +
    HEX[b[o + 10]] + HEX[b[o + 11]] + HEX[b[o + 12]] + HEX[b[o + 13]] + HEX[b[o + 14]] + HEX[b[o + 15]]
  );
}

function generateUuidV4Batch(count: number): string[] {
  const ids: string[] = new Array(count);
  if (typeof crypto.randomUUID === "function") {
    for (let i = 0; i < count; i++) ids[i] = crypto.randomUUID();
    return ids;
  }
  const bytes = randomBytes(count * 16);
  for (let i = 0; i < count; i++) {
    const o = i * 16;
    bytes[o + 6] = (bytes[o + 6] & 0x0f) | 0x40;
    bytes[o + 8] = (bytes[o + 8] & 0x3f) | 0x80;
    ids[i] = bytesToUuid(bytes, o);
  }
  return ids;
}

/** Monotonic clock + random state shared by successive v7 / ULID batches. */
interface MonotonicState {
  ms: number;
  rand: bigint;
}
const v7State: MonotonicState = { ms: -1, rand: B0 };
const ulidState: MonotonicState = { ms: -1, rand: B0 };

/** Next (ms, random) pair: a fresh random value per new millisecond, +1 inside the same one. */
function nextMonotonic(state: MonotonicState, bits: number, max: bigint, now: number): void {
  if (now > state.ms) {
    state.ms = now;
    state.rand = randomBigInt(bits);
    return;
  }
  // Same (or a backwards-stepping) clock: keep ordering by incrementing
  if (state.rand >= max) {
    state.ms += 1;
    state.rand = randomBigInt(bits);
  } else {
    state.rand += B1;
  }
}

/** RFC 9562 UUID v7: 48-bit Unix ms, version 7, 74 random bits (monotonic within a ms). */
function generateUuidV7Batch(count: number, now: () => number): string[] {
  const ids: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    nextMonotonic(v7State, 74, RAND74_MAX, now());
    const randA = v7State.rand >> BigInt(62);
    const randB = v7State.rand & MASK62;
    const value =
      (BigInt(v7State.ms) << BigInt(80)) |
      (BigInt(7) << BigInt(76)) |
      (randA << BigInt(64)) |
      (BigInt(2) << BigInt(62)) |
      randB;
    const hex = value.toString(16).padStart(32, "0");
    ids[i] = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return ids;
}

function encodeCrockford(value: bigint, length: number): string {
  let out = "";
  let v = value;
  for (let i = 0; i < length; i++) {
    out = CROCKFORD[Number(v & B31)] + out;
    v >>= B5;
  }
  return out;
}

/** ULID: 10 chars of 48-bit ms time + 16 chars of 80-bit randomness, Crockford Base32 (monotonic). */
function generateUlidBatch(count: number, now: () => number): string[] {
  const ids: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    nextMonotonic(ulidState, 80, RAND80_MAX, now());
    ids[i] = encodeCrockford(BigInt(ulidState.ms), 10) + encodeCrockford(ulidState.rand, 16);
  }
  return ids;
}

function generateNanoIdBatch(count: number, size: number): string[] {
  const bytes = randomBytes(count * size);
  const ids: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    let id = "";
    const o = i * size;
    for (let j = 0; j < size; j++) id += NANOID_ALPHABET[bytes[o + j] & 63];
    ids[i] = id;
  }
  return ids;
}

export function clampCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(Math.floor(count), 1), MAX_IDS);
}

export function clampNanoSize(size: number): number {
  if (!Number.isFinite(size)) return NANOID_DEFAULT_SIZE;
  return Math.min(Math.max(Math.floor(size), NANOID_MIN_SIZE), NANOID_MAX_SIZE);
}

/** Generates `count` ids in canonical form (lowercase UUIDs, uppercase ULIDs). */
export function generateIds(
  type: IdType,
  count: number,
  options: { nanoidSize?: number; now?: () => number } = {}
): string[] {
  const n = clampCount(count);
  const now = options.now ?? Date.now;
  switch (type) {
    case "uuid-v4":
      return generateUuidV4Batch(n);
    case "uuid-v7":
      return generateUuidV7Batch(n, now);
    case "ulid":
      return generateUlidBatch(n, now);
    case "nanoid":
      return generateNanoIdBatch(n, clampNanoSize(options.nanoidSize ?? NANOID_DEFAULT_SIZE));
  }
}

export interface IdStyle {
  /** UUIDs only: uppercase hex. */
  uppercase?: boolean;
  /** UUIDs only: keep the 8-4-4-4-12 hyphens. */
  hyphens?: boolean;
  /** ULIDs only: lowercase output (canonical ULIDs are uppercase). */
  lowercase?: boolean;
}

export function styleId(id: string, type: IdType, style: IdStyle): string {
  if (type === "uuid-v4" || type === "uuid-v7") {
    let out = style.hyphens === false ? id.replace(/-/g, "") : id;
    if (style.uppercase) out = out.toUpperCase();
    return out;
  }
  if (type === "ulid" && style.lowercase) return id.toLowerCase();
  return id;
}

export function serializeIds(ids: string[], format: IdFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(ids, null, 2);
    case "csv":
      return ids.join(",");
    case "lines":
    default:
      return ids.join("\n");
  }
}

export interface IdInspection {
  kind: "uuid" | "ulid" | "nanoid";
  label: string;
  normalized: string;
  version?: number;
  variant?: string;
  /** Embedded creation time (UUID v1/v6/v7, ULID). */
  timestamp?: Date;
  note?: string;
}

const UUID_RE = /^(?:urn:uuid:)?\{?([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})\}?$/i;
const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;
const NANOID_RE = /^[A-Za-z0-9_-]{4,64}$/;
/** 100ns intervals between the Gregorian epoch (1582-10-15) and the Unix epoch. */
const GREGORIAN_OFFSET = BigInt("122192928000000000");

function uuidVariant(nibble: number): string {
  if ((nibble & 0x8) === 0) return "NCS (reserved)";
  if ((nibble & 0xc) === 0x8) return "RFC 9562 / 4122";
  if ((nibble & 0xe) === 0xc) return "Microsoft (reserved)";
  return "Future (reserved)";
}

/** Recognises a pasted UUID / ULID / NanoID and decodes what it can (version, variant, embedded time). */
export function inspectId(raw: string): IdInspection | { error: string } | null {
  const value = raw.trim();
  if (!value) return null;

  const uuid = UUID_RE.exec(value);
  if (uuid) {
    const hex = uuid.slice(1).join("").toLowerCase();
    const normalized = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    if (/^0+$/.test(hex)) return { kind: "uuid", label: "Nil UUID", normalized };
    if (/^f+$/.test(hex)) return { kind: "uuid", label: "Max UUID", normalized };
    const version = parseInt(hex[12], 16);
    const variant = uuidVariant(parseInt(hex[16], 16));
    let timestamp: Date | undefined;
    if (version === 7) {
      timestamp = new Date(parseInt(hex.slice(0, 12), 16));
    } else if (version === 1 || version === 6) {
      const ticks =
        version === 1
          ? BigInt(`0x${hex.slice(13, 16)}${hex.slice(8, 12)}${hex.slice(0, 8)}`)
          : BigInt(`0x${hex.slice(0, 12)}${hex.slice(13, 16)}`);
      timestamp = new Date(Number((ticks - GREGORIAN_OFFSET) / BigInt(10000)));
    }
    const names: Record<number, string> = {
      1: "time-based",
      3: "MD5 name-based",
      4: "random",
      5: "SHA-1 name-based",
      6: "reordered time",
      7: "Unix time-ordered",
      8: "custom",
    };
    return {
      kind: "uuid",
      label: `UUID v${version}${names[version] ? ` (${names[version]})` : ""}`,
      normalized,
      version,
      variant,
      timestamp,
    };
  }

  if (ULID_RE.test(value)) {
    const upper = value.toUpperCase();
    let ms = 0;
    for (let i = 0; i < 10; i++) ms = ms * 32 + CROCKFORD.indexOf(upper[i]);
    return { kind: "ulid", label: "ULID", normalized: upper, timestamp: new Date(ms) };
  }

  if (NANOID_RE.test(value)) {
    return {
      kind: "nanoid",
      label: `NanoID-style (${value.length} chars)`,
      normalized: value,
      note: "Random URL-safe id. It has no embedded timestamp.",
    };
  }

  return { error: "Not a UUID, ULID or NanoID." };
}
