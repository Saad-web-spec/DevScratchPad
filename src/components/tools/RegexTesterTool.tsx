"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { OnMount } from "@monaco-editor/react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { Copy, Eraser, Check, Replace } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnPrimary, btnSecondary, btnGhost, btnIcon, segmentTrack, captionText, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";
import { useCopyFeedback } from "@/components/tools/converters/useCopyFeedback";
import { useRegexRun } from "@/components/tools/converters/regexEngine";

interface RegexTesterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

type EditorInstance = Parameters<OnMount>[0];
type DecorationsCollection = ReturnType<EditorInstance["createDecorationsCollection"]>;

const DEFAULT_PATTERN = "(\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b)";
const DEFAULT_TEXT = `Contact us at support@example.com or sales.team@company.org.
You can also reach out to admin@dev-tools.io for enterprise inquiries.
Invalid address: user@.invalid or plain text.`;

const FLAG_ORDER = "gimsuy";
const FLAGS: { id: string; title: string }[] = [
  { id: "g", title: "global: find all matches" },
  { id: "i", title: "ignore case" },
  { id: "m", title: "multiline: ^ and $ match at line breaks" },
  { id: "s", title: "dotAll: . matches newlines" },
  { id: "u", title: "unicode" },
  { id: "y", title: "sticky: match from lastIndex only" },
];

/** Matches rendered in the list; the editor still highlights up to the engine limit. */
const LIST_LIMIT = 300;
const MATCH_CLASS = "rounded-[2px] bg-amber-200/60";

const INPUT_OPTIONS = { wordWrap: "on" } as const;
const OUTPUT_OPTIONS = { wordWrap: "on", readOnly: true, domReadOnly: true } as const;

function normalizeFlags(flags: string): string {
  return FLAG_ORDER.split("").filter((f) => flags.includes(f)).join("");
}

