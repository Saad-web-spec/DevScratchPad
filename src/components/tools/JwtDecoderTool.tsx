"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { decodeJwt } from "@/lib/tools/jwt";
import { Copy, Trash2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface JwtDecoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
}

export function JwtDecoderTool({ onValidationChange, onStatsChange }: JwtDecoderToolProps) {
  const [input, setInput] = useState<string>("");
  const [headerOutput, setHeaderOutput] = useState<string>("");
  const [payloadOutput, setPayloadOutput] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("jwt", "JWT Decoder", input, payloadOutput);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, payloadOutput]);

  useEffect(() => {
    const start = performance.now();
    const result = decodeJwt(input);
    const end = performance.now();
    
    onValidationChange(result.valid, result.error);
    onStatsChange(input.length, end - start);

    if (result.valid && result.header) {
      setHeaderOutput(result.header);
      setPayloadOutput(result.payload || "");
      setSignature(result.signature || "");
    } else {
      setHeaderOutput("");
      setPayloadOutput("");
      setSignature("");
    }
  }, [input, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">JWT Decoder</h2>
          <p className="text-[11px] text-slate-400">Decode JSON Web Tokens instantly and securely</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(input);
              } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Encoded JWT</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative p-4 bg-white">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Paste your JWT here (eyJ...)"
               className="w-full h-full bg-transparent text-slate-700 font-mono text-sm resize-none focus:outline-none placeholder:text-slate-500 break-all"
             />
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
          
          {/* Header Section */}
          <div className="flex flex-col min-h-[30%] border-b border-[#e2e8f0]">
            <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-pink-600 uppercase tracking-wider">Header (Algorithm & Token Type)</span>
              <button onClick={() => handleCopy(headerOutput, 'header')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'header' ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
                {copied === 'header' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'header' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                theme="vs"
                value={headerOutput}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 12 } }}
              />
            </div>
          </div>

          {/* Payload Section */}
          <div className="flex flex-col min-h-[50%] border-b border-[#e2e8f0]">
            <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Payload (Data & Claims)</span>
              <button onClick={() => handleCopy(payloadOutput, 'payload')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'payload' ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
                {copied === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'payload' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                theme="vs"
                value={payloadOutput}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 12 } }}
              />
            </div>
          </div>

          {/* Signature Section */}
          <div className="flex flex-col h-[20%] min-h-[100px]">
            <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Signature</span>
            </div>
            <div className="flex-1 p-3">
              <p className="text-xs text-slate-500 font-mono break-all">{signature || "Waiting for token..."}</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
