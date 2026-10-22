import { describe, expect, it } from "vitest";
import { runGraph, type ChatRunResult } from "../graphChatRun";
import { CONNECTOR_PROMPTS, CONNECTOR_TOOLS, callConnectorTool, promptMessage } from "../graphConnector";
import { draftGraph } from "../graphDraft";
import { editGraph } from "../graphEdit";
import { decodeShareHash, encodeShareHash } from "../graphShare";
import { parseGraphSkill, validateGraph } from "../graphSkill";
import { BLUEPRINTS, CONNECTOR_TEMPLATES, EVERYDAY_WORKFLOWS } from "../graphTemplates";
import { resolveWorkflow, workflowPrompt } from "../graphWorkflow";

const CONTEXT = { studioUrl: "https://example.test/graph/studio", downloadUrl: "https://example.test/graph/download" };

function run(args: Record<string, unknown>): ChatRunResult {
  const result = runGraph(args);
  if ("error" in result) throw new Error(result.error);
  return result;
}

function draft(args: Record<string, unknown>): string {
  const result = draftGraph(args);
  if ("error" in result) throw new Error(result.error);
  return result.source;
}

function edit(source: string, operations: unknown[]): string {
  const result = editGraph(source, operations);
  if ("error" in result) throw new Error(result.error);
  return result.source;
}

const progressStates = (result: ChatRunResult) => (result.data.progress as { step: string; state: string }[]).map((step) => `${step.step}:${step.state}`);
const starter = (id: string) => CONNECTOR_TEMPLATES.find((blueprint) => blueprint.id === id)!.source;

const RESEARCH_PASS = {
  research: "1. Caffeine's half-life is about five hours. Source: NIH, https://nih.gov/caffeine, 2020",
  fact_check: "1. Caffeine's half-life is about five hours (https://nih.gov/caffeine)\n\nGATE: PASS",
  answer: "Coffee within six hours of bed makes sleep worse [NIH](https://nih.gov/caffeine).",
};

/** A planner that returns a list, and a gated step that repeats for each entry and is the last step. */
const EACH_LAST = {
  name: "each-last",
  description: "Checks each item of a list.",
  steps: [
    { id: "plan", type: "orchestrator", task: "List the items to check.", keys: ["items"] },
    { id: "each", type: "worker", task: "Check this one item.", after: ["plan"], foreach: "plan.items", gate: "The item is checked.", on_fail: "retry" },
  ],
};

describe("everyday workflows", () => {
  it.each(EVERYDAY_WORKFLOWS.map((entry) => [entry.id, entry] as const))("%s runs in a chat as it is", (_id, entry) => {
    const graph = parseGraphSkill(entry.source).graph!;
    expect(validateGraph(graph)).toEqual([]);
    expect(entry.everyday).toBe(true);
    expect(entry.example).toBeTruthy();
    // Nothing a chat cannot do: no commands, no checks to run, no file tools; a checker that can send work back.
    expect(graph.nodes.some((n) => n.type === "code" || n.check || n.run)).toBe(false);
    for (const n of graph.nodes) for (const tool of n.tools ?? []) expect(["WebSearch", "WebFetch"]).toContain(tool);
    expect(graph.nodes.find((n) => n.type === "verifier")).toMatchObject({ isolatedContext: true, onFail: "retry", gate: expect.any(String) });
  });

  it("are offered by the connector only, not in the studio's blueprint menu", () => {
    for (const entry of EVERYDAY_WORKFLOWS) expect(BLUEPRINTS.some((blueprint) => blueprint.id === entry.id)).toBe(false);
    expect(CONNECTOR_TEMPLATES.map((blueprint) => blueprint.id)).toEqual([...EVERYDAY_WORKFLOWS, ...BLUEPRINTS].map((blueprint) => blueprint.id));
  });
});

