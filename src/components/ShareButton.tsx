"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  toolSlug: string;
  data: string | object;
  className?: string;
}

/**
 * Safely encode Unicode text / objects into a URL-safe Base64 string.
 */
export function encodeShareData(data: string | object): string {
  try {
    const rawString = typeof data === "object" ? JSON.stringify(data) : data;
    const utf8Bytes = new TextEncoder().encode(rawString);
    let binary = "";
    utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return "";
  }
}

/**
 * Safely decode a URL-safe Base64 string into a Unicode string.
 */
export function decodeShareData(encoded: string): string {
  if (!encoded) return "";
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    // Fallback for standard atob
    try {
      return atob(encoded);
    } catch {
      return "";
    }
  }
}

export function ShareButton({ toolSlug, data, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (data === undefined || data === null) return;
    const encoded = encodeShareData(data);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/${toolSlug}#data=${encoded}`;

    // Update URL hash in address bar without scrolling
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", shareUrl);
    }

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium transition-colors border border-slate-200 dark:border-slate-600 shadow-2xs shrink-0",
        className
      )}
      title="Generate and copy shareable link for this tool"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <LinkIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      )}
      <span>{copied ? "Link Copied!" : "Share"}</span>
    </button>
  );
}
