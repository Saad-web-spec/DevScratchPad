"use client";

import { useState, useEffect } from "react";
import { parseTimestamp, TimestampResult } from "@/lib/tools/timestamp";
import { Clock, Calendar, Copy, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface TimestampConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
}

export function TimestampConverterTool({ onValidationChange, onStatsChange }: TimestampConverterToolProps) {
  const [input, setInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [result, setResult] = useState<TimestampResult>({ valid: true });
  const [copied, setCopied] = useState<string | null>(null);

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
    setTimeout(() => setCopied(null), 2000);
  };

  const ResultCard = ({ title, value, id }: { title: string; value?: string | number; id: string }) => (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 flex items-center justify-between group hover:border-slate-200 transition-colors">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-sm font-mono text-slate-800">{value !== undefined ? value : "-"}</span>
      </div>
      <button 
        onClick={() => value && handleCopy(value.toString(), id)} 
        className={cn("p-2 rounded-md transition-colors", copied === id ? "bg-emerald-50 text-emerald-600" : "bg-[#f8fafc] text-slate-500 hover:text-slate-800 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100")}
      >
        {copied === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Unix Timestamp Converter</h2>
          <p className="text-[11px] text-slate-400">Convert Epoch to human-readable dates and vice versa</p>
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

      <div className="p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">
        
        {/* Input Section */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-1">
          <div className="flex items-center bg-[#f8fafc] rounded-lg p-2 px-4 gap-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter epoch (1770000000) or date string (2025-01-01)"
              className="flex-1 bg-transparent text-slate-800 font-mono text-lg focus:outline-none"
            />
            <button 
              onClick={() => setInput(Math.floor(Date.now() / 1000).toString())}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-xs font-medium transition-colors"
            >
              Now
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
