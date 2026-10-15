"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import type { OnMount } from "@monaco-editor/react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FilePlus,
  FileUp,
  LaptopMinimalCheck,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Link2,
  Loader2,
  Package,
  Pause,
  Play,
  Plus,
  StepBack,
  StepForward,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModKeyLabel } from "@/lib/useModKeyLabel";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";
import { loadFromStorageEnvelope, removeStorageKey, saveToStorageEnvelope } from "@/lib/storage";
import { GraphCanvas, edgeKey, type Selection, type Trace } from "./components/GraphCanvas";
import { InspectorPanel, IssueList } from "./components/InspectorPanel";
import { PlanPanel } from "./components/PlanPanel";
import { MenuItem, ToolbarPopover } from "./components/ToolbarPopover";
import { BUTTON, FOCUS_RING, NODE_THEME } from "./components/theme";
import { BLANK_GRAPH_SKILL, BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "./lib/graphTemplates";
import {
  NODE_TYPES,
  runsWithoutSubagent,
  addEdge,
  addNode,
  analyzeIsolation,
  isValidNodeId,
  nodeAtLine,
  nodeLineRanges,
  parseGraphSkill,
  removeEdge,
  removeNode,
  renameContract,
  renameNode,
  serializeGraphSkill,
  topologicalOrder,
  getContract,
  setEdgeContract,
  updateContract,
  updateNode,
  validateGraph,
  type IsolationReport,
  type NodeType,
  type SkillGraph,
} from "./lib/graphSkill";
import { buildPlan } from "./lib/graphPlan";
import { buildExportKit, buildSingleFileSkill, toSlug } from "./lib/graphExport";
import { MAX_HASH_LENGTH, SHARE_URL_SOFT_LIMIT, decodeShareHash, encodeShareHash } from "./lib/graphShare";

const STORAGE_KEY = "devscratchpad_graph_v1";
/** Earlier builds could remember a model API key under this key; it is wiped on load. */
const LEGACY_KEY_STORAGE_KEY = "devscratchpad_graph_key_v1";

interface StoredState {
  source: string;
  /** Desktop pane sizes in percent. */
  editorWidth?: number;
  /** Desktop only: the Markdown editor can be hidden to give the canvas the full width. */
  editorOpen?: boolean;
  dockHeight?: number;
}

type DockTab = "inspector" | "plan" | "issues";
type MobileView = "editor" | "canvas" | "details";
type CodeEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

/** One canvas/inspector edit, kept so it can be undone while the Markdown still matches `after`. */
interface HistoryEntry {
  before: string;
  after: string;
}

const HISTORY_LIMIT = 100;
/** Edits closer together than this (typing in an inspector field) undo as one step. */
const HISTORY_COALESCE_MS = 700;
const EDITOR_WIDTH = { min: 22, max: 60, initial: 30 };
const DOCK_HEIGHT = { min: 20, max: 70, initial: 36 };
/** Time each stage stays highlighted while the walkthrough plays. */
const WALKTHROUGH_STEP_MS = 1400;

const ICON_BUTTON = cn("rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900", FOCUS_RING);
const TAB = "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors";
const CODE_FONT = "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const EDITOR_THEME = "skill-graph-light";

/** Editor colors that match the studio: zinc text, bold headings, an orange cursor and line number. */
function defineEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "27272a" },
      { token: "keyword", foreground: "18181b", fontStyle: "bold" },
      { token: "string", foreground: "9a3412" },
      { token: "string.link", foreground: "9a3412" },
      { token: "variable", foreground: "3f3f46" },
      { token: "comment", foreground: "a1a1aa", fontStyle: "italic" },
      { token: "delimiter", foreground: "a1a1aa" },
      { token: "strong", fontStyle: "bold" },
      { token: "emphasis", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#27272a",
      "editorGutter.background": "#ffffff",
      "editorLineNumber.foreground": "#d4d4d8",
      "editorLineNumber.activeForeground": "#ea580c",
      "editor.lineHighlightBackground": "#fafafa",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#ffedd5",
      "editor.inactiveSelectionBackground": "#fff7ed",
      "editor.selectionHighlightBackground": "#fff7ed",
      "editor.wordHighlightBackground": "#f4f4f5",
      "editorCursor.foreground": "#ea580c",
      "editorIndentGuide.background1": "#f4f4f5",
      "editorIndentGuide.activeBackground1": "#e4e4e7",
      "editorWhitespace.foreground": "#e4e4e7",
      "editorBracketMatch.background": "#fff7ed",
      "editorBracketMatch.border": "#fdba74",
      "scrollbarSlider.background": "#d4d4d866",
      "scrollbarSlider.hoverBackground": "#a1a1aa80",
      focusBorder: "#00000000",
    },
  });
}

