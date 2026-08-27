"use client";

import { useState, useEffect } from "react";
import { parseTimestamp, TimestampResult } from "@/lib/tools/timestamp";
import { ShareButton } from "@/components/ShareButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Clock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ValidationBadge } from "@/components/layout/StatusBar";

interface TimestampConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
}

export function TimestampConverterTool({ onValidationChange, onStatsChange, restoredInput }: TimestampConverterToolProps) {
  const [input, setInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [result, setResult] = useState<TimestampResult>({ valid: true });
  const [copied, setCopied] = useState<string | null>(null);

  // Restore from history / share URL
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("timestamp", "Unix Timestamp", input, JSON.stringify(result, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, result]);

  useEffect(() => {
    const start = performance.now();
    const parsed = parseTimestamp(input);
    const end = performance.now();
    
    setResult(parsed);
    onValidationChange(parsed.valid, parsed.error);
    onStatsChange(input.length, end - start);
  }, [input, onValidationChange, onStatsChange]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const ResultCard = ({ title, value, id }: { title: string; value?: string | number; id: string }) => (
    <div className="bg-[#f8fafc] dark:bg-[#121215] border border-[#e2e8f0] dark:border-[#27272A] rounded-lg p-3.5 md:p-4 flex items-center justify-between group hover:border-zinc-200 dark:hover:border-zinc-600 transition-colors gap-2 min-w-0">
      <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
        <span className="text-[10px] md:text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</span>
        <span className="text-xs md:text-sm font-mono text-zinc-800 dark:text-zinc-200 break-all">{value !== undefined ? value : "-"}</span>
      </div>
      <button 
        onClick={() => value && handleCopy(value.toString(), id)} 
        className={cn("p-1.5 md:p-2 rounded-md transition-colors shrink-0", copied === id ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : "bg-[#f8fafc] dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100")}
        title={copied === id ? "Copied!" : "Copy"}
      >
        {copied === id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Unix Timestamp Converter</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Convert Epoch to human-readable dates and vice versa</p>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ValidationBadge isValid={result.valid} />
          <ExportImageButton code={input} language="plaintext" />
          <ShareButton toolSlug="unix-timestamp" data={input} />
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6 md:gap-8">
        
        {/* Input Section */}
        <div className="flex items-center bg-[#121215] border border-[#27272A] rounded-lg p-1.5 px-3 md:px-4 gap-2 md:gap-3 focus-within:ring-1 focus-within:ring-zinc-400">
          <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter epoch (1770000000) or date string (2025-01-01)"
            className="flex-1 min-w-0 bg-transparent text-zinc-100 font-mono text-base tracking-wide focus:outline-none placeholder:text-zinc-500 py-1.5"
          />
          <button 
            onClick={() => setInput(Math.floor(Date.now() / 1000).toString())}
            className="h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors shrink-0"
          >
            Now
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <ResultCard title="Relative Time" value={result.relativeString} id="relative" />
          <ResultCard title="Local Time" value={result.localString} id="local" />
          <ResultCard title="UTC Time" value={result.utcString} id="utc" />
          <ResultCard title="ISO 8601" value={result.isoString} id="iso" />
          <ResultCard title="Unix Epoch (Seconds)" value={result.unixSeconds} id="seconds" />
          <ResultCard title="Unix Epoch (Milliseconds)" value={result.unixMs} id="milliseconds" />
        </div>
      </div>
    </div>
  );
}
