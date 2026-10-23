import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";

const PAGE_URL = "https://www.devscratchpad.tech/graph/gate-check";

export const metadata: Metadata = {
  title: "Skill Graph Gate Check: How the Connector Reads Each Gate",
  description:
    "The Skill Graph connector reads every gate in a graph against what its step receives and warns when no checker could decide it. A small cross-encoder classifier on our server, not a chatbot: what it does, how well, and its limits.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Skill Graph Gate Check | DevScratchpad",
    description: "How the connector tells a gate a checker can decide from one it cannot, with a small classifier that runs in memory on our server.",
    url: PAGE_URL,
    type: "article",
  },
};

/** Scores from the shipped model (sg-sem-h4-1) on the Ship a change starter, its own gate swapped for each line. */
const EXAMPLES: { gate: string; reads: string; score: string; warns: boolean }[] = [
  { gate: "No blocking finding is left open, and every finding cites a line of the diff.", reads: "checkable", score: "0.02", warns: false },
  { gate: "All tests pass.", reads: "checkable", score: "0.01", warns: false },
  { gate: "Every finding names a file and line that exist.", reads: "checkable", score: "0.01", warns: false },
  { gate: "The user will be happy with the result and find it useful.", reads: "not checkable", score: "0.92", warns: true },
  { gate: "The work is thorough, accurate and professional.", reads: "not checkable", score: "0.92", warns: true },
  { gate: "The fixes are elegant.", reads: "not checkable", score: "0.91", warns: true },
];

const WARNING = `- [semantic-gate-uncheckable] step gate: The gate of "gate" ("The fixes are elegant.") is a judgement its checker cannot decide from the step's inputs (confidence 0.91). Say what must be true for it to pass, e.g. "every total matches the sum of its line items".`;

const PAIR = `[H4] [GATE] The fixes are elegant.
[SEP] [INPUT] diff · Command · The output of git diff, unchanged.
[INPUT] review_correctness · Worker · A numbered list; each finding cites a file and line of the diff and says blocking or minor.
[INPUT] review_security · Worker · A numbered list; each finding cites a file and line of the diff and says blocking or minor.`;

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

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Block({ children }: { children: string }) {
  return <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-[12.5px] leading-relaxed text-zinc-800">{children}</pre>;
}

const LINK = "font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700";
const TH = "px-4 py-2.5";
const TD = "px-4 py-2.5 leading-relaxed";

