"use client";

import { createContext, useContext, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowRight, Check, ChevronDown, ChevronRight, Download, Lock, Plus, ShieldCheck, Trash2, Waypoints, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTRACT_FORMATS,
  DEFAULT_MAX_ITERATIONS,
  DEFAULT_MAX_LESSONS,
  DEFAULT_MAX_PARALLEL,
  LOOP_ITERATIONS_CAP,
  LOOP_UNTILS,
  DEFAULT_MAX_RETRIES,
  KNOWN_TOOLS,
  MAX_LESSONS_CAP,
  MAX_PARALLEL_CAP,
  PROBE_MAX,
  PROBE_MIN,
  MODEL_TIERS,
  NODE_TYPES,
  RETRY_CAP,
  RISK_LANES,
  TOOL_PATTERN,
  analyzeIsolation,
  connectableSources,
  extractTemplateRefs,
  getContract,
  handoffOf,
  predecessorsOf,
  promptInputs,
  retryTargetOptions,
  runsWithoutSubagent,
  toSlug,
  wantsJsonOutput,
  type Contract,
  type ContractFormat,
  type ExperienceSettings,
  type HandoffMode,
  type LoopUntil,
  type GraphIssue,
  type GraphNode,
  type NodeType,
  type RiskLane,
  type SkillGraph,
} from "../lib/graphSkill";
import { estimateTokens, experiencePath, previewNodeContext } from "../lib/graphPlan";
import { isOrphanLesson, type Lesson } from "../lib/graphLessons";
import type { Selection } from "./GraphCanvas";
import { FIELD, LABEL, SMALL_BUTTON, TYPE_ICON } from "./theme";

const NOTE = "text-xs leading-relaxed text-zinc-500";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

