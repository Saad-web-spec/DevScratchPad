import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readH2Weave } from "../../../../../scripts/semantic/llmPrompts";
import { assemble, grounded, mock, round1, round2, splitOf, type Example } from "../../../../../scripts/semantic/pipeline";
import { parseGraphSkill, type SkillGraph } from "../graphSkill";
import { CONNECTOR_TEMPLATES } from "../graphTemplates";
import { FEATURE_COUNT, SEMANTIC_INPUT_VERSION, contractInput, edgeCandidates, featuresFor, gateInput, missingInputInput, splitSentences, verdictInput } from "../semanticInput";

function starter(id: string): SkillGraph {
  return parseGraphSkill(CONNECTOR_TEMPLATES.find((template) => template.id === id)!.source).graph!;
}

const research = starter("research-and-fact-check");
const node = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id)!;

describe("semanticInput: the text and numbers sg-sem reads", () => {
  it("is version 2; changing any output below means retraining the model", () => {
    expect(SEMANTIC_INPUT_VERSION).toBe(2);
  });

  it("splits answers into sentences, one per list item and per sentence", () => {
    expect(splitSentences("- First point holds. Second one too!\n2. **Third** item\n\n---\n# Heading")).toEqual(["First point holds.", "Second one too!", "Third item", "Heading"]);
    expect(splitSentences("Costs add up to 1,240. The tax is 3.5% of it.")).toEqual(["Costs add up to 1,240.", "The tax is 3.5% of it."]);
    expect(splitSentences("Claim 5 quotes Dr. Smith and J. Lee, e.g. Their talk. Claim 6 is from Plan B.")).toEqual(["Claim 5 quotes Dr. Smith and J. Lee, e.g. Their talk.", "Claim 6 is from Plan B."]);
  });

  it("writes H1 from a verifier answer: gate, sentences, verdict", () => {
    const answer = "1. Claim 1 holds: the NIH page says five hours.\n2. Claim 2 cites a 2014 blog I could not open.\n\nGATE: PASS";
    const pair = verdictInput(research, node(research, "fact_check"), answer)!;
    expect(pair.textA).toBe("[H1] [GATE] Every kept claim has a source that says it, and no kept claim is contradicted by a more reliable or more recent source.");
    expect(pair.textB).toBe("[SEN] Claim 1 holds: the NIH page says five hours. [SEN] Claim 2 cites a 2014 blog I could not open. [VERDICT] PASS");
    expect(pair.sentences).toHaveLength(2);
    expect(pair.features[15]).toBe(1);
    expect(verdictInput(research, node(research, "fact_check"), "No verdict here.")).toBeNull();
    expect(verdictInput(research, node(research, "research"), answer)).toBeNull();
  });

  it("keeps the end of a long verifier answer, where the reasons are", () => {
    const long = `${Array.from({ length: 60 }, (_, i) => `Point ${i} is fine and backed by the source.`).join("\n")}\nThe last claim is still unverified.\nGATE: PASS`;
    const pair = verdictInput(research, node(research, "fact_check"), long)!;
    expect(pair.sentences.at(-1)).toBe("The last claim is still unverified.");
    expect(pair.sentences.length).toBeLessThanOrEqual(40);
    expect(pair.textB.length).toBeLessThan(1_800);
  });

  it("writes H2 as the task against one step it could read and does not, then its own inputs", () => {
    // answer reads the request and fact_check; research runs before it and is not read: the one candidate.
    expect(edgeCandidates(research, node(research, "answer")).map((n) => n.id)).toEqual(["research"]);
    // fact_check already reads research and answer runs after it: no candidate.
    expect(edgeCandidates(research, node(research, "fact_check"))).toEqual([]);
    const pair = missingInputInput(research, node(research, "answer"), node(research, "research"));
    expect(pair.textA.startsWith("[H2] [TASK] Answer the question for someone who is not an expert")).toBe(true);
    expect(pair.textB).toBe(
      "[CANDIDATE] research · Worker · A numbered list of claims, each with its source (title and link) and the source's date. [INPUT] question · Your request · WHAT TO RESEARCH [INPUT] fact_check · Checker · The claims that held up, each with its source, then the claims that were dropped and why."
    );
  });

  it("writes H3 as the contract against the producer's task and what is read", () => {
    const pair = contractInput(research, "claims")!;
    expect(pair.textA).toBe("[H3] [CONTRACT] claims · markdown · A numbered list of claims, each with its source (title and link) and the source's date.");
    expect(pair.textB.startsWith("[TASK] research · Worker · Research this question on the web:")).toBe(true);
    expect(pair.textB.endsWith("[READS] fact_check reads {{research}} · required: none")).toBe(true);
    expect(contractInput(research, "nope")).toBeNull();
  });

  it("writes H4 as the gate and the checker's inputs", () => {
    const pair = gateInput(research, node(research, "fact_check"))!;
    expect(pair.textA.startsWith("[H4] [GATE] Every kept claim has a source")).toBe(true);
    expect(pair.textB).toContain("[INPUT] research · Worker · A numbered list of claims");
    expect(gateInput(research, node(research, "research"))).toBeNull();
  });

  it("gives 16 features between 0 and 1 for every step of every starter", () => {
    for (const template of CONNECTOR_TEMPLATES) {
      const graph = parseGraphSkill(template.source).graph!;
      for (const step of graph.nodes) {
        const features = featuresFor(graph, step);
        expect(features).toHaveLength(FEATURE_COUNT);
        for (const value of features) expect(value >= 0 && value <= 1).toBe(true);
      }
    }
    // fact_check: a verifier with a gate, fresh eyes, retry, reading the request and the research.
    expect(featuresFor(research, node(research, "fact_check")).slice(0, 5)).toEqual([0.4286, 1, 1, 0.575, 1]);
  });
});

