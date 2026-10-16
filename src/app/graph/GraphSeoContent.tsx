import Link from "next/link";
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

const EXPORT_TREE = `.claude/skills/parallel-system-audit/SKILL.md      the plan the agent follows
.claude/skills/parallel-system-audit/graph.skill.md the editable graph
.claude/agents/parallel-system-audit-verifier.md    one subagent per step
.cursor/rules/parallel-system-audit.mdc             the same skill for Cursor`;

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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        <span className="font-mono text-xs font-medium text-zinc-500">{title}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-800">{children}</pre>
    </div>
  );
}

export function GraphSeoContent() {
  return (
    <section className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-14 px-4 py-14 sm:px-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">The next version of skill files</p>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:text-4xl">Skill files that tell an agent how to split the work</h1>
          <p className="text-[15px] leading-relaxed text-zinc-600">
            A normal SKILL.md is one block of instructions. The agent reads it top to bottom and improvises the rest: how to divide the task, what each helper should see, and when the result
            is good enough. On larger tasks that is where things go wrong. Helpers inherit noise, checks get skipped, and the whole skill sits in the context window from the first message.
          </p>
          <p className="text-[15px] leading-relaxed text-zinc-600">
            A graph skill writes those decisions down. You draw the steps and what flows between them; the studio checks the graph and compiles it into an orchestrating skill and one
            subagent per step, ready for Claude Code and Cursor.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">What a graph skill adds to SKILL.md</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADDS.map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-200 bg-white p-5">
                <dt className="flex items-center gap-3 text-[15px] font-bold text-zinc-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  {item.title}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-zinc-600">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">What the agent does with it</h2>
            <ol className="space-y-3.5">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-3.5 text-sm leading-relaxed text-zinc-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 font-mono text-xs font-bold text-orange-800">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">The format</h2>
            <CodePanel title="graph.skill.md">{SPEC_EXAMPLE}</CodePanel>
            <p className="text-sm leading-relaxed text-zinc-600">
              Prompts reference upstream work with <code className={CODE}>{"{{goal}}"}</code>, <code className={CODE}>{"{{node.field}}"}</code> (one key of a JSON output),{" "}
              <code className={CODE}>{"{{node.output}}"}</code> and group aliases such as <code className={CODE}>{"{{workers.output}}"}</code>. The studio checks that every reference
              points upstream, every contract is defined and the graph has no cycles, and shows exactly what each step&apos;s subagent will receive.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">What you export</h2>
          <CodePanel title="skill-kit.zip">{EXPORT_TREE}</CodePanel>
          <p className="text-sm leading-relaxed text-zinc-600">Nothing on this page calls a model or needs an API key. Your agent runs the files with its own subagents.</p>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">Questions</h2>
          <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {GRAPH_FAQS.map((faq) => (
              <div key={faq.question} className="p-5">
                <dt className="text-[15px] font-bold text-zinc-900">{faq.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-zinc-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Link href="/graph/guide" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">
          Read the full Skill Graph guide <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/ai-skill-studio" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">
          Generate CLAUDE.md, Cursor rules and single-file skills in AI Skill Studio <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
