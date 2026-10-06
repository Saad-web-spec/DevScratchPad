"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToolUrl } from "@/lib/routes";

export function useMagicPaste() {
  const router = useRouter();

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is pasting into a standard input field or textarea
      // (We DO want to intercept if they are pasting into Monaco Editor or the document body)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA"
      ) {
        // Exception: Monaco editor uses a textarea with class 'inputarea', we DO want to intercept that if it's the wrong tool
        if (!target.classList.contains("inputarea")) {
          return;
        }
      }

      const pastedText = e.clipboardData?.getData("text")?.trim();
      if (!pastedText) return;

      // --- Magic Detection Logic ---
      let detectedToolSlug: string | null = null;

      // 1. JWT (starts with eyJ, has two dots)
      if (/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(pastedText)) {
        detectedToolSlug = "jwt";
      }
      // 2. cURL
      else if (pastedText.toLowerCase().startsWith("curl ") || pastedText.toLowerCase().startsWith("curl.exe ")) {
        detectedToolSlug = "curl-to-fetch";
      }
      // 3. X.509 Certificate or CSR
      else if (pastedText.includes("-----BEGIN CERTIFICATE") || pastedText.includes("-----BEGIN CERTIFICATE REQUEST")) {
        detectedToolSlug = "cert-decoder";
      }
      // 4. SSH Key (Private or Public)
      else if (pastedText.includes("-----BEGIN OPENSSH PRIVATE KEY") || pastedText.startsWith("ssh-rsa ") || pastedText.startsWith("ssh-ed25519 ")) {
        detectedToolSlug = "ssh-key-generator";
      }
      // 5. Cron Expression (5 or 6 parts, numbers and * / - ,)
      else if (/^(\*|[0-5]?\d|\*\/[0-5]?\d)( (\*|[01]?\d|2[0-3]|\*\/[01]?\d|2[0-3])){4,5}$/.test(pastedText)) {
        detectedToolSlug = "cron";
      }
      // 6. SQL (basic detection)
      else if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s/i.test(pastedText)) {
        detectedToolSlug = "sql-formatter";
      }
      // 7. GraphQL (basic detection)
      else if (/^(query|mutation|subscription|fragment)\s+[a-zA-Z0-9_]+\s*\{/i.test(pastedText)) {
        detectedToolSlug = "graphql-formatter";
      }
      // 8. JSON (basic detection - if it's valid JSON object/array)
      else if ((pastedText.startsWith("{") && pastedText.endsWith("}")) || (pastedText.startsWith("[") && pastedText.endsWith("]"))) {
        try {
          JSON.parse(pastedText);
          detectedToolSlug = "json-formatter"; // Default to JSON formatter
        } catch {
          // Not valid JSON
        }
      }

      if (detectedToolSlug) {
        // If we are already on the correct tool, let the paste happen naturally
        const currentPath = window.location.pathname;
        const targetPath = getToolUrl(detectedToolSlug);
        
        if (currentPath !== targetPath) {
          // Intercept paste, save payload, and redirect
          e.preventDefault();
          e.stopPropagation();
          sessionStorage.setItem("devscratchpad_magic_paste", pastedText);
          router.push(targetPath);
        }
      }
    };

    // Use capture phase to intercept before Monaco Editor gets it
    document.addEventListener("paste", handlePaste, true);
    return () => document.removeEventListener("paste", handlePaste, true);
  }, [router]);
}
