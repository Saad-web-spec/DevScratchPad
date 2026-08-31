"use client";

import { useState } from"react";
import { Link as LinkIcon, Check } from"lucide-react";
import { cn } from"@/lib/utils";

interface ShareButtonProps {
 toolSlug: string;
 data: string | object;
 className?: string;
}

import LZString from"lz-string";

/**
 * Safely encode Unicode text / objects into a compressed URL-safe string.
 */
export function encodeShareData(data: string | object): string {
 try {
 const rawString = typeof data ==="object"? JSON.stringify(data) : data;
 return LZString.compressToEncodedURIComponent(rawString);
 } catch {
 return"";
 }
}

/**
 * Safely decode a compressed URL-safe string into a Unicode string.
 * Falls back to base64 for backward compatibility.
 */
export function decodeShareData(encoded: string): string {
 if (!encoded) return"";
 try {
 const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
 if (decompressed) return decompressed;
 } catch (e) {
 console.error("LZString decompression failed, trying fallback", e);
 }
 
 // Fallback for old base64 strings
 try {
 let base64 = encoded.replace(/-/g,"+").replace(/_/g,"/");
 while (base64.length % 4) {
 base64 +="=";
 }
 const binary = atob(base64);
 const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
 return new TextDecoder().decode(bytes);
 } catch {
 try {
 return atob(encoded);
 } catch {
 return"";
 }
 }
}

export function ShareButton({ toolSlug, data, className }: ShareButtonProps) {
 const [copied, setCopied] = useState(false);

 const handleShare = () => {
 if (data === undefined || data === null) return;
 const encoded = encodeShareData(data);
 const origin = typeof window !=="undefined"? window.location.origin :"";
 const shareUrl = `${origin}/${toolSlug}#data=${encoded}`;

 // Update URL hash in address bar without scrolling
 if (typeof window !=="undefined") {
 window.history.replaceState(null,"", shareUrl);
 }

 navigator.clipboard.writeText(shareUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 return (
 <button
 onClick={handleShare}
 className={cn(
"bg-transparent hover:bg-zinc-100 :bg-zinc-800 text-zinc-600 rounded-md h-8 w-8 flex items-center justify-center transition-colors shrink-0",
 className
 )}
 title="Generate and copy shareable link for this tool"
 >
 {copied ? (
 <Check className="w-3.5 h-3.5 text-zinc-900"/>
 ) : (
 <LinkIcon className="w-3.5 h-3.5 text-zinc-500"/>
 )}
 </button>
 );
}
