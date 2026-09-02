"use client";

import { useState, useEffect } from "react";
import { DownloadCloud } from "lucide-react";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Check if dismissed before
    const dismissed = localStorage.getItem("devscratchpad_install_dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInstallable(false);
    setIsDismissed(true);
    localStorage.setItem("devscratchpad_install_dismissed", "true");
  };

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-xs font-medium relative group"
      title="Install as Desktop App"
    >
      <DownloadCloud className="w-3.5 h-3.5" />
      <span>Install App</span>
      <div 
        onClick={handleDismiss}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="text-[10px] leading-none mb-0.5">×</span>
      </div>
    </button>
  );
}
