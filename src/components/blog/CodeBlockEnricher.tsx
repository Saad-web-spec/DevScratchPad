"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { createRoot } from "react-dom/client";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 p-1.5 bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 hover:text-white rounded-md transition-colors backdrop-blur-sm z-10"
      aria-label="Copy code"
      suppressHydrationWarning
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function CodeBlockEnricher() {
  useEffect(() => {
    // Find all <pre> elements inside the prose article
    const blocks = document.querySelectorAll(".prose pre");
    blocks.forEach((pre) => {
      // Avoid enriching twice
      if (pre.querySelector(".code-copy-btn-wrapper")) return;
      
      // Ensure the <pre> block has relative positioning for the absolute button
      if (getComputedStyle(pre).position === "static") {
        (pre as HTMLElement).style.position = "relative";
      }
      
      // Extract code text (excluding the button itself which isn't there yet)
      const code = pre.textContent || "";
      
      const wrapper = document.createElement("div");
      wrapper.className = "code-copy-btn-wrapper";
      
      const root = createRoot(wrapper);
      root.render(<CopyButton text={code} />);
      
      pre.appendChild(wrapper);
    });
  }, []);
  
  return null;
}
