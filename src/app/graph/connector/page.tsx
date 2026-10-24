import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";
import { CopyField } from "../components/CopyField";
import { MAX_SOURCE_LENGTH, MAX_NODES } from "../lib/graphSkill";
import { SHARE_URL_SOFT_LIMIT } from "../lib/graphShare";
import { BLUEPRINTS } from "../lib/graphTemplates";

const PAGE_URL = "https://www.devscratchpad.tech/graph/connector";
const CONNECTOR_URL = "https://www.devscratchpad.tech/graph/mcp";
const CLAUDE_CODE_COMMAND = `claude mcp add --transport http skill-graph ${CONNECTOR_URL}`;
const SUPPORT_EMAIL = "support@devscratchpad.tech";

export const metadata: Metadata = {
  title: "Skill Graph for Claude: Connector Setup and Guide",
  description:
    "Add Skill Graph to Claude as a connector. Describe your project, and Claude designs a multi-agent workflow, checks it and hands you a studio link and Claude Code files. No account, no API key.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Skill Graph for Claude: Connector Setup and Guide | DevScratchpad",
    description: "Describe your project in Claude; Claude designs the multi-agent workflow with Skill Graph, checks it and gives you the files to install.",
    url: PAGE_URL,
    siteName: "DevScratchpad",
    locale: "en_US",
    type: "article",
  },
};

const TOOLS: { name: string; does: string }[] = [
  {
    name: "run_graph",
    does: "Runs a workflow on your request with every step checked, in one or two calls: Claude does the steps, the checks run on every answer, and a step that fails is sent back with the reason. You see the progress as it goes, and get the final answer.",
  },
  { name: "save_workflow", does: "Names a workflow (\"Weekly report checker\") and gives you its link, a prompt that runs it again in any chat, and a line for a Claude Project's instructions." },
  { name: "get_graph_format", does: "Reads the graph skill format: node types, fields, contracts, references, the checker's rules and a full example." },
  { name: "list_graph_templates", does: `Lists the starter graphs (${BLUEPRINTS.map((blueprint) => blueprint.title).join(", ")}).` },
  { name: "get_graph_template", does: "Gets one starter graph's source, to build on." },
  { name: "draft_graph", does: "Writes a graph from a plain outline of the steps (what each does and what it reads, plus checks, loops, retries, fan-out, probing, file handoffs and learning), so Claude does not have to write the format by hand. Lists each step's tools and what it will receive; supports compact: true to omit the full source while iterating." },
  { name: "edit_graph", does: "Changes a graph by operations (set a step's fields, add or remove a step, connect two steps, define a contract) instead of rewriting the file; accepts either graph.skill.md text or a studio link as source, and supports compact: true." },
  { name: "validate_graph", does: "Checks a graph: errors, warnings with how to fix them (weak prompts, gates a checker could not decide from the step's inputs, read by a small model on the server, and steps that never get the work a verifier checked included), and the stages that will run." },
  { name: "dry_run_graph", does: "Walks the plan with a sample request, without running a model: each step's prompt with its inputs filled in, what it returns and is checked by, and where a problem would hit." },
  { name: "compile_graph", does: "Turns a valid graph into files: the Claude Code kit (orchestrating SKILL.md plus one subagent per step), a single SKILL.md, or a Cursor rule." },
  { name: "open_graph_in_studio", does: "Makes a link that opens the graph in the studio, to see it, walk through the plan, edit and export it." },
  { name: "read_studio_link", does: "Turns a studio link back into the graph's source, so you can pick a graph up again in a later chat. The link is the saved copy; nothing is stored." },
  { name: "start_run", does: "Starts a refereed run of a graph on your request: the first tasks, each with its instructions and where its inputs are, and a run object that carries the state." },
  { name: "advance_run", does: "Takes each step's answer and checks it in code (contract keys, gate verdicts, loop markers, exit codes), counts retries and loop passes, and says what runs next, until the run is done or stopped." },
  { name: "review_lessons", does: "Reads a skill's EXPERIENCE.md against its graph: each lesson, how often it helped, and which ones the next run will drop." },
  { name: "bake_lessons", does: "Makes chosen lessons permanent: their rules go into their steps' prompts, and you get the trimmed EXPERIENCE.md back." },
];

const EVERYDAY_PROMPTS: string[] = [
  "Use Skill Graph to research and fact-check this: is intermittent fasting better than calorie counting for weight loss?",
  "Review my essay against this rubric with Skill Graph. (Paste the essay and the rubric.)",
  "Compare 3 robot vacuums under $400 for a home with pets, with Skill Graph.",
  "Plan 4 days in Lisbon in May for two, 1,500 euros without flights, and check the budget with Skill Graph. Then save it as \"Trip planner\".",
];

