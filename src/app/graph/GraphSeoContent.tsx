import Link from "next/link";
import { cn } from "@/lib/utils";
import { CONTAINER, H2, LEAD } from "./GraphLanding";
import { ArrowRight, FileCheck2, Gauge, Layers, Lock, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";

export const GRAPH_FAQS: { question: string; answer: string }[] = [
  {
    question: "What is a graph skill?",
    answer:
      "A SKILL.md whose frontmatter also describes how the work is split: the steps (nodes), what each step hands the next (edges with named contracts), which steps must start with a fresh context, which tools and model tier each step gets, and pass/fail gates. The body keeps one prompt per step. It is still plain Markdown, so it lives in your repository next to your other skills.",
  },
  {
    question: "How does it help an AI agent?",
    answer:
      "Instead of improvising how to split a task, the agent follows an explicit plan: it starts the steps of each stage in parallel as subagents, hands each one only its own input, checks every handoff against its contract, and re-runs or stops when a verifier's gate fails. It also loads less up front: the plan is small, and each step's prompt is only read when that step runs, in its own context window.",
  },
  {
    question: "Does this page call an AI model?",
    answer:
      "No. There is no API key and no model call here. The studio parses, checks and lays out the graph in your browser and compiles it into files. The agent you already use (Claude Code, Cursor and others) runs those files with its own subagents.",
  },
  {
    question: "What do I get when I export?",
    answer:
      "A ZIP with an orchestrating skill under .claude/skills/<name>/, one Claude Code subagent per model step under .claude/agents/ (with its tools and model; checks, gates and approvals are run by the orchestrating skill), a Cursor rule under .cursor/rules/, the editable graph source, and a README. There is also a single self-orchestrating SKILL.md for agents without subagents.",
  },
  {
    question: "What does the prior-context bias badge mean?",
    answer:
      "On a step marked isolated_context, it is the share of the upstream material its prompt reads that does not arrive through its own incoming edges. 0% means its subagent sees only what its edges carry, which is what a verifier needs to judge the work without inheriting the workers' reasoning.",
  },
];

const SPEC_EXAMPLE = `---
name: parallel-system-audit
description: Splits a goal into 4 parallel workers, verifies with fresh context, and synthesizes.
spec: skill-graph/1
topology:
  nodes:
    - id: worker_research
      type: worker
      model: haiku
      tools: [Read, Grep, Glob, WebSearch]
    - id: verifier
      type: verifier
      isolated_context: true
      model: opus
      tools: [Read, Grep, Glob]
      gate: Every kept claim cites concrete evidence.
      on_fail: retry
  edges:
    - from: worker_research
      to: verifier
      contract: findings_array
contracts:
  findings_array:
    format: markdown
    description: Numbered findings, each with evidence and a confidence.
---

## @node: worker_research
Focus ONLY on deep research for: {{splitter.worker_research}}`;

const CODE = "rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[12.5px] text-zinc-800";

const ADDS: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Stages", body: "Steps that do not depend on each other run in parallel; the rest wait for exactly the inputs they need.", icon: Layers },
  { title: "Contracts", body: "Every edge names what must travel on it, so the agent can check each handoff before moving on.", icon: FileCheck2 },
  { title: "Fresh context", body: "A step can be sealed off: its subagent sees only its incoming payloads, never another step's reasoning.", icon: Lock },
  { title: "Checks and approvals", body: "A command such as npm test can fail a step, a verifier sends back only what failed, and work that is hard to undo waits for your approval.", icon: ShieldCheck },
  { title: "Least privilege", body: "Each step lists the tools and model tier it needs, which compile into its subagent's settings.", icon: Wrench },
  { title: "Load on demand", body: "The agent reads a short plan when the skill triggers and each step's prompt only when that step runs.", icon: Gauge },
];

const STEPS = [
  "Your request matches the skill's description, and the agent loads the plan: a few hundred tokens, not every prompt.",
  "It starts the subagents of stage 1, handing each one exactly the input listed for it.",
  "Before the next stage, it checks each output against its contract and re-runs a step once if it does not match.",
  "Steps in the same stage start together. A fresh-context verifier gets only the raw outputs it audits.",
  "Command checks and the verifier's gate decide what passes. On a failure the agent re-runs only the steps that failed, with the reason, or stops and reports, as the plan says.",
  "The last step's output is returned as the answer.",
];

function CodePanel({ title, children }: { title: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-[12.5px] text-zinc-500">{title}</div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-800">{children}</pre>
    </div>
  );
}

export function GraphSeoContent() {
  return (
    <section id="why" className="scroll-mt-14">
      <div className={cn(CONTAINER, "space-y-14 py-14 sm:py-20")}>
        <div className="max-w-[640px] space-y-4">
          <h2 className={H2}>Skill files that tell an agent how to split the work</h2>
          <p className={LEAD}>
            A normal SKILL.md is one block of instructions. The agent reads it top to bottom and improvises the rest: how to divide the task, what each helper should see, and when the result
            is good enough. On larger tasks that is where things go wrong. Helpers inherit noise, checks get skipped, and the whole skill sits in the context window from the first message.
          </p>
          <p className={LEAD}>
            A graph skill writes those decisions down. You draw the steps and what flows between them; the studio checks the graph and compiles it into an orchestrating skill and one
            subagent per step, ready for Claude Code and Cursor.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-zinc-950">What a graph skill adds to SKILL.md</h2>
          <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {ADDS.map((item) => (
              <div key={item.title} className="border-t border-zinc-200 pt-4">
                <dt className="flex items-center gap-2.5 text-[15px] font-semibold text-zinc-950">
                  <item.icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  {item.title}
                </dt>
                <dd className="mt-2 text-[14.5px] leading-[1.6] text-zinc-600">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-zinc-950">What the agent does with it</h2>
            <ol className="divide-y divide-zinc-200 border-y border-zinc-200">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-4 py-3 text-[14.5px] leading-[1.6] text-zinc-600">
                  <span className="w-5 shrink-0 pt-px font-mono text-[12px] text-zinc-400">{String(index + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-5">
            <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-zinc-950">The format</h2>
            <CodePanel title="graph.skill.md">{SPEC_EXAMPLE}</CodePanel>
            <p className="text-sm leading-relaxed text-zinc-600">
              Prompts reference upstream work with <code className={CODE}>{"{{goal}}"}</code>, <code className={CODE}>{"{{node.field}}"}</code> (one key of a JSON output),{" "}
              <code className={CODE}>{"{{node.output}}"}</code> and group aliases such as <code className={CODE}>{"{{workers.output}}"}</code>. The studio checks that every reference
              points upstream, every contract is defined and the graph has no cycles, and shows exactly what each step&apos;s subagent will receive.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-zinc-950">Questions</h2>
          <dl className="divide-y divide-zinc-200 border-y border-zinc-200">
            {GRAPH_FAQS.map((faq) => (
              <div key={faq.question} className="grid gap-2 py-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                <dt className="text-[15px] font-semibold text-zinc-950">{faq.question}</dt>
                <dd className="text-[14.5px] leading-[1.6] text-zinc-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Link href="/ai-skill-studio" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-[5px] transition-colors hover:decoration-orange-600">
          Generate CLAUDE.md, Cursor rules and single-file skills in AI Skill Studio <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
