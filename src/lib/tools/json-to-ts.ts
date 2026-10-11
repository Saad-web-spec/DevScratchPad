import { convertJsonToSchema } from "./polyglot-schema";

/** Converts a JSON string to TypeScript interfaces. Returns "" for blank input; throws on invalid JSON. */
export function jsonToTs(jsonStr: string, rootName: string = "Root"): string {
  return convertJsonToSchema(jsonStr, "typescript", rootName);
}

export interface JsonValidationResult {
  valid: boolean;
  error?: string;
  /** 1-based line of a syntax error. */
  line?: number;
  /** 1-based column of a syntax error. */
  column?: number;
  /** The parsed value when `valid` (absent for blank input), so callers don't parse twice. */
  value?: unknown;
}

/**
 * Parses JSON for the schema converters. The root must be an object or an array.
 * Syntax errors carry a cleaned message plus 1-based line/column, taken from the
 * engine message when it has one (V8, Firefox) and otherwise located by a scan.
 */
export function validateJsonForTs(jsonStr: string): JsonValidationResult {
  if (!jsonStr || jsonStr.trim() === "") {
    return { valid: true };
  }
  let value: unknown;
  try {
    value = JSON.parse(jsonStr) as unknown;
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    return { valid: false, error: cleanJsonErrorMessage(raw), ...locateSyntaxError(jsonStr, raw) };
  }
  if (typeof value !== "object" || value === null) {
    return { valid: false, error: "JSON root must be an object or an array" };
  }
  return { valid: true, value };
}

function cleanJsonErrorMessage(raw: string): string {
  let message = raw
    .replace(/^SyntaxError:\s*/, "")
    .replace(/^JSON\.parse:\s*/, "")
    .replace(/^JSON Parse error:\s*/, "")
    .replace(/\s+at line \d+ column \d+ of the JSON data$/, "")
    .replace(/\s+in JSON at position \d+(?:\s*\(line \d+ column \d+\))?$/, "")
    .replace(/\s+at position \d+(?:\s*\(line \d+ column \d+\))?$/, "");
  // V8: `Unexpected token 'x', "...source excerpt..." is not valid JSON`
  const token = /^(Unexpected token '[\s\S]{1,2}'),[\s\S]*is not valid JSON$/.exec(message);
  if (token) message = token[1];
  message = message.trim();
  return message ? message.charAt(0).toUpperCase() + message.slice(1) : "Invalid JSON syntax";
}

function locateSyntaxError(text: string, message: string): { line?: number; column?: number } {
  // Prefer V8's offset (so the end-of-input clamp below applies), then an engine
  // line/column (Firefox "at line L column C"), then our own scan.
  const position = /at position (\d+)/.exec(message);
  if (!position) {
    const lineColumn = /\(line (\d+) column (\d+)\)/.exec(message) ?? /at line (\d+) column (\d+)/.exec(message);
    if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) };
  }
  let offset = position ? Number(position[1]) : findJsonErrorOffset(text);
  if (offset < 0) return {};
  // "Unexpected end of input": point just past the last token rather than at trailing whitespace.
  if (offset >= text.length) offset = text.trimEnd().length;
  return offsetToLineColumn(text, offset);
}

function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

const JSON_NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
const JSON_ESCAPES = "\"\\/bfnrt";

/**
 * Returns the offset of the first JSON syntax error (or -1 if the text is valid).
 * Iterative so deeply nested input cannot overflow the stack. Used when the
 * engine message carries no position (e.g. V8 "Unexpected token", Safari).
 */
function findJsonErrorOffset(text: string): number {
  const length = text.length;
  const closers: string[] = [];
  let i = 0;
  // 0 = expecting a value, 1 = expecting an object key, 2 = after a value
  let state: 0 | 1 | 2 = 0;

  const skipWhitespace = (): void => {
    while (i < length) {
      const code = text.charCodeAt(i);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) i++;
      else break;
    }
  };

  /** Scans a string starting at the opening quote; leaves `i` at the error on failure. */
  const scanString = (): boolean => {
    i++;
    while (i < length) {
      const code = text.charCodeAt(i);
      if (code === 0x22) {
        i++;
        return true;
      }
      if (code < 0x20) return false;
      if (code === 0x5c) {
        const escape = text.charAt(i + 1);
        if (escape === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) return false;
          i += 6;
        } else if (escape !== "" && JSON_ESCAPES.includes(escape)) {
          i += 2;
        } else {
          return false;
        }
        continue;
      }
      i++;
    }
    return false;
  };

  for (;;) {
    skipWhitespace();
    if (state === 2) {
      if (closers.length === 0) return i < length ? i : -1;
      const char = text.charAt(i);
      const closer = closers[closers.length - 1];
      if (char === ",") {
        i++;
        state = closer === "}" ? 1 : 0;
      } else if (char === closer) {
        i++;
        closers.pop();
      } else {
        return i;
      }
      continue;
    }
    if (i >= length) return length;
    const char = text.charAt(i);

    if (state === 1) {
      if (char !== '"' || !scanString()) return i;
      skipWhitespace();
      if (text.charAt(i) !== ":") return i;
      i++;
      state = 0;
      continue;
    }

    if (char === "{" || char === "[") {
      const closer = char === "{" ? "}" : "]";
      i++;
      skipWhitespace();
      if (text.charAt(i) === closer) {
        i++;
        state = 2;
      } else {
        closers.push(closer);
        state = char === "{" ? 1 : 0;
      }
      continue;
    }
    if (char === '"') {
      if (!scanString()) return i;
      state = 2;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      JSON_NUMBER.lastIndex = i;
      const match = JSON_NUMBER.exec(text);
      if (!match) return i;
      i += match[0].length;
      state = 2;
      continue;
    }
    const literal = char === "t" ? "true" : char === "f" ? "false" : char === "n" ? "null" : "";
    if (literal && text.startsWith(literal, i)) {
      i += literal.length;
      state = 2;
      continue;
    }
    return i;
  }
}
