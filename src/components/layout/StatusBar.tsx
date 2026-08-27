"use client";

interface StatusBarProps {
  isValid: boolean;
  errorMessage?: string;
  errorLine?: number;
  inputLength: number;
  executionMs: number;
}

export function StatusBar({
  isValid,
  errorLine,
  inputLength,
  executionMs,
}: StatusBarProps) {
  return (
    <div className="h-8 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121215] flex items-center justify-between px-4 shrink-0 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {isValid ? (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Valid</span>
          </div>
        ) : (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs flex items-center">
            Line {errorLine || 1}, Col 1
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div>{inputLength.toLocaleString()} chars</div>
        <div>{executionMs.toFixed(2)} ms</div>
        <div>UTF-8</div>
      </div>
    </div>
  );
}
