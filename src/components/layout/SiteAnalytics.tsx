"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { loadFromStorageEnvelope, saveToStorageEnvelope } from "@/lib/storage";

const EXCLUDE_KEY = "devscratchpad_exclude_analytics";
const EXCLUDE_PARAM = "exclude-me";

/**
 * True when this browser has opted out of analytics. Visiting any page with `?exclude-me=1`
 * opts out (for the site owner's own devices), `?exclude-me=0` opts back in.
 */
function isExcluded(url: string): boolean {
  try {
    const param = new URL(url).searchParams.get(EXCLUDE_PARAM);
    if (param === "1" || param === "0") {
      saveToStorageEnvelope(EXCLUDE_KEY, param === "1");
      return param === "1";
    }
  } catch {}
  // Same key as the legacy fallback so the loader never falls back to studio state
  return loadFromStorageEnvelope<boolean>(EXCLUDE_KEY, EXCLUDE_KEY) === true;
}

function dropIfExcluded<T extends { url: string }>(event: T): T | null {
  return isExcluded(event.url) ? null : event;
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={dropIfExcluded} />
      <SpeedInsights beforeSend={dropIfExcluded} />
    </>
  );
}
