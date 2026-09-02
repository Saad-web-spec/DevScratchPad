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
    <div className="flex flex-col h-full bg-white w-full overflow-y-auto relative">
      {/* Top Controls Bar (Unified Clean Header) */}
      <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono font-medium text-neutral-600">JWT Decoder</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ExportImageButton code={payloadObj ? JSON.stringify(payloadObj, null, 2) : input} language="json" />
          <EmbedButton toolSlug="jwt" data={input} />
          <ShareButton toolSlug="jwt" data={input} />
        </div>
      </div>

      {/* Main Workspace Layout (Strict Dual-Pane Grid) */}
      <div className="flex-1 min-h-[520px] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 overflow-hidden bg-neutral-50/30">
        
        {/* Left Pane: Encoded Input */}
        <div className="flex flex-col h-full bg-white relative min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">ENCODED TOKEN</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setInput("")} className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Clear</button>
              <button onClick={() => handleCopy(input, 'input')} className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5 ml-1" title="Copy">
                {copied === 'input' ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative bg-white overflow-hidden">
            <div className="absolute inset-0 p-4 font-mono text-xs sm:text-[13px] break-all whitespace-pre-wrap pointer-events-none leading-[1.6]">
              <span className="text-neutral-900 font-bold">{headerPart}</span>
              {payloadPart !== null && <span className="text-neutral-400">.</span>}
              {payloadPart !== null && <span className="text-neutral-600 font-medium">{payloadPart}</span>}
              {signaturePart !== null && <span className="text-neutral-400">.</span>}
              {signaturePart !== null && <span className="text-neutral-400 font-medium">{signaturePart}</span>}
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder="Paste your JWT here (eyJ...)"
              className="absolute inset-0 p-4 w-full h-full font-mono text-xs sm:text-[13px] bg-transparent text-transparent caret-neutral-900 resize-none outline-none break-all leading-[1.6] placeholder:text-neutral-400"
            />
          </div>

          <div className="shrink-0 bg-white border-t border-neutral-200">
            <StatusBar
              isValid={isValid}
              inputLength={input.length}
              executionMs={execMs}
            />
          </div>
        </div>

        {/* Right Pane: Decoded Output */}
        <div className="flex flex-col h-full bg-neutral-50/30 min-h-0 overflow-y-auto">
            <div className="flex flex-col h-full divide-y divide-neutral-200">
              
              {/* Header Section */}
              <div className="flex flex-col shrink-0 bg-white">
                <div className="h-10 bg-neutral-50 flex items-center justify-between px-4 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">HEADER</span>
                    {headerObj?.alg && (
                      <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[9px] font-bold rounded uppercase font-mono">
                        {headerObj.alg}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleCopy(JSON.stringify(headerObj, null, 2), 'header')} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1" title="Copy JSON">
                    {copied === 'header' ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4">
                  <div className="font-mono text-xs text-neutral-800 bg-neutral-50 p-3 rounded-md border border-neutral-200 overflow-x-auto">
                    {headerObj ? <JsonViewer data={headerObj} /> : <span className="text-neutral-400 italic">No header data</span>}
                  </div>
                </div>
              </div>

              {/* Payload Section */}
              <div className="flex flex-col flex-1 bg-white">
                <div className="h-10 bg-neutral-50 flex items-center justify-between px-4 border-b border-neutral-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">PAYLOAD (CLAIMS)</span>
                    <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[9px] font-bold rounded uppercase font-mono">
                      DATA
                    </span>
                  </div>
                  <button onClick={() => handleCopy(JSON.stringify(payloadObj, null, 2), 'payload')} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1" title="Copy JSON">
                    {copied === 'payload' ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <div className="font-mono text-xs text-neutral-800 bg-neutral-50 p-3 rounded-md border border-neutral-200 h-full overflow-y-auto min-h-[160px]">
                    {payloadObj ? <JsonViewer data={payloadObj} /> : <span className="text-neutral-400 italic">No payload data</span>}
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="flex flex-col shrink-0 bg-white">
                <div className="h-10 bg-neutral-50 flex items-center justify-between px-4 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">SIGNATURE STATUS</span>
                  </div>
                  {sigStatus === "valid" ? (
                    <span className="px-1.5 py-0.5 bg-green-100 border border-green-200 text-green-800 text-[9px] font-bold rounded uppercase font-mono">
                      VERIFIED
                    </span>
                  ) : sigStatus === "invalid" && secret.length > 0 ? (
                    <span className="px-1.5 py-0.5 bg-red-100 border border-red-200 text-red-800 text-[9px] font-bold rounded uppercase font-mono">
                      INVALID
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 text-[9px] font-bold rounded uppercase font-mono">
                      UNVERIFIED
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="font-mono text-[11px] text-neutral-500 break-all bg-neutral-50 p-2 rounded border border-neutral-100">
                    {signature || "No signature"}
                  </div>
                  {headerObj?.alg?.startsWith('HS') && (
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-md border border-neutral-200 shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 transition-all">
                      <input 
                        type="text"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder={`${headerObj.alg} Secret Key to Verify Signature...`}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-neutral-900 px-2 placeholder:text-neutral-400"
                      />
                    </div>
                  )}
                  {headerObj?.alg && !headerObj.alg.startsWith('HS') && (
                    <p className="text-[10px] text-neutral-400 italic">
                      Signature verification is currently supported for HMAC algorithms.
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