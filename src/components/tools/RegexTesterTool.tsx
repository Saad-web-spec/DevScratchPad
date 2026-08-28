"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { testRegex, replaceRegex, type RegexMatch } from "@/lib/tools/regex";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { Code2, Settings2, Terminal, Copy, Trash2, Check, Regex as RegexIcon, Replace, AlertCircle, Info, AlertTriangle, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ValidationBadge } from "@/components/layout/StatusBar";

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
      addSnapshot("regex", "Regex Tester", pattern, testString);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [pattern, testString]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) {
      try {
        const parsed = JSON.parse(restoredInput);
        if (parsed.pattern) setPattern(parsed.pattern);
        if (parsed.testString) setTestString(parsed.testString);
      } catch {
        setPattern(restoredInput);
      }
    }
  }, [restoredInput]);

  // Compile and match
  useEffect(() => {
    const start = performance.now();
    const flagStr = Object.entries(flags)
      .filter(([_, active]) => active)
      .map(([f]) => f)
      .join("");

    const result = testRegex(pattern, flagStr, testString);

    if (result.valid) {
      setMatches(result.matches || []);
      setRegexError(undefined);
      onValidationChange(true);
    } else {
      setMatches([]);
      setRegexError(result.error);
      onValidationChange(false, result.error);
    }

    if (replaceMode && result.valid) {
      try {
        const replaced = replaceRegex(pattern, flagStr, testString, replacePattern);
        setReplacedOutput(replaced.result);
      } catch (err: any) {
        setReplacedOutput("");
      }
    }

    const end = performance.now();
    onStatsChange(testString.length, end - start);
  }, [pattern, flags, testString, replaceMode, replacePattern, onValidationChange, onStatsChange]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    onLogHistory?.(pattern);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCopyAllMatches = () => {
    if (matches.length === 0) return;
    const all = matches.map((m, idx) => `Match ${idx + 1}: ${m.match}`).join("\n");
    navigator.clipboard.writeText(all);
    setCopied("all-matches");
    onLogHistory?.(pattern);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090B] w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-zinc-200 dark:border-zinc-800 flex min-w-0 flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-6 py-2 md:py-0 bg-white dark:bg-[#09090B] shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <RegexIcon className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Regex Tester</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ValidationBadge isValid={!regexError} />
          <ExportImageButton code={replacedOutput || testString} language="javascript" />
          <EmbedButton toolSlug="regex-tester" data={{ pattern, testString, replacePattern, replaceMode }} />
          <ShareButton toolSlug="regex-tester" data={{ pattern, testString, replacePattern, replaceMode }} />

          {/* Replace Mode Toggle */}
          <button
            onClick={() => setReplaceMode(!replaceMode)}
            className={cn(
              "h-9 px-3 rounded-md text-xs font-medium transition-colors border flex items-center gap-1.5",
              replaceMode
                ? "bg-blue-500/10 border-blue-500/30 text-zinc-100 dark:text-zinc-100 font-semibold"
                : "bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-zinc-300"
            )}
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Substitution</span>
          </button>
        </div>
      </div>

      {/* Main Integrated Regex Input Bar */}
      <div className="p-4 md:p-6 pb-0 flex flex-col shrink-0">
        <div className="flex items-center gap-2 font-mono text-base tracking-wide bg-[#121215] border border-[#27272A] text-zinc-100 focus-within:ring-1 focus-within:ring-zinc-400 rounded-lg p-3">
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-base font-semibold select-none">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression pattern..."
            className="font-mono text-base tracking-wide bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-100 w-full placeholder:text-zinc-500"
          />
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-base font-semibold select-none">
            /
          </span>

          {/* Integrated Flags Segment */}
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-[#27272A]">
            {[
              { id: "g", label: "g", title: "Global (g)" },
              { id: "i", label: "i", title: "Case insensitive (i)" },
              { id: "m", label: "m", title: "Multiline (m)" },
              { id: "s", label: "s", title: "DotAll (s)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFlag(f.id)}
                title={f.title}
                className={cn(
                  "transition-colors",
                  flags[f.id]
                    ? "bg-blue-500/10 text-zinc-100 dark:text-zinc-100 font-bold px-2 py-0.5 rounded text-xs"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-200 font-medium px-2 py-0.5 rounded text-xs"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-bar for Replace Pattern if enabled */}
        {replaceMode && (
          <div className="flex items-center gap-2 font-mono text-base tracking-wide bg-[#121215] border border-[#27272A] text-zinc-100 focus-within:ring-1 focus-within:ring-zinc-400 rounded-lg p-3 mt-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none shrink-0 pr-1">
              Replace:
            </span>
            <input
              type="text"
              value={replacePattern}
              onChange={(e) => setReplacePattern(e.target.value)}
              placeholder="Replacement pattern (e.g. $1, [REDACTED])..."
              className="font-mono text-base tracking-wide bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-100 w-full placeholder:text-zinc-500"
            />
          </div>
        )}

        {/* Error notification if regex syntax is invalid */}
        {regexError && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-lg mt-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
            <span className="font-mono">{regexError}</span>
          </div>
        )}
      </div>

      {/* Mobile Segmented Tab Control */}
      <div className="flex md:hidden bg-zinc-100 dark:bg-zinc-900 p-1 mx-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 mt-4">
        <button
          onClick={() => setActiveTab("input")}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center",
            activeTab === "input"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
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
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          )}
        >
          {replaceMode ? "Replaced Result" : `Matches (${matches.length})`}
        </button>
      </div>

      {/* Dual Workspace Panels */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full p-4 md:p-6 gap-4 md:gap-6 min-h-0">
        {/* Left Panel: Test String */}
        <div
          className={cn(
            "flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden flex flex-col min-w-0 shadow-xs",
            activeTab !== "input" && "hidden md:flex"
          )}
        >
          <div className="h-10 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-4 shrink-0 bg-zinc-100/50 dark:bg-zinc-900/50">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Test String
            </span>
            <button
              onClick={() => setTestString("")}
              className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
              title="Clear test string"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
          <div className="flex-1 relative w-full h-full min-h-[260px] overflow-hidden">
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
                padding: { top: 12, bottom: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              }}
            />
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            <span>{testString.length.toLocaleString()} characters</span>
            <span>{testString.split("\n").length} lines</span>
          </div>
        </div>

        {/* Right Panel: Match Details or Replaced Result */}
        <div
          className={cn(
            "flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden flex flex-col min-w-0 shadow-xs",
            activeTab !== "output" && "hidden md:flex"
          )}
        >
          {replaceMode ? (
            /* Replaced Output */
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <div className="h-10 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-4 shrink-0 bg-zinc-100/50 dark:bg-zinc-900/50">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Replaced Result
                </span>
                <button
                  onClick={() => handleCopy(replacedOutput, "replaced")}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium transition-colors",
                    copied === "replaced"
                      ? "text-zinc-900 dark:text-zinc-100 dark:text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  {copied === "replaced" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied === "replaced" ? "Copied" : "Copy Result"}</span>
                </button>
              </div>
              <div className="flex-1 relative w-full h-full min-h-[260px] overflow-hidden">
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
                    padding: { top: 12, bottom: 12 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  }}
                />
              </div>
            </div>
          ) : (
            /* Matches & Group List */
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <div className="h-10 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-4 shrink-0 bg-zinc-100/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Match Details
                  </span>
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 dark:text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full">
                    {matches.length} {matches.length === 1 ? "Match" : "Matches"}
                  </span>
                </div>

                {matches.length > 0 && (
                  <button
                    onClick={handleCopyAllMatches}
                    className={cn(
                      "h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                      copied === "all-matches" && "text-zinc-900 dark:text-zinc-100 border-emerald-500/40"
                    )}
                  >
                    {copied === "all-matches" ? (
                      <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>{copied === "all-matches" ? "Copied!" : "Copy Matches"}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 py-16">
                    <RegexIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-xs font-medium">
                      {pattern
                        ? "No matches found in the test string"
                        : "Enter a regular expression pattern above"}
                    </p>
                  </div>
                ) : (
                  matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-4 mb-3 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-zinc-100 dark:text-zinc-100 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                            Match #{idx + 1}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                            idx: {m.index}..{m.index + m.length}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(m.match, `match-${idx}`)}
                          className={cn(
                            "h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                            copied === `match-${idx}` && "text-zinc-900 dark:text-zinc-100 border-emerald-500/40"
                          )}
                        >
                          {copied === `match-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span>{copied === `match-${idx}` ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 break-all select-all my-2.5">
                        {m.match}
                      </div>

                      {/* Sub-Groups: Capture Groups */}
                      {m.captures && m.captures.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
                          <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Capture Groups
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.captures.map((cap, capIdx) => (
                              <div
                                key={capIdx}
                                className="flex items-center gap-1.5 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50"
                              >
                                <span className="text-zinc-400 dark:text-zinc-500 font-semibold">
                                  ${capIdx + 1}:
                                </span>
                                <span className="break-all">
                                  {cap !== undefined ? cap : "undefined"}
                                </span>
                              </div>
                            ))}
                          </div>
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
