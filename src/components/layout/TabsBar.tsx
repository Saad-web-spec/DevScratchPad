import { X } from "lucide-react";
import { type WorkspaceTab } from "@/hooks/useWorkspaceTabs";
import { cn } from "@/lib/utils";

// Mapping sidebar IDs to short display names for tabs
const TAB_NAMES: Record<string, string> = {
  "json-formatter": "JSON",
  "json-validator": "JSON Valid",
  "xml-formatter": "XML",
  "sql-formatter": "SQL",
  "graphql-formatter": "GraphQL",
  "minifier": "Minify",
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
  "cert-decoder": "X.509",
  "ssh-key-generator": "SSH Key",
  "password-hash": "Bcrypt",
};

interface TabsBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function TabsBar({ tabs, activeTabId, onSelectTab, onCloseTab }: TabsBarProps) {
  // Sort tabs by lastAccessed for display? No, keep the order they were opened, or just sort them consistently.
  // Actually, standard browsers keep tabs in order of opening. Let's just render them as they are in the array.
  // We'll reverse them so the newest is on the right, or we can just map them directly.
  
  return (
    <div className="flex items-center w-full bg-zinc-50 border-b border-zinc-200 overflow-x-auto overflow-y-hidden hide-scrollbar min-h-[36px] px-1 pt-1 shrink-0">
      <div className="flex items-end h-full w-max">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const name = TAB_NAMES[tab.id] || tab.id;
          
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "group flex items-center gap-2 h-8 px-3 rounded-t-lg border-t border-x cursor-pointer transition-all min-w-[100px] max-w-[160px]",
                isActive 
                  ? "bg-white border-zinc-200 text-zinc-900 shadow-[0_1px_0_0_white]" 
                  : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              )}
            >
              <span className="text-[11px] font-medium truncate flex-1 select-none">
                {name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={cn(
                  "p-0.5 rounded-sm hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-900 transition-colors flex-shrink-0",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
