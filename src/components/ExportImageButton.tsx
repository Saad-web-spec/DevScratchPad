"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0",
          className
        )}
        title="Export beautiful screenshot of this code"
      >
        <ImageIcon className="w-3.5 h-3.5" />
      </button>

      <ExportImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        code={formattedCode}
        language={language}
      />
    </>
  );
}
