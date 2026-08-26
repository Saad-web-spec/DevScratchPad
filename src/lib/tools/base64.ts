export function encodeBase64(
  input: string,
  urlSafe: boolean = false
): string {
  if (!input) return "";

  try {
    // UTF-8 safe encode via TextEncoder
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let encoded = btoa(binary);

    if (urlSafe) {
      encoded = encoded
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }

    return encoded;
  } catch (error: any) {
    throw new Error(error.message || "Failed to encode string to Base64");
  }
}

export function decodeBase64(
  input: string,
  urlSafe: boolean = false
): string {
  if (!input) return "";

  try {
    let normalized = input.trim();

    // Handle URL-safe format and padding
    if (urlSafe || normalized.includes("-") || normalized.includes("_")) {
      normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
      while (normalized.length % 4 !== 0) {
        normalized += "=";
      }
    }

    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(bytes);
  } catch (error: any) {
    throw new Error(error.message || "Invalid Base64 string");
  }
}

export function validateBase64(
  input: string,
  mode: "encode" | "decode" = "decode",
  urlSafe: boolean = false
): { valid: boolean; error?: string } {
  if (!input || input.trim() === "") {
    return { valid: true };
  }

  if (mode === "encode") {
    return { valid: true };
  }

  try {
    decodeBase64(input, urlSafe);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Invalid Base64 string format",
    };
  }
}
