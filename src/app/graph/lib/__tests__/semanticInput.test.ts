import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readH2Weave } from "../../../../../scripts/semantic/llmPrompts";
import { assemble, mock, round1, round2, splitOf, type Example } from "../../../../../scripts/semantic/pipeline";
import { parseGraphSkill, type SkillGraph } from "../graphSkill";
import { CONNECTOR_TEMPLATES } from "../graphTemplates";
import { FEATURE_COUNT, SEMANTIC_INPUT_VERSION, contractInput, featuresFor, gateInput, missingInputInput, splitSentences, verdictInput } from "../semanticInput";

function starter(id: string): SkillGraph {
  return parseGraphSkill(CONNECTOR_TEMPLATES.find((template) => template.id === id)!.source).graph!;
}

const research = starter("research-and-fact-check");
const node = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id)!;

describe("semanticInput: the text and numbers sg-sem reads", () => {
  it("is version 1; changing any output below means retraining the model", () => {
    expect(SEMANTIC_INPUT_VERSION).toBe(1);
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

  it("writes H2 as the task and one line per input", () => {
    const pair = missingInputInput(research, node(research, "answer"));
    expect(pair.textA.startsWith("[H2] [TASK] Answer the question for someone who is not an expert")).toBe(true);
    expect(pair.textB).toBe(
      "[INPUT] question · Your request · WHAT TO RESEARCH [INPUT] fact_check · Checker · The claims that held up, each with its source, then the claims that were dropped and why."
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
});

describe("sg-sem data pipeline, on the mock text model", () => {
  const dir = mkdtempSync(join(tmpdir(), "sg-sem-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("builds labelled examples for all four heads, split by seed", () => {
    round1(dir, 1);
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
    // Every cut H2 has its negative twin: the same task text, with the input still connected.
    const positives = examples.filter((e) => e.head === "h2" && e.label === 1 && !e.note.startsWith("replaced "));
    for (const positive of positives.slice(0, 50)) expect(examples.some((e) => e.head === "h2" && e.label === 0 && e.text_a === positive.text_a && e.text_b.length > positive.text_b.length)).toBe(true);
    // A dropped negative has its positive's input list and graph facts; only the task's words differ (and with them fact 7, the prompt length).
    const dropped = examples.filter((e) => e.head === "h2" && e.note.startsWith("dropped "));
    expect(dropped.length).toBeGreaterThan(0);
    for (const negative of dropped.slice(0, 50)) {
      const twin = positives.find((p) => p.seed === negative.seed && p.node === negative.node && p.note === negative.note.replace("dropped", "cut") && p.text_b === negative.text_b);
      expect(twin, negative.note).toBeDefined();
      expect(negative.features.filter((_, i) => i !== 7)).toEqual(twin!.features.filter((_, i) => i !== 7));
      expect(negative.text_a).not.toBe(twin!.text_a);
    }
    // A drafted negative is the woven task with every input: the positive's task words, one input more.
    const drafted = examples.filter((e) => e.head === "h2" && e.note.startsWith("drafted "));
    expect(drafted.length).toBeGreaterThan(0);
    for (const negative of drafted.slice(0, 50)) {
      const twin = positives.find((p) => p.seed === negative.seed && p.node === negative.node && p.note === negative.note.replace("drafted", "cut"));
      expect(twin, negative.note).toBeDefined();
      expect((negative.text_b.match(/\[INPUT\]/g) ?? []).length).toBeGreaterThanOrEqual((twin!.text_b.match(/\[INPUT\]/g) ?? []).length);
      expect(negative.text_a).toContain(twin!.text_a.slice(twin!.span![0], twin!.span![1]));
    }
    // A replaced positive has as many inputs as its drafted twin, none of them the cut one, and the cut's span words.
    const replaced = examples.filter((e) => e.head === "h2" && e.note.startsWith("replaced "));
    expect(replaced.length).toBeGreaterThan(0);
    for (const positive of replaced.slice(0, 50)) {
      const pred = positive.note.slice("replaced ".length);
      const cut = positives.find((p) => p.seed === positive.seed && p.node === positive.node && p.note === `cut ${pred}`);
      const twin = drafted.find((n) => n.seed === positive.seed && n.node === positive.node && n.note === `drafted ${pred}`);
      expect(cut, positive.note).toBeDefined();
      expect(twin, positive.note).toBeDefined();
      expect(positive.label).toBe(1);
      expect((positive.text_b.match(/\[INPUT\]/g) ?? []).length).toBe((twin!.text_b.match(/\[INPUT\]/g) ?? []).length);
      expect(positive.text_b).not.toContain(`[INPUT] ${pred} `);
      expect(positive.features[8]).toBe(twin!.features[8]);
      expect(positive.text_a.slice(positive.span![0], positive.span![1])).toBe(cut!.text_a.slice(cut!.span![0], cut!.span![1]));
    }
    // No seed graph is in two splits.
    const splits = new Map<string, Set<string>>();
    for (const example of examples) splits.set(example.seed, (splits.get(example.seed) ?? new Set()).add(example.split));
    for (const set of splits.values()) expect(set.size).toBe(1);
  }, 120_000);
});
