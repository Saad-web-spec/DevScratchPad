"use client";

import { useState, useEffect } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { testRegex, replaceRegex, type RegexMatch } from"@/lib/tools/regex";
import { ShareButton } from"@/components/ShareButton";
import { EmbedButton } from"@/components/EmbedButton";
import { ExportImageButton } from"@/components/ExportImageButton";
import { Copy, Trash2, Check, Regex as RegexIcon, Replace, AlertCircle } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";

interface RegexTesterToolProps {
 onValidationChange: (isValid: boolean, error?: string) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const DEFAULT_PATTERN ="(\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b)";
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
 u: false,
 y: false,
 });
 const [testString, setTestString] = useState<string>(DEFAULT_TEXT);
 const [replaceMode, setReplaceMode] = useState<boolean>(false);
 const [replacePattern, setReplacePattern] = useState<string>("[EMAIL REDACTED]");
 const [replacedOutput, setReplacedOutput] = useState<string>("");
 const [matches, setMatches] = useState<RegexMatch[]>([]);
 const [regexError, setRegexError] = useState<string | undefined>();
 const [copied, setCopied] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("regex","Regex Tester", pattern, testString);
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
 <div className="flex flex-col h-full bg-[#09090B] w-full overflow-y-auto relative">
 {/* Tool Header */}
 <div className="min-h-14 border-b border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-white shrink-0 sticky top-0 z-10">
 <div className="flex items-center gap-2">
 <RegexIcon className="w-4 h-4 text-zinc-900"/>
 <h1 className="text-sm font-semibold text-zinc-900">Regex Tester</h1>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <ExportImageButton code={replacedOutput || testString} language="javascript"/>
 <EmbedButton toolSlug="regex-tester"data={{ pattern, testString, replacePattern, replaceMode }} />
 <ShareButton toolSlug="regex-tester"data={{ pattern, testString, replacePattern, replaceMode }} />

 {/* Replace Mode Toggle */}
 <button
 onClick={() => setReplaceMode(!replaceMode)}
 className={cn(
"h-8 px-3 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ml-1",
 replaceMode
 ?"bg-zinc-900 text-zinc-900 border-zinc-900 font-semibold shadow-none"
 :"bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
 )}
 >
 <Replace className="w-3.5 h-3.5"/>
 <span>Substitution</span>
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full mx-auto bg-white ] flex flex-col max-w-[1400px]">
 {/* Integrated Regex Pattern Input Bar */}
 <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-none flex items-center justify-between gap-3 focus-within:border-zinc-400 transition-colors">
 <span className="text-zinc-400 font-mono font-bold select-none pl-1 text-sm md:text-base">/</span>
 <input
 type="text"
 value={pattern}
 onChange={(e) => setPattern(e.target.value)}
 placeholder="Enter regular expression pattern..."
 spellCheck={false}
 className="font-mono text-sm md:text-base tracking-wide bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 flex-1 placeholder:text-zinc-400 min-w-0"
 />
 <span className="text-zinc-400 font-mono font-bold select-none text-sm md:text-base pr-1">/</span>

 {/* Interactive Flag Toggles */}
 <div className="bg-zinc-100 p-1 rounded-lg flex items-center gap-0.5 shrink-0 ml-2">
 {[
 { id:"g", label:"g"},
 { id:"i", label:"i"},
 { id:"m", label:"m"},
 { id:"s", label:"s"},
 { id:"u", label:"u"},
 { id:"y", label:"y"},
 ].map((f) => (
 <button
 key={f.id}
 type="button"
 onClick={() => toggleFlag(f.id)}
 className={cn(
"font-mono text-xs px-2 py-0.5 transition-colors",
 flags[f.id]
 ?"bg-zinc-900 text-zinc-900 font-bold rounded shadow-none"
 :"text-zinc-400 hover:text-zinc-700"
 )}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 {/* Replace Pattern Bar (if enabled) */}
 {replaceMode && (
 <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-none flex items-center justify-between gap-3 mt-3 focus-within:border-zinc-400 transition-colors">
 <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none shrink-0 pl-1">
 Replace:
 </span>
 <input
 type="text"
 value={replacePattern}
 onChange={(e) => setReplacePattern(e.target.value)}
 placeholder="Replacement pattern (e.g. $1, [REDACTED])..."
 className="font-mono text-sm md:text-base tracking-wide bg-transparent border-0 focus:ring-0 focus:outline-none text-zinc-900 flex-1 placeholder:text-zinc-400 min-w-0"
 />
 </div>
 )}

 {/* Error notification if regex syntax is invalid */}
 {regexError && (
 <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-lg mt-3">
 <AlertCircle className="w-4 h-4 shrink-0"/>
 <span className="font-mono">{regexError}</span>
 </div>
 )}

 {/* Mobile Segmented Tab Control */}
 <div className="flex lg:hidden bg-zinc-50 p-2 border-b border-zinc-200 shrink-0 mt-4 rounded-xl">
 <div className="bg-zinc-200/50 p-1 rounded-lg flex items-center w-full">
 <button
 onClick={() => setActiveTab("input")}
 className={cn(
"flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
 activeTab ==="input"
 ?"bg-white text-zinc-900 shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 Test String
 </button>
 <button
 onClick={() => setActiveTab("output")}
 className={cn(
"flex-1 py-1.5 text-xs font-semibold rounded-md transition-all text-center",
 activeTab ==="output"
 ?"bg-white text-zinc-900 shadow-none"
 :"text-zinc-500 hover:text-zinc-900"
 )}
 >
 {replaceMode ?"Replaced Result": `Matches (${matches.length})`}
 </button>
 </div>
 </div>

 {/* Dual Workspace Panels */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:h-[calc(100vh-220px)] min-h-[500px]">
 
 {/* Left Panel: Test String */}
 <div
 className={cn(
"border border-zinc-200 rounded-xl bg-zinc-50 flex flex-col p-4 shadow-none",
 activeTab !=="input"&&"hidden lg:flex"
 )}
 >
 <div className="flex items-center justify-between mb-3 shrink-0">
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Test String
 </span>
 <button
 onClick={() => setTestString("")}
 className="text-zinc-400 hover:text-zinc-500 transition-colors p-1"
 title="Clear test string"
 >
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 
 <div className="flex-1 relative w-full h-full min-h-[200px] border border-zinc-200 rounded-lg overflow-hidden bg-white ]">
 <MonacoEditor
 height="100%"
 defaultLanguage="plaintext"
 value={testString}
 onChange={(value) => setTestString(value ||"")}
 options={{
 minimap: { enabled: false },
 fontSize: 13,
 wordWrap:"on",
 scrollBeyondLastLine: false,
 padding: { top: 12, bottom: 12 },
 fontFamily:"'JetBrains Mono', 'Fira Code', Consolas, monospace",
 }}
 />
 </div>
 
 {/* Integrated Footer Status */}
 <div className="h-[28px] mt-2 flex items-center justify-between shrink-0 px-1">
 <span className="text-xs text-zinc-500 font-mono tracking-tight">
 {testString.length.toLocaleString()} characters • {testString.split("\n").length} lines
 </span>
 {!regexError && (
 <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 flex items-center gap-1">
 <Check className="w-3 h-3"/> Valid Pattern
 </span>
 )}
 </div>
 </div>

 {/* Right Panel: Match Details or Replaced Result */}
 <div
 className={cn(
"border border-zinc-200 rounded-xl bg-zinc-50 p-4 shadow-none flex flex-col",
 activeTab !=="output"&&"hidden lg:flex"
 )}
 >
 {replaceMode ? (
 <>
 <div className="flex items-center justify-between mb-3 shrink-0">
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Replaced Result
 </span>
 <button
 onClick={() => handleCopy(replacedOutput,"replaced")}
 className="text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 p-1"
 >
 {copied ==="replaced"? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 </button>
 </div>
 <div className="flex-1 relative w-full h-full min-h-[200px] border border-zinc-200 rounded-lg overflow-hidden bg-white ]">
 <MonacoEditor
 height="100%"
 defaultLanguage="plaintext"
 value={replacedOutput}
 options={{
 readOnly: false,
 minimap: { enabled: false },
 fontSize: 13,
 wordWrap:"on",
 scrollBeyondLastLine: false,
 padding: { top: 12, bottom: 12 },
 fontFamily:"'JetBrains Mono', 'Fira Code', Consolas, monospace",
 }}
 />
 </div>
 </>
 ) : (
 <>
 <div className="flex items-center justify-between mb-3 shrink-0">
 <div className="flex items-center gap-3">
 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Matches Found
 </span>
 <span className="bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-mono px-2.5 py-0.5 rounded-full">
 {matches.length}
 </span>
 </div>
 {matches.length > 0 && (
 <button
 onClick={handleCopyAllMatches}
 className="text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1.5 p-1 text-xs font-medium"
 >
 {copied ==="all-matches"? <Check className="w-3.5 h-3.5 text-zinc-900"/> : <Copy className="w-3.5 h-3.5"/>}
 <span className="hidden sm:inline">{copied ==="all-matches"?"Copied All":"Copy All"}</span>
 </button>
 )}
 </div>

 <div className="flex-1 overflow-y-auto space-y-3 pr-1">
 {matches.length > 0 ? (
 matches.map((m, idx) => (
 <div key={idx} className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-none relative group hover:border-zinc-300 transition-colors">
 
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center">
 <span className="bg-zinc-900 text-zinc-900 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
 Match {idx + 1}
 </span>
 <span className="text-xs font-mono text-zinc-500 ml-2 tracking-tight">
 Index: {m.index} - {m.index + m.match.length}
 </span>
 </div>
 
 <button
 onClick={() => handleCopy(m.match, `match-${idx}`)}
 className="h-7 px-2 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
 title="Copy Match"
 >
 {copied === `match-${idx}` ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
 </button>
 </div>
 
 <div className="font-mono text-sm text-zinc-900 bg-zinc-50 p-2.5 rounded-md border border-zinc-200/60 mt-2 select-all break-all whitespace-pre-wrap">
 {m.match}
 </div>
 
 {m.captures && m.captures.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">
 {m.captures.map((g, gIdx) => (
 <div key={gIdx} className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
 <span className="font-mono text-[10px] text-zinc-400 font-bold tracking-wider">${gIdx + 1}</span>
 <span className="font-mono text-xs text-zinc-700 select-all truncate max-w-[200px]">{g}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-8">
 {!regexError && testString.length > 0 ? (
 <p className="text-sm">No matches found in the test string.</p>
 ) : regexError ? (
 <p className="text-sm text-zinc-500">Fix the regex syntax error to see matches.</p>
 ) : (
 <p className="text-sm">Enter a test string to find matches.</p>
 )}
 </div>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
