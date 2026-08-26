"use client";

import { useState, useEffect } from "react";
import { explainCron, validateCron } from "@/lib/tools/cron";
import { ShareButton } from "@/components/ShareButton";
import { Clock, Copy, Trash2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronVisualizerToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const PRESETS = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at 9:00 AM", cron: "0 9 * * *" },
  { label: "Weekdays at 9:00 AM", cron: "0 9 * * 1-5" },
  { label: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { label: "1st of every month", cron: "0 0 1 * *" },
];

const CRON_FIELDS = [
  { name: "Minute", range: "0-59" },
  { name: "Hour", range: "0-23" },
  { name: "Day of Month", range: "1-31" },
  { name: "Month", range: "1-12 or JAN-DEC" },
  { name: "Day of Week", range: "0-6 or SUN-SAT" },
];

export function CronVisualizerTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: CronVisualizerToolProps) {
  const [input, setInput] = useState<string>("*/15 9-17 * * 1-5");
  const [output, setOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time evaluation & validation
  useEffect(() => {
    const start = performance.now();
    const validation = validateCron(input);
    onValidationChange(validation.valid, validation.error);

    if (validation.valid && input.trim()) {
      try {
        const explanation = explainCron(input);
        setOutput(explanation);
        setErrorMessage(null);
      } catch (err: any) {
        setOutput("");
        setErrorMessage(err.message || "Invalid cron expression");
      }
    } else if (!input.trim()) {
      setOutput("");
      setErrorMessage(null);
    } else {
      setOutput("");
      setErrorMessage(validation.error || "Invalid cron expression");
    }

    const end = performance.now();
    onStatsChange(input.length, end - start);
  }, [input, onValidationChange, onStatsChange]);

  // Dispatch custom events when input/output change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input, output },
        })
      );
      window.dispatchEvent(
        new CustomEvent("workspace-saved", {
          detail: { input, output },
        })
      );
    }
  }, [input, output]);

  const handleSelectPreset = (cron: string) => {
    setInput(cron);
    onLogHistory?.(cron);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cronParts = input.trim().split(/\s+/).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-6 py-2 md:py-0 bg-[#f8fafc] shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Cron Expression Visualizer</h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">Convert cron schedule syntax into clear, human-readable English</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="cron-visualizer" data={input} />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl w-full mx-auto space-y-4 md:space-y-6">
        {/* Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Common Schedules
          </span>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.cron}
                onClick={() => handleSelectPreset(preset.cron)}
                className={cn(
                  "px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium transition-colors border",
                  input === preset.cron
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                    : "bg-[#F1F5F9] text-[#0F172A] hover:bg-slate-200 border-transparent"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cron Input Field */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 md:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <label htmlFor="cron-expression-input" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Cron Expression
            </label>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="relative mb-4 md:mb-5">
            <input
              id="cron-expression-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. */15 * * * * or 0 9 * * 1-5"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-slate-900 font-mono text-base md:text-xl tracking-widest px-3 md:px-4 py-2.5 md:py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-inner"
            />
          </div>

          {/* Syntax breakdown indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
            {CRON_FIELDS.map((field, idx) => {
              const val = cronParts[idx] || "-";
              return (
                <div key={field.name} className="flex flex-col items-center text-center p-2 md:p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5 md:mb-1">{field.name}</span>
                  <span className="font-mono text-base md:text-lg font-bold text-[#2563EB] mb-0.5 md:mb-1">{val}</span>
                  <span className="text-[10px] text-[#94A3B8] font-medium truncate max-w-full">{field.range}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result Explanation Card */}
        {output && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-6 relative shadow-2xs flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="shrink-0 mt-0.5">
                <Clock className="w-6 h-6 md:w-7 md:h-7 text-[#0F172A]" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-[18px] font-bold text-slate-900 leading-snug break-words">
                  {output}
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-mono break-all">
                  Expression: <span className="text-slate-800 font-semibold">{input}</span>
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end md:self-start">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border bg-white shadow-2xs",
                  copied
                    ? "text-emerald-700 border-emerald-300"
                    : "hover:bg-slate-50 text-slate-600 border-[#E2E8F0]"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message card */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-5 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Invalid Cron Expression</h4>
              <p className="text-xs text-red-600 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
