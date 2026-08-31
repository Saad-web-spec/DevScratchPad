"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { minifyCss, minifySvg, validateCss, validateSvg } from"@/lib/tools/minify";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Play, Copy, Trash2, Check, Zap, Minimize2 } from"lucide-react";
import { cn } from"@/lib/utils";
import { StatusBar } from"@/components/layout/StatusBar";

interface MinifierToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const DEFAULT_CSS = `/* Main Application Layout Styles */
.header-container {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 16px 24px;
 background-color: #ffffff;
 border-bottom: 1px solid #e2e8f0;
}

.nav-link {
 color: #64748b;
 font-size: 14px;
 text-decoration: none;
 transition: color 0.2s ease;
}

.nav-link:hover {
 color: #2563eb;
}
`;

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg"width="24"height="24"viewBox="0 0 24 24"fill="none"stroke="currentColor"stroke-width="2"stroke-linecap="round"stroke-linejoin="round">
 <!-- Circle icon background -->
 <circle cx="12"cy="12"r="10"></circle>
 <!-- Inner path -->
 <polyline points="12 6 12 12 14 14"></polyline>
</svg>`;

export function MinifierTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: MinifierToolProps) {
 const [mode, setMode] = useState<"css"|"svg">("css");
 const [input, setInput] = useState<string>(DEFAULT_CSS);
 const [output, setOutput] = useState<string>("");
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [execMs, setExecMs] = useState(0);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Real-time validation
 useEffect(() => {
 const start = performance.now();
 const validation = mode ==="css"? validateCss(input) : validateSvg(input);
 const end = performance.now();
 const ms = end - start;

 setIsValid(validation.valid);
 setExecMs(ms);
 onValidationChange(validation.valid, validation.error);
 onStatsChange(input.length, ms);
 }, [input, mode, onValidationChange, onStatsChange]);

 // Dispatch custom events when input/output change
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output },
 })
 );
 window.dispatchEvent(
 new CustomEvent("workspace-saved", {
 detail: { input, output },
 })
 );
 }
 }, [input, output]);

 const handleMinify = () => {
 const start = performance.now();
 try {
 const minified = mode ==="css"? minifyCss(input) : minifySvg(input);
 setOutput(minified);
 setIsValid(true);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch (err: any) {
 setIsValid(false);
 onValidationChange(false, err.message);
 }
 const end = performance.now();
 const ms = end - start;
 setExecMs(ms);
 onStatsChange(input.length, ms);
 };

 const handleModeChange = (newMode:"css"|"svg") => {
 setMode(newMode);
 setInput(newMode ==="css"? DEFAULT_CSS : DEFAULT_SVG);
 setOutput("");
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard.writeText(output);
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 const savedBytes = input.length - output.length;
 const savingsPercent = input.length > 0 && output.length > 0
 ? ((savedBytes / input.length) * 100).toFixed(1)
 :"0";

 const editorLang = mode ==="css"?"css":"xml";

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0">
 <div className="flex items-center gap-2">
 <Minimize2 className="w-4 h-4 text-zinc-900"/>
 <h2 className="text-sm font-semibold text-zinc-800">CSS & SVG Minifier</h2>
 </div>

 <div className="flex items-center gap-2">
 <ExportImageButton code={output || input} language="css"/>
 <EmbedButton toolSlug="css-svg-minifier"data={input} />
 <ShareButton toolSlug="css-svg-minifier"data={input} />
 {/* Mode Dropdown */}
 <div className="flex items-center gap-1.5">
 <label htmlFor="minifier-mode-select"className="text-xs text-zinc-400 font-medium">
 Mode:
 </label>
 <select
 id="minifier-mode-select"
 value={mode}
 onChange={(e) => handleModeChange(e.target.value as"css"|"svg")}
 className="h-9 bg-white border border-zinc-200 text-zinc-700 text-xs rounded-md px-2 focus:outline-none font-medium"
 >
 <option value="css">CSS Minifier</option>
 <option value="svg">SVG Minifier</option>
 </select>
 </div>

 {/* Compression savings badge */}
 {output && (
 <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md text-xs font-mono flex items-center gap-1">
 <Check className="w-3 h-3 text-zinc-900"/>
 Saved {savedBytes > 0 ? savedBytes : 0} B ({savingsPercent}%)
 </span>
 )}

 {/* Action Button */}
 <button
 onClick={handleMinify}
 className="h-8 px-3 text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white"
 >
 <Minimize2 className="w-3.5 h-3.5"/>
 <span>Minify {mode.toUpperCase()}</span>
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
 Raw {mode.toUpperCase()} Input
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
 Minified Output
 </button>
 </div>

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
 Raw {mode.toUpperCase()} Input
 </span>
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
 defaultLanguage={editorLang}
 language={editorLang}
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
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
 Minified Output
 </span>
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
 defaultLanguage={editorLang}
 language={editorLang}
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

 {/* Embedded 32px Status Bar */}
 <StatusBar
 isValid={isValid}
 inputLength={input.length}
 executionMs={execMs}
 />
 </div>
 );
}
