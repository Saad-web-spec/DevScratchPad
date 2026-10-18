import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";

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
  { part: "Model, tools, gates, checks, risk", needed: false, where: <>Inspector → Advanced</> },
];

const QUICK_START: { title: string; body: React.ReactNode }[] = [
  { title: "Pick a blueprint", body: <>Open <b>Blueprints</b> above the editor and choose the closest match, for example <b>PR review</b> or <b>Ship a change</b>. Blank graph gives you three nodes to start from.</> },
  { title: "Name it", body: <>Click an empty spot on the canvas, then fill in <b>Skill name</b> and <b>When to use it</b> in the Inspector. The description is what makes your agent pick the skill, so say when to use it: &ldquo;Use when reviewing a pull request&hellip;&rdquo;.</> },
  { title: "Shape the steps", body: <>Add nodes with <b>+ Node</b> and connect them by dragging a node&apos;s right-hand handle onto another node. A connection means &ldquo;this step needs that one&apos;s output&rdquo;.</> },
  { title: "Say what each step does", body: <>Select a step and write its job in <b>Prompt</b>; every new step starts with a sensible one. Its inputs arrive on their own. To place one at a precise spot, use <b>Insert input</b> above the prompt.</> },
  { title: "Fix what the checker finds", body: <>The status next to the toolbar turns red when there are errors. Open <b>Issues</b>, click an issue to jump to its node, and fix it until it says <b>Valid</b>.</> },
  { title: "Walk through it, then export", body: <>Press <b>Walk through plan</b> to see the stages in order, then <b>Export</b> the kit and unzip it into your repository.</> },
];

const NODE_TYPES: { type: string; does: string; subagent: string }[] = [
  { type: "input", does: "Carries the user's goal into the graph. Every graph needs one, and it cannot have incoming edges.", subagent: "No" },
  { type: "orchestrator", does: "Plans and splits the work. Often returns JSON with one key per downstream worker.", subagent: "Yes" },
  { type: "worker", does: "Does one focused task. Workers in the same stage run in parallel.", subagent: "Yes" },
  { type: "verifier", does: "Checks the work, usually in a fresh context, and ends with GATE: PASS or GATE: FAIL when it has a gate.", subagent: "Yes" },
  { type: "synthesizer", does: "Merges verified results into the final answer.", subagent: "Yes" },
  { type: "agent", does: "A general step when none of the roles above fits.", subagent: "Yes" },
  { type: "code", does: "Runs a shell command instead of a model (tests, a diff, a merge script). Needs run:.", subagent: "No, the agent runs the command" },
  { type: "approval", does: "Stops and asks you before anything after it runs. Put it right before work that is hard to undo.", subagent: "No, the agent asks you" },
];

const NODE_FIELDS: { field: string; meaning: string }[] = [
  { field: "id", meaning: "Unique name. Starts with a letter; letters, digits, _ and - only. Used in references and in the agent file names." },
  { field: "type", meaning: "One of the eight node types above. Unknown types become agent." },
  { field: "label", meaning: "The title shown on the canvas and in the plan." },
  { field: "model", meaning: "haiku, sonnet, opus, fable or a full model id. Leave it out to inherit your session's model." },
  { field: "tools", meaning: "The tools this step's subagent may use, e.g. [Read, Grep, Glob]. Leave it out for the agent's defaults." },
  { field: "isolated_context", meaning: "true seals the step off: it sees only what its incoming edges carry." },
  { field: "output_format", meaning: "json or text. Normally inferred from the contracts on the outgoing edges." },
  { field: "gate", meaning: "Pass criteria. The step must end its answer with GATE: PASS or GATE: FAIL." },
  { field: "on_fail", meaning: "retry re-runs the failed upstream work with the reason; stop halts and reports." },
  { field: "max_retries", meaning: "How many re-runs a failed gate or check gets (default 1; more than 3 is flagged)." },
  { field: "check", meaning: "A command that must exit 0 when the step is done, e.g. npm test." },
  { field: "run", meaning: "code nodes only: the command to run." },
  { field: "risk", meaning: "contained (default), wide or irreversible. Decides which safeguards the checker asks for." },
];

const REFERENCES: { ref: string; meaning: string }[] = [
  { ref: "{{goal}}", meaning: "The user's request, as it entered the input node." },
  { ref: "{{plan.output}}", meaning: "Everything the node with id plan returned." },
  { ref: "{{splitter.worker_research}}", meaning: "One key of a JSON output: here the worker_research value of splitter's JSON." },
  { ref: "{{workers.output}}", meaning: "A group: the outputs of the nodes of that type that feed this step (workers, verifiers, codes and so on), or the ones upstream of it when none connect directly." },
  { ref: "{{inputs}}", meaning: "Everything arriving on this node's incoming edges." },
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
  { severity: "Warning", message: "Code step re-runs nothing", fix: "on_fail: retry on a code step re-runs the subagent steps before it. With none, it stops instead; set on_fail: stop or connect it after a subagent." },
];

