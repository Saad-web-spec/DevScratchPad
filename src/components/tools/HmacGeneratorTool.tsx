"use client";

import { useState, useEffect, useMemo } from"react";
import { generateHmac, type HmacAlgorithm } from"@/lib/tools/hmac";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import {
 KeyRound,
 FileCode,
 ShieldCheck,
 ShieldAlert,
 Copy,
 Check,
 Eye,
 EyeOff,
 Sparkles,
 Trash2,
 Cpu,
 ArrowRightLeft,
 CheckCircle2,
 XCircle,
 Shield } from"lucide-react";
import { cn } from"@/lib/utils";
import { ValidationBadge } from"@/components/layout/StatusBar";

interface HmacGeneratorToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

interface AlgorithmOption {
 value: HmacAlgorithm;
 label: string;
 bits: number;
}

const ALGORITHM_OPTIONS: AlgorithmOption[] = [
 { value:"SHA256", label:"HMAC-SHA256", bits: 256 },
 { value:"SHA512", label:"HMAC-SHA512", bits: 512 },
 { value:"SHA384", label:"HMAC-SHA384", bits: 384 },
 { value:"SHA224", label:"HMAC-SHA224", bits: 224 },
 { value:"SHA1", label:"HMAC-SHA1", bits: 160 },
 { value:"MD5", label:"HMAC-MD5", bits: 128 },
];

