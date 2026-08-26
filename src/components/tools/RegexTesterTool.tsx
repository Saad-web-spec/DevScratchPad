"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { testRegex, replaceRegex, type RegexMatch } from "@/lib/tools/regex";
import { ShareButton } from "@/components/ShareButton";
import { Copy, Trash2, Check, Regex as RegexIcon, Replace, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface RegexTesterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const DEFAULT_PATTERN = "(\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b)";
const DEFAULT_TEXT = `Contact us at support@example.com or sales.team@company.org.
You can also reach out to admin@dev-tools.io for enterprise inquiries.
Invalid address: user@.invalid or plain text.`;

export function RegexTesterTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: RegexTesterToolProps) {
  const [pattern, setPattern] = useState<string>(DEFAULT_PATTERN);
  const [flags, setFlags] = useState<{ [key: string]: boolean }>({
    g: true,
    i: true,
    m: false,
    s: false,
  });
  const [testString, setTestString] = useState<string>(DEFAULT_TEXT);
  const [replaceMode, setReplaceMode] = useState<boolean>(false);
  const [replacePattern, setReplacePattern] = useState<string>("[EMAIL REDACTED]");
  const [replacedOutput, setReplacedOutput] = useState<string>("");
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [regexError, setRegexError] = useState<string | undefined>();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      const output = replaceMode ? replacedOutput : JSON.stringify(matches, null, 2);
      addSnapshot("regex", "Regex Tester", pattern, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [pattern, replaceMode, replacedOutput, matches]);

  // Restore from history / share link
  useEffect(() => {
    if (restoredInput) {
      try {
        const parsed = JSON.parse(restoredInput);
        if (parsed && typeof parsed === "object") {
          if ("pattern" in parsed) setPattern(parsed.pattern || "");
          if ("testString" in parsed) setTestString(parsed.testString || "");
          return;
        }
      } catch {}
      setPattern(restoredInput);
    }
  }, [restoredInput]);

  const activeFlagsString = Object.entries(flags)
    .filter(([_, active]) => active)
    .map(([f]) => f)
    .join("");

  // Test regex & update matches
  useEffect(() => {
    const start = performance.now();
    const result = testRegex(pattern, activeFlagsString, testString);
    const end = performance.now();

    if (result.valid) {
      setMatches(result.matches);
      setRegexError(undefined);
      onValidationChange(true);
    } else {
      setMatches([]);
      setRegexError(result.error);
      onValidationChange(false, result.error);
    }

    if (replaceMode && result.valid) {
      const rep = replaceRegex(pattern, activeFlagsString, testString, replacePattern);
      setReplacedOutput(rep.result);
    }

    onStatsChange(testString.length, end - start);
  }, [
    pattern,
    activeFlagsString,
    testString,
    replaceMode,
    replacePattern,
    onValidationChange,
    onStatsChange,
  ]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    onLogHistory?.(pattern);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAllMatches = () => {
    if (matches.length === 0) return;
    const all = matches.map((m, idx) => `Match ${idx + 1}: ${m.match}`).join("\n");
    navigator.clipboard.writeText(all);
    setCopied("all-matches");
    onLogHistory?.(pattern);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-800 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-4 py-2 md:py-0 bg-[#f8fafc] dark:bg-zinc-900 shrink-0 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Regex Tester</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:block">Test regular expressions and inspect match groups</p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <ShareButton toolSlug="regex-tester" data={{ pattern, testString }} />

          {/* Flag toggles */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 gap-0.5">
            {[
              { id: "g", label: "g", title: "Global" },
              { id: "i", label: "i", title: "Case insensitive" },
              { id: "m", label: "m", title: "Multiline" },
              { id: "s", label: "s", title: "DotAll" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFlag(f.id)}
                title={f.title}
                className={cn(
                  "w-5 h-5 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center",
                  flags[f.id]
                    ? "bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Replace Toggle */}
          <button
            onClick={() => setReplaceMode(!replaceMode)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors border",
              replaceMode
                ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-semibold"
                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Substitution</span>
          </button>
        </div>
      </div>

      {/* Regex Pattern Input Bar */}
      <div className="border-b border-[#e2e8f0] dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 px-3 md:px-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center bg-[#f8fafc] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 rounded-lg px-2.5 py-1.5">
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-sm md:text-base font-semibold select-none pr-1">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression pattern..."
            className="flex-1 min-w-0 bg-transparent text-zinc-900 dark:text-zinc-100 font-mono text-xs md:text-sm focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs md:text-base font-semibold select-none pl-1 shrink-0">
            /{activeFlagsString}
          </span>
        </div>

        {/* Sub-bar for Replace Pattern if enabled */}
        {replaceMode && (
          <div className="flex items-center bg-[#f8fafc] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 rounded-lg px-2.5 py-1.5 mt-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 pr-2 select-none shrink-0">
              Replace:
            </span>
            <input
              type="text"
              value={replacePattern}
              onChange={(e) => setReplacePattern(e.target.value)}
              placeholder="Replacement pattern (e.g. $1, [REDACTED])..."
              className="flex-1 min-w-0 bg-transparent text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>
        )}

        {/* Error notification if regex syntax is invalid */}
        {regexError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{regexError}</span>
          </div>
        )}
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-[#f1f5f9] dark:bg-zinc-900 p-1 border-b border-[#e2e8f0] dark:border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          Test String
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "output"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          {replaceMode ? "Replaced Result" : `Matches (${matches.length})`}
        </button>
      </div>

      {/* Main Dual Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
        {/* Left: Test String */}
        <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-[#e2e8f0] dark:border-zinc-800 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !== "input" && "hidden md:flex")}>
          <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-800 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Test String
            </span>
            <button
              onClick={() => setTestString("")}
              className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="plaintext"
              value={testString}
              onChange={(value) => setTestString(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
        </div>

        {/* Right: Matches or Replacement Output */}
        <div className={cn("flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 w-full max-w-full overflow-x-hidden", activeTab !== "output" && "hidden md:flex")}>
          {replaceMode ? (
            /* Replaced Output */
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
              <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-800 flex items-center justify-between px-3 shrink-0">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Replaced Result
                </span>
                <button
                  onClick={() => handleCopy(replacedOutput, "replaced")}
                  className={cn(
                    "flex items-center gap-1 text-[11px] transition-colors",
                    copied === "replaced"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {copied === "replaced" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied === "replaced" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="plaintext"
                  value={replacedOutput}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    fontFamily:
                      "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  }}
                />
              </div>
            </div>
          ) : (
            /* Matches & Group List */
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full max-w-full">
              <div className="h-8 bg-[#f8fafc] dark:bg-zinc-900 border-b border-[#e2e8f0] dark:border-zinc-800 flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Match Details
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                {matches.length > 0 && (
                  <button
                    onClick={handleCopyAllMatches}
                    className={cn(
                      "flex items-center gap-1 text-[11px] transition-colors",
                      copied === "all-matches"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                  >
                    {copied === "all-matches" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied === "all-matches" ? "Copied All" : "Copy Matches"}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                {matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 py-12">
                    <RegexIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs">
                      {pattern
                        ? "No matches found in the test string"
                        : "Enter a regular expression pattern above"}
                    </p>
                  </div>
                ) : (
                  matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="border border-[#e2e8f0] dark:border-zinc-800 rounded-lg p-3 bg-[#f8fafc]/50 dark:bg-zinc-900/50 hover:bg-[#f8fafc] dark:hover:bg-zinc-900 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            Match #{idx + 1}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            idx: {m.index}..{m.index + m.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(m.match, `match-${idx}`)}
                          className={cn(
                            "flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors",
                            copied === `match-${idx}`
                              ? "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50"
                              : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                          )}
                        >
                          {copied === `match-${idx}` ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copied === `match-${idx}` ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <div className="p-2 bg-white dark:bg-zinc-950 rounded border border-[#e2e8f0] dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all mb-2">
                        {m.match}
                      </div>

                      {/* Captures / Groups */}
                      {m.captures && m.captures.length > 0 && (
                        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                          <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500">
                            Capture Groups
                          </span>
                          {m.captures.map((cap, capIdx) => (
                            <div
                              key={capIdx}
                              className="flex items-start gap-2 text-xs"
                            >
                              <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0 text-[11px]">
                                ${capIdx + 1}:
                              </span>
                              <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 break-all">
                                {cap !== undefined ? cap : "undefined"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const RegexTool = RegexTesterTool;
