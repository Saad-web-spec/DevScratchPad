"use client";

import { useState, useEffect } from"react";
import {
  FileJson, Database, Key, Binary, Hash, Type, Regex, Code, Clock,
  Terminal, SplitSquareHorizontal, History, Trash2,
  FileCode, Calendar, ArrowLeftRight, Minimize2, Sparkles, FileText, Shield, Network,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHistoryEntries, clearHistory, deleteHistoryEntry,
  formatRelativeTime, type HistoryEntry
} from "@/lib/storage";

const NAV_CATEGORIES = [
  {
    title: "Formatters & Minifiers",
    items: [
      { name: "JSON Formatter", icon: FileJson, id: "json-formatter" },
      { name: "XML Formatter", icon: Code, id: "xml-formatter" },
      { name: "SQL Formatter", icon: Database, id: "sql-formatter" },
      { name: "GraphQL Formatter", icon: Sparkles, id: "graphql-formatter" },
      { name: "CSS/SVG Minifier", icon: Minimize2, id: "minifier" },
    ],
  },
  {
    title: "cURL Converter",
    items: [
      { name: "cURL to Fetch", icon: Terminal, id: "curl-to-fetch" },
      { name: "cURL to Python", icon: Terminal, id: "curl-to-python" },
      { name: "cURL to Go", icon: Terminal, id: "curl-to-go" },
    ],
  },
  {
    title: "Converters & Types",
    items: [
      { name: "JSON to TypeScript", icon: FileCode, id: "json-to-ts" },
      { name: "JSON to Zod", icon: FileCode, id: "json-to-zod" },
      { name: "JSON to Go Struct", icon: FileCode, id: "json-to-go" },
      { name: "SVG to JSX", icon: FileCode, id: "svg-to-jsx" },
      { name: "YAML / JSON", icon: ArrowLeftRight, id: "yaml" },
    ],
  },
  {
    title: "Utilities & Security",
    items: [
      { name: "JWT Decoder", icon: Key, id: "jwt" },
      { name: "UUID / ULID Generator", icon: Fingerprint, id: "uuid-generator" },
      { name: "HMAC Generator", icon: Shield, id: "hmac-generator" },
      { name: "CIDR Calculator", icon: Network, id: "cidr-calculator" },
      { name: "Cron Visualizer", icon: Calendar, id: "cron" },
      { name: "Diff Checker", icon: SplitSquareHorizontal, id: "diff" },
      { name: "Hash Generator", icon: Hash, id: "hash" },
      { name: "Regex Tester", icon: Regex, id: "regex" },
    ],
  },
];

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
 <aside className={cn("w-60 bg-zinc-50 border-r border-zinc-200 flex flex-col h-full shrink-0 overflow-y-auto transition-colors", className)}>
 <div className="flex-1 py-4">
 {NAV_CATEGORIES.map((category) => (
 <div key={category.title} className="mb-5">
 <h3 className="px-4 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
 {category.title}
 </h3>
 <ul className="space-y-px">
 {category.items.map((item) => {
 const isActive = activeToolId === item.id;
 return (
 <li key={item.id}>
 <button
 onClick={() => handleToolClick(item.id)}
 className={cn(
"w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-all text-left group",
 isActive
 ?"bg-blue-50 text-blue-600 border-l-2 border-blue-600 font-medium"
 :"text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-l-2 border-transparent"
 )}
 >
 <item.icon
 className={cn(
"w-4 h-4 shrink-0 transition-colors",
 isActive
 ?"text-blue-600"
 :"text-zinc-400 group-hover:text-zinc-500"
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
 </div>

 {/* History Drawer Toggle */}
 <div className="border-t border-zinc-200">
 <button
 onClick={() => setHistoryOpen(!historyOpen)}
 className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
 >
 <div className="flex items-center gap-2">
 <History className="w-4 h-4 text-zinc-400"/>
 <span>History</span>
 </div>
 <span className="text-[10px] bg-zinc-200 text-zinc-600 border border-transparent px-1.5 py-0.5 rounded-full font-medium">
 {entries.length}
 </span>
 </button>

 {historyOpen && (
 <div className="border-t border-zinc-200 max-h-72 overflow-y-auto bg-white">
 {entries.length === 0 ? (
 <p className="px-4 py-6 text-xs text-zinc-400 text-center">
 No history yet
 </p>
 ) : (
 <>
 <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-100">
 <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
 Recent
 </span>
 <button
 onClick={handleClearAll}
 className="text-[10px] text-red-500 hover:text-red-700 font-medium"
 >
 Clear All
 </button>
 </div>
 <ul>
 {entries.map((entry) => (
 <li
 key={entry.id}
 className="group flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition-colors"
 >
 <button
 onClick={() => handleHistoryClick(entry)}
 className="flex-1 text-left min-w-0"
 >
 <p className="text-xs font-medium text-zinc-700 truncate group-hover:text-blue-600 transition-colors">
 {entry.toolName}
 </p>
 <p className="text-[10px] text-zinc-400 truncate font-mono">
 {entry.input.slice(0, 50)}…
 </p>
 </button>
 <div className="flex items-center gap-1 shrink-0 ml-2">
 <span className="text-[10px] text-zinc-400">
 {formatRelativeTime(entry.timestamp)}
 </span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(entry.id);
 }}
 className="p-1 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Trash2 className="w-3 h-3"/>
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
