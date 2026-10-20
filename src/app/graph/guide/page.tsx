import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";
import { NODE_FIELD_DOCS, NODE_TYPE_DOCS, REFERENCE_DOCS } from "../lib/graphReference";

const PAGE_URL = "https://www.devscratchpad.tech/graph/guide";

export const metadata: Metadata = {
  title: "Skill Graph Guide: Build Multi-Agent Skills Step by Step",
  description:
    "How to use Skill Graph: nodes, edges and contracts, prompt references, fresh-context verifiers, gates and checks, validation, the plan walkthrough, and exporting to Claude Code and Cursor.",
  keywords: [
    "Skill Graph guide",
    "how to build a multi-agent skill",
    "Claude Code subagents tutorial",
    "SKILL.md tutorial",
    "fresh context verifier",
    "agent workflow DAG",
    "Cursor rules multi-agent",
    "DevScratchpad",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Skill Graph Guide: Build Multi-Agent Skills Step by Step | DevScratchpad",
    description: "Everything you need to design, check and export a graph skill for Claude Code and Cursor: nodes, contracts, references, gates, checks and export.",
    url: PAGE_URL,
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Graph Guide: Build Multi-Agent Skills Step by Step",
    description: "Nodes, contracts, prompt references, fresh-context verifiers, gates and checks, then export to Claude Code and Cursor.",
  },
};

/** Plain-text quick start for the HowTo structured data (the page renders the richer version below). */
const QUICK_START_TEXT: { name: string; text: string }[] = [
  { name: "Pick a blueprint", text: "Open Blueprints above the editor and choose the closest match, or start from a blank graph." },
  { name: "Name it", text: "Click an empty spot on the canvas and fill in the skill name and when to use it; the description tells your agent when to use the skill." },
  { name: "Shape the steps", text: "Add nodes and connect them by dragging a node's handle onto another node." },
  { name: "Say what each step does", text: "Select a step and write its job in Prompt. Its inputs arrive on their own; Insert input places one at a precise spot." },
  { name: "Fix what the checker finds", text: "Open Issues, click an issue to jump to its node, and fix it until the status says Valid." },
  { name: "Walk through it, then export", text: "Step through the stages with Walk through plan, then export the kit and unzip it into your repository." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      "@id": `${PAGE_URL}#article`,
      headline: "How to build a multi-agent skill with Skill Graph",
      description: "A complete guide to Skill Graph: nodes, edges and contracts, prompt references, fresh context, gates and checks, validation, walkthrough and export.",
      url: PAGE_URL,
      image: `${PAGE_URL}/opengraph-image`,
      inLanguage: "en",
      proficiencyLevel: "Beginner",
      about: { "@type": "SoftwareApplication", name: "Skill Graph", url: "https://www.devscratchpad.tech/graph" },
      author: { "@type": "Organization", name: "DevScratchpad", url: "https://www.devscratchpad.tech" },
      publisher: { "@type": "Organization", name: "DevScratchpad", url: "https://www.devscratchpad.tech" },
      mainEntityOfPage: PAGE_URL,
    },
    {
      "@type": "HowTo",
      name: "Build a multi-agent skill with Skill Graph",
      totalTime: "PT15M",
      tool: [{ "@type": "HowToTool", name: "Skill Graph (browser)" }],
      step: QUICK_START_TEXT.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.name, text: step.text, url: `${PAGE_URL}#quick-start` })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "DevScratchpad", item: "https://www.devscratchpad.tech" },
        { "@type": "ListItem", position: 2, name: "Skill Graph", item: "https://www.devscratchpad.tech/graph" },
        { "@type": "ListItem", position: 3, name: "Guide", item: PAGE_URL },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ content */

const TOC: { id: string; title: string; group?: string }[] = [
  { id: "what", title: "What Skill Graph does" },
  { id: "what-you-need", title: "What you need" },
  { id: "quick-start", title: "Quick start" },
  { id: "workspace", title: "The workspace" },
  { id: "nodes", title: "Node types" },
  { id: "walkthrough", title: "Walking through the plan" },
  { id: "export", title: "Export and install" },
  { id: "edges", title: "Contracts", group: "Advanced" },
  { id: "prompts", title: "References" },
  { id: "fresh-context", title: "Fresh context" },
  { id: "safety", title: "Gates, checks and approvals" },
  { id: "fan-out", title: "Fan-out: one run per item" },
  { id: "file-handoffs", title: "File handoffs" },
  { id: "probing", title: "Probing: try several, keep the best" },
  { id: "learning", title: "Learning from runs" },
  { id: "models", title: "Models and tools" },
  { id: "file-format", title: "The file format" },
  { id: "issues", title: "Errors and warnings", group: "Reference" },
  { id: "sharing", title: "Saving, sharing and privacy" },
  { id: "shortcuts", title: "Keyboard and canvas" },
  { id: "troubleshooting", title: "Troubleshooting" },
];

