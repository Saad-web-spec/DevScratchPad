export function formatXml(xml: string, indentSize: number = 2): string {
 if (!xml || xml.trim() ==="") return"";

 const indentStr ="".repeat(indentSize);
 let formatted ="";
 let pad = 0;

 // Normalize newlines and collapse whitespace between tags
 const clean = xml
 .replace(/(>)\s*(<)/g,"$1\n$2")
 .replace(/\r\n|\r/g,"\n")
 .trim();

 const lines = clean.split("\n");

 for (let i = 0; i < lines.length; i++) {
 const line = lines[i].trim();
 if (!line) continue;

 // Closing tag: </tag>
 if (/^<\/[^>]+>/.test(line)) {
 if (pad > 0) pad--;
 }

 formatted += indentStr.repeat(pad) + line +"\n";

 // Opening tag that doesn't close on the same line and isn't self-closing / declaration / comment / CDATA
 const isOpeningTag =
 /^<[^!?/][^>]*[^\/]?>/.test(line) &&
 !/<\/[^>]+>$/.test(line) &&
 !/\/>$/.test(line) &&
 !/^<!--/.test(line) &&
 !/^<\?xml/.test(line) &&
 !/^<!\[CDATA\[/.test(line);

 if (isOpeningTag) {
 pad++;
 }
 }

 return formatted.trimEnd();
}

export function minifyXml(xml: string): string {
 if (!xml || xml.trim() ==="") return"";

 return xml
 .replace(/\r?\n|\r/g,"")
 .replace(/>\s+</g,"><")
 .replace(/\s+/g,"")
 .replace(/>\s+/g,">")
 .replace(/\s+</g,"<")
 .trim();
}

export function validateXml(xml: string): {
 valid: boolean;
 error?: string;
 line?: number;
} {
 if (!xml || xml.trim() ==="") {
 return { valid: true };
 }

 if (typeof DOMParser !=="undefined") {
 try {
 const parser = new DOMParser();
 const doc = parser.parseFromString(xml,"application/xml");
 const parserError = doc.querySelector("parsererror");
 if (parserError) {
 const fullError = parserError.textContent ||"Invalid XML format";
 let line: number | undefined;
 const lineMatch =
 fullError.match(/line\s+(\d+)/i) ||
 fullError.match(/error on line (\d+)/i);
 if (lineMatch && lineMatch[1]) {
 line = parseInt(lineMatch[1], 10);
 }
 let cleanMsg = fullError.split("\n")[0].trim();
 cleanMsg = cleanMsg.replace(/^This page contains the following errors:\s*/i,"");
 return { valid: false, error: cleanMsg, line };
 }
 return { valid: true };
 } catch (err: any) {
 return { valid: false, error: err.message ||"Invalid XML"};
 }
 }

 // Basic fallback checks
 const openTags: string[] = [];
 const tagRegex = /<(\/)?([a-zA-Z0-9_\-:]+)(?:\s+[^>]*?)?(\/)?>/g;
 let match: RegExpExecArray | null;

 while ((match = tagRegex.exec(xml)) !== null) {
 const isClose = !!match[1];
 const tagName = match[2];
 const isSelfClosing = !!match[3];

 if (
 tagName.toLowerCase() ==="xml"||
 tagName.startsWith("!") ||
 tagName.startsWith("?")
 ) {
 continue;
 }

 if (isSelfClosing) {
 continue;
 }

 if (isClose) {
 const last = openTags.pop();
 if (last !== tagName) {
 return {
 valid: false,
 error: `Mismatched closing tag </${tagName}>. Expected </${last ||"none"}>`,
 };
 }
 } else {
 openTags.push(tagName);
 }
 }

 if (openTags.length > 0) {
 return {
 valid: false,
 error: `Unclosed tag: <${openTags[openTags.length - 1]}>`,
 };
 }

 return { valid: true };
}
