"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolIcon, ICON_STROKE } from "@/components/layout/toolIcons";
import { useModKeyLabel } from "@/lib/useModKeyLabel";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

/** Palette entries; icons come from the shared tool icon map so the palette matches the sidebar and tabs. */
const ALL_TOOLS = [
  { id: "json-formatter", name: "JSON Formatter", category: "Formatters" },
  { id: "json-validator", name: "JSON Validator", category: "Formatters" },
  { id: "xml-formatter", name: "XML Formatter", category: "Formatters" },
  { id: "sql-formatter", name: "SQL Formatter", category: "Formatters" },
  { id: "graphql-formatter", name: "GraphQL Formatter", category: "Formatters" },
  { id: "minifier", name: "CSS/SVG Minifier", category: "Formatters" },
  { id: "curl-to-fetch", name: "cURL to Fetch", category: "Network" },
  { id: "curl-to-python", name: "cURL to Python", category: "Network" },
  { id: "curl-to-go", name: "cURL to Go", category: "Network" },
  { id: "curl-to-javascript", name: "cURL to JavaScript (Node)", category: "Network" },
  { id: "json-to-ts", name: "JSON to TypeScript", category: "Converters" },
  { id: "json-to-zod", name: "JSON to Zod", category: "Converters" },
  { id: "json-to-go", name: "JSON to Go Struct", category: "Converters" },
  { id: "svg-to-jsx", name: "SVG to JSX", category: "Converters" },
  { id: "yaml", name: "YAML / JSON Converter", category: "Converters" },
  { id: "yaml-to-json", name: "YAML to JSON", category: "Converters" },
  { id: "json-to-yaml", name: "JSON to YAML", category: "Converters" },
  { id: "base64-inspector", name: "Base64 & Hex Inspector", category: "Security" },
  { id: "jwt", name: "JWT Decoder", category: "Security" },
  { id: "cert-decoder", name: "X.509 Certificate Decoder", category: "Security" },
  { id: "ssh-key-generator", name: "SSH Key Generator", category: "Security" },
  { id: "password-hash", name: "Password Hash & Verifier", category: "Security" },
  { id: "uuid-generator", name: "UUID / ULID Generator", category: "Security" },
  { id: "hmac-generator", name: "HMAC Generator", category: "Security" },
  { id: "cidr-calculator", name: "CIDR Calculator", category: "Network" },
  { id: "cron", name: "Cron Visualizer", category: "Network" },
  { id: "diff", name: "Diff Checker", category: "Utilities" },
  { id: "hash", name: "Hash Generator", category: "Security" },
  { id: "regex", name: "Regex Tester", category: "Utilities" },
  { id: "json-schema-validator", name: "JSON Schema Validator", category: "Formatters" },
  { id: "mock-data-generator", name: "Mock Data Generator", category: "Utilities" },
  { id: "epoch-converter", name: "Epoch / Unix Timestamp Converter", category: "Utilities" },
];

export function CommandPalette({ isOpen, onClose, onSelectTool }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modKeyLabel = useModKeyLabel();

  const filteredTools = ALL_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.id.toLowerCase().includes(search.toLowerCase()) ||
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
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[10vh] sm:pt-[15vh]">
      <div
        className="absolute inset-0 bg-zinc-950/30 transition-opacity"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" aria-label="Search tools" className="relative w-full max-w-xl bg-white border border-zinc-200 rounded-xl shadow-lg shadow-zinc-950/5 overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b border-zinc-200">
          <Search className="size-4 text-zinc-400 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tools"
            placeholder="Search tools: JWT, JSON, cron…"
            className="flex-1 min-w-0 bg-transparent border-none text-zinc-900 placeholder:text-zinc-400 h-12 sm:h-14 px-3 focus:outline-none focus:ring-0 text-base"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-medium text-zinc-500">
            Esc
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden h-10 px-2 -mr-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            Cancel
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-1.5 sm:p-2">
          {filteredTools.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-400 text-sm">
              No tools found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredTools.map((tool, index) => {
                const ToolIcon = getToolIcon(tool.id);
                return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 h-11 sm:h-10 rounded-lg text-left transition-colors",
                      selectedIndex === index
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolIcon
                        strokeWidth={ICON_STROKE}
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          selectedIndex === index
                            ? "text-zinc-900"
                            : "text-zinc-400"
                        )}
                      />
                      <span className="text-sm font-medium truncate">{tool.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs shrink-0",
                        selectedIndex === index
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      )}
                    >
                      {tool.category}
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer */}
        <div className="hidden sm:flex px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-700">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M12 11l-2 3h3l-1 4 4-5h-3l1-2z" fill="currentColor" />
            </svg>
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-800 font-medium shadow-none">{modKeyLabel} + V</kbd> anywhere to auto-detect tools</span>
          </span>
          <span className="text-[11px] text-zinc-400">↑↓ to move, Enter to open</span>
        </div>
      </div>
    </div>
  );
}
