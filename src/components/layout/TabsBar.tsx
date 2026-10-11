import { X } from "lucide-react";
import { type WorkspaceTab } from "@/hooks/useWorkspaceTabs";
import { cn } from "@/lib/utils";
import { getToolIcon, ICON_STROKE } from "./toolIcons";

// Mapping sidebar IDs to short display names for tabs
const TAB_NAMES: Record<string, string> = {
  "json-formatter": "JSON",
  "json-validator": "JSON Valid",
  "json-schema-validator": "JSON Schema",
  "xml-formatter": "XML",
  "sql-formatter": "SQL",
  "graphql-formatter": "GraphQL",
  "minifier": "Minify",
  "mock-data-generator": "Mock Data",
  "curl-to-python": "cURL: Py",
  "curl-to-fetch": "cURL: Fetch",
  "curl-to-go": "cURL: Go",
  "curl-to-javascript": "cURL: JS",
  "json-to-ts": "TS Interface",
  "json-to-zod": "Zod Schema",
  "json-to-go": "Go Struct",
  "svg-to-jsx": "SVG: JSX",
  "yaml": "YAML <> JSON",
  "yaml-to-json": "YAML: JSON",
  "json-to-yaml": "JSON: YAML",
  "jwt": "JWT",
  "uuid-generator": "UUID",
  "hmac-generator": "HMAC",
  "cidr-calculator": "CIDR",
  "cron": "Cron",
  "diff": "Diff",
  "hash": "Hash",
  "regex": "Regex",
  "base64-inspector": "Base64",
  "base64": "Base64",
  "cert-decoder": "X.509",
  "x509": "X.509",
  "ssh-key-generator": "SSH Key",
  "ssh-keygen": "SSH Key",
  "password-hash": "Bcrypt",
  "bcrypt": "Bcrypt",
  "epoch-converter": "Epoch",
};

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900";

interface TabsBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  className?: string;
}

export function TabsBar({ tabs, activeTabId, onSelectTab, onCloseTab, className }: TabsBarProps) {
  // Sort tabs by lastAccessed for display? No, keep the order they were opened, or just sort them consistently.
  // Actually, standard browsers keep tabs in order of opening. Let's just render them as they are in the array.
  // We'll reverse them so the newest is on the right, or we can just map them directly.

  return (
    <div
      role="tablist"
      aria-label="Open tools"
      className={cn(
        "flex h-10 md:h-9 w-full items-stretch bg-zinc-50 border-b border-zinc-200 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const name = TAB_NAMES[tab.id] || tab.id;
        const Icon = getToolIcon(tab.id);

        return (
          <div
            key={tab.id}
            className={cn(
              "group relative flex shrink-0 items-center border-r border-zinc-200 transition-colors",
              isActive
                ? "bg-white text-zinc-900 after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-zinc-900"
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900"
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "flex h-full min-w-0 max-w-40 items-center gap-2 pl-3 pr-1 text-xs font-medium select-none",
                FOCUS_RING
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={ICON_STROKE}
                className={cn("size-3.5 shrink-0", isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-700")}
              />
              <span className="truncate">{name}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              aria-label={`Close ${name} tab`}
              title="Close tab"
              className={cn(
                "mr-1 grid size-8 md:size-6 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-900 transition-colors",
                isActive ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
                FOCUS_RING
              )}
            >
              <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
