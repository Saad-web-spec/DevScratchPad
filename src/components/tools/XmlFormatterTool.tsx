"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { formatXml, minifyXml, validateXml } from"@/lib/tools/xml";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Play, Copy, Trash2, Minimize2, Check , Code } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { StatusBar, ValidationBadge, EditorPanelFooter } from '@/components/layout/StatusBar';

interface XmlFormatterToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const DEFAULT_XML = `<?xml version="1.0"encoding="UTF-8"?>
<note>
 <to>Tove</to>
 <from>Jani</from>
 <heading>Reminder</heading>
 <body>Don't forget me this weekend!</body>
</note>`;

export function XmlFormatterTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: XmlFormatterToolProps) {
 const [input, setInput] = useState<string>(DEFAULT_XML);
 const [output, setOutput] = useState<string>("");
 const [indent, setIndent] = useState<number>(2);
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [errorLine, setErrorLine] = useState<number | undefined>();
 const [execMs, setExecMs] = useState(0);

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("xml-formatter","XML Formatter", input, output);
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
 const { valid, error, line } = validateXml(input);
 const end = performance.now();
 const ms = end - start;

 setIsValid(valid);
 setErrorMsg(error);
 setErrorLine(line);
 setExecMs(ms);
 onValidationChange(valid, error, line);
 onStatsChange(input.length, ms);
 }, [input, onValidationChange, onStatsChange]);

 const handleFormat = () => {
 const start = performance.now();
 try {
 const formatted = formatXml(input, indent);
 setOutput(formatted);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch (err: any) {
 // Validation error caught
 }
 const end = performance.now();
 const ms = end - start;
 setExecMs(ms);
 onStatsChange(input.length, ms);
 };

 const handleMinify = () => {
 const start = performance.now();
 try {
 const minified = minifyXml(input);
 setOutput(minified);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch (err: any) {}
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
 <Code className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-800">XML Formatter & Minifier</h1>
 </div>

 <div className="flex items-center gap-2">
 <ExportImageButton code={output || input} language="xml"/>
 <EmbedButton toolSlug="xml-formatter"data={input} />
 <ShareButton toolSlug="xml-formatter"data={input} />
 
 <div className="h-5 w-px bg-zinc-200 mx-1 shrink-0"/>

 <select
 value={indent}
 onChange={(e) => setIndent(Number(e.target.value))}
 className="h-9 bg-white border border-zinc-200 text-zinc-700 text-xs rounded-md px-2 focus:outline-none shrink-0"
 >
 <option value={2}>2 Spaces</option>
 <option value={4}>4 Spaces</option>
 </select>

 <button onClick={handleMinify} className="h-9 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0">
 <Minimize2 className="w-3.5 h-3.5"/>
 <span>Minify</span>
 </button>

 <button onClick={handleFormat} className="h-8 px-3 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shrink-0">
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
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 Input XML
 </button>
 <button
 onClick={() => setActiveTab("output")}
 className={cn(
"flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
 activeTab ==="output"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 Formatted Output
 </button>
 </div>

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Input XML</span>
 <button
 onClick={() => setInput("")}
 className="text-zinc-400 hover:text-red-600 transition-colors"
 title="Clear"
 >
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="xml"
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
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} errorLine={typeof errorLine !== 'undefined' ? errorLine : undefined} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Formatted Output</span>
 <button
 onClick={handleCopy}
 className={cn(
"flex items-center gap-1 text-[11px] transition-colors",
 copied ?"text-zinc-900 font-medium":"text-zinc-400 hover:text-zinc-700"
 )}
 >
 {copied ? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="xml"
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