describe("run_graph: a whole run in one or two calls", () => {
  it("returns every step's instructions on the first call, with a progress readout and answer keys", () => {
    const first = run({ workflow: "research-and-fact-check", request: "Is coffee bad for sleep?" });
    expect(first.data.status).toBe("running");
    expect(first.text).toContain("Progress: Step 1 of 3: Research, working.");
    for (const key of ["`research`", "`fact_check`", "`answer`"]) expect(first.text).toContain(`Report under ${key}`);
    expect(first.text).toContain("Fact check (Checker)");
    expect(first.text).toContain("Can use: web search");
    expect(first.text).toContain("Fresh eyes:");
    expect(first.data.tasks).toEqual([{ id: "research", step: "research", kind: "work", answer_key: "research" }]);
    // A starter is named in the run object, not carried as a long hash that Claude has to retype.
    expect((first.data.run as { graph: string }).graph).toMatch(/^t:research-and-fact-check:[0-9a-z]+$/);
    expect(JSON.stringify(first.data.run).length).toBeLessThan(600);
  });

  it("ends on the second call with the final answer when every check passes", () => {
    const first = run({ workflow: "research-and-fact-check", request: "Is coffee bad for sleep?" });
    const done = run({ run: first.data.run, answers: RESEARCH_PASS });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toBe(RESEARCH_PASS.answer);
    expect(done.data.run).toBeUndefined();
    expect(done.text).toContain("Progress: Done: all 3 steps passed their checks.");
    expect(done.text).toContain("Final answer (give it to the user as it is):");
    expect(progressStates(done)).toEqual(["research:done", "fact_check:done", "answer:done"]);
  });

  it("runs in a single call when the answers come with the workflow and request", () => {
    const done = run({ workflow: "research-and-fact-check", request: "Is coffee bad for sleep?", answers: RESEARCH_PASS });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toBe(RESEARCH_PASS.answer);
  });

  it("sends work back with why, in plain words, and finishes once the redo passes", () => {
    const first = run({ workflow: "research-and-fact-check", request: "Is coffee bad for sleep?" });
    const failing = { ...RESEARCH_PASS, fact_check: "Nothing holds yet.\nGATE: FAIL\n- research: claim 1 has no link | evidence: no URL | redo: add the source link" };
    const back = run({ run: first.data.run, answers: failing });
    expect(back.data.status).toBe("running");
    expect(progressStates(back)).toEqual(["research:redo", "fact_check:waiting", "answer:waiting"]);
    expect((back.data.progress as { note?: string }[])[0].note).toBe("Fact check found: claim 1 has no link (fix: add the source link)");
    expect(back.text).toContain("Fact check sent Research back to fix (try 2 of 2).");
    expect(back.text).toContain("Progress: Step 1 of 3: Research, fixing what the check found.");
    // The answer step was written on the failed research, so it is not taken.
    expect(back.data.unused_answers).toEqual(["answer"]);
    expect(back.text).toContain("Not used yet: `answer`");
    expect(back.data.tasks).toEqual([{ id: "research/try2", step: "research", kind: "work", answer_key: "research" }]);

    // Resending every answer is fine: each open task takes the answer under its key.
    const done = run({ run: back.data.run, answers: RESEARCH_PASS });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toBe(RESEARCH_PASS.answer);
  });

  it("stops with the reason, on the right step, once the tries run out", () => {
    const failing = { ...RESEARCH_PASS, fact_check: "GATE: FAIL\n- research: still no sources | redo: cite them" };
    const back = run({ workflow: "research-and-fact-check", request: "Q", answers: failing });
    const stopped = run({ run: back.data.run, answers: failing });
    expect(stopped.data.status).toBe("stopped");
    expect(stopped.data.stop_reason).toContain("failed again after 1 retry");
    expect(progressStates(stopped)).toEqual(["research:done", "fact_check:stopped", "answer:waiting"]);
    expect(stopped.text).toContain("Progress: Stopped at step 2 of 3 (Fact check)");
    expect(stopped.text).toContain("Tell the user where it stopped and why");
    expect(stopped.data.run).toBeUndefined();
  });

  it("takes a repeat-for-each step as a list, one answer per entry", () => {
    const answers = {
      shortlist: JSON.stringify({ products: ["Vac A", "Vac B"], criteria: ["price", "pet hair"], budget: "$400" }),
      research_product: [JSON.stringify({ product: "Vac A", price: "$300" }), JSON.stringify({ product: "Vac B", price: "$350" })],
      fact_check: "Both prices confirmed.\nGATE: PASS",
      verdict: "| Product | Price |\n| Vac A | $300 |\n\nPick Vac A.",
    };
    const first = run({ workflow: "compare-products", request: "Compare 2 robot vacuums under $400 for pets." });
    expect(first.text).toContain("a list with one answer per entry");
    expect(first.text).toContain("Research each product (Worker)");
    expect(first.text).toContain("repeats for each entry of shortlist.products");
    const done = run({ run: first.data.run, answers });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toContain("Pick Vac A.");

    // One entry short: the run waits for it under its own key.
    const short = run({ run: first.data.run, answers: { ...answers, research_product: [answers.research_product[0]] } });
    expect(short.data.status).toBe("running");
    expect(short.data.tasks).toEqual([{ id: "research_product/item1", step: "research_product", kind: "item", answer_key: "research_product/item1" }]);
    expect(short.text).toContain('"Vac B"');
    const finished = run({ run: short.data.run, answers: { "research_product/item1": answers.research_product[1], fact_check: answers.fact_check, verdict: answers.verdict } });
    expect(finished.data.status).toBe("done");

    // A list of one may be answered with a plain answer.
    const one = run({ workflow: "compare-products", request: "Just Vac A", answers: { ...answers, shortlist: JSON.stringify({ products: ["Vac A"], criteria: ["price"] }), research_product: answers.research_product[0] } });
    expect(one.data.status).toBe("done");
  });

  it("asks once more when an answer is not in the expected format", () => {
    const back = run({ workflow: "compare-products", request: "Compare two vacuums.", answers: { shortlist: "Vac A and Vac B, on price." } });
    expect(back.data.status).toBe("running");
    expect(back.text).toContain("Shortlist did not come back in the expected format (it is not valid JSON");
    expect(progressStates(back)[0]).toBe("shortlist:redo");
  });

  it("pauses at an approval and goes on only on a yes", () => {
    const source = draft({
      name: "post-checker",
      description: "Drafts a post and asks before the final version.",
      steps: [
        { id: "draft", type: "worker", task: "Draft a short post about the request." },
        { id: "ok", type: "approval", task: "Is this draft fine?", after: ["draft"] },
        { id: "final", type: "synthesizer", task: "Polish the draft into the final post.", after: ["ok", "draft"] },
      ],
    });
    const paused = run({ workflow: source, request: "Launch day", answers: { draft: "Big day!" } });
    expect(paused.data.tasks).toEqual([{ id: "ok", step: "ok", kind: "approval", answer_key: "ok" }]);
    expect(paused.text).toContain("Stop here and ask the user.");
    expect(paused.text).toContain("true only if the user said yes");
    const declined = run({ run: paused.data.run, answers: { ok: false } });
    expect(declined.data.status).toBe("stopped");
    const done = run({ run: paused.data.run, answers: { ok: true, final: "Big day! We launched." } });
    expect(done.data.final_answer).toBe("Big day! We launched.");
  });

  it("says why each unused answer was not taken", () => {
    const result = run({ workflow: "research-and-fact-check", request: "Q", answers: { Research: "x", research: 42 } });
    expect(result.data.unused_answers).toEqual(["Research", "research"]);
    expect(result.text).toContain("match no step");
    expect(result.text).toContain("`research` was not taken: its step is open, but the answer is not in a form it takes here.");
    const partway = run({ workflow: "research-and-fact-check", request: "Q", answers: { research: RESEARCH_PASS.research } });
    const resent = run({ run: partway.data.run, answers: RESEARCH_PASS });
    expect(resent.data.status).toBe("done");
    expect(resent.text).toContain("Already accepted, so not used again: `research`.");
  });

  it("explains a missing or unreadable workflow", () => {
    expect(runGraph({ request: "Q" })).toMatchObject({ error: expect.stringContaining("workflow is required") });
    expect(runGraph({ workflow: "research-and-fact-check" })).toMatchObject({ error: expect.stringContaining("request is required") });
    expect(runGraph({ workflow: "weekly-thing", request: "Q" })).toMatchObject({ error: expect.stringContaining("not a starter id") });
    expect(runGraph({ workflow: "https://example.test/graph/studio#g=broken", request: "Q" })).toMatchObject({ error: expect.stringContaining("could not be read") });
    expect(runGraph({ run: { v: 1 } })).toMatchObject({ error: expect.any(String) });
  });

  it("refuses a run object whose starter has changed since it started", () => {
    const first = run({ workflow: "research-and-fact-check", request: "Q" });
    const changed = { ...(first.data.run as Record<string, unknown>), graph: "t:research-and-fact-check:0" };
    expect(runGraph({ run: changed, answers: RESEARCH_PASS })).toMatchObject({ error: expect.stringContaining("has changed since the run started") });
  });

  it("runs a workflow from its link", () => {
    const source = starter("plan-a-trip");
    const link = `https://example.test/graph/studio${encodeShareHash({ source })}`;
    expect(resolveWorkflow(link)).toEqual({ source });
    const done = run({ workflow: link, request: "2 days in Rome, 500 euros", answers: { itinerary: "Day 1 … Total 450", budget_check: "Adds up to 450.\nGATE: PASS", final_plan: "Rome plan, 450 euros." } });
    expect(done.data.final_answer).toBe("Rome plan, 450 euros.");
  });
});

