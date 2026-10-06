export type DetectedFormat =
  | "base64"
  | "base64-url"
  | "data-url"
  | "hex"
  | "binary"
  | "url-encoded"
  | "plain-text";

export interface DataUrlInfo {
  isDataUrl: boolean;
  mimeType?: string;
  isImage?: boolean;
  rawBase64?: string;
  fullDataUrl?: string;
}

export interface InspectorConversions {
  plainText: string;
  base64: string;
  base64Url: string;
  hexStream: string;
  hexDump: string;
  binary: string;
  urlEncoded: string;
  dataUrlInfo: DataUrlInfo;
  byteLength: number;
  charLength: number;
  detectedFormat: DetectedFormat;
}

// Convert bytes to Base64 (Standard)
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to bytes
export function base64ToBytes(b64: string): Uint8Array {
  let normalized = b64.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert bytes to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

// Convert bytes to continuous Hex without spaces
export function bytesToContinuousHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert bytes to Hex Dump (canonical hexdump format with 16 bytes per line)
export function bytesToHexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  const total = bytes.length;

  for (let offset = 0; offset < total; offset += 16) {
    const chunk = bytes.slice(offset, offset + 16);
    const offsetHex = offset.toString(16).padStart(8, "0");

    // Hex part (2 groups of 8 bytes)
    const hexPart1 = Array.from(chunk.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const hexPart2 = Array.from(chunk.slice(8, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");

    const hexPart = `${hexPart1.padEnd(23, " ")}  ${hexPart2.padEnd(23, " ")}`;

    // ASCII representation
    const asciiPart = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");

    lines.push(`${offsetHex}  ${hexPart} |${asciiPart}|`);
  }

  return lines.join("\n");
}

// Convert bytes to binary string (8 bits per byte)
export function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}

// Convert Hex string (with or without spaces/delimiters) to bytes
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length % 2 !== 0) {
    throw new Error("Invalid hex string (must have an even number of hex digits)");
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Binary bit-string to bytes
export function binaryToBytes(bin: string): Uint8Array {
  const cleaned = bin.replace(/[^01]/g, "");
  if (cleaned.length % 8 !== 0) {
    throw new Error("Invalid binary string (must be in multiples of 8 bits)");
  }
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < cleaned.length; i += 8) {
    bytes[i / 8] = parseInt(cleaned.substring(i, i + 8), 2);
  }
  return bytes;
}

// Auto detect input format
export function detectFormat(input: string): DetectedFormat {
  const trimmed = input.trim();
  if (!trimmed) return "plain-text";

  // Check Data URL
  if (trimmed.startsWith("data:") && trimmed.includes(";base64,")) {
    return "data-url";
  }

  // Check Binary (only 0s, 1s, spaces, tabs, newlines)
  const isAllBinary = /^[01\s\r\n\t]+$/.test(trimmed) && trimmed.replace(/\s/g, "").length >= 8 && trimmed.replace(/\s/g, "").length % 8 === 0;
  if (isAllBinary) {
    return "binary";
  }

  // Check Hex (e.g. 48 65 6c 6c 6f or 48656c6c6f)
  const hexClean = trimmed.replace(/[\s,:-]/g, "");
  const isHexOnly = /^[0-9a-fA-F]+$/.test(hexClean) && hexClean.length >= 2 && hexClean.length % 2 === 0;
  if (isHexOnly && (trimmed.includes(" ") || trimmed.includes(":") || hexClean.length >= 8)) {
    if (trimmed.includes(" ") || trimmed.includes(":") || /^[0-9a-fA-F]{6,}$/i.test(hexClean)) {
      // Check if it's strictly hex
      if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return "hex";
      }
    }
  }

  // Check URL encoded (%20, %3A, etc)
  if (/%[0-9a-fA-F]{2}/.test(trimmed) && !trimmed.includes(" ")) {
    return "url-encoded";
  }

  // Check Base64
  const base64Clean = trimmed.replace(/\s/g, "");
  const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(base64Clean) && base64Clean.length % 4 === 0 && base64Clean.length >= 4;
  const isBase64Url = /^[A-Za-z0-9_-]+={0,2}$/.test(base64Clean) && base64Clean.length % 4 === 0 && (base64Clean.includes("-") || base64Clean.includes("_"));

  if (isBase64Url) return "base64-url";
  if (isBase64) {
    try {
      atob(base64Clean);
      return "base64";
    } catch {
      // not valid base64
    }
  }

  return "plain-text";
}

