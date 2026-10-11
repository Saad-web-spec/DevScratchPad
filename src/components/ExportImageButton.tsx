"use client";

import { useState } from "react";
import { ImageDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnIcon, ICON_STROKE } from "@/components/tools/ToolChrome";
import dynamic from "next/dynamic";

const ExportImageModal = dynamic(
  () => import("./ExportImageModal").then((mod) => mod.ExportImageModal),
  { ssr: false }
);

interface ExportImageButtonProps {
  code: string | object;
  language?: string; // e.g. "json", "javascript", "typescript"
  className?: string;
}

export function ExportImageButton({ code, language = "json", className }: ExportImageButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safely handle objects if someone passes an object instead of a string
  const formattedCode = typeof code === "object" ? JSON.stringify(code, null, 2) : code;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(btnIcon, className)}
        aria-label="Export image"
        title="Export code as image"
      >
        <ImageDown className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>

      {isModalOpen && (
        <ExportImageModal
          isOpen
          onClose={() => setIsModalOpen(false)}
          code={formattedCode}
          language={language}
        />
      )}
    </>
  );
}
