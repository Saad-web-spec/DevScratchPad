/**
 * The Skill Graph landing page (/graph): what it is, a short tour, how it works, the Claude connector and
 * the starter graphs. The editor itself lives at /graph/studio.
 *
 * Look: left-aligned type on a 1120px grid, hairline rules between sections, white throughout. Orange
 * only on the primary button and one headline word; no decoration (no gradients, glows, tiles or cards
 * with shadows). What is shown is real: the kit file list and the connector example come from the
 * blueprints, not from a mock-up.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";
import { CopyField } from "./components/CopyField";
import { DemoVideo } from "./components/DemoVideo";
import { ShareLinkForward } from "./components/ShareLinkForward";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "./components/theme";
import { buildExportKit, kitFileRole } from "./lib/graphExport";
import { buildPlan } from "./lib/graphPlan";
import { parseGraphSkill, validateGraph, type SkillGraph } from "./lib/graphSkill";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "./lib/graphTemplates";

const CONNECTOR_URL = "https://www.devscratchpad.tech/graph/mcp";
const CLAUDE_CODE_COMMAND = `claude mcp add --transport http skill-graph ${CONNECTOR_URL}`;

export const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";
export const H2 = "text-[26px] font-bold leading-[1.15] tracking-[-0.025em] text-zinc-950 sm:text-[32px]";
export const LEAD = "text-[16px] leading-[1.6] text-zinc-600";
const PRIMARY = cn(BUTTON_PRIMARY, "h-10 px-4 text-[14px]");
const SECONDARY = cn(BUTTON_SECONDARY, "h-10 px-4 text-[14px]");
const TEXT_LINK = "inline-flex items-center gap-1.5 text-[15px] font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-[5px] transition-colors hover:decoration-orange-600";

const HOW: { step: string; title: string; body: string; detail: string }[] = [
  {
    step: "01",
    title: "Design",
    body: "Lay out the steps on a canvas, or write them in Markdown; both stay in sync. Each edge names what it carries, and a verifier can start in a fresh context.",
    detail: "graph.skill.md",
  },
  {
    step: "02",
    title: "Check",
    body: "The checker flags cycles, missing contracts, inputs that never arrive and vague gates. Walk through the plan stage by stage and see what every subagent receives.",
    detail: "issues · plan · dry run",
  },
  {
    step: "03",
    title: "Compile",
    body: "Export an orchestrating SKILL.md with one Claude Code subagent per step, each with its own tools and model, plus the same skill as a Cursor rule.",
    detail: ".claude/ · .cursor/",
  },
];

const POINTS = [
  "Steps that do not depend on each other run in parallel.",
  "Each subagent gets only its own input, never the others' reasoning.",
  "Every handoff is checked against its contract before the next stage.",
  "A fresh-context verifier gates the result and re-runs only what failed.",
];

/** The connector example uses the PR review blueprint, so the numbers it shows are the real ones. */
function connectorExample(): { name: string; rows: [string, string][] } {
  const blueprint = BLUEPRINTS.find((item) => item.id === "pr-review-graph") ?? BLUEPRINTS[0];
  const graph = parseGraphSkill(blueprint.source).graph as SkillGraph;
  const stages = buildPlan(graph);
  const steps = stages.reduce((sum, stage) => sum + stage.nodes.length, 0);
  const errors = validateGraph(graph).filter((issue) => issue.severity === "error").length;
  return {
    name: graph.name,
    rows: [
      ["draft_graph", `${graph.name} · ${steps} steps in ${stages.length} stages`],
      ["validate_graph", `${errors} errors`],
      ["compile_graph", `${buildExportKit(graph).length} files`],
    ],
  };
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className={cn(CONTAINER, "flex h-14 items-center justify-between gap-4")}>
        <Link href="/graph" className="flex shrink-0 items-center gap-2.5">
          <SkillGraphIcon className="h-[22px] w-[22px] shrink-0 text-zinc-950" />
          <span className="text-[15px] font-bold tracking-[-0.01em] text-zinc-950">Skill Graph</span>
        </Link>
        <nav aria-label="Skill Graph" className="flex shrink-0 items-center gap-4 sm:gap-7">
          <Link href="/graph/guide" className="text-[14px] font-medium text-zinc-600 transition-colors hover:text-zinc-950">
            Guide
          </Link>
          <Link href="/graph/connector" className="text-[14px] font-medium text-zinc-600 transition-colors hover:text-zinc-950">
            <span className="sm:hidden">Claude</span>
            <span className="hidden sm:inline">Use in Claude</span>
          </Link>
          <Link href="/graph/studio" className={cn(BUTTON_PRIMARY, "h-8 px-3 text-[13px]")}>
            <span className="sm:hidden">Studio</span>
            <span className="hidden sm:inline">Open studio</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-zinc-200">
      <div className={cn(CONTAINER, "py-14 sm:py-20")}>
        <div className="max-w-[760px]">
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.035em] text-zinc-950 sm:text-[56px]">
            Multi-agent skills, designed as a <span className="text-orange-800">graph</span>.
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-zinc-600 sm:text-[18px]">
            Draw the steps, what each one hands the next and the checks between them. Skill Graph checks the plan and compiles it into a Claude Code skill with one
            subagent per step, or a Cursor rule.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/graph/studio" className={PRIMARY}>
              Open the studio
            </Link>
            <Link href="/graph/connector" className={SECONDARY}>
              Use it in Claude
            </Link>
          </div>
          <p className="mt-5 text-[13.5px] text-zinc-500">Free. Runs in your browser, and nothing you write is uploaded. No API key, no account.</p>
        </div>
        <div className="mt-12 sm:mt-16">
          <DemoVideo />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-14 border-b border-zinc-200">
      <div className={cn(CONTAINER, "py-14 sm:py-20")}>
        <div className="max-w-[640px]">
          <h2 className={H2}>From a sketch to files your agent runs</h2>
          <p className={cn(LEAD, "mt-4")}>
            A normal SKILL.md leaves the agent to improvise how to split the work. A graph skill writes it down, and Skill Graph turns it into something the agent can
            follow.
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {HOW.map((item) => (
            <li key={item.step} className="border-t border-zinc-950 pt-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[12px] text-zinc-400">{item.step}</span>
                <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-zinc-950">{item.title}</h3>
              </div>
              <p className="mt-3 text-[15px] leading-[1.6] text-zinc-600">{item.body}</p>
              <p className="mt-4 font-mono text-[12.5px] text-zinc-500">{item.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function KitTree({ graph }: { graph: SkillGraph }) {
  const files = buildExportKit(graph);
  const agents = files.filter((file) => file.path.startsWith(".claude/agents/"));
  const shownAgents = agents.slice(0, 4);
  const rest = files.filter((file) => !file.path.startsWith(".claude/agents/"));
  const rows = [...rest.filter((file) => file.path.startsWith(".claude/skills/")), ...shownAgents, ...rest.filter((file) => !file.path.startsWith(".claude/skills/"))];
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-[12.5px]">
        <span className="truncate font-medium text-zinc-900">{graph.name}-skill-kit.zip</span>
        <span className="shrink-0 text-zinc-500">{files.length} files</span>
      </div>
      <ul className="divide-y divide-zinc-100">
        {rows.map((file) => (
          <li key={file.path} className="flex items-center gap-4 px-4 py-2.5 font-mono text-[12.5px]">
            <span className="min-w-0 flex-1 truncate text-zinc-800">{file.path}</span>
            <span className="shrink-0 text-zinc-500">{kitFileRole(file.path)}</span>
          </li>
        ))}
        {agents.length > shownAgents.length && <li className="px-4 py-2.5 font-mono text-[12.5px] text-zinc-400">+ {agents.length - shownAgents.length} more subagents</li>}
      </ul>
    </div>
  );
}

function WhatYouGet() {
  const graph = parseGraphSkill(DEFAULT_GRAPH_SKILL).graph as SkillGraph;
  return (
    <section className="border-b border-zinc-200">
      <div className={cn(CONTAINER, "grid grid-cols-[minmax(0,1fr)] gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16")}>
        <div>
          <h2 className={H2}>A kit you drop into your repository</h2>
          <p className={cn(LEAD, "mt-4")}>One orchestrating skill, one subagent per step and a Cursor rule. Your agent runs it with its own subagents; nothing here calls a model.</p>
          <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
            {POINTS.map((point) => (
              <li key={point} className="py-3 text-[15px] leading-[1.55] text-zinc-700">
                {point}
              </li>
            ))}
          </ul>
        </div>
        <KitTree graph={graph} />
      </div>
    </section>
  );
}

function ClaudeSection() {
  const example = connectorExample();
  return (
    <section id="claude" className="scroll-mt-14 border-b border-zinc-200">
      <div className={cn(CONTAINER, "grid grid-cols-[minmax(0,1fr)] gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16")}>
        <div>
          <h2 className={H2}>Or describe it, and let Claude build it</h2>
          <p className={cn(LEAD, "mt-4")}>
            Add Skill Graph to Claude as a connector. Claude drafts the workflow, checks it until it has no errors and hands you a studio link and the kit. No account
            and no API key.
          </p>
          <div className="mt-8 space-y-2">
            <p className="text-[13px] font-medium text-zinc-900">Connector URL</p>
            <CopyField value={CONNECTOR_URL} label="the connector URL" />
          </div>
          <Link href="/graph/connector" className={cn(TEXT_LINK, "mt-6")}>
            Set it up in Claude or Claude Code <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* A session as it runs: the Claude Code install command, then what Claude calls and gets back. */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 font-mono text-[12.5px] leading-[1.75]">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-500">Claude Code</div>
          <div className="space-y-5 px-4 py-4">
            <p className="break-all text-zinc-800">
              <span className="select-none text-zinc-400">$ </span>
              {CLAUDE_CODE_COMMAND}
            </p>
            <p className="text-zinc-800">
              <span className="select-none text-zinc-400">&gt; </span>
              Design a workflow that reviews my pull requests: security, performance and tests in parallel, then a fresh-context check before it comments.
            </p>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1">
              {example.rows.map(([tool, result]) => (
                <div key={tool} className="contents">
                  <dt className="text-zinc-500">{tool}</dt>
                  <dd className="text-zinc-800">{result}</dd>
                </div>
              ))}
            </dl>
            <p className="text-zinc-800">
              Open {example.name} in Skill Graph <span className="text-zinc-400">·</span> Download the kit
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Blueprints() {
  return (
    <section id="blueprints" className="scroll-mt-14 border-b border-zinc-200">
      <div className={cn(CONTAINER, "py-14 sm:py-20")}>
        <div className="max-w-[640px]">
          <h2 className={H2}>Start from a working graph</h2>
          <p className={cn(LEAD, "mt-4")}>{BLUEPRINTS.length} starter graphs for code and for everything else. Open one, change what you need, and export.</p>
        </div>
        <ul className="mt-10 grid border-t border-zinc-200 sm:grid-cols-2 sm:gap-x-12">
          {BLUEPRINTS.map((blueprint) => (
            <li key={blueprint.id} className="border-b border-zinc-200">
              {/* A full page load: the studio reads ?blueprint= once, before it mounts. */}
              <a href={`/graph/studio?blueprint=${blueprint.id}`} className="group flex items-start justify-between gap-6 py-5 -outline-offset-4">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-zinc-950 group-hover:text-orange-700">{blueprint.title}</span>
                  <span className="mt-1 block text-[14px] leading-[1.5] text-zinc-500">{blueprint.hint}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-950" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="border-t border-zinc-200">
      <div className={cn(CONTAINER, "flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:py-16")}>
        <h2 className={H2}>Write your next skill as a graph.</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/graph/studio" className={PRIMARY}>
            Open the studio
          </Link>
          <Link href="/graph/guide" className={SECONDARY}>
            Read the guide
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    { href: "/graph/studio", label: "Studio" },
    { href: "/graph/guide", label: "Guide" },
    { href: "/graph/connector", label: "Claude connector" },
    { href: "/graph/privacy", label: "Privacy" },
    { href: "/", label: "DevScratchpad" },
  ];
  return (
    <footer className="border-t border-zinc-200">
      <div className={cn(CONTAINER, "flex flex-col gap-4 py-8 text-[13px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between")}>
        <span>Skill Graph, by DevScratchpad</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-zinc-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** Above the fold to the blueprints. The long-form explainer (GraphSeoContent) and the closing call to action follow. */
export function GraphLanding({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-950 antialiased">
      <ShareLinkForward />
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhatYouGet />
        <ClaudeSection />
        <Blueprints />
        {children}
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
