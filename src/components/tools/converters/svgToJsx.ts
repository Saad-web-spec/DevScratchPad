/**
 * SVG markup to a React component, using the browser's own XML parser (no dependencies).
 * Attributes are mapped to their JSX names (class -> className, stroke-width -> strokeWidth,
 * xlink:href -> xlinkHref, style="a-b: c" -> style={{ aB: "c" }}), editor metadata and
 * namespaced junk (Inkscape, Sketch) is dropped, and scripts / event handlers are stripped.
 */

export interface SvgToJsxOptions {
  componentName: string;
  typescript: boolean;
}

export interface SvgToJsxResult {
  ok: boolean;
  code: string;
  error?: string;
  line?: number;
  column?: number;
  warnings: string[];
  /** Element count of the converted tree (status bar). */
  elements: number;
}

const MAX_LINE = 100;
const INDENT = "  ";

/** Attributes whose JSX name isn't a plain camelCase of the SVG name. */
const SPECIAL_ATTRS: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  "xlink:href": "xlinkHref",
  "xlink:title": "xlinkTitle",
  "xlink:show": "xlinkShow",
  "xlink:actuate": "xlinkActuate",
  "xlink:arcrole": "xlinkArcrole",
  "xlink:role": "xlinkRole",
  "xlink:type": "xlinkType",
  "xmlns:xlink": "xmlnsXlink",
  "xml:space": "xmlSpace",
  "xml:lang": "xmlLang",
  "xml:base": "xmlBase",
};

const DROPPED_ELEMENTS = new Set(["script", "metadata"]);

function camelCase(name: string): string {
  return name.replace(/[-:]([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
}

/** CSS property name to its React style key (vendor prefixes become Webkit…, custom properties stay quoted). */
function styleKey(prop: string): string {
  if (prop.startsWith("--")) return JSON.stringify(prop);
  const key = prop.startsWith("-ms-") ? prop.slice(1) : prop.startsWith("-") ? prop.slice(1).replace(/^[a-z]/, (c) => c.toUpperCase()) : prop;
  const camel = camelCase(key);
  return /^[A-Za-z_$][\w$]*$/.test(camel) ? camel : JSON.stringify(camel);
}

function styleObject(css: string): string {
  const entries: string[] = [];
  for (const decl of css.split(";")) {
    const idx = decl.indexOf(":");
    if (idx <= 0) continue;
    const rawProp = decl.slice(0, idx).trim();
    const prop = rawProp.startsWith("--") ? rawProp : rawProp.toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    entries.push(`${styleKey(prop)}: ${JSON.stringify(value)}`);
  }
  return entries.length ? `{{ ${entries.join(", ")} }}` : "";
}

function attrValue(value: string): string {
  return value.includes('"') || value.includes("\\") ? `{${JSON.stringify(value)}}` : `"${value}"`;
}

function componentIdentifier(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9_$]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .replace(/^[^A-Za-z_$]+/, "");
  if (!cleaned) return "SvgIcon";
  return cleaned[0].toUpperCase() + cleaned.slice(1);
}

/** JSX-safe text child: plain when harmless, otherwise a string expression. */
function textChild(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return /[{}<>]/.test(collapsed) ? `{${JSON.stringify(collapsed)}}` : collapsed;
}

interface Ctx {
  warnings: Set<string>;
  elements: number;
}

function convertAttributes(el: Element, isRoot: boolean, ctx: Ctx): string[] {
  const attrs: string[] = [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;
    const lower = name.toLowerCase();
    if (/^on/.test(lower)) {
      ctx.warnings.add(`Removed event handler attribute ${name}`);
      continue;
    }
    if (lower === "xmlns") {
      if (isRoot) attrs.push(`xmlns=${attrValue(attr.value)}`);
      continue;
    }
    if (lower === "style") {
      const obj = styleObject(attr.value);
      if (obj) attrs.push(`style=${obj}`);
      continue;
    }
    if (SPECIAL_ATTRS[lower]) {
      attrs.push(`${SPECIAL_ATTRS[lower]}=${attrValue(attr.value)}`);
      continue;
    }
    if (name.includes(":")) {
      // Editor namespaces (inkscape:, sodipodi:, sketch:, xmlns:foo) aren't valid in React
      ctx.warnings.add(`Dropped namespaced attribute ${name}`);
      continue;
    }
    const jsxName = lower.startsWith("data-") || lower.startsWith("aria-") ? lower : camelCase(name);
    attrs.push(`${jsxName}=${attrValue(attr.value)}`);
  }
  if (isRoot) attrs.push("{...props}");
  return attrs;
}

function emitElement(el: Element, depth: number, isRoot: boolean, ctx: Ctx): string[] {
  const tag = el.tagName;
  const pad = INDENT.repeat(depth);
  ctx.elements++;

  const attrs = convertAttributes(el, isRoot, ctx);
  const children: string[][] = [];
  let inlineText: string | null = null;
  const isStyle = tag.toLowerCase() === "style";

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 1) {
      const child = node as Element;
      const childTag = child.tagName.toLowerCase();
      if (DROPPED_ELEMENTS.has(childTag)) {
        ctx.warnings.add(`Removed <${child.tagName}> element`);
        continue;
      }
      if (child.tagName.includes(":")) {
        ctx.warnings.add(`Removed editor element <${child.tagName}>`);
        continue;
      }
      children.push(emitElement(child, depth + 1, false, ctx));
    } else if (node.nodeType === 3 || node.nodeType === 4) {
      const text = node.nodeValue ?? "";
      if (!text.trim()) continue;
      if (isStyle) {
        const css = text.trim().replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
        children.push([`${pad}${INDENT}{\`${css}\`}`]);
      } else {
        const t = textChild(text);
        children.push([`${pad}${INDENT}${t}`]);
        if (inlineText === null && el.childNodes.length === 1) inlineText = t;
      }
    }
  }

  const oneLineOpen = `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}`;
  const fitsOneLine = pad.length + oneLineOpen.length + 3 <= MAX_LINE;

  if (children.length === 0) {
    if (fitsOneLine) return [`${pad}${oneLineOpen} />`];
    return [`${pad}<${tag}`, ...attrs.map((a) => `${pad}${INDENT}${a}`), `${pad}/>`];
  }

  if (inlineText !== null && fitsOneLine && pad.length + oneLineOpen.length + inlineText.length + tag.length + 4 <= MAX_LINE) {
    return [`${pad}${oneLineOpen}>${inlineText}</${tag}>`];
  }

  const open = fitsOneLine ? [`${pad}${oneLineOpen}>`] : [`${pad}<${tag}`, ...attrs.map((a) => `${pad}${INDENT}${a}`), `${pad}>`];
  return [...open, ...children.flat(), `${pad}</${tag}>`];
}

