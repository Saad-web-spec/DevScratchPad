"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import LZString from "lz-string";
import { cn } from "@/lib/utils";
import { btnIcon, ICON_STROKE } from "@/components/tools/ToolChrome";

interface ShareButtonProps {
  toolSlug: string;
  data: string | object;
  className?: string;
}

/**
 * Safely encode Unicode text / objects into a compressed URL-safe string.
 */
export function encodeShareData(data: string | object): string {
  try {
    const rawString = typeof data === "object" ? JSON.stringify(data) : data;
    return LZString.compressToEncodedURIComponent(rawString);
  } catch {
    return "";
  }
}

/**
 * Safely decode a compressed URL-safe string into a Unicode string.
 * Falls back to base64 for backward compatibility.
 */
export function decodeShareData(encoded: string): string {
  if (!encoded) return "";
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (decompressed) return decompressed;
  } catch (e) {
    console.error("LZString decompression failed, trying fallback", e);
  }

  // Fallback for old base64 strings
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return atob(encoded);
    } catch {
      return "";
    }
  }
}

/**
 * Builds the share link (data travels in the #hash, so it never reaches the server),
 * puts it in the address bar and copies it. Returns false when there is nothing to share.
 */
export function copyShareLink(toolSlug: string, data: string | object): boolean {
  if (data === undefined || data === null) return false;
  const encoded = encodeShareData(data);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/tools/${toolSlug}#data=${encoded}`;

  // Update URL hash in address bar without scrolling
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", shareUrl);
  }

  navigator.clipboard.writeText(shareUrl);
  return true;
}

export function ShareButton({ toolSlug, data, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!copyShareLink(toolSlug, data)) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(btnIcon, className)}
      aria-label="Share tool"
      title={copied ? "Link copied" : "Copy shareable link"}
    >
      {copied ? (
        <Check className="size-4 text-zinc-900" strokeWidth={ICON_STROKE} aria-hidden="true" />
      ) : (
        <Link2 className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      )}
    </button>
  );
}