const NODE_TYPE_HINT: Record<NodeType, string> = {
  input: "The user's goal enters here",
  orchestrator: "Splits the work into tasks",
  worker: "Does one task",
  verifier: "Checks the work in a fresh context",
  synthesizer: "Merges results into the answer",
  agent: "General purpose step",
  code: "Runs a command, no model",
  approval: "You approve before it goes on",
};

function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, value));
}

function download(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function GraphHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph</p>
            <p className="hidden truncate text-xs text-zinc-500 sm:block">Design multi-agent skills as a graph, then compile them for Claude Code and Cursor.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/graph/guide" className="text-[13px] font-semibold text-zinc-600 transition-colors hover:text-orange-700">
            Guide
          </Link>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-600" title="Everything runs in this page. Nothing you write is uploaded.">
            <LaptopMinimalCheck className="h-4 w-4 text-zinc-900" aria-hidden />
            100% local
          </p>
        </div>
      </div>
    </header>
  );
}

/** Drag handle between two panes; also adjustable with the arrow keys. */
function Splitter({
  orientation,
  value,
  range,
  label,
  onChange,
  measure,
}: {
  orientation: "vertical" | "horizontal";
  value: number;
  range: { min: number; max: number };
  label: string;
  onChange: (value: number) => void;
  /** Returns the percent for a pointer position, relative to the pane container. */
  measure: (clientX: number, clientY: number) => number;
}) {
  const [dragging, setDragging] = useState(false);
  const vertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={range.min}
      aria-valuemax={range.max}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => dragging && onChange(clamp(measure(event.clientX, event.clientY), range))}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 6 : 2;
        const decrease = vertical ? "ArrowLeft" : "ArrowUp";
        const increase = vertical ? "ArrowRight" : "ArrowDown";
        if (event.key === decrease) onChange(clamp(value - step, range));
        else if (event.key === increase) onChange(clamp(value + step, range));
        else return;
        event.preventDefault();
      }}
      className={cn(
        "group relative z-10 hidden shrink-0 touch-none bg-zinc-200 outline-hidden transition-colors hover:bg-zinc-400 focus-visible:bg-orange-500 lg:block",
        vertical ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        dragging && "bg-orange-500 hover:bg-orange-500"
      )}
    >
      {/* Wider invisible hit area */}
      <span className={cn("absolute", vertical ? "inset-y-0 -left-1.5 -right-1.5" : "inset-x-0 -top-1.5 -bottom-1.5")} />
    </div>
  );
}

/**
 * Shown when a graph arrives from a share link: everything in it came from whoever made the link,
 * and the exported kit makes your agent run its commands with its tools. Lists those before export.
 */
function SharedReview({ graph, onDismiss }: { graph: SkillGraph; onDismiss: () => void }) {
  const commands = graph.nodes.flatMap((node) => [node.run, node.check].filter((command): command is string => Boolean(command)).map((command) => ({ id: node.id, command })));
  const shell = graph.nodes.filter((node) => node.tools?.some((tool) => tool === "Bash" || tool.startsWith("Bash("))).map((node) => node.id);
  const mcp = [...new Set(graph.nodes.flatMap((node) => (node.tools ?? []).filter((tool) => tool.startsWith("mcp__"))))];
  const writers = graph.nodes.filter((node) => node.tools?.some((tool) => tool === "Edit" || tool === "Write")).map((node) => node.id);
  // A subagent without a tools list (or an empty one) inherits every tool: shell, edits and MCP included.
  const unlimited = graph.nodes.filter((node) => !runsWithoutSubagent(node.type) && (node.tools === undefined || node.tools.length === 0)).map((node) => node.id);
  if (commands.length === 0 && shell.length === 0 && mcp.length === 0 && writers.length === 0 && unlimited.length === 0) return null;
  const CHIP = "rounded-md bg-white px-1.5 py-0.5 font-mono text-[11.5px] text-zinc-800 ring-1 ring-amber-200";
  return (
    <div role="region" aria-label="Review this shared graph" className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 sm:px-6 lg:px-8">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p>
          <b>This graph came from a link.</b> If you export it, your agent will run what it lists. Check that you trust it:
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {commands.length > 0 && (
            <span className="flex flex-wrap items-center gap-1.5">
              Commands:
              {commands.map((item) => (
                <code key={`${item.id}:${item.command}`} className={cn(CHIP, "max-w-full break-all")} title={`Run by ${item.id}`}>
                  $ {item.command}
                </code>
              ))}
            </span>
          )}
          {shell.length > 0 && <span>Shell access (Bash): <span className="font-mono">{shell.join(", ")}</span></span>}
          {writers.length > 0 && <span>Edits files: <span className="font-mono">{writers.join(", ")}</span></span>}
          {mcp.length > 0 && <span>MCP tools: <span className="font-mono">{mcp.join(", ")}</span></span>}
          {unlimited.length > 0 && <span>Every tool (no limit set): <span className="font-mono">{unlimited.join(", ")}</span></span>}
        </div>
      </div>
      <button type="button" onClick={onDismiss} className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100">
        I reviewed it
      </button>
    </div>
  );
}

