/**
 * JWT helpers for the JWT Decoder: decoding (base64url + UTF-8 JSON) and
 * signature verification with WebCrypto for every JWS algorithm browsers support.
 * Everything runs locally; tokens and keys never leave the browser.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface JwtDecodeResult {
  valid: boolean;
  header?: JsonObject;
  payload?: JsonObject;
  signature?: string;
  error?: string;
}

/** Decodes base64url to bytes (padding optional). Throws on invalid characters. */
export function base64UrlToBytes(str: string): Uint8Array<ArrayBuffer> {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeSegment(segment: string, name: string): JsonObject {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(base64UrlToBytes(segment));
  } catch {
    throw new Error(`${name} is not valid base64url`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${name} is not valid JSON`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object`);
  }
  return parsed as JsonObject;
}

export function decodeJwt(token: string): JwtDecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return { valid: true };
  const parts = trimmed.split(".");
  if (parts.length === 5) {
    return { valid: false, error: "This is an encrypted JWE (5 parts); only signed JWS tokens can be decoded" };
  }
  if (parts.length !== 3) {
    return { valid: false, error: `A JWT has 3 dot-separated parts, found ${parts.length}` };
  }
  try {
    const header = decodeSegment(parts[0], "Header");
    const payload = decodeSegment(parts[1], "Payload");
    return { valid: true, header, payload, signature: parts[2] };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

type VerifyKind = "hmac" | "rsa" | "pss" | "ecdsa" | "eddsa";

interface AlgSpec {
  kind: VerifyKind;
  hash?: "SHA-256" | "SHA-384" | "SHA-512";
  curve?: "P-256" | "P-384" | "P-521";
  saltLength?: number;
}

const ALGS: Record<string, AlgSpec> = {
  HS256: { kind: "hmac", hash: "SHA-256" },
  HS384: { kind: "hmac", hash: "SHA-384" },
  HS512: { kind: "hmac", hash: "SHA-512" },
  RS256: { kind: "rsa", hash: "SHA-256" },
  RS384: { kind: "rsa", hash: "SHA-384" },
  RS512: { kind: "rsa", hash: "SHA-512" },
  PS256: { kind: "pss", hash: "SHA-256", saltLength: 32 },
  PS384: { kind: "pss", hash: "SHA-384", saltLength: 48 },
  PS512: { kind: "pss", hash: "SHA-512", saltLength: 64 },
  ES256: { kind: "ecdsa", hash: "SHA-256", curve: "P-256" },
  ES384: { kind: "ecdsa", hash: "SHA-384", curve: "P-384" },
  ES512: { kind: "ecdsa", hash: "SHA-512", curve: "P-521" },
  EdDSA: { kind: "eddsa" },
  Ed25519: { kind: "eddsa" },
};

/** "secret" for HMAC algorithms, "public-key" for asymmetric ones, null when unsupported (e.g. "none"). */
export function verificationKeyType(alg: string | undefined): "secret" | "public-key" | null {
  const spec = alg ? ALGS[alg] : undefined;
  if (!spec) return null;
  return spec.kind === "hmac" ? "secret" : "public-key";
}

function importParams(spec: AlgSpec): RsaHashedImportParams | EcKeyImportParams | HmacImportParams | Algorithm {
  switch (spec.kind) {
    case "hmac":
      return { name: "HMAC", hash: spec.hash! };
    case "rsa":
      return { name: "RSASSA-PKCS1-v1_5", hash: spec.hash! };
    case "pss":
      return { name: "RSA-PSS", hash: spec.hash! };
    case "ecdsa":
      return { name: "ECDSA", namedCurve: spec.curve! };
    case "eddsa":
      return { name: "Ed25519" };
  }
}

function verifyParams(spec: AlgSpec): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  switch (spec.kind) {
    case "hmac":
      return "HMAC";
    case "rsa":
      return "RSASSA-PKCS1-v1_5";
    case "pss":
      return { name: "RSA-PSS", saltLength: spec.saltLength! };
    case "ecdsa":
      return { name: "ECDSA", hash: spec.hash! };
    case "eddsa":
      return "Ed25519";
  }
}

