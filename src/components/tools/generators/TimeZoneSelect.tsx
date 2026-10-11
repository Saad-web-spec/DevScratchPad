"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { selectBase } from "@/components/tools/ToolChrome";
import { UTC_ZONE, listTimeZones, localTimeZone } from "./time";

export const LOCAL_ZONE = "local";

/** "local" → the browser's IANA zone; anything else is passed through. */
export function resolveZone(value: string): string {
  return value === LOCAL_ZONE ? localTimeZone() : value;
}

interface TimeZoneSelectProps {
  value: string;
  onChange: (zone: string) => void;
  className?: string;
  label?: string;
}

/**
 * Native time zone picker: Local, UTC, then every IANA zone the browser knows.
 * Memoised because the option list is long (~400 entries).
 */
export const TimeZoneSelect = memo(function TimeZoneSelect({ value, onChange, className, label = "Time zone" }: TimeZoneSelectProps) {
  const zones = useMemo(() => listTimeZones().filter((z) => z !== UTC_ZONE), []);
  const local = useMemo(() => localTimeZone(), []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(selectBase, "max-w-[11rem] truncate md:max-w-[13rem]", className)}
      aria-label={label}
      title={label}
    >
      <option value={LOCAL_ZONE}>Local ({local})</option>
      <option value={UTC_ZONE}>UTC</option>
      <optgroup label="All time zones">
        {zones.map((z) => (
          <option key={z} value={z}>
            {z.replace(/_/g, " ")}
          </option>
        ))}
      </optgroup>
    </select>
  );
});
