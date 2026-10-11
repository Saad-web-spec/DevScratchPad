"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Share2, Link2, CodeXml, ImageDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnGhost, ICON_STROKE } from "@/components/tools/ToolChrome";
import { copyShareLink } from "./ShareButton";
import { EmbedDialog } from "./EmbedButton";

const ExportImageModal = dynamic(() => import("./ExportImageModal").then((mod) => mod.ExportImageModal), {
  ssr: false,
});

interface ShareMenuProps {
  toolSlug: string;
  /** Input encoded into the share link and the embed snippet. */
  data: string | object;
  /** Code rendered by "Export as image". Omit to hide that item (e.g. tools without a code output). */
  imageCode?: string | object;
  imageLanguage?: string;
  className?: string;
}

const itemClass =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 h-10 md:h-9 text-left text-[13px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:bg-zinc-100 focus-visible:text-zinc-900";

/**
 * One "Share" button for every tool header: copy link, embed snippet, export as image.
 * Replaces the three separate icon buttons so the header stays quiet.
 */
export function ShareMenu({ toolSlug, data, imageCode, imageLanguage = "json", className }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCopyLink = () => {
    if (!copyShareLink(toolSlug, data)) return;
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
      setOpen(false);
    }, 900);
  };

  const imageText =
    imageCode === undefined ? "" : typeof imageCode === "object" ? JSON.stringify(imageCode, null, 2) : imageCode;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(btnGhost, open && "bg-zinc-100 text-zinc-900")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Share, embed or export"
      >
        <Share2 className="size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-950/5"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={handleCopyLink}>
            {linkCopied ? (
              <Check className="size-4 shrink-0 text-zinc-900" strokeWidth={ICON_STROKE} aria-hidden="true" />
            ) : (
              <Link2 className="size-4 shrink-0 text-zinc-500" strokeWidth={ICON_STROKE} aria-hidden="true" />
            )}
            {linkCopied ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              setEmbedOpen(true);
            }}
          >
            <CodeXml className="size-4 shrink-0 text-zinc-500" strokeWidth={ICON_STROKE} aria-hidden="true" />
            Embed snippet
          </button>
          {imageCode !== undefined && (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                setImageOpen(true);
              }}
            >
              <ImageDown className="size-4 shrink-0 text-zinc-500" strokeWidth={ICON_STROKE} aria-hidden="true" />
              Export as image
            </button>
          )}
        </div>
      )}

      {embedOpen && <EmbedDialog toolSlug={toolSlug} data={data} onClose={() => setEmbedOpen(false)} />}
      {imageOpen && (
        <ExportImageModal isOpen onClose={() => setImageOpen(false)} code={imageText} language={imageLanguage} />
      )}
    </div>
  );
}
