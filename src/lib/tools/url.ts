export type UrlEncodeMode = "component" | "full";

export function encodeUrl(
  input: string,
  mode: UrlEncodeMode = "component"
): string {
  if (!input) return "";

  try {
    return mode === "component"
      ? encodeURIComponent(input)
      : encodeURI(input);
  } catch (error: any) {
    throw new Error(error.message || "Failed to encode URL string");
  }
}

export function decodeUrl(
  input: string,
  mode: UrlEncodeMode = "component"
): string {
  if (!input) return "";

  try {
    return mode === "component"
      ? decodeURIComponent(input)
      : decodeURI(input);
  } catch (error: any) {
    throw new Error(
      error.message || "Malformed URI sequence: cannot decode invalid character escapes"
    );
  }
}

export function validateUrl(
  input: string,
  action: "encode" | "decode" = "decode",
  mode: UrlEncodeMode = "component"
): { valid: boolean; error?: string } {
  if (!input || input.trim() === "") {
    return { valid: true };
  }

  if (action === "encode") {
    return { valid: true };
  }

  try {
    if (mode === "component") {
      decodeURIComponent(input);
    } else {
      decodeURI(input);
    }
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Malformed URI sequence",
    };
  }
}
