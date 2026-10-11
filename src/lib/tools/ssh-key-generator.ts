import SparkMD5 from "spark-md5";

export type KeyAlgorithmType = "ed25519" | "rsa-2048" | "rsa-4096" | "ecdsa-p256";

/** OpenSSH key type names as they appear in public key lines and wire blobs. */
export type SshKeyType = "ssh-ed25519" | "ssh-rsa" | "ecdsa-sha2-nistp256";

export interface GeneratedKeypair {
  /** Algorithm that was actually generated (differs from `requestedAlgorithm` after a fallback). */
  algorithm: KeyAlgorithmType;
  requestedAlgorithm: KeyAlgorithmType;
  /** True when the browser could not generate the requested algorithm and RSA 2048 was used instead. */
  fellBack: boolean;
  keyType: SshKeyType;
  /** Bits as reported by `ssh-keygen -l` (256 for Ed25519 / P-256, modulus bits for RSA). */
  keySize: number;
  comment: string;
  /** `<type> <base64 blob> [comment]`, the content of `id_*.pub`. */
  publicKeyOpenSSH: string;
  /** `-----BEGIN OPENSSH PRIVATE KEY-----` (openssh-key-v1, unencrypted), the content of `~/.ssh/id_*`. */
  privateKeyOpenSSH: string;
  /** `-----BEGIN PRIVATE KEY-----` (PKCS#8 PEM) for tools that expect OpenSSL-style keys. */
  privateKeyPem: string;
  /** `SHA256:<base64 without padding>`, same as `ssh-keygen -lf key.pub`. */
  fingerprintSha256: string;
  /** `MD5:aa:bb:...`, same as `ssh-keygen -l -E md5 -f key.pub`. */
  fingerprintMd5: string;
  /** Drunken-bishop randomart, same as `ssh-keygen -lv -f key.pub`. */
  randomart: string;
  /** Raw key material used to rebuild the comment-bearing strings without regenerating the key. */
  material: KeyMaterial;
}

export interface KeyMaterial {
  /** Public key wire blob (what the base64 in the public key line decodes to). */
  publicBlob: Uint8Array;
  /** Key-specific private fields of the openssh-key-v1 private section, without the comment. */
  privateFields: Uint8Array;
  /** Random check integer written twice at the start of the private section. */
  checkint: number;
}

// OpenSSH wire format helper functions
function writeUint32(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, value >>> 0, false); // big-endian
  return buf;
}

function writeLengthPrefixedString(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const buf = new Uint8Array(4 + len);
  new DataView(buf.buffer).setUint32(0, len, false); // big-endian
  buf.set(bytes, 4);
  return buf;
}

function writeLengthPrefixedUtf8(str: string): Uint8Array {
  return writeLengthPrefixedString(new TextEncoder().encode(str));
}

