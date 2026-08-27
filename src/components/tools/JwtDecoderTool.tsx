"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { decodeJwt } from "@/lib/tools/jwt";
import { ShareButton } from "@/components/ShareButton";
import { Copy, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { StatusBar } from "@/components/layout/StatusBar";

interface JwtDecoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
}

export function JwtDecoderTool({ onValidationChange, onStatsChange, restoredInput }: JwtDecoderToolProps) {
  const [input, setInput] = useState<string>("");
  const [headerOutput, setHeaderOutput] = useState<string>("");
  const [payloadOutput, setPayloadOutput] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [isValid, setIsValid] = useState(true);
  const [execMs, setExecMs] = useState(0);

  // Restore from history / share URL
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

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
    const ms = end - start;
    
    setIsValid(result.valid);
    setExecMs(ms);
    onValidationChange(result.valid, result.error);
    onStatsChange(input.length, ms);

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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JWT Decoder</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Decode JSON Web Tokens instantly and securely</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="jwt-decoder" data={input} />
        </div>
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-zinc-800 p-1 border-b border-[#e2e8f0] dark:border-zinc-700 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          Encoded JWT
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          Decoded Token
        </button>
      </div>

      {/* Dual Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Input */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-700 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Encoded JWT</span>
            <button onClick={() => setInput("")} className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Clear">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative p-4 bg-white dark:bg-zinc-950 min-h-[250px]">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Paste your JWT here (eyJ...)"
               className="w-full h-full bg-transparent text-zinc-700 dark:text-zinc-200 font-mono text-sm resize-none focus:outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-500 break-all"
             />
          </div>
        </div>

        {/* Right: Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 overflow-y-auto bg-white dark:bg-zinc-950 w-full max-w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          
          {/* Header Section */}
          <div className="flex flex-col min-h-[160px] border-b border-[#e2e8f0] dark:border-zinc-700">
            <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wider">Header (Algorithm & Token Type)</span>
              <button onClick={() => handleCopy(headerOutput, 'header')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'header' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200")}>
                {copied === 'header' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'header' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative w-full max-w-full overflow-x-hidden min-h-[120px]">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                value={headerOutput}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 12 } }}
              />
            </div>
          </div>

          {/* Payload Section */}
          <div className="flex flex-col min-h-[220px] border-b border-[#e2e8f0] dark:border-zinc-700">
            <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Payload (Data & Claims)</span>
              <button onClick={() => handleCopy(payloadOutput, 'payload')} className={cn("flex items-center gap-1 text-[11px] transition-colors", copied === 'payload' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200")}>
                {copied === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'payload' ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 relative w-full max-w-full overflow-x-hidden min-h-[180px]">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                value={payloadOutput}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 12 } }}
              />
            </div>
          </div>

          {/* Signature Section */}
          <div className="flex flex-col min-h-[80px]">
            <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-700 flex items-center justify-between px-3 shrink-0">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Signature</span>
            </div>
            <div className="flex-1 p-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">{signature || "Waiting for token..."}</p>
            </div>
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
