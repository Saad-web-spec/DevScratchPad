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
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

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
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">JWT Decoder</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Decode JSON Web Tokens instantly and securely</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(input);
              } catch {}
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] p-1 border-b border-[#e2e8f0] shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Encoded JWT
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Decoded Token
        </button>
      </div>

      {/* Dual Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Encoded JWT</span>
            <button onClick={() => setInput("")} className="text-slate-400 hover:text-red-600 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative p-4 bg-white min-h-[250px]">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Paste your JWT here (eyJ...)"
               className="w-full h-full bg-transparent text-slate-700 font-mono text-sm resize-none focus:outline-none placeholder:text-slate-500 break-all"
             />
          </div>
        </div>

        {/* Right: Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 overflow-y-auto bg-white w-full max-w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          
          {/* Header Section */}
          <div className="flex flex-col min-h-[160px] border-b border-[#e2e8f0]">
            <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-pink-600 uppercase tracking-wider">Header (Algorithm & Token Type)</span>
              <button onClick={() => handleCopy(headerOutput, 'header')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'header' ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
                {copied === 'header' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'header' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative w-full max-w-full overflow-x-hidden min-h-[120px]">
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
          <div className="flex flex-col min-h-[220px] border-b border-[#e2e8f0]">
            <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Payload (Data & Claims)</span>
              <button onClick={() => handleCopy(payloadOutput, 'payload')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'payload' ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}>
                {copied === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'payload' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative w-full max-w-full overflow-x-hidden min-h-[180px]">
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
          <div className="flex flex-col min-h-[80px]">
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