const PROMPTS: string[] = [
  "Design a workflow with Skill Graph for reviewing pull requests in my repo: security, performance and test coverage in parallel, then a fresh-context check before it comments.",
  "I'm starting a Next.js app with Stripe billing. Plan a Skill Graph workflow that implements a feature, runs npm test until it passes, and asks me before it opens the PR.",
  "Use Skill Graph to build a bug triage workflow: read the stack trace, check recent commits and logs in parallel, then write a minimal repro. Give me the studio link.",
  "Take the Ship a change starter graph, change the test command to pnpm test, check it, and compile it into Claude Code files.",
  "Design a Skill Graph workflow for a receipt scanning app: extract the fields in parallel, check the totals add up, then write the expense entry. Dry-run it with a sample receipt.",
  "Run the Ship a change starter graph on this request with the Skill Graph referee: add a --verbose flag to the CLI. Loop the implement step until npm test passes.",
  "Here is my EXPERIENCE.md from the review-each-file skill. Which lessons helped? Bake the ones that did into the graph.",
];

function C({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[12.5px] text-zinc-800">{children}</code>;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4 border-t border-zinc-200 pt-10">
      <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-zinc-600">{children}</p>;
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3.5 text-[15px] leading-relaxed text-zinc-600">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 font-mono text-xs font-bold text-orange-800">{index + 1}</span>
          <span className="min-w-0 pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

const LINK = "font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700";

export default function GraphConnectorPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/graph" className="flex min-w-0 items-center gap-3">
            <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
            <span className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph · Claude</span>
          </Link>
          <Link href="/graph/studio" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Open the studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Connector for Claude</p>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:text-4xl">Use Skill Graph from Claude</h1>
          <P>
            Describe your project in Claude. Claude designs the multi-agent workflow with Skill Graph, checks it until it has no errors, and gives you a link that opens it in the
            studio, plus the files your agent runs. You need no account and no API key: Claude does the thinking on your own plan, and Skill Graph checks and compiles.
          </P>
          <div className="space-y-2 pt-2">
            <p className="text-[13px] font-semibold text-zinc-900">Connector URL</p>
            <CopyField value={CONNECTOR_URL} label="the connector URL" />
          </div>
        </div>

        <Section id="claude" title="Add it in Claude (web, desktop and mobile)">
          <Steps
            items={[
              <>
                Open{" "}
                <a href="https://claude.ai/customize/connectors" target="_blank" rel="noopener noreferrer" className={LINK}>
                  Customize → Connectors
                </a>{" "}
                in Claude and choose <b>Add custom connector</b>.
              </>,
              <>
                Name it <b>Skill Graph</b>, paste the connector URL above, leave Authentication on <b>No sign-in</b> (Claude detects it) and press <b>Add</b>.
                Claude then notes that anyone with the URL can use the connector. That is expected and safe here: every tool only reads what Claude sends it, and the
                connector cannot see your chats, files or account.
              </>,
              <>
                In a chat, turn it on from <b>+ → Connectors</b> and ask for a workflow. The first time Claude uses a tool, it asks you to allow it; every tool only reads, so
                you can allow them all.
              </>,
            ]}
          />
          <P>
            If Claude reports <b>No approval received</b>, the tool never ran: Claude asked for your permission and did not get it, because the request was declined or timed
            out while the chat was in the background. Ask again and choose <b>Allow</b>, or <b>Always allow</b> in the connector&apos;s tool settings so it never asks.
            Skill Graph never refuses a call this way; its own errors say what to fix.
          </P>
          <P>Connectors you add on the web also appear in the desktop and mobile apps. On Team and Enterprise plans, an owner may need to add the connector for the organization first.</P>
        </Section>

        <Section id="claude-code" title="Add it in Claude Code">
          <P>Run this once in a terminal, then start Claude Code in your project. Type <C>/mcp</C> to check that skill-graph is connected.</P>
          <CopyField value={CLAUDE_CODE_COMMAND} label="the Claude Code command" />
          <P>
            In Claude Code, Claude can save the compiled files straight into your repository (<C>.claude/skills/</C> and <C>.claude/agents/</C>), so the skill is ready before you
            start the work.
          </P>
        </Section>

        <Section id="everyday" title="Everyday use: run a checked workflow in a chat">
          <P>
            You do not need to build anything. Ask Claude for one of these, or pick it from the connector&apos;s prompts (<b>+ → Skill Graph</b>). Claude does the work
            step by step, a Checker looks at it with fresh eyes, and anything that fails is sent back with the reason before you see the answer.
          </P>
          <ul className="space-y-2.5">
            {EVERYDAY_PROMPTS.map((prompt) => (
              <li key={prompt} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700">
                {prompt}
              </li>
            ))}
          </ul>
          <P>
            Steps use what the chat has: web search, files you share in the chat, and apps you have connected such as Google Drive or Sheets. To keep a workflow, ask Claude
            to save it under a name. You get a link and a short prompt that runs it again in any chat, plus a line to paste into a Claude Project&apos;s instructions so
            &quot;run my trip planner on …&quot; works there every time.
          </P>
        </Section>

        <Section id="prompts" title="Try these prompts">
          <ul className="space-y-2.5">
            {PROMPTS.map((prompt) => (
              <li key={prompt} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700">
                {prompt}
              </li>
            ))}
          </ul>
          <P>
            Or pick <b>Design a workflow for my project</b> from the connector&apos;s prompts in Claude and describe your project in a sentence.
          </P>
        </Section>

        <Section id="results" title="What you get back">
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
            <li>
              <b className="text-zinc-900">A studio link.</b> It opens the graph on the canvas with its plan, where you can walk through the stages, change steps and export
              all files as one zip. The graph travels inside the link, after the <C>#</C>, so Claude shows it as a short &quot;Open … in Skill Graph&quot; link.
            </li>
            <li>
              <b className="text-zinc-900">The check and a dry run.</b> Which steps run in which order, which run in parallel, what each step receives and returns with a
              sample request, and any errors or warnings with how to fix them.
            </li>
            <li>
              <b className="text-zinc-900">The files.</b> An orchestrating <C>SKILL.md</C> and one Claude Code subagent per step, a single-file <C>SKILL.md</C>, or a Cursor
              rule. The <Link href="/graph/guide#export" className={LINK}>guide</Link> explains each file.
            </li>
            <li>
              <b className="text-zinc-900">A download link.</b> &quot;Download the … kit&quot; opens a page that lists the files and what they can run, then saves them as one
              .zip. In Claude Code, Claude can write the files into your repository instead.
            </li>
            <li>
              <b className="text-zinc-900">A checked run, with progress.</b> In a chat, a run takes one or two calls: a short readout (&quot;Step 2 of 3: Fact check,
              checking&quot;), a plain note on why a step was sent back, and the final answer.
            </li>
            <li>
              <b className="text-zinc-900">A refereed run, step by step.</b> Claude does each step, and the referee checks every answer in code: contract keys, gate verdicts, loop passes and
              exit codes. It sends failed work back with the reason, stops when the tries run out, and at the end hands you the loop notes and lessons to save.
            </li>
          </ul>
        </Section>

        <Section id="tools" title="What Claude can do with it">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">Tool</th>
                  <th className="px-4 py-2.5">What it does</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-600">
                {TOOLS.map((tool) => (
                  <tr key={tool.name} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12.5px] font-medium text-zinc-900">{tool.name}</td>
                    <td className="px-4 py-2.5 leading-relaxed">{tool.does}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>Every tool only reads: none of them changes anything in your Claude account, your files or on this site.</P>
          <P>
            The tools that check a graph also read each of its gates with a small classifier on our server and warn when no checker could decide one.{" "}
            <Link href="/graph/gate-check" className={LINK}>How the gate check works</Link>.
          </P>
        </Section>

        <Section id="limits" title="Limits">
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
            <li>A graph can have up to {MAX_NODES} steps and {MAX_SOURCE_LENGTH.toLocaleString("en-US")} characters.</li>
            <li>Links longer than about {SHARE_URL_SOFT_LIMIT.toLocaleString("en-US")} characters can be cut off by some chat apps; open them directly in a browser. A graph too large for a link comes back as files instead.</li>
            <li>
              Nothing is saved on our side. Keep the link or the files: paste the link into a later chat and Claude reads the graph back from it. Opening a link in the studio
              keeps the graph you had in that browser under <b>Recent graphs</b> (the clock above the Markdown), so nothing is lost.
            </li>
            <li>
              The referee runs no model and no command. Claude does each step, in the chat or as subagents in Claude Code, and runs the commands where it has a shell; the
              referee only checks the answers and decides what is next. A run passes a small run object back and forth, and a run that outgrows a chat stops with a pointer to
              the compiled kit.
            </li>
            <li>On claude.ai, Claude shows the compiled files for you to copy. Only Claude Code can write them into your project.</li>
          </ul>
        </Section>

        <Section id="privacy" title="Privacy">
          <P>
            When Claude calls a tool, it sends us that tool&apos;s input: usually the text of a graph, or a step&apos;s answer during a refereed run. We check or compile it in memory, send the answer back, and keep nothing. We
            never see your Claude conversation, your account or your files, and we log only which tool was called, to count usage. Don&apos;t put secrets in a graph.
          </P>
          <P>
            Read the full <Link href="/graph/privacy" className={LINK}>Skill Graph privacy policy</Link>.
          </P>
        </Section>

        <Section id="support" title="Support">
          <P>
            Questions or a problem with the connector: email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
              {SUPPORT_EMAIL}
            </a>
            . The <Link href="/graph/guide" className={LINK}>Skill Graph guide</Link> covers the graph format and the studio.
          </P>
        </Section>
      </main>
    </div>
  );
}
