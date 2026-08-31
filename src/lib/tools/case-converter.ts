export type CaseType =
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "CONSTANT_CASE"
  | "kebab-case"
  | "Title Case"
  | "Sentence case"
  | "dot.case"
  | "path/case";

// Split string into words considering camelCase, snake_case, kebab-case, spaces, etc.
export function splitWords(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[-_./\\]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function toCamelCase(text: string): string {
  const words = splitWords(text);
  if (words.length === 0) return "";
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

export function toPascalCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
}

export function toSnakeCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.toLowerCase()).join("_");
}

export function toConstantCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.toUpperCase()).join("_");
}

export function toKebabCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.toLowerCase()).join("-");
}

export function toTitleCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function toSentenceCase(text: string): string {
  const words = splitWords(text);
  if (words.length === 0) return "";
  const joined = words.map((w) => w.toLowerCase()).join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export function toDotCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.toLowerCase()).join(".");
}

export function toPathCase(text: string): string {
  const words = splitWords(text);
  return words.map((w) => w.toLowerCase()).join("/");
}

export function convertTextCase(text: string, targetCase: CaseType): string {
  // If multi-line, process line-by-line
  const lines = text.split("\n");
  const converted = lines.map((line) => {
    if (!line.trim()) return line;
    switch (targetCase) {
      case "camelCase":
        return toCamelCase(line);
      case "PascalCase":
        return toPascalCase(line);
      case "snake_case":
        return toSnakeCase(line);
      case "CONSTANT_CASE":
        return toConstantCase(line);
      case "kebab-case":
        return toKebabCase(line);
      case "Title Case":
        return toTitleCase(line);
      case "Sentence case":
        return toSentenceCase(line);
      case "dot.case":
        return toDotCase(line);
      case "path/case":
        return toPathCase(line);
      default:
        return line;
    }
  });
  return converted.join("\n");
}

// Text line transformations
export function deduplicateLines(text: string): string {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }
  return result.join("\n");
}

export function sortLinesAsc(text: string): string {
  const lines = text.split("\n");
  return lines.sort((a, b) => a.localeCompare(b)).join("\n");
}

export function sortLinesDesc(text: string): string {
  const lines = text.split("\n");
  return lines.sort((a, b) => b.localeCompare(a)).join("\n");
}

export function trimLines(text: string): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

export function stripEmptyLines(text: string): string {
  return text
    .split("\n")
    .filter((l) => l.trim() !== "")
    .join("\n");
}

export function getTextStats(text: string) {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  const bytes = new Blob([text]).size;

  return { chars, charsNoSpaces, words, lines, bytes };
}
