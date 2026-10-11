"use client";

import { useState, useEffect } from "react";
import { ChevronDown, RotateCcwClock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHistoryEntries, clearHistory, deleteHistoryEntry,
  formatRelativeTime, type HistoryEntry
} from "@/lib/storage";
import { getToolIcon, ICON_STROKE } from "./toolIcons";

const NAV_CATEGORIES = [
  {
    title: "Formatters & Validators",
    items: [
      { name: "JSON Formatter", id: "json-formatter" },
      { name: "JSON Schema Validator", id: "json-schema-validator" },
      { name: "XML Formatter", id: "xml-formatter" },
      { name: "SQL Formatter", id: "sql-formatter" },
      { name: "GraphQL Formatter", id: "graphql-formatter" },
      { name: "CSS/SVG Minifier", id: "minifier" },
    ],
  },
  {
    title: "Generators & Mocks",
    items: [
      { name: "Mock Data Generator", id: "mock-data-generator" },
      { name: "UUID / ULID Generator", id: "uuid-generator" },
    ],
  },
  {
    title: "Security & Cryptography",
    items: [
      { name: "JWT Decoder", id: "jwt" },
      { name: "Base64 & Hex Inspector", id: "base64-inspector" },
      { name: "Hash Generator", id: "hash" },
      { name: "HMAC Generator", id: "hmac-generator" },
      { name: "Password Hash & Verifier", id: "password-hash" },
      { name: "X.509 Cert Decoder", id: "cert-decoder" },
      { name: "SSH Key Generator", id: "ssh-key-generator" },
    ],
  },
  {
    title: "Code & Type Converters",
    items: [
      { name: "JSON to TypeScript", id: "json-to-ts" },
      { name: "JSON to Zod", id: "json-to-zod" },
      { name: "JSON to Go Struct", id: "json-to-go" },
      { name: "YAML / JSON", id: "yaml" },
      { name: "cURL to Fetch", id: "curl-to-fetch" },
      { name: "cURL to Python", id: "curl-to-python" },
      { name: "cURL to Go", id: "curl-to-go" },
      { name: "SVG to JSX", id: "svg-to-jsx" },
    ],
  },
  {
    title: "Time, Network & Utilities",
    items: [
      { name: "Epoch / Timestamp", id: "epoch-converter" },
      { name: "Regex Tester", id: "regex" },
      { name: "Diff Checker", id: "diff" },
      { name: "Cron Visualizer", id: "cron" },
      { name: "CIDR Calculator", id: "cidr-calculator" },
    ],
  },
];

/** Sidebar ids that are aliases of a listed tool, so the canonical entry still shows as active. */
const ACTIVE_ALIASES: Record<string, string> = {
  "json-validator": "json-formatter",
  base64: "base64-inspector",
  x509: "cert-decoder",
  "ssh-keygen": "ssh-key-generator",
  bcrypt: "password-hash",
  "yaml-to-json": "yaml",
  "json-to-yaml": "yaml",
  "curl-to-javascript": "curl-to-fetch",
};

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900";

interface SidebarProps {
 activeToolId?: string;
 onSelectTool?: (id: string) => void;
 onRestoreHistory?: (entry: HistoryEntry) => void;
 onCloseMobileMenu?: () => void;
 className?: string;
}

