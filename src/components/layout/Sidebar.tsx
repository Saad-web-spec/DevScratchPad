"use client";

import { useState, useEffect } from "react";
import {
  FileJson, Database, Key, Binary, Hash, Type, Regex, Code, Clock,
  Terminal, SplitSquareHorizontal, History, Trash2,
  FileCode, Calendar, ArrowLeftRight, Minimize2, Sparkles, FileText, Shield, Network
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
      { name: "cURL Converter", icon: Terminal, id: "curl" },
    ],
  },
  {
    title: "Decoders & Encoders",
    items: [
      { name: "Base64 Decoder", icon: Binary, id: "base64" },
      { name: "JWT Decoder", icon: Key, id: "jwt" },
      { name: "URL Encoder", icon: Type, id: "url" },
    ],
  },
  {
    title: "Converters",
    items: [
      { name: "JSON to TypeScript", icon: FileCode, id: "json-to-ts" },
      { name: "YAML / JSON", icon: ArrowLeftRight, id: "yaml" },
      { name: "Unix Timestamp", icon: Clock, id: "timestamp" },
    ],
  },
  {
    title: "Utilities & Network",
    items: [
      { name: "Markdown Previewer", icon: FileText, id: "markdown-previewer" },
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
  activeToolId = "json-formatter",
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
    <aside className={cn("w-60 bg-slate-50 dark:bg-[#0b101b] border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-full shrink-0 overflow-y-auto transition-colors", className)}>
      <div className="flex-1 py-4">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.title} className="mb-5">
            <h3 className="px-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
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
                          ? "bg-blue-50 dark:bg-gradient-to-r dark:from-cyan-500/15 dark:via-blue-600/10 dark:to-transparent text-blue-600 dark:text-cyan-300 border-r-2 border-blue-600 dark:border-cyan-400 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 border-r-2 border-transparent"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-blue-600 dark:text-cyan-400"
                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
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
      <div className="border-t border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span>History</span>
          </div>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-transparent dark:border-slate-700 px-1.5 py-0.5 rounded-full font-medium">
            {entries.length}
          </span>
        </button>

        {historyOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto bg-white dark:bg-[#0e1526]">
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 dark:text-slate-500 text-center">
                No history yet
              </p>
            ) : (
              <>
                <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                    Recent
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-red-500 hover:text-red-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <ul>
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <button
                        onClick={() => handleHistoryClick(entry)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          {entry.toolName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                          {entry.input.slice(0, 50)}…
                        </p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
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