interface WorkspaceProps {
  initial: StoredState | null;
  /** A graph opened from a share link; takes precedence over the saved session. */
  shared: { source: string } | null;
}

function GraphWorkspace({ initial, shared }: WorkspaceProps) {
  const modKey = useModKeyLabel();
  const [source, setSource] = useState(shared?.source ?? (initial && initial.source.trim() !== "" ? initial.source : DEFAULT_GRAPH_SKILL));
  const [editorWidth, setEditorWidth] = useState(clamp(initial?.editorWidth ?? EDITOR_WIDTH.initial, EDITOR_WIDTH));
  const [editorOpen, setEditorOpen] = useState(initial?.editorOpen !== false);
  const [dockHeight, setDockHeight] = useState(clamp(initial?.dockHeight ?? DOCK_HEIGHT.initial, DOCK_HEIGHT));

  const [selection, setSelection] = useState<Selection>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [dockTab, setDockTab] = useState<DockTab>("inspector");
  const [mobileView, setMobileView] = useState<MobileView>("canvas");
  const [notice, setNotice] = useState<string | null>(shared ? `Opened a shared graph. ${modKey}+Z on the canvas brings back your previous draft.` : null);
  // A shared graph replaces the saved draft like any other edit, so undo brings the draft back.
  const [history, setHistory] = useState<{ undo: HistoryEntry[]; redo: HistoryEntry[] }>(() =>
    shared && initial && initial.source.trim() !== "" && initial.source !== shared.source ? { undo: [{ before: initial.source, after: shared.source }], redo: [] } : { undo: [], redo: [] }
  );
  /** A graph from someone else's link: show what it can run until the user has looked. */
  const [reviewShared, setReviewShared] = useState(shared !== null);
  /** Walkthrough: index of the stage on show (equal to the stage count once finished), or null. */
  const [stage, setStage] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const openFileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommitAt = useRef(0);
  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<ReturnType<CodeEditor["createDecorationsCollection"]> | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const selectionRef = useRef<Selection>(null);
  const selectedFromEditor = useRef(false);
  const revealedFor = useRef<string | null>(null);

  // The Markdown is the source of truth. A syntax error keeps the last valid graph on the canvas.
  const parsed = useMemo(() => parseGraphSkill(source), [source]);
  const [lastGood, setLastGood] = useState<SkillGraph>(() => parseGraphSkill(DEFAULT_GRAPH_SKILL).graph as SkillGraph);
  if (parsed.graph && parsed.graph !== lastGood) setLastGood(parsed.graph);
  const graph = parsed.graph ?? lastGood;

  const issues = useMemo(() => validateGraph(graph), [graph]);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.length - errorCount;
  const plan = useMemo(() => buildPlan(graph), [graph]);
  const agentCount = plan.reduce((sum, item) => sum + item.nodes.filter((node) => !runsWithoutSubagent(node.type)).length, 0);
  const isolation = useMemo(() => {
    const map = new Map<string, IsolationReport>();
    for (const node of graph.nodes) if (node.isolatedContext) map.set(node.id, analyzeIsolation(graph, node));
    return map;
  }, [graph]);

  const shownStage = stage === null ? null : Math.min(stage, plan.length);
  const trace = useMemo<Trace | null>(() => {
    if (shownStage === null) return null;
    const done = new Set(graph.nodes.filter((node) => node.type === "input").map((node) => node.id));
    plan.slice(0, shownStage).forEach((item) => item.nodes.forEach((node) => done.add(node.id)));
    return { active: new Set((plan[shownStage]?.nodes ?? []).map((node) => node.id)), done };
  }, [shownStage, plan, graph.nodes]);

  const canUndo = history.undo.at(-1)?.after === source;
  const canRedo = history.redo.at(-1)?.before === source;

  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  // A shared graph is loaded once; drop the hash so a reload returns to the saved session.
  useEffect(() => {
    if (!shared) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [shared]);

  // Autosave. A failed save (storage full or blocked) is reported once, not on every keystroke.
  const saveFailed = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = saveToStorageEnvelope<StoredState>(STORAGE_KEY, { source, editorWidth, dockHeight, editorOpen }).success;
      if (!saved && !saveFailed.current) notify("This browser could not save your graph. Export the graph source (.md) to keep it.");
      saveFailed.current = !saved;
    }, 400);
    return () => clearTimeout(timer);
  }, [source, editorWidth, dockHeight, editorOpen, notify]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  // Walkthrough autoplay: advance one stage at a time, then stop on the finished state.
  useEffect(() => {
    if (!playing || shownStage === null) return;
    if (shownStage >= plan.length) {
      const timer = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setStage(shownStage + 1), WALKTHROUGH_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, shownStage, plan.length]);

  /* ----------------------------------------------------------- editor <-> canvas selection */

  // Highlight the selected node's frontmatter entry and prompt section; scroll to it when the selection came from the canvas.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editorReady || !editor || !monaco) return;
    const id = selection?.kind === "node" ? selection.id : null;
    const ranges = id ? (nodeLineRanges(source).get(id) ?? []) : [];
    decorationsRef.current ??= editor.createDecorationsCollection();
    decorationsRef.current.set(
      ranges.map((range) => ({
        range: new monaco.Range(range.start, 1, range.end, 1),
        options: { isWholeLine: true, className: "graph-node-line", linesDecorationsClassName: "graph-node-gutter" },
      }))
    );
    if (id !== revealedFor.current) {
      revealedFor.current = id;
      const section = ranges.at(-1);
      if (section && !selectedFromEditor.current) editor.revealLinesInCenterIfOutsideViewport(section.start, section.end);
    }
    selectedFromEditor.current = false;
  }, [selection, source, editorReady]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition((event) => {
      if (!editor.hasTextFocus()) return;
      const id = nodeAtLine(editor.getValue(), event.position.lineNumber);
      const current = selectionRef.current;
      if (!id || (current?.kind === "node" && current.id === id)) return;
      selectedFromEditor.current = true;
      setSelection({ kind: "node", id });
      setFocusRequest({ id, nonce: Date.now() });
      setDockTab("inspector");
    });
    setEditorReady(true);
  };

  /* ----------------------------------------------------------- graph editing */

  /** Applies an edit made on the canvas or in the inspector by rewriting the Markdown (undoable). */
  const commit = useCallback(
    (next: SkillGraph) => {
      if (parsed.fatal) {
        notify("Fix the frontmatter in the Markdown first.");
        return;
      }
      const after = serializeGraphSkill(next);
      if (after === source) return;
      const time = Date.now();
      const coalesce = time - lastCommitAt.current < HISTORY_COALESCE_MS;
      lastCommitAt.current = time;
      setHistory((current) => {
        const top = current.undo.at(-1);
        const undo =
          coalesce && top && top.after === source
            ? [...current.undo.slice(0, -1), { before: top.before, after }]
            : [...current.undo, { before: source, after }].slice(-HISTORY_LIMIT);
        return { undo, redo: [] };
      });
      setSource(after);
    },
    [parsed.fatal, notify, source]
  );

  const undo = useCallback(() => {
    const entry = history.undo.at(-1);
    if (!entry || entry.after !== source) {
      if (history.undo.length > 0) setHistory({ undo: [], redo: [] });
      return;
    }
    lastCommitAt.current = 0;
    setHistory({ undo: history.undo.slice(0, -1), redo: [...history.redo, entry] });
    setSource(entry.before);
  }, [history, source]);

  const redo = useCallback(() => {
    const entry = history.redo.at(-1);
    if (!entry || entry.before !== source) {
      if (history.redo.length > 0) setHistory((current) => ({ ...current, redo: [] }));
      return;
    }
    lastCommitAt.current = 0;
    setHistory({ undo: [...history.undo, entry], redo: history.redo.slice(0, -1) });
    setSource(entry.after);
  }, [history, source]);

  const handleAddNode = (type: NodeType) => {
    const after = selection?.kind === "node" ? selection.id : undefined;
    const { graph: next, id } = addNode(graph, type, after);
    commit(next);
    setSelection({ kind: "node", id });
    setDockTab("inspector");
    setMobileView("canvas");
  };

  const handleConnect = useCallback(
    (from: string, to: string) => {
      const target = graph.nodes.find((node) => node.id === to);
      if (target?.type === "input") {
        notify("The input node cannot receive edges.");
        return;
      }
      if (graph.edges.some((edge) => edge.from === from && edge.to === to)) return;
      const next = addEdge(graph, from, to);
      if (topologicalOrder(next) === null) {
        notify("That edge would create a cycle.");
        return;
      }
      commit(next);
      setSelection({ kind: "edge", id: edgeKey(from, to) });
      setDockTab("inspector");
    },
    [graph, commit, notify]
  );

  const handleRemoveNode = useCallback(
    (id: string) => {
      commit(removeNode(graph, id));
      setSelection(null);
    },
    [graph, commit]
  );

  const handleRemoveEdge = useCallback(
    (from: string, to: string) => {
      commit(removeEdge(graph, from, to));
      setSelection(null);
    },
    [graph, commit]
  );

  const handleDeleteSelection = useCallback(() => {
    if (selection?.kind === "node") handleRemoveNode(selection.id);
    else if (selection?.kind === "edge") {
      const edge = graph.edges.find((e) => edgeKey(e.from, e.to) === selection.id);
      if (edge) handleRemoveEdge(edge.from, edge.to);
    }
  }, [selection, graph.edges, handleRemoveNode, handleRemoveEdge]);

  const handleRename = (id: string, nextId: string): boolean => {
    if (!isValidNodeId(nextId)) {
      notify("Ids start with a letter and use letters, digits, _ or -.");
      return false;
    }
    if (graph.nodes.some((node) => node.id === nextId)) {
      notify(`"${nextId}" is already used by another node.`);
      return false;
    }
    commit(renameNode(graph, id, nextId));
    setSelection({ kind: "node", id: nextId });
    return true;
  };

  const handleRenameContract = (name: string, nextName: string): boolean => {
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(nextName)) {
      notify("Contract names start with a letter and use letters, digits, _ or -.");
      return false;
    }
    if (getContract(graph, nextName)) {
      notify(`A contract named "${nextName}" already exists.`);
      return false;
    }
    commit(renameContract(graph, name, nextName));
    return true;
  };

  const handleSelect = useCallback((next: Selection) => {
    setSelection(next);
    if (next) setDockTab("inspector");
  }, []);

  const selectNode = (id: string) => {
    setSelection({ kind: "node", id });
    setFocusRequest({ id, nonce: Date.now() });
    setDockTab("inspector");
  };

  /* ----------------------------------------------------------- walkthrough */

  const startWalkthrough = () => {
    if (errorCount > 0) {
      setDockTab("issues");
      setMobileView("details");
      notify("Fix the graph errors first.");
      return;
    }
    setStage(0);
    setPlaying(true);
    setDockTab("plan");
  };
  const stopWalkthrough = () => {
    setStage(null);
    setPlaying(false);
  };

  /* ----------------------------------------------------------- files */

  const fileBase = toSlug(graph.name);

  const requireValid = (): boolean => {
    if (parsed.fatal) {
      notify("Fix the SKILL.md first: the file cannot be read, so the canvas shows the last version that could.");
      return false;
    }
    if (errorCount === 0) return true;
    setDockTab("issues");
    setMobileView("details");
    notify("Fix the graph errors before exporting.");
    return false;
  };

  const exportZip = async () => {
    if (!requireValid()) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const file of buildExportKit(graph)) zip.file(file.path, file.content);
    download(`${fileBase}-skill-kit.zip`, await zip.generateAsync({ type: "blob" }));
    notify("Exported the Claude Code and Cursor kit");
  };

  const exportSingle = () => {
    if (!requireValid()) return;
    download("SKILL.md", new Blob([buildSingleFileSkill(graph)], { type: "text/markdown;charset=utf-8" }));
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      notify("Copy failed. Your browser blocked clipboard access.");
    }
  };

  const shareGraph = () => {
    const hash = encodeShareHash({ source });
    if (hash.length > MAX_HASH_LENGTH) {
      notify("This graph is too large for a link. Export the graph source (.md) and send the file instead.");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    void copyText(url, url.length > SHARE_URL_SOFT_LIMIT ? `Copied a long share link (${Math.round(url.length / 1000)}k characters); some apps may cut it` : "Copied a share link to this graph");
  };

  /** Replaces the whole document; recorded in the undo history like any canvas edit. */
  const replaceSource = (next: string, message?: string) => {
    if (next === source) return;
    setHistory((current) => ({ undo: [...current.undo, { before: source, after: next }].slice(-HISTORY_LIMIT), redo: [] }));
    lastCommitAt.current = 0;
    setSource(next);
    setSelection(null);
    setFitRequest((count) => count + 1);
    stopWalkthrough();
    if (message) notify(message);
  };

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    replaceSource(text, parseGraphSkill(text).fatal ?? `Opened ${file.name}`);
  };

  const measureEditor = (clientX: number) => {
    const rect = mainRef.current?.getBoundingClientRect();
    return rect ? ((clientX - rect.left) / rect.width) * 100 : editorWidth;
  };
  const measureDock = (_clientX: number, clientY: number) => {
    const rect = rightPaneRef.current?.getBoundingClientRect();
    return rect ? ((rect.bottom - clientY) / rect.height) * 100 : dockHeight;
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 antialiased">
      <GraphHeader />

      <div className="flex h-[calc(100dvh-3.5rem)] min-h-[520px] flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2 sm:px-6 lg:px-8">
          {shownStage === null ? (
            <button type="button" onClick={startWalkthrough} title="Step through the stages the agent will run" className={BUTTON}>
              <Play className="h-3.5 w-3.5 fill-current text-zinc-500" />
              Walk through plan
            </button>
          ) : (
            <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-orange-200 bg-orange-50 text-xs">
              <button
                type="button"
                aria-label="Previous stage"
                disabled={shownStage === 0}
                onClick={() => {
                  setPlaying(false);
                  setStage(Math.max(0, shownStage - 1));
                }}
                className="px-2 py-1.5 text-orange-800 transition-colors hover:bg-orange-100 disabled:opacity-40"
              >
                <StepBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => {
                  if (shownStage >= plan.length) setStage(0);
                  setPlaying(!playing);
                }}
                className="px-2 py-1.5 text-orange-800 transition-colors hover:bg-orange-100"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <span className="min-w-28 px-1 text-center font-mono text-[11.5px] font-semibold text-orange-900" role="status">
                {shownStage >= plan.length ? "Plan complete" : `Stage ${shownStage + 1} of ${plan.length}`}
              </span>
              <button
                type="button"
                aria-label="Next stage"
                disabled={shownStage >= plan.length}
                onClick={() => {
                  setPlaying(false);
                  setStage(Math.min(plan.length, shownStage + 1));
                }}
                className="px-2 py-1.5 text-orange-800 transition-colors hover:bg-orange-100 disabled:opacity-40"
              >
                <StepForward className="h-3.5 w-3.5" />
              </button>
              <button type="button" aria-label="Close walkthrough" onClick={stopWalkthrough} className="border-l border-orange-200 px-2 py-1.5 text-orange-800 transition-colors hover:bg-orange-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setDockTab(issues.length > 0 ? "issues" : "plan");
              setMobileView("details");
            }}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
              errorCount > 0 ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "text-zinc-600 hover:bg-zinc-100",
              FOCUS_RING
            )}
          >
            {errorCount > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-zinc-900" />}
            {errorCount > 0
              ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
              : `Valid · ${plan.length} stage${plan.length === 1 ? "" : "s"} · ${agentCount} subagent${agentCount === 1 ? "" : "s"}`}
            {warningCount > 0 && <span className="text-amber-700">· {warningCount} warning{warningCount === 1 ? "" : "s"}</span>}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ToolbarPopover
              ariaLabel="Add node"
              label={
                <>
                  <Plus className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Node</span>
                </>
              }
              panelClassName="w-64"
              align="right"
            >
              {(close) => (
                <>
                  {selection?.kind === "node" && <p className="px-2.5 pb-1 pt-1.5 text-xs text-zinc-500">Connects after the selected node</p>}
                  {NODE_TYPES.map((type) => (
                    <MenuItem
                      key={type}
                      icon={<span className={cn("mt-1 block h-2 w-2 rounded-full", NODE_THEME[type].dot)} />}
                      hint={NODE_TYPE_HINT[type]}
                      onClick={() => {
                        handleAddNode(type);
                        close();
                      }}
                    >
                      {type}
                    </MenuItem>
                  ))}
                </>
              )}
            </ToolbarPopover>

            <button type="button" onClick={shareGraph} aria-label="Share" title="Copy a link that opens this graph" className={BUTTON}>
              <Link2 className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <ToolbarPopover
              ariaLabel="Export"
              align="right"
              variant="accent"
              label={
                <>
                  <Download className="h-3.5 w-3.5" /> Export
                </>
              }
              panelClassName="w-80"
            >
              {(close) => (
                <>
                  <MenuItem
                    icon={<Package className="h-3.5 w-3.5" />}
                    hint="Orchestrating skill + one subagent per node (tools, model, gate) + Cursor rule + graph source"
                    onClick={() => {
                      close();
                      void exportZip();
                    }}
                  >
                    Claude Code + Cursor kit (.zip)
                  </MenuItem>
                  <MenuItem
                    icon={<Download className="h-3.5 w-3.5" />}
                    hint="One self-orchestrating file, for agents without subagents"
                    onClick={() => {
                      close();
                      exportSingle();
                    }}
                  >
                    Single SKILL.md
                  </MenuItem>
                  <MenuItem
                    icon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => {
                      close();
                      if (requireValid()) void copyText(buildSingleFileSkill(graph), "Copied the single-file skill");
                    }}
                  >
                    Copy single SKILL.md
                  </MenuItem>
                  <MenuItem
                    icon={<Download className="h-3.5 w-3.5" />}
                    hint="The editable graph; open it again here"
                    onClick={() => {
                      close();
                      download("graph.skill.md", new Blob([source], { type: "text/markdown;charset=utf-8" }));
                    }}
                  >
                    Graph source (.md)
                  </MenuItem>
                </>
              )}
            </ToolbarPopover>
          </div>
        </div>

        {reviewShared && parsed.graph && <SharedReview graph={parsed.graph} onDismiss={() => setReviewShared(false)} />}

        {/* Mobile view switcher */}
        <div role="tablist" aria-label="Workspace view" className="flex border-b border-zinc-200 bg-white lg:hidden">
          {(["editor", "canvas", "details"] as const).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={mobileView === view}
              onClick={() => setMobileView(view)}
              className={cn("flex-1 border-b-2 py-2.5 text-[13px] font-semibold capitalize", mobileView === view ? "border-orange-600 text-zinc-900" : "border-transparent text-zinc-500")}
            >
              {view === "editor" ? "Markdown" : view}
            </button>
          ))}
        </div>

        <main ref={mainRef} className="flex min-h-0 flex-1 flex-col lg:flex-row" style={{ "--editor-w": `${editorWidth}%`, "--dock-h": `${dockHeight}%` } as React.CSSProperties}>
          {/* Markdown editor */}
          {!editorOpen && (
            <div className="hidden w-10 shrink-0 flex-col items-center border-r border-zinc-200 bg-white py-2 lg:flex">
              <button type="button" onClick={() => setEditorOpen(true)} title="Show the Markdown editor" aria-label="Show the Markdown editor" className={ICON_BUTTON}>
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <span className="mt-3 font-mono text-[11px] font-semibold text-zinc-400 [writing-mode:vertical-rl]">SKILL.md</span>
            </div>
          )}
          <section
            aria-label="SKILL.md source"
            className={cn("min-h-0 flex-col bg-white lg:w-(--editor-w) lg:shrink-0", editorOpen ? "lg:flex" : "lg:hidden", mobileView === "editor" ? "flex flex-1" : "hidden")}
          >
            <div className="@container flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2 text-xs">
                <span className="font-mono text-[12.5px] font-semibold text-zinc-900">SKILL.md</span>
                {parsed.fatal ? (
                  <span className="truncate text-red-600" title={parsed.fatal}>
                    {parsed.fatal}
                  </span>
                ) : (
                  // Drops the counts that do not fit instead of cutting them off mid-word.
                  <span
                    className="whitespace-nowrap text-zinc-500"
                    title={`${graph.nodes.length} nodes · ${graph.edges.length} edges · ${Object.keys(graph.contracts).length} contracts`}
                  >
                    <span className="hidden @[24rem]:inline">{graph.nodes.length} nodes</span>
                    <span className="hidden @[28rem]:inline"> · {graph.edges.length} edges</span>
                    <span className="hidden @[34rem]:inline"> · {Object.keys(graph.contracts).length} contracts</span>
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <ToolbarPopover
                  ariaLabel="Blueprints"
                  align="right"
                  label={
                    <>
                      <LayoutTemplate className="h-3.5 w-3.5 text-zinc-500" /> Blueprints
                    </>
                  }
                  panelClassName="w-72"
                >
                  {(close) => (
                    <>
                      {BLUEPRINTS.map((blueprint) => (
                        <MenuItem
                          key={blueprint.id}
                          hint={blueprint.hint}
                          onClick={() => {
                            close();
                            replaceSource(blueprint.source, `Loaded the ${blueprint.title} blueprint (${modKey}+Z on the canvas undoes it)`);
                          }}
                        >
                          {blueprint.title}
                        </MenuItem>
                      ))}
                      <div className="my-1 h-px bg-zinc-100" />
                      <MenuItem
                        icon={<FilePlus className="h-3.5 w-3.5" />}
                        hint="Three nodes to start from scratch"
                        onClick={() => {
                          close();
                          replaceSource(BLANK_GRAPH_SKILL, "Started a blank graph");
                        }}
                      >
                        Blank graph
                      </MenuItem>
                    </>
                  )}
                </ToolbarPopover>
                <button type="button" onClick={() => setEditorOpen(false)} title="Hide the editor (more room for the canvas)" aria-label="Hide the Markdown editor" className={cn(ICON_BUTTON, "hidden lg:block")}>
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => openFileRef.current?.click()} title="Open a SKILL.md file" aria-label="Open a SKILL.md file" className={ICON_BUTTON}>
                  <FileUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => copyText(source, "Copied the Markdown")} title="Copy Markdown" aria-label="Copy Markdown" className={ICON_BUTTON}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={openFileRef}
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    void openFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <MonacoEditor
                language="markdown"
                value={source}
                // Monaco fires onChange outside React's event system; commit synchronously so a stale `value` cannot drop keystrokes.
                onChange={(value) => flushSync(() => setSource(value ?? ""))}
                onMount={handleEditorMount}
                beforeMount={defineEditorTheme}
                theme={EDITOR_THEME}
                options={{
                  wordWrap: "on",
                  lineNumbers: "on",
                  tabSize: 2,
                  // Room below the last line so it never sits flush against the window edge.
                  scrollBeyondLastLine: true,
                  padding: { top: 12, bottom: 32 },
                  lineDecorationsWidth: 12,
                  fontFamily: CODE_FONT,
                  fontSize: 13,
                  lineHeight: 21,
                }}
              />
            </div>
          </section>

          {editorOpen && <Splitter orientation="vertical" value={editorWidth} range={EDITOR_WIDTH} label="Resize the Markdown editor" onChange={setEditorWidth} measure={(clientX) => measureEditor(clientX)} />}

          {/* Canvas + dock */}
          <div ref={rightPaneRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
            <section aria-label="Graph canvas" className={cn("min-h-0 flex-1 lg:block lg:min-h-40", mobileView === "canvas" ? "block" : "hidden")}>
              <GraphCanvas
                graph={graph}
                trace={trace}
                isolation={isolation}
                selection={selection}
                focusRequest={focusRequest}
                fitRequest={fitRequest}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onSelect={handleSelect}
                onConnect={handleConnect}
                onDeleteSelection={handleDeleteSelection}
              />
            </section>

            <Splitter orientation="horizontal" value={dockHeight} range={DOCK_HEIGHT} label="Resize the details panel" onChange={setDockHeight} measure={measureDock} />

            <section
              aria-label="Details"
              className={cn("min-h-0 flex-col bg-white lg:flex lg:h-(--dock-h) lg:flex-none", mobileView === "details" ? "flex flex-1 border-t border-zinc-200 lg:border-t-0" : "hidden")}
            >
              <div role="tablist" aria-label="Details" className="flex shrink-0 items-center gap-1 border-b border-zinc-100 px-3">
                {(
                  [
                    ["inspector", "Inspector"],
                    ["plan", "Agent plan"],
                    ["issues", `Issues${issues.length > 0 ? ` (${issues.length})` : ""}`],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={dockTab === tab}
                    onClick={() => setDockTab(tab)}
                    className={cn(TAB, dockTab === tab ? "border-orange-600 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {dockTab === "inspector" && (
                  <InspectorPanel
                    graph={graph}
                    issues={issues}
                    selection={selection}
                    onMeta={(patch) => commit({ ...graph, ...patch })}
                    onNode={(id, patch) => commit(updateNode(graph, id, patch))}
                    onRename={handleRename}
                    onRemoveNode={handleRemoveNode}
                    onEdgeContract={(from, to, contract) => commit(setEdgeContract(graph, from, to, contract))}
                    onRemoveEdge={handleRemoveEdge}
                    onContract={(name, contract) => commit(updateContract(graph, name, contract))}
                    onRenameContract={handleRenameContract}
                    onSelect={handleSelect}
                  />
                )}
                {dockTab === "plan" && <PlanPanel graph={graph} activeStage={shownStage} onSelectNode={selectNode} />}
                {dockTab === "issues" && <IssueList issues={issues} onSelectNode={selectNode} />}
              </div>
            </section>
          </div>
        </main>
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-800 shadow-md"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
          {notice}
        </div>
      )}
    </div>
  );
}

const noopSubscribe = () => () => {};

/** Raw stored string plus the URL hash; a primitive snapshot keeps useSyncExternalStore stable between renders. */
function readStoredSnapshot(): string {
  // Blocked site data makes even reading window.localStorage throw; treat that as nothing saved.
  let stored: StoredState | null = null;
  try {
    stored = loadFromStorageEnvelope<StoredState>(STORAGE_KEY, "devscratchpad_graph_legacy_unused");
  } catch {}
  return [JSON.stringify(stored), window.location.hash].join("\u0000");
}

/**
 * Reads the saved session (and a share link, if any) before the workspace mounts, so the workspace
 * starts from it instead of restoring state in an effect. The server render shows a placeholder.
 */
export function GraphClient() {
  const snapshot = useSyncExternalStore(noopSubscribe, readStoredSnapshot, () => null);
  const restored = useMemo(() => {
    if (snapshot === null) return null;
    const [storedJson, hash] = snapshot.split("\u0000");
    const stored = JSON.parse(storedJson ?? "null") as StoredState | null;
    const shared = decodeShareHash(hash ?? "");
    return { initial: stored && typeof stored.source === "string" ? stored : null, shared: shared ? { source: shared.source } : null };
  }, [snapshot]);

  // Earlier builds could remember a model API key; this page no longer uses one, so remove it.
  useEffect(() => {
    removeStorageKey(LEGACY_KEY_STORAGE_KEY);
  }, []);

  if (restored === null) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <GraphHeader />
        <div className="flex h-[calc(100dvh-3.5rem)] min-h-[520px] items-center justify-center text-[13px] text-zinc-400">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading the graph studio
        </div>
      </div>
    );
  }
  return <GraphWorkspace initial={restored.initial} shared={restored.shared} />;
}
