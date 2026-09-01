"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { parseCurlCommand, generateFetch, generatePythonRequests, generateGoHttp } from"@/lib/tools/curl";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Copy, Trash2, Check , Terminal } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { StatusBar, ValidationBadge, EditorPanelFooter } from '@/components/layout/StatusBar';

interface CurlConverterToolProps {
 onValidationChange: (isValid: boolean, error?: string) => void;
 onStatsChange: (length: number, execMs: number) => void;
 restoredInput?: string | null;
}

type LangTarget = 'javascript' | 'python' | 'go';

export function CurlConverterTool({ onValidationChange, onStatsChange, restoredInput }: CurlConverterToolProps) {
 const [input, setInput] = useState<string>("curl -X POST https://api.example.com/data \\\n -H \"Content-Type: application/json\"\\\n -H \"Authorization: Bearer token123\"\\\n -d '{\"key\":\"value\"}'");
 const [output, setOutput] = useState<string>("");
 const [target, setTarget] = useState<LangTarget>('javascript');
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [execMs, setExecMs] = useState(0);

 // Restore from history / share URL
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("curl","cURL Converter", input, output);
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 useEffect(() => {
 const start = performance.now();
 const parsed = parseCurlCommand(input);
 let code ="";
 
 if (parsed.error && input.trim().length > 0) {
 setIsValid(false);
 onValidationChange(false, parsed.error);
 } else {
 setIsValid(true);
 setErrorMsg(undefined);
 onValidationChange(true);
 if (target === 'javascript') code = generateFetch(parsed);
 if (target === 'python') code = generatePythonRequests(parsed);
 if (target === 'go') code = generateGoHttp(parsed);
 setOutput(code);
 }
 
 const end = performance.now();
 const ms = end - start;
 setExecMs(ms);
 onStatsChange(input.length, ms);
 }, [input, target, onValidationChange, onStatsChange]);

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
 <Terminal className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-800">cURL Converter</h1>
 </div>
 
 <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
 <ExportImageButton code={output || input} language="bash"/>
 <EmbedButton toolSlug="curl-converter"data={input} />
 <ShareButton toolSlug="curl-converter"data={input} />
 <select 
 value={target}
 onChange={(e) => setTarget(e.target.value as LangTarget)}
 className="h-9 bg-white border border-zinc-200 text-zinc-700 text-xs rounded-md px-2 focus:outline-none font-medium"
 >
 <option value="javascript">JavaScript (fetch)</option>
 <option value="python">Python (requests)</option>
 <option value="go">Go (net/http)</option>
 </select>
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
 cURL Input
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
 Generated Code
 </button>
 </div>

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">cURL Input</span>
 <button onClick={() => setInput("")} className="text-zinc-400 hover:text-red-600 transition-colors"title="Clear">
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="shell"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={{ minimap: { enabled: false }, fontSize: 13, wordWrap:"on", padding: { top: 16 } }}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
 <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Generated Code</span>
 <button onClick={handleCopy} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied ?"text-zinc-900 font-medium":"text-zinc-400 hover:text-zinc-700")}>
 {copied ? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </div>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 language={target}
 value={output}
 onChange={(value) => setOutput(value ||"")}
 options={{ readOnly: false, minimap: { enabled: false }, fontSize: 13, wordWrap:"on", padding: { top: 16 } }}
 />
 </div>
 </div>
 </div>

 
 </div>
 );
}
