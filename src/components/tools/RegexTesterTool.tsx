"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { testRegex, replaceRegex, type RegexMatch } from "@/lib/tools/regex";
import { Copy, Trash2, Check, Regex as RegexIcon, Replace, CheckCircle2, AlertCircle, Link as LinkIcon } from "lucide-react";
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

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      const output = replaceMode ? replacedOutput : JSON.stringify(matches, null, 2);
      addSnapshot("regex", "Regex Tester", pattern, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [pattern, replaceMode, replacedOutput, matches]);

  // Restore from history
  useEffect(() => {
    if (restoredInput) {
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
    <div className="flex flex-col h-full bg-white">
      {/* Tool Header */}
      <div className="h-14 border-b border-[#e2e8f0] flex items-center justify-between px-4 bg-[#f8fafc] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Regex Tester</h2>
          <p className="text-[11px] text-slate-400">Test regular expressions and inspect match groups</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                window.location.hash = 'data=' + btoa(testString);
              } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors border border-[#e2e8f0] shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Share
          </button>
          {/* Flag toggles */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
            {[
              { id: "g", label: "g", title: "Global (find all matches)" },
              { id: "i", label: "i", title: "Case insensitive" },
              { id: "m", label: "m", title: "Multiline" },
              { id: "s", label: "s", title: "DotAll (dot matches newline)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFlag(f.id)}
                title={f.title}
                className={cn(
                  "w-6 h-6 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center",
                  flags[f.id]
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
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
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors border",
              replaceMode
                ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            )}
          >
            <Replace className="w-3.5 h-3.5" />
            Substitution
          </button>
        </div>
      </div>

      {/* Regex Pattern Input Bar */}
      <div className="border-b border-[#e2e8f0] bg-white p-3 px-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center bg-[#f8fafc] border border-slate-200 focus-within:border-blue-500 rounded-lg px-3 py-2">
          <span className="text-slate-400 font-mono text-base font-semibold select-none pr-1">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression pattern..."
            className="flex-1 bg-transparent text-slate-900 font-mono text-sm focus:outline-none placeholder:text-slate-400"
          />
          <span className="text-slate-400 font-mono text-base font-semibold select-none pl-1">
            /{activeFlagsString}
          </span>
        </div>

        {/* Sub-bar for Replace Pattern if enabled */}
        {replaceMode && (
          <div className="flex items-center bg-[#f8fafc] border border-slate-200 focus-within:border-blue-500 rounded-lg px-3 py-1.5 mt-1">
            <span className="text-xs font-medium text-slate-500 pr-2 select-none">
              Replace:
            </span>
            <input
              type="text"
              value={replacePattern}
              onChange={(e) => setReplacePattern(e.target.value)}
              placeholder="Replacement pattern (e.g. $1, [REDACTED])..."
              className="flex-1 bg-transparent text-slate-900 font-mono text-xs focus:outline-none placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Error notification if regex syntax is invalid */}
        {regexError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{regexError}</span>
          </div>
        )}
      </div>

      {/* Main Dual Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Test String */}
        <div className="flex-1 border-r border-[#e2e8f0] flex flex-col min-w-0">
          <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Test String
            </span>
            <button
              onClick={() => setTestString("")}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              height="100%"
              defaultLanguage="plaintext"
              theme="vs"
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
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {replaceMode ? (
            /* Replaced Output */
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Replaced Result
                </span>
                <button
                  onClick={() => handleCopy(replacedOutput, "replaced")}
                  className={cn(
                    "flex items-center gap-1 text-[11px] transition-colors",
                    copied === "replaced"
                      ? "text-emerald-600"
                      : "text-slate-400 hover:text-slate-700"
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
              <div className="flex-1 relative">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="plaintext"
                  theme="vs"
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="h-8 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Match Details
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                {matches.length > 0 && (
                  <button
                    onClick={handleCopyAllMatches}
                    className={cn(
                      "flex items-center gap-1 text-[11px] transition-colors",
                      copied === "all-matches"
                        ? "text-emerald-600"
                        : "text-slate-400 hover:text-slate-700"
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

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <RegexIcon className="w-8 h-8 text-slate-300 mb-2" />
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
                      className="border border-[#e2e8f0] rounded-lg p-3 bg-[#f8fafc]/50 hover:bg-[#f8fafc] transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Match #{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            index: {m.index}..{m.index + m.length} ({m.length} chars)
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(m.match, `match-${idx}`)}
                          className={cn(
                            "flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white border border-slate-200 transition-colors",
                            copied === `match-${idx}`
                              ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                              : "text-slate-600 hover:text-slate-900"
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

                      <div className="p-2 bg-white rounded border border-[#e2e8f0] font-mono text-xs text-slate-800 break-all select-all mb-2">
                        {m.match}
                      </div>

                      {/* Captures / Groups */}
                      {m.captures && m.captures.length > 0 && (
                        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-blue-200">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Capture Groups
                          </span>
                          {m.captures.map((cap, capIdx) => (
                            <div
                              key={capIdx}
                              className="flex items-start gap-2 text-xs"
                            >
                              <span className="font-mono text-slate-400 shrink-0 text-[11px]">
                                ${capIdx + 1}:
                              </span>
                              <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 break-all">
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
