/** Delimiters whose surrounding spaces can be dropped at the top level of a stylesheet. */
const CSS_TIGHT_TOP = "{};:,>+~";
/** Inside parentheses only these are safe: `calc(1px + 2px)` needs its spaces around + and -. */
const CSS_TIGHT_PARENS = ",:";

export function minifyCss(css: string): string {
 if (!css) return"";
 const src = css
 .replace(/\/\*[\s\S]*?\*\//g,"") // Strip CSS block comments
 .replace(/\s+/g," ") // Collapse multiple whitespace characters into one
 .trim();

 // Remove unnecessary spaces around CSS delimiters, leaving quoted strings and calc() math intact
 let out ="";
 let depth = 0;
 let quote: string | null = null;
 for (let i = 0; i < src.length; i++) {
 const ch = src[i];
 if (quote) {
 out += ch;
 if (ch ==="\\"&& i + 1 < src.length) out += src[++i];
 else if (ch === quote) quote = null;
 continue;
 }
 if (ch ==='"'|| ch ==="'") {
 quote = ch;
 out += ch;
 continue;
 }
 if (ch ==="(") depth++;
 else if (ch ===")") depth = Math.max(0, depth - 1);
 if (ch ===" ") {
 const tight = depth > 0 ? CSS_TIGHT_PARENS : CSS_TIGHT_TOP;
 const prev = out[out.length - 1];
 const next = src[i + 1];
 if ((prev && tight.includes(prev)) || (next && tight.includes(next))) continue;
 }
 out += ch;
 }
 return out.replace(/;}/g,"}"); // Remove redundant trailing semicolons before closing brackets
}

export function minifySvg(svg: string): string {
 if (!svg) return"";
 return svg
 .replace(/<!--[\s\S]*?-->/g,"") // Strip XML/HTML comments
 .replace(/>\s+</g,"><") // Remove whitespace between tags
 .replace(/\s{2,}/g," ") // Collapse multiple spaces
 .replace(/\s*=\s*/g,"=") // Remove spaces around attribute equal signs
 .trim();
}

/** Block-level tags: whitespace around them never renders, so it can be dropped entirely. */
const HTML_BLOCK_TAGS =
  "html|head|body|title|meta|link|base|div|p|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|td|th|caption|colgroup|col|section|article|header|footer|nav|main|aside|figure|figcaption|h[1-6]|hr|br|form|fieldset|legend|select|option|optgroup|blockquote|details|summary|dialog|template|noscript|svg|video|audio|source|picture|iframe|canvas";
const HTML_BLOCK_RE = new RegExp(`\\s*(<\\/?(?:${HTML_BLOCK_TAGS})\\b[^>]*>)\\s*`, "gi");

/**
 * Minify HTML: drops comments (IE conditional comments are kept), collapses whitespace,
 * and removes whitespace around block-level tags. Inline whitespace collapses to one space
 * so `<b>a</b> <i>b</i>` still renders with its gap. `<pre>`, `<textarea>` and `<script>`
 * are left untouched; `<style>` contents are CSS-minified.
 */
export function minifyHtml(html: string): string {
  if (!html) return "";
  const kept: string[] = [];
  const protect = (block: string) => {
    kept.push(block);
    return `\u0000${kept.length - 1}\u0000`;
  };
  const withPlaceholders = html.replace(/<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (block: string, tag: string) => {
    if (tag.toLowerCase() === "style") {
      const parts = block.match(/^(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)$/i);
      if (parts) return protect(parts[1] + minifyCss(parts[2]) + parts[3]);
    }
    return protect(block);
  });
  return withPlaceholders
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(HTML_BLOCK_RE, "$1")
    .trim()
    .replace(/\u0000(\d+)\u0000/g, (_match: string, index: string) => kept[Number(index)]);
}

export function validateCss(css: string): { valid: boolean; error?: string } {
 if (!css || css.trim() ==="") return { valid: true };
 let openBraces = 0;
 for (let i = 0; i < css.length; i++) {
 if (css[i] ==="{") openBraces++;
 if (css[i] ==="}") openBraces--;
 if (openBraces < 0) {
 return { valid: false, error: 'Unexpected closing brace "}"' };
 }
 }
 if (openBraces > 0) {
 return { valid: false, error: 'Unclosed brace "{"' };
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

export function validateHtml(html: string): { valid: boolean; error?: string } {
  if (!html || html.trim() === "") return { valid: true };
  if (!/<[a-z!/]/i.test(html)) {
    return { valid: false, error: "Invalid HTML: no tags found" };
  }
  return { valid: true };
}
