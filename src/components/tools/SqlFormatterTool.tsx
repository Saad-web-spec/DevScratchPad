"use client";

import { useState, useEffect, useDeferredValue } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import type { SqlDialect } from"@/lib/tools/sql";
import { Play, Copy, Trash2, Check } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, EDITOR_OPTIONS, btnPrimary, btnGhost, btnIcon, selectBase, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { EditorPanelFooter } from '@/components/layout/StatusBar';

/** sql-formatter is large; it is fetched once, after the tool has painted. */
type SqlLib = typeof import("@/lib/tools/sql");
let sqlLibPromise: Promise<SqlLib> | null = null;
const loadSqlLib = () => (sqlLibPromise ??= import("@/lib/tools/sql"));

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
 { label:"Standard SQL", value:"sql"},
 { label:"PostgreSQL", value:"postgresql"},
 { label:"MySQL", value:"mysql"},
 { label:"SQLite", value:"sqlite"},
 { label:"MariaDB", value:"mariadb"},
 { label:"Transact-SQL (T-SQL)", value:"transactsql"},
 { label:"Snowflake", value:"snowflake"},
 { label:"BigQuery", value:"bigquery"},
 { label:"PL/SQL", value:"plsql"},
];

const PANE_TABS = [
 { id:"input"as const, label:"Input SQL"},
 { id:"output"as const, label:"Formatted Output"},
];

type KeywordCase ="upper"|"lower"|"preserve";

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
 const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [errorLine, setErrorLine] = useState<number | undefined>();
 const [lib, setLib] = useState<SqlLib | null>(null);

 useEffect(() => {
 let alive = true;
 loadSqlLib().then((mod) => {
 if (alive) setLib(mod);
 });
 return () => {
 alive = false;
 };
 }, []);

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("sql-formatter","SQL Formatter", input, output);
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Real-time format + validation in one pass (formatting is the validation), on a deferred
 // copy of the input so the formatter never blocks typing.
 const deferredInput = useDeferredValue(input);
 useEffect(() => {
 if (!lib) return;
 const start = performance.now();
 let valid = true;
 let error: string | undefined;
 let line: number | undefined;
 try {
 setOutput(lib.formatSql(deferredInput, { language: dialect, tabWidth: indent, keywordCase }));
 } catch (err: unknown) {
 valid = false;
 error = err instanceof Error ? err.message :"Invalid SQL query syntax";
 const lineMatch = error.match(/line\s+(\d+)/i);
 line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
 }
 setIsValid(valid);
 setErrorMsg(error);
 setErrorLine(line);
 onValidationChange(valid, error, line);
 onStatsChange(deferredInput.length, performance.now() - start);
 }, [lib, deferredInput, dialect, indent, keywordCase, onValidationChange, onStatsChange]);

 const handleFormat = async () => {
 const start = performance.now();
 try {
 const mod = lib ?? (await loadSqlLib());
 const formatted = mod.formatSql(input, {
 language: dialect,
 tabWidth: indent,
 keywordCase,
 });
 setOutput(formatted);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch (err: unknown) {
 onValidationChange(false, err instanceof Error ? err.message :"Failed to format SQL");
 }
 onStatsChange(input.length, performance.now() - start);
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard?.writeText(output).catch(() => {});
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <ToolHeader
 icon={getToolIcon("sql-formatter")}
 title="SQL Formatter"
 utilities={<ShareMenu toolSlug="sql-formatter" data={input} imageCode={output || input} imageLanguage="sql" />}
 options={<>
 {/* Dialect Selector */}
 <select
 value={dialect}
 onChange={(e) => setDialect(e.target.value as SqlDialect)}
 className={selectBase}
 aria-label="SQL dialect"
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
 className={selectBase}
 aria-label="Indentation"
 >
 <option value={2}>2 Spaces</option>
 <option value={4}>4 Spaces</option>
 </select>

 {/* Keyword Case */}
 <select
 value={keywordCase}
 onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
 className={selectBase}
 aria-label="Keyword case"
 >
 <option value="upper">UPPERCASE</option>
 <option value="lower">lowercase</option>
 <option value="preserve">Preserve</option>
 </select>
 </>}
 actions={
 <button
 onClick={() => void handleFormat()}
 disabled={!isValid || !input.trim()}
 className={btnPrimary}
 >
 <Play {...iconProps}/>
 <span>Format</span>
 </button>
 }
 />

 {/* Mobile Segmented Tab Control */}
 <MobilePaneTabs tabs={PANE_TABS} active={activeTab} onChange={setActiveTab} />

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-zinc-200 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <PaneBar label="Input SQL">
 <button onClick={() => setInput("")} className={btnIcon} title="Clear input" aria-label="Clear input">
 <Trash2 {...iconProps}/>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="sql"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} errorLine={typeof errorLine !== 'undefined' ? errorLine : undefined} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <PaneBar label="Formatted SQL">
 <button onClick={handleCopy} disabled={!output} className={cn(btnGhost, copied &&"text-zinc-900")}>
 {copied ? <Check {...iconProps}/> : <Copy {...iconProps}/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="sql"
 value={output}
 onChange={(value) => setOutput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 </div>
 </div>
 </div>
 );
}
