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
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white border border-[#e2e8f0] rounded-xl shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b border-[#e2e8f0]">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools... (e.g. JWT, JSON, TypeScript, Cron, YAML)"
            className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 h-14 px-4 focus:outline-none focus:ring-0 text-lg"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
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
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors",
                      selectedIndex === index
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <tool.icon
                        className={cn(
                          "w-5 h-5",
                          selectedIndex === index
                            ? "text-blue-600"
                            : "text-slate-400"
                        )}
                      />
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        selectedIndex === index
                          ? "text-blue-500"
                          : "text-slate-400"
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