export function IssueList({ issues, onSelectNode }: { issues: GraphIssue[]; onSelectNode: (id: string) => void }) {
  if (issues.length === 0) {
    return <p className={NOTE}>No problems found. The graph is a valid DAG, every reference resolves and every contract is defined.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {issues.map((issue, index) => {
        const Icon = issue.severity === "error" ? AlertCircle : AlertTriangle;
        return (
          <li key={`${issue.code}-${index}`}>
            <button
              type="button"
              disabled={!issue.nodeId}
              onClick={() => issue.nodeId && onSelectNode(issue.nodeId)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-700 enabled:hover:bg-zinc-50"
            >
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", issue.severity === "error" ? "text-red-600" : "text-amber-600")} />
              <span>{issue.message}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface InspectorProps {
  graph: SkillGraph;
  issues: GraphIssue[];
  selection: Selection;
  onMeta: (patch: { name?: string; description?: string; experience?: ExperienceSettings; handoff?: HandoffMode }) => void;
  onNode: (id: string, patch: Partial<Omit<GraphNode, "id">>) => void;
  onRename: (id: string, nextId: string) => boolean;
  onRemoveNode: (id: string) => void;
  onEdgeContract: (from: string, to: string, contract: string) => void;
  onRemoveEdge: (from: string, to: string) => void;
  /** Adds the edge from → to, as dragging a canvas handle does, and keeps the node selected. */
  onConnect: (from: string, to: string) => void;
  onContract: (name: string, contract: Contract | null) => void;
  onRenameContract: (name: string, nextName: string) => boolean;
  onSelect: (selection: Selection) => void;
  /** Lessons read from the pasted experience file (kept in the page only, never in the graph source). */
  lessons: Lesson[];
  lessonsText: string;
  onLessonsText: (text: string) => void;
  /** Moves the lesson into its step's prompt and out of the lessons file. */
  onBakeLesson: (lesson: Lesson) => void;
  onDiscardLesson: (lesson: Lesson) => void;
  onDownloadLessons: () => void;
}

/**
 * Keeps what the user is typing even when the saved value comes back normalized. Every keystroke is
 * written to the Markdown, and the parser trims values, so a trailing space would otherwise vanish
 * before the next letter arrives. The draft resets only when the value changes for another reason
 * (an edit in the Markdown, undo, another node).
 */
function useDraft(value: string): [string, (next: string) => void] {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (draft.trim() !== value.trim()) setDraft(value);
  }
  return [draft, setDraft];
}

function DraftInput({ value, onValue, ...rest }: { value: string; onValue: (next: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [draft, setDraft] = useDraft(value);
  return (
    <input
      {...rest}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        onValue(event.target.value);
      }}
    />
  );
}

function DraftTextarea({ value, onValue, ...rest }: { value: string; onValue: (next: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const [draft, setDraft] = useDraft(value);
  return (
    <textarea
      {...rest}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        onValue(event.target.value);
      }}
    />
  );
}

/** Text input that commits on blur/Enter (ids and contract names must stay valid while typing). */
function CommitInput({ value, onCommit, className, ariaLabel }: { value: string; onCommit: (next: string) => boolean; className?: string; ariaLabel?: string }) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  return (
    <input
      value={draft}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft.trim() !== value && !onCommit(draft.trim())) setDraft(value);
      }}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      spellCheck={false}
      className={cn(FIELD, "font-mono", className)}
    />
  );
}

function ContractsDatalist({ graph }: { graph: SkillGraph }) {
  return (
    <datalist id="graph-contracts">
      {Object.keys(graph.contracts).map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  );
}

/** Format + description of one contract (shared by every edge that names it). */
function ContractEditor({ name, contract, uses, onContract, onRenameContract }: { name: string; contract: Contract; uses: number; onContract: InspectorProps["onContract"]; onRenameContract?: InspectorProps["onRenameContract"] }) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-2.5">
      <div className="flex items-center gap-2">
        {onRenameContract ? (
          <CommitInput value={name} ariaLabel="Contract name" onCommit={(next) => onRenameContract(name, next)} className="min-w-0 flex-1" />
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] font-semibold text-zinc-900">{name}</span>
        )}
        <select value={contract.format} aria-label={`Format of ${name}`} onChange={(event) => onContract(name, { ...contract, format: event.target.value as ContractFormat })} className={cn(FIELD, "w-28 shrink-0")}>
          {CONTRACT_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
        {onRenameContract && (
          <button type="button" aria-label={`Delete contract ${name}`} title="Delete contract" onClick={() => onContract(name, null)} className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <DraftInput
        value={contract.description}
        aria-label={`What a valid ${name} payload contains`}
        placeholder="What a valid payload contains"
        onValue={(next) => onContract(name, { ...contract, description: next })}
        className={FIELD}
      />
      <div className="grid grid-cols-1 gap-2">
        {contract.format === "json" && (
          <DraftInput
            value={(contract.required ?? []).join(", ")}
            aria-label={`Keys every ${name} payload must have`}
            placeholder="Required keys, e.g. plan, files"
            spellCheck={false}
            onValue={(next) => {
              const keys = [...new Set(next.split(",").map((key) => key.trim()).filter(Boolean))];
              onContract(name, { ...contract, required: keys.length > 0 ? keys : undefined });
            }}
            className={cn(FIELD, "font-mono")}
          />
        )}
        <DraftInput
          value={contract.check ?? ""}
          aria-label={`Command that checks a ${name} payload`}
          placeholder="Check command, e.g. node validate.mjs {{payload}}"
          spellCheck={false}
          onValue={(next) => onContract(name, { ...contract, check: next.trim() ? next : undefined })}
          className={cn(FIELD, "font-mono")}
        />
      </div>
      <p className="text-[11px] text-zinc-400">
        Used on {uses} edge{uses === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Monospace text with ⟨placeholders⟩ picked out, so it is clear what the agent fills in. */
function PlaceholderText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(⟨[^⟩]+⟩)/g);
  return (
    <pre className={cn("overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11.5px] leading-relaxed text-zinc-700", className)}>
      {parts.map((part, index) =>
        part.startsWith("⟨") ? (
          <span key={index} className="rounded bg-zinc-200/70 px-1 text-zinc-900">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </pre>
  );
}

const PREVIEW_TEXT = {
  agent: { title: "What it receives", system: "Instructions", user: "Task message from the orchestrator" },
  code: { title: "What the agent runs", system: "Command", user: "Files saved first" },
  approval: { title: "What you will be asked", system: "Question", user: "Shown to you" },
};

/** Exactly what the node's subagent will be given (or, for code and approval steps, run or shown), with upstream outputs as ⟨placeholders⟩. */
function ContextPreview({ graph, node }: { graph: SkillGraph; node: GraphNode }) {
  const preview = previewNodeContext(graph, node);
  const text = PREVIEW_TEXT[node.type === "code" || node.type === "approval" ? node.type : "agent"];
  return (
    <>
      <div className="space-y-2.5">
        {preview.sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-1 text-xs text-zinc-500">
            From:
            {preview.sources.map((source) => (
              <span
                key={source.id}
                className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-medium", source.direct ? "bg-white text-zinc-700 ring-1 ring-zinc-200" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200")}
                title={source.direct ? "Arrives through an incoming edge" : "Does not arrive through an incoming edge"}
              >
                {source.id}
                {!source.direct && " · outside edges"}
              </span>
            ))}
          </p>
        )}
        <div>
          <span className={LABEL}>{text.system}</span>
          <PlaceholderText text={preview.system} className="max-h-72 bg-white" />
        </div>
        <div>
          <span className={LABEL}>{text.user}</span>
          <PlaceholderText text={preview.user} className="max-h-40 bg-white" />
        </div>
        <p className={NOTE}>
          <span className="rounded bg-zinc-200/70 px-1 font-mono text-zinc-900">⟨placeholders⟩</span> are filled in by the agent at run time with the outputs named.
        </p>
      </div>
    </>
  );
}

function ToolPicker({ node, onNode }: { node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const limited = node.tools !== undefined;
  const tools = node.tools ?? [];
  const extra = tools.filter((tool) => !KNOWN_TOOLS.includes(tool));
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const addCustom = () => {
    const tool = custom.trim();
    if (!tool) return;
    if (!TOOL_PATTERN.test(tool)) {
      setCustomError("Use a tool name, optionally with a one-line pattern in parentheses and no commas: Bash(npm test:*), mcp__github__get_issue.");
      return;
    }
    if (!tools.includes(tool)) onNode(node.id, { tools: [...tools, tool] });
    setCustom("");
    setCustomError(null);
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className={LABEL}>Tools</span>
        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
          <input
            type="checkbox"
            checked={limited}
            onChange={(event) => onNode(node.id, { tools: event.target.checked ? ["Read"] : undefined })}
            className="h-3.5 w-3.5 accent-orange-600"
          />
          Limit to
        </label>
      </div>
      {limited ? (
        <>
          <div className="flex flex-wrap gap-1">
            {KNOWN_TOOLS.map((tool) => {
              const on = tools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onNode(node.id, { tools: on ? tools.filter((t) => t !== tool) : [...tools, tool] })}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 font-mono text-[11.5px] font-medium transition-colors",
                    on ? "border-orange-300 bg-orange-50 text-orange-700" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
                  )}
                >
                  {tool}
                </button>
              );
            })}
            {/* Scoped and MCP tools exist only while listed, so their chip removes them. */}
            {extra.map((tool) => (
              <button
                key={tool}
                type="button"
                aria-label={`Remove ${tool}`}
                title={`Remove ${tool}`}
                onClick={() => onNode(node.id, { tools: tools.filter((t) => t !== tool) })}
                className="inline-flex max-w-full items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2.5 py-1 font-mono text-[11.5px] font-medium text-orange-700 transition-colors hover:border-orange-400"
              >
                <span className="truncate">{tool}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <input
              value={custom}
              onChange={(event) => {
                setCustom(event.target.value);
                setCustomError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Bash(npm test:*) or mcp__server__tool"
              spellCheck={false}
              aria-label="Add a scoped or MCP tool"
              aria-invalid={customError !== null}
              className={cn(FIELD, "font-mono")}
            />
            <button type="button" onClick={addCustom} disabled={!custom.trim()} className={cn(SMALL_BUTTON, "shrink-0 disabled:opacity-40")}>
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {customError && <p className="mt-1 text-xs text-rose-700">{customError}</p>}
        </>
      ) : (
        <p className={NOTE}>Inherits every tool the agent has. Limit it so this step can only do its job.</p>
      )}
    </div>
  );
}

function IncomingEdges({ graph, node, onEdgeContract, onConnect }: { graph: SkillGraph; node: GraphNode; onEdgeContract: InspectorProps["onEdgeContract"]; onConnect: InspectorProps["onConnect"] }) {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const sources = connectableSources(graph, node.id);
  if (incoming.length === 0 && sources.length === 0) return null;
  return (
    <>
      {/* The same edge as dragging a canvas handle, for keyboards and small screens. */}
      {sources.length > 0 && (
        <select
          value=""
          onChange={(event) => event.target.value && onConnect(event.target.value, node.id)}
          aria-label={`Connect a step into ${node.id}`}
          className={cn(FIELD, "text-zinc-600")}
        >
          <option value="">+ Connect from…</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.id} · {source.label}
            </option>
          ))}
        </select>
      )}
      <ul className="space-y-1.5">
        {incoming.map((edge) => (
          <li key={edge.from} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate font-mono text-zinc-700" title={edge.from}>
              {edge.from}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <DraftInput
              value={edge.contract ?? ""}
              list="graph-contracts"
              onValue={(next) => onEdgeContract(edge.from, edge.to, next)}
              placeholder="contract"
              spellCheck={false}
              aria-label={`Contract for ${edge.from} to ${node.id}`}
              className={cn(FIELD, "font-mono")}
            />
          </li>
        ))}
      </ul>
      <ContractsDatalist graph={graph} />
    </>
  );
}

const RISK_HINT: Record<RiskLane, string> = {
  contained: "Reversible and local.",
  wide: "Reversible, but touches a lot: a command check must pass when the step edits files or runs shell commands.",
  irreversible: "Hard to undo: an approval step must come first, and it is never retried automatically.",
};

/** What a failure re-runs when no retry target is set, in the words of the "Restart at" menu. */
function defaultRestart(node: GraphNode): string {
  if (node.gate !== undefined) return "steps the gate names";
  return node.type === "code" ? "the steps before it" : "this step";
}

/** On-fail behaviour, the retry cap and the retry target, shared by gates, command checks and code steps. */
function FailureFields({
  graph,
  node,
  retryLabel,
  onNode,
  children,
}: {
  graph: SkillGraph;
  node: GraphNode;
  retryLabel: string;
  onNode: InspectorProps["onNode"];
  children?: React.ReactNode;
}) {
  const options = retryTargetOptions(graph, node);
  // A target the validator flags stays listed, so the menu shows what the Markdown says.
  const stale = node.retryTarget !== undefined && !options.some((option) => option.id === node.retryTarget);
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="On fail">
        <select value={node.onFail ?? "stop"} onChange={(event) => onNode(node.id, { onFail: event.target.value as "retry" | "stop" })} className={FIELD}>
          <option value="retry">{retryLabel}</option>
          <option value="stop">stop and report</option>
        </select>
      </Field>
      {node.onFail === "retry" && (
        <Field label={`Max retries (≤${RETRY_CAP})`}>
          <input
            type="number"
            min={0}
            max={RETRY_CAP}
            value={node.maxRetries ?? DEFAULT_MAX_RETRIES}
            onChange={(event) => onNode(node.id, { maxRetries: Math.max(0, Math.min(RETRY_CAP, Math.round(Number(event.target.value) || 0))) })}
            className={FIELD}
          />
        </Field>
      )}
      {node.onFail === "retry" && (options.length > 0 || stale) && (
        <Field label="Restart at">
          <select value={node.retryTarget ?? ""} onChange={(event) => onNode(node.id, { retryTarget: event.target.value || undefined })} className={cn(FIELD, "font-mono")}>
            <option value="">{defaultRestart(node)}</option>
            {stale && <option value={node.retryTarget}>{node.retryTarget} (not upstream)</option>}
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id}
              </option>
            ))}
          </select>
        </Field>
      )}
      {children}
    </div>
  );
}

