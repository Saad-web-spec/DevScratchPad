"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { formatGraphQL } from"@/lib/tools/graphql";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Play, Copy, Trash2, Check , Sparkles } from"lucide-react";
import { cn } from"@/lib/utils";
import { StatusBar, ValidationBadge, EditorPanelFooter } from '@/components/layout/StatusBar';

interface GraphqlFormatterToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

export function GraphqlFormatterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: GraphqlFormatterToolProps) {
 const [input, setInput] = useState<string>('query {\n hello\n}');
 const [output, setOutput] = useState<string>("");
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [execMs, setExecMs] = useState(0);

 // Dispatch workspace state
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output },
 })
 );
 }
 }, [input, output]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 const handleFormat = () => {
 const start = performance.now();
 try {
 const result = formatGraphQL(input);
 if (result.valid) {
 setOutput(result.formatted ||"");
 setIsValid(true);
 setErrorMsg(undefined);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } else {
 setIsValid(false);
 onValidationChange(false, result.error);
 }
 } catch (err: any) {
 setIsValid(false);
 setErrorMsg(err.message);
 onValidationChange(false, err.message);
 }
 const end = performance.now();
 const ms = end - start;
 setExecMs(ms);
 onStatsChange(input.length, ms);
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard.writeText(output);
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-zinc-100"/>
 <h2 className="text-sm font-semibold text-zinc-800">GraphQL Formatter</h2>
 </div>
 
 <div className="flex items-center gap-2">
 <ExportImageButton code={output || input} language="graphql"/>
 <EmbedButton toolSlug="graphql-formatter"data={input} />
 <ShareButton toolSlug="graphql-formatter"data={input} />
 
 <div className="h-5 w-px bg-zinc-200 mx-1 shrink-0"/>

 <button onClick={handleFormat} className="h-8 px-3 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white :bg-zinc-200 shrink-0">
 <Play className="w-3.5 h-3.5"/>
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
 activeTab ==="input"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 :text-zinc-200 px-2.5 py-1 text-xs"
 )}
 >
 Input Query
 </button>
 <button
 onClick={() => setActiveTab("output")}
 className={cn(
"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
 activeTab ==="output"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 :text-zinc-200 px-2.5 py-1 text-xs"
 )}
 >
 Formatted Result
 </button>
 </div>

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Input</span>
 <button onClick={() => setInput("")} className="text-zinc-400 hover:text-red-600 :text-red-400 transition-colors"title="Clear">
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="graphql"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={{
 minimap: { enabled: false },
 fontSize: 13,
 wordWrap:"on",
 scrollBeyondLastLine: false,
 padding: { top: 16 },
 fontFamily:"'JetBrains Mono', 'Fira Code', Consolas, monospace",
 }}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Output</span>
 <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ?"text-zinc-900 font-medium":"text-zinc-400 hover:text-zinc-700 :text-zinc-300")}>
 {copied ? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="graphql"
 value={output}
 onChange={(value) => setOutput(value ||"")}
 options={{
 readOnly: false,
 minimap: { enabled: false },
 fontSize: 13,
 wordWrap:"on",
 scrollBeyondLastLine: false,
 padding: { top: 16 },
 fontFamily:"'JetBrains Mono', 'Fira Code', Consolas, monospace",
 }}
 />
 </div>
 </div>
 </div>

 
 </div>
 );
}
