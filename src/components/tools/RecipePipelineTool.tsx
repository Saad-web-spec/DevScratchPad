"use client";

import { useState, useCallback, useRef } from "react";
import {
  Play, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Check, Copy, AlertCircle, Clock, ArrowRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PIPELINE_OPERATIONS, executePipeline,
  type PipelineStep, type PipelineResult
} from "@/lib/tools/pipeline";

interface RecipePipelineToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

// Group operations by category
const CATEGORIES = [...new Set(PIPELINE_OPERATIONS.map((op) => op.category))];

let stepCounter = 0;
function newStepId() {
  return `step-${++stepCounter}-${Date.now()}`;
}

export function RecipePipelineTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
}: RecipePipelineToolProps) {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuFilter, setAddMenuFilter] = useState("");
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const addStep = useCallback((operationId: string) => {
    setSteps((prev) => [...prev, { id: newStepId(), operationId }]);
    setAddMenuOpen(false);
    setAddMenuFilter("");
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    setResults([]);
    setHasRun(false);
  }, []);

  const moveStep = useCallback((index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResults([]);
    setHasRun(false);
  }, []);

  const runPipeline = useCallback(() => {
    if (steps.length === 0) return;
    const start = performance.now();
    const pipelineResults = executePipeline(input, steps);
    const end = performance.now();

    setResults(pipelineResults);
    setHasRun(true);

    const lastResult = pipelineResults[pipelineResults.length - 1];
    const allSuccess = pipelineResults.every((r) => r.success);
    onValidationChange(allSuccess, allSuccess ? undefined : lastResult?.error);
    onStatsChange(input.length, end - start);
    if (allSuccess) onLogHistory?.(input);
  }, [input, steps, onValidationChange, onStatsChange, onLogHistory]);

  const finalOutput = hasRun && results.length > 0
    ? results[results.length - 1]?.output ?? ""
    : "";

  const handleCopy = () => {
    if (!finalOutput) return;
    navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredOps = PIPELINE_OPERATIONS.filter(
    (op) =>
      op.name.toLowerCase().includes(addMenuFilter.toLowerCase()) ||
      op.category.toLowerCase().includes(addMenuFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 w-full overflow-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-slate-200 dark:border-slate-700 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-slate-50 dark:bg-slate-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Recipe Pipeline
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            Chain operations together — output of each step feeds the next
          </p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={runPipeline}
            disabled={steps.length === 0}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-xs",
              steps.length === 0
                ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Main Layout: 3-column on desktop, stacked on mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Column 1: Input */}
        <div className="md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 min-h-[200px] md:min-h-0">
          <div className="h-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Input
            </span>
            <button
              onClick={() => setInput("")}
              className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your input data here..."
            className="flex-1 w-full resize-none p-3 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        {/* Column 2: Pipeline Steps */}
        <div className="md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 min-h-[200px] md:min-h-0">
          <div className="h-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pipeline Steps
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {steps.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2 py-8">
                <ArrowRight className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-center">
                  Add operations to build your recipe.
                  <br />
                  Each step&apos;s output feeds the next.
                </p>
              </div>
            )}

            {steps.map((step, index) => {
              const op = PIPELINE_OPERATIONS.find((o) => o.id === step.operationId);
              const result = results.find((r) => r.stepId === step.id);
              const isExpanded = expandedStep === step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "border rounded-lg transition-colors",
                    result
                      ? result.success
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
                        : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  )}
                >
                  <div className="flex items-center gap-1.5 px-2 py-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 cursor-grab" />

                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                        {op?.name ?? "Unknown"}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {op?.description}
                      </p>
                    </div>

                    {result && (
                      <div className="flex items-center gap-1 shrink-0">
                        {result.success ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {result.durationMs.toFixed(1)}ms
                        </span>
                      </div>
                    )}

                    {/* Step Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {result && (
                        <button
                          onClick={() =>
                            setExpandedStep(isExpanded ? null : step.id)
                          }
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          title="View step output"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors text-[10px] font-bold"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors text-[10px] font-bold"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded step output preview */}
                  {isExpanded && result && (
                    <div className="border-t border-slate-200 dark:border-slate-700 px-2 py-1.5 max-h-32 overflow-y-auto">
                      {result.success ? (
                        <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all">
                          {result.output.slice(0, 2000)}
                          {result.output.length > 2000 ? "…" : ""}
                        </pre>
                      ) : (
                        <p className="text-[11px] text-red-500 dark:text-red-400">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Step Button */}
            <div className="relative pt-1">
              <button
                ref={addBtnRef}
                onClick={() => setAddMenuOpen((p) => !p)}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>

              {/* Add Step Dropdown */}
              {addMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl dark:shadow-black/40 z-20 max-h-72 flex flex-col">
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <input
                      autoFocus
                      type="text"
                      value={addMenuFilter}
                      onChange={(e) => setAddMenuFilter(e.target.value)}
                      placeholder="Filter operations..."
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="overflow-y-auto p-1">
                    {CATEGORIES.map((cat) => {
                      const ops = filteredOps.filter((op) => op.category === cat);
                      if (ops.length === 0) return null;
                      return (
                        <div key={cat} className="mb-1">
                          <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {cat}
                          </p>
                          {ops.map((op) => (
                            <button
                              key={op.id}
                              onClick={() => addStep(op.id)}
                              className="w-full text-left px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                            >
                              <span className="font-medium">{op.name}</span>
                              <span className="text-slate-400 dark:text-slate-500 ml-1.5">
                                — {op.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {filteredOps.length === 0 && (
                      <p className="px-2 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                        No operations match
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Output */}
        <div className="md:w-1/3 flex flex-col min-h-[200px] md:min-h-0">
          <div className="h-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Final Output
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                copied
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!hasRun ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2 py-8">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-center">
                  Add steps and click &quot;Run Pipeline&quot;
                  <br />
                  to see the output here.
                </p>
              </div>
            ) : (
              <pre className="p-3 text-sm font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-all">
                {finalOutput}
              </pre>
            )}
          </div>

          {/* Pipeline Summary */}
          {hasRun && results.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 shrink-0">
              <div className="flex items-center gap-3 text-[11px]">
                <span className={cn(
                  "font-medium",
                  results.every((r) => r.success) ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {results.every((r) => r.success)
                    ? `✓ ${results.length} step${results.length > 1 ? "s" : ""} completed`
                    : `✗ Failed at step ${results.findIndex((r) => !r.success) + 1}`}
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  Total: {results.reduce((s, r) => s + r.durationMs, 0).toFixed(2)}ms
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