describe("run_graph: findings of the independent review", () => {
  it("shows a step waiting on its check as next, not as sent back", () => {
    const source = draft({ name: "w", description: "Works and checks.", steps: [{ id: "w", type: "worker", task: "Do the work and return a summary.", check: "npm test" }] });
    const waiting = run({ workflow: source, request: "Q", answers: { w: "work done" } });
    expect(progressStates(waiting)).toEqual(["w:now"]);
    expect(waiting.text).not.toContain("fixing what the check found");
    expect(waiting.data.tasks).toEqual([{ id: "w/check", step: "w", kind: "check", answer_key: "w/check" }]);
    const done = run({ run: waiting.data.run, answers: { "w/check": { exit_code: 0, output: "ok" } } });
    expect(done.data.status).toBe("done");
  });

  it("marks the step the run stopped at when branches run side by side", () => {
    const source = draft({
      name: "side-by-side",
      description: "Works and asks at the same time.",
      steps: [
        { id: "work", type: "worker", task: "Do the work and return it." },
        { id: "ok", type: "approval", task: "May I go on?" },
        { id: "sum", type: "synthesizer", task: "Sum it up.", after: ["work", "ok"] },
      ],
    });
    const stopped = run({ workflow: source, request: "Q", answers: { ok: false } });
    expect(stopped.data.status).toBe("stopped");
    expect(progressStates(stopped)).toEqual(["work:waiting", "ok:stopped", "sum:waiting"]);
    expect(stopped.text).toContain("Stopped at step 2 of 3 (Ok)");
  });

  it("does not call a repeat-for-each final answer complete when entries came in an earlier call", () => {
    const source = draft(EACH_LAST);
    const back = run({ workflow: source, request: "Q", answers: { plan: JSON.stringify({ items: ["a", "b", "c"] }), each: ["A\nGATE: PASS", "B\nGATE: FAIL\n- each: wrong", "C\nGATE: PASS"] } });
    expect(back.data.tasks).toEqual([expect.objectContaining({ step: "each", answer_key: "each/item1" })]);
    const done = run({ run: back.data.run, answers: { "each/item1": "B fixed\nGATE: PASS" } });
    expect(done.data.status).toBe("done");
    expect(done.text).not.toContain("give it to the user as it is");
    expect(done.data.final_answer).toBe("your accepted answers to step `each`, one per entry, in order.");
    // All entries in one call: the whole list is the answer.
    const whole = run({ workflow: source, request: "Q", answers: { plan: JSON.stringify({ items: ["a", "b"] }), each: ["A\nGATE: PASS", "B\nGATE: PASS"] } });
    expect(whole.data.final_answer).toBe("1. A\n\n2. B");
  });

  it("gives what the last command printed as the final answer", () => {
    const source = draft({
      name: "ends-on-command",
      description: "Writes, then publishes with a command.",
      steps: [
        { id: "write", type: "worker", task: "Write the note and return it." },
        { id: "publish", type: "code", task: "echo published", after: ["write"] },
      ],
    });
    const done = run({ workflow: source, request: "Q", answers: { write: "The note.", publish: { exit_code: 0, output: "published at https://x.test/1" } } });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toBe("published at https://x.test/1");
    expect(done.text).toContain("give it to the user as it is");
  });

  it("says a run stopped even while it learns from it", () => {
    const source = edit(starter("research-and-fact-check"), [{ op: "set_skill", experience: true }]);
    const failing = { ...RESEARCH_PASS, fact_check: "GATE: FAIL\n- research: still no sources | redo: cite them" };
    const back = run({ workflow: source, request: "Q", answers: failing });
    const reflecting = run({ run: back.data.run, answers: failing });
    expect(reflecting.data.status).toBe("reflecting");
    expect(reflecting.text).toContain("Progress: Stopped at step 2 of 3 (Fact check)");
    expect(reflecting.text).toContain("One last task: learning from this run.");
    expect(reflecting.text).not.toContain("All steps ran");
    expect(reflecting.text).toContain("Tell the user where it stopped and why");
  });

  it("refuses to open more tasks than a chat can hold, before feeding them", () => {
    const source = edit(draft(EACH_LAST), [{ op: "set_step", id: "each", fields: { max_items: null } }]);
    const items = Array.from({ length: 5_000 }, (_, index) => `item ${index}`);
    const started = Date.now();
    const result = runGraph({ workflow: source, request: "Q", answers: { plan: JSON.stringify({ items }), each: items.map((item) => `${item}\nGATE: PASS`) } });
    expect(result).toMatchObject({ error: expect.stringContaining("more than a chat can handle (100)") });
    expect(Date.now() - started).toBeLessThan(3_000);
  });

  it("keeps a reply readable when many entries are sent back at once", () => {
    const long = `Check this one item with care. ${"Be thorough about every detail. ".repeat(120)}`;
    const source = edit(draft(EACH_LAST), [
      { op: "set_step", id: "each", fields: { max_items: 100 } },
      { op: "set_prompt", id: "each", prompt: `${long}\n\n{{item}}\n\nReturn the checked item.` },
    ]);
    const items = Array.from({ length: 90 }, (_, index) => `item ${index}`);
    const back = run({ workflow: source, request: "Q", answers: { plan: JSON.stringify({ items }), each: items.map((item, index) => (index === 0 ? `${item}\nGATE: PASS` : `${item}\nGATE: FAIL\n- each: wrong total`)) } });
    expect(back.data.tasks).toHaveLength(89);
    // The step's long instructions appear once; each entry sent back adds only its own inputs, then one line.
    expect(back.text.length).toBeLessThan(80_000);
    expect(back.text.split("Be thorough about every detail.").length - 1).toBe(120);
  });
});