export function HmacGeneratorTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: HmacGeneratorToolProps) {
 const [secret, setSecret] = useState<string>("");
 const [payload, setPayload] = useState<string>("");
 const [algo, setAlgo] = useState<HmacAlgorithm>("SHA256");
 const [showSecret, setShowSecret] = useState<boolean>(false);
 const [outputFormat, setOutputFormat] = useState<"hex"|"base64"|"both">("both");
 const [hexOutput, setHexOutput] = useState<string>("");
 const [base64Output, setBase64Output] = useState<string>("");
 const [copiedType, setCopiedType] = useState<string | null>(null);
 const [isValid, setIsValid] = useState<boolean>(true);
 const [compareSignature, setCompareSignature] = useState<string>("");
 const [showVerifier, setShowVerifier] = useState<boolean>(false);

 // Dispatch workspace state
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input: payload, output: hexOutput },
 })
 );
 }
 }, [payload, hexOutput]);

 // Restore from history / share URL
 useEffect(() => {
 if (restoredInput) {
 try {
 const parsed = JSON.parse(restoredInput);
 if (parsed && typeof parsed ==="object") {
 if ("secret"in parsed && typeof parsed.secret ==="string") setSecret(parsed.secret);
 if ("payload"in parsed && typeof parsed.payload ==="string") setPayload(parsed.payload);
 if ("algo"in parsed && typeof parsed.algo ==="string") setAlgo(parsed.algo as HmacAlgorithm);
 return;
 }
 } catch {}
 setPayload(restoredInput);
 }
 }, [restoredInput]);

 // Compute HMAC in real time
 useEffect(() => {
 const start = performance.now();
 try {
 if (secret && payload) {
 const result = generateHmac(secret, payload, algo);
 setHexOutput(result.hex);
 setBase64Output(result.base64);
 setIsValid(true);
 onValidationChange(true);
 } else {
 setHexOutput("");
 setBase64Output("");
 setIsValid(true);
 onValidationChange(true);
 }
 } catch (err: any) {
 setIsValid(false);
 onValidationChange(false, err?.message ||"Calculation error");
 setHexOutput("");
 setBase64Output("");
 }
 const end = performance.now();
 onStatsChange(payload.length, end - start);
 }, [secret, payload, algo, onValidationChange, onStatsChange]);

 const payloadByteCount = useMemo(() => {
 try {
 return new TextEncoder().encode(payload).length;
 } catch {
 return payload.length;
 }
 }, [payload]);

 // Signature verification logic
 const verificationResult = useMemo(() => {
 if (!compareSignature.trim() || (!hexOutput && !base64Output)) return null;
 const cleanComp = compareSignature.trim();
 // Allow prefix like sha256= or v1=
 const normalizedInput = cleanComp.replace(/^(sha(1|256|384|512|224|md5)=|v\d+=)/i,"").trim().toLowerCase();
 const hexNorm = hexOutput.toLowerCase();
 const b64Norm = base64Output.trim();

 if (normalizedInput === hexNorm || cleanComp === hexOutput) {
 return { match: true, format:"HEX"};
 }
 if (cleanComp === b64Norm || normalizedInput === b64Norm.toLowerCase()) {
 return { match: true, format:"Base64"};
 }
 return { match: false };
 }, [compareSignature, hexOutput, base64Output]);

 const handleCopy = (text: string, typeKey: string) => {
 if (!text) return;
 navigator.clipboard.writeText(text);
 setCopiedType(typeKey);
 onLogHistory?.(payload);
 setTimeout(() => setCopiedType(null), 1600);
 };

 const handleGenerateRandomKey = () => {
 const chars ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
 const array = new Uint8Array(32);
 if (typeof window !=="undefined"&& window.crypto) {
 window.crypto.getRandomValues(array);
 const randomStr = Array.from(array, (byte) => chars[byte % chars.length]).join("");
 setSecret(randomStr);
 } else {
 let result ="";
 for (let i = 0; i < 32; i++) {
 result += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 setSecret(result);
 }
 };

 const handleClearAll = () => {
 setSecret("");
 setPayload("");
 setCompareSignature("");
 };

 const hasMissingSecret = payload.trim().length > 0 && secret.trim().length === 0;

 const btnClasses ="h-9 px-3 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors shrink-0";

 return (
 <div className="flex flex-col h-full bg-white overflow-y-auto w-full overflow-x-hidden">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 px-3 md:px-6 py-2.5 md:py-0 bg-[#f8fafc] ] shrink-0 sticky top-0 z-20">
 <div className="flex items-center gap-2">
 <Shield className="w-4 h-4 text-zinc-900"/>
 <h2 className="text-sm font-semibold text-zinc-800">HMAC Generator</h2>
 </div>

 <div className="flex items-center gap-2">
 <ValidationBadge isValid={isValid && !hasMissingSecret} />

 <ExportImageButton code={hexOutput || payload || secret} language="plaintext"className={btnClasses} />
 <EmbedButton toolSlug="hmac-generator"data={{ secret, payload, algo }} className={btnClasses} />
 <ShareButton toolSlug="hmac-generator"data={{ secret, payload, algo }} className={btnClasses} />

 <div className="h-5 w-px bg-zinc-200 mx-1 shrink-0"/>

 <button
 onClick={handleClearAll}
 className="h-9 px-3 text-xs text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
 title="Clear all fields"
 >
 <Trash2 className="w-3.5 h-3.5"/>
 <span className="hidden sm:inline">Clear</span>
 </button>

 <button
 onClick={() => handleCopy(hexOutput || base64Output,"primary")}
 disabled={!hexOutput}
 className={cn(
"h-9 px-4 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0",
 hexOutput
 ? copiedType ==="primary"
 ?"bg-zinc-900 text-zinc-900 shadow-zinc-900/20"
 :"bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/20 active:scale-95"
 :"bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-60"
 )}
 >
 {copiedType ==="primary"? (
 <Check className="w-3.5 h-3.5"/>
 ) : (
 <Copy className="w-3.5 h-3.5"/>
 )}
 <span>{copiedType ==="primary"?"Copied Signature!":"Copy Result"}</span>
 </button>
 </div>
 </div>

 {/* Main Workspace Layout */}
 <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
 
 {/* ================= LEFT COLUMN: INPUT CONFIGURATION ================= */}
 <div className="lg:col-span-6 flex flex-col gap-5">
 <div className="bg-white ] border border-zinc-200 rounded-xl p-5 shadow-sm space-y-5">
 
 {/* Algorithm Selector */}
 <div className="space-y-2">
 <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
 <Cpu className="w-4 h-4 text-zinc-400"/>
 <span>Hash Algorithm</span>
 </label>
 <select
 value={algo}
 onChange={(e) => setAlgo(e.target.value as HmacAlgorithm)}
 className="bg-zinc-50 border border-zinc-200 text-sm font-medium rounded-lg p-2.5 w-full focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-zinc-900"
 >
 {ALGORITHM_OPTIONS.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 </div>

 {/* Secret Key Input */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
 <KeyRound className="w-4 h-4 text-zinc-400"/>
 <span>Secret Key</span>
 </label>
 </div>
 
 <div className="relative">
 <input
 type={showSecret ?"text":"password"}
 value={secret}
 onChange={(e) => setSecret(e.target.value)}
 placeholder="Enter secret key..."
 className={cn(
"w-full font-mono text-sm tracking-wide bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 pr-20 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900",
 hasMissingSecret &&"border-amber-500/80"
 )}
 />
 
 <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
 <button
 type="button"
 onClick={handleGenerateRandomKey}
 className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors rounded-md hover:bg-emerald-50"
 title="Random Key"
 >
 <Sparkles className="w-3.5 h-3.5"/>
 </button>
 <button
 type="button"
 onClick={() => setShowSecret(!showSecret)}
 className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded-md hover:bg-zinc-200"
 title={showSecret ?"Hide secret":"Show secret"}
 >
 {showSecret ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
 </button>
 </div>
 </div>
 {hasMissingSecret && (
 <p className="text-[11px] text-amber-600 flex items-center gap-1">
 <ShieldAlert className="w-3.5 h-3.5"/>
 <span>Secret key is required.</span>
 </p>
 )}
 </div>

 {/* Payload Textarea */}
 <div className="space-y-2">
 <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
 <FileCode className="w-4 h-4 text-zinc-400"/>
 <span>Payload Text</span>
 </label>
 
 <div className="relative border border-zinc-200 rounded-lg bg-zinc-50 flex flex-col focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
 <textarea
 value={payload}
 onChange={(e) => setPayload(e.target.value)}
 placeholder="Enter payload string or JSON data to sign..."
 rows={8}
 className="w-full font-mono text-sm leading-relaxed bg-transparent p-3 focus:outline-none resize-y text-zinc-900"
 />
 
 {/* Status Bar for TextArea */}
 <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-200 bg-zinc-100/50 text-[10px] text-zinc-500 font-mono rounded-b-lg">
 <span>{payload.length} chars</span>
 <span>{payloadByteCount} bytes</span>
 </div>
 </div>
 </div>
 
 </div>
 </div>


 {/* ================= RIGHT COLUMN: GRADIENT OUTPUT ================= */}
 <div className="lg:col-span-6 flex flex-col gap-5">
 <div className="bg-gradient-to-br from-zinc-50 to-emerald-50/30 ] border border-zinc-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-5">
 
 {/* Header & Switcher */}
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-zinc-900"/>
 Computed Digest
 </h3>
 
 <div className="inline-flex p-0.5 bg-zinc-200/50 border border-zinc-300/50 rounded-lg p-1 gap-1">
 <button
 onClick={() => setOutputFormat("hex")}
 className={cn(
"px-3 py-1 text-xs font-medium rounded-md transition-all",
 outputFormat ==="hex"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 HEX
 </button>
 <button
 onClick={() => setOutputFormat("base64")}
 className={cn(
"px-3 py-1 text-xs font-medium rounded-md transition-all",
 outputFormat ==="base64"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 BASE64
 </button>
 <button
 onClick={() => setOutputFormat("both")}
 className={cn(
"px-3 py-1 text-xs font-medium rounded-md transition-all",
 outputFormat ==="both"
 ?"bg-white text-zinc-900 font-semibold shadow-xs rounded-md px-2.5 py-1 text-xs"
 :"text-zinc-500 hover:text-zinc-900 px-2.5 py-1 text-xs"
 )}
 >
 BOTH
 </button>
 </div>
 </div>

 {/* Output Display */}
 <div className="space-y-4">
 {(outputFormat ==="hex"|| outputFormat ==="both") && (
 <div className="space-y-2">
 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hex Output</span>
 <div className="bg-zinc-900 border border-zinc-800 text-zinc-900 rounded-lg p-4 font-mono text-sm tracking-wide text-zinc-900 break-all select-all shadow-inner relative group min-h-[64px] flex items-center">
 {hexOutput || <span className="text-zinc-600">Waiting for input...</span>}
 
 {hexOutput && (
 <button
 onClick={() => handleCopy(hexOutput,"hex")}
 className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all backdrop-blur border border-zinc-700/50"
 title="Copy Hex"
 >
 {copiedType ==="hex"? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 </button>
 )}
 </div>
 </div>
 )}
 
 {(outputFormat ==="base64"|| outputFormat ==="both") && (
 <div className="space-y-2">
 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Base64 Output</span>
 <div className="bg-zinc-900 border border-zinc-800 text-zinc-900 rounded-lg p-4 font-mono text-sm tracking-wide text-zinc-900 break-all select-all shadow-inner relative group min-h-[64px] flex items-center">
 {base64Output || <span className="text-zinc-600">Waiting for input...</span>}
 
 {base64Output && (
 <button
 onClick={() => handleCopy(base64Output,"base64")}
 className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all backdrop-blur border border-zinc-700/50"
 title="Copy Base64"
 >
 {copiedType ==="base64"? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 </button>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Integration Snippet */}
 <div className="mt-2 space-y-2">
 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Integration Tip (Node.js)</span>
 <div className="bg-[#09090B] border border-zinc-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
 <span className="text-zinc-700">crypto.</span>
 <span className="text-zinc-900">createHmac</span>
 <span className="text-zinc-700">(</span>
 <span className="text-amber-300">&apos;{algo.toLowerCase()}&apos;</span>
 <span className="text-zinc-700">, secret).</span>
 <span className="text-zinc-900">update</span>
 <span className="text-zinc-700">(payload).</span>
 <span className="text-zinc-900">digest</span>
 <span className="text-zinc-700">(</span>
 <span className="text-amber-300">&apos;hex&apos;</span>
 <span className="text-zinc-700">)</span>
 </div>
 </div>
 
 </div>

 {/* Signature Verifier Drawer */}
 <div className="bg-white ] border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
 <button
 type="button"
 onClick={() => setShowVerifier(!showVerifier)}
 className="w-full flex items-center justify-between p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
 >
 <span className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
 <ArrowRightLeft className="w-4 h-4 text-zinc-900"/>
 Verify Expected Signature
 </span>
 <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-200/50 text-zinc-600 border border-zinc-200">
 {showVerifier ?"Collapse":"Expand"}
 </span>
 </button>
 
 {showVerifier && (
 <div className="p-4 border-t border-zinc-200 space-y-3">
 <p className="text-xs text-zinc-500">
 Paste a webhook signature header to check if it matches your computed digest.
 </p>
 
 <input
 type="text"
 value={compareSignature}
 onChange={(e) => setCompareSignature(e.target.value)}
 placeholder="e.g. t=1718...,v1=0045c... or sha256=..."
 className="w-full font-mono text-xs tracking-wide bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
 />

 {verificationResult && (
 <div
 className={cn(
"p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border",
 verificationResult.match
 ?"bg-emerald-50 border-emerald-200 text-emerald-700"
 :"bg-red-50 border-red-200 text-red-700"
 )}
 >
 {verificationResult.match ? (
 <>
 <CheckCircle2 className="w-4 h-4 shrink-0"/>
 <span>MATCH — Valid {verificationResult.format} Signature</span>
 </>
 ) : (
 <>
 <XCircle className="w-4 h-4 shrink-0"/>
 <span>MISMATCH — Signatures do not match</span>
 </>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 </div>
 </div>
 </div>
 </div>
 );
}

export const HmacTool = HmacGeneratorTool;

