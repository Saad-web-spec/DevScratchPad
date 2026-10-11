"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { DiffOnMount } from "@monaco-editor/react";
import { MonacoDiffEditor, MonacoEditor } from "@/components/MonacoEditor";
import { ArrowLeftRight, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ShareMenu } from "@/components/ShareMenu";
import { ToolHeader, PaneBar, MobilePaneTabs, btnSecondary, btnGhost, chipBtn, segmentTrack, segmentBtn, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";

interface DiffCheckerToolProps {
  restoredInput?: string | null;
}

type DiffEditorInstance = Parameters<DiffOnMount>[0];
interface Texts {
  original: string;
  modified: string;
}
interface DiffStats {
  changes: number;
  added: number;
  removed: number;
}

const DEFAULT_TEXTS: Texts = {
  original: '{\n  "version": 1,\n  "name": "DevScratchpad"\n}',
  modified: '{\n  "version": 2,\n  "name": "DevScratchpad",\n  "privacy": "zero-server"\n}',
};

const MOBILE_QUERY = "(max-width: 767px)";

function lineStats(editor: DiffEditorInstance): DiffStats | null {
  const changes = editor.getLineChanges();
  if (!changes) return null;
  let added = 0;
  let removed = 0;
  for (const c of changes) {
    if (c.originalEndLineNumber > 0) removed += c.originalEndLineNumber - c.originalStartLineNumber + 1;
    if (c.modifiedEndLineNumber > 0) added += c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
  }
  return { changes: changes.length, added, removed };
}

export function DiffCheckerTool({ restoredInput }: DiffCheckerToolProps) {
  // Live text (share, snapshot, stats) and the values the desktop diff editor mounts with
  const [texts, setTexts] = useState<Texts>(DEFAULT_TEXTS);
  const [seed, setSeed] = useState<Texts>(DEFAULT_TEXTS);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches);
  const [inline, setInline] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [mobileTab, setMobileTab] = useState<"original" | "modified" | "diff">("diff");
  const [stats, setStats] = useState<DiffStats | null>(null);
  const diffRef = useRef<DiffEditorInstance | null>(null);
  const textsRef = useRef<Texts>(DEFAULT_TEXTS);

  useEffect(() => {
    textsRef.current = texts;
  }, [texts]);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      // The desktop editor remounts after a layout switch, so seed it with the current text
      setSeed(textsRef.current);
      setIsMobile(mql.matches);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  /** Programmatic change (sample, clear, swap, restore): update state and the mounted editors. */
  const applyTexts = useCallback((next: Texts) => {
    setTexts(next);
    setSeed(next);
    const ed = diffRef.current;
    if (ed) {
      if (ed.getOriginalEditor().getValue() !== next.original) ed.getOriginalEditor().setValue(next.original);
      if (ed.getModifiedEditor().getValue() !== next.modified) ed.getModifiedEditor().setValue(next.modified);
    }
  }, []);

  // Restore from share link / history
  useEffect(() => {
    if (!restoredInput) return;
    try {
      const parsed = JSON.parse(restoredInput) as Partial<Texts>;
      if (parsed && typeof parsed === "object" && ("original" in parsed || "modified" in parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        applyTexts({ original: parsed.original || "", modified: parsed.modified || "" });
        return;
      }
    } catch {
      // plain text: use it as the original
    }
    applyTexts({ original: restoredInput, modified: textsRef.current.modified });
  }, [restoredInput, applyTexts]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("diff", "Diff Checker", texts.original, texts.modified);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [texts]);

  const desktopOptions = useMemo(
    () => ({
      renderSideBySide: !inline,
      ignoreTrimWhitespace: ignoreWhitespace,
      wordWrap: "on" as const,
      diffWordWrap: "on" as const,
      originalEditable: true,
      readOnly: false,
      renderOverviewRuler: false,
      useInlineViewWhenSpaceIsLimited: false,
    }),
    [inline, ignoreWhitespace]
  );

  const mobileDiffOptions = useMemo(
    () => ({
      renderSideBySide: false,
      ignoreTrimWhitespace: ignoreWhitespace,
      wordWrap: "on" as const,
      diffWordWrap: "on" as const,
      readOnly: true,
      domReadOnly: true,
      renderOverviewRuler: false,
    }),
    [ignoreWhitespace]
  );

  const handleDesktopMount: DiffOnMount = (editor) => {
    diffRef.current = editor;
    const original = editor.getOriginalEditor();
    const modified = editor.getModifiedEditor();
    original.onDidChangeModelContent(() => setTexts((t) => ({ ...t, original: original.getValue() })));
    modified.onDidChangeModelContent(() => setTexts((t) => ({ ...t, modified: modified.getValue() })));
    editor.onDidUpdateDiff(() => setStats(lineStats(editor)));
    editor.onDidDispose(() => {
      if (diffRef.current === editor) diffRef.current = null;
    });
  };

  const handleMobileDiffMount: DiffOnMount = (editor) => {
    editor.onDidUpdateDiff(() => setStats(lineStats(editor)));
  };

  const swap = () => applyTexts({ original: texts.modified, modified: texts.original });
  const clearSide = (side: keyof Texts) => applyTexts({ ...texts, [side]: "" });
  const empty = !texts.original && !texts.modified;

  const identical = texts.original === texts.modified;
  const footerStatus = empty ? "idle" : identical ? "ok" : "idle";
  const footerMessage = empty
    ? "Paste two texts to compare"
    : identical
      ? "Texts are identical"
      : stats
        ? `${stats.changes} change${stats.changes === 1 ? "" : "s"} · +${stats.added} −${stats.removed} lines`
        : "Comparing…";

  const clearButton = (side: keyof Texts) => (
    <button type="button" onClick={() => clearSide(side)} disabled={!texts[side]} className={btnGhost} title={`Clear ${side} text`}>
      <Eraser {...iconProps} />
      <span>Clear</span>
    </button>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon("diff")}
        title="Diff Checker"
        utilities={<ShareMenu toolSlug="diff" data={texts} />}
        options={
          <>
            <div className={cn(segmentTrack, "hidden md:inline-flex")} role="group" aria-label="Diff layout">
              <button type="button" aria-pressed={!inline} onClick={() => setInline(false)} className={segmentBtn(!inline)}>
                Split
              </button>
              <button type="button" aria-pressed={inline} onClick={() => setInline(true)} className={segmentBtn(inline)}>
                Inline
              </button>
            </div>
            <button type="button" aria-pressed={ignoreWhitespace} onClick={() => setIgnoreWhitespace(!ignoreWhitespace)} className={chipBtn(ignoreWhitespace)}>
              Ignore whitespace
            </button>
          </>
        }
        actions={
          <>
            <button type="button" onClick={swap} disabled={empty} className={btnSecondary} title="Swap original and modified">
              <ArrowLeftRight {...iconProps} />
              <span>Swap</span>
            </button>
          </>
        }
      />

      {isMobile ? (
        <>
          <MobilePaneTabs
            tabs={[
              { id: "original", label: "Original" },
              { id: "modified", label: "Modified" },
              { id: "diff", label: stats && !identical ? `Diff +${stats.added} −${stats.removed}` : "Diff" },
            ]}
            active={mobileTab}
            onChange={setMobileTab}
          />
          {(["original", "modified"] as const).map((side) => (
            <section key={side} className={cn("min-h-0 flex-1 flex-col", mobileTab === side ? "flex" : "hidden")}>
              <PaneBar label={side === "original" ? "Original text" : "Modified text"}>{clearButton(side)}</PaneBar>
              <div className="relative min-h-0 flex-1">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="plaintext"
                  value={texts[side]}
                  onChange={(value) => setTexts((t) => ({ ...t, [side]: value || "" }))}
                  options={{ wordWrap: "on" }}
                />
              </div>
            </section>
          ))}
          {mobileTab === "diff" && (
            <section className="flex min-h-0 flex-1 flex-col">
              <PaneBar label="Changes (inline)" />
              <div className="relative min-h-0 flex-1">
                <MonacoDiffEditor height="100%" original={texts.original} modified={texts.modified} options={mobileDiffOptions} onMount={handleMobileDiffMount} />
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col">
          {inline ? (
            <PaneBar label="Original → Modified (inline, edit the modified text)">{clearButton("modified")}</PaneBar>
          ) : (
            <div className="flex shrink-0">
              <PaneBar label="Original text" className="flex-1 border-r">
                {clearButton("original")}
              </PaneBar>
              <PaneBar label="Modified text" className="flex-1">
                {clearButton("modified")}
              </PaneBar>
            </div>
          )}
          <div className="relative min-h-0 flex-1">
            <MonacoDiffEditor height="100%" original={seed.original} modified={seed.modified} options={desktopOptions} onMount={handleDesktopMount} />
          </div>
        </section>
      )}

      <ToolFooter status={footerStatus} message={footerMessage} meta={formatStats(texts.original.length + texts.modified.length)} />
    </div>
  );
}