export function RegexTesterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: RegexTesterToolProps) {
  const [pattern, setPattern] = useState<string>(DEFAULT_PATTERN);
  const [flags, setFlags] = useState<string>("gi");
  const [testString, setTestString] = useState<string>(DEFAULT_TEXT);
  const [replaceMode, setReplaceMode] = useState<boolean>(false);
  const [replacePattern, setReplacePattern] = useState<string>("[EMAIL REDACTED]");
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [copiedId, copy] = useCopyFeedback();
  const editorRef = useRef<EditorInstance | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("regex", "Regex Tester", pattern, testString);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [pattern, testString]);

  // Restore from history / share link ({ pattern, flags, testString, replacePattern, replaceMode } or a bare pattern)
  useEffect(() => {
    if (!restoredInput) return;
    try {
      const parsed = JSON.parse(restoredInput) as Partial<{ pattern: string; flags: string; testString: string; replacePattern: string; replaceMode: boolean }>;
      if (parsed && typeof parsed === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (typeof parsed.pattern === "string") setPattern(parsed.pattern);
        if (typeof parsed.testString === "string") setTestString(parsed.testString);
        if (typeof parsed.flags === "string") setFlags(normalizeFlags(parsed.flags));
        if (typeof parsed.replacePattern === "string") setReplacePattern(parsed.replacePattern);
        if (typeof parsed.replaceMode === "boolean") setReplaceMode(parsed.replaceMode);
        return;
      }
    } catch {
      // not JSON: treat as a bare pattern
    }
    setPattern(restoredInput);
  }, [restoredInput]);

  // Matching runs in a worker with a timeout, so a catastrophic pattern can't freeze the page
  const run = useRegexRun({ pattern, flags, text: testString, replacement: replaceMode ? replacePattern : null });
  const matches = useMemo(() => run?.matches ?? [], [run]);
  const regexError = run && !run.ok ? run.error : undefined;
  const replacedOutput = replaceMode && run?.ok ? (run.replaced ?? "") : "";

  useEffect(() => {
    if (!run) return;
    if (run.ok) onValidationChange(true);
    else onValidationChange(false, run.error);
    onStatsChange(testString.length, run.ms);
  }, [run, testString.length, onValidationChange, onStatsChange]);

  // Highlight matches in the test string
  useEffect(() => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    if (!ed || !model || !editorReady) return;
    if (!decorationsRef.current) decorationsRef.current = ed.createDecorationsCollection();
    const length = model.getValueLength();
    const decorations = matches
      .filter((m) => m.end > m.index && m.end <= length)
      .map((m, i) => {
        const s = model.getPositionAt(m.index);
        const e = model.getPositionAt(m.end);
        return {
          range: { startLineNumber: s.lineNumber, startColumn: s.column, endLineNumber: e.lineNumber, endColumn: e.column },
          options: { inlineClassName: MATCH_CLASS, hoverMessage: { value: `Match ${i + 1} · ${m.index}–${m.end}` } },
        };
      });
    decorationsRef.current.set(decorations);
  }, [matches, editorReady, testString]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => normalizeFlags(prev.includes(flag) ? prev.replace(flag, "") : prev + flag));
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    copy(text, id);
    onLogHistory?.(pattern);
  };

  const handleCopyAllMatches = () => {
    if (matches.length === 0) return;
    handleCopy(matches.map((m) => m.match).join("\n"), "all-matches");
  };

  const total = run?.total ?? 0;
  const footerStatus = !pattern ? "idle" : regexError ? "error" : total > 0 ? "ok" : "idle";
  const footerMessage = !pattern
    ? "Enter a pattern"
    : regexError
      ? regexError
      : !run
        ? "Matching…"
        : total === 0
          ? "No matches"
          : `${total.toLocaleString()} match${total === 1 ? "" : "es"}${run.groupCount ? ` · ${run.groupCount} group${run.groupCount === 1 ? "" : "s"}` : ""}${run.truncated ? ` · showing first ${matches.length}` : ""}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon("regex")}
        title="Regex Tester"
        utilities={
          <ShareMenu
            toolSlug="regex"
            data={{ pattern, flags, testString, replacePattern, replaceMode }}
            imageCode={replaceMode && replacedOutput ? replacedOutput : `/${pattern}/${flags}\n\n${testString}`}
            imageLanguage="javascript"
          />
        }
        actions={
          <>
            <button type="button" onClick={() => setReplaceMode(!replaceMode)} aria-pressed={replaceMode} className={replaceMode ? btnPrimary : btnSecondary}>
              <Replace {...iconProps} />
              <span>Replace</span>
            </button>
          </>
        }
      />

      {/* Pattern + flags */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 md:px-4">
        <div
          className={cn(
            "flex h-10 min-w-0 flex-1 basis-60 items-center rounded-md border bg-white px-3 transition-colors focus-within:ring-1 md:h-9",
            regexError ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500" : "border-zinc-200 hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-zinc-900"
          )}
        >
          <span className="select-none font-mono text-sm text-zinc-400" aria-hidden="true">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Regular expression pattern"
            aria-invalid={Boolean(regexError)}
            className="h-full min-w-0 flex-1 bg-transparent px-1 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <span className="select-none font-mono text-sm text-zinc-400" aria-hidden="true">/{flags}</span>
        </div>
        <div className={segmentTrack} role="group" aria-label="Regex flags">
          {FLAGS.map((f) => {
            const on = flags.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFlag(f.id)}
                aria-pressed={on}
                title={`${f.id}: ${f.title}`}
                className={cn(
                  "h-9 min-w-9 rounded-[5px] px-1.5 font-mono text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 md:h-7 md:min-w-7 md:text-xs",
                  on ? "bg-white font-semibold text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-400 hover:text-zinc-900"
                )}
              >
                {f.id}
              </button>
            );
          })}
        </div>
        {replaceMode && (
          <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 transition-colors focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 hover:border-zinc-300 md:h-9">
            <span className={cn(captionText, "shrink-0 select-none")}>Replace</span>
            <input
              type="text"
              value={replacePattern}
              onChange={(e) => setReplacePattern(e.target.value)}
              placeholder="$1, $<name>, text…"
              spellCheck={false}
              aria-label="Replacement pattern"
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </label>
        )}
      </div>

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "Test string" },
          { id: "output", label: replaceMode ? "Result" : `Matches (${total})` },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 md:border-r", activeTab !== "input" && "hidden md:flex")}>
          <PaneBar label="Test string">
            <button type="button" onClick={() => setTestString("")} disabled={!testString} className={btnGhost} title="Clear test string">
              <Eraser {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor
              height="100%"
              defaultLanguage="plaintext"
              value={testString}
              onChange={(value) => setTestString(value || "")}
              options={INPUT_OPTIONS}
              onMount={(ed) => {
                editorRef.current = ed;
                decorationsRef.current = null;
                setEditorReady(true);
              }}
            />
          </div>
        </section>

        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", activeTab !== "output" && "hidden md:flex")}>
          {replaceMode ? (
            <>
              <PaneBar label="Result">
                <button type="button" onClick={() => handleCopy(replacedOutput, "replaced")} disabled={!replacedOutput} className={cn(btnGhost, copiedId === "replaced" && "text-zinc-900")}>
                  {copiedId === "replaced" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                  <span>{copiedId === "replaced" ? "Copied" : "Copy"}</span>
                </button>
              </PaneBar>
              <div className="relative min-h-0 flex-1">
                <MonacoEditor height="100%" defaultLanguage="plaintext" value={replacedOutput} options={OUTPUT_OPTIONS} />
              </div>
            </>
          ) : (
            <>
              <PaneBar label={`Matches · ${total.toLocaleString()}`}>
                <button type="button" onClick={handleCopyAllMatches} disabled={matches.length === 0} className={cn(btnGhost, copiedId === "all-matches" && "text-zinc-900")}>
                  {copiedId === "all-matches" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                  <span>{copiedId === "all-matches" ? "Copied" : "Copy all"}</span>
                </button>
              </PaneBar>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {matches.length > 0 ? (
                  <ol className="divide-y divide-zinc-100">
                    {matches.slice(0, LIST_LIMIT).map((m, idx) => (
                      <li key={`${m.index}-${idx}`} className="group px-3 py-2 md:px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">{idx + 1}</span>
                          <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-zinc-900">
                            {m.match ? <span className={cn(MATCH_CLASS, "px-0.5")}>{m.match}</span> : <span className="italic text-zinc-400">empty match</span>}
                          </code>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
                            {m.index}–{m.end}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(m.match, `match-${idx}`)}
                            className={cn(btnIcon, "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100", copiedId === `match-${idx}` && "text-zinc-900 md:opacity-100")}
                            title="Copy match"
                            aria-label={`Copy match ${idx + 1}`}
                          >
                            {copiedId === `match-${idx}` ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                          </button>
                        </div>
                        {m.groups.length > 0 && (
                          <dl className="ml-9 mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 pr-10 text-xs">
                            {m.groups.map((g) => (
                              <div key={g.index} className="contents">
                                <dt className="font-mono text-zinc-400">{g.name ? `${g.name}` : `$${g.index}`}</dt>
                                <dd className="truncate font-mono text-zinc-700">
                                  {g.value === undefined ? <span className="italic text-zinc-400">undefined</span> : g.value || <span className="italic text-zinc-400">empty</span>}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex h-full items-center justify-center p-8 text-center text-sm text-zinc-500">
                    {regexError ? "Fix the pattern to see matches." : !testString ? "Enter a test string to find matches." : !pattern ? "Enter a pattern." : "No matches in the test string."}
                  </p>
                )}
                {matches.length > LIST_LIMIT && (
                  <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
                    Showing the first {LIST_LIMIT} of {total.toLocaleString()} matches. All of them are highlighted in the test string.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <ToolFooter status={footerStatus} message={footerMessage} meta={formatStats(testString.length, run?.ms)} />
    </div>
  );
}
