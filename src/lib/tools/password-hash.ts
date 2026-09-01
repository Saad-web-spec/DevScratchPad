import bcrypt from "bcryptjs";
import { argon2id } from "@noble/hashes/argon2.js";
import { scrypt } from "@noble/hashes/scrypt.js";

export type PasswordAlgorithm = "bcrypt" | "pbkdf2-sha256" | "pbkdf2-sha512" | "argon2id" | "scrypt";

export interface HashGenerationOptions {
  algorithm: PasswordAlgorithm;
  password: string;
  bcryptRounds?: number;
  pbkdf2Iterations?: number;
  salt?: string;
}

export interface HashGenerationResult {
  hash: string;
  algorithm: PasswordAlgorithm;
  salt: string;
  executionMs: number;
}

export interface HashVerificationResult {
  isMatch: boolean;
  algorithmDetected: string;
  executionMs: number;
  error?: string;
}

// Convert bytes to Hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert bytes to Base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Generate random salt bytes
export function generateRandomSalt(length: number = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

// Generate Hash
export async function generatePasswordHash(options: HashGenerationOptions): Promise<HashGenerationResult> {
  const { algorithm, password, bcryptRounds = 10, pbkdf2Iterations = 100000 } = options;
  const salt = options.salt || generateRandomSalt(16);
  const start = performance.now();

  let finalHash = "";

  if (algorithm === "bcrypt") {
    const saltRounds = Math.min(14, Math.max(4, bcryptRounds));
    const generatedSalt = bcrypt.genSaltSync(saltRounds);
    finalHash = bcrypt.hashSync(password, generatedSalt);
  } else if (algorithm === "pbkdf2-sha256" || algorithm === "pbkdf2-sha512") {
    const hashName = algorithm === "pbkdf2-sha512" ? "SHA-512" : "SHA-256";
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: pbkdf2Iterations,
        hash: hashName,
      },
      keyMaterial,
      256
    );

    const hashHex = bytesToHex(new Uint8Array(derivedBits));
    finalHash = `$pbkdf2-${hashName.toLowerCase()}$i=${pbkdf2Iterations}$${salt}$${hashHex}`;
  } else if (algorithm === "argon2id") {
    const saltBytes = new TextEncoder().encode(salt.slice(0, 16).padEnd(16, "0"));
    const hashBytes = argon2id(new TextEncoder().encode(password), saltBytes, {
      t: 2,
      m: 19456, // 19 MiB
      p: 1,
      dkLen: 32,
    });
    const hashB64 = bytesToBase64(hashBytes).replace(/=+$/, "");
    const saltB64 = bytesToBase64(saltBytes).replace(/=+$/, "");
    finalHash = `$argon2id$v=19$m=19456,t=2,p=1$${saltB64}$${hashB64}`;
  } else if (algorithm === "scrypt") {
    const saltBytes = new TextEncoder().encode(salt.slice(0, 16));
    const hashBytes = scrypt(new TextEncoder().encode(password), saltBytes, {
      N: 16384,
      r: 8,
      p: 1,
      dkLen: 32,
    });
    const hashHex = bytesToHex(hashBytes);
    finalHash = `$scrypt$N=16384,r=8,p=1$${salt}$${hashHex}`;
  }

  const end = performance.now();

  return {
    hash: finalHash,
    algorithm,
    salt,
    executionMs: Math.round((end - start) * 10) / 10,
  };
}

// Detect Hash Algorithm from Hash string
export function detectHashAlgorithm(hash: string): string {
  const trimmed = hash.trim();
  if (trimmed.startsWith("$2a$") || trimmed.startsWith("$2b$") || trimmed.startsWith("$2y$")) {
    return "bcrypt";
  }
  if (trimmed.startsWith("$argon2id$") || trimmed.startsWith("$argon2i$") || trimmed.startsWith("$argon2d$")) {
    return "argon2";
  }
  if (trimmed.startsWith("$pbkdf2-")) {
    return "pbkdf2";
  }
  if (trimmed.startsWith("$scrypt$")) {
    return "scrypt";
  }
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return "md5 (raw)";
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return "sha256 (raw)";
  }
  return "unknown";
}

// Verify Password Against Hash
export async function verifyPasswordHash(password: string, hash: string): Promise<HashVerificationResult> {
  const trimmedHash = hash.trim();
  const detected = detectHashAlgorithm(trimmedHash);
  const start = performance.now();

  if (!password || !trimmedHash) {
    return {
      isMatch: false,
      algorithmDetected: detected,
      executionMs: 0,
      error: "Please provide both password and hash string.",
    };
  }

  try {
    if (detected === "bcrypt") {
      const isMatch = bcrypt.compareSync(password, trimmedHash);
      const end = performance.now();
      return {
        isMatch,
        algorithmDetected: "Bcrypt ($2a/$2b/$2y)",
        executionMs: Math.round((end - start) * 10) / 10,
      };
    }

    if (detected === "argon2") {
      // Parse $argon2id$v=19$m=19456,t=2,p=1$salt$hash
      const parts = trimmedHash.split("$");
      if (parts.length >= 6) {
        const saltB64 = parts[4];
        const hashB64 = parts[5];
        const saltBytes = Uint8Array.from(atob(saltB64.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((2 - saltB64.length * 3) & 3)), (c) => c.charCodeAt(0));
        const hashBytes = argon2id(new TextEncoder().encode(password), saltBytes, {
          t: 2,
          m: 19456,
          p: 1,
          dkLen: 32,
        });
        const computedB64 = bytesToBase64(hashBytes).replace(/=+$/, "");
        const isMatch = computedB64 === hashB64;
        const end = performance.now();
        return {
          isMatch,
          algorithmDetected: "Argon2",
          executionMs: Math.round((end - start) * 10) / 10,
        };
      }
    }

    if (detected === "pbkdf2") {
      // $pbkdf2-sha-256$i=100000$salt$hashHex
      const parts = trimmedHash.split("$");
      if (parts.length >= 5) {
        const algoPart = parts[1]; // pbkdf2-sha-256 or pbkdf2-sha-512
        const iterPart = parts[2]; // i=100000
        const salt = parts[3];
        const expectedHashHex = parts[4];

        const iterations = parseInt(iterPart.replace("i=", ""), 10) || 100000;
        const hashName = algoPart.includes("512") ? "SHA-512" : "SHA-256";

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          enc.encode(password),
          { name: "PBKDF2" },
          false,
          ["deriveBits"]
        );

        const derivedBits = await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations,
            hash: hashName,
          },
          keyMaterial,
          256
        );

        const computedHex = bytesToHex(new Uint8Array(derivedBits));
        const isMatch = computedHex.toLowerCase() === expectedHashHex.toLowerCase();
        const end = performance.now();
        return {
          isMatch,
          algorithmDetected: `PBKDF2 (${hashName})`,
          executionMs: Math.round((end - start) * 10) / 10,
        };
      }
    }

    const end = performance.now();
    return {
      isMatch: false,
      algorithmDetected: detected,
      executionMs: Math.round((end - start) * 10) / 10,
      error: `Unsupported hash format. Supported formats: Bcrypt ($2a/$2b), Argon2 ($argon2id), PBKDF2 ($pbkdf2-sha256).`,
    };
  } catch (err: any) {
    const end = performance.now();
    return {
      isMatch: false,
      algorithmDetected: detected,
      executionMs: Math.round((end - start) * 10) / 10,
      error: `Verification error: ${err?.message || "Invalid hash or parameters"}`,
    };
  }
}
