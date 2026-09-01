"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { renderMarkdown } from"@/lib/tools/markdown";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Trash2 , FileText } from"lucide-react";
import { cn } from"@/lib/utils";
import { StatusBar } from"@/components/layout/StatusBar";

interface MarkdownPreviewerToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

export function MarkdownPreviewerTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: MarkdownPreviewerToolProps) {
 const [input, setInput] = useState<string>('# Hello Markdown');
 const [htmlOutput, setHtmlOutput] = useState<string>("");
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [execMs, setExecMs] = useState(0);

 // Dispatch workspace state
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output: htmlOutput },
 })
 );
 }
 }, [input, htmlOutput]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 useEffect(() => {
 let mounted = true;
 const start = performance.now();
 
 const updatePreview = async () => {
 try {
 const html = await renderMarkdown(input);
 if (mounted) {
 setHtmlOutput(html);
 setIsValid(true);
 onValidationChange(true);
 }
 } catch (err: any) {
 if (mounted) {
 setIsValid(false);
 onValidationChange(false, err.message);
 }
 } finally {
 if (mounted) {
 const end = performance.now();
 const ms = end - start;
 setExecMs(ms);
 onStatsChange(input.length, ms);
 }
 }
 };
 
 updatePreview();
 
 return () => {
 mounted = false;
 };
 }, [input, onValidationChange, onStatsChange]);

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0">
 <div className="flex items-center gap-2">
 <FileText className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-800">Markdown Previewer</h1>
 </div>
 
 <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
 <ExportImageButton code={input} language="markdown"/>
 <EmbedButton toolSlug="markdown-previewer"data={input} />
 <ShareButton toolSlug="markdown-previewer"data={input} />
 </div>
 </div>

 {/* Mobile Segmented Tab Control */}
 <div className="flex md:hidden bg-[#f1f5f9] p-1 border-b border-[#e2e8f0] shrink-0">
 <button
 onClick={() => setActiveTab("input")}
 className={cn(
"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
 activeTab ==="input"
 ?"bg-white text-zinc-900 font-semibold shadow-none rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 Markdown Input
 </button>
 <button
 onClick={() => setActiveTab("output")}
 className={cn(
"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
 activeTab ==="output"
 ?"bg-white text-zinc-900 font-semibold shadow-none rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 Rendered Preview
 </button>
 </div>

 {/* Dual Panel Layout */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Markdown</span>
 <button onClick={() => setInput("")} className="text-zinc-400 hover:text-red-600 transition-colors"title="Clear">
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="markdown"
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
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 bg-white w-full max-w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Preview</span>
 </div>
 <div className="flex-1 overflow-y-auto p-4 md:p-6">
 <div 
 dangerouslySetInnerHTML={{ __html: htmlOutput }} 
 className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-zinc-900"
 />
 </div>
 </div>
 </div>

 {/* Embedded 32px Status Bar */}
 <StatusBar
 isValid={isValid}
 inputLength={input.length}
 executionMs={execMs}
 />
 </div>
 );
}
