export interface TimestampResult {
 valid: boolean;
 unixMs?: number;
 unixSeconds?: number;
 utcString?: string;
 localString?: string;
 isoString?: string;
 relativeString?: string;
 error?: string;
}

export function parseTimestamp(input: string): TimestampResult {
 if (!input || input.trim() === '') {
 return { valid: true };
 }

 try {
 const num = Number(input);
 let date: Date;

 if (!isNaN(num)) {
 // It's a number. Check if it's seconds or milliseconds.
 // 10,000,000,000 in seconds is year 2286. 
 // If it's larger than that, we assume milliseconds.
 const isSeconds = num < 10000000000;
 date = new Date(isSeconds ? num * 1000 : num);
 } else {
 // Try to parse as an ISO date string or generic date string
 date = new Date(input);
 }

 if (isNaN(date.getTime())) {
 return { valid: false, error: 'Invalid timestamp or date format' };
 }

 const unixMs = date.getTime();
 const unixSeconds = Math.floor(unixMs / 1000);
 
 // Calculate relative string
 const now = new Date().getTime();
 const diffSeconds = (unixMs - now) / 1000;
 
 let relativeString ="";
 const absDiff = Math.abs(diffSeconds);
 const isFuture = diffSeconds > 0;
 const prefix = isFuture ? 'in ' : '';
 const suffix = isFuture ? '' : ' ago';

 if (absDiff < 60) {
 relativeString = `${prefix}${Math.floor(absDiff)} seconds${suffix}`;
 } else if (absDiff < 3600) {
 relativeString = `${prefix}${Math.floor(absDiff / 60)} minutes${suffix}`;
 } else if (absDiff < 86400) {
 relativeString = `${prefix}${Math.floor(absDiff / 3600)} hours${suffix}`;
 } else if (absDiff < 2592000) {
 relativeString = `${prefix}${Math.floor(absDiff / 86400)} days${suffix}`;
 } else if (absDiff < 31536000) {
 relativeString = `${prefix}${Math.floor(absDiff / 2592000)} months${suffix}`;
 } else {
 relativeString = `${prefix}${Math.floor(absDiff / 31536000)} years${suffix}`;
 }

 return {
 valid: true,
 unixMs,
 unixSeconds,
 utcString: date.toUTCString(),
 localString: date.toString(),
 isoString: date.toISOString(),
 relativeString
 };
 } catch (err: any) {
 return { valid: false, error: `Failed to parse date: ${err.message}` };
 }
}