/** How much a step can break; decides which safeguards the checker asks for. */
function RiskField({ node, onNode }: { node: GraphNode; onNode: InspectorProps["onNode"] }) {
  return (
    <Field label="Blast radius">
      <select value={node.risk ?? "contained"} onChange={(event) => onNode(node.id, { risk: event.target.value === "contained" ? undefined : (event.target.value as RiskLane) })} className={FIELD}>
        {RISK_LANES.map((lane) => (
          <option key={lane} value={lane}>
            {lane}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Command check, blast radius and the model gate of a step that runs as a subagent. */
function ChecksSection({ graph, node, onNode }: { graph: SkillGraph; node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const hasGate = node.gate !== undefined;
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
        <Field label="Command check">
          <DraftInput
            value={node.check ?? ""}
            placeholder="e.g. npm test"
            spellCheck={false}
            onValue={(next) => onNode(node.id, { check: next.trim() ? next : undefined })}
            className={cn(FIELD, "font-mono")}
          />
        </Field>
        <RiskField node={node} onNode={onNode} />
      </div>
      <p className={NOTE}>
        The command runs when the step returns and passes on exit code 0, so a program can fail the work, not only a model. {RISK_HINT[node.risk ?? "contained"]}
      </p>

      {hasGate ? (
        <Field label="Gate: pass when">
          <DraftTextarea value={node.gate ?? ""} rows={2} onValue={(next) => onNode(node.id, { gate: next })} className={cn(FIELD, "resize-y")} />
        </Field>
      ) : (
        <button
          type="button"
          onClick={() => onNode(node.id, { gate: "Every claim cites concrete evidence.", onFail: "retry", maxRetries: DEFAULT_MAX_RETRIES })}
          className={cn(SMALL_BUTTON, "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}
        >
          <ShieldCheck className="h-3 w-3" /> Add a pass/fail gate
        </button>
      )}
      {(hasGate || node.check) && (
        <FailureFields graph={graph} node={node} retryLabel={hasGate ? "re-run upstream" : "re-run this step"} onNode={onNode}>
          {hasGate && (
            <button
              type="button"
              onClick={() => onNode(node.id, { gate: undefined, ...(node.check ? {} : { onFail: undefined, maxRetries: undefined, retryTarget: undefined }) })}
              className={cn(SMALL_BUTTON, "col-span-2 justify-self-start hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}
            >
              <Trash2 className="h-3 w-3" /> Remove gate
            </button>
          )}
        </FailureFields>
      )}
      {hasGate && (
        <p className={NOTE}>
          The node ends with <code className="font-mono">GATE: PASS</code>, or <code className="font-mono">GATE: FAIL</code> with one line per step to redo. Only those steps re-run; the rest keep their output.
        </p>
      )}
    </>
  );
}

/**
 * A step's prompt, with an "Insert input" menu that writes the right `{{reference}}` at the cursor,
 * so pulling in upstream work never means learning the syntax.
 */
function PromptField({ graph, node, onNode }: { graph: SkillGraph; node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const [draft, setDraft] = useDraft(node.prompt);
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputs = promptInputs(graph, node);

  const insert = (ref: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? draft.length;
    const end = element?.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const spacer = before === "" || /\s$/.test(before) ? "" : " ";
    const next = `${before}${spacer}${ref}${draft.slice(end)}`;
    setDraft(next);
    onNode(node.id, { prompt: next });
    setMenuOpen(false);
    const caret = start + spacer.length + ref.length;
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caret, caret);
    });
  };

  return (
    <div>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <PromptRefs node={node} />
        {inputs.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen(!menuOpen)}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
              }}
              className={cn(SMALL_BUTTON, "whitespace-nowrap py-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}
            >
              <Plus className="h-3 w-3" /> Insert input <ChevronDown className="h-3 w-3" />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-1 shadow-md">
                {inputs.map((input) => (
                  <button
                    key={input.ref}
                    type="button"
                    role="menuitem"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insert(input.ref)}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left hover:bg-zinc-50"
                  >
                    <span className="block text-[13px] font-medium text-zinc-900">{input.label}</span>
                    <code className="font-mono text-[11px] text-zinc-500">{input.ref}</code>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        aria-label="Prompt"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onNode(node.id, { prompt: event.target.value });
        }}
        rows={8}
        spellCheck={false}
        className={cn(FIELD, "resize-y font-mono leading-relaxed")}
      />
      <p className="mt-1 text-xs text-zinc-500">Everything on this step&apos;s incoming edges reaches it anyway; insert an input to say where it belongs in the prompt.</p>
    </div>
  );
}

/** Lessons from the experience file, each with its evidence and the two ways to clear it. */
function LessonList({ graph, lessons, showStep, onBake, onDiscard }: { graph: SkillGraph; lessons: Lesson[]; showStep: boolean; onBake: (lesson: Lesson) => void; onDiscard: (lesson: Lesson) => void }) {
  return (
    <ul className="space-y-1.5">
      {lessons.map((lesson) => {
        const orphan = isOrphanLesson(graph, lesson);
        return (
          <li key={`${lesson.number}-${lesson.step}`} className="rounded-lg border border-zinc-200 p-2.5">
            <p className="text-[13px] leading-snug text-zinc-800">
              <span className="mr-1.5 font-mono text-[11px] font-semibold text-zinc-400">L{lesson.number}</span>
              {showStep && <span className={cn("mr-1.5 font-mono text-[11.5px] font-medium", orphan ? "text-amber-700" : "text-zinc-700")}>{lesson.step}</span>}
              {lesson.rule}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">
              {lesson.evidence && <>{lesson.evidence} · </>}seen {lesson.seen} · helped {lesson.helped}
              {orphan && <span className="text-amber-700"> · no model step with this id</span>}
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                disabled={orphan}
                onClick={() => onBake(lesson)}
                title="Add the rule to the step's prompt and remove it from the lessons file"
                className={cn(SMALL_BUTTON, "hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:bg-white disabled:hover:text-zinc-600")}
              >
                <Check className="h-3 w-3" /> Bake in
              </button>
              <button type="button" onClick={() => onDiscard(lesson)} className={cn(SMALL_BUTTON, "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}>
                <X className="h-3 w-3" /> Discard
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Turns learning on, and reads the lessons file back in so a lesson can be baked into its step. */
function LearningSection({ graph, onMeta, lessons, lessonsText, onLessonsText, onBakeLesson, onDiscardLesson, onDownloadLessons }: InspectorProps) {
  const experience = graph.experience;
  const path = experiencePath(graph);
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 pb-2 text-[13px] font-semibold text-zinc-700">
          <input
            type="checkbox"
            checked={experience !== undefined}
            onChange={(event) => onMeta({ experience: event.target.checked ? { maxLessons: DEFAULT_MAX_LESSONS } : undefined })}
            className="h-4 w-4 accent-orange-600"
          />
          Learn from runs
        </label>
        {experience && (
          <Field label={`Max lessons (≤${MAX_LESSONS_CAP})`} className="w-36">
            <input
              type="number"
              min={1}
              max={MAX_LESSONS_CAP}
              value={experience.maxLessons}
              onChange={(event) => onMeta({ experience: { maxLessons: Math.max(1, Math.min(MAX_LESSONS_CAP, Math.round(Number(event.target.value) || 1))) } })}
              className={FIELD}
            />
          </Field>
        )}
      </div>
      <p className={NOTE}>
        {experience ? (
          <>
            After each run, a reflect step writes lessons to <code className="font-mono text-zinc-700">{path}</code>, only from failed checks, gates and retries. The next run hands each step its own
            lessons. Paste the file here to make a lesson permanent.
          </>
        ) : (
          "When on, the skill keeps lessons from failed checks, gates and retries, and hands each step its own lessons on the next run."
        )}
      </p>
      {experience && (
        <>
          <textarea
            value={lessonsText}
            onChange={(event) => onLessonsText(event.target.value)}
            rows={lessonsText ? 4 : 2}
            spellCheck={false}
            aria-label="Paste EXPERIENCE.md"
            placeholder="Paste EXPERIENCE.md from your repository"
            className={cn(FIELD, "resize-y font-mono text-[11.5px] leading-relaxed")}
          />
          {lessonsText.trim() !== "" && lessons.length === 0 && <p className={NOTE}>No lessons found. Each lesson starts with a line like - [L1] implement: …</p>}
          {lessons.length > 0 && (
            <>
              <LessonList graph={graph} lessons={lessons} showStep onBake={onBakeLesson} onDiscard={onDiscardLesson} />
              <button type="button" onClick={onDownloadLessons} className={cn(SMALL_BUTTON, "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}>
                <Download className="h-3 w-3" /> Download EXPERIENCE.md
              </button>
            </>
          )}
        </>
      )}
    </>
  );
}

/** A step's own handoff, or the graph's. */
function HandoffField({ graph, node, onNode }: { graph: SkillGraph; node: GraphNode; onNode: InspectorProps["onNode"] }) {
  return (
    <Field label="Hand on output">
      <select value={node.handoff ?? ""} onChange={(event) => onNode(node.id, { handoff: (event.target.value || undefined) as HandoffMode | undefined })} className={FIELD}>
        <option value="">Skill default ({graph.handoff === "file" ? "as a file" : "inline"})</option>
        <option value="inline">Inline, in the next task</option>
        <option value="file">As a file the next step reads</option>
      </select>
    </Field>
  );
}

/** Lists a fan-out step can run over: each JSON step feeding it, and the required keys of its contract. */
function foreachOptions(graph: SkillGraph, node: GraphNode): string[] {
  return predecessorsOf(graph, node.id).flatMap((id) => {
    const source = graph.nodes.find((n) => n.id === id);
    if (!source || source.type === "input" || source.type === "approval" || !wantsJsonOutput(graph, source)) return [];
    const contract = graph.edges.find((edge) => edge.from === id && edge.to === node.id)?.contract;
    const keys = (contract ? getContract(graph, contract)?.required : undefined) ?? [];
    return [id, ...keys.map((key) => `${id}.${key}`)];
  });
}

/** Fan-out: run the step once per item of a list an earlier step returns. */
function FanOutSection({ graph, node, onNode }: { graph: SkillGraph; node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const options = foreachOptions(graph, node);
  const listId = `graph-foreach-${node.id}`;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Run once per item of" className="col-span-2">
          <DraftInput
            value={node.foreach ?? ""}
            list={listId}
            placeholder={options[1] ?? options[0] ?? "plan.files"}
            spellCheck={false}
            onValue={(next) => onNode(node.id, next.trim() ? { foreach: next.trim() } : { foreach: undefined, maxParallel: undefined, maxItems: undefined })}
            className={cn(FIELD, "font-mono")}
          />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>
        {node.foreach && (
          <>
            <Field label={`At once (≤${MAX_PARALLEL_CAP})`}>
              <input
                type="number"
                min={1}
                max={MAX_PARALLEL_CAP}
                value={node.maxParallel ?? DEFAULT_MAX_PARALLEL}
                onChange={(event) => onNode(node.id, { maxParallel: Math.max(1, Math.min(MAX_PARALLEL_CAP, Math.round(Number(event.target.value) || 1))) })}
                className={FIELD}
              />
            </Field>
            <Field label="Max items">
              <input
                type="number"
                min={1}
                value={node.maxItems ?? ""}
                placeholder="no cap"
                onChange={(event) => {
                  const value = Math.round(Number(event.target.value));
                  onNode(node.id, { maxItems: event.target.value === "" || !(value >= 1) ? undefined : value });
                }}
                className={FIELD}
              />
            </Field>
          </>
        )}
      </div>
      <p className={NOTE}>
        {node.foreach ? (
          <>
            One run per item, each in its own subagent, with the item as <code className="font-mono text-zinc-700">{"{{item}}"}</code>. The step&apos;s output is a JSON array of the
            runs&apos; results, in item order.
          </>
        ) : (
          <>Name a JSON array an earlier step returns (step.key) to run this step once per item, for example once per changed file.</>
        )}
      </p>
    </>
  );
}

/** Probing: run several candidates of the step, drop those that fail their checks, and let a judge keep the best. */
function ProbeSection({ node, onNode }: { node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const on = node.probe !== undefined;
  return (
    <>
      <div className="grid grid-cols-1 gap-2">
        <Field label="Candidates">
          <select
            value={node.probe ?? ""}
            onChange={(event) => onNode(node.id, event.target.value ? { probe: Number(event.target.value) } : { probe: undefined, probeHints: undefined })}
            className={FIELD}
          >
            <option value="">off (one run)</option>
            {Array.from({ length: PROBE_MAX - PROBE_MIN + 1 }, (_, index) => PROBE_MIN + index).map((count) => (
              <option key={count} value={count}>
                {count} candidates
              </option>
            ))}
          </select>
        </Field>
        {on && (
          <Field label="Approach per candidate (one per line)">
            <DraftTextarea
              value={(node.probeHints ?? []).join("\n")}
              rows={Math.max(2, node.probe ?? 2)}
              placeholder={"The smallest change that works.\nReuse existing helpers wherever possible."}
              onValue={(next) => {
                const hints = next
                  .split("\n")
                  .map((hint) => hint.trim())
                  .filter(Boolean);
                onNode(node.id, { probeHints: hints.length > 0 ? hints : undefined });
              }}
              className={cn(FIELD, "resize-y")}
            />
          </Field>
        )}
      </div>
      <p className={NOTE}>
        {on
          ? `${node.probe} candidates run side by side with different approaches; contract checks drop the broken ones and a fresh-context judge keeps the best (or combines two). Costs about ${(node.probe ?? 0) + 1} runs of this step. A candidate without an approach uses its own.`
          : "Try several approaches to this step and keep the best. Only for steps that read (a plan, a review, research): candidates of a step that edits files would overwrite each other."}
      </p>
    </>
  );
}

const LOOP_END_LABEL: Record<LoopUntil, string> = {
  check: "its check passes",
  gate: "its own gate passes",
  done: "it says it is done",
};

/** Loop: run the step again on its own output until its check, its gate or its own word ends it. */
function LoopSection({ node, onNode }: { node: GraphNode; onNode: InspectorProps["onNode"] }) {
  const loop = node.loop;
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
        <Field label="Repeat until">
          <select
            value={loop?.until ?? ""}
            onChange={(event) =>
              onNode(node.id, {
                loop: event.target.value ? { until: event.target.value as LoopUntil, maxIterations: loop?.maxIterations ?? DEFAULT_MAX_ITERATIONS, ledger: loop?.ledger ?? true } : undefined,
              })
            }
            className={FIELD}
          >
            <option value="">off (one run)</option>
            {LOOP_UNTILS.map((until) => (
              <option key={until} value={until}>
                {LOOP_END_LABEL[until]}
              </option>
            ))}
          </select>
        </Field>
        {loop && (
          <Field label="At most">
            <input
              type="number"
              min={1}
              max={LOOP_ITERATIONS_CAP}
              value={loop.maxIterations}
              onChange={(event) => onNode(node.id, { loop: { ...loop, maxIterations: Math.max(1, Math.min(LOOP_ITERATIONS_CAP, Math.round(Number(event.target.value) || 1))) } })}
              className={FIELD}
            />
          </Field>
        )}
      </div>
      {loop && (
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" checked={loop.ledger} onChange={(event) => onNode(node.id, { loop: { ...loop, ledger: event.target.checked } })} className="mt-0.5 h-4 w-4 accent-orange-600" />
          <span className="min-w-0 text-xs text-zinc-600">Keep a ledger: each iteration leaves a note, and the next run starts from it.</span>
        </label>
      )}
      <p className={NOTE}>
        {loop
          ? loop.until === "check" && !node.check
            ? "Set a command check above; the loop ends when it exits 0."
            : loop.until === "gate" && !node.gate
              ? "Add a gate above; the loop ends when this step's own verdict is PASS."
              : `Runs again on its own output until ${LOOP_END_LABEL[loop.until]}, at most ${loop.maxIterations} times, then stops the run. Later steps get only the last answer.`
          : "For work that takes several passes: fixing until the tests pass, or working through a list until nothing is left."}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ panel layout */

/** Which sections are open. Kept above the node views, so switching steps keeps the same sections open. */
const SectionState = createContext<{ open: Record<string, boolean>; toggle: (id: string, fallback: boolean) => void } | null>(null);

/**
 * A full-width group of settings that folds away. Closed, it still says what is set on its right, so
 * the panel reads as a summary of the step and opens only where you want to change something.
 */
function PanelSection({ id, title, summary, defaultOpen = false, children }: { id: string; title: string; summary?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const state = useContext(SectionState);
  const open = state?.open[id] ?? defaultOpen;
  // Clipped only while it folds or unfolds, so menus inside an open section are not cut off.
  const [moving, setMoving] = useState(false);
  const bodyId = `inspector-${id}`;
  return (
    <section className="border-b border-zinc-100">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          setMoving(true);
          state?.toggle(id, defaultOpen);
        }}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-hidden"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-90 text-zinc-600")} />
        <span className="shrink-0 text-[13px] font-bold tracking-[-0.01em] text-zinc-900">{title}</span>
        {summary && <span className="ml-auto min-w-0 truncate pl-3 text-right text-[11.5px] text-zinc-500">{summary}</span>}
      </button>
      <div
        id={bodyId}
        inert={!open}
        onTransitionEnd={() => setMoving(false)}
        className={cn("grid transition-[grid-template-rows] duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className={cn("min-h-0", (!open || moving) && "overflow-hidden")}>
          <div className="space-y-3 px-4 pb-4 pt-0.5">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Top of the panel: what is selected, its name, and how to remove it. Stays in view while the sections scroll. */
function PanelHeader({ icon, title, meta, onRemove, removeLabel }: { icon: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700">{icon}</span>
        <div className="min-w-0 flex-1">
          {title}
          {meta && <div className="mt-1 flex min-w-0 items-center gap-1.5">{meta}</div>}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** A heading that is also its own input: looks like text until you hover or type. */
const TITLE_INPUT =
  "-mx-1.5 block w-[calc(100%+0.75rem)] truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[15px] font-extrabold tracking-[-0.015em] text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-200 focus-visible:border-orange-500 focus-visible:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/20";
const META_SELECT =
  "h-6 shrink-0 rounded-md border border-zinc-200 bg-zinc-50 pl-1.5 pr-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-zinc-600 transition-colors hover:border-zinc-300 focus-visible:border-orange-500 focus-visible:outline-hidden";

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** "1 error · 2 warnings" for the problems section. */
function issueSummary(issues: GraphIssue[]): React.ReactNode {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  return (
    <>
      {errors > 0 && <span className="font-semibold text-red-600">{plural(errors, "error")}</span>}
      {errors > 0 && warnings > 0 && " · "}
      {warnings > 0 && <span className="font-semibold text-amber-700">{plural(warnings, "warning")}</span>}
    </>
  );
}

/** What a step's prompt reads, as chips, beside the "Insert input" menu. */
function PromptRefs({ node }: { node: GraphNode }) {
  const refs = extractTemplateRefs(node.prompt);
  if (refs.length === 0) return <span className="text-xs text-zinc-400">No inputs referenced</span>;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {refs.map((ref) => (
        <code key={ref.raw} className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700">{`{{${ref.raw}}}`}</code>
      ))}
    </span>
  );
}

function agentSummary(graph: SkillGraph, node: GraphNode): string {
  return [
    node.model ?? "inherit",
    node.tools === undefined || node.tools.length === 0 ? "all tools" : plural(node.tools.length, "tool"),
    node.isolatedContext && "fresh context",
    handoffOf(graph, node) === "file" && "file",
  ]
    .filter(Boolean)
    .join(" · ");
}

function checksSummary(node: GraphNode): string {
  const parts = [
    node.check && `$ ${node.check}`,
    node.gate !== undefined && "gate",
    node.risk && node.risk !== "contained" && node.risk,
    node.onFail === "retry" && `retry ×${node.maxRetries ?? DEFAULT_MAX_RETRIES}`,
    node.retryTarget && `from ${node.retryTarget}`,
  ].filter((part): part is string => typeof part === "string");
  return parts.length > 0 ? parts.join(" · ") : "none";
}

function inputsSummary(graph: SkillGraph, node: GraphNode): string {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const contracts = incoming.filter((edge) => edge.contract).length;
  if (incoming.length === 0) return "none";
  return `${plural(incoming.length, "step")}${contracts > 0 ? ` · ${plural(contracts, "contract")}` : ""}`;
}

function previewSummary(graph: SkillGraph, node: GraphNode): string {
  const preview = previewNodeContext(graph, node);
  return node.type === "code" || node.type === "approval" ? "" : `~${estimateTokens(`${preview.system}\n${preview.user}`).toLocaleString("en-US")} tokens`;
}

function NodeInspector({ graph, issues, node, onNode, onRename, onRemoveNode, onEdgeContract, onConnect, lessons, onBakeLesson, onDiscardLesson }: InspectorProps & { node: GraphNode }) {
  const nodeLessons = graph.experience ? lessons.filter((lesson) => lesson.step === node.id) : [];
  const nodeIssues = issues.filter((issue) => issue.nodeId === node.id);
  const report = analyzeIsolation(graph, node);
  const Icon = TYPE_ICON[node.type];
  const model = !runsWithoutSubagent(node.type);
  const preds = predecessorsOf(graph, node.id).length;

  return (
    <div>
      <PanelHeader
        icon={<Icon className="h-4 w-4" />}
        title={<DraftInput value={node.label} aria-label="Label" placeholder="Name this step" onValue={(next) => onNode(node.id, { label: next })} className={TITLE_INPUT} />}
        meta={
          <>
            <select value={node.type} aria-label="Type" onChange={(event) => onNode(node.id, { type: event.target.value as NodeType })} className={META_SELECT}>
              {NODE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <CommitInput value={node.id} ariaLabel="Node id" onCommit={(next) => onRename(node.id, next)} className="h-6 w-auto min-w-0 flex-1 rounded-md px-1.5 py-0 text-[11.5px] text-zinc-600" />
          </>
        }
        onRemove={() => onRemoveNode(node.id)}
        removeLabel="Remove this step"
      />

      {nodeIssues.length > 0 && (
        <PanelSection id="problems" title="Problems" summary={issueSummary(nodeIssues)} defaultOpen>
          <IssueList issues={nodeIssues} onSelectNode={() => {}} />
        </PanelSection>
      )}

      {node.type === "input" && (
        <div className="px-4 py-4">
          <p className={NOTE}>
            The input is the user&apos;s goal. When the skill triggers, the agent takes it from the request (or asks for it) and hands it to the steps connected here.
          </p>
        </div>
      )}

      {node.type === "code" && (
        <>
          <PanelSection id="command" title="Command" summary={node.run ? `$ ${node.run}` : "not set"} defaultOpen>
            <DraftInput
              value={node.run ?? ""}
              aria-label="Command"
              placeholder="npm test"
              spellCheck={false}
              onValue={(next) => onNode(node.id, { run: next.trim() ? next : undefined })}
              className={cn(FIELD, "font-mono")}
            />
            <p className={NOTE}>
              Runs with Bash: no model, no tokens, the same result every time. A reference such as <code className="font-mono text-zinc-700">{"{{workers}}"}</code> becomes the path of a file
              holding that output. A non-zero exit fails the step.
            </p>
          </PanelSection>
          <PanelSection id="failure" title="On failure" summary={checksSummary(node)}>
            <RiskField node={node} onNode={onNode} />
            <p className={NOTE}>{RISK_HINT[node.risk ?? "contained"]}</p>
            <FailureFields graph={graph} node={node} retryLabel="re-run upstream" onNode={onNode} />
            <HandoffField graph={graph} node={node} onNode={onNode} />
          </PanelSection>
        </>
      )}

      {node.type === "approval" && (
        <PanelSection id="question" title="Question" summary={node.prompt.trim() ? "" : "not set"} defaultOpen>
          <DraftTextarea value={node.prompt} aria-label="Ask the user" rows={3} onValue={(next) => onNode(node.id, { prompt: next })} className={cn(FIELD, "resize-y")} />
          <p className={NOTE}>The agent stops here, shows you what came in, and goes on only on an explicit yes. Put it right before the step that is hard to undo.</p>
        </PanelSection>
      )}

      {model && (
        <>
          <PanelSection id="prompt" title="Prompt" defaultOpen>
            <PromptField key={node.id} graph={graph} node={node} onNode={onNode} />
          </PanelSection>

          <PanelSection id="agent" title="Agent" summary={agentSummary(graph, node)}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Model">
                <select value={node.model ?? ""} onChange={(event) => onNode(node.id, { model: event.target.value || undefined })} className={FIELD}>
                  <option value="">inherit</option>
                  {[...MODEL_TIERS, ...(node.model && !MODEL_TIERS.includes(node.model) ? [node.model] : [])].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Output">
                <select
                  value={node.outputFormat ?? "auto"}
                  onChange={(event) => onNode(node.id, { outputFormat: event.target.value === "auto" ? undefined : (event.target.value as "json" | "text") })}
                  className={FIELD}
                >
                  <option value="auto">from contracts</option>
                  <option value="json">json</option>
                  <option value="text">text</option>
                </select>
              </Field>
              <div className="col-span-2">
                <HandoffField graph={graph} node={node} onNode={onNode} />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 px-3 py-2 transition-colors hover:border-zinc-300">
              <input type="checkbox" checked={node.isolatedContext} onChange={(event) => onNode(node.id, { isolatedContext: event.target.checked })} className="mt-0.5 h-4 w-4 accent-orange-600" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
                  <Lock className="h-3.5 w-3.5 text-orange-500" /> Fresh context
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">Sees only what its incoming edges carry: no shared history.</span>
              </span>
            </label>
            {node.isolatedContext && (
              <p className={NOTE}>
                {report.biasPercent}% of this prompt&apos;s upstream references bypass its {plural(preds, "incoming edge")}.
              </p>
            )}
            <ToolPicker node={node} onNode={onNode} />
          </PanelSection>

          <PanelSection id="checks" title="Checks" summary={checksSummary(node)}>
            <ChecksSection graph={graph} node={node} onNode={onNode} />
          </PanelSection>

          <PanelSection id="fanout" title="Fan-out" summary={node.foreach ? `each of ${node.foreach}` : "off"}>
            <FanOutSection graph={graph} node={node} onNode={onNode} />
          </PanelSection>

          <PanelSection id="probe" title="Probe" summary={node.probe ? `${node.probe} candidates` : "off"}>
            <ProbeSection node={node} onNode={onNode} />
          </PanelSection>

          <PanelSection id="loop" title="Loop" summary={node.loop ? `until ${node.loop.until} · ≤${node.loop.maxIterations}` : "off"}>
            <LoopSection node={node} onNode={onNode} />
          </PanelSection>
        </>
      )}

      {node.type !== "input" && (
        <PanelSection id="inputs" title="Inputs" summary={inputsSummary(graph, node)}>
          <IncomingEdges graph={graph} node={node} onEdgeContract={onEdgeContract} onConnect={onConnect} />
          {graph.edges.every((edge) => edge.to !== node.id) && connectableSources(graph, node.id).length === 0 && <p className={NOTE}>No step can connect into this one.</p>}
        </PanelSection>
      )}

      {nodeLessons.length > 0 && (
        <PanelSection id="lessons" title="Lessons" summary={plural(nodeLessons.length, "lesson")} defaultOpen>
          <LessonList graph={graph} lessons={nodeLessons} showStep={false} onBake={onBakeLesson} onDiscard={onDiscardLesson} />
        </PanelSection>
      )}

      {node.type !== "input" && (
        <PanelSection id="preview" title={PREVIEW_TEXT[node.type === "code" || node.type === "approval" ? node.type : "agent"].title} summary={previewSummary(graph, node)}>
          <ContextPreview graph={graph} node={node} />
        </PanelSection>
      )}
    </div>
  );
}

function EdgeInspector({ graph, edgeId, onEdgeContract, onRemoveEdge, onContract }: InspectorProps & { edgeId: string }) {
  const edge = graph.edges.find((e) => `${e.from}->${e.to}` === edgeId);
  if (!edge) return <p className={cn(NOTE, "p-4")}>This edge no longer exists.</p>;
  const contract = edge.contract ? getContract(graph, edge.contract) : undefined;
  const uses = edge.contract ? graph.edges.filter((e) => e.contract === edge.contract).length : 0;
  return (
    <div>
      <PanelHeader
        icon={<ArrowRight className="h-4 w-4" />}
        title={
          <p className="flex min-w-0 items-center gap-1.5 py-0.5 font-mono text-[13px] font-semibold text-zinc-900">
            <span className="truncate">{edge.from}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{edge.to}</span>
          </p>
        }
        meta={<span className="text-xs text-zinc-500">Edge · what travels from one step to the next</span>}
        onRemove={() => onRemoveEdge(edge.from, edge.to)}
        removeLabel="Remove this edge"
      />
      <PanelSection id="edge-contract" title="Contract" summary={edge.contract ?? "none"} defaultOpen>
        <DraftInput
          value={edge.contract ?? ""}
          aria-label="Contract"
          list="graph-contracts"
          onValue={(next) => onEdgeContract(edge.from, edge.to, next)}
          placeholder="e.g. findings_array"
          spellCheck={false}
          className={cn(FIELD, "font-mono")}
        />
        <ContractsDatalist graph={graph} />
        {edge.contract && contract && <ContractEditor name={edge.contract} contract={contract} uses={uses} onContract={onContract} />}
        {edge.contract && !contract && (
          <button
            type="button"
            onClick={() => onContract(edge.contract as string, { format: /json/i.test(edge.contract as string) ? "json" : "markdown", description: "" })}
            className={cn(SMALL_BUTTON, "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}
          >
            <Plus className="h-3 w-3" /> Define &quot;{edge.contract}&quot;
          </button>
        )}
        <p className={NOTE}>The contract tells the agent what a valid payload on this edge looks like. It checks every handoff against it before the next stage starts.</p>
      </PanelSection>
    </div>
  );
}

function Overview(props: InspectorProps) {
  const { graph, issues, onMeta, onSelect, onContract, onRenameContract } = props;
  const names = Object.keys(graph.contracts);
  const nextName = () => {
    let n = names.length + 1;
    while (graph.contracts[`contract_${n}`]) n += 1;
    return `contract_${n}`;
  };
  return (
    <div>
      <PanelHeader
        icon={<Waypoints className="h-4 w-4" />}
        title={<DraftInput value={graph.name} aria-label="Skill name" placeholder="skill-name" spellCheck={false} onValue={(next) => onMeta({ name: next })} className={cn(TITLE_INPUT, "font-mono text-[14px]")} />}
        meta={<span className="text-xs text-zinc-500">The whole skill · select a step or an edge to edit it</span>}
      />
      <div className="space-y-1.5 border-b border-zinc-100 px-4 py-3">
        <span className={LABEL}>When to use it</span>
        <DraftTextarea
          value={graph.description}
          aria-label="When to use it (description)"
          rows={2}
          placeholder="Describe when the agent should run this skill"
          onValue={(next) => onMeta({ description: next })}
          className={cn(FIELD, "resize-y leading-relaxed")}
        />
      </div>

      {issues.length > 0 && (
        <PanelSection id="overview-problems" title="Problems" summary={issueSummary(issues)} defaultOpen>
          <IssueList issues={issues} onSelectNode={(id) => onSelect({ kind: "node", id })} />
        </PanelSection>
      )}

      <PanelSection id="overview-contracts" title="Contracts" summary={names.length === 0 ? "none" : plural(names.length, "contract")}>
        {names.length === 0 && <p className={NOTE}>No contracts yet. A contract names what travels on an edge so the agent can check each handoff.</p>}
        <div className="space-y-2">
          {names.map((name) => (
            <ContractEditor
              key={name}
              name={name}
              contract={graph.contracts[name]}
              uses={graph.edges.filter((edge) => edge.contract === name).length}
              onContract={onContract}
              onRenameContract={onRenameContract}
            />
          ))}
        </div>
        <button type="button" onClick={() => onContract(nextName(), { format: "markdown", description: "" })} className={cn(SMALL_BUTTON, "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}>
          <Plus className="h-3 w-3" /> Add contract
        </button>
      </PanelSection>

      <PanelSection id="overview-handoffs" title="Handoffs" summary={graph.handoff === "file" ? "as files" : "inline"}>
        <select value={graph.handoff ?? "inline"} aria-label="Hand outputs on" onChange={(event) => onMeta({ handoff: event.target.value === "file" ? "file" : undefined })} className={FIELD}>
          <option value="inline">Inline: pasted into the next task</option>
          <option value="file">As files: the next step reads the path</option>
        </select>
        <p className={NOTE}>
          As files, the agent saves each output once under <code className="font-mono text-zinc-700">.skill-graph/{toSlug(graph.name)}/</code> and hands later steps the path, so a long output is
          never re-typed or shortened on the way. Steps that get a file need Read. A step can override this in its Agent section.
        </p>
      </PanelSection>

      <PanelSection id="overview-learning" title="Learning" summary={graph.experience ? `on · ≤${graph.experience.maxLessons} lessons` : "off"}>
        <LearningSection {...props} />
      </PanelSection>

      <p className={cn(NOTE, "px-4 py-4")}>Every change here is written straight back into the Markdown, and Ctrl+Z on the canvas undoes it.</p>
    </div>
  );
}

export function InspectorPanel(props: InspectorProps) {
  const { selection, graph } = props;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string, fallback: boolean) => setOpen((current) => ({ ...current, [id]: !(current[id] ?? fallback) }));
  let body: React.ReactNode = <Overview {...props} />;
  if (selection?.kind === "node") {
    const node = graph.nodes.find((n) => n.id === selection.id);
    if (node) body = <NodeInspector {...props} node={node} />;
  } else if (selection?.kind === "edge") body = <EdgeInspector {...props} edgeId={selection.id} />;
  return <SectionState.Provider value={{ open, toggle }}>{body}</SectionState.Provider>;
}
