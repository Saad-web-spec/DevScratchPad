// bcryptjs and @noble/hashes (argon2 / scrypt) are loaded on first use via `await import()`
// so they stay out of the page bundle until the user actually generates or verifies a hash.
const loadBcrypt = () => import("bcryptjs").then((m) => m.default);
const loadArgon2 = () => import("@noble/hashes/argon2.js");
const loadScrypt = () => import("@noble/hashes/scrypt.js");

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

// Decode unpadded standard / URL-safe Base64 (as used in PHC strings)
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  return Uint8Array.from(atob(clean + "=".repeat((4 - (clean.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

/** bcrypt only uses the first 72 bytes of a password; anything after is silently ignored. */
export const BCRYPT_MAX_BYTES = 72;

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

  if (algorithm !== "bcrypt") {
    if (salt.includes("$")) throw new Error('Salt cannot contain "$" (it is the field separator of the hash string).');
    if (new TextEncoder().encode(salt).length < 8) throw new Error("Salt must be at least 8 bytes.");
  }

  if (algorithm === "bcrypt") {
    const bcrypt = await loadBcrypt();
    const saltRounds = Math.min(14, Math.max(4, bcryptRounds));
    // Async variant yields to the event loop between rounds so the UI stays responsive.
    finalHash = await bcrypt.hash(password, saltRounds);
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
    const { argon2idAsync } = await loadArgon2();
    const saltBytes = new TextEncoder().encode(salt);
    const hashBytes = await argon2idAsync(new TextEncoder().encode(password), saltBytes, {
      t: 2,
      m: 19456, // 19 MiB
      p: 1,
      dkLen: 32,
    });
    const hashB64 = bytesToBase64(hashBytes).replace(/=+$/, "");
    const saltB64 = bytesToBase64(saltBytes).replace(/=+$/, "");
    finalHash = `$argon2id$v=19$m=19456,t=2,p=1$${saltB64}$${hashB64}`;
  } else if (algorithm === "scrypt") {
    const { scryptAsync } = await loadScrypt();
    // The hash string embeds the full salt, so derive from the full salt too (verification depends on it).
    const saltBytes = new TextEncoder().encode(salt);
    const hashBytes = await scryptAsync(new TextEncoder().encode(password), saltBytes, {
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

// Parse "m=19456,t=2,p=1" style parameter lists
function parseParams(paramStr: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const kv of paramStr.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) out[k.trim()] = parseInt(v, 10);
  }
  return out;
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
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmedHash)) {
        throw new Error("Malformed bcrypt hash (expected 60 characters: $2b$<cost>$<22-char salt><31-char hash>).");
      }
      const bcrypt = await loadBcrypt();
      const isMatch = await bcrypt.compare(password, trimmedHash);
      const end = performance.now();
      return {
        isMatch,
        algorithmDetected: "Bcrypt ($2a/$2b/$2y)",
        executionMs: Math.round((end - start) * 10) / 10,
      };
    }

    if (detected === "argon2") {
      // Parse $argon2id$v=19$m=19456,t=2,p=1$salt$hash (the v= segment is optional in old hashes).
      // Variant, cost parameters and output length all come from the hash string.
      const parts = trimmedHash.split("$");
      const variant = parts[1];
      const hasVersion = parts[2]?.startsWith("v=");
      const version = hasVersion ? parseInt(parts[2].slice(2), 10) : 0x10;
      const params = parseParams(parts[hasVersion ? 3 : 2] ?? "");
      const saltB64 = parts[hasVersion ? 4 : 3];
      const hashB64 = parts[hasVersion ? 5 : 4];
      if (saltB64 && hashB64 && params.m > 0 && params.t > 0 && params.p > 0) {
        const lib = await loadArgon2();
        const fn = variant === "argon2i" ? lib.argon2iAsync : variant === "argon2d" ? lib.argon2dAsync : lib.argon2idAsync;
        const expected = base64ToBytes(hashB64);
        const hashBytes = await fn(new TextEncoder().encode(password), base64ToBytes(saltB64), {
          t: params.t,
          m: params.m,
          p: params.p,
          version,
          dkLen: expected.length,
        });
        const computedB64 = bytesToBase64(hashBytes).replace(/=+$/, "");
        const isMatch = computedB64 === hashB64.replace(/=+$/, "");
        const end = performance.now();
        return {
          isMatch,
          algorithmDetected: `${variant} (m=${params.m}, t=${params.t}, p=${params.p})`,
          executionMs: Math.round((end - start) * 10) / 10,
        };
      }
    }

    if (detected === "scrypt") {
      // $scrypt$N=16384,r=8,p=1$salt$hashHex (format produced by this tool)
      const parts = trimmedHash.split("$");
      if (parts.length >= 5) {
        const params = parseParams(parts[2]);
        const N = params.N || 16384;
        const r = params.r || 8;
        const p = params.p || 1;
        const expectedHex = parts[4].toLowerCase();
        const { scryptAsync } = await loadScrypt();
        const hashBytes = await scryptAsync(new TextEncoder().encode(password), new TextEncoder().encode(parts[3]), {
          N,
          r,
          p,
          dkLen: Math.max(1, Math.floor(expectedHex.length / 2)),
        });
        const isMatch = bytesToHex(hashBytes) === expectedHex;
        const end = performance.now();
        return {
          isMatch,
          algorithmDetected: `scrypt (N=${N}, r=${r}, p=${p})`,
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
      error: `Unsupported hash format. Supported formats: Bcrypt ($2a/$2b/$2y), Argon2 ($argon2id/$argon2i/$argon2d), PBKDF2 ($pbkdf2-sha-256), scrypt ($scrypt).`,
    };
  } catch (err: unknown) {
    const end = performance.now();
    return {
      isMatch: false,
      algorithmDetected: detected,
      executionMs: Math.round((end - start) * 10) / 10,
      error: `Verification error: ${err instanceof Error ? err.message : "Invalid hash or parameters"}`,
    };
  }
}