const NEEDS: { part: string; needed: boolean; where: React.ReactNode }[] = [
  { part: "Steps (nodes)", needed: true, where: <><b>+ Node</b>, or start from a blueprint</> },
  { part: "Connections (edges)", needed: true, where: <>Drag a node&apos;s handle onto another node</> },
  { part: "A prompt per step", needed: true, where: <>Inspector → Prompt (new steps come with one)</> },
  { part: "Skill name and when to use it", needed: true, where: <>Inspector, with nothing selected</> },
  { part: "Contracts", needed: false, where: <>Click an edge and type a name; it is defined for you</> },
  { part: "References", needed: false, where: <>Inspector → Insert input, above the prompt</> },
  { part: "Model, tools, gates, checks, risk", needed: false, where: <>Inspector → Agent and Checks</> },
];

const QUICK_START: { title: string; body: React.ReactNode }[] = [
  { title: "Pick a blueprint", body: <>Open <b>Blueprints</b> above the editor and choose the closest match, for example <b>PR review</b> or <b>Ship a change</b>. Blank graph gives you three nodes to start from.</> },
  { title: "Name it", body: <>Click an empty spot on the canvas, then fill in <b>Skill name</b> and <b>When to use it</b> in the Inspector. The description is what makes your agent pick the skill, so say when to use it: &ldquo;Use when reviewing a pull request&hellip;&rdquo;.</> },
  { title: "Shape the steps", body: <>Add nodes with <b>+ Node</b> and connect them by dragging a node&apos;s right-hand handle onto another node. A connection means &ldquo;this step needs that one&apos;s output&rdquo;.</> },
  { title: "Say what each step does", body: <>Select a step and write its job in <b>Prompt</b>; every new step starts with a sensible one. Its inputs arrive on their own. To place one at a precise spot, use <b>Insert input</b> above the prompt.</> },
  { title: "Fix what the checker finds", body: <>The status next to the toolbar turns red when there are errors. Open <b>Issues</b>, click an issue to jump to its node, and fix it until it says <b>Valid</b>.</> },
  { title: "Walk through it, then export", body: <>Press <b>Walk through plan</b> to see the stages in order, then <b>Export</b> the kit and unzip it into your repository.</> },
];

const ISSUES: { severity: "Error" | "Warning"; message: string; fix: string }[] = [
  { severity: "Error", message: "No input node", fix: "Add a node of type input; it carries the goal in." },
  { severity: "Error", message: "The graph has a cycle", fix: "Skill graphs run front to back. Remove the edge that loops back; use on_fail: retry for loops." },
  { severity: "Error", message: "Node has no incoming edge", fix: "Connect it from the step whose output it needs, otherwise it never receives data." },
  { severity: "Error", message: "Node has no prompt", fix: "Add a ## @node: id section in the editor with what the step should do." },
  { severity: "Error", message: "Reference does not match any node / is not upstream", fix: "Check the spelling of the id, and that the node it reads from runs before it (connect them)." },
  { severity: "Warning", message: "Contract is used but not defined", fix: "Happens when a contract is named in the file but not defined. Click the edge and press Define, or add it under contracts:." },
  { severity: "Warning", message: "Isolated step reads outside its edges", fix: "Remove the reference, or add an edge from the step it reads, so nothing leaks in." },
  { severity: "Error", message: "Code node has no command", fix: "Set run:, for example npm test." },
  { severity: "Error", message: "Two steps would export to the same subagent file", fix: "Ids that differ only in case or in _ versus - (review_a, review-a) share a file name. Rename one." },
  { severity: "Error", message: "Invalid model or tool name", fix: "Use haiku, sonnet, opus, fable or a model id, and tool names such as Read or Bash(git diff:*) on one line, without commas inside the parentheses." },
  { severity: "Warning", message: "Never reads an incoming edge", fix: "Either use that input in the prompt or remove the edge so both steps can run in parallel." },
  { severity: "Warning", message: "Parallel steps can all edit files", fix: "A step counts when it lists Edit or Write, or has no tools list (it inherits every tool). Give them separate files, limit their tools, or run them one after the other." },
  { severity: "Error", message: "Irreversible step without approval", fix: "Add an approval node upstream so a person signs off first, and set on_fail: stop on that step." },
  { severity: "Warning", message: "Wide step without a check", fix: "Add check: npm test (or your test command), or a code step after it." },
  { severity: "Warning", message: "Empty tools list", fix: "Claude Code reads [] as every tool. List what the step needs, or remove the key." },
  { severity: "Warning", message: "Nothing runs in parallel", fix: "If every step really needs the one before, one agent with a check may serve you better than a graph." },
  { severity: "Warning", message: "Prompt section matches no node", fix: "A ## @node: section whose id is not in the topology is ignored and removed on the next canvas edit. Fix the id, or add the node." },
  { severity: "Error", message: "Retry target is not upstream, or not a model step", fix: "Pick a step that runs before this one and does model work. Code, approval and input steps have nothing to redo." },
  { severity: "Error", message: "Restarting would re-run an irreversible step", fix: "Pick a retry target after the irreversible step, or set on_fail: stop." },
  { severity: "Warning", message: "Restarting passes an approval", fix: "You would be asked again on every retry. Move the retry target after the approval if that is not what you want." },
  { severity: "Warning", message: "Contract check never reads {{payload}}", fix: "Put {{payload}} where the command expects the file path, e.g. node validate.mjs {{payload}}." },
  { severity: "Warning", message: "Required keys on a non-JSON contract", fix: "Only JSON payloads have keys. Set the format to json, or clear the keys." },
  { severity: "Error", message: "Fan-out list is not a connected JSON step", fix: "foreach must name a step with an edge into this one (step.key), and that step must return JSON: give the edge a JSON contract or set output_format: json." },
  { severity: "Error", message: "Irreversible step fans out", fix: "One approval cannot cover any number of hard-to-undo runs. Remove foreach, or move the irreversible work to a step after it." },
  { severity: "Error", message: "{{item}} outside a fan-out step", fix: "{{item}} only exists in a step with foreach. Set foreach on the step, or remove the reference." },
  { severity: "Warning", message: "Fan-out without max_items", fix: "Set max_items so a long list stops and asks instead of starting hundreds of runs." },
  { severity: "Warning", message: "Fan-out runs can all edit files", fix: "Copies of the step run in parallel. Set max_parallel: 1, or limit its tools to reading." },
  { severity: "Error", message: "Step gets a file but cannot read it", fix: "Add Read to its tools, or set that input's handoff to inline." },
  { severity: "Warning", message: "Unknown spec version", fix: "The file says a spec: this studio does not know. It is read as the newest version, and saving writes skill-graph/1 or /2, whichever the graph needs." },
  { severity: "Error", message: "Probed step can change files or run shell commands", fix: "Candidates run side by side and would overwrite each other. Probe a step that only reads (a plan, a review, research), or limit its tools to Read, Grep, Glob and scoped Bash." },
  { severity: "Error", message: "Probed step also fans out", fix: "Every item would run once per candidate. Use one or the other." },
  { severity: "Warning", message: "Approach hints without probe, or more hints than candidates", fix: "Set probe:, or remove the hints that are never used." },
  { severity: "Error", message: "Node name used by the experience file", fix: "With learning on, experience and reflect are taken (EXPERIENCE.md and the reflect step). Rename the node." },
  { severity: "Warning", message: "Learning is on but nothing can fail", fix: "The skill learns only from failed checks, gates and commands. Add a check (e.g. npm test) or a gate." },
  { severity: "Warning", message: "Code step re-runs nothing", fix: "on_fail: retry on a code step re-runs the subagent steps before it. With none, it stops instead; set on_fail: stop or connect it after a subagent." },
];

