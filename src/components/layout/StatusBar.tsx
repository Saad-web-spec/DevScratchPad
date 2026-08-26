"use client";

import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  isValid: boolean;
  errorMessage?: string;
  errorLine?: number;
  inputLength: number;
  executionMs: number;
}

export function StatusBar({
  isValid,
  errorMessage,
  errorLine,
  inputLength,
  executionMs,
}: StatusBarProps) {
  return (
    <footer className="h-7 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 shrink-0 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 z-50 relative transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-sm shrink-0 font-medium transition-all",
            isValid
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20"
              : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 dark:border dark:border-red-500/20"
          )}
        >
          {isValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Valid</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>
                Invalid Syntax{errorLine ? ` at line ${errorLine}` : ""}
              </span>
            </>
          )}
        </div>

        {!isValid && errorMessage && (
          <span className="text-red-500 dark:text-red-400 truncate font-mono text-[10px]">{errorMessage}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Input Length">
          <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{inputLength.toLocaleString()} chars</span>
        </div>
        <div className="flex items-center gap-1.5" title="Execution Time">
          <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{executionMs.toFixed(2)} ms</span>
        </div>
        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800"></div>
        <div className="text-zinc-400 dark:text-zinc-500">UTF-8</div>
      </div>
    </footer>
  );
}
