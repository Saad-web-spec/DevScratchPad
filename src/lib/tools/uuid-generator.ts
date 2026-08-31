export type IdType = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid";
export type OutputFormat = "list" | "json" | "comma";

// Crockford's Base32
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const NANOID_ALPHABET = "useandom-26T1983_40STFnveciglhopenqzkxTX75";

// UUID v4
export function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// UUID v7 (Time-ordered epoch + randomness)
export function generateUuidV7(): string {
  const timestamp = Date.now();
  const hexTime = timestamp.toString(16).padStart(12, "0"); // 48 bits

  // 16 bits: 4-bit version (7) + 12 random bits
  const randA = (Math.floor(Math.random() * 0x1000) | 0x7000).toString(16).padStart(4, "0");

  // 16 bits: 2-bit variant (10) + 14 random bits
  const randB = (Math.floor(Math.random() * 0x4000) | 0x8000).toString(16).padStart(4, "0");

  // 48 random bits
  const randC = Math.floor(Math.random() * 0xffffffffffff)
    .toString(16)
    .padStart(12, "0");

  return `${hexTime.slice(0, 8)}-${hexTime.slice(8, 12)}-${randA}-${randB}-${randC}`;
}

// ULID (Universally Unique Lexicographically Sortable Identifier)
export function generateUlid(): string {
  const now = Date.now();
  let timeStr = "";
  let tempTime = now;
  for (let i = 9; i >= 0; i--) {
    const mod = tempTime % 32;
    timeStr = CROCKFORD_ALPHABET[mod] + timeStr;
    tempTime = Math.floor(tempTime / 32);
  }

  let randStr = "";
  for (let i = 0; i < 16; i++) {
    const randIndex = Math.floor(Math.random() * 32);
    randStr += CROCKFORD_ALPHABET[randIndex];
  }

  return timeStr + randStr;
}

// NanoID (URL-friendly random string)
export function generateNanoId(size: number = 21): string {
  let id = "";
  for (let i = 0; i < size; i++) {
    const randIndex = Math.floor(Math.random() * NANOID_ALPHABET.length);
    id += NANOID_ALPHABET[randIndex];
  }
  return id;
}

// Master Batch Generator
export function generateBatchIds(
  type: IdType,
  count: number = 10,
  options: {
    uppercase?: boolean;
    hyphens?: boolean;
    format?: OutputFormat;
  } = {}
): string {
  const safeCount = Math.min(Math.max(count, 1), 100);
  const ids: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    let id = "";
    switch (type) {
      case "uuid-v4":
        id = generateUuidV4();
        break;
      case "uuid-v7":
        id = generateUuidV7();
        break;
      case "ulid":
        id = generateUlid();
        break;
      case "nanoid":
        id = generateNanoId(21);
        break;
    }

    if (options.hyphens === false && (type === "uuid-v4" || type === "uuid-v7")) {
      id = id.replace(/-/g, "");
    }

    if (options.uppercase) {
      id = id.toUpperCase();
    } else if (type === "ulid" && options.uppercase === false) {
      id = id.toLowerCase();
    } else if (type !== "ulid" && !options.uppercase) {
      id = id.toLowerCase();
    }

    ids.push(id);
  }

  switch (options.format) {
    case "json":
      return JSON.stringify(ids, null, 2);
    case "comma":
      return ids.join(", ");
    case "list":
    default:
      return ids.join("\n");
  }
}