describe("run_graph: findings of the second review", () => {
  const PROBED = {
    name: "probed-plan",
    description: "Plans three ways and keeps the best.",
    steps: [{ id: "plan", type: "worker", task: "Write the plan.", probe: 3, probe_hints: ["the smallest change", "the cleanest design", "the fastest path"], gate: "The plan is complete." }],
  };

  it("renders the learning task at the end of a run with learning on", () => {
    const source = edit(starter("research-and-fact-check"), [{ op: "set_skill", experience: true }]);
    const reflecting = run({ workflow: source, request: "Q", answers: RESEARCH_PASS });
    expect(reflecting.data.status).toBe("reflecting");
    expect(reflecting.data.tasks).toEqual([{ id: "reflect", step: "reflect", kind: "reflect", answer_key: "reflect" }]);
    expect(reflecting.text).toContain("### Last task: learn from this run");
    expect(reflecting.text).toContain("Report under `reflect`: the whole new lessons file");
    expect(reflecting.text).toContain("### Failure log");
    // The final answer comes with the reply that took the steps' answers; the learning task only ends the run.
    expect(reflecting.data.final_answer).toBe(RESEARCH_PASS.answer);
    const done = run({ run: reflecting.data.run, answers: { reflect: "# Lessons\n\n(none yet)" } });
    expect(done.data.status).toBe("done");
    expect(done.text).toContain("Lessons: give the user the output of task `reflect` to keep");
    expect(done.text).toContain("pass it as `experience` the next time");
    // The next run hands each step its lessons.
    const lessons = "# Lessons\n\n- [L1] research: always give the source's date.\n  evidence: run 1 · seen 1 · helped 0";
    const next = run({ workflow: source, request: "Q", experience: lessons });
    expect(next.text).toContain("Lessons from earlier runs:\n\n- [L1] always give the source's date.");
  });

  it("shows every approach of a step that tries several ways, and picks with a chat-worded judge", () => {
    const first = run({ workflow: draft(PROBED), request: "Q" });
    expect(first.text).toContain("one per answer in your list, in this order: 1. the smallest change; 2. the cleanest design; 3. the fastest path.");
    const judging = run({ run: first.data.run, answers: { plan: ["Plan A\nGATE: PASS", "Plan B\nGATE: PASS", "Plan C\nGATE: FAIL\n- plan: incomplete"] } });
    expect(judging.data.tasks).toEqual([{ id: "plan/judge", step: "plan", kind: "judge", answer_key: "plan/judge" }]);
    expect(judging.text).toContain("Pick the best of your answers to Plan: 2 of 3 passed their checks.");
    expect(judging.text).toContain("`### Candidate A`: entry 1 of your list of answers to step `plan`");
    expect(judging.text).toContain("`### Candidate B`: entry 2 of your list");
    expect(judging.text).not.toContain("Claude Code kit");
    const done = run({ run: judging.data.run, answers: { "plan/judge": "CHOSEN: B\n---\nPlan B" } });
    expect(done.data.final_answer).toBe("Plan B");
  });

  it("names a single passing candidate as the step's answer for the next step", () => {
    const source = draft({ ...PROBED, steps: [...PROBED.steps, { id: "do", type: "worker", task: "Carry out the plan.", after: ["plan"] }] });
    const next = run({ workflow: source, request: "Q", answers: { plan: ["Plan A\nGATE: PASS", "B\nGATE: FAIL\n- plan: no", "C\nGATE: FAIL\n- plan: no"] } });
    expect(next.data.tasks).toEqual([expect.objectContaining({ step: "do" })]);
    expect(next.text).toContain("`### plan`: your answer to step `plan` that passed its checks (approach A).");
    expect(next.text).not.toContain("judge's");
  });

  it("reports a loop's next try as repeating, not as sent back", () => {
    const source = draft({ name: "looper", description: "Works until done.", steps: [{ id: "w", type: "worker", task: "Work through the list.", loop: { until: "done", max_iterations: 3 } }] });
    const again = run({ workflow: source, request: "Q", answers: { w: "Did half.\n## Loop note\nHalf left." } });
    expect(progressStates(again)).toEqual(["w:repeat"]);
    expect(again.text).toContain("Progress: Step 1 of 1: W, going round again (try 2 of 3).");
    expect(again.text).toContain("↻ 1. W (Worker): repeating (try 2 of 3: it did not end with LOOP: DONE)");
    expect(again.text).not.toContain("sent back to fix");
    const done = run({ run: again.data.run, answers: { w: "All done.\n## Loop note\nNothing left.\nLOOP: DONE" } });
    expect(done.data.status).toBe("done");
    expect(done.data.final_answer).toBe("All done.");
  });

  it("takes the JSON itself for a step that returns JSON", () => {
    const answers = {
      shortlist: { products: ["Vac A"], criteria: ["price"], budget: null },
      research_product: [{ product: "Vac A", price: { value: "$300", source: "https://x.test" } }],
      fact_check: "Confirmed.\nGATE: PASS",
      verdict: "Pick Vac A.",
    };
    const done = run({ workflow: "compare-products", request: "One vacuum", answers });
    expect(done.data.status).toBe("done");
    expect(done.data.unused_answers).toBeUndefined();
  });

  it("says when a sub-task key is not the open one", () => {
    const source = draft(EACH_LAST);
    const back = run({ workflow: source, request: "Q", answers: { plan: JSON.stringify({ items: ["a", "b"] }), each: ["A\nGATE: PASS", "B\nGATE: FAIL\n- each: wrong"] } });
    const wrong = run({ run: back.data.run, answers: { "each/item0": "A again\nGATE: PASS" } });
    expect(wrong.text).toContain("`each/item0` is not open now. Open for that step: `each/item1`.");
    expect(wrong.text).not.toContain("not in a form it takes here");
  });

  it("reads source text with a heading before its frontmatter, and names no other tool in run errors", () => {
    const source = `# My graph\n${starter("plan-a-trip")}`;
    expect(resolveWorkflow(source)).toEqual({ source });
    expect(runGraph({ run: "not an object" })).toMatchObject({ error: expect.stringContaining("run_graph") });
    expect(runGraph({ run: { v: 99 } })).toMatchObject({ error: expect.stringMatching(/Start the run again\.$/) });
  });
});

