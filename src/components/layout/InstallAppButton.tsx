"use client";

import { useSyncExternalStore } from "react";
import { MonitorDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadFromStorageEnvelope, saveToStorageEnvelope } from "@/lib/storage";
import { ICON_STROKE } from "./toolIcons";

/** Chromium's install prompt event (not in the DOM lib typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "devscratchpad_install_dismissed";

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

/*
 * Install state lives at module level so every button (top bar, mobile drawer) shares one stashed prompt.
 * `beforeinstallprompt` fires once per page load, often before a drawer mounts, so a per-component listener
 * would miss it.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let dismissedCache: boolean | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function isDismissed(): boolean {
  if (dismissedCache === null) {
    dismissedCache = loadFromStorageEnvelope<boolean>(DISMISSED_KEY, DISMISSED_KEY) === true;
  }
  return dismissedCache;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Once dismissed, leave the browser's own install UI alone.
    if (isDismissed()) return;
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => deferredPrompt !== null && !isDismissed();
const getServerSnapshot = () => false;

async function promptInstall() {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return;
  // Show the install prompt, then wait for the user to respond to it
  await promptEvent.prompt();
  await promptEvent.userChoice;
  // We've used the prompt, and can't use it again, throw it away
  deferredPrompt = null;
  emit();
}

function dismissInstall() {
  dismissedCache = true;
  saveToStorageEnvelope(DISMISSED_KEY, true);
  emit();
}

interface InstallAppButtonProps {
  /** `toolbar`: compact 32px header button. `menu`: full-width 44px row for the mobile drawer. */
  variant?: "toolbar" | "menu";
  className?: string;
}

/** PWA install action. Renders nothing until the browser offers an install prompt (and it wasn't dismissed). */
export function InstallAppButton({ variant = "toolbar", className }: InstallAppButtonProps) {
  const isInstallable = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isInstallable) {
    return null;
  }

  if (variant === "menu") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          type="button"
          onClick={promptInstall}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50",
            FOCUS_RING
          )}
        >
          <MonitorDown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
          <span>Install app</span>
        </button>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss install app"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
            FOCUS_RING
          )}
        >
          <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("group relative flex", className)}>
      <button
        type="button"
        onClick={promptInstall}
        title="Install as desktop app"
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
          FOCUS_RING
        )}
      >
        <MonitorDown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        <span>Install app</span>
      </button>
      <button
        type="button"
        onClick={dismissInstall}
        aria-label="Dismiss install app"
        title="Dismiss"
        className={cn(
          "absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 opacity-0 transition-colors hover:text-zinc-900 group-hover:opacity-100 focus-visible:opacity-100",
          FOCUS_RING
        )}
      >
        <X aria-hidden="true" strokeWidth={2} className="size-2.5" />
      </button>
    </div>
  );
}
