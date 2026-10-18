"use client";

import { useEffect, useRef } from "react";
import { ListChecks, Lock, ShieldCheck, SquareTerminal, UserCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_MAX_RETRIES, type GraphNode, type SkillGraph } from "../lib/graphSkill";
import { buildPlan, compileRun } from "../lib/graphPlan";
import { agentName, handOff, loadBudget, outputSummary } from "../lib/graphExport";
import { NODE_THEME } from "./theme";

function formatTokens(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

const CHIP = "flex items-center gap-1 rounded-md px-1.5 py-px text-[11px] font-semibold";

/** Plan text as the compiled SKILL.md writes it, with its `ids` shown as code instead of raw backticks. */
function PlanText({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="font-mono text-[11px] text-zinc-700">
            {part}
          </code>
        ) : (
          part
        )
      )}
    </>
  );
}

/** Who carries out a step: a named subagent, or the agent itself (a command or a question to you). */
function StepTarget({ graph, node }: { graph: SkillGraph; node: GraphNode }) {
  if (node.type === "code") {
    return (
      <code className="flex min-w-0 items-start gap-1 font-mono text-[11px] text-zinc-500">
        <SquareTerminal className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
        <span className="break-all">{compileRun(graph, node)}</span>
      </code>
    );
  }
  if (node.type === "approval") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
        <UserCheck className="h-3 w-3 text-zinc-400" /> asks you
      </span>
    );
  }
  return <code className="font-mono text-[11px] text-zinc-400">{agentName(graph, node)}</code>;
}

interface PlanPanelProps {
  graph: SkillGraph;
  /** Index of the stage being shown in the walkthrough, or null. */
  activeStage: number | null;
  onSelectNode: (id: string) => void;
}

function Stat({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2.5">
      <p className="font-mono text-base font-bold leading-none tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-zinc-600">{caption}</p>
    </div>
  );
}

/** What the compiled skill makes the agent do, stage by stage, and what it loads when. */
export function PlanPanel({ graph, activeStage, onSelectNode }: PlanPanelProps) {
  const plan = buildPlan(graph);
  const budget = loadBudget(graph);
  const largest = Math.max(0, ...budget.perNode.map((node) => node.tokens));
  const saved = budget.flat > 0 ? Math.round((1 - budget.upFront / budget.flat) * 100) : 0;
  const stageRefs = useRef<(HTMLLIElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the stage on show in view while the walkthrough advances. Scrolls only the dock (scrollIntoView
  // would also move the page) and leaves a margin so the card never sits flush against the dock's edge.
  useEffect(() => {
    if (activeStage === null) return;
    const item = stageRefs.current[activeStage];
    const scroller = rootRef.current?.parentElement;
    if (!item || !scroller) return;
    const margin = 16;
    const box = scroller.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    const toTop = rect.top - box.top - margin;
    const toBottom = rect.bottom - box.bottom + margin;
    // A card taller than the dock shows its top rather than its bottom.
    const delta = toTop < 0 ? toTop : toBottom > 0 ? Math.min(toBottom, toTop) : 0;
    if (delta !== 0) scroller.scrollBy({ top: delta, behavior: "smooth" });
  }, [activeStage]);

  return (
    <div ref={rootRef} className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat value={`${formatTokens(budget.upFront)} tok`} caption="Loaded when the skill triggers: the plan only" />
        <Stat value={`${budget.perNode.length} × ≤${formatTokens(largest)}`} caption="Subagent prompts, each read only when its step runs" />
        <Stat value={saved > 0 ? `−${saved}%` : "0%"} caption={`Up-front context versus one flat SKILL.md (${formatTokens(budget.flat)} tok)`} />
      </div>

      <ol className="relative space-y-3 pl-9">
        <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-px bg-zinc-200" />
        {plan.map((stage, index) => {
          const active = activeStage === index;
          const done = activeStage !== null && index < activeStage;
          return (
            <li
              key={stage.number}
              ref={(element) => {
                stageRefs.current[index] = element;
              }}
              className="relative"
            >
              <span
                className={cn(
                  "absolute -left-9 top-0.5 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 font-mono text-xs font-bold",
                  active ? "border-orange-500 bg-orange-500 text-white" : done ? "border-zinc-400 bg-zinc-400 text-white" : "border-zinc-300 bg-white text-zinc-600"
                )}
              >
                {stage.number}
              </span>
              <div className={cn("rounded-lg border px-3 py-2.5 transition-colors", active ? "border-orange-300 bg-orange-50/40" : "border-zinc-200 bg-white")}>
                <p className="mb-2 text-[13px] font-bold text-zinc-900">
                  Stage {stage.number}
                  <span className="ml-1.5 font-medium text-zinc-500">{stage.nodes.length > 1 ? `· ${stage.nodes.length} steps in parallel` : "· 1 step"}</span>
                </p>
                <ul className="space-y-2.5">
                  {stage.nodes.map((node) => {
                    const output = outputSummary(graph, node);
                    const theme = NODE_THEME[node.type];
                    return (
                      <li key={node.id} className="text-[13px]">
                        <button type="button" onClick={() => onSelectNode(node.id)} className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left">
                          <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", theme.dot)} />
                          <span className="font-semibold text-zinc-900 hover:underline">{node.label}</span>
                          <StepTarget graph={graph} node={node} />
                          {node.model && <span className="rounded-md bg-zinc-100 px-1.5 py-px text-[11px] font-semibold text-zinc-600">{node.model}</span>}
                          {node.tools && node.tools.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500" title={node.tools.join(", ")}>
                              <Wrench className="h-3 w-3 text-zinc-400" /> {node.tools.join(", ")}
                            </span>
                          )}
                          {node.isolatedContext && (
                            <span className={cn(CHIP, "bg-orange-50 text-orange-700")}>
                              <Lock className="h-3 w-3" /> fresh context
                            </span>
                          )}
                          {node.check && (
                            <span className={cn(CHIP, "bg-zinc-100 text-zinc-700")} title={`Passes when "${node.check}" exits 0`}>
                              <ListChecks className="h-3 w-3" /> {node.check}
                            </span>
                          )}
                          {node.gate && (
                            <span className={cn(CHIP, "bg-amber-50 text-amber-700")}>
                              <ShieldCheck className="h-3 w-3" /> gate · {node.onFail === "retry" ? `re-run ×${node.maxRetries ?? DEFAULT_MAX_RETRIES}` : "stop on fail"}
                            </span>
                          )}
                          {node.risk && node.risk !== "contained" && (
                            <span className={cn(CHIP, node.risk === "irreversible" ? "bg-orange-50 text-orange-700" : "bg-zinc-100 text-zinc-600")}>{node.risk}</span>
                          )}
                        </button>
                        <p className="mt-1 pl-4 text-xs leading-relaxed text-zinc-500">
                          Gets <PlanText text={handOff(graph, node).join("; ")} />
                          {output && (
                            <>
                              {" "}
                              · returns <PlanText text={output.includes("`") ? output : `\`${output}\``} />
                            </>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs leading-relaxed text-zinc-500">
        Your agent runs this plan itself with its own subagents. Nothing here calls a model: the studio checks the graph and compiles it into the files the agent reads.
      </p>
    </div>
  );
}
