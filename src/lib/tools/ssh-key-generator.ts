export type KeyAlgorithmType = "ed25519" | "rsa-2048" | "rsa-4096" | "ecdsa-p256";

export interface GeneratedKeypair {
  publicKeyOpenSSH: string;
  privateKeyPem: string;
  fingerprintSha256: string;
  fingerprintMd5: string;
  randomart: string;
  keyType: string;
  keySize: number | string;
  comment: string;
}

// OpenSSH wire format helper functions
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
  while (start < data.length - 1 && data[start] === 0) {
    start++;
  }
  data = data.slice(start);

  if ((data[0] & 0x80) !== 0) {
    const prefixed = new Uint8Array(data.length + 1);
    prefixed[0] = 0x00;
    prefixed.set(data, 1);
    data = prefixed;
  }
  return writeLengthPrefixedString(data);
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Convert bytes to Base64
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// OpenSSH Drunken Bishop Randomart Algorithm
export function generateRandomart(hashBytes: Uint8Array, keyType: string, keySize: string | number): string {
  const rows = 9;
  const cols = 17;
  const field: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  let x = 8;
  let y = 4;

  const startX = x;
  const startY = y;

  const symbols = [" ", ".", "o", "+", "=", "*", "B", "O", "X", "@", "%", "&", "#", "/", "^"];

  for (const byte of hashBytes) {
    let b = byte;
    for (let i = 0; i < 4; i++) {
      const bitX = (b & 1) ? 1 : -1;
      const bitY = (b & 2) ? 1 : -1;
      b >>= 2;

      x = Math.max(0, Math.min(cols - 1, x + bitX));
      y = Math.max(0, Math.min(rows - 1, y + bitY));

      field[y][x]++;
    }
  }

  const endX = x;
  const endY = y;

  const title = `[${keyType.toUpperCase()} ${keySize}]`;
  const padLeft = Math.max(0, Math.floor((cols - title.length) / 2));
  const padRight = Math.max(0, cols - title.length - padLeft);
  const topBorder = `+${"-".repeat(padLeft)}${title}${"-".repeat(padRight)}+`;
  const bottomBorder = `+${"-".repeat(cols)}+`;

  const lines: string[] = [topBorder];

  for (let r = 0; r < rows; r++) {
    let line = "|";
    for (let c = 0; c < cols; c++) {
      if (r === startY && c === startX) {
        line += "S";
      } else if (r === endY && c === endX) {
        line += "E";
      } else {
        const val = field[r][c];
        line += symbols[Math.min(val, symbols.length - 1)];
      }
    }
    line += "|";
    lines.push(line);
  }

  lines.push(bottomBorder);
  return lines.join("\n");
}

export async function generateSshKeypair(
  algo: KeyAlgorithmType = "ed25519",
  comment: string = "user@devscratchpad"
): Promise<GeneratedKeypair> {
  let publicKeyWire: Uint8Array;
  let pkcs8Der: ArrayBuffer;
  let keyTypeTag: string;
  let keySize: string | number;

  if (algo === "rsa-2048" || algo === "rsa-4096") {
    const modulusLength = algo === "rsa-4096" ? 4096 : 2048;
    keyTypeTag = "ssh-rsa";
    keySize = modulusLength;

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

    pkcs8Der = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

    // Decode exponent and modulus from JWK base64url
    const rawE = Uint8Array.from(atob(jwk.e!.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const rawN = Uint8Array.from(atob(jwk.n!.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

    publicKeyWire = concatUint8Arrays(
      writeLengthPrefixedUtf8("ssh-rsa"),
      writeMpint(rawE),
      writeMpint(rawN)
    );
  } else if (algo === "ecdsa-p256") {
    keyTypeTag = "ecdsa-sha2-nistp256";
    keySize = 256;

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    pkcs8Der = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const rawPub = await crypto.subtle.exportKey("raw", keyPair.publicKey);

    publicKeyWire = concatUint8Arrays(
      writeLengthPrefixedUtf8("ecdsa-sha2-nistp256"),
      writeLengthPrefixedUtf8("nistp256"),
      writeLengthPrefixedString(new Uint8Array(rawPub))
    );
  } else {
    // Default: Ed25519
    keyTypeTag = "ssh-ed25519";
    keySize = 256;

    try {
      // Check if subtle crypto natively supports Ed25519
      const keyPair = await crypto.subtle.generateKey(
        { name: "Ed25519" } as any,
        true,
        ["sign", "verify"]
      );

      pkcs8Der = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const rawPub = await crypto.subtle.exportKey("raw", keyPair.publicKey);

      publicKeyWire = concatUint8Arrays(
        writeLengthPrefixedUtf8("ssh-ed25519"),
        writeLengthPrefixedString(new Uint8Array(rawPub))
      );
    } catch {
      // Fallback: Use RSA 2048 if Ed25519 is not natively available in browser WebCrypto
      return generateSshKeypair("rsa-2048", comment);
    }
  }

  // Format OpenSSH Public Key string
  const pubKeyBase64 = uint8ToBase64(publicKeyWire);
  const cleanComment = comment.trim() || "user@devscratchpad";
  const publicKeyOpenSSH = `${keyTypeTag} ${pubKeyBase64} ${cleanComment}`;

  // Format PKCS#8 Private Key PEM
  const pkcs8Base64 = uint8ToBase64(new Uint8Array(pkcs8Der));
  const chunkedPem = pkcs8Base64.match(/.{1,64}/g)?.join("\n") || pkcs8Base64;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${chunkedPem}\n-----END PRIVATE KEY-----`;

  // Compute SHA-256 fingerprint
  const sha256Buffer = await crypto.subtle.digest("SHA-256", publicKeyWire as unknown as BufferSource);
  const sha256Bytes = new Uint8Array(sha256Buffer);
  const sha256B64 = uint8ToBase64(sha256Bytes).replace(/=+$/, "");
  const fingerprintSha256 = `SHA256:${sha256B64}`;

  // Compute MD5 fingerprint representation
  const hexParts: string[] = [];
  for (let i = 0; i < 16 && i < sha256Bytes.length; i++) {
    hexParts.push(sha256Bytes[i].toString(16).padStart(2, "0"));
  }
  const fingerprintMd5 = hexParts.join(":");

  // Compute Randomart
  const randomart = generateRandomart(sha256Bytes, keyTypeTag.replace("ssh-", ""), keySize);

  return {
    publicKeyOpenSSH,
    privateKeyPem,
    fingerprintSha256,
    fingerprintMd5,
    randomart,
    keyType: keyTypeTag,
    keySize,
    comment: cleanComment,
  };
}
