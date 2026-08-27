"use client";

import { useState } from "react";
import { Code2, Check, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { encodeShareData } from "./ShareButton";

interface EmbedButtonProps {
  toolSlug: string;
  data: string | object;
  className?: string;
}

export function EmbedButton({ toolSlug, data, className }: EmbedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getEmbedCode = () => {
    if (data === undefined || data === null) return "";
    const encoded = encodeShareData(data);
    // Since origin might be localhost in dev, we hardcode the production URL for embeds to be safe, 
    // or use window.location.origin
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tools.saadengineer.works";
    const embedUrl = `${origin}/${toolSlug}?embed=true#data=${encoded}`;
    
    return `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600px" 
  style="border: 1px solid #27272A; border-radius: 8px; overflow: hidden;"
  title="DevScratchpad ${toolSlug}"
  allow="clipboard-write"
></iframe>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-9 px-3 bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0",
          className
        )}
        title="Get embed code to put this tool on your own site"
      >
        <Code2 className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
        <span className="hidden sm:inline">Embed Tool</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Embed on Your Site</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Copy the code below to embed this interactive tool directly into your blog, documentation, or website. The embedded tool will load exactly as it appears right now, with all your data pre-filled.
              </p>
              
              <div className="relative">
                <pre className="p-4 bg-zinc-100 dark:bg-zinc-950 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap border border-zinc-200 dark:border-zinc-800">
                  {getEmbedCode()}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
