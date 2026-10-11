import YAML from "yaml";

/**
 * YAML <-> JSON conversion for the YAML converter tool.
 * Multi-document YAML (`---` separated) converts to a JSON array, one item per document.
 */

export type YamlMode = "yaml-to-json" | "json-to-yaml";

export interface ConversionResult {
  ok: boolean;
  output: string;
  error?: string;
  line?: number;
  column?: number;
  /** Number of YAML documents read (YAML input only). */
  documents?: number;
}

/** 1-based line/column for a 0-based character offset. */
function offsetToLineCol(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  const end = Math.min(offset, source.length);
  for (let i = 0; i < end; i++) {
    if (source.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: end - lineStart + 1 };
}

/** Pulls a readable message and a location out of a JSON.parse SyntaxError. */
export function describeJsonError(err: unknown, source: string): { error: string; line?: number; column?: number } {
  const raw = err instanceof Error ? err.message : String(err);
  let line: number | undefined;
  let column: number | undefined;
  const lineCol = raw.match(/\(line (\d+) column (\d+)\)/);
  const position = raw.match(/at position (\d+)/);
  if (lineCol) {
    line = Number(lineCol[1]);
    column = Number(lineCol[2]);
  } else if (position) {
    ({ line, column } = offsetToLineCol(source, Number(position[1])));
  } else if (/end of JSON input/i.test(raw)) {
    ({ line, column } = offsetToLineCol(source, source.length));
  }
  const error = raw
    .replace(/^SyntaxError:\s*/, "")
    .replace(/\s*in JSON at position \d+(\s*\(line \d+ column \d+\))?/, "")
    .replace(/,\s*"[\s\S]*" is not valid JSON$/, "");
  return { error: error || "Invalid JSON", line, column };
}

function describeYamlError(err: unknown): { error: string; line?: number; column?: number } {
  const e = err as { message?: string; linePos?: [{ line: number; col: number }, ...{ line: number; col: number }[]] };
  const message = (e?.message || "Invalid YAML").split("\n")[0].replace(/\s*at line \d+, column \d+:?\s*$/, "");
  return { error: message, line: e?.linePos?.[0]?.line, column: e?.linePos?.[0]?.col };
}

/** Parses YAML (one or more documents). Throws the first document error. */
function parseYamlDocuments(yamlStr: string): unknown[] {
  const docs = YAML.parseAllDocuments(yamlStr);
  const list = Array.isArray(docs) ? docs : [];
  for (const doc of list) {
    if (doc.errors.length > 0) throw doc.errors[0];
  }
  return list.map((doc) => doc.toJS());
}

/** Single-pass conversion used by the tool: parses once and reports errors with a location. */
export function convertYamlJson(input: string, mode: YamlMode, indent = 2): ConversionResult {
  if (!input.trim()) return { ok: true, output: "" };

  if (mode === "yaml-to-json") {
    try {
      const docs = parseYamlDocuments(input);
      const value = docs.length === 1 ? docs[0] : docs;
      return { ok: true, output: JSON.stringify(value ?? null, null, indent), documents: docs.length };
    } catch (err) {
      return { ok: false, output: "", ...describeYamlError(err) };
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    return { ok: false, output: "", ...describeJsonError(err, input) };
  }
  // lineWidth 0 keeps long strings on one line instead of folding them.
  return { ok: true, output: YAML.stringify(parsed, { indent, lineWidth: 0 }) };
}

export function yamlToJson(yamlStr: string, indent: number = 2): string {
  const result = convertYamlJson(yamlStr, "yaml-to-json", indent);
  if (!result.ok) throw new Error(result.error || "Invalid YAML");
  return result.output;
}

export function jsonToYaml(jsonStr: string, indent: number = 2): string {
  const result = convertYamlJson(jsonStr, "json-to-yaml", indent);
  if (!result.ok) throw new Error(result.error || "Invalid JSON");
  return result.output;
}

export function validateYaml(yamlStr: string): { valid: boolean; error?: string; line?: number; column?: number } {
  if (!yamlStr || yamlStr.trim() === "") return { valid: true };
  try {
    parseYamlDocuments(yamlStr);
    return { valid: true };
  } catch (err) {
    return { valid: false, ...describeYamlError(err) };
  }
}

export function validateJsonForYaml(jsonStr: string): { valid: boolean; error?: string; line?: number; column?: number } {
  if (!jsonStr || jsonStr.trim() === "") return { valid: true };
  try {
    JSON.parse(jsonStr);
    return { valid: true };
  } catch (err) {
    return { valid: false, ...describeJsonError(err, jsonStr) };
  }
}
