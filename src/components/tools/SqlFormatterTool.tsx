"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { formatSql, validateSql, type SqlDialect } from "@/lib/tools/sql";
import { ShareButton } from "@/components/ShareButton";
import { Play, Copy, Trash2, Check } from "lucide-react";
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">SQL Formatter</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Format and beautify SQL queries with multi-dialect support</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="sql-formatter" data={input} />

          {/* Dialect Selector */}
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
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
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>

          {/* Keyword Case */}
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as "upper" | "lower" | "preserve")}
            className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>

          <button
            onClick={handleFormat}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Format</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-zinc-800 p-1 border-b border-[#e2e8f0] dark:border-zinc-700 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          SQL Input
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          Formatted Result
        </button>
      </div>

      {/* Dual Editors */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">SQL Input</span>
            <button
              onClick={() => setInput("")}
              className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="sql"
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
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Formatted SQL</span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
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