async function importPublicKey(keyText: string, spec: AlgSpec): Promise<CryptoKey> {
  const trimmed = keyText.trim();
  if (trimmed.startsWith("{")) {
    let jwk: JsonWebKey & { keys?: JsonWebKey[] };
    try {
      jwk = JSON.parse(trimmed) as JsonWebKey & { keys?: JsonWebKey[] };
    } catch {
      throw new Error("The JWK is not valid JSON");
    }
    // A JWKS: use the first key (the kid match happens in the caller when available).
    const single = Array.isArray(jwk.keys) ? jwk.keys[0] : jwk;
    if (!single) throw new Error("The JWK set has no keys");
    const publicOnly: JsonWebKey = { ...single };
    delete publicOnly.d;
    delete publicOnly.p;
    delete publicOnly.q;
    delete publicOnly.dp;
    delete publicOnly.dq;
    delete publicOnly.qi;
    delete publicOnly.key_ops;
    delete publicOnly.alg;
    return crypto.subtle.importKey("jwk", publicOnly, importParams(spec), false, ["verify"]);
  }
  if (/-----BEGIN (RSA PUBLIC KEY|CERTIFICATE)-----/.test(trimmed)) {
    throw new Error("Paste the key as -----BEGIN PUBLIC KEY----- (SPKI) or as a JWK");
  }
  const match = trimmed.match(/-----BEGIN PUBLIC KEY-----([\s\S]+?)-----END PUBLIC KEY-----/);
  if (!match) throw new Error("Expected a -----BEGIN PUBLIC KEY----- PEM block or a JWK");
  const der = Uint8Array.from(atob(match[1].replace(/\s/g, "")), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("spki", der, importParams(spec), false, ["verify"]);
}

export interface VerifyOutcome {
  status: "valid" | "invalid" | "error";
  message?: string;
}

/** Verifies the token signature with a secret (HS*) or a public key in PEM/JWK form (RS*, PS*, ES*, EdDSA). */
export async function verifyJwtSignature(token: string, alg: string, keyText: string): Promise<VerifyOutcome> {
  const spec = ALGS[alg];
  if (!spec) return { status: "error", message: `Algorithm ${alg} cannot be verified` };
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { status: "error", message: "Token must have 3 parts" };
  try {
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToBytes(parts[2]);
    const key =
      spec.kind === "hmac"
        ? await crypto.subtle.importKey("raw", new TextEncoder().encode(keyText), importParams(spec), false, ["verify"])
        : await importPublicKey(keyText, spec);
    const ok = await crypto.subtle.verify(verifyParams(spec), key, signature, data);
    return { status: ok ? "valid" : "invalid" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", message: message || "Could not import the key" };
  }
}

/** Short relative time ("in 3 days", "2 hours ago") without pulling in a date library. */
export function relativeTime(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600e3],
    ["month", 30 * 24 * 3600e3],
    ["day", 24 * 3600e3],
    ["hour", 3600e3],
    ["minute", 60e3],
    ["second", 1e3],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") return rtf.format(Math.round(diff / ms), unit);
  }
  return "";
}

/** Registered claim names (RFC 7519 §4.1) shown as hints next to the keys. */
export const CLAIM_LABELS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires",
  nbf: "Not before",
  iat: "Issued at",
  jti: "JWT ID",
  alg: "Algorithm",
  typ: "Type",
  kid: "Key ID",
  cty: "Content type",
};

export const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMTAyNCIsIm5hbWUiOiJBZGEgTG92ZWxhY2UiLCJlbWFpbCI6ImFkYUBkZXZzY3JhdGNocGFkLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NzIyNTYwMCwibmJmIjoxNzY3MjI1NjAwLCJleHAiOjIwODI3NTg0MDB9.kJoIOx39qaJPjxHoq9Q3OfUwnMmELfWz8zpRqPSrv1Y";

/** HMAC secret the sample token is signed with. */
export const SAMPLE_JWT_SECRET = "devscratchpad-demo-secret";
