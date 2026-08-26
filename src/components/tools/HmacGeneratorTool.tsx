"use client";

import { useState, useEffect } from "react";
import { generateHmac } from "@/lib/tools/hmac";
import { ShareButton } from "@/components/ShareButton";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HmacGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function HmacGeneratorTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: HmacGeneratorToolProps) {
  const [secret, setSecret] = useState<string>('');
  const [payload, setPayload] = useState<string>('');
  const [algo, setAlgo] = useState<'SHA256' | 'SHA512'>('SHA256');
  const [hexOutput, setHexOutput] = useState<string>('');
  const [base64Output, setBase64Output] = useState<string>('');
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
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
        if (parsed && typeof parsed === "object") {
          if ("secret" in parsed) setSecret(parsed.secret || "");
          if ("payload" in parsed) setPayload(parsed.payload || "");
          return;
        }
      } catch {}
      setPayload(restoredInput);
    }
  }, [restoredInput]);

  useEffect(() => {
    const start = performance.now();
    try {
      if (secret && payload) {
        const result = generateHmac(secret, payload, algo);
        setHexOutput(result.hex);
        setBase64Output(result.base64);
      } else {
        setHexOutput('');
        setBase64Output('');
      }
      onValidationChange(true);
    } catch (err: any) {
      onValidationChange(false, err.message);
      setHexOutput('');
      setBase64Output('');
    }
    const end = performance.now();
    onStatsChange(payload.length, end - start);
  }, [secret, payload, algo, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, type: 'hex' | 'base64') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'hex') {
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 2000);
    } else {
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] shrink-0 sticky top-0 z-10 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">HMAC Generator</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Generate HMAC signatures</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="hmac-generator" data={{ secret, payload }} />
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Algorithm</label>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as 'SHA256' | 'SHA512')}
              className="w-full bg-white border border-[#e2e8f0] text-slate-800 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="SHA256">SHA-256</option>
              <option value="SHA512">SHA-512</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Secret Key</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter secret key..."
              className="w-full bg-white border border-[#e2e8f0] text-slate-800 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payload</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Enter data to hash..."
              rows={5}
              className="w-full bg-white border border-[#e2e8f0] text-slate-800 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow font-mono resize-y"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-slate-800">Results</h3>
          
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hex</span>
              <button 
                onClick={() => handleCopy(hexOutput, 'hex')}
                disabled={!hexOutput}
                className={cn("flex items-center gap-1 text-[11px] transition-colors", copiedHex ? "text-emerald-600" : "text-slate-400 hover:text-slate-700 disabled:opacity-50")}
              >
                {copiedHex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHex ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="font-mono text-xs md:text-sm text-slate-800 break-all bg-white border border-[#e2e8f0] p-3 rounded shadow-2xs min-h-[46px]">
              {hexOutput || <span className="text-slate-400 italic">Result will appear here...</span>}
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base64</span>
              <button 
                onClick={() => handleCopy(base64Output, 'base64')}
                disabled={!base64Output}
                className={cn("flex items-center gap-1 text-[11px] transition-colors", copiedBase64 ? "text-emerald-600" : "text-slate-400 hover:text-slate-700 disabled:opacity-50")}
              >
                {copiedBase64 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedBase64 ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="font-mono text-xs md:text-sm text-slate-800 break-all bg-white border border-[#e2e8f0] p-3 rounded shadow-2xs min-h-[46px]">
              {base64Output || <span className="text-slate-400 italic">Result will appear here...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
