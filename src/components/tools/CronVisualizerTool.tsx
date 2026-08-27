"use client";

import { useState, useEffect } from "react";
import { explainCron, validateCron } from "@/lib/tools/cron";
import { ShareButton } from "@/components/ShareButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Clock, Copy, Trash2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationBadge } from "@/components/layout/StatusBar";

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
  const [isValid, setIsValid] = useState(true);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Real-time evaluation & validation
  useEffect(() => {
    const start = performance.now();
    const validation = validateCron(input);
    setIsValid(validation.valid);
    onValidationChange(validation.valid, validation.error);

    if (validation.valid && input.trim()) {
      try {
        const explanation = explainCron(input);
        setOutput(explanation);
        setErrorMessage(null);
      } catch (err: any) {
        setOutput("");
        setErrorMessage(err.message || "Invalid cron expression");
        setIsValid(false);
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
    setTimeout(() => setCopied(false), 1500);
  };

  const cronParts = input.trim().split(/\s+/).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-800 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-6 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Cron Expression Visualizer</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Convert cron schedule syntax into clear, human-readable English</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ValidationBadge isValid={isValid} />
          <ExportImageButton code={output || input} language="plaintext" />
          <ShareButton toolSlug="cron-visualizer" data={input} />
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-8">
        {/* Presets */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-3">
            Common Schedules
          </span>
          <div className="flex flex-wrap gap-2 mb-6">
            {PRESETS.map((preset) => (
              <button
                key={preset.cron}
                onClick={() => handleSelectPreset(preset.cron)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  input === preset.cron
                    ? "bg-[#2563EB] dark:bg-blue-600 text-white border-[#2563EB] dark:border-blue-600 shadow-2xs"
                    : "bg-[#F1F5F9] dark:bg-[#18181B] text-[#0F172A] dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-transparent dark:border-zinc-700"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cron Input Field */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="cron-expression-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Cron Expression
            </label>
            <button
              onClick={() => setInput("")}
              className="h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="relative mb-6">
            <input
              id="cron-expression-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. */15 * * * * or 0 9 * * 1-5"
              className="w-full font-mono text-base tracking-wide bg-[#121215] border border-[#27272A] text-zinc-100 focus:ring-1 focus:ring-zinc-400 rounded-lg p-3 focus:outline-none"
            />
          </div>

          {/* Syntax breakdown indicators */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {CRON_FIELDS.map((field, idx) => {
              const val = cronParts[idx] || "-";
              return (
                <div key={field.name} className="flex flex-col items-center text-center p-3 md:p-4 rounded-lg bg-white dark:bg-[#121215] border border-[#E2E8F0] dark:border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-1">{field.name}</span>
                  <span className="font-mono text-base md:text-lg font-bold text-[#2563EB] dark:text-blue-400 mb-1">{val}</span>
                  <span className="text-[10px] text-[#94A3B8] dark:text-zinc-500 font-medium truncate max-w-full">{field.range}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result Explanation Card */}
        {output && (
          <div className="w-full p-6 bg-white dark:bg-[#121215] border border-[#E2E8F0] dark:border-[#27272A] rounded-xl relative flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="shrink-0 mt-0.5">
                <Clock className="w-6 h-6 md:w-7 md:h-7 text-[#0F172A] dark:text-zinc-200" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                  {output}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono break-all">
                  Expression: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{input}</span>
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end md:self-start">
              <button
                onClick={handleCopy}
                className={cn(
                  "h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                  copied && "text-emerald-400 border-emerald-500/40"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message card */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 md:p-5 flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Invalid Cron Expression</h4>
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
