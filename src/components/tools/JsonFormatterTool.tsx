"use client";

import { useState, useEffect, useDeferredValue } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { formatJson, minifyJson, validateJson, sortJsonKeys } from"@/lib/tools/json";
import { Play, Copy, Trash2, Minimize2, Check, ArrowDownAZ } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, EDITOR_OPTIONS, btnPrimary, btnSecondary, btnGhost, btnIcon, selectBase, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { EditorPanelFooter } from '@/components/layout/StatusBar';

interface JsonFormatterToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const PANE_TABS = [
 { id:"input"as const, label:"Input Editor"},
 { id:"output"as const, label:"Output Result"},
];

export function JsonFormatterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: JsonFormatterToolProps) {
 const [input, setInput] = useState<string>('{\n  "hello": "world"\n}');
 const [output, setOutput] = useState<string>("");
 const [indent, setIndent] = useState<number>(2);
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorLine, setErrorLine] = useState<number | undefined>();

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("json-formatter","JSON Formatter", input, output);
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 const [errorMsg, setErrorMsg] = useState<string | undefined>();

 // Real-time validation + auto-format ("paste JSON and it is validated and formatted").
 // Runs on a deferred copy of the input so large payloads never block typing.
 const deferredInput = useDeferredValue(input);
 useEffect(() => {
 const start = performance.now();
 // Happy path parses once; only invalid input pays for the detailed error/line lookup.
 let result: { valid: boolean; error?: string; line?: number } = { valid: true };
 let formatted: string | null = deferredInput.trim() ? null : "";
 if (formatted === null) {
 try {
 formatted = JSON.stringify(JSON.parse(deferredInput), null, indent);
 } catch {
 result = validateJson(deferredInput);
 }
 }
 const { valid, error, line } = result;
 const ms = performance.now() - start;

 setIsValid(valid);
 setErrorMsg(error);
 setErrorLine(line);
 if (formatted !== null) setOutput(formatted);
 onValidationChange(valid, error, line);
 onStatsChange(deferredInput.length, ms);
 }, [deferredInput, indent, onValidationChange, onStatsChange]);

 const handleFormat = () => {
 const start = performance.now();
 try {
 const formatted = formatJson(input, indent);
 setOutput(formatted);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch {
 // Validation already catches this
 }
 onStatsChange(input.length, performance.now() - start);
 };

 const handleMinify = () => {
 const start = performance.now();
 try {
 const minified = minifyJson(input);
 setOutput(minified);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch {}
 onStatsChange(input.length, performance.now() - start);
 };

 // "Sort Keys" from the tool guide: alphabetize object keys at every depth, arrays keep their order.
 const handleSortKeys = () => {
 const start = performance.now();
 try {
 const sorted = sortJsonKeys(JSON.parse(input));
 setOutput(JSON.stringify(sorted, null, indent));
 onLogHistory?.(input);
 setActiveTab("output");
 } catch {
 // Invalid JSON is already reported by the live validation
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
 icon={getToolIcon("json-formatter")}
 title="JSON Formatter & Validator"
 utilities={<ShareMenu toolSlug="json-formatter" data={input} imageCode={output || input} imageLanguage="json" />}
 options={
 <select
 value={indent}
 onChange={(e) => setIndent(Number(e.target.value))}
 className={selectBase}
 aria-label="Indentation"
 >
 <option value={2}>2 Spaces</option>
 <option value={4}>4 Spaces</option>
 </select>
 }
 actions={<>
 <button onClick={handleSortKeys} disabled={!isValid || !input.trim()} className={btnSecondary} title="Sort object keys alphabetically">
 <ArrowDownAZ {...iconProps}/>
 <span>Sort<span className="hidden sm:inline"> Keys</span></span>
 </button>
 <button onClick={handleMinify} disabled={!isValid || !input.trim()} className={btnSecondary} title="Strip all whitespace">
 <Minimize2 {...iconProps}/>
 <span>Minify</span>
 </button>
 <button onClick={handleFormat} disabled={!isValid || !input.trim()} className={btnPrimary}>
 <Play {...iconProps}/>
 <span>Format</span>
 </button>
 </>}
 />

 {/* Mobile Segmented Tab Control */}
 <MobilePaneTabs tabs={PANE_TABS} active={activeTab} onChange={setActiveTab} />

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-zinc-200 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <PaneBar label="Input">
 <button onClick={() => setInput("")} className={btnIcon} title="Clear input" aria-label="Clear input">
 <Trash2 {...iconProps}/>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="json"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} errorLine={typeof errorLine !== 'undefined' ? errorLine : undefined} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <PaneBar label="Output">
 <button onClick={handleCopy} disabled={!output} className={cn(btnGhost, copied &&"text-zinc-900")}>
 {copied ? <Check {...iconProps}/> : <Copy {...iconProps}/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="json"
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
