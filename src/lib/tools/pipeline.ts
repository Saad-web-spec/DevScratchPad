/**
 * Recipe Pipeline Engine
 * 
 * Enables multi-step chaining of DevScratchpad operations.
 * Each step takes input text, transforms it, and passes output to the next step.
 */

export interface PipelineOperation {
  id: string;
  name: string;
  description: string;
  category: string;
  execute: (input: string, options?: Record<string, unknown>) => string;
}

export interface PipelineStep {
  id: string;
  operationId: string;
  options?: Record<string, unknown>;
}

export interface PipelineResult {
  stepId: string;
  operationName: string;
  output: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

// ─── Operation Implementations ──────────────────────────────────────

function jsonFormat(input: string, options?: Record<string, unknown>): string {
  const indent = (options?.indent as number) ?? 2;
  return JSON.stringify(JSON.parse(input), null, indent);
}

function jsonMinify(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

function base64Encode(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64Decode(input: string): string {
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

function urlDecode(input: string): string {
  return decodeURIComponent(input);
}

function toUpperCase(input: string): string {
  return input.toUpperCase();
}

function toLowerCase(input: string): string {
  return input.toLowerCase();
}

function trimWhitespace(input: string): string {
  return input
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function reverseText(input: string): string {
  return input.split("").reverse().join("");
}

function lineSort(input: string): string {
  return input.split("\n").sort().join("\n");
}

function lineDeduplicate(input: string): string {
  return [...new Set(input.split("\n"))].join("\n");
}

function removeEmptyLines(input: string): string {
  return input
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function countStats(input: string): string {
  const chars = input.length;
  const words = input.split(/\s+/).filter(Boolean).length;
  const lines = input.split("\n").length;
  const bytes = new TextEncoder().encode(input).length;
  return JSON.stringify({ characters: chars, words, lines, bytes }, null, 2);
}

function extractJsonKeys(input: string): string {
  const obj = JSON.parse(input);
  const keys = new Set<string>();
  function walk(o: unknown) {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const key of Object.keys(o as Record<string, unknown>)) {
        keys.add(key);
        walk((o as Record<string, unknown>)[key]);
      }
    } else if (Array.isArray(o)) {
      o.forEach(walk);
    }
  }
  walk(obj);
  return [...keys].sort().join("\n");
}

function extractJsonValues(input: string): string {
  const obj = JSON.parse(input);
  const values: string[] = [];
  function walk(o: unknown) {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const val of Object.values(o as Record<string, unknown>)) {
        walk(val);
      }
    } else if (Array.isArray(o)) {
      o.forEach(walk);
    } else {
      values.push(String(o));
    }
  }
  walk(obj);
  return values.join("\n");
}

function jsonToCSV(input: string): string {
  const data = JSON.parse(input);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Input must be a JSON array of objects");
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row: Record<string, unknown>) =>
    headers.map((h) => {
      const val = String(row[h] ?? "");
      return val.includes(",") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function csvToJson(input: string): string {
  const lines = input.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have at least a header and one data row");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function hexEncode(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function hexDecode(input: string): string {
  const bytes = input
    .trim()
    .split(/\s+/)
    .map((h) => parseInt(h, 16));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

function numberLines(input: string): string {
  return input
    .split("\n")
    .map((line, i) => `${(i + 1).toString().padStart(4)} | ${line}`)
    .join("\n");
}

function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

// ─── Operations Registry ────────────────────────────────────────────

export const PIPELINE_OPERATIONS: PipelineOperation[] = [
  // JSON
  { id: "json-format", name: "JSON Format", description: "Pretty-print JSON with indentation", category: "JSON", execute: jsonFormat },
  { id: "json-minify", name: "JSON Minify", description: "Compress JSON to single line", category: "JSON", execute: jsonMinify },
  { id: "json-extract-keys", name: "Extract JSON Keys", description: "List all unique keys from JSON", category: "JSON", execute: extractJsonKeys },
  { id: "json-extract-values", name: "Extract JSON Values", description: "List all primitive values from JSON", category: "JSON", execute: extractJsonValues },
  { id: "json-to-csv", name: "JSON → CSV", description: "Convert JSON array to CSV", category: "JSON", execute: jsonToCSV },
  { id: "csv-to-json", name: "CSV → JSON", description: "Convert CSV to JSON array", category: "JSON", execute: csvToJson },

  // Encoding
  { id: "base64-encode", name: "Base64 Encode", description: "Encode text to Base64", category: "Encoding", execute: base64Encode },
  { id: "base64-decode", name: "Base64 Decode", description: "Decode Base64 to text", category: "Encoding", execute: base64Decode },
  { id: "url-encode", name: "URL Encode", description: "Percent-encode text", category: "Encoding", execute: urlEncode },
  { id: "url-decode", name: "URL Decode", description: "Decode percent-encoded text", category: "Encoding", execute: urlDecode },
  { id: "html-escape", name: "HTML Escape", description: "Escape HTML entities", category: "Encoding", execute: escapeHtml },
  { id: "html-unescape", name: "HTML Unescape", description: "Unescape HTML entities", category: "Encoding", execute: unescapeHtml },
  { id: "hex-encode", name: "Hex Encode", description: "Convert text to hex bytes", category: "Encoding", execute: hexEncode },
  { id: "hex-decode", name: "Hex Decode", description: "Convert hex bytes to text", category: "Encoding", execute: hexDecode },

  // Text
  { id: "uppercase", name: "UPPERCASE", description: "Convert text to uppercase", category: "Text", execute: toUpperCase },
  { id: "lowercase", name: "lowercase", description: "Convert text to lowercase", category: "Text", execute: toLowerCase },
  { id: "trim", name: "Trim Whitespace", description: "Remove leading/trailing whitespace", category: "Text", execute: trimWhitespace },
  { id: "reverse", name: "Reverse Text", description: "Reverse the entire string", category: "Text", execute: reverseText },
  { id: "sort-lines", name: "Sort Lines", description: "Sort lines alphabetically", category: "Text", execute: lineSort },
  { id: "deduplicate", name: "Deduplicate Lines", description: "Remove duplicate lines", category: "Text", execute: lineDeduplicate },
  { id: "remove-empty", name: "Remove Empty Lines", description: "Strip blank lines", category: "Text", execute: removeEmptyLines },
  { id: "number-lines", name: "Number Lines", description: "Add line numbers", category: "Text", execute: numberLines },
  { id: "strip-html", name: "Strip HTML Tags", description: "Remove all HTML tags", category: "Text", execute: stripHtmlTags },
  { id: "count-stats", name: "Count Stats", description: "Count chars, words, lines, bytes", category: "Text", execute: countStats },
];

export function getOperation(id: string): PipelineOperation | undefined {
  return PIPELINE_OPERATIONS.find((op) => op.id === id);
}

export function executePipeline(
  input: string,
  steps: PipelineStep[]
): PipelineResult[] {
  const results: PipelineResult[] = [];
  let currentInput = input;

  for (const step of steps) {
    const operation = getOperation(step.operationId);
    if (!operation) {
      results.push({
        stepId: step.id,
        operationName: "Unknown",
        output: currentInput,
        durationMs: 0,
        success: false,
        error: `Operation "${step.operationId}" not found`,
      });
      break;
    }

    const start = performance.now();
    try {
      const output = operation.execute(currentInput, step.options);
      const end = performance.now();
      results.push({
        stepId: step.id,
        operationName: operation.name,
        output,
        durationMs: end - start,
        success: true,
      });
      currentInput = output;
    } catch (err: unknown) {
      const end = performance.now();
      results.push({
        stepId: step.id,
        operationName: operation.name,
        output: currentInput,
        durationMs: end - start,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      break;
    }
  }

  return results;
}
