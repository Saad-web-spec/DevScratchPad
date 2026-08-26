import SparkMD5 from "spark-md5";

export interface HashResults {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

export async function computeSubtleHash(
  algorithm: "SHA-1" | "SHA-256" | "SHA-512",
  message: string
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return "";
  }

  try {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest(algorithm, msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    return "";
  }
}

export function computeMd5(message: string): string {
  try {
    return SparkMD5.hash(message);
  } catch (error) {
    return "";
  }
}

export async function generateAllHashes(input: string): Promise<HashResults> {
  if (input === "") {
    return {
      md5: "",
      sha1: "",
      sha256: "",
      sha512: "",
    };
  }

  const md5 = computeMd5(input);
  const [sha1, sha256, sha512] = await Promise.all([
    computeSubtleHash("SHA-1", input),
    computeSubtleHash("SHA-256", input),
    computeSubtleHash("SHA-512", input),
  ]);

  return {
    md5,
    sha1,
    sha256,
    sha512,
  };
}
