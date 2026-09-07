export interface HistoryEntry {
  id: string;
  toolId: string;
  toolName: string;
  input: string;
  timestamp: number;
}

const STORAGE_KEY = "devscratchpad_history";
const MAX_ENTRIES = 15;

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  const currentEntries = [...entries];
  while (currentEntries.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEntries));
      return; // Success
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "QuotaExceededError" || (typeof err?.message === "string" && err.message.includes("quota"))) {
        // Evict oldest entry (last element) and try again
        currentEntries.pop();
      } else {
        break; // Stop on unknown errors
      }
    }
  }
}

export function addHistoryEntry(
  toolId: string,
  toolName: string,
  input: string
): void {
  if (!input || input.trim().length === 0) return;

  const entries = getHistory();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    toolId,
    toolName,
    input: input.slice(0, 5000), // Cap stored input at 5KB
    timestamp: Date.now(),
  };

  // Prepend and trim to MAX_ENTRIES
  const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
  saveHistory(updated);
}

export function getHistoryEntries(): HistoryEntry[] {
  return getHistory();
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function deleteHistoryEntry(id: string): void {
  const entries = getHistory().filter((e) => e.id !== id);
  saveHistory(entries);
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- WORKSPACE SNAPSHOTS ---

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  toolId: string;
  toolName: string;
  input: string;
  output: string;
  timestamp: number;
}

const SNAPSHOTS_KEY = "devscratchpad_snapshots";

export function getSnapshots(): WorkspaceSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnapshots(snapshots: WorkspaceSnapshot[]): void {
  if (typeof window === "undefined") return;
  const currentSnapshots = [...snapshots];
  while (currentSnapshots.length > 0) {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(currentSnapshots));
      return;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "QuotaExceededError" || (typeof err?.message === "string" && err.message.includes("quota"))) {
        currentSnapshots.pop();
      } else {
        break;
      }
    }
  }
}

export function addSnapshot(
  toolId: string,
  toolName: string,
  input: string,
  output: string
): WorkspaceSnapshot | null {
  if (!input) return null;

  const snapshots = getSnapshots();
  const dateStr = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const snapshot: WorkspaceSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${toolName} Snapshot (${dateStr})`,
    toolId,
    toolName,
    input,
    output,
    timestamp: Date.now(),
  };

  const updated = [snapshot, ...snapshots];
  saveSnapshots(updated);
  return snapshot;
}

export function deleteSnapshot(id: string): void {
  const snapshots = getSnapshots().filter((s) => s.id !== id);
  saveSnapshots(snapshots);
}

// --- VERSIONED STORAGE ENVELOPE (v2) ---

export interface StorageEnvelope<T> {
  schemaVersion: number;
  updatedAt: string;
  payload: T;
}

export const STORAGE_KEY_V2 = "ai_skill_studio_state_v2";
export const STORAGE_KEY_V1_LEGACY = "ai-skill-studio-state";
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Saves arbitrary studio state wrapped in a versioned envelope schema (v2).
 * Safely handles QuotaExceededError across browsers with multi-tier cache eviction.
 */
export function saveToStorageEnvelope<T>(
  key: string = STORAGE_KEY_V2,
  payload: T
): { success: boolean; error?: string } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { success: false, error: "localStorage is unavailable" };
  }

  const envelope: StorageEnvelope<T> = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    payload,
  };

  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return { success: true };
  } catch (err: unknown) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22 ||
        err.code === 1014);

    if (isQuotaError) {
      // Tier 1: Clear legacy unversioned studio draft and retry
      try {
        localStorage.removeItem(STORAGE_KEY_V1_LEGACY);
        localStorage.setItem(key, JSON.stringify(envelope));
        return { success: true };
      } catch {}

      // Tier 2: Truncate history and snapshots to recover space
      try {
        const history = getHistory();
        if (history.length > 3) {
          saveHistory(history.slice(0, 3));
        }
        const snapshots = getSnapshots();
        if (snapshots.length > 2) {
          saveSnapshots(snapshots.slice(0, 2));
        }
        localStorage.setItem(key, JSON.stringify(envelope));
        return { success: true };
      } catch {}

      // Tier 3: Clear workspace tabs if still full
      try {
        localStorage.removeItem("devscratchpad_workspace_tabs");
        localStorage.setItem(key, JSON.stringify(envelope));
        return { success: true };
      } catch {}

      return {
        success: false,
        error: "LocalStorage quota exceeded. Please export your kit to prevent data loss.",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown storage error",
    };
  }
}

/**
 * Reads state from a versioned envelope with defensive backwards-compatible migration.
 */
export function loadFromStorageEnvelope<T>(
  key: string = STORAGE_KEY_V2,
  legacyKey: string = STORAGE_KEY_V1_LEGACY
): T | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  // 1. Read v2 envelope
  try {
    const v2Raw = localStorage.getItem(key);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as StorageEnvelope<T>;
      if (parsed && typeof parsed === "object") {
        if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION && "payload" in parsed) {
          return parsed.payload;
        }
        if ("payload" in parsed) {
          return parsed.payload;
        }
        return parsed as unknown as T;
      }
    }
  } catch (e) {
    console.warn("[StorageEnvelope] Error parsing v2 envelope:", e);
  }

  // 2. Defensive fallback & migration: Read legacy v1 unversioned data
  try {
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw) as T;
      if (parsedLegacy && typeof parsedLegacy === "object") {
        // Upgrade legacy data to v2 envelope immediately
        saveToStorageEnvelope(key, parsedLegacy);
        return parsedLegacy;
      }
    }
  } catch (e) {
    console.error("[StorageEnvelope] Error migrating legacy storage state:", e);
  }

  return null;
}

/**
 * Completely wipes all client-side history, snapshots, and studio state.
 */
export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SNAPSHOTS_KEY);
    localStorage.removeItem("devscratchpad_workspace_tabs");
    localStorage.removeItem(STORAGE_KEY_V1_LEGACY);
    localStorage.removeItem(STORAGE_KEY_V2);
  } catch {
    // Gracefully handle storage errors
  }
}
