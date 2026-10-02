/**
 * Client-side Directory Picker for MCP Filesystem server configuration
 * 100% Client-Side execution (ADR-001) - Zero Server Transmission.
 * Uses the Web File System Access API (showDirectoryPicker) in supported browsers.
 */

export interface DirectoryPickResult {
  name: string;
  suggestedArg: string;
  supported: boolean;
}

export async function pickLocalDirectory(): Promise<DirectoryPickResult> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    return {
      name: "",
      suggestedArg: "./",
      supported: false,
    };
  }

  try {
    // Prompt user to select directory
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: "read",
    });

    const dirName = dirHandle.name || "project";
    return {
      name: dirName,
      suggestedArg: `./${dirName}`,
      supported: true,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      // User cancelled picker
      throw new Error("Selection cancelled.");
    }
    throw new Error(err.message || "Failed to access directory.");
  }
}
