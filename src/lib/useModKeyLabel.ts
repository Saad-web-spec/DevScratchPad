"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function readModKeyLabel(): string {
  const platform = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? "⌘" : "Ctrl";
}

/**
 * Modifier key label for shortcut hints: "⌘" on Apple devices, "Ctrl" elsewhere.
 * The server render and first client render use "Ctrl" so hydration matches; Apple devices switch right after.
 */
export function useModKeyLabel(): string {
  return useSyncExternalStore(noopSubscribe, readModKeyLabel, () => "Ctrl");
}
