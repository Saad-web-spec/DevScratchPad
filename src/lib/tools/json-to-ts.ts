import JsonToTS from "json-to-ts";

export function jsonToTs(jsonStr: string, rootName: string = "RootObject"): string {
  if (!jsonStr || jsonStr.trim() === "") {
    return "";
  }
  try {
    const parsed = JSON.parse(jsonStr);
    const validRootName = rootName && rootName.trim() ? rootName.trim() : "RootObject";
    const interfaces = JsonToTS(parsed, { rootName: validRootName });
    return interfaces.join("\n\n");
  } catch (error: any) {
    throw new Error(error.message || "Invalid JSON syntax");
  }
}

export function validateJsonForTs(jsonStr: string): { valid: boolean; error?: string; line?: number } {
  if (!jsonStr || jsonStr.trim() === "") {
    return { valid: true };
  }
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "JSON root must be an object or array of objects" };
    }
    return { valid: true };
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    let line = 0;
    const lineMatch = errorMessage.match(/line\s(\d+)/i);
    if (lineMatch && lineMatch[1]) {
      line = parseInt(lineMatch[1], 10);
    }
    return { valid: false, error: errorMessage, line };
  }
}