const EXPORTS: { path: string; what: string }[] = [
  { path: ".claude/skills/<name>/SKILL.md", what: "The orchestrating skill: the plan your agent follows, stage by stage." },
  { path: ".claude/skills/<name>/graph.skill.md", what: "The editable graph source. Open it in Skill Graph again to change it." },
  { path: ".claude/agents/<name>-<node>.md", what: "One Claude Code subagent per model step, with its tools, model and prompt." },
  { path: ".cursor/rules/<name>.mdc", what: "The same skill as a Cursor rule." },
  { path: "README.md", what: "What is in the kit and how to install it." },
  { path: ".claude/agents/<name>-reflect.md", what: "With learning on: the step that updates the lessons file after each run." },
  { path: ".claude/agents/<name>-<node>-judge.md", what: "For each probed step: the judge that keeps the best candidate." },
  { path: ".skill-graph/.gitignore", what: "When the skill saves working files (file handoffs, contract checks, lessons): keeps them out of git, except the lessons file, which you commit." },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Drag the background", action: "Pan the canvas" },
  { keys: "Drag a card", action: "Move it; every card then keeps its place (saved in the file under layout:)" },
  { keys: "Arrow keys (card selected)", action: "Nudge the card (Shift moves five times as far)" },
  { keys: "Tidy layout button", action: "Put every card back in the automatic arrangement" },
  { keys: "Reset (toolbar)", action: "Tidy layout, reset the view (graph in view, editor shown, default panel sizes), or start over from the starting graph" },
  { keys: "Scroll / pinch", action: "Zoom around the pointer" },
  { keys: "Drag a node's handle onto another node", action: "Add an edge" },
  { keys: "Inspector → Inputs → Connect from…", action: "Add an edge from the keyboard" },
  { keys: "Click a node or edge", action: "Select it and open it in the Inspector" },
  { keys: "Delete / Backspace", action: "Remove the selected node or edge" },
  { keys: "Esc", action: "Clear the selection" },
  { keys: "Ctrl+Z", action: "Undo (canvas edits, blueprints and opened files)" },
  { keys: "Ctrl+Shift+Z or Ctrl+Y", action: "Redo" },
  { keys: "Arrow keys on a divider", action: "Resize the editor or the details panel" },
];