function parseError(doc: Document): { message: string; line?: number; column?: number } | null {
  const err = doc.getElementsByTagName("parsererror")[0];
  if (!err) return null;
  const text = (err.textContent || "").replace(/\s+/g, " ").trim();
  const loc = text.match(/line (\d+) at column (\d+):?\s*(.*?)(?:Below is a rendering.*)?$/i);
  if (loc) return { message: loc[3].trim() || "Invalid SVG markup", line: Number(loc[1]), column: Number(loc[2]) };
  return { message: text.replace(/^This page contains the following errors:\s*/i, "").replace(/Below is a rendering.*$/i, "").trim() || "Invalid SVG markup" };
}

export function convertSvgToJsx(input: string, options: SvgToJsxOptions): SvgToJsxResult {
  const source = input.trim();
  if (!source) return { ok: true, code: "", warnings: [], elements: 0 };
  if (typeof DOMParser === "undefined") return { ok: false, code: "", error: "SVG parsing needs a browser", warnings: [], elements: 0 };

  const ctx: Ctx = { warnings: new Set(), elements: 0 };
  const parser = new DOMParser();
  let svg: Element | null = null;

  const xmlDoc = parser.parseFromString(source, "image/svg+xml");
  const xmlError = parseError(xmlDoc);
  if (!xmlError) {
    svg = xmlDoc.documentElement.tagName.toLowerCase() === "svg" ? xmlDoc.documentElement : xmlDoc.querySelector("svg");
  } else {
    // Not well-formed XML (unquoted attributes, HTML entities…): fall back to the forgiving HTML parser
    const htmlDoc = parser.parseFromString(`<!doctype html><body>${source}</body>`, "text/html");
    svg = htmlDoc.querySelector("svg");
    if (!svg) {
      return { ok: false, code: "", error: xmlError.message, line: xmlError.line, column: xmlError.column, warnings: [], elements: 0 };
    }
    ctx.warnings.add("Input isn't well-formed XML; it was parsed leniently");
  }

  if (!svg) return { ok: false, code: "", error: "No <svg> element found", warnings: [], elements: 0 };

  const name = componentIdentifier(options.componentName);
  const body = emitElement(svg, 2, true, ctx);
  const signature = options.typescript ? `props: SVGProps<SVGSVGElement>` : "props";
  const header = options.typescript ? `import type { SVGProps } from "react";\n\n` : "";
  const code = `${header}export function ${name}(${signature}) {\n  return (\n${body.join("\n")}\n  );\n}\n`;

  return { ok: true, code, warnings: Array.from(ctx.warnings), elements: ctx.elements };
}
