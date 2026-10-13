import { useCallback, useSyncExternalStore } from "react";
import { loadFromStorageEnvelope, saveToStorageEnvelope } from "@/lib/storage";

/** Whether the AI kit ZIP includes extra companion files (subagent, other tools, CI). Kept apart from the studio draft. */
const KIT_EXTRAS_KEY = "devscratchpad_studio_kit_extras";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Pass the key as the legacy key too, or the loader falls back to (and migrates) the studio's v1 state
const readSnapshot = () => loadFromStorageEnvelope<boolean>(KIT_EXTRAS_KEY, KIT_EXTRAS_KEY) === true;

/** Server render and first paint use `false`, so the toggle never causes a hydration mismatch. */
export function useKitExtras(): [boolean, (include: boolean) => void] {
  const include = useSyncExternalStore(subscribe, readSnapshot, () => false);
  const setInclude = useCallback((next: boolean) => {
    saveToStorageEnvelope(KIT_EXTRAS_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);
  return [include, setInclude];
}
