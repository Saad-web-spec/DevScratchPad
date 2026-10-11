export type HmacAlgorithm = 'SHA256' | 'SHA512' | 'SHA384' | 'SHA224' | 'SHA1' | 'MD5';
export type HmacKeyEncoding = 'utf8' | 'hex' | 'base64';

export const HMAC_ALGORITHMS: readonly HmacAlgorithm[] = ['SHA256', 'SHA512', 'SHA384', 'SHA224', 'SHA1', 'MD5'];

export function isHmacAlgorithm(value: unknown): value is HmacAlgorithm {
 return typeof value === 'string' && (HMAC_ALGORITHMS as readonly string[]).includes(value.toUpperCase());
}

export interface HmacResult {
 hex: string;
 base64: string;
 base64url: string;
}

function bytesToHex(bytes: Uint8Array): string {
 return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes: Uint8Array): string {
 let binary = '';
 for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
 return btoa(binary);
}

/** Decodes the secret according to its declared encoding. Throws a readable error on malformed input. */
export function decodeHmacKey(secret: string, encoding: HmacKeyEncoding): Uint8Array {
 if (encoding === 'hex') {
 const clean = secret.replace(/^0x/i, '').replace(/[\s:]/g, '');
 if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) {
 throw new Error('Secret is not valid hex (expected an even number of 0-9 / a-f characters).');
 }
 const out = new Uint8Array(clean.length / 2);
 for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
 return out;
 }
 if (encoding === 'base64') {
 const clean = secret.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
 if (/[^A-Za-z0-9+/=]/.test(clean)) throw new Error('Secret is not valid Base64.');
 const padded = clean.replace(/=+$/, '') + '='.repeat((4 - (clean.replace(/=+$/, '').length % 4)) % 4);
 try {
 return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
 } catch {
 throw new Error('Secret is not valid Base64.');
 }
 }
 return new TextEncoder().encode(secret);
}

/**
 * HMAC over the UTF-8 payload. @noble/hashes is loaded on first use so the
 * hash implementations stay out of the initial page bundle.
 */
export async function generateHmac(
 secret: string,
 payload: string,
 algo: HmacAlgorithm | string = 'SHA256',
 keyEncoding: HmacKeyEncoding = 'utf8'
): Promise<HmacResult> {
 const key = decodeHmacKey(secret, keyEncoding);
 const [{ hmac }, sha2, legacy] = await Promise.all([
 import('@noble/hashes/hmac.js'),
 import('@noble/hashes/sha2.js'),
 import('@noble/hashes/legacy.js'),
 ]);

 const hashFn = (() => {
 switch (algo.toUpperCase()) {
 case 'SHA512':
 return sha2.sha512;
 case 'SHA384':
 return sha2.sha384;
 case 'SHA224':
 return sha2.sha224;
 case 'SHA1':
 return legacy.sha1;
 case 'MD5':
 return legacy.md5;
 case 'SHA256':
 default:
 return sha2.sha256;
 }
 })();

 const mac = hmac(hashFn, key, new TextEncoder().encode(payload));
 const base64 = bytesToBase64(mac);
 return {
 hex: bytesToHex(mac),
 base64,
 base64url: base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
 };
}

/**
 * Pulls the signature out of common webhook header shapes:
 * "sha256=<hex>", "v1=<hex>", Stripe's "t=123,v1=<hex>", or a bare digest.
 */
export function extractSignatureCandidates(header: string): string[] {
 const trimmed = header.trim();
 if (!trimmed) return [];
 const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
 const candidates: string[] = [];
 for (const part of parts) {
 const m = /^([a-z0-9-]+)=(.+)$/i.exec(part);
 if (m) {
 // Skip timestamps / nonces (t=..., ts=...) – they are not digests.
 if (/^(t|ts|timestamp|nonce)$/i.test(m[1])) continue;
 candidates.push(m[2].trim());
 } else {
 candidates.push(part);
 }
 }
 return candidates;
}

/** Length-independent comparison so a mismatch does not leak how many leading characters matched. */
export function safeEqual(a: string, b: string): boolean {
 const len = Math.max(a.length, b.length);
 let diff = a.length ^ b.length;
 for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
 return diff === 0;
}
