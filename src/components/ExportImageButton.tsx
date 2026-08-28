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
          "h-9 px-3 bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0",
          className
        )}
        title="Export beautiful screenshot of this code"
      >
        <ImageIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span>Export Image</span>
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
