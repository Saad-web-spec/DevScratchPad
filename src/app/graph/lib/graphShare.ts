/**
 * Share links for graphs: the Markdown is compressed into the URL hash, so nothing is stored on a server.
 *  - `#g=<d><data>`: raw DEFLATE against a frozen dictionary (graphShareDictionary.ts), base64url. `<d>`
 *    is one character naming the dictionary. Graph files repeat the same keys and phrases, and most start
 *    from a starter graph, so this is two to ten times shorter than plain compression. Written by the
 *    studio and the connector.
 *  - `#graph=<data>`: LZ-string, the first format. Still opened, so old links keep working.
 */
import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import LZString from "lz-string";
import { SHARE_DICTIONARIES } from "./graphShareDictionary";
import { MAX_SOURCE_LENGTH } from "./graphSkill";

const HASH_KEY = "graph";
const DICTIONARY_KEY = "g";
const DICTIONARY_PATTERN = new RegExp(`(?:^#|&)${DICTIONARY_KEY}=([^&]+)`);
/** The base64url alphabet: the character at index n names dictionary n. */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
/** Larger graphs only try the general dictionary: eleven passes over a huge file would stall the page. */
const TRY_EVERY_DICTIONARY_BELOW = 60_000;
/** A source of MAX_SOURCE_LENGTH UTF-16 units is at most three UTF-8 bytes per unit. */
const MAX_SOURCE_BYTES = MAX_SOURCE_LENGTH * 3;

/** Links longer than this get unwieldy in chat apps and some browsers; the UI warns above it. */
export const SHARE_URL_SOFT_LIMIT = 8000;

/**
 * Caps on what a link may carry. Compressed data can expand over 1000×, so the encoded length is capped
 * before decompressing and the result again after: a tiny hostile link must not fill memory or storage.
 */
export const MAX_HASH_LENGTH = 32_000;

export interface SharedGraph {
  source: string;
}

const dictionaryBytes = new Map<number, Uint8Array>();

function dictionary(index: number): Uint8Array {
  let bytes = dictionaryBytes.get(index);
  if (!bytes) {
    bytes = strToU8(SHARE_DICTIONARIES[index]);
    dictionaryBytes.set(index, bytes);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Uint8Array.from(atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** The shortest share hash for a graph: compressed against each dictionary, keeping the smallest. */
export function encodeShareHash(shared: SharedGraph): string {
  const data = strToU8(shared.source);
  const candidates = data.length < TRY_EVERY_DICTIONARY_BELOW ? SHARE_DICTIONARIES.map((_, index) => index) : [0];
  let best: { index: number; bytes: Uint8Array } | null = null;
  for (const index of candidates) {
    const bytes = deflateSync(data, { level: 9, mem: 12, dictionary: dictionary(index) });
    if (!best || bytes.length < best.bytes.length) best = { index, bytes };
  }
  const { index, bytes } = best as { index: number; bytes: Uint8Array };
  return `#${DICTIONARY_KEY}=${ALPHABET[index]}${toBase64Url(bytes)}`;
}

function decodeDictionaryHash(data: string): SharedGraph | null {
  if (data.length > MAX_HASH_LENGTH || data.length < 2) return null;
  const index = ALPHABET.indexOf(data[0]);
  if (index < 0 || index >= SHARE_DICTIONARIES.length) return null;
  const bytes = fromBase64Url(data.slice(1));
  if (!bytes) return null;
  try {
    // A buffer one byte past the cap: fflate stops filling it there, so a bomb shows as a full buffer.
    const inflated = inflateSync(bytes, { dictionary: dictionary(index), out: new Uint8Array(MAX_SOURCE_BYTES + 1) });
    if (inflated.length > MAX_SOURCE_BYTES) return null;
    const source = strFromU8(inflated);
    return source.length > MAX_SOURCE_LENGTH || source.trim() === "" ? null : { source };
  } catch {
    return null;
  }
}

export function decodeShareHash(hash: string): SharedGraph | null {
  const current = DICTIONARY_PATTERN.exec(hash);
  if (current) return decodeDictionaryHash(current[1]);
  const match = new RegExp(`(?:^#|&)${HASH_KEY}=([^&]+)`).exec(hash);
  if (!match || match[1].length > MAX_HASH_LENGTH) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(match[1]);
    if (!json || json.length > MAX_SOURCE_LENGTH + 1_000) return null;
    // Links from the old runner also carry a goal (`g`); it is ignored.
    const data = JSON.parse(json) as { s?: unknown };
    if (typeof data.s !== "string" || data.s.trim() === "") return null;
    return { source: data.s };
  } catch {
    return null;
  }
}

/** The first link format, kept so tests can build old links and check they still open. */
export function encodeLegacyShareHash(shared: SharedGraph): string {
  return `#${HASH_KEY}=${LZString.compressToEncodedURIComponent(JSON.stringify({ s: shared.source }))}`;
}
