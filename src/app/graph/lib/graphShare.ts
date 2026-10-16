/**
 * Share links for graphs: the Markdown is LZ-compressed into the URL hash,
 * so nothing is stored on a server. `#graph=<data>`.
 */
import LZString from "lz-string";
import { MAX_SOURCE_LENGTH } from "./graphSkill";

const HASH_KEY = "graph";

/** Links longer than this get unwieldy in chat apps and some browsers; the UI warns above it. */
export const SHARE_URL_SOFT_LIMIT = 8000;

export interface SharedGraph {
  source: string;
}

export function encodeShareHash(shared: SharedGraph): string {
  const payload = JSON.stringify({ s: shared.source });
  return `#${HASH_KEY}=${LZString.compressToEncodedURIComponent(payload)}`;
}

/**
 * Caps on what a link may carry. LZ data can expand over 1000×, so the encoded length is capped before
 * decompressing and the result again after: a tiny hostile link must not fill memory or storage.
 */
export const MAX_HASH_LENGTH = 32_000;

export function decodeShareHash(hash: string): SharedGraph | null {
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