export default function GraphGateCheckPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/graph" className="flex min-w-0 items-center gap-3">
            <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
            <span className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph · Gate check</span>
          </Link>
          <Link href="/graph/connector" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Connector setup
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Claude connector</p>
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:text-4xl">How the gate check works</h1>
          <P>
            A gate says what must be true for a step&apos;s work to pass. Its checker reads the step&apos;s inputs and answers <C>GATE: PASS</C> or <C>GATE: FAIL</C>. If the gate
            asks for a judgement nobody could decide from those inputs, such as &quot;the user will be happy&quot;, the checker guesses, and a bad result can pass.
          </P>
          <P>
            When Claude checks a graph through the connector, a small classifier on our server reads every gate against what its step receives. If a checker could not decide
            it, the answer carries a warning saying so, with how to fix it. It is a warning, never an error: it does not stop a graph from compiling or running.
          </P>
        </div>

        <Section id="example" title="What Claude sees">
          <P>
            These are the model&apos;s real scores on the <b>Ship a change</b> starter, with its own gate swapped for each line. The score is the model&apos;s confidence that a checker
            could not decide the gate; the connector warns at 0.89 and above.
          </P>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                <tr>
                  <th className={TH}>Gate</th>
                  <th className={TH}>Read as</th>
                  <th className={`${TH} text-right`}>Score</th>
                  <th className={TH}>Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-600">
                {EXAMPLES.map((example) => (
                  <tr key={example.gate} className="align-top">
                    <td className={`${TD} text-zinc-900`}>{example.gate}</td>
                    <td className={`${TD} whitespace-nowrap`}>{example.reads}</td>
                    <td className={`${TD} text-right font-mono text-[12.5px]`}>{example.score}</td>
                    <td className={`${TD} whitespace-nowrap ${example.warns ? "font-semibold text-orange-800" : ""}`}>{example.warns ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>The warning, as it appears in what <C>validate_graph</C> returns:</P>
          <Block>{WARNING}</Block>
          <P>
            Note &quot;All tests pass.&quot;: the plain rule this replaces flags any gate under four words as too short, so it warned on that gate and passed every longer vague
            one. The model reads what a gate asks for instead of counting its words.
          </P>
        </Section>

        <Section id="model" title="What kind of model it is">
          <P>
            It is not a chatbot or a large language model, and it writes no text. It is a <b className="text-zinc-900">cross-encoder classifier</b>: it reads two texts
            together, the gate and the list of what the step receives, and returns three probabilities: checkable, partly checkable, not checkable. This is exactly what it
            reads for the gate above:
          </P>
          <Block>{PAIR}</Block>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-zinc-100 text-zinc-600">
                <tr className="align-top">
                  <td className={`${TD} w-40 font-semibold text-zinc-900`}>Network</td>
                  <td className={TD}>
                    MiniLM-L12-H384 (Microsoft): a Transformer encoder of 12 layers and 33 million parameters, distilled from a BERT-Base-sized model and about 2.7 times
                    faster than BERT-Base. The starting checkpoint is <C>cross-encoder/ms-marco-MiniLM-L12-v2</C>, the same network already trained to judge whether one
                    passage answers another.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className={`${TD} font-semibold text-zinc-900`}>Our training</td>
                  <td className={TD}>
                    Fine-tuned by us on gates labelled checkable, partly or not, set on generated graphs and on our starters, plus 16 facts about each step taken from the
                    graph itself (its type, how many inputs it has, whether they are JSON). An open-weights model (Qwen2.5) in our training notebook wrote the gates; no
                    data from users.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className={`${TD} font-semibold text-zinc-900`}>What ships</td>
                  <td className={TD}>
                    One head of the model, compressed to 8-bit integers: a 34 MB file (from 133 MB) that scores the same on our hand-written test set. It runs on ONNX
                    Runtime inside the connector&apos;s server function.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className={`${TD} font-semibold text-zinc-900`}>Speed</td>
                  <td className={TD}>About 70 milliseconds per gate. The first call after the server starts loads the model, about a second, once.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="accuracy" title="How well it does">
          <List
            items={[
              <>
                On a test set written by hand, which the model never saw in training: it flagged <b className="text-zinc-900">20 of 21</b> gates that cannot be checked, and{" "}
                <b className="text-zinc-900">none of 42</b> gates that can be, fully or in part.
              </>,
              <>
                On the 14 starter graphs: it warns on none of their own gates. With each gate swapped for a vague one, it caught 68 of 84; with each swapped for a short checkable
                one (&quot;Every claim has a link.&quot;, &quot;The total is under $500.&quot;), it warned on none of 140.
              </>,
              <>
                What it misses most: vague gates worded like a rule. &quot;Everything makes sense and nothing important is missing from the answer&quot; reads to it as partly
                checkable, so it does not warn.
              </>,
            ]}
          />
        </Section>

        <Section id="limits" title="Limits">
          <List
            items={[
              <>It reads the gate and the one-line description of each input, not the work itself. It cannot tell whether an answer meets the gate; the checker step does that.</>,
              <>It was trained on English gates. A gate in another language may be read wrongly.</>,
              <>It only checks gates. Other warnings, such as a missing input or a vague prompt, come from the plain rules, as before.</>,
              <>
                It runs in the connector, not in the studio. The studio checks in your browser and still uses the four-word rule. If the model ever fails to load or takes longer
                than a second and a half, the connector answers exactly as it would without it.
              </>,
            ]}
          />
        </Section>

        <Section id="privacy" title="Privacy">
          <P>
            The model runs inside the connector on our server, on the graph Claude sent with the tool call, in memory. No other service sees it, and nothing is stored or
            logged: as for every connector call, we log only the name of the tool. Read the <Link href="/graph/privacy" className={LINK}>privacy policy</Link>.
          </P>
        </Section>
      </main>
    </div>
  );
}
