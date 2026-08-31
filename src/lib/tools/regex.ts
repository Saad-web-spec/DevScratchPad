export interface RegexMatch {
 match: string;
 index: number;
 length: number;
 groups?: Record<string, string>;
 captures?: string[];
}

export interface RegexTestResult {
 valid: boolean;
 error?: string;
 matches: RegexMatch[];
 matchCount: number;
}

export function testRegex(
 pattern: string,
 flags: string,
 text: string
): RegexTestResult {
 if (!pattern) {
 return { valid: true, matches: [], matchCount: 0 };
 }

 try {
 const cleanFlags = flags.replace(/[^gimsuy]/g,"");
 const hasGlobal = cleanFlags.includes("g");
 const activeFlags = hasGlobal ? cleanFlags : cleanFlags +"g";
 const regex = new RegExp(pattern, activeFlags);

 const matches: RegexMatch[] = [];
 let match: RegExpExecArray | null;
 let iterations = 0;
 const maxMatches = 1000;

 while ((match = regex.exec(text)) !== null && iterations < maxMatches) {
 iterations++;
 matches.push({
 match: match[0],
 index: match.index,
 length: match[0].length,
 groups: match.groups ? { ...match.groups } : undefined,
 captures: match.slice(1),
 });

 if (!hasGlobal) {
 break;
 }

 // Avoid infinite loop if zero-width match occurs
 if (match[0].length === 0) {
 regex.lastIndex++;
 }
 }

 return {
 valid: true,
 matches,
 matchCount: matches.length,
 };
 } catch (err: any) {
 return {
 valid: false,
 error: err.message ||"Invalid regular expression pattern",
 matches: [],
 matchCount: 0,
 };
 }
}

export function replaceRegex(
 pattern: string,
 flags: string,
 text: string,
 replacement: string
): { valid: boolean; result: string; error?: string } {
 if (!pattern) {
 return { valid: true, result: text };
 }

 try {
 const cleanFlags = flags.replace(/[^gimsuy]/g,"");
 const regex = new RegExp(pattern, cleanFlags);
 const result = text.replace(regex, replacement);
 return { valid: true, result };
 } catch (err: any) {
 return {
 valid: false,
 result:"",
 error: err.message ||"Invalid regular expression replacement",
 };
 }
}
