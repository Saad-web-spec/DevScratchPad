"use client";

import { useState } from"react";
import { Image as ImageIcon } from"lucide-react";
import { cn } from"@/lib/utils";
import dynamic from"next/dynamic";

const ExportImageModal = dynamic(
 () => import("./ExportImageModal").then((mod) => mod.ExportImageModal),
 { ssr: false }
);

interface ExportImageButtonProps {
 code: string | object;
 language?: string; // e.g."json","javascript","typescript"
 className?: string;
}

export function ExportImageButton({ code, language ="json", className }: ExportImageButtonProps) {
 const [isModalOpen, setIsModalOpen] = useState(false);

 // Safely handle objects if someone passes an object instead of a string
 const formattedCode = typeof code ==="object"? JSON.stringify(code, null, 2) : code;

 return (
 <>
 <button
 onClick={() => setIsModalOpen(true)}
 className={cn(
"bg-transparent hover:bg-zinc-100 text-zinc-600 rounded-md h-8 w-8 flex items-center justify-center transition-colors shrink-0",
 className
 )}
 aria-label="Export image"
 title="Export beautiful screenshot of this code"
 >
 <ImageIcon className="w-3.5 h-3.5 text-zinc-500"/>
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
