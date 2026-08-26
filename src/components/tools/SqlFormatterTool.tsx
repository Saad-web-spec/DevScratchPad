"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { formatSql, validateSql, type SqlDialect } from "@/lib/tools/sql";
import { Play, Copy, Trash2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface SqlFormatterToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_SQL = `SELECT u.id, u.username, u.email, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_revenue
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND o.created_at >= '2025-01-01'
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) > 2
ORDER BY total_revenue DESC
LIMIT 20;`;

const DIALECT_OPTIONS: { label: string; value: SqlDialect }[] = [
  { label: "Standard SQL", value: "sql" },
  { label: "PostgreSQL", value: "postgresql" },
  { label: "MySQL", value: "mysql" },
  { label: "SQLite", value: "sqlite" },
  { label: "MariaDB", value: "mariadb" },
  { label: "Transact-SQL (T-SQL)", value: "transactsql" },
  { label: "Snowflake", value: "snowflake" },
  { label: "BigQuery", value: "bigquery" },
  { label: "PL/SQL", value: "plsql" },
];

export function SqlFormatterTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: SqlFormatterToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_SQL);
  const [output, setOutput] = useState<string>("");
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [indent, setIndent] = useState<number>(2);
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower" | "preserve">("upper");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("sql-formatter", "SQL Formatter", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time validation
  useEffect(() => {
    const start = performance.now();
    const { valid, error } = validateSql(input, {
      language: dialect,
      tabWidth: indent,
      keywordCase,
    });
    const end = performance.now();

    onValidationChange(valid, error);
    onStatsChange(input.length, end - start);
  }, [input, dialect, indent, keywordCase, onValidationChange, onStatsChange]);

  const handleFormat = () => {
    const start = performance.now();
    try {
      const formatted = formatSql(input, {
        language: dialect,
        tabWidth: indent,
        keywordCase,
      });
      setOutput(formatted);
      onValidationChange(true);
      onLogHistory?.(input);
      setActiveTab("output");
    } catch (err: any) {
      onValidationChange(false, err.message || "Failed to format SQL");
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">SQL Formatter</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Format and beautify SQL queries with multi-dialect support</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(input);
              } catch {}
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Dialect Selector */}
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            {DIALECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Indent Selector */}
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>

          {/* Keyword Case */}
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as "upper" | "lower" | "preserve")}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>

          <button
            onClick={handleFormat}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Format</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] p-1 border-b border-[#e2e8f0] shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          SQL Input
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Formatted Result
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">SQL Input</span>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="sql"
              theme="vs"
              value={input}
              onChange={(value) => setInput(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Right: Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Formatted SQL</span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied ? "text-emerald-600" : "text-slate-400 hover:text-slate-700"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="sql"
              theme="vs"
              value={output}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