describe("connector: run_graph, save_workflow and the everyday workflows", () => {
  const call = (name: string, args: Record<string, unknown>) => callConnectorTool(name, args, CONTEXT)!;

  it("lists everyday workflows first and offers each as a menu prompt", () => {
    const listed = call("list_graph_templates", {}).content[0].text;
    expect(listed.indexOf("research-and-fact-check")).toBeLessThan(listed.indexOf("ship-a-change"));
    expect(listed).toContain("they run in this chat as they are");
    expect(EVERYDAY_WORKFLOWS.map((blueprint) => blueprint.id)).toEqual(["research-and-fact-check", "essay-rubric-review", "compare-products", "plan-a-trip"]);
    expect(CONNECTOR_PROMPTS.slice(0, 4).map((prompt) => prompt.name)).toEqual(["research_and_fact_check", "essay_rubric_review", "compare_products", "plan_a_trip"]);
    expect(promptMessage("plan_a_trip", { request: "Lisbon in May" })).toContain('"plan-a-trip"');
    expect(promptMessage("plan_a_trip", { request: "Lisbon in May" })).toContain("Lisbon in May");
    expect(call("get_graph_template", { id: "compare-products" }).content[0].text).toContain("name: compare-products");
  });

  it("returns run_graph's answer as text and as data matching its schema", () => {
    const result = call("run_graph", { workflow: "essay-rubric-review", request: "My essay: … Rubric: thesis 10, evidence 10." });
    expect(result.isError).toBeUndefined();
    const schema = CONNECTOR_TOOLS.find((tool) => tool.name === "run_graph")!.outputSchema!;
    for (const key of schema.required ?? []) expect(result.structuredContent).toHaveProperty(key);
    expect(result.content[0].text).toContain("Read the rubric (Planner)");
    expect(call("run_graph", { workflow: "nope", request: "x" }).isError).toBe(true);
  });

  it("drafts a graph Claude can run at once, described in plain words", () => {
    const result = call("draft_graph", {
      name: "claim-checker",
      description: "Checks a claim.",
      steps: [
        { id: "find", type: "worker", task: "Find sources on the claim and return them." },
        { id: "judge", type: "verifier", task: "Judge whether the sources support the claim.", after: ["find"], gate: "Every source says what is claimed." },
      ],
    });
    const text = result.content[0].text;
    expect(text).toContain("In plain words: Find (Worker) → Judge (Checker).");
    expect(text).toContain("run_graph takes this source or the studio link as the workflow");
    expect(text).toContain("find (Worker: worker, sonnet)");
  });

  it("saves a workflow under a name as a link, with a prompt that runs it again", () => {
    const result = call("save_workflow", { workflow: "research-and-fact-check", name: "Weekly claim checker", input_hint: "THIS WEEK'S CLAIM" });
    expect(result.isError).toBeUndefined();
    const data = result.structuredContent as { name: string; link: string; prompt: string; source: string };
    expect(data.name).toBe("Weekly claim checker");
    expect(data.link.startsWith("https://example.test/graph/studio#g=")).toBe(true);
    expect(data.prompt).toBe(workflowPrompt("Weekly claim checker", data.link));
    const graph = parseGraphSkill(decodeShareHash(data.link.slice(data.link.indexOf("#")))!.source).graph!;
    expect(graph.name).toBe("Weekly claim checker");
    expect(graph.nodes.find((node) => node.type === "input")?.label).toBe("THIS WEEK'S CLAIM");
    expect(validateGraph(graph).filter((issue) => issue.severity === "error")).toEqual([]);
    const text = result.content[0].text;
    expect(text).toContain("Research (Worker) → Fact check (Checker) → Answer (Writer)");
    expect(text).toContain("In a Claude Project");
    expect(text).not.toContain("My workflows");

    // The saved link runs as it is.
    const done = call("run_graph", { workflow: data.link, request: "Q", answers: RESEARCH_PASS });
    expect((done.structuredContent as { status: string }).status).toBe("done");
    expect(call("save_workflow", { workflow: "research-and-fact-check", name: " " }).isError).toBe(true);
  });

  it("writes a prompt that names the workflow, its link and the request", () => {
    expect(workflowPrompt("Trip", "https://x.test/graph/studio#g=1", "Rome")).toBe('Run my Skill Graph workflow "Trip" with run_graph.\nWorkflow: https://x.test/graph/studio#g=1\nRequest: Rome');
  });
});
