import CryptoJS from 'crypto-js';

export function generateHmac(secret: string, payload: string, algo: 'SHA256' | 'SHA512'): { hex: string; base64: string } {
  const hmac = algo === 'SHA512' ? CryptoJS.HmacSHA512(payload, secret) : CryptoJS.HmacSHA256(payload, secret);
  return {
    hex: hmac.toString(CryptoJS.enc.Hex),
    base64: hmac.toString(CryptoJS.enc.Base64),
  };
}