const EXPORTS: { path: string; what: string }[] = [
  { path: ".claude/skills/<name>/SKILL.md", what: "The orchestrating skill: the plan your agent follows, stage by stage." },
  { path: ".claude/skills/<name>/graph.skill.md", what: "The editable graph source. Open it in Skill Graph again to change it." },
  { path: ".claude/agents/<name>-<node>.md", what: "One Claude Code subagent per model step, with its tools, model and prompt." },
  { path: ".cursor/rules/<name>.mdc", what: "The same skill as a Cursor rule." },
  { path: "README.md", what: "What is in the kit and how to install it." },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Drag the background", action: "Pan the canvas" },
  { keys: "Scroll / pinch", action: "Zoom around the pointer" },
  { keys: "Drag a node's handle onto another node", action: "Add an edge" },
  { keys: "Advanced → Incoming → Connect from…", action: "Add an edge from the keyboard" },
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
                ["Canvas (right)", <>The graph, laid out in stages from left to right (top to bottom on narrow screens). Zoom controls, undo/redo and fit-to-view are at its bottom left.</>],
                ["Details (bottom)", <><b>Inspector</b> edits the selected node or edge (or the skill itself when nothing is selected); the settings most graphs never need sit under its collapsed <b>Advanced</b> panel. <b>Agent plan</b> shows what the agent will do and how much it loads. <b>Issues</b> lists errors and warnings.</>],
              ]}
            />
            <P>Drag the dividers between areas to resize them. On a phone, switch between editor, canvas and details with the tabs above the workspace.</P>
          </Section>

          <Section id="nodes" title="Node types">
            <P>Each node has a type that decides its role in the plan. Steps of the same stage (no path between them) run in parallel.</P>
            <Table head={["Type", "What it does", "Own subagent"]} rows={NODE_TYPES.map((node) => [<C key={node.type}>{node.type}</C>, node.does, node.subagent])} />
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
          </Section>

          <Section id="prompts" title="References">
            <P>
              A step already receives everything on its incoming edges. A <b>reference</b> says where in the prompt an input belongs, or picks only part of it. The easy way:{" "}
              <b>Insert input</b> above the prompt lists exactly what this step can read, in plain words, and writes the reference at the cursor.
            </P>
            <Table head={["Reference", "Means"]} rows={REFERENCES.map((item) => [<C key={item.ref}>{item.ref}</C>, item.meaning])} />
            <CodeBlock title="a node prompt">{PROMPT_EXAMPLE}</CodeBlock>
            <P>
              The most useful one is a step&apos;s own part of a JSON output. If a planner returns <C>{'{"research": …, "review": …}'}</C>, inserting &ldquo;Only this step&apos;s
              part&rdquo; into the Research step gives it just its own task instead of the whole plan.
            </P>
            <Note>A reference may only read from nodes that run before this one. If the checker says a reference is not upstream, add an edge from that node (directly or through others).</Note>
          </Section>

          <Section id="fresh-context" title="Fresh context">
            <P>
              Tick <b>Fresh context</b> (under <b>Advanced → Agent</b>; <C>isolated_context: true</C> in the file) on a step that must judge work without being swayed by how it was produced, typically a verifier or reviewer. Its subagent starts with
              an empty context and receives only what its incoming edges carry.
            </P>
            <P>
              On the canvas such a step wears a <b>prior-context bias</b> badge: the share of what its prompt reads that does not come through its own edges. <b>0%</b> is what you want.
              Anything higher is flagged as a warning, naming the reference that leaks in, so you can remove it or add the missing edge.
            </P>
          </Section>

          <Section id="safety" title="Gates, checks and approvals">
            <P>Three tools decide whether work passes, from strongest to softest. Checks and gates are under <b>Advanced → Checks</b>; an approval is its own node type.</P>
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
              <li>
                <b className="text-zinc-900">check</b>: a command such as <C>npm test</C> that must exit 0. A program, not a model, decides.
              </li>
              <li>
                <b className="text-zinc-900">gate</b>: written pass criteria. The step ends with <C>GATE: PASS</C> or <C>GATE: FAIL</C>; with <C>on_fail: retry</C> only the failed work
                is re-run, with the reason, up to <C>max_retries</C> times. The gate can name any step before it, so a bad change goes back to the step that wrote it, and the
                steps between that step and the gate (a diff, the reviews) run again before the gate does.
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

          <Section id="models" title="Models and tools">
            <P>
              Both live under <b>Advanced → Agent</b>. <C>model</C> picks which model runs a step. The menu offers Claude Code&apos;s aliases: <C>haiku</C> (fast and cheap, good for focused workers), <C>sonnet</C>{" "}
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
              the field under the tool chips (Advanced → Agent); click one of their chips to remove it.
            </P>
          </Section>

          <Section id="file-format" title="The file format">
            <P>
              For people who prefer the editor: a graph skill is a normal <C>SKILL.md</C>. The frontmatter holds <C>name</C>, <C>description</C>, <C>spec: skill-graph/1</C>, a{" "}
              <C>topology</C> (nodes and edges) and <C>contracts</C>. The body holds one <C>## @node: id</C> section per step with its prompt. Every field of a node:
            </P>
            <Table head={["Field", "Meaning"]} rows={NODE_FIELDS.map((item) => [<C key={item.field}>{item.field}</C>, item.meaning])} />
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
