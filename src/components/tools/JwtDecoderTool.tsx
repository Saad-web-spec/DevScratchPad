"use client";

import { useState, useEffect } from"react";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Copy, Trash2, Check, Key, Database, ShieldCheck, ShieldAlert } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { StatusBar } from"@/components/layout/StatusBar";
import { formatDistanceToNow } from"date-fns";

interface JwtDecodeResult {
 valid: boolean;
 headerObj?: any;
 payloadObj?: any;
 signature?: string;
 error?: string;
}

function base64UrlDecode(str: string): string {
 let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
 while (base64.length % 4 !== 0) {
 base64 += '=';
 }
 return decodeURIComponent(
 atob(base64)
 .split('')
 .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
 .join('')
 );
}

function decodeJwt(token: string): JwtDecodeResult {
 if (!token || token.trim() === '') {
 return { valid: true };
 }
 const parts = token.trim().split('.');
 if (parts.length !== 3) {
 return { valid: false, error: 'Invalid JWT format (must have 3 parts separated by dots)' };
 }
 try {
 const rawHeader = base64UrlDecode(parts[0]);
 const rawPayload = base64UrlDecode(parts[1]);
 const headerObj = JSON.parse(rawHeader);
 const payloadObj = JSON.parse(rawPayload);
 return { valid: true, headerObj, payloadObj, signature: parts[2] };
 } catch (err: any) {
 return { valid: false, error: 'Failed to parse JWT: ' + err.message };
 }
}

async function verifyHs256(token: string, secret: string): Promise<boolean> {
 try {
 const parts = token.trim().split('.');
 if (parts.length !== 3) return false;
 
 const encoder = new TextEncoder();
 const data = encoder.encode(parts[0] + '.' + parts[1]);
 const key = await crypto.subtle.importKey(
 'raw',
 encoder.encode(secret),
 { name: 'HMAC', hash: 'SHA-256' },
 false,
 ['verify']
 );
 
 let base64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
 while (base64.length % 4) base64 += '=';
 const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
 
 return await crypto.subtle.verify('HMAC', key, sigBytes, data);
 } catch {
 return false;
 }
}

// A simple recursive JSON viewer with smart claim badges
const JsonViewer = ({ data, level = 0, isLast = true }: { data: any, level?: number, isLast?: boolean }) => {
 if (data === null) return <span className="text-zinc-500">null{isLast ? '' : ','}</span>;
 if (typeof data === 'boolean') return <span className="text-blue-500">{data ? 'true' : 'false'}{isLast ? '' : ','}</span>;
 if (typeof data === 'number') return <span className="text-blue-500">{data}{isLast ? '' : ','}</span>;
 if (typeof data === 'string') return <span className="text-amber-500">"{data}"{isLast ? '' : ','}</span>;

 const indent = ' '.repeat(level);
 const nextIndent = ' '.repeat(level + 1);

 if (Array.isArray(data)) {
 if (data.length === 0) return <span>[]{isLast ? '' : ','}</span>;
 return (
 <span>
 [
 <br />
 {data.map((item, i) => (
 <span key={i}>
 {nextIndent}
 <JsonViewer data={item} level={level + 1} isLast={i === data.length - 1} />
 <br />
 </span>
 ))}
 {indent}]{isLast ? '' : ','}
 </span>
 );
 }

 const entries = Object.entries(data);
 if (entries.length === 0) return <span>{"{}"}{isLast ? '' : ','}</span>;

 return (
 <span>
 {"{"}
 <br />
 {entries.map(([key, val], i) => {
 const isTimeClaim = ['exp', 'iat', 'nbf'].includes(key) && typeof val === 'number';
 let badge = null;
 if (isTimeClaim) {
 try {
 const d = new Date((val as number) * 1000);
 const dist = formatDistanceToNow(d, { addSuffix: true });
 badge = (
 <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-200 text-zinc-600">
 {d.toLocaleString()} ({dist})
 </span>
 );
 } catch (e) {}
 }
 
 return (
 <span key={key}>
 {nextIndent}
 <span className="text-indigo-400">"{key}"</span>
 <span className="text-zinc-400 mr-1">:</span>
 <JsonViewer data={val} level={level + 1} isLast={i === entries.length - 1} />
 {badge}
 <br />
 </span>
 );
 })}
 {indent}{"}"}{isLast ? '' : ','}
 </span>
 );
};

interface JwtDecoderToolProps {
 onValidationChange: (isValid: boolean, error?: string) => void;
 onStatsChange: (length: number, execMs: number) => void;
 restoredInput?: string | null;
}