describe("sg-sem weave answers", () => {
  const original = "Identify the key changes in the commits and group them by type.";
  const ids = ["get-commits-since-last-tag", "extract-key-changes"];
  const answer = (task: string, without: string) => JSON.stringify({ task, task_without: without });

  it("keeps a rewrite that names the data inside the work, and its version without", () => {
    const read = readH2Weave(answer("Identify the key changes in [the list of commits since the last tag] and group them by type.", "Identify the key changes and group them by type."), original, ids);
    expect(read).toEqual({ task: "Identify the key changes in the list of commits since the last tag and group them by type.", phrase: "the list of commits since the last tag", without: "Identify the key changes and group them by type." });
  });

  it("drops answers without one bracketed mention, still naming it without, off the task or spelling a step id", () => {
    expect(readH2Weave(answer("Identify the key changes in the commit list.", "Identify the key changes and group them."), original, ids)).toEqual({ reject: "brackets" });
    expect(readH2Weave(answer("Identify the key changes in [the commit list] and [the tags].", "Identify the key changes and group them."), original, ids)).toEqual({ reject: "brackets" });
    expect(readH2Weave(answer("Identify the key changes in [the commit list] and group them.", "Identify the key changes in the list of each commit and group them."), original, ids)).toEqual({ reject: "still-named" });
    expect(readH2Weave(answer("Write a short summary of what [the survey percentages] show.", "Write a short summary of what the notes show."), original, ids)).toEqual({ reject: "off-task" });
    expect(readH2Weave(answer("Read get-commits-since-last-tag and identify the key changes in [the commit list].", "Identify the key changes and group them."), original, ids)).toEqual({ reject: "step-id" });
    expect(readH2Weave("not json", original, ids)).toEqual({ reject: "json" });
  });

  it("keeps a mention only when it shares a content word with what the cut step returns", () => {
    expect(grounded("the budget totals per category", "[CANDIDATE] budget_review · Worker · Each budget category with its total, its cap and whether it is justified.")).toBe(true);
    expect(grounded("the listing scores", "[CANDIDATE] score_each · Worker · The listing's score with reasons and the commute time.")).toBe(true);
    // msmarco-4's dev rows: words of the request, not of the planner that was cut; generic words name nothing.
    expect(grounded("the new API version endpoints and parameters", "[CANDIDATE] split_work · Planner · A JSON object containing references to the three worker steps.")).toBe(false);
    expect(grounded("the results from each step", "[CANDIDATE] gather · Worker · The data from each source.")).toBe(false);
  });
});

