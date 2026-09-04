/**
 * Versioned Storage Envelope System
 * Provides schema-versioned serialization, quota protection, and
 * seamless backwards-compatible migration for studio workspace state.
 */

export interface StorageEnvelope<T> {
  schemaVersion: number;
  updatedAt: string;
  payload: T;
}

export const STORAGE_KEY_V2 = "ai_skill_studio_state_v2";
export const STORAGE_KEY_V1_LEGACY = "ai-skill-studio-state";
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Saves arbitrary state payload wrapped in a versioned envelope.
 * Safely handles quota exceeded exceptions and SSR environments.
 */
export function saveToStorageEnvelope<T>(
  key: string = STORAGE_KEY_V2,
  payload: T
): { success: boolean; error?: string } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { success: false, error: "localStorage is unavailable" };
  }

  try {
    const envelope: StorageEnvelope<T> = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      payload,
    };

    localStorage.setItem(key, JSON.stringify(envelope));
    return { success: true };
  } catch (err: unknown) {
    // Detect QuotaExceededError across WebKit, Blink, and Gecko
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22 ||
        err.code === 1014);

    if (isQuotaError) {
      console.warn(
        "[AI Skill Studio] LocalStorage quota exceeded. Clearing legacy scratchpad caches to recover space."
      );
      try {
        localStorage.removeItem(STORAGE_KEY_V1_LEGACY);
      } catch {}
      return {
        success: false,
        error: "LocalStorage quota exceeded. Please export your kit to avoid losing unsaved modifications.",
      };
    }

    console.error("[AI Skill Studio] Failed to persist state envelope:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown storage error",
    };
  }
}

/**
 * Reads from storage envelope with automatic legacy migration.
 * If v2 envelope exists, returns payload.
 * If only v1 legacy format exists, seamlessly upgrades to v2 envelope.
 */
export function loadFromStorageEnvelope<T>(
  key: string = STORAGE_KEY_V2,
  legacyKey: string = STORAGE_KEY_V1_LEGACY
): T | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  // 1. Attempt reading v2 envelope
  try {
    const v2Raw = localStorage.getItem(key);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as StorageEnvelope<T>;
      if (parsed && typeof parsed === "object" && "schemaVersion" in parsed && "payload" in parsed) {
        return parsed.payload;
      }
      // If someone stored raw object under v2 key
      return v2Raw as unknown as T;
    }
  } catch (e) {
    console.warn("[AI Skill Studio] Error parsing v2 storage envelope, falling back to legacy:", e);
  }

  // 2. Migration: Attempt reading legacy v1 unversioned data
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
    console.error("[AI Skill Studio] Error migrating legacy storage state:", e);
  }

  return null;
}
