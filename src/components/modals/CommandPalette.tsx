"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileJson,
  Clock,
  Key,
  Terminal,
  SplitSquareHorizontal,
  Code,
  Database,
  Binary,
  Type,
  Hash,
  Regex,
  FileCode,
  Calendar,
  ArrowLeftRight,
  Minimize2,
  Sparkles,
  FileText,
  Shield,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

const ALL_TOOLS = [
  { id: "json-formatter", name: "JSON Formatter", category: "Formatters", icon: FileJson },
  { id: "xml-formatter", name: "XML Formatter", category: "Formatters", icon: Code },
  { id: "sql-formatter", name: "SQL Formatter", category: "Formatters", icon: Database },
  { id: "graphql-formatter", name: "GraphQL Formatter", category: "Formatters", icon: Sparkles },
  { id: "minifier", name: "CSS/SVG Minifier", category: "Formatters", icon: Minimize2 },
  { id: "curl", name: "cURL Converter", category: "Formatters", icon: Terminal },
  { id: "base64", name: "Base64 Decoder", category: "Decoders", icon: Binary },
  { id: "jwt", name: "JWT Decoder", category: "Decoders", icon: Key },
  { id: "url", name: "URL Encoder", category: "Decoders", icon: Type },
  { id: "json-to-ts", name: "JSON to TypeScript", category: "Converters", icon: FileCode },
  { id: "yaml", name: "YAML / JSON Converter", category: "Converters", icon: ArrowLeftRight },
  { id: "timestamp", name: "Unix Timestamp", category: "Converters", icon: Clock },
  { id: "markdown-previewer", name: "Markdown Previewer", category: "Utilities", icon: FileText },
  { id: "hmac-generator", name: "HMAC Generator", category: "Utilities", icon: Shield },
  { id: "cidr-calculator", name: "CIDR Calculator", category: "Utilities", icon: Network },
  { id: "cron", name: "Cron Visualizer", category: "Utilities", icon: Calendar },
  { id: "diff", name: "Diff Checker", category: "Utilities", icon: SplitSquareHorizontal },
  { id: "hash", name: "Hash Generator", category: "Utilities", icon: Hash },
  { id: "regex", name: "Regex Tester", category: "Utilities", icon: Regex },
];

export function CommandPalette({ isOpen, onClose, onSelectTool }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredTools = ALL_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredTools.length) % filteredTools.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          onSelectTool(filteredTools[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onClose, onSelectTool]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-blue-950/40 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Prominent top gradient glowing border */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shrink-0" />

        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800/80">
          <Search className="w-5 h-5 text-slate-400 dark:text-cyan-400" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools... (e.g. JWT, JSON, TypeScript, Cron, YAML)"
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-14 px-4 focus:outline-none focus:ring-0 text-base sm:text-lg"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              No tools found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredTools.map((tool, index) => (
                <li key={tool.id}>
                  <button
                    onClick={() => {
                      onSelectTool(tool.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-all",
                      selectedIndex === index
                        ? "bg-blue-50 dark:bg-gradient-to-r dark:from-cyan-500/15 dark:via-blue-600/10 dark:to-transparent text-blue-600 dark:text-cyan-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <tool.icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          selectedIndex === index
                            ? "text-blue-600 dark:text-cyan-400"
                            : "text-slate-400 dark:text-slate-500"
                        )}
                      />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono",
                        selectedIndex === index
                          ? "text-blue-500 dark:text-cyan-400"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {tool.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
