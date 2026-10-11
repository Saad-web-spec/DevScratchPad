"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Copy text to the clipboard and remember which control did it for ~1.5s ("Copied" feedback). */
export function useCopyFeedback(): [string | null, (text: string, id?: string) => void] {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback((text: string, id = "default") => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return [copiedId, copy];
}
