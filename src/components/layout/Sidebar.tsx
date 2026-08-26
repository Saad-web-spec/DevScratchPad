"use client";

import { useState, useEffect } from "react";
import {
  FileJson, Database, Key, Binary, Hash, Type, Regex, Code, Clock,
  Terminal, SplitSquareHorizontal, History, Trash2,
  FileCode, Calendar, ArrowLeftRight, Minimize2
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
    title: "Utilities",
    items: [
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
    <aside className={cn("w-60 bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col h-full shrink-0 overflow-y-auto", className)}>
      <div className="flex-1 py-4">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.title} className="mb-5">
            <h3 className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
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
                        "w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors text-left",
                        isActive
                          ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-medium"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-r-2 border-transparent"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-blue-600" : "text-slate-400"
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
      <div className="border-t border-[#e2e8f0]">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
            {entries.length}
          </span>
        </button>

        {historyOpen && (
          <div className="border-t border-[#e2e8f0] max-h-72 overflow-y-auto bg-white">
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">
                No history yet
              </p>
            ) : (
              <>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
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
                      className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <button
                        onClick={() => handleHistoryClick(entry)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {entry.toolName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {entry.input.slice(0, 50)}…
                        </p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
