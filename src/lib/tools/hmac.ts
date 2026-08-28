import CryptoJS from 'crypto-js';

export type HmacAlgorithm = 'SHA256' | 'SHA512' | 'SHA384' | 'SHA224' | 'SHA1' | 'MD5';

export function generateHmac(
  secret: string,
  payload: string,
  algo: HmacAlgorithm | string = 'SHA256'
): { hex: string; base64: string } {
  let hmac: CryptoJS.lib.WordArray;

  switch (algo.toUpperCase()) {
    case 'SHA512':
      hmac = CryptoJS.HmacSHA512(payload, secret);
      break;
    case 'SHA384':
      hmac = CryptoJS.HmacSHA384(payload, secret);
      break;
    case 'SHA224':
      hmac = CryptoJS.HmacSHA224(payload, secret);
      break;
    case 'SHA1':
      hmac = CryptoJS.HmacSHA1(payload, secret);
      break;
    case 'MD5':
      hmac = CryptoJS.HmacMD5(payload, secret);
      break;
    case 'SHA256':
    default:
      hmac = CryptoJS.HmacSHA256(payload, secret);
      break;
  }

  return {
    hex: hmac.toString(CryptoJS.enc.Hex),
    base64: hmac.toString(CryptoJS.enc.Base64),
  };
}
