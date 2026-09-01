"use client";

import { useState, useEffect } from"react";
import { generateAllHashes, type HashResults } from"@/lib/tools/hash";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Hash, Copy, Trash2, Check } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";

interface HashGeneratorToolProps {
 onValidationChange: (isValid: boolean, error?: string) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const DEFAULT_TEXT ="DevScratchpad – Fast, Private & Beautiful Developer Tools";

export function HashGeneratorTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: HashGeneratorToolProps) {
 const [input, setInput] = useState<string>(DEFAULT_TEXT);
 const [hashes, setHashes] = useState<HashResults>({
 md5:"",
 sha1:"",
 sha256:"",
 sha512:"",
 });
 const [isUppercase, setIsUppercase] = useState<boolean>(false);
 const [copiedKey, setCopiedKey] = useState<string | null>(null);

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("hash","Hash Generator", input, JSON.stringify(hashes, null, 2));
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, hashes]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Compute hashes when input changes
 useEffect(() => {
 let isCancelled = false;
 const start = performance.now();

 onValidationChange(true);

 generateAllHashes(input).then((res) => {
 if (!isCancelled) {
 setHashes(res);
 const end = performance.now();
 onStatsChange(input.length, end - start);
 }
 });

 return () => {
 isCancelled = true;
 };
 }, [input, onValidationChange, onStatsChange]);

 const handleCopy = (text: string, key: string) => {
 if (!text) return;
 const valueToCopy = isUppercase ? text.toUpperCase() : text.toLowerCase();
 navigator.clipboard.writeText(valueToCopy);
 setCopiedKey(key);
 onLogHistory?.(input);
 setTimeout(() => setCopiedKey(null), 1500);
 };

 const handleCopyAll = () => {
 const formatValue = (h: string) => (isUppercase ? h.toUpperCase() : h.toLowerCase());
 const allText = [
 `MD5: ${formatValue(hashes.md5)}`,
 `SHA-1: ${formatValue(hashes.sha1)}`,
 `SHA-256:${formatValue(hashes.sha256)}`,
 `SHA-512:${formatValue(hashes.sha512)}`,
 ].join("\n");

 navigator.clipboard.writeText(allText);
 setCopiedKey("all");
 onLogHistory?.(input);
 setTimeout(() => setCopiedKey(null), 1500);
 };

 const HASH_CARDS = [
 { id:"md5", name:"MD5", bits:"128-bit", value: hashes.md5 },
 { id:"sha1", name:"SHA-1", bits:"160-bit", value: hashes.sha1 },
 { id:"sha256", name:"SHA-256", bits:"256-bit", value: hashes.sha256 },
 { id:"sha512", name:"SHA-512", bits:"512-bit", value: hashes.sha512 },
 ];

 return (
 <div className="flex flex-col h-full bg-[#09090B] overflow-y-auto w-full overflow-x-hidden relative">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-white shrink-0 sticky top-0 z-10">
 <div className="flex items-center gap-2">
 <Hash className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-900">Hash Generator</h1>
 </div>

 <div className="flex items-center gap-2">
 <ExportImageButton code={JSON.stringify(hashes, null, 2) || input} language="plaintext"/>
 <EmbedButton toolSlug="hash-generator"data={input} />
 <ShareButton toolSlug="hash-generator"data={input} />
 
 <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center h-8 ml-1">
 <button
 onClick={() => setIsUppercase(false)}
 className={cn(
"px-2.5 py-1 text-xs font-medium rounded-md transition-all",
 !isUppercase
 ?"bg-white text-zinc-900 font-semibold shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 lowercase
 </button>
 <button
 onClick={() => setIsUppercase(true)}
 className={cn(
"px-2.5 py-1 text-xs font-medium rounded-md transition-all",
 isUppercase
 ?"bg-white text-zinc-900 font-semibold shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 UPPERCASE
 </button>
 </div>

 <button
 onClick={handleCopyAll}
 className="bg-zinc-900 hover:bg-zinc-800 text-white h-8 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5 ml-1 shrink-0 transition-colors shadow-none"
 >
 {copiedKey ==="all"? (
 <Check className="w-3.5 h-3.5"/>
 ) : (
 <Copy className="w-3.5 h-3.5"/>
 )}
 <span>{copiedKey ==="all"?"Copied!":"Copy All Hashes"}</span>
 </button>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-8 bg-white ]">
 {/* Input Box Container */}
 <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 shadow-none">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Input Text
 </span>
 <button
 onClick={() => setInput("")}
 className="p-1 rounded-md transition-colors"
 title="Clear input"
 >
 <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500"/>
 </button>
 </div>
 <textarea
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="Type or paste your text here..."
 className="font-mono text-sm bg-transparent border-0 outline-none focus:ring-0 text-zinc-900 w-full min-h-[100px] resize-y placeholder:text-zinc-400"
 />
 </div>

 {/* Generated Hashes List */}
 <div>
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-4">
 Generated Hashes
 </span>

 <div className="space-y-3">
 {HASH_CARDS.map((card) => {
 const displayVal = card.value
 ? isUppercase
 ? card.value.toUpperCase()
 : card.value.toLowerCase()
 :"—";

 return (
 <div
 key={card.id}
 className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-zinc-200/80 rounded-xl mb-3 shadow-none hover:border-zinc-300 transition-all gap-3 sm:gap-0"
 >
 {/* Algorithm Tag & Bit Badge */}
 <div className="flex items-center gap-3">
 <span className="font-mono font-bold text-xs text-zinc-900 min-w-[70px]">
 {card.name}
 </span>
 <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-mono">
 {card.bits}
 </span>
 </div>

 {/* Hash Output Text */}
 <div className="font-mono text-sm text-zinc-800 truncate mx-0 sm:mx-4 select-all flex-1">
 {displayVal}
 </div>

 {/* Copy Button */}
 <button
 onClick={() => handleCopy(card.value, card.id)}
 className="h-8 px-2.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md font-medium transition-colors flex items-center justify-center gap-1 shrink-0"
 title={`Copy ${card.name} hash`}
 >
 {copiedKey === card.id ? (
 <Check className="w-3.5 h-3.5 text-zinc-900"/>
 ) : (
 <Copy className="w-3.5 h-3.5"/>
 )}
 <span>{copiedKey === card.id ?"Copied":"Copy"}</span>
 </button>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 );
}