function writeMpint(bytes: Uint8Array): Uint8Array {
  // If first byte has high bit set, prefix with 0x00
  let data = bytes;
  // Trim leading zeroes unless necessary
  let start = 0;
  while (start < data.length && data[start] === 0) {
    start++;
  }
  data = data.slice(start);
  // Zero is encoded as an empty string
  if (data.length === 0) return writeLengthPrefixedString(data);

  if ((data[0] & 0x80) !== 0) {
    const prefixed = new Uint8Array(data.length + 1);
    prefixed[0] = 0x00;
    prefixed.set(data, 1);
    data = prefixed;
  }
  return writeLengthPrefixedString(data);
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/** Copies bytes into a fresh ArrayBuffer (WebCrypto / SparkMD5 want a plain ArrayBuffer). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

// Convert bytes to Base64
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Decodes a JWK base64url member (no padding) to bytes. */
function base64UrlToUint8(b64url: string | undefined, member: string): Uint8Array {
  if (!b64url) throw new Error(`Exported JWK is missing "${member}"`);
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return base64ToUint8(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

function wrapLines(text: string, width: number): string {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += width) lines.push(text.slice(i, i + width));
  return lines.join("\n");
}

/** Strips control characters and surrounding whitespace so the comment stays on one line. */
export function sanitizeComment(comment: string): string {
  // eslint-disable-next-line no-control-regex
  return comment.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

const RANDOMART_TITLES: Record<SshKeyType, string> = {
  "ssh-ed25519": "ED25519",
  "ssh-rsa": "RSA",
  "ecdsa-sha2-nistp256": "ECDSA",
};

/**
 * OpenSSH Drunken Bishop Randomart Algorithm (port of `fingerprint_randomart` in sshkey.c).
 * `keyType` is the ssh-keygen label ("ED25519", "RSA", "ECDSA"); `hashName` labels the footer.
 */
export function generateRandomart(
  hashBytes: Uint8Array,
  keyType: string,
  keySize: string | number,
  hashName = "SHA256"
): string {
  const rows = 9;
  const cols = 17;
  // Chars used each time the bishop lands on a cell again; the last two mark start and end.
  const augmentation = " .o+=*BOX@%&#/^SE";
  const maxIndex = augmentation.length - 1; // 16 = "E"
  const field: number[][] = Array.from({ length: cols }, () => Array<number>(rows).fill(0));

  let x = Math.floor(cols / 2);
  let y = Math.floor(rows / 2);

  for (const byte of hashBytes) {
    let b = byte;
    // Each byte conveys four 2-bit move commands
    for (let i = 0; i < 4; i++) {
      x += b & 1 ? 1 : -1;
      y += b & 2 ? 1 : -1;
      b >>= 2;

      x = Math.max(0, Math.min(cols - 1, x));
      y = Math.max(0, Math.min(rows - 1, y));

      if (field[x][y] < maxIndex - 2) field[x][y]++;
    }
  }

  // Mark start and end (end wins when they coincide, as in ssh-keygen)
  field[Math.floor(cols / 2)][Math.floor(rows / 2)] = maxIndex - 1;
  field[x][y] = maxIndex;

  const border = (label: string) => {
    const text = label.length > cols ? label.slice(0, cols) : label;
    const left = Math.floor((cols - text.length) / 2);
    return `+${"-".repeat(left)}${text}${"-".repeat(cols - text.length - left)}+`;
  };

  let title = `[${keyType.toUpperCase()} ${keySize}]`;
  if (title.length > cols) title = `[${keyType.toUpperCase()}]`;

  const lines: string[] = [border(title)];
  for (let r = 0; r < rows; r++) {
    let line = "|";
    for (let c = 0; c < cols; c++) line += augmentation[Math.min(field[c][r], maxIndex)];
    lines.push(`${line}|`);
  }
  lines.push(border(`[${hashName}]`));
  return lines.join("\n");
}

/** `SHA256:<base64 without padding>` over the public key blob. */
export async function sha256Fingerprint(publicBlob: Uint8Array): Promise<{ text: string; digest: Uint8Array }> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", toArrayBuffer(publicBlob)));
  return { text: `SHA256:${uint8ToBase64(digest).replace(/=+$/, "")}`, digest };
}

/** `MD5:aa:bb:...` over the public key blob (WebCrypto has no MD5, so SparkMD5 does it). */
export function md5Fingerprint(publicBlob: Uint8Array): string {
  const hex = SparkMD5.ArrayBuffer.hash(toArrayBuffer(publicBlob));
  return `MD5:${hex.match(/../g)?.join(":") ?? hex}`;
}

/** `<type> <base64 blob> [comment]`. An empty comment leaves the third field out. */
export function formatPublicKeyLine(keyType: SshKeyType, publicBlob: Uint8Array, comment: string): string {
  const clean = sanitizeComment(comment);
  return `${keyType} ${uint8ToBase64(publicBlob)}${clean ? ` ${clean}` : ""}`;
}

const OPENSSH_MAGIC = "openssh-key-v1\0";
const OPENSSH_BLOCK_SIZE = 8; // cipher "none"

/**
 * Serializes an unencrypted openssh-key-v1 private key (what `ssh-keygen -N ""` writes).
 * Layout per PROTOCOL.key: magic, cipher "none", kdf "none", empty kdf options, one key,
 * public blob, then the private section (checkint x2, key fields, comment, padding 1,2,3...).
 */
export function formatOpenSshPrivateKey(material: KeyMaterial, comment: string): string {
  const privateSection = concatUint8Arrays(
    writeUint32(material.checkint),
    writeUint32(material.checkint),
    material.privateFields,
    writeLengthPrefixedUtf8(sanitizeComment(comment))
  );
  const padLen = (OPENSSH_BLOCK_SIZE - (privateSection.length % OPENSSH_BLOCK_SIZE)) % OPENSSH_BLOCK_SIZE;
  const padding = Uint8Array.from({ length: padLen }, (_, i) => i + 1);

  const body = concatUint8Arrays(
    new TextEncoder().encode(OPENSSH_MAGIC),
    writeLengthPrefixedUtf8("none"),
    writeLengthPrefixedUtf8("none"),
    writeLengthPrefixedString(new Uint8Array(0)),
    writeUint32(1),
    writeLengthPrefixedString(material.publicBlob),
    writeLengthPrefixedString(concatUint8Arrays(privateSection, padding))
  );

  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrapLines(uint8ToBase64(body), 70)}\n-----END OPENSSH PRIVATE KEY-----\n`;
}

function formatPkcs8Pem(pkcs8Der: ArrayBuffer): string {
  return `-----BEGIN PRIVATE KEY-----\n${wrapLines(uint8ToBase64(new Uint8Array(pkcs8Der)), 64)}\n-----END PRIVATE KEY-----\n`;
}

/** Returns a copy of the keypair whose public line and OpenSSH private key carry `comment`. */
export function applyComment(keypair: GeneratedKeypair, comment: string): GeneratedKeypair {
  const clean = sanitizeComment(comment);
  if (clean === keypair.comment) return keypair;
  return {
    ...keypair,
    comment: clean,
    publicKeyOpenSSH: formatPublicKeyLine(keypair.keyType, keypair.material.publicBlob, clean),
    privateKeyOpenSSH: formatOpenSshPrivateKey(keypair.material, clean),
  };
}

function randomCheckint(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

interface RawKey {
  algorithm: KeyAlgorithmType;
  keyType: SshKeyType;
  keySize: number;
  publicBlob: Uint8Array;
  privateFields: Uint8Array;
  pkcs8Der: ArrayBuffer;
}

async function generateRsa(algorithm: "rsa-2048" | "rsa-4096"): Promise<RawKey> {
  const modulusLength = algorithm === "rsa-4096" ? 4096 : 2048;
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const [pkcs8Der, jwk] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
  ]);

  const n = base64UrlToUint8(jwk.n, "n");
  const e = base64UrlToUint8(jwk.e, "e");
  const ssh = writeLengthPrefixedUtf8("ssh-rsa");

  return {
    algorithm,
    keyType: "ssh-rsa",
    keySize: modulusLength,
    publicBlob: concatUint8Arrays(ssh, writeMpint(e), writeMpint(n)),
    // ssh-rsa private fields: n, e, d, iqmp, p, q
    privateFields: concatUint8Arrays(
      ssh,
      writeMpint(n),
      writeMpint(e),
      writeMpint(base64UrlToUint8(jwk.d, "d")),
      writeMpint(base64UrlToUint8(jwk.qi, "qi")),
      writeMpint(base64UrlToUint8(jwk.p, "p")),
      writeMpint(base64UrlToUint8(jwk.q, "q"))
    ),
    pkcs8Der,
  };
}

async function generateEcdsaP256(): Promise<RawKey> {
  const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);

  const [pkcs8Der, jwk] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
  ]);

  // Uncompressed point Q = 0x04 || x || y
  const q = concatUint8Arrays(new Uint8Array([4]), base64UrlToUint8(jwk.x, "x"), base64UrlToUint8(jwk.y, "y"));
  const type = writeLengthPrefixedUtf8("ecdsa-sha2-nistp256");
  const curve = writeLengthPrefixedUtf8("nistp256");

  return {
    algorithm: "ecdsa-p256",
    keyType: "ecdsa-sha2-nistp256",
    keySize: 256,
    publicBlob: concatUint8Arrays(type, curve, writeLengthPrefixedString(q)),
    privateFields: concatUint8Arrays(
      type,
      curve,
      writeLengthPrefixedString(q),
      writeMpint(base64UrlToUint8(jwk.d, "d"))
    ),
    pkcs8Der,
  };
}

async function generateEd25519(): Promise<RawKey> {
  const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;

  const [pkcs8Der, jwk] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
  ]);

  const pub = base64UrlToUint8(jwk.x, "x");
  const seed = base64UrlToUint8(jwk.d, "d");
  if (pub.length !== 32 || seed.length !== 32) throw new Error("Unexpected Ed25519 key length");
  const type = writeLengthPrefixedUtf8("ssh-ed25519");

  return {
    algorithm: "ed25519",
    keyType: "ssh-ed25519",
    keySize: 256,
    publicBlob: concatUint8Arrays(type, writeLengthPrefixedString(pub)),
    // OpenSSH stores the 64-byte "secret key" as seed || public key
    privateFields: concatUint8Arrays(
      type,
      writeLengthPrefixedString(pub),
      writeLengthPrefixedString(concatUint8Arrays(seed, pub))
    ),
    pkcs8Der,
  };
}

export async function generateSshKeypair(
  algo: KeyAlgorithmType = "ed25519",
  comment: string = "user@devscratchpad"
): Promise<GeneratedKeypair> {
  let raw: RawKey;
  let fellBack = false;

  if (algo === "rsa-2048" || algo === "rsa-4096") {
    raw = await generateRsa(algo);
  } else if (algo === "ecdsa-p256") {
    raw = await generateEcdsaP256();
  } else {
    // Default: Ed25519
    try {
      // Check if subtle crypto natively supports Ed25519
      raw = await generateEd25519();
    } catch {
      // Fallback: Use RSA 2048 if Ed25519 is not natively available in browser WebCrypto
      raw = await generateRsa("rsa-2048");
      fellBack = true;
    }
  }

  const cleanComment = sanitizeComment(comment);
  const material: KeyMaterial = {
    publicBlob: raw.publicBlob,
    privateFields: raw.privateFields,
    checkint: randomCheckint(),
  };

  // Compute fingerprints (SHA-256 digest also seeds the randomart, like ssh-keygen's default)
  const sha256 = await sha256Fingerprint(raw.publicBlob);

  return {
    algorithm: raw.algorithm,
    requestedAlgorithm: algo,
    fellBack,
    keyType: raw.keyType,
    keySize: raw.keySize,
    comment: cleanComment,
    publicKeyOpenSSH: formatPublicKeyLine(raw.keyType, raw.publicBlob, cleanComment),
    privateKeyOpenSSH: formatOpenSshPrivateKey(material, cleanComment),
    privateKeyPem: formatPkcs8Pem(raw.pkcs8Der),
    fingerprintSha256: sha256.text,
    fingerprintMd5: md5Fingerprint(raw.publicBlob),
    randomart: generateRandomart(sha256.digest, RANDOMART_TITLES[raw.keyType], raw.keySize),
    material,
  };
}

export interface ParsedPublicKey {
  keyType: SshKeyType;
  /** Closest generator setting for this key (RSA keys map to 2048 or 4096 by modulus size). */
  algorithm: KeyAlgorithmType;
  keySize: number;
  comment: string;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error("Truncated key blob");
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false);
}

function readString(bytes: Uint8Array, offset: number): { value: Uint8Array; next: number } {
  const len = readUint32(bytes, offset);
  const start = offset + 4;
  if (start + len > bytes.length) throw new Error("Truncated key blob");
  return { value: bytes.subarray(start, start + len), next: start + len };
}

/**
 * Parses an OpenSSH public key line (`ssh-ed25519 AAAA... comment`). Returns null when the text
 * is not a supported public key, so callers can ignore unrelated restored input.
 */
export function parseOpenSshPublicKey(text: string): ParsedPublicKey | null {
  const match = text.trim().match(/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256)\s+([A-Za-z0-9+/]+={0,2})(?:\s+(.*))?$/);
  if (!match) return null;
  const keyType = match[1] as SshKeyType;
  try {
    const blob = base64ToUint8(match[2]);
    const typeField = readString(blob, 0);
    if (new TextDecoder().decode(typeField.value) !== keyType) return null;

    let algorithm: KeyAlgorithmType;
    let keySize = 256;
    if (keyType === "ssh-rsa") {
      const e = readString(blob, typeField.next);
      const n = readString(blob, e.next).value;
      let first = 0;
      while (first < n.length && n[first] === 0) first++;
      keySize = n.length - first > 0 ? (n.length - first - 1) * 8 + (32 - Math.clz32(n[first])) : 0;
      algorithm = keySize >= 3072 ? "rsa-4096" : "rsa-2048";
    } else if (keyType === "ecdsa-sha2-nistp256") {
      algorithm = "ecdsa-p256";
    } else {
      algorithm = "ed25519";
    }
    return { keyType, algorithm, keySize, comment: sanitizeComment(match[3] ?? "") };
  } catch {
    return null;
  }
}
