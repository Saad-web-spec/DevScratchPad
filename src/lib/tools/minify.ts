export function minifyCss(css: string): string {
 if (!css) return"";
 return css
 .replace(/\/\*[\s\S]*?\*\//g,"") // Strip CSS block comments
 .replace(/\s+/g,"") // Collapse multiple whitespace characters into one
 .replace(/\s*([{}:;,>+~])\s*/g,"$1") // Remove unnecessary spaces around CSS delimiters
 .replace(/;}/g,"}") // Remove redundant trailing semicolons before closing brackets
 .trim();
}

export function minifySvg(svg: string): string {
 if (!svg) return"";
 return svg
 .replace(/<!--[\s\S]*?-->/g,"") // Strip XML/HTML comments
 .replace(/>\s+</g,"><") // Remove whitespace between tags
 .replace(/\s{2,}/g,"") // Collapse multiple spaces
 .replace(/\s*=\s*/g,"=") // Remove spaces around attribute equal signs
 .trim();
}

export function validateCss(css: string): { valid: boolean; error?: string } {
 if (!css || css.trim() ==="") return { valid: true };
 let openBraces = 0;
 for (let i = 0; i < css.length; i++) {
 if (css[i] ==="{") openBraces++;
 if (css[i] ==="}") openBraces--;
 if (openBraces < 0) {
 return { valid: false, error: 'Unexpected closing brace"}"' };
 }
 }
 if (openBraces > 0) {
 return { valid: false, error: 'Unclosed brace"{"' };
 }
 return { valid: true };
}

export function validateSvg(svg: string): { valid: boolean; error?: string } {
 if (!svg || svg.trim() ==="") return { valid: true };
 if (!svg.includes("<svg") || !svg.includes("</svg>")) {
 // If it doesn't look like SVG or has basic tag mismatch
 if (!svg.includes("<") || !svg.includes(">")) {
 return { valid: false, error:"Invalid SVG format: missing XML/SVG tags"};
 }
 }
 return { valid: true };
}