const TROUBLESHOOTING: { question: string; answer: React.ReactNode }[] = [
  {
    question: "The canvas is empty and the header shows a red message.",
    answer: <>The frontmatter could not be read. The file must start with <C>---</C>, contain valid YAML, and close with another <C>---</C>. The message names the YAML problem; indentation under <C>topology:</C> is the usual cause.</>,
  },
  {
    question: "I lost my view of the graph.",
    answer: <>Press the fit button (the frame icon, “Fit graph to view”) at the bottom left of the canvas. Loading a blueprint or opening a file also re-frames the graph.</>,
  },
  {
    question: "My cards are in a mess after moving them.",
    answer: <>Open <b>Reset</b> in the toolbar. <b>Tidy layout</b> puts every card back in the automatic arrangement (also the grid icon next to fit-to-view), <b>Reset view</b> brings the graph back into view and restores the panel sizes, and <b>Start over</b> loads the starting graph. Each one can be undone with {"Ctrl+Z"} on the canvas; Tidy and Reset view never change the graph itself.</>,
  },
  {
    question: "My agent never picks the skill.",
    answer: <>Agents choose skills by their <C>description</C>. Say what the skill does and when to use it, in the words a user would type.</>,
  },
  {
    question: "Can I run a graph skill without subagents?",
    answer: <>Yes. Use <b>Export → Single SKILL.md</b>: one file in which the agent plays every step itself, in order.</>,
  },
  {
    question: "Does this page call a model or need an API key?",
    answer: <>No. Skill Graph only checks and compiles your graph in the browser. Your own agent runs the exported files.</>,
  },
];

/* ------------------------------------------------------------------ building blocks */

