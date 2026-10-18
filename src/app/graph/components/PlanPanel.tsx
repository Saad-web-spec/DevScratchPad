"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Check, FileText, GraduationCap, Layers, ListChecks, Lock, RotateCcw, Scale, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_MAX_PARALLEL, DEFAULT_MAX_RETRIES, handoffOf, predecessorsOf, type GraphNode, type SkillGraph } from "../lib/graphSkill";
import { buildPlan, compileRun, experiencePath } from "../lib/graphPlan";
import { agentName, handOff, judgeAgentName, loadBudget, outputSummary, reflectAgentName } from "../lib/graphExport";
import { TYPE_ICON } from "./theme";

function formatTokens(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

/** Compiler text is Markdown for SKILL.md; the panel shows it as plain words. */
function plainText(text: string): string {
  return text.replace(/`([^`]+)`/g, "$1");
}

const CHIP = "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold leading-none";
const NEUTRAL_CHIP = cn(CHIP, "bg-zinc-100 text-zinc-600");
const ACCENT_CHIP = cn(CHIP, "bg-orange-50 text-orange-700");

/** What the step reads, in ids: `goal`, `splitter`, … */
function inputsOf(graph: SkillGraph, node: GraphNode): string[] {
  return predecessorsOf(graph, node.id).map((id) => (graph.nodes.find((n) => n.id === id)?.type === "input" ? "goal" : id));
}

/** The chips under a step: only what is set, so a plain step stays plain. */
function StepChips({ graph, node }: { graph: SkillGraph; node: GraphNode }) {
  const tools = node.tools && node.tools.length > 0 ? node.tools : null;
  const chips: React.ReactNode[] = [];
  if (node.type !== "code" && node.type !== "approval") {
    chips.push(
      <span key="tools" className={NEUTRAL_CHIP} title={tools ? tools.join(", ") : "Every tool the agent has"}>
        <Wrench className="h-2.5 w-2.5" /> {tools ? `${tools.length} tool${tools.length === 1 ? "" : "s"}` : "all tools"}
      </span>
    );
  }
  if (node.isolatedContext)
    chips.push(
      <span key="fresh" className={ACCENT_CHIP}>
        <Lock className="h-2.5 w-2.5" /> fresh
      </span>
    );
  if (node.check)
    chips.push(
      <span key="check" className={NEUTRAL_CHIP} title={`Passes when "${node.check}" exits 0`}>
        <ListChecks className="h-2.5 w-2.5" /> {node.check}
      </span>
    );
  if (node.gate)
    chips.push(
      <span key="gate" className={cn(CHIP, "bg-amber-50 text-amber-800")} title={node.gate}>
        <ShieldCheck className="h-2.5 w-2.5" /> gate · {node.onFail === "retry" ? `×${node.maxRetries ?? DEFAULT_MAX_RETRIES}` : "stop"}
      </span>
    );
  if (node.onFail === "retry" && node.retryTarget)
    chips.push(
      <span key="restart" className={NEUTRAL_CHIP} title={`A failure restarts the run at ${node.retryTarget}`}>
        <RotateCcw className="h-2.5 w-2.5" /> from {node.retryTarget}
      </span>
    );
  if (node.foreach)
    chips.push(
      <span key="foreach" className={ACCENT_CHIP} title={`One run per item of ${node.foreach}`}>
        <Layers className="h-2.5 w-2.5" /> each · ≤{node.maxParallel ?? DEFAULT_MAX_PARALLEL}
      </span>
    );
  if (node.probe)
    chips.push(
      <span key="probe" className={ACCENT_CHIP} title={`${node.probe} candidates side by side; ${judgeAgentName(graph, node)} keeps the best`}>
        <Scale className="h-2.5 w-2.5" /> probe ×{node.probe}
      </span>
    );
  if (handoffOf(graph, node) === "file" && graph.edges.some((edge) => edge.from === node.id))
    chips.push(
      <span key="file" className={NEUTRAL_CHIP} title="Saved to a file; later steps get the path">
        <FileText className="h-2.5 w-2.5" /> file
      </span>
    );
  if (node.risk && node.risk !== "contained") chips.push(<span key="risk" className={node.risk === "irreversible" ? ACCENT_CHIP : NEUTRAL_CHIP}>{node.risk}</span>);
  return chips.length > 0 ? <>{chips}</> : null;
}

/** One step of a stage: who runs it, what is set on it, and what goes in and out. */
function StepCard({ graph, node, onSelectNode }: { graph: SkillGraph; node: GraphNode; onSelectNode: (id: string) => void }) {
  const Icon = TYPE_ICON[node.type];
  const output = outputSummary(graph, node);
  const inputs = inputsOf(graph, node);
  const runner = node.type === "code" ? `$ ${compileRun(graph, node)}` : node.type === "approval" ? "asks you" : `subagent ${agentName(graph, node)}`;
  return (
    <button
      type="button"
      onClick={() => onSelectNode(node.id)}
      title={`${runner}\nGets ${plainText(handOff(graph, node).join("; "))}`}
      className="group block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-[border-color,box-shadow] hover:border-zinc-300 hover:shadow-xs focus-visible:border-orange-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/20"
    >
      <span className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-900 group-hover:text-orange-700">{node.label}</span>
        {node.model && <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-zinc-600">{node.model}</span>}
      </span>
      {node.type === "code" && <span className="mt-1 block truncate pl-8 font-mono text-[10.5px] text-zinc-500">{runner}</span>}
      <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1 pl-8">
        <span className="mr-1 flex min-w-0 max-w-full items-center gap-1 font-mono text-[11px] text-zinc-500" title={`${inputs.join(", ") || "nothing"} → ${output ? plainText(output) : "text"}`}>
          <span className="min-w-0 truncate">{inputs.length === 0 ? "nothing" : inputs.length > 2 ? `${inputs.length} steps` : inputs.join(", ")}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-zinc-300" />
          <span className="min-w-0 truncate text-zinc-700">{output ? plainText(output).replace(/ \((json|markdown|text)\)/g, "") : node.type === "approval" ? "your answer" : "text"}</span>
        </span>
        <StepChips graph={graph} node={node} />
      </span>
    </button>
  );
}

interface PlanPanelProps {
  graph: SkillGraph;
  /** Index of the stage being shown in the walkthrough, or null. */
  activeStage: number | null;
  onSelectNode: (id: string) => void;
}

/** What the compiled skill makes the agent do, stage by stage, and what it loads when. */
export function PlanPanel({ graph, activeStage, onSelectNode }: PlanPanelProps) {
  const plan = buildPlan(graph);
  const budget = loadBudget(graph);
  const largest = Math.max(0, ...budget.perNode.map((node) => node.tokens));
  const saved = budget.flat > 0 ? Math.round((1 - budget.upFront / budget.flat) * 100) : 0;
  const stageRefs = useRef<(HTMLLIElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the stage on show in view while the walkthrough advances. Scrolls only the panel (scrollIntoView
  // would also move the page) and leaves a margin so the card never sits flush against the panel's edge.
  useEffect(() => {
    if (activeStage === null) return;
    const item = stageRefs.current[activeStage];
    const scroller = rootRef.current?.closest(".graph-panel-scroll");
    if (!item || !scroller) return;
    const margin = 16;
    const box = scroller.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const toTop = rect.top - box.top - margin;
    const toBottom = rect.bottom - box.bottom + margin;
    // A card taller than the panel shows its top rather than its bottom.
    const delta = toTop < 0 ? toTop : toBottom > 0 ? Math.min(toBottom, toTop) : 0;
    if (delta !== 0) scroller.scrollBy({ top: delta, behavior: "smooth" });
  }, [activeStage]);

  const stats = [
    { value: formatTokens(budget.upFront), unit: "tok", caption: "loaded up front", title: "The plan the agent reads when the skill triggers" },
    { value: String(budget.perNode.length), unit: `× ≤${formatTokens(largest)}`, caption: "subagent prompts", title: "Each subagent's prompt is read only when its step runs, in its own context" },
    { value: saved > 0 ? `−${saved}` : "0", unit: "%", caption: "vs one flat file", title: `Up-front context compared with the same skill as one flat SKILL.md (${formatTokens(budget.flat)} tokens)` },
  ];

  return (
    <div ref={rootRef} className="space-y-5">
      <div className="grid grid-cols-3 divide-x divide-zinc-200 rounded-lg border border-zinc-200 bg-zinc-50/60">
        {stats.map((stat) => (
          <div key={stat.caption} className="min-w-0 px-3 py-2.5" title={stat.title}>
            <p className="truncate font-mono text-[15px] font-bold leading-none tracking-tight text-zinc-900">
              {stat.value}
              <span className="ml-0.5 text-[11px] font-semibold text-zinc-500">{stat.unit}</span>
            </p>
            <p className="mt-1.5 truncate text-[11px] text-zinc-500">{stat.caption}</p>
          </div>
        ))}
      </div>

      <ol className="relative space-y-4">
        {/* The rail that joins the stage markers. */}
        <span aria-hidden className="absolute bottom-4 left-[11px] top-4 w-px bg-zinc-200" />
        {plan.map((stage, index) => {
          const active = activeStage === index;
          const done = activeStage !== null && index < activeStage;
          const parallel = stage.nodes.length > 1;
          return (
            <li
              key={stage.number}
              ref={(element) => {
                stageRefs.current[index] = element;
              }}
              className="relative pl-9"
            >
              <span
                className={cn(
                  "absolute left-0 top-0 flex h-[23px] w-[23px] items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                  active ? "border-orange-500 bg-orange-500 text-white" : done ? "border-zinc-300 bg-zinc-100 text-zinc-500" : "border-zinc-300 bg-white text-zinc-600"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : stage.number}
              </span>
              <p className="flex h-[23px] items-center gap-2 text-[13px]">
                <span className="font-bold text-zinc-900">Stage {stage.number}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", parallel ? "bg-orange-50 text-orange-700" : "bg-zinc-100 text-zinc-500")}>
                  {parallel ? `${stage.nodes.length} in parallel` : "1 step"}
                </span>
              </p>
              <div className={cn("mt-2 space-y-1.5 rounded-xl transition-colors", active && "bg-orange-50/60 p-1.5 ring-1 ring-orange-200")}>
                {stage.nodes.map((node) => (
                  <StepCard key={node.id} graph={graph} node={node} onSelectNode={onSelectNode} />
                ))}
              </div>
            </li>
          );
        })}
        {graph.experience && (
          <li className="relative pl-9">
            <span className="absolute left-0 top-0 flex h-[23px] w-[23px] items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600">
              <GraduationCap className="h-3 w-3" />
            </span>
            <p className="flex h-[23px] items-center gap-2 text-[13px]">
              <span className="font-bold text-zinc-900">After the run</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-semibold text-zinc-500">learn</span>
            </p>
            <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
              <p className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-900">Reflect</span>
                <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-zinc-600">haiku</span>
              </p>
              <p className="mt-1 truncate font-mono text-[10.5px] text-zinc-400">{reflectAgentName(graph)}</p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-500">
                Updates <span className="font-mono text-zinc-700">{experiencePath(graph)}</span> from failed checks, gates and retries (at most {graph.experience.maxLessons} lessons). Each step
                gets its own lessons on the next run.
              </p>
            </div>
          </li>
        )}
      </ol>

      <p className="text-xs leading-relaxed text-zinc-500">
        Your agent runs this plan itself with its own subagents. Nothing here calls a model: the studio checks the graph and compiles it into the files the agent reads. Click a step to edit it.
      </p>
    </div>
  );
}