export function Sidebar({
 activeToolId ="json-formatter",
 onSelectTool,
 onRestoreHistory,
 onCloseMobileMenu,
 className,
}: SidebarProps) {
 const [historyOpen, setHistoryOpen] = useState(false);
 const [entries, setEntries] = useState<HistoryEntry[]>([]);
 const activeId = ACTIVE_ALIASES[activeToolId] ?? activeToolId;

 const refreshHistory = () => setEntries(getHistoryEntries());

 useEffect(() => {
 refreshHistory();
 }, [historyOpen]);

 const handleClearAll = () => {
 clearHistory();
 refreshHistory();
 };

 const handleDelete = (id: string) => {
 deleteHistoryEntry(id);
 refreshHistory();
 };

 const handleToolClick = (id: string) => {
 onSelectTool?.(id);
 onCloseMobileMenu?.();
 };

 const handleHistoryClick = (entry: HistoryEntry) => {
 onRestoreHistory?.(entry);
 onCloseMobileMenu?.();
 };

 return (
 <aside
 className={cn(
 "w-60 bg-white border-r border-zinc-200 flex flex-col h-full shrink-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--color-zinc-200)_transparent]",
 className
 )}
 >
 <div className="flex-1 py-3">
 <nav aria-label="Tools">
 {NAV_CATEGORIES.map((category) => (
 <div key={category.title} className="mb-4 last:mb-0">
 <h3 className="px-4 pb-1 pt-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
 {category.title}
 </h3>
 <ul className="px-2 space-y-px">
 {category.items.map((item) => {
 const isActive = activeId === item.id;
 const Icon = getToolIcon(item.id);
 return (
 <li key={item.id}>
 <button
 type="button"
 onClick={() => handleToolClick(item.id)}
 aria-current={isActive ? "page" : undefined}
 className={cn(
 "group relative w-full flex items-center gap-2.5 h-10 md:h-8 px-2.5 rounded-md text-sm md:text-[13px] text-left transition-colors",
 isActive
 ? "bg-zinc-100 text-zinc-900 font-medium before:absolute before:-left-2 before:inset-y-1.5 before:w-0.5 before:rounded-r-full before:bg-zinc-900"
 : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
 FOCUS_RING
 )}
 >
 <Icon
 aria-hidden="true"
 strokeWidth={ICON_STROKE}
 className={cn(
 "size-4 shrink-0 transition-colors",
 isActive ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-900"
 )}
 />
 <span className="truncate">{item.name}</span>
 </button>
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </nav>
 </div>

 {/* History Drawer Toggle */}
 <div className="border-t border-zinc-200">
 <button
 type="button"
 onClick={() => setHistoryOpen(!historyOpen)}
 aria-expanded={historyOpen}
 className={cn(
 "group w-full flex items-center justify-between h-11 md:h-10 px-4 text-sm md:text-[13px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors",
 FOCUS_RING
 )}
 >
 <span className="flex items-center gap-2.5">
 <RotateCcwClock
 aria-hidden="true"
 strokeWidth={ICON_STROKE}
 className="size-4 text-zinc-500 transition-colors group-hover:text-zinc-900"
 />
 <span>History</span>
 </span>
 <span className="flex items-center gap-1.5">
 <span className="min-w-5 rounded-full bg-zinc-100 px-1.5 py-px text-center text-[10px] font-medium tabular-nums text-zinc-600">
 {entries.length}
 </span>
 <ChevronDown
 aria-hidden="true"
 strokeWidth={ICON_STROKE}
 className={cn("size-3.5 text-zinc-400", historyOpen && "rotate-180")}
 />
 </span>
 </button>

 {historyOpen && (
 <div className="border-t border-zinc-200 max-h-72 overflow-y-auto overscroll-contain bg-white">
 {entries.length === 0 ? (
 <p className="px-4 py-6 text-xs text-zinc-400 text-center">
 No history yet
 </p>
 ) : (
 <>
 <div className="pl-4 pr-2 h-9 flex items-center justify-between border-b border-zinc-100">
 <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">
 Recent
 </span>
 <button
 type="button"
 onClick={handleClearAll}
 className={cn(
 "rounded px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-red-600 transition-colors",
 FOCUS_RING
 )}
 >
 Clear all
 </button>
 </div>
 <ul>
 {entries.map((entry) => (
 <li
 key={entry.id}
 className="group flex items-center justify-between gap-2 pl-4 pr-2 hover:bg-zinc-50 transition-colors"
 >
 <button
 type="button"
 onClick={() => handleHistoryClick(entry)}
 className={cn("flex-1 min-w-0 py-2 text-left rounded", FOCUS_RING)}
 >
 <p className="text-xs font-medium text-zinc-700 truncate transition-colors group-hover:text-zinc-900">
 {entry.toolName}
 </p>
 <p className="text-[10px] text-zinc-400 truncate font-mono">
 {entry.input.slice(0, 50)}…
 </p>
 </button>
 <div className="flex items-center gap-0.5 shrink-0">
 <span className="text-[10px] tabular-nums text-zinc-400">
 {formatRelativeTime(entry.timestamp)}
 </span>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(entry.id);
 }}
 aria-label={`Delete ${entry.toolName} history entry`}
 className={cn(
 "grid size-9 md:size-7 place-items-center rounded text-zinc-400 hover:text-red-600 transition-colors md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
 FOCUS_RING
 )}
 >
 <Trash2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-3.5" />
 </button>
 </div>
 </li>
 ))}
 </ul>
 </>
 )}
 </div>
 )}
 </div>
 </aside>
 );
}