// Parse Data URL info
export function parseDataUrl(input: string): DataUrlInfo {
  const trimmed = input.trim();
  if (trimmed.startsWith("data:") && trimmed.includes(";base64,")) {
    const [header, rawBase64] = trimmed.split(";base64,");
    const mimeType = header.replace(/^data:/, "");
    const isImage = mimeType.startsWith("image/");
    return {
      isDataUrl: true,
      mimeType,
      isImage,
      rawBase64,
      fullDataUrl: trimmed,
    };
  }

  // If input is pure base64, check if it starts with known image magic bytes
  try {
    const bytes = base64ToBytes(trimmed);
    if (bytes.length >= 4) {
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return {
          isDataUrl: false,
          mimeType: "image/png",
          isImage: true,
          rawBase64: trimmed,
          fullDataUrl: `data:image/png;base64,${trimmed}`,
        };
      }
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return {
          isDataUrl: false,
          mimeType: "image/jpeg",
          isImage: true,
          rawBase64: trimmed,
          fullDataUrl: `data:image/jpeg;base64,${trimmed}`,
        };
      }
      // GIF: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return {
          isDataUrl: false,
          mimeType: "image/gif",
          isImage: true,
          rawBase64: trimmed,
          fullDataUrl: `data:image/gif;base64,${trimmed}`,
        };
      }
      // WEBP: 52 49 46 46
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return {
          isDataUrl: false,
          mimeType: "image/webp",
          isImage: true,
          rawBase64: trimmed,
          fullDataUrl: `data:image/webp;base64,${trimmed}`,
        };
      }
    }
  } catch {
    // Not valid base64
  }

  return { isDataUrl: false };
}

// Master inspector function to calculate all transformations
export function inspectAndConvert(
  input: string,
  forcedFormat?: DetectedFormat
): InspectorConversions {
  const trimmed = input.trim();
  const format = forcedFormat || detectFormat(input);
  const dataUrlInfo = parseDataUrl(input);

  let rawBytes: Uint8Array;

  try {
    if (format === "data-url" && dataUrlInfo.rawBase64) {
      rawBytes = base64ToBytes(dataUrlInfo.rawBase64);
    } else if (format === "base64" || format === "base64-url") {
      rawBytes = base64ToBytes(trimmed);
    } else if (format === "hex") {
      rawBytes = hexToBytes(trimmed);
    } else if (format === "binary") {
      rawBytes = binaryToBytes(trimmed);
    } else if (format === "url-encoded") {
      const decoded = decodeURIComponent(trimmed);
      rawBytes = new TextEncoder().encode(decoded);
    } else {
      // Default plain text (UTF-8)
      rawBytes = new TextEncoder().encode(input);
    }
  } catch {
    // Fallback on error: treat as plain text UTF-8
    rawBytes = new TextEncoder().encode(input);
  }

  // Derive plain text from rawBytes
  let plainText: string;
  try {
    plainText = new TextDecoder("utf-8", { fatal: false }).decode(rawBytes);
  } catch {
    plainText = input;
  }

  const b64 = bytesToBase64(rawBytes);
  const b64Url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const hex = bytesToHex(rawBytes);
  const hexDump = bytesToHexDump(rawBytes);
  const bin = bytesToBinary(rawBytes);
  const urlEnc = encodeURIComponent(plainText);

  return {
    plainText,
    base64: b64,
    base64Url: b64Url,
    hexStream: hex,
    hexDump,
    binary: bin,
    urlEncoded: urlEnc,
    dataUrlInfo,
    byteLength: rawBytes.byteLength,
    charLength: plainText.length,
    detectedFormat: format,
  };
}
