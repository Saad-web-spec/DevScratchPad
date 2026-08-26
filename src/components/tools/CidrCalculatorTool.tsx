"use client";

import { useState, useEffect } from "react";
import { parseCidr, CidrInfo } from "@/lib/tools/cidr";
import { ShareButton } from "@/components/ShareButton";
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-800 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 sticky top-0 z-10 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">CIDR Calculator</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Calculate IP ranges and subnets</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="cidr-calculator" data={input} />
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 md:space-y-8">
        <div>
          <label className="block text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 md:mb-2">CIDR Notation</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 192.168.1.0/24"
            className="w-full bg-white dark:bg-zinc-900 border border-[#e2e8f0] dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm md:text-base rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow font-mono shadow-2xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        {info ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <MetricCard label="Network Address" value={info.network} />
            <MetricCard label="Broadcast Address" value={info.broadcast} />
            <MetricCard label="First Usable" value={info.firstUsable} />
            <MetricCard label="Last Usable" value={info.lastUsable} />
            <MetricCard label="Subnet Mask" value={info.mask} />
            <MetricCard label="Wildcard Mask" value={info.wildcard} />
            <MetricCard label="Total Hosts" value={info.totalHosts.toLocaleString()} />
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
            Enter a valid CIDR string to see the network metrics.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#f8fafc] dark:bg-zinc-900 border border-[#e2e8f0] dark:border-zinc-800 rounded-xl p-4 md:p-5 flex flex-col justify-center shadow-2xs">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 md:mb-2">{label}</span>
      <span className="text-base md:text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono break-all">{value}</span>
    </div>
  );
}
