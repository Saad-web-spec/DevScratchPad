"use client";

import { useDeferredValue, useEffect, useState } from "react";

/**
 * Keeps heavy conversions off the keystroke path.
 * Small inputs go through `useDeferredValue` (React renders the keystroke first, then converts);
 * inputs above `threshold` characters are additionally debounced so a paste of a large file
 * converts once instead of on every intermediate edit.
 */
export function useSettledValue(value: string, threshold = 20_000): string {
  const large = value.length > threshold;
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (!large) return;
    const delay = value.length > 250_000 ? 400 : 180;
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, large]);

  return useDeferredValue(large ? debounced : value);
}

/** Runs a pure conversion and measures it; the duration is display-only (status bar stats). */
export function timed<T extends object>(fn: () => T): T & { ms: number } {
  const start = performance.now();
  const value = fn();
  return { ...value, ms: performance.now() - start };
}
