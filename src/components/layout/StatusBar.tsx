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
    <footer className="h-7 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between px-3 shrink-0 text-[11px] font-medium text-slate-500 z-50 relative">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-sm shrink-0",
            isValid
              ? "text-emerald-600 bg-emerald-50"
              : "text-red-600 bg-red-50"
          )}
        >
          {isValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              <span>
                Invalid Syntax{errorLine ? ` at line ${errorLine}` : ""}
              </span>
            </>
          )}
        </div>

        {!isValid && errorMessage && (
          <span className="text-red-500 truncate">{errorMessage}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Input Length">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>{inputLength.toLocaleString()} chars</span>
        </div>
        <div className="flex items-center gap-1.5" title="Execution Time">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{executionMs.toFixed(2)} ms</span>
        </div>
        <div className="w-px h-3 bg-[#e2e8f0]"></div>
        <div className="text-slate-400">UTF-8</div>
      </div>
    </footer>
  );
}
