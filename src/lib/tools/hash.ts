import SparkMD5 from "spark-md5";

export interface HashResults {
  md5: string;
  sha1: string;
  sha256: string;
  sha384: string;
  sha512: string;
}

export const EMPTY_HASHES: HashResults = { md5: "", sha1: "", sha256: "", sha384: "", sha512: "" };

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeSubtleHash(
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
  message: string | Uint8Array
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return "";
  }

  try {
    const bytes = typeof message === "string" ? new TextEncoder().encode(message) : message;
    const hashBuffer = await window.crypto.subtle.digest(algorithm, bytes as BufferSource);
    return toHex(hashBuffer);
  } catch {
    return "";
  }
}

/**
 * MD5 over the UTF-8 bytes of the message. SparkMD5.hash() also UTF-8 encodes,
 * but hashing the same byte array as the SHA family keeps every digest consistent.
 */
export function computeMd5(bytes: Uint8Array): string {
  try {
    return SparkMD5.ArrayBuffer.hash(bytes.slice().buffer);
  } catch {
    return "";
  }
}

export async function generateAllHashes(input: string): Promise<HashResults> {
  if (input === "") return EMPTY_HASHES;

  const bytes = new TextEncoder().encode(input);
  const md5 = computeMd5(bytes);
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    computeSubtleHash("SHA-1", bytes),
    computeSubtleHash("SHA-256", bytes),
    computeSubtleHash("SHA-384", bytes),
    computeSubtleHash("SHA-512", bytes),
  ]);

  return { md5, sha1, sha256, sha384, sha512 };
}
