import LZString from "lz-string";
import { PRESET_ROUTES } from "./presetRegistry";

export interface StudioWorkspaceState {
  skillName?: string;
  skillTitle?: string;
  isSlugLocked?: boolean;
  description?: string;
  role?: string;
  framework?: string;
  language?: string;
  styling?: string;
  database?: string;
  philosophy?: string;
  behaviors?: string[];
  conventions?: string[];
  procedures?: string;
  customDirectives?: string;
  exampleGood?: string;
  exampleBad?: string;
  format?: string;
  globPattern?: string;
  alwaysApply?: boolean;
  mcpPresetId?: string;
  mcpServerName?: string;
  mcpCommand?: string;
  mcpArgs?: string;
  mcpEnvKey?: string;
  mcpEnvValue?: string;
  editorContent?: string;
  isManuallyEdited?: boolean;
  selectedPresetId?: string;
}

const KEY_MAP: Record<keyof StudioWorkspaceState, string> = {
  skillName: "a",
  skillTitle: "b",
  isSlugLocked: "c",
  description: "d",
  role: "e",
  framework: "f",
  language: "g",
  styling: "h",
  database: "i",
  philosophy: "j",
  behaviors: "k",
  conventions: "l",
  procedures: "m",
  customDirectives: "n",
  exampleGood: "o",
  exampleBad: "p",
  format: "q",
  globPattern: "r",
  alwaysApply: "s",
  mcpPresetId: "t",
  mcpServerName: "u",
  mcpCommand: "v",
  mcpArgs: "w",
  mcpEnvKey: "x",
  mcpEnvValue: "y",
  editorContent: "z",
  isManuallyEdited: "M",
  selectedPresetId: "P",
};

const REVERSE_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

export function encodeStudioState(state: Partial<StudioWorkspaceState>): string {
  const minified: any = {};
  for (const [key, value] of Object.entries(state)) {
    // SECURITY: Never leak sensitive MCP environment values or API keys into shared URLs
    if (key === "mcpEnvValue") {
      continue;
    }
    if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      const minKey = KEY_MAP[key as keyof StudioWorkspaceState] || key;
      minified[minKey] = value;
    }
  }
  const jsonStr = JSON.stringify(minified);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

export function decodeStudioState(hashStr: string): Partial<StudioWorkspaceState> | null {
  try {
    const raw = hashStr.startsWith("#") ? hashStr.slice(1) : hashStr;
    if (!raw) return null;

    // Format 1: Ultra-compact query parameters (#p=presetId&f=format)
    if (raw.includes("=") && !raw.startsWith("share=") && !raw.startsWith("state=")) {
      const params = new URLSearchParams(raw);
      const state: Partial<StudioWorkspaceState> = {};
      if (params.has("p")) state.selectedPresetId = params.get("p")!;
      if (params.has("f")) state.format = params.get("f")!;
      if (params.has("n")) state.skillName = params.get("n")!;
      if (params.has("t")) state.skillTitle = params.get("t")!;
      if (params.has("fw")) state.framework = params.get("fw")!;
      if (params.has("l")) state.language = params.get("l")!;
      if (params.has("st")) state.styling = params.get("st")!;
      if (params.has("db")) state.database = params.get("db")!;
      if (params.has("ph")) state.philosophy = params.get("ph") as any;
      if (params.has("g")) state.globPattern = params.get("g")!;
      if (params.has("a")) state.alwaysApply = params.get("a") === "1";
      if (params.has("sl")) state.isSlugLocked = params.get("sl") === "1";
      if (params.has("mcp")) state.mcpPresetId = params.get("mcp")!;
      return state;
    }

    // Format 2: LZ-compressed payload (#share=... or #state=...)
    const payload = raw.replace(/^(share|state)=/, "");
    const jsonStr = LZString.decompressFromEncodedURIComponent(payload);
    if (!jsonStr) return null;
    const minified = JSON.parse(jsonStr);
    const state: any = {};
    for (const [key, value] of Object.entries(minified)) {
      const origKey = REVERSE_MAP[key] || key;
      state[origKey] = value;
    }
    return state;
  } catch (err) {
    console.error("Failed to decode studio state from hash:", err);
    return null;
  }
}

export function createShareableUrl(state: Partial<StudioWorkspaceState>): string {
  // Option 1: Clean Canonical Preset URL if no custom content was modified
  const keys = Object.keys(state).filter(
    (k) => (state as any)[k] !== undefined && (state as any)[k] !== null && (state as any)[k] !== ""
  );
  const isPresetOnly = keys.every(
    (k) => k === "selectedPresetId" || k === "format" || (k === "mcpPresetId" && state.mcpPresetId === "filesystem")
  );

  if (isPresetOnly && state.selectedPresetId) {
    const fmt = (state.format || "skill_md") as any;
    const canonicalRoute = PRESET_ROUTES.find(
      (r) => r.presetId === state.selectedPresetId && r.format === fmt
    );
    if (canonicalRoute) {
      return `${window.location.origin}/ai-skill-studio/${canonicalRoute.formatSlug}/${canonicalRoute.presetSlug}`;
    }
  }

  // Option 2: Super-short URL fragment (#p=nextjs-pro&f=cursor_mdc&mcp=github) for simple overrides
  const hasLargeFields = Boolean(
    state.procedures ||
    state.description ||
    state.customDirectives ||
    state.exampleGood ||
    state.exampleBad ||
    state.editorContent ||
    (state.behaviors && state.behaviors.length > 0) ||
    (state.conventions && state.conventions.length > 0)
  );

  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  if (!hasLargeFields) {
    const params = new URLSearchParams();
    if (state.selectedPresetId) params.set("p", state.selectedPresetId);
    if (state.format && state.format !== "skill_md") params.set("f", state.format);
    if (state.skillName) params.set("n", state.skillName);
    if (state.skillTitle) params.set("t", state.skillTitle);
    if (state.framework) params.set("fw", state.framework);
    if (state.language) params.set("l", state.language);
    if (state.styling) params.set("st", state.styling);
    if (state.database) params.set("db", state.database);
    if (state.philosophy) params.set("ph", state.philosophy);
    if (state.globPattern && state.globPattern !== "**/*") params.set("g", state.globPattern);
    if (state.alwaysApply) params.set("a", "1");
    if (state.isSlugLocked) params.set("sl", "1");
    if (state.mcpPresetId && state.mcpPresetId !== "filesystem") params.set("mcp", state.mcpPresetId);

    const qs = params.toString();
    if (qs.length > 0 && qs.length < 160) {
      return `${baseUrl}#${qs}`;
    }
  }

  // Option 3: LZ-compressed payload for rich custom configurations
  const compressed = encodeStudioState(state);
  return `${baseUrl}#share=${compressed}`;
}
