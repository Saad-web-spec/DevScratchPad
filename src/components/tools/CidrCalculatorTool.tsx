"use client";

import { useState, useEffect } from "react";
import { parseCidr, CidrInfo } from "@/lib/tools/cidr";
import { Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CidrCalculatorToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

export function CidrCalculatorTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: CidrCalculatorToolProps) {
  const [input, setInput] = useState<string>('192.168.1.0/24');
  const [info, setInfo] = useState<CidrInfo | null>(null);

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output: info ? JSON.stringify(info) : "" },
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
          onValidationChange(true);
        } else {
          setInfo(null);
          onValidationChange(false, result.error);
        }
      } else {
        setInfo(null);
        onValidationChange(true);
      }
    } catch (err: any) {
      setInfo(null);
      onValidationChange(false, err.message);
    }
    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, onValidationChange, onStatsChange]);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0 sticky top-0 z-10">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">CIDR Calculator</h2>
          <p className="text-[11px] text-slate-400">Calculate IP ranges and subnets</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { try { window.location.hash = 'data=' + btoa(input); } catch(e) {} }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">CIDR Notation</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 192.168.1.0/24"
            className="w-full bg-white border border-[#e2e8f0] text-slate-800 text-base rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow font-mono shadow-sm"
          />
        </div>

        {info ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard label="Network Address" value={info.network} />
            <MetricCard label="Broadcast Address" value={info.broadcast} />
            <MetricCard label="First Usable" value={info.firstUsable} />
            <MetricCard label="Last Usable" value={info.lastUsable} />
            <MetricCard label="Subnet Mask" value={info.mask} />
            <MetricCard label="Wildcard Mask" value={info.wildcard} />
            <MetricCard label="Total Hosts" value={info.totalHosts.toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Enter a valid CIDR string to see the network metrics.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-center shadow-sm">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</span>
      <span className="text-lg font-semibold text-blue-600 font-mono break-all">{value}</span>
    </div>
  );
}