describe("sg-sem data pipeline, on the mock text model", () => {
  const dir = mkdtempSync(join(tmpdir(), "sg-sem-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("builds labelled examples for all four heads, split by seed", () => {
    round1(dir, 1, 1);
    mock(join(dir, "round1.requests.jsonl"), join(dir, "round1.outputs.jsonl"));
    round2(dir, 1);
    mock(join(dir, "round2.requests.jsonl"), join(dir, "round2.outputs.jsonl"));
    assemble(dir);
    const examples = readFileSync(join(dir, "examples.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as Example);
    for (const head of ["h1", "h2", "h3", "h4"]) {
      const labels = new Set(examples.filter((example) => example.head === head).map((example) => example.label));
      expect(labels.size, head).toBeGreaterThanOrEqual(2);
    }
    for (const example of examples) {
      expect(example.features).toHaveLength(FEATURE_COUNT);
      expect(example.split).toBe(splitOf(example.seed));
      if (example.head === "h1") {
        expect((example.text_b.match(/\[SEN\]/g) ?? []).length).toBe(example.sentences!.length);
        if (example.note.startsWith("buried_")) expect(example.sentences).toContain(1);
        else expect(example.sentences!.every((flag) => flag === 0)).toBe(true);
      }
      if (example.head === "h2" && example.label === 1) {
        const [start, end] = example.span!;
        expect(example.text_a.slice(start, end)).toMatch(/^the results of the earlier /);
      }
    }
    // H2 rows are pairs: one per candidate step, grouped per version of a step; a positive group has one positive row,
    // the cut input as candidate, and the group's other rows are other candidates.
    const h2 = examples.filter((e) => e.head === "h2");
    for (const row of h2) {
      expect(row.group, row.note).toBeDefined();
      expect(row.text_b.startsWith(`[CANDIDATE] ${row.candidate} · `)).toBe(true);
    }
    const positives = h2.filter((e) => e.label === 1 && !e.note.startsWith("replaced "));
    expect(positives.length).toBeGreaterThan(0);
    for (const positive of positives) {
      expect(positive.candidate).toBe(positive.note.slice("cut ".length));
      expect(h2.filter((e) => e.seed === positive.seed && e.group === positive.group && e.label === 1)).toHaveLength(1);
    }
    // A dropped negative is its cut's very pair (candidate, inputs, graph facts); only the task's words differ (and with them fact 7, the prompt length).
    const dropped = h2.filter((e) => e.note.startsWith("dropped "));
    expect(dropped.length).toBeGreaterThan(0);
    for (const negative of dropped.slice(0, 50)) {
      const twin = positives.find((p) => p.seed === negative.seed && p.node === negative.node && p.note === negative.note.replace("dropped", "cut") && p.text_b === negative.text_b);
      expect(twin, negative.note).toBeDefined();
      expect(negative.label).toBe(0);
      expect(negative.features.filter((_, i) => i !== 7)).toEqual(twin!.features.filter((_, i) => i !== 7));
      expect(negative.text_a).not.toBe(twin!.text_a);
    }
    // Drafted and kept versions still read the cut input: it is never their candidate, and every row is a negative.
    const drafted = h2.filter((e) => e.note.startsWith("drafted "));
    expect(drafted.length).toBeGreaterThan(0);
    for (const negative of [...drafted, ...h2.filter((e) => e.note.startsWith("kept "))]) {
      expect(negative.label).toBe(0);
      expect(negative.candidate).not.toBe(negative.note.split(" ")[1]);
    }
    // A replaced positive names the cut input as candidate, does not read it, and has the cut's span words.
    const replaced = h2.filter((e) => e.note.startsWith("replaced "));
    expect(replaced.length).toBeGreaterThan(0);
    for (const positive of replaced.slice(0, 50)) {
      const pred = positive.note.slice("replaced ".length);
      const cut = positives.find((p) => p.seed === positive.seed && p.node === positive.node && p.note === `cut ${pred}`);
      expect(cut, positive.note).toBeDefined();
      expect(positive.label).toBe(1);
      expect(positive.candidate).toBe(pred);
      expect(positive.text_b).not.toContain(`[INPUT] ${pred} `);
      // The stand-in takes the cut input's place; a cut that left no input reads the request instead, so never fewer.
      expect((positive.text_b.match(/\[INPUT\]/g) ?? []).length).toBeGreaterThanOrEqual((cut!.text_b.match(/\[INPUT\]/g) ?? []).length);
      expect(positive.text_a.slice(positive.span![0], positive.span![1])).toBe(cut!.text_a.slice(cut!.span![0], cut!.span![1]));
    }
    // An H2-only seed (drafted from an H2-only outline) gets no H1 or H4 jobs and writes nothing but H2 rows.
    const h2Only = new Set(readFileSync(join(dir, "seeds.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { seed: string; h2Only?: boolean }).filter((seed) => seed.h2Only).map((seed) => seed.seed));
    expect(h2Only.size).toBeGreaterThan(0);
    expect(examples.filter((e) => h2Only.has(e.seed)).every((e) => e.head === "h2")).toBe(true);
    expect(examples.some((e) => h2Only.has(e.seed) && e.label === 1)).toBe(true);
    const jobs = readFileSync(join(dir, "round2.requests.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { kind: string; meta: { seed: string } });
    expect(jobs.filter((job) => h2Only.has(job.meta.seed)).every((job) => job.kind === "h2")).toBe(true);
    // No seed graph is in two splits.
    const splits = new Map<string, Set<string>>();
    for (const example of examples) splits.set(example.seed, (splits.get(example.seed) ?? new Set()).add(example.split));
    for (const set of splits.values()) expect(set.size).toBe(1);
  }, 120_000);
});
