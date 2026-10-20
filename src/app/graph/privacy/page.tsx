import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";

const PAGE_URL = "https://www.devscratchpad.tech/graph/privacy";
const SUPPORT_EMAIL = "support@devscratchpad.tech";
const EFFECTIVE_DATE = "21 October 2026";

export const metadata: Metadata = {
  title: "Skill Graph Privacy Policy (Studio and Claude Connector)",
  description: "What Skill Graph collects, uses and keeps: the browser studio stores your graph only in your browser; the Claude connector processes tool inputs in memory and stores nothing.",
  alternates: { canonical: PAGE_URL },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-zinc-200 pt-8">
      <h2 className="text-lg font-extrabold tracking-[-0.02em] text-zinc-900">{title}</h2>
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

const LINK = "font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-700";

export default function GraphPrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/graph" className="flex min-w-0 items-center gap-3">
            <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
            <span className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph · Privacy</span>
          </Link>
          <Link href="/graph/studio" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Open the studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-zinc-900">Skill Graph privacy policy</h1>
          <P>Effective {EFFECTIVE_DATE}. This policy covers Skill Graph at devscratchpad.tech/graph (the site, the studio at /graph/studio and the kit download page at /graph/download) and the Skill Graph connector for Claude at devscratchpad.tech/graph/mcp.</P>
          <P>
            Short version: the studio keeps your graph in your browser and never uploads it. The connector receives what Claude sends when it uses a tool, answers, and keeps
            nothing. There are no accounts, and we never sell or share your data.
          </P>
        </div>

        <Section title="Who we are">
          <P>
            Skill Graph is part of DevScratchpad (devscratchpad.tech). Contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
              {SUPPORT_EMAIL}
            </a>
            .
          </P>
        </Section>

        <Section title="The studio (in your browser)">
          <List
            items={[
              <>Parsing, checking and compiling a graph all happen on your device. The graph is saved in your browser&apos;s local storage so it is there when you come back; it is not sent to us.</>,
              <>Share links carry the graph after the <b>#</b> in the URL. Browsers do not send that part to the server, and our analytics remove it before recording a page view.</>,
              <>Kit download links work the same way: the download page reads the graph after the <b>#</b> and builds the .zip on your device.</>,
              <>Like the rest of DevScratchpad, the page uses Vercel Web Analytics and Speed Insights: cookieless, aggregated page-view and performance statistics (page path, referrer, country, device and browser type). They never include your graph.</>,
            ]}
          />
        </Section>

        <Section title="The Claude connector">
          <P>
            When you add the connector to Claude and Claude uses one of its tools, Claude sends us that tool&apos;s input. Depending on the tool, that is the text of a graph
            skill, the id of a starter graph, or the kind of files to compile. Claude decides what goes into a call, based on your conversation, so don&apos;t put secrets
            (keys, passwords, private data) in a graph.
          </P>
          <List
            items={[
              <><b className="text-zinc-900">What we use it for:</b> only to answer that one request: check the graph, compile it, or build a studio or download link.</>,
              <><b className="text-zinc-900">Storage:</b> the input is processed in memory and discarded once the answer is sent. It is not written to a database, a file or our logs.</>,
              <><b className="text-zinc-900">What we log:</b> the name of the tool called (for example validate_graph), to count usage. Not the graph, not its contents.</>,
              <><b className="text-zinc-900">What we never receive:</b> your Claude conversation, chat history, memory, account details, name, email or files. The connector has no sign-in and no accounts.</>,
            ]}
          />
        </Section>

        <Section title="Hosting and third parties">
          <P>
            The site and the connector run on Vercel, which processes requests on our behalf. Like any web host, Vercel keeps standard request logs (time, IP address, URL path,
            status code and user agent) for a limited period under its own policy; these logs do not include what Claude sends in a tool call. We share data with no one else,
            and we never sell it.
          </P>
        </Section>

        <Section title="Retention">
          <List
            items={[
              <>Connector inputs: not retained; discarded as soon as the answer is sent.</>,
              <>Tool-name counts and Vercel request logs: kept for the host&apos;s standard log retention period, then deleted.</>,
              <>Your graph in the studio: kept in your browser until you clear the site&apos;s data or start over.</>,
            ]}
          />
        </Section>

        <Section title="Your choices">
          <List
            items={[
              <>Remove the connector in Claude under Customize → Connectors, or with <code className="font-mono text-[13px]">claude mcp remove skill-graph</code> in Claude Code, at any time.</>,
              <>Clear the studio&apos;s saved graph by clearing this site&apos;s data in your browser.</>,
              <>Questions or requests about your data: email {SUPPORT_EMAIL}. Since we keep no connector inputs, there is nothing tied to you for us to delete.</>,
            ]}
          />
        </Section>

        <Section title="Changes">
          <P>If this policy changes, we update this page and its effective date. Material changes to what the connector collects will be announced on the connector page before they take effect.</P>
        </Section>
      </main>
    </div>
  );
}
