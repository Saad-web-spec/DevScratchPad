export interface JwtDecodeResult {
  valid: boolean;
  header?: string;
  payload?: string;
  signature?: string;
  error?: string;
}

function base64UrlDecode(str: string): string {
  // Convert Base64Url to standard Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export function decodeJwt(token: string): JwtDecodeResult {
  if (!token || token.trim() === '') {
    return { valid: true };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT format (must have 3 parts separated by dots)' };
  }

  try {
    const rawHeader = base64UrlDecode(parts[0]);
    const rawPayload = base64UrlDecode(parts[1]);
    
    // Parse as JSON to pretty print and to manipulate dates
    const headerObj = JSON.parse(rawHeader);
    const payloadObj = JSON.parse(rawPayload);

    // Format timestamps for common claims
    const timeClaims = ['exp', 'iat', 'nbf'];
    for (const claim of timeClaims) {
      if (typeof payloadObj[claim] === 'number') {
        const date = new Date(payloadObj[claim] * 1000);
        // We append a human-readable string to the output without breaking the JSON validity (or we just let the UI handle it)
        // Wait, it's better to just add a separate key or just let the JSON stringify output be formatted, 
        // but user requested: "automatically convert those unix epoch numbers into human-readable ISO date strings inside the output display"
        payloadObj[`${claim}_human_readable`] = date.toISOString();
      }
    }

    const headerPretty = JSON.stringify(headerObj, null, 2);
    const payloadPretty = JSON.stringify(payloadObj, null, 2);

    return {
      valid: true,
      header: headerPretty,
      payload: payloadPretty,
      signature: parts[2]
    };
  } catch (err: any) {
    return { valid: false, error: `Failed to decode JWT: ${err.message}` };
  }
}
