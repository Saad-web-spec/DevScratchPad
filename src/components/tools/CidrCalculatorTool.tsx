"use client";

import { useState, useEffect } from"react";
import { Network, Copy, Check } from"lucide-react";
import { parseCidr, CidrInfo } from"@/lib/tools/cidr";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { cn } from"@/lib/utils";

interface CidrCalculatorToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

export function CidrCalculatorTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: CidrCalculatorToolProps) {
 const [input, setInput] = useState<string>('192.168.1.0/24');
 const [info, setInfo] = useState<CidrInfo | null>(null);
 const [isValid, setIsValid] = useState(true);
 const [copiedId, setCopiedId] = useState<string | null>(null);

 // Dispatch workspace state
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output: info ? JSON.stringify(info) :""},
 })
 );
 }
 }, [input, info]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 useEffect(() => {
 const start = performance.now();
 try {
 if (input) {
 const result = parseCidr(input);
 if (result.valid && result.info) {
 setInfo(result.info);
 setIsValid(true);
 onValidationChange(true);
 } else {
 setInfo(null);
 setIsValid(false);
 onValidationChange(false, result.error);
 }
 } else {
 setInfo(null);
 setIsValid(true);
 onValidationChange(true);
 }
 } catch (err: any) {
 setInfo(null);
 setIsValid(false);
 onValidationChange(false, err.message);
 }
 const end = performance.now();
 onStatsChange(input.length, end - start);
 }, [input, onValidationChange, onStatsChange]);

 const handleCopy = (text: string, id: string) => {
 navigator.clipboard.writeText(text);
 setCopiedId(id);
 setTimeout(() => setCopiedId(null), 1500);
 };

 const setMask = (mask: string) => {
 const ipPart = input.split('/')[0];
 if (ipPart) {
 setInput(`${ipPart}${mask}`);
 } else {
 setInput(`192.168.1.0${mask}`);
 }
 };

 const prefixMatch = input.match(/\/(\d+)$/);
 const prefix = prefixMatch ? parseInt(prefixMatch[1], 10) : 0;

 const renderBits = (ipStr: string) => {
 const octets = ipStr.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0'));
 const bits = octets.join('');
 
 return (
 <div className="flex flex-wrap items-center">
 {Array.from({ length: 32 }).map((_, i) => (
 <span key={i} className="flex items-center">
 {i > 0 && i % 8 === 0 && <span className="text-zinc-700 font-normal mx-0.5 md:mx-1">.</span>}
 <span className={cn(
"font-mono text-sm sm:text-base md:text-lg tracking-widest",
 i < prefix ?"text-zinc-900 font-bold":"text-zinc-400 font-normal"
 )}>
 {bits[i]}
 </span>
 </span>
 ))}
 </div>
 );
 };

 return (
 <div className="flex flex-col h-full bg-[#09090B] overflow-y-auto w-full overflow-x-hidden relative">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-white shrink-0 sticky top-0 z-10">
 <div className="flex items-center gap-2">
 <Network className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-900">CIDR Calculator</h1>
 </div>
 
 <div className="flex items-center gap-2">
 <ExportImageButton code={info ? JSON.stringify(info, null, 2) : input} language="json"/>
 <EmbedButton toolSlug="cidr-calculator"data={input} />
 <ShareButton toolSlug="cidr-calculator"data={input} />
 </div>
 </div>

 <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6 md:gap-8 bg-white ]">
 
 {/* CIDR Input & Quick Preset Strip */}
 <div className="flex flex-col gap-3">
 <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">CIDR Notation</label>
 <input
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="e.g. 192.168.1.0/24"
 className="w-full font-mono text-lg font-bold bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-zinc-900 focus:ring-1 focus:ring-zinc-400 focus:outline-none placeholder:text-zinc-400 transition-all"
 />
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
 {['/8', '/16', '/24', '/27', '/30', '/32'].map((mask) => (
 <button
 key={mask}
 onClick={() => setMask(mask)}
 className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition-colors"
 >
 {mask}
 </button>
 ))}
 </div>
 </div>

 {info ? (
 <>
 {/* Metrics Dashboard Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
 <MetricCard label="Network Address"value={info.network} id="network"copiedId={copiedId} onCopy={handleCopy} />
 <MetricCard label="Broadcast Address"value={info.broadcast} id="broadcast"copiedId={copiedId} onCopy={handleCopy} />
 <MetricCard label="Usable IP Range"value={`${info.firstUsable} - ${info.lastUsable}`} id="range"copiedId={copiedId} onCopy={handleCopy} />
 <MetricCard label="Subnet Mask"value={info.mask} id="mask"copiedId={copiedId} onCopy={handleCopy} />
 <MetricCard label="Wildcard Mask"value={info.wildcard} id="wildcard"copiedId={copiedId} onCopy={handleCopy} />
 <MetricCard label="Total Usable Hosts"value={`${info.totalHosts.toLocaleString()} usable IPs`} id="hosts"copiedId={copiedId} onCopy={handleCopy} />
 </div>

 {/* Binary Subnet Visualizer */}
 <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-xl p-5 md:p-6 shadow-sm overflow-hidden flex flex-col gap-6">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Binary Subnet Visualizer</span>
 <div className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-wider">
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
 <span className="text-zinc-600">Network Bits</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full border border-zinc-400"></span>
 <span className="text-zinc-500">Host Bits</span>
 </div>
 </div>
 </div>
 
 <div className="flex flex-col gap-4 overflow-x-auto no-scrollbar pb-2">
 <div className="flex flex-col gap-1.5">
 <span className="text-xs text-zinc-500 font-medium">IP Address</span>
 {renderBits(info.ip)}
 </div>
 <div className="flex flex-col gap-1.5">
 <span className="text-xs text-zinc-500 font-medium">Netmask</span>
 {renderBits(info.mask)}
 </div>
 </div>
 </div>
 </>
 ) : (
 <div className="text-center py-20 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
 Enter a valid CIDR string to see network metrics.
 </div>
 )}
 </div>
 </div>
 );
}

function MetricCard({ label, value, id, copiedId, onCopy }: { label: string; value: string | number; id: string; copiedId: string | null; onCopy: (val: string, id: string) => void }) {
 return (
 <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative group hover:border-zinc-300 transition-all flex flex-col justify-center min-h-[90px]">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{label}</span>
 <button 
 onClick={() => onCopy(value.toString(), id)}
 className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 hover:bg-zinc-200 focus:opacity-100"
 title="Copy value"
 >
 {copiedId === id ? (
 <Check className="w-3.5 h-3.5 text-zinc-900"/>
 ) : (
 <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-900 transition-colors"/>
 )}
 </button>
 </div>
 <span className="font-mono text-base font-bold text-zinc-900 select-all pr-6">{value}</span>
 </div>
 );
}
