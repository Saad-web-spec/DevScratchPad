"use client";

import { useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowRight, Check, ChevronDown, ChevronRight, Download, Lock, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTRACT_FORMATS,
  DEFAULT_MAX_LESSONS,
  DEFAULT_MAX_PARALLEL,
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
  type GraphIssue,
  type GraphNode,
  type NodeType,
  type RiskLane,
  type SkillGraph,
} from "../lib/graphSkill";
import { experiencePath, previewNodeContext } from "../lib/graphPlan";
import { isOrphanLesson, type Lesson } from "../lib/graphLessons";
import type { Selection } from "./GraphCanvas";
import { FIELD, LABEL, NODE_THEME, SMALL_BUTTON } from "./theme";

const NOTE = "text-xs leading-relaxed text-zinc-500";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="flex items-center gap-2 border-t border-zinc-100 pt-4 text-[13px] font-bold tracking-[-0.01em] text-zinc-900">
      <span aria-hidden className="h-3.5 w-1 rounded-full bg-orange-500" />
      {children}
    </h4>
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
    <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-[11rem_6.5rem_minmax(0,1fr)_auto]">
      {onRenameContract ? (
        <CommitInput value={name} ariaLabel="Contract name" onCommit={(next) => onRenameContract(name, next)} />
      ) : (
        <span className="self-center truncate font-mono text-xs font-medium text-zinc-900">{name}</span>
      )}
      <select value={contract.format} aria-label={`Format of ${name}`} onChange={(event) => onContract(name, { ...contract, format: event.target.value as ContractFormat })} className={FIELD}>
        {CONTRACT_FORMATS.map((format) => (
          <option key={format} value={format}>
            {format}
          </option>
        ))}
      </select>
      <DraftInput
        value={contract.description}
        aria-label={`What a valid ${name} payload contains`}
        placeholder="What a valid payload contains"
        onValue={(next) => onContract(name, { ...contract, description: next })}
        className={cn(FIELD, "col-span-2 sm:col-span-1")}
      />
      <span className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
        <span className="text-[11px] text-zinc-400">
          {uses} edge{uses === 1 ? "" : "s"}
        </span>
        {onRenameContract && (
          <button type="button" aria-label={`Delete contract ${name}`} onClick={() => onContract(name, null)} className="rounded-md p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
      <div className={cn("col-span-2 grid grid-cols-1 gap-2 sm:col-span-4", contract.format === "json" && "sm:grid-cols-[17.5rem_minmax(0,1fr)]")}>
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
  agent: { title: "What its subagent will receive", system: "Instructions", user: "Task message from the orchestrator" },
  code: { title: "What the agent runs", system: "Command", user: "Files saved first" },
  approval: { title: "What you will be asked", system: "Question", user: "Shown to you" },
};

/** Exactly what the node's subagent will be given (or, for code and approval steps, run or shown), with upstream outputs as ⟨placeholders⟩. */
function ContextPreview({ graph, node }: { graph: SkillGraph; node: GraphNode }) {
  const preview = previewNodeContext(graph, node);
  const text = PREVIEW_TEXT[node.type === "code" || node.type === "approval" ? node.type : "agent"];
  return (
    <details className="group rounded-lg border border-zinc-200" open>
      <summary className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-bold text-zinc-900 hover:bg-zinc-50">{text.title}</summary>
      <div className="space-y-2.5 border-t border-zinc-200 p-3">
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
          <PlaceholderText text={preview.system} className="max-h-52 bg-white" />
        </div>
        <div>
          <span className={LABEL}>{text.user}</span>
          <PlaceholderText text={preview.user} className="max-h-32 bg-white" />
        </div>
        <p className={NOTE}>
          <span className="rounded bg-zinc-200/70 px-1 font-mono text-zinc-900">⟨placeholders⟩</span> are filled in by the agent at run time with the outputs named.
        </p>
      </div>
    </details>
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
      <SectionTitle>Incoming</SectionTitle>
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
            <span className="w-28 shrink-0 truncate font-mono text-zinc-700">{edge.from}</span>
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
  wide: "Reversible, but touches a lot: a command check must pass.",
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      <SectionTitle>Checks</SectionTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
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
              className={cn(SMALL_BUTTON, "self-end justify-self-start hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}
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
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={LABEL}>Prompt</span>
        {inputs.length > 0 && (
          <div className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen(!menuOpen)}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
              }}
              className={cn(SMALL_BUTTON, "py-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}
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
      <SectionTitle>Learning</SectionTitle>
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
        <option value="">as the skill does ({graph.handoff ?? "inline"})</option>
        <option value="inline">inline (in the task)</option>
        <option value="file">as a file</option>
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
      <SectionTitle>Fan-out</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
        <Field label="Run once per item of" className="col-span-2 sm:col-span-1">
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
      <SectionTitle>Probe</SectionTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
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

/** Settings most graphs never need: collapsed, with a one-line summary of what is set. */
function AdvancedSection({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-zinc-200">
      <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-zinc-900 hover:bg-zinc-50">
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-open:rotate-90" />
        Advanced
        <span className="truncate font-medium text-zinc-500">{summary}</span>
      </summary>
      <div className="space-y-3.5 border-t border-zinc-200 p-3 [&>h4:first-child]:border-t-0 [&>h4:first-child]:pt-0">{children}</div>
    </details>
  );
}

/** "sonnet · 6 tools · fresh context · check · gate · 1 contract", or what the section holds when nothing is set. */
function advancedSummary(graph: SkillGraph, node: GraphNode): string {
  const contracts = graph.edges.filter((edge) => edge.to === node.id && edge.contract !== undefined).length;
  const parts = [
    node.model,
    node.tools !== undefined && `${node.tools.length} tool${node.tools.length === 1 ? "" : "s"}`,
    node.isolatedContext && "fresh context",
    node.check && "check",
    node.gate !== undefined && "gate",
    node.risk && node.risk !== "contained" && node.risk,
    node.type === "code" && node.onFail === "retry" && "retries",
    node.retryTarget && `restarts at ${node.retryTarget}`,
    node.foreach && `each of ${node.foreach}`,
    node.probe && `probe ×${node.probe}`,
    handoffOf(graph, node) === "file" && "file handoff",
    contracts > 0 && `${contracts} contract${contracts === 1 ? "" : "s"}`,
  ].filter((part): part is string => typeof part === "string" && part !== "");
  if (parts.length > 0) return parts.join(" · ");
  if (node.type === "code") return "blast radius, on failure, contracts";
  if (node.type === "approval") return "incoming steps, contracts";
  return runsWithoutSubagent(node.type) ? "on failure, contracts" : "model, tools, checks, contracts";
}

function NodeInspector({ graph, issues, node, onNode, onRename, onRemoveNode, onEdgeContract, onConnect, lessons, onBakeLesson, onDiscardLesson }: InspectorProps & { node: GraphNode }) {
  const summary = advancedSummary(graph, node);
  const nodeLessons = graph.experience ? lessons.filter((lesson) => lesson.step === node.id) : [];
  const theme = NODE_THEME[node.type];
  const nodeIssues = issues.filter((issue) => issue.nodeId === node.id);
  const refs = extractTemplateRefs(node.prompt);
  const report = analyzeIsolation(graph, node);

  return (
    <div className="space-y-3.5">
      <p className="flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.015em] text-zinc-900">
        {node.label}
        <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]", theme.tile, theme.label)}>{node.type}</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Label" className="col-span-2">
          <DraftInput value={node.label} onValue={(next) => onNode(node.id, { label: next })} className={FIELD} />
        </Field>
        <div>
          <span className={LABEL}>Id</span>
          <CommitInput value={node.id} ariaLabel="Node id" onCommit={(next) => onRename(node.id, next)} />
        </div>
        <Field label="Type">
          <select value={node.type} onChange={(event) => onNode(node.id, { type: event.target.value as NodeType })} className={FIELD}>
            {NODE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {node.type === "input" && (
        <p className={NOTE}>
          The input is the user&apos;s goal. When the skill triggers, the agent takes it from the request (or asks for it) and hands it to the nodes connected here.
        </p>
      )}

      {node.type === "code" && (
        <>
          <Field label="Command">
            <DraftInput
              value={node.run ?? ""}
              placeholder="npm test"
              spellCheck={false}
              onValue={(next) => onNode(node.id, { run: next.trim() ? next : undefined })}
              className={cn(FIELD, "font-mono")}
            />
          </Field>
          <p className={NOTE}>
            Runs with Bash: no model, no tokens, the same result every time. Use it to merge, dedupe, diff or test. A reference such as{" "}
            <code className="font-mono text-zinc-700">{"{{workers}}"}</code> becomes the path of a file holding that output. A non-zero exit fails the step.
          </p>
          <AdvancedSection summary={summary}>
            <RiskField node={node} onNode={onNode} />
            <p className={NOTE}>{RISK_HINT[node.risk ?? "contained"]}</p>
            <FailureFields graph={graph} node={node} retryLabel="re-run upstream" onNode={onNode} />
            <HandoffField graph={graph} node={node} onNode={onNode} />
            <IncomingEdges graph={graph} node={node} onEdgeContract={onEdgeContract} onConnect={onConnect} />
          </AdvancedSection>
          <ContextPreview graph={graph} node={node} />
        </>
      )}

      {node.type === "approval" && (
        <>
          <Field label="Ask the user">
            <DraftTextarea value={node.prompt} rows={3} onValue={(next) => onNode(node.id, { prompt: next })} className={cn(FIELD, "resize-y")} />
          </Field>
          <p className={NOTE}>
            The agent stops here, shows you what came in, and goes on only on an explicit yes. Put it right before the step that is hard to undo; anywhere earlier it only slows the run down.
          </p>
          <AdvancedSection summary={summary}>
            <IncomingEdges graph={graph} node={node} onEdgeContract={onEdgeContract} onConnect={onConnect} />
          </AdvancedSection>
          <ContextPreview graph={graph} node={node} />
        </>
      )}

      {!runsWithoutSubagent(node.type) && (
        <>
          <PromptField key={node.id} graph={graph} node={node} onNode={onNode} />
          {refs.length > 0 && (
            <p className="text-xs text-zinc-500">
              Reads:{" "}
              {refs.map((ref) => (
                <code key={ref.raw} className="mr-1 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800">{`{{${ref.raw}}}`}</code>
              ))}
            </p>
          )}

          <AdvancedSection summary={summary}>
            <SectionTitle>Agent</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label="Model tier">
                <select value={node.model ?? ""} onChange={(event) => onNode(node.id, { model: event.target.value || undefined })} className={FIELD}>
                  <option value="">inherit (session model)</option>
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
              <HandoffField graph={graph} node={node} onNode={onNode} />
              <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-[13px] font-semibold text-zinc-700 sm:col-span-1">
                <input type="checkbox" checked={node.isolatedContext} onChange={(event) => onNode(node.id, { isolatedContext: event.target.checked })} className="h-4 w-4 accent-orange-600" />
                <Lock className="h-3.5 w-3.5 text-orange-500" /> Fresh context
              </label>
            </div>
            <ToolPicker node={node} onNode={onNode} />
            {node.isolatedContext && (
              <p className="text-xs text-zinc-500">
                {report.biasPercent}% of this prompt&apos;s upstream references bypass its {predecessorsOf(graph, node.id).length} incoming edge
                {predecessorsOf(graph, node.id).length === 1 ? "" : "s"}.
              </p>
            )}

            <FanOutSection graph={graph} node={node} onNode={onNode} />
            <ProbeSection node={node} onNode={onNode} />
            <ChecksSection graph={graph} node={node} onNode={onNode} />
            <IncomingEdges graph={graph} node={node} onEdgeContract={onEdgeContract} onConnect={onConnect} />
          </AdvancedSection>
          {nodeLessons.length > 0 && (
            <div className="space-y-2">
              <span className={LABEL}>Lessons from runs</span>
              <LessonList graph={graph} lessons={nodeLessons} showStep={false} onBake={onBakeLesson} onDiscard={onDiscardLesson} />
            </div>
          )}
          <ContextPreview graph={graph} node={node} />
        </>
      )}

      {nodeIssues.length > 0 && <IssueList issues={nodeIssues} onSelectNode={() => {}} />}

      <button type="button" onClick={() => onRemoveNode(node.id)} className={cn(SMALL_BUTTON, "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}>
        <Trash2 className="h-3 w-3" /> Remove node
      </button>
    </div>
  );
}

function EdgeInspector({ graph, edgeId, onEdgeContract, onRemoveEdge, onContract }: InspectorProps & { edgeId: string }) {
  const edge = graph.edges.find((e) => `${e.from}->${e.to}` === edgeId);
  if (!edge) return <p className={NOTE}>This edge no longer exists.</p>;
  const contract = edge.contract ? getContract(graph, edge.contract) : undefined;
  const uses = edge.contract ? graph.edges.filter((e) => e.contract === edge.contract).length : 0;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 font-mono text-[13px] font-medium text-zinc-900">
        {edge.from} <ArrowRight className="h-3.5 w-3.5 text-zinc-400" /> {edge.to}
      </p>
      <Field label="Contract">
        <DraftInput
          value={edge.contract ?? ""}
          list="graph-contracts"
          onValue={(next) => onEdgeContract(edge.from, edge.to, next)}
          placeholder="e.g. findings_array"
          spellCheck={false}
          className={cn(FIELD, "font-mono")}
        />
      </Field>
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
      <p className={NOTE}>
        The contract tells the agent what a valid payload on this edge looks like. It checks every handoff against it before the next stage starts.
      </p>
      <button type="button" onClick={() => onRemoveEdge(edge.from, edge.to)} className={cn(SMALL_BUTTON, "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}>
        <Trash2 className="h-3 w-3" /> Remove edge
      </button>
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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Skill name">
          <DraftInput value={graph.name} onValue={(next) => onMeta({ name: next })} spellCheck={false} className={cn(FIELD, "font-mono")} />
        </Field>
        <Field label="When to use it (description)">
          <DraftInput value={graph.description} onValue={(next) => onMeta({ description: next })} className={FIELD} />
        </Field>
      </div>

      <SectionTitle>Contracts</SectionTitle>
      {names.length === 0 && <p className={NOTE}>No contracts yet. A contract names what travels on an edge so the agent can check each handoff.</p>}
      <div className="space-y-1.5">
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

      <SectionTitle>Handoffs</SectionTitle>
      <Field label="Hand outputs on" className="sm:w-72">
        <select value={graph.handoff ?? "inline"} onChange={(event) => onMeta({ handoff: event.target.value === "file" ? "file" : undefined })} className={FIELD}>
          <option value="inline">inline: pasted into the next task</option>
          <option value="file">as files: the next step reads the path</option>
        </select>
      </Field>
      <p className={NOTE}>
        As files, the agent saves each output once under <code className="font-mono text-zinc-700">.skill-graph/{toSlug(graph.name)}/</code> and hands later steps the path, so a long
        output is never re-typed or shortened on the way. Steps that get a file need Read. A step can override this under Advanced.
      </p>

      <LearningSection {...props} />

      {issues.length > 0 && (
        <>
          <SectionTitle>Issues</SectionTitle>
          <IssueList issues={issues} onSelectNode={(id) => onSelect({ kind: "node", id })} />
        </>
      )}
      <p className={NOTE}>Select a node or an edge on the canvas to edit it. Every change is written straight back into the Markdown.</p>
    </div>
  );
}

export function InspectorPanel(props: InspectorProps) {
  const { selection, graph } = props;
  if (selection?.kind === "node") {
    const node = graph.nodes.find((n) => n.id === selection.id);
    if (node) return <NodeInspector {...props} node={node} />;
  }
  if (selection?.kind === "edge") return <EdgeInspector {...props} edgeId={selection.id} />;
  return <Overview {...props} />;
}