export function JwtDecoderTool({ onValidationChange, onStatsChange, restoredInput }: JwtDecoderToolProps) {
 const [input, setInput] = useState<string>("");
 const [headerObj, setHeaderObj] = useState<any>(null);
 const [payloadObj, setPayloadObj] = useState<any>(null);
 const [signature, setSignature] = useState<string>("");
 
 const [secret, setSecret] = useState<string>("");
 const [sigStatus, setSigStatus] = useState<"unknown"|"valid"|"invalid">("unknown");

 const [copied, setCopied] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [execMs, setExecMs] = useState(0);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("jwt","JWT Decoder", input, payloadObj ? JSON.stringify(payloadObj, null, 2) :"");
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, payloadObj]);

 useEffect(() => {
 const start = performance.now();
 const result = decodeJwt(input);
 const end = performance.now();
 const ms = end - start;
 
 setIsValid(result.valid);
 setExecMs(ms);
 onValidationChange(result.valid, result.error);
 onStatsChange(input.length, ms);

 if (result.valid && result.headerObj) {
 setHeaderObj(result.headerObj);
 setPayloadObj(result.payloadObj);
 setSignature(result.signature ||"");
 } else {
 setHeaderObj(null);
 setPayloadObj(null);
 setSignature("");
 setSigStatus("unknown");
 }
 }, [input, onValidationChange, onStatsChange]);

 useEffect(() => {
 let active = true;
 if (!input || !signature || !secret || !headerObj || headerObj.alg !== 'HS256') {
 setSigStatus("unknown");
 return;
 }
 verifyHs256(input, secret).then(res => {
 if (active) {
 setSigStatus(res ?"valid":"invalid");
 }
 });
 return () => { active = false; };
 }, [input, signature, secret, headerObj]);

 const handleCopy = (text: string, id: string) => {
 if (!text) return;
 navigator.clipboard.writeText(text);
 setCopied(id);
 setTimeout(() => setCopied(null), 1500);
 };

 const parts = input.split('.');
 const headerPart = parts[0] || '';
 const payloadPart = parts[1] !== undefined ? parts[1] : null;
 const signaturePart = parts[2] !== undefined ? parts[2] : null;

 return (
 <div className="flex flex-col h-full bg-[#09090B] w-full overflow-hidden">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-white shrink-0">
 <div className="flex items-center gap-2">
 <Key className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-900">JWT Decoder</h1>
 </div>
 
 <div className="flex items-center gap-2">
 <ExportImageButton code={payloadObj ? JSON.stringify(payloadObj, null, 2) : input} language="json"/>
 <EmbedButton toolSlug="jwt"data={input} />
 <ShareButton toolSlug="jwt"data={input} />
 </div>
 </div>

 {/* Mobile Segmented Tab Control */}
 <div className="flex lg:hidden bg-zinc-50 p-2 border-b border-zinc-200 shrink-0">
 <div className="bg-zinc-200/50 p-1 rounded-lg flex items-center w-full">
 <button
 onClick={() => setActiveTab("input")}
 className={cn(
"flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
 activeTab ==="input"
 ?"bg-white text-zinc-900 shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 Encoded JWT
 </button>
 <button
 onClick={() => setActiveTab("output")}
 className={cn(
"flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
 activeTab ==="output"
 ?"bg-white text-zinc-900 shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 Decoded Token
 </button>
 </div>
 </div>

 {/* Main Canvas Area */}
 <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white ] flex flex-col">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:h-[calc(100vh-140px)] min-h-[600px]">
 
 {/* Left Panel: Encoded Input */}
 <div className={cn("border border-zinc-200 rounded-xl bg-zinc-50 flex flex-col overflow-hidden h-full", activeTab !=="input"&&"hidden lg:flex")}>
 <div className="h-10 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between px-4 shrink-0">
 <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Encoded JWT</span>
 <div className="flex items-center gap-2">
 <button onClick={() => setInput("")} className="text-zinc-400 hover:text-zinc-500 transition-colors p-1"title="Clear">
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 <button onClick={() => handleCopy(input, 'input')} className="text-zinc-400 hover:text-zinc-900 transition-colors p-1">
 {copied === 'input' ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
 </button>
 </div>
 </div>
 
 <div className="flex-1 relative bg-white ]">
 <div className="absolute inset-0 p-4 font-mono text-[13px] sm:text-sm break-all whitespace-pre-wrap pointer-events-none leading-[1.6]">
 <span className="text-rose-500 font-medium">{headerPart}</span>
 {payloadPart !== null && <span className="text-zinc-400">.</span>}
 {payloadPart !== null && <span className="text-purple-500 font-medium">{payloadPart}</span>}
 {signaturePart !== null && <span className="text-zinc-400">.</span>}
 {signaturePart !== null && <span className="text-sky-500 font-medium">{signaturePart}</span>}
 </div>
 <textarea 
 value={input}
 onChange={(e) => setInput(e.target.value)}
 spellCheck={false}
 placeholder="Paste your JWT here (eyJ...)"
 className="absolute inset-0 p-4 w-full h-full font-mono text-[13px] sm:text-sm bg-transparent text-transparent caret-zinc-900 resize-none outline-none break-all leading-[1.6] placeholder:text-zinc-400"
 />
 </div>

 <div className="shrink-0 bg-white border-t border-zinc-200">
 <StatusBar
 isValid={isValid}
 inputLength={input.length}
 executionMs={execMs}
 />
 </div>
 </div>

 {/* Right Panel: Decoded Output */}
 <div className={cn("flex flex-col gap-4 overflow-y-auto pr-1 h-full", activeTab !=="output"&&"hidden lg:flex")}>
 
 {/* Header Card */}
 <div className="border-l-2 border-l-rose-500 border border-zinc-200 bg-zinc-50 rounded-r-xl rounded-l-sm p-4 flex flex-col shrink-0">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Key className="w-3.5 h-3.5 text-rose-500"/>
 <span className="text-rose-500 font-semibold text-xs tracking-wider uppercase">Header</span>
 </div>
 {headerObj && (
 <span className="text-[10px] text-zinc-500 font-mono bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300">Algorithm & Token Type</span>
 )}
 </div>
 <div className="font-mono text-[13px] text-zinc-800 bg-white ] p-3 rounded-lg border border-zinc-200 overflow-x-auto shadow-none">
 {headerObj ? <JsonViewer data={headerObj} /> : <span className="text-zinc-400 italic">No header data</span>}
 </div>
 </div>

 {/* Payload Card */}
 <div className="border-l-2 border-l-purple-500 border border-zinc-200 bg-zinc-50 rounded-r-xl rounded-l-sm p-4 flex flex-col flex-1 min-h-[220px]">
 <div className="flex items-center justify-between mb-3 shrink-0">
 <div className="flex items-center gap-2">
 <Database className="w-3.5 h-3.5 text-purple-500"/>
 <span className="text-purple-500 font-semibold text-xs tracking-wider uppercase">Payload (Claims)</span>
 </div>
 </div>
 <div className="font-mono text-[13px] text-zinc-800 bg-white ] p-3 rounded-lg border border-zinc-200 flex-1 overflow-y-auto shadow-none">
 {payloadObj ? <JsonViewer data={payloadObj} /> : <span className="text-zinc-400 italic">No payload data</span>}
 </div>
 </div>

 {/* Signature Verification Card */}
 <div className="border-l-2 border-l-sky-500 border border-zinc-200 bg-zinc-50 rounded-r-xl rounded-l-sm p-4 flex flex-col shrink-0">
 <div className="flex items-center gap-2 mb-3">
 <ShieldCheck className="w-3.5 h-3.5 text-sky-500"/>
 <span className="text-sky-500 font-semibold text-xs tracking-wider uppercase">Signature Verification</span>
 </div>
 
 <div className="flex flex-col gap-3">
 <div className="font-mono text-xs text-zinc-500 break-all bg-white ] p-3 rounded-lg border border-zinc-200 shadow-none">
 {signature ||"No signature"}
 </div>
 
 {headerObj?.alg?.startsWith('HS') && (
 <div className="flex items-center gap-3 bg-white ] p-2 rounded-lg border border-zinc-200 shadow-none">
 <input 
 type="text"
 value={secret}
 onChange={e => setSecret(e.target.value)}
 placeholder={`${headerObj.alg} Secret Key`}
 className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-zinc-900 px-2 placeholder:text-zinc-400"
 />
 {sigStatus ==="valid"&& (
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
 <Check className="w-3.5 h-3.5"/>
 <span className="text-xs font-semibold">Signature Verified</span>
 </div>
 )}
 {sigStatus ==="invalid"&& secret.length > 0 && (
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-600 border border-zinc-200">
 <ShieldAlert className="w-3.5 h-3.5"/>
 <span className="text-xs font-semibold">Invalid Signature</span>
 </div>
 )}
 </div>
 )}
 {headerObj?.alg && !headerObj.alg.startsWith('HS') && (
 <p className="text-xs text-zinc-500 italic px-1">
 Signature verification is currently supported for HMAC (HS256/384/512) algorithms.
 </p>
 )}
 </div>
 </div>

 </div>
 </div>
 </div>
 </div>
 );
}
