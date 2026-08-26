import YAML from "yaml";

export function yamlToJson(yamlStr: string, indent: number = 2): string {
  if (!yamlStr || yamlStr.trim() === "") {
    return "";
  }
  try {
    const parsed = YAML.parse(yamlStr);
    return JSON.stringify(parsed, null, indent);
  } catch (error: any) {
    throw new Error(error.message || "Invalid YAML");
  }
}

export function jsonToYaml(jsonStr: string): string {
  if (!jsonStr || jsonStr.trim() === "") {
    return "";
  }
  try {
    const parsed = JSON.parse(jsonStr);
    return YAML.stringify(parsed);
  } catch (error: any) {
    throw new Error(error.message || "Invalid JSON");
  }
}

export function validateYaml(yamlStr: string): { valid: boolean; error?: string; line?: number } {
  if (!yamlStr || yamlStr.trim() === "") {
    return { valid: true };
  }
  try {
    YAML.parse(yamlStr);
    return { valid: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    let line = 0;
    if (error.linePos && error.linePos[0]?.line) {
      line = error.linePos[0].line;
    } else {
      const lineMatch = errorMsg.match(/line\s(\d+)/i);
      if (lineMatch && lineMatch[1]) {
        line = parseInt(lineMatch[1], 10);
      }
    }
    return { valid: false, error: errorMsg, line };
  }
}

export function validateJsonForYaml(jsonStr: string): { valid: boolean; error?: string; line?: number } {
  if (!jsonStr || jsonStr.trim() === "") {
    return { valid: true };
  }
  try {
    JSON.parse(jsonStr);
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