function C({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[12.5px] text-zinc-800">{children}</code>;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4 border-t border-zinc-200 pt-10 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-zinc-600">{children}</p>;
}

function CodeBlock({ title, children }: { title: string; children: string }) {
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

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-2.5">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-600">
          {rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cellIndex === 0 ? "whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900" : "px-4 py-2.5 leading-relaxed"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border-l-2 border-orange-400 bg-orange-50/50 px-4 py-3 text-sm leading-relaxed text-zinc-700">{children}</p>;
}

const EDGE_EXAMPLE = `topology:
  edges:
    - from: goal
      to: splitter
    - from: splitter              # fan out: one edge to each worker
      to: [worker_a, worker_b]
      contract: subtask_json
    - from: [worker_a, worker_b]  # fan in: both feed the verifier
      to: verifier
      contract: findings_array
contracts:
  subtask_json:
    format: json
    description: One key per worker, holding that worker's task.
  findings_array:
    format: markdown
    description: Numbered findings, each with evidence and a confidence.`;

const PROMPT_EXAMPLE = `## @node: verifier
You audit findings without having seen how they were produced.

Findings to check:
{{workers.output}}

Keep a finding only if it cites concrete evidence. End with
GATE: PASS if every kept finding does, otherwise GATE: FAIL
and list what failed.`;

const SAFETY_EXAMPLE = `- id: implement
  type: worker
  tools: [Read, Edit, Write, Bash]
  check: npm test          # a program decides it passed
  on_fail: retry
  max_retries: 2
  risk: wide
- id: approve
  type: approval           # you sign off here
- id: publish
  type: agent
  tools: [Bash]
  risk: irreversible       # needs an approval upstream
  on_fail: stop`;

const FANOUT_EXAMPLE = `- id: review_file
  type: worker
  foreach: scope.files     # one run per path in scope's JSON
  max_parallel: 6          # at most 6 subagents at once
  max_items: 40            # more than 40 files: stop and ask
  isolated_context: true

## @node: review_file
Review this one file: {{item}}`;

/* ------------------------------------------------------------------ page */

export default function GraphGuidePage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/graph" className="flex min-w-0 items-center gap-3">
            <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
            <span className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph · Guide</span>
          </Link>
          <Link href="/graph" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Open the studio
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">On this page</p>
            {TOC.map((item) => (
              <div key={item.id}>
                {item.group && <p className="mb-1 mt-4 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-700">{item.group}</p>}
                <a href={`#${item.id}`} className="block rounded-md px-2 py-1 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                  {item.title}
                </a>
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 max-w-3xl space-y-10">
          <div className="space-y-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Link href="/" className="hover:text-zinc-900">DevScratchpad</Link>
              <span aria-hidden>/</span>
              <Link href="/graph" className="hover:text-zinc-900">Skill Graph</Link>
              <span aria-hidden>/</span>
              <span className="font-semibold text-orange-700">Guide</span>
            </nav>
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:text-4xl">How to build a multi-agent skill with Skill Graph</h1>
            <P>
              This guide takes you from an empty page to a skill your agent can run. The first half is all most people need: steps, connections and prompts, built on the canvas.
              The <a href="#advanced" className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">advanced half</a> covers
              contracts, references, gates and the file format, for when you want more control. No prior experience with subagents is needed.
            </P>
          </div>

          <Section id="what" title="What Skill Graph does">
            <P>
              A normal <C>SKILL.md</C> is one block of instructions, and the agent improvises how to divide the work. A <b>graph skill</b> writes that down: the steps (nodes), what
              each step hands the next (edges with named contracts), which steps start with a fresh context, what tools and model each step gets, and when work passes or fails.
            </P>
            <P>
              Skill Graph is the editor for that file. It shows the file as a graph, checks it, lets you step through the plan, and compiles it into an orchestrating skill plus one
              subagent per step. It never runs a model itself; your agent does that with the files you export.
            </P>
            <Note>
              Rather describe it in words? <Link href="/graph/connector" className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">Add Skill Graph to Claude</Link> as a
              connector, tell Claude about your project, and it designs and checks the graph for you, then hands you a studio link and the files.
            </Note>
          </Section>

          <Section id="what-you-need" title="What you need (and what you don't)">
            <P>
              You never have to write YAML. Everything below is done with the mouse on the canvas and in the Inspector, and the studio writes the <C>SKILL.md</C> for you. The editor
              on the left is there if you prefer typing.
            </P>
            <Table head={["Part", "Needed?", "Where"]} rows={NEEDS.map((item) => [item.part, <span key={item.part} className={item.needed ? "font-semibold text-zinc-900" : "text-zinc-500"}>{item.needed ? "Yes" : "Optional"}</span>, item.where])} />
            <Note>
              A step does not need references to get its input: everything on its incoming edges reaches it on its own. Contracts, references, gates, models and tools are refinements;
              the defaults work without them.
            </Note>
          </Section>

          <Section id="quick-start" title="Quick start">
            <ol className="space-y-3.5">
              {QUICK_START.map((step, index) => (
                <li key={step.title} className="flex gap-3.5 text-[15px] leading-relaxed text-zinc-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 font-mono text-xs font-bold text-orange-800">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">
                    <b className="text-zinc-900">{step.title}.</b> {step.body}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="workspace" title="The workspace">
            <P>The studio has four areas. Everything you do in one updates the others immediately.</P>
            <Table
              head={["Area", "What it is for"]}
              rows={[
                ["Toolbar", <>Walk through plan, the validity status (click it to see issues), <b>+ Node</b>, <b>Share</b> and <b>Export</b>.</>],
                ["Editor (left)", <>The <C>SKILL.md</C> source. This file is the single source of truth: the canvas is drawn from it, and canvas edits are written back into it. <b>Blueprints</b>, open file and hide editor sit at its top.</>],
                ["Canvas (middle)", <>The graph, laid out in stages from left to right (top to bottom when the canvas is taller than wide). Drag a card to put it where you want; the place is saved. Zoom controls, undo/redo, fit-to-view and <b>Tidy layout</b> are at its bottom left.</>],
                ["Panel (right)", <><b>Inspector</b> edits the selected step or edge, or the skill itself when nothing is selected. Its settings come in sections (Prompt, Agent, Checks, Fan-out, Probe, Inputs, What it receives) that fold away and show what is set on their right, so open only the one you need. <b>Agent plan</b> shows the stages the agent runs: one card per step with what it reads, what it returns, and what is set on it (tools, fresh context, checks, gates, fan-out, probing); click a card to edit the step. <b>Issues</b> lists errors and warnings. Drag the line on its left to make it wider.</>],
              ]}
            />
            <P>Drag the dividers between areas to resize them. On a phone, switch between editor, canvas and details with the tabs above the workspace.</P>
          </Section>

          <Section id="nodes" title="Node types">
            <P>Each node has a type that decides its role in the plan. Steps of the same stage (no path between them) run in parallel.</P>
            <Table head={["Type", "What it does", "Own subagent"]} rows={NODE_TYPE_DOCS.map((node) => [<C key={node.type}>{node.type}</C>, node.does, node.subagent])} />
            <P>
              On the canvas you set a step&apos;s label, type and prompt; everything else is under <b>Advanced</b>. The full list of fields, with the names used in the file, is in{" "}
              <a href="#file-format" className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">The file format</a>.
            </P>
          </Section>

          <Section id="walkthrough" title="Walking through the plan">
            <P>
              <b>Walk through plan</b> plays the stages one at a time: the canvas highlights the steps of the current stage and the <b>Agent plan</b> tab follows along, showing what
              each step receives, which model and tools it gets, and what it returns. Use the arrows to step back and forth, pause to look closer, and the cross to leave.
            </P>
            <P>
              The Agent plan tab also shows the load budget: how many tokens the agent reads when the skill triggers (just the plan) compared with one flat file holding every prompt.
            </P>
          </Section>

          <Section id="export" title="Export and install">
            <P>
              <b>Export → Claude Code + Cursor kit (.zip)</b> gives you everything below. Unzip it at the root of your repository and commit it; Claude Code and Cursor pick the files up from there.
            </P>
            <Table head={["File", "What it is"]} rows={EXPORTS.map((item) => [<C key={item.path}>{item.path}</C>, item.what])} />
            <P>
              <b>Single SKILL.md</b> is one self-orchestrating file for agents without subagents; <b>Copy single SKILL.md</b> puts it on your clipboard. <b>Graph source (.md)</b> downloads
              only the editable file. Exporting is blocked while the graph has errors.
            </P>
            <P>
              To use it, ask your agent for the task the description names (or invoke the skill by name). It loads the plan, starts the subagents stage by stage and returns the last
              step&apos;s output.
            </P>
          </Section>

          <div id="advanced" className="scroll-mt-20 rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Advanced</p>
            <p className="mt-1 text-[15px] leading-relaxed text-zinc-700">
              Everything from here on is optional. Reach for it when a handoff must have a fixed shape, a step should see only part of an output, or work must pass a test before
              the run goes on.
            </p>
          </div>

          <Section id="edges" title="Contracts">
            <P>
              A <b>contract</b> names what must travel on an edge, for example <C>tasks_json</C> or <C>findings</C>, so the agent can check each handoff before the next stage starts.
              Edges work without one; add it where a wrong shape would derail the next step, such as a planner that must return JSON.
            </P>
            <P>
              To add one, click an edge and type a name in <b>Contract</b>. It is defined for you as you type: as JSON when the name contains &ldquo;json&rdquo;, otherwise as
              Markdown. Below the name you can change its format and describe what a valid payload looks like. All of a skill&apos;s contracts are also listed in the Inspector when
              nothing is selected.
            </P>
            <P>
              A description is checked by the agent reading it. To have a program check a payload instead, give a JSON contract its <b>required keys</b> (
              <C>required: [files, steps]</C>), or give any contract a <b>check command</b> with <C>{"{{payload}}"}</C> where the file path goes (
              <C>{"check: node validate.mjs {{payload}}"}</C>). The agent saves the payload to a file, runs the command, and re-runs the step once if it fails. Required keys need
              Node.js on the machine that runs the skill.
            </P>
          </Section>

          <Section id="prompts" title="References">
            <P>
              A step already receives everything on its incoming edges. A <b>reference</b> says where in the prompt an input belongs, or picks only part of it. The easy way:{" "}
              <b>Insert input</b> above the prompt lists exactly what this step can read, in plain words, and writes the reference at the cursor.
            </P>
            <Table head={["Reference", "Means"]} rows={REFERENCE_DOCS.map((item) => [<C key={item.ref}>{item.ref}</C>, item.meaning])} />
            <CodeBlock title="a node prompt">{PROMPT_EXAMPLE}</CodeBlock>
            <P>
              The most useful one is a step&apos;s own part of a JSON output. If a planner returns <C>{'{"research": …, "review": …}'}</C>, inserting &ldquo;Only this step&apos;s
              part&rdquo; into the Research step gives it just its own task instead of the whole plan.
            </P>
            <Note>A reference may only read from nodes that run before this one. If the checker says a reference is not upstream, add an edge from that node (directly or through others).</Note>
          </Section>

          <Section id="fresh-context" title="Fresh context">
            <P>
              Tick <b>Fresh context</b> (in the Inspector&apos;s <b>Agent</b> section; <C>isolated_context: true</C> in the file) on a step that must judge work without being swayed by how it was produced, typically a verifier or reviewer. Its subagent starts with
              an empty context and receives only what its incoming edges carry.
            </P>
            <P>
              On the canvas such a step wears a <b>prior-context bias</b> badge: the share of what its prompt reads that does not come through its own edges. <b>0%</b> is what you want.
              Anything higher is flagged as a warning, naming the reference that leaks in, so you can remove it or add the missing edge.
            </P>
          </Section>

          <Section id="safety" title="Gates, checks and approvals">
            <P>Three tools decide whether work passes, from strongest to softest. Checks and gates are in the Inspector&apos;s <b>Checks</b> section; an approval is its own node type.</P>
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
              <li>
                <b className="text-zinc-900">check</b>: a command such as <C>npm test</C> that must exit 0. A program, not a model, decides.
              </li>
              <li>
                <b className="text-zinc-900">gate</b>: written pass criteria. The step ends with <C>GATE: PASS</C> or <C>GATE: FAIL</C>; with <C>on_fail: retry</C> only the failed work
                is re-run, with the reason, up to <C>max_retries</C> times. The gate can name any step before it, so a bad change goes back to the step that wrote it, and the
                steps between that step and the gate (a diff, the reviews) run again before the gate does. Set <b>Restart at</b> (<C>retry_target</C>) to say where a failed loop
                starts again: the gate may then only name that step and the ones after it, and re-runs that step when its verdict names none.
              </li>
              <li>
                <b className="text-zinc-900">approval</b>: a node that stops and asks you before going on.
              </li>
            </ul>
            <P>
              Mark how much a step can break with <C>risk</C>. <C>wide</C> steps (touching many files) should have a check. <C>irreversible</C> steps (publishing, migrations,
              deletions, payments) need an approval upstream and <C>on_fail: stop</C>. A missing approval before an irreversible step is an error that blocks export; the other
              gaps are warnings. A gate without <C>on_fail</C> stops and reports; set <C>on_fail: retry</C> to re-run the failed work.
            </P>
            <CodeBlock title="a guarded change">{SAFETY_EXAMPLE}</CodeBlock>
          </Section>

          <Section id="fan-out" title="Fan-out: one run per item">
            <P>
              Some work only knows its size at run time: the files a change touches, the failing tests, the packages in a monorepo. A <b>fan-out</b> step runs once per item of a
              list an earlier step returns, each run in its own subagent. Set it in the Inspector&apos;s <b>Fan-out</b> section (<C>foreach</C> in the file), or start from the{" "}
              <b>Review each file</b> blueprint.
            </P>
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
              <li>
                <b className="text-zinc-900">The list</b> is a JSON array from a step connected to it: <C>scope.files</C> is the <C>files</C> key of <C>scope</C>&apos;s JSON. Each
                run reads its own item as <C>{"{{item}}"}</C> (in <b>Insert input</b>) and never sees the others.
              </li>
              <li>
                <b className="text-zinc-900">The output</b> is a JSON array of the runs&apos; results, in item order, so the next step gets everything in one place.
              </li>
              <li>
                <b className="text-zinc-900">Limits:</b> <C>max_parallel</C> runs at once (default 4, at most 16) and <C>max_items</C> stops the run and asks you before a long list
                starts that many subagents. A run whose check or gate fails is retried on its own.
              </li>
            </ul>
            <CodeBlock title="one review per changed file">{FANOUT_EXAMPLE}</CodeBlock>
            <Note>Fan-out steps that can edit files run side by side and may overwrite each other; the checker warns unless max_parallel is 1. An irreversible step cannot fan out.</Note>
          </Section>

          <Section id="file-handoffs" title="File handoffs">
            <P>
              By default the agent pastes each output into the next step&apos;s task. For long outputs (a big diff, many reviews) that costs tokens every time it is handed on, and a
              long paste can come out shortened. Set <b>Hand outputs on → as files</b> in the Inspector with nothing selected (<C>handoff: file</C>), and the agent saves each output
              once to <C>.skill-graph/&lt;name&gt;/&lt;step&gt;.md</C> (or <C>.json</C>) and hands later steps only the path.
            </P>
            <P>
              A step can override the skill&apos;s choice with <b>Hand on output</b> in its <b>Agent</b> section. Steps that get a file need the Read tool; the checker says so if one cannot
              read it. Approvals still show you the content, and the last step&apos;s answer comes back to you as usual. Cards that hand on by file show a small file icon.
            </P>
          </Section>

          <Section id="probing" title="Probing: try several, keep the best">
            <P>
              For a step whose answer decides a lot, such as the plan before an implementation, open the Inspector&apos;s <b>Probe</b> section (<C>probe: 3</C>). The agent runs that many{" "}
              <b>candidates</b> of the step at once, each with its own approach, then a fresh-context <b>judge</b> picks the best one or combines two that fit together.
            </P>
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
              <li>
                <b className="text-zinc-900">Approaches:</b> one per line under the candidates (<C>probe_hints</C>), for example &ldquo;The smallest change that works.&rdquo; A
                candidate without one uses its own best approach.
              </li>
              <li>
                <b className="text-zinc-900">Checks first:</b> the step&apos;s contract checks run on every candidate and drop the broken ones before the judge sees them. The judge
                then checks claims against the repository, says which candidate it chose and why, and returns the final answer.
              </li>
              <li>
                <b className="text-zinc-900">Cost:</b> about one run per candidate plus the judge, so a probe of 3 costs roughly four runs of that step. Use it where a better
                answer saves work later.
              </li>
            </ul>
            <Note>
              Only steps that read can be probed. Candidates of a step that edits files or runs unrestricted shell commands would overwrite each other in your checkout, and a
              separate git worktree per candidate starts without your uncommitted changes or installed packages. Probe the plan, not the implementation.
            </Note>
          </Section>

          <Section id="learning" title="Learning from runs">
            <P>
              Tick <b>Learn from runs</b> in the Inspector (with nothing selected; <C>experience:</C> in the file) and the skill keeps lessons between runs. Before the first stage,
              the agent reads <C>.skill-graph/&lt;name&gt;/EXPERIENCE.md</C> and hands each step only its own lessons. After the last stage, a small reflect step updates the file.
            </P>
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
              <li>
                <b className="text-zinc-900">Only hard evidence.</b> A lesson is written only from a failed check or command, a <C>GATE: FAIL</C> line or a retry, and quotes it. A
                run where nothing failed adds nothing.
              </li>
              <li>
                <b className="text-zinc-900">It stays short.</b> Each lesson counts how often a step got it and how often that step then passed. A lesson used 5 times that never
                helped is removed, and the file holds at most <C>max_lessons</C> (20 by default).
              </li>
              <li>
                <b className="text-zinc-900">Lessons are advice.</b> They cannot add tools, widen a step&apos;s scope or skip an approval.
              </li>
            </ul>
            <P>
              Commit <C>EXPERIENCE.md</C> so your team shares the lessons; the <C>.skill-graph/.gitignore</C> in the kit keeps it and ignores the payload files beside it. To make a
              lesson permanent, paste the file under <b>Learning</b> and press <b>Bake in</b>: the rule is added to that step&apos;s prompt and removed from the file. Download the
              trimmed file and replace the one in your repository. The file is read in your browser and never uploaded.
            </P>
          </Section>

          <Section id="models" title="Models and tools">
            <P>
              Both are in the Inspector&apos;s <b>Agent</b> section. <C>model</C> picks which model runs a step. The menu offers Claude Code&apos;s aliases: <C>haiku</C> (fast and cheap, good for focused workers), <C>sonnet</C>{" "}
              (balanced), <C>opus</C> and <C>fable</C> (strongest, good for planners and verifiers). <b>inherit</b> leaves the field out, so the step runs on whatever model your
              Claude Code session uses. You can also type a full model id in the source.
            </P>
            <P>
              The menu lists Claude models because the export writes Claude Code subagent files, whose <C>model</C> field only accepts Claude models. The Cursor rule and the single
              SKILL.md work with any agent and model.
            </P>
            <P>
              <C>tools</C> follows least privilege: give a step only what it needs. Readers and reviewers usually need <C>[Read, Grep, Glob]</C>; only implementers need{" "}
              <C>Edit</C>, <C>Write</C> or <C>Bash</C>. MCP tools are written <C>mcp__server__tool</C>. Scoped tools such as <C>Bash(npm test:*)</C> and MCP tools are added with
              the field under the tool chips (Agent section); click one of their chips to remove it.
            </P>
          </Section>

          <Section id="file-format" title="The file format">
            <P>
              For people who prefer the editor: a graph skill is a normal <C>SKILL.md</C>. The frontmatter holds <C>name</C>, <C>description</C>, <C>spec</C>, a{" "}
              <C>topology</C> (nodes and edges) and <C>contracts</C>, and optionally <C>handoff</C> and <C>experience</C>. The body holds one <C>## @node: id</C> section per step
              with its prompt. <C>spec</C> is <C>skill-graph/1</C>, or <C>skill-graph/2</C> once a step uses <C>foreach</C> or <C>handoff</C> (<C>probe</C> stays <C>/1</C>); the studio writes the right one
              when it saves. Every field of a node:
            </P>
            <Table head={["Field", "Meaning"]} rows={NODE_FIELD_DOCS.map((item) => [<C key={item.field}>{item.field}</C>, item.meaning])} />
            <CodeBlock title="edges and contracts">{EDGE_EXAMPLE}</CodeBlock>
            <P>
              <C>from</C> and <C>to</C> accept a single id or a list, so one entry can fan out to several workers or fan several in. Each contract has a format (<C>json</C>,{" "}
              <C>markdown</C> or <C>text</C>) and a one-line description.
            </P>
          </Section>

          <Section id="issues" title="Errors and warnings">
            <P>
              The checker runs on every keystroke. <b>Errors</b> mean the agent could not follow the plan and block exporting. <b>Warnings</b> point at plans that run but are
              likely to go wrong. Click an issue to select its node.
            </P>
            <Table
              head={["Kind", "Message (short)", "How to fix it"]}
              rows={ISSUES.map((issue) => [
                <span key={issue.message} className={issue.severity === "Error" ? "text-rose-700" : "text-amber-700"}>
                  {issue.severity}
                </span>,
                issue.message,
                issue.fix,
              ])}
            />
          </Section>


          <Section id="sharing" title="Saving, sharing and privacy">
            <P>
              Your graph is saved automatically in this browser and comes back when you return. Nothing is uploaded: parsing, checking and compiling all happen on your device.
            </P>
            <P>
              <b>Share</b> copies a link with the whole graph compressed into the part after <C>#</C>, which browsers never send to a server. Very large graphs make long links; the
              studio warns you when a link may be too long for some apps.
            </P>
            <Note>
              Treat a graph from someone else like code from someone else. A graph opened from a link shows a yellow banner listing its commands, shell access, file edits, MCP tools and the steps with no tool limit (which may use every tool);
              read them before you export, because your agent will run those commands with those permissions in your repository. Opening a link replaces your saved graph,
              and Ctrl+Z on the canvas brings it back.
            </Note>
          </Section>

          <Section id="shortcuts" title="Keyboard and canvas">
            <Table head={["Do this", "To"]} rows={SHORTCUTS.map((item) => [item.keys, item.action])} />
          </Section>

          <Section id="troubleshooting" title="Troubleshooting">
            <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {TROUBLESHOOTING.map((item) => (
                <div key={item.question} className="p-5">
                  <dt className="text-[15px] font-bold text-zinc-900">{item.question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Link href="/graph" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700">
            Open Skill Graph and start from a blueprint <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
      </div>
    </div>
  );
}
