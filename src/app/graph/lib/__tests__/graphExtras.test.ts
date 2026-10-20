import { describe, expect, it } from "vitest";
import { BLUEPRINTS, DEFAULT_GRAPH_SKILL } from "../graphTemplates";
import { nodeAtLine, nodeLineRanges, parseGraphSkill, validateGraph, type SkillGraph } from "../graphSkill";
import { decodeShareHash, encodeShareHash } from "../graphShare";
import { buildPlan, estimateTokens, previewNodeContext } from "../graphPlan";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const graph = load(DEFAULT_GRAPH_SKILL);
const node = (id: string) => graph.nodes.find((n) => n.id === id)!;

describe("blueprints", () => {
  it.each(BLUEPRINTS.map((b) => [b.id, b.source] as const))("%s is a valid graph with a gated fresh-context verifier", (_id, source) => {
    const blueprint = load(source);
    expect(validateGraph(blueprint)).toEqual([]);
    // Parallel work: two or more workers, or one worker that fans out over a list.
    const workers = blueprint.nodes.filter((n) => n.type === "worker");
    expect(workers.length >= 2 || workers.some((n) => n.foreach !== undefined)).toBe(true);
    const verifier = blueprint.nodes.find((n) => n.type === "verifier")!;
    expect(verifier.isolatedContext).toBe(true);
    expect(verifier.gate).toBeTruthy();
    expect(verifier.tools).toEqual(["Read", "Grep", "Glob"]);
  });

  it("names each blueprint after its id", () => {
    for (const blueprint of BLUEPRINTS) expect(load(blueprint.source).name).toBe(blueprint.id);
  });
});

describe("buildPlan", () => {
  it("lists the stages the agent runs, without the input", () => {
    const plan = buildPlan(graph);
    expect(plan.map((stage) => stage.nodes.map((n) => n.id))).toEqual([
      ["splitter"],
      ["worker_research", "worker_compare", "worker_check", "worker_gaps"],
      ["verifier"],
      ["merger"],
    ]);
    expect(plan.map((stage) => stage.number)).toEqual([1, 2, 3, 4]);
  });
});

describe("previewNodeContext", () => {
  it("shows a worker only its own slice of the splitter's JSON", () => {
    const preview = previewNodeContext(graph, node("worker_check"));
    expect(preview.system).toContain("⟨splitter.worker_check⟩");
    expect(preview.system).not.toContain("worker_gaps");
    expect(preview.user).toBe("Proceed with your instructions.");
    expect(preview.sources).toEqual([{ id: "splitter", direct: true }]);
  });

  it("gives the verifier the goal and the four worker outputs, plus its gate and fresh-context rule", () => {
    const preview = previewNodeContext(graph, node("verifier"));
    expect(preview.system).toContain("⟨goal⟩");
    expect(preview.system.match(/⟨output of worker_/g)).toHaveLength(4);
    expect(preview.system).toContain("Gate: Every kept claim");
    expect(preview.system).toContain("fresh context");
    expect(preview.sources.every((source) => source.direct)).toBe(true);
  });

  it("marks material from outside the incoming edges", () => {
    const leaky = { ...graph, nodes: graph.nodes.map((n) => (n.id === "verifier" ? { ...n, prompt: `${n.prompt}\n{{splitter.output}}` } : n)) };
    const preview = previewNodeContext(leaky, leaky.nodes.find((n) => n.id === "verifier")!);
    expect(preview.sources.find((source) => source.id === "splitter")).toEqual({ id: "splitter", direct: false });
  });

  it("puts unreferenced incoming payloads in the task message", () => {
    const plain = { ...graph, nodes: graph.nodes.map((n) => (n.id === "merger" ? { ...n, prompt: "Write the report." } : n)) };
    const preview = previewNodeContext(plain, plain.nodes.find((n) => n.id === "merger")!);
    expect(preview.user).toContain("### Input from 4. VERIFIER (Fresh Context) (contract: verified_payload)");
    expect(preview.user).toContain("⟨output of verifier⟩");
  });

  it("tells the splitter to return JSON keyed by worker", () => {
    expect(previewNodeContext(graph, node("splitter")).system).toContain("a single JSON object with these keys (`worker_research`, `worker_compare`, `worker_check`, `worker_gaps`)");
  });

  it("estimates tokens at about four characters each", () => {
    expect(estimateTokens("abcd".repeat(10))).toBe(10);
  });
});

describe("nodeLineRanges / nodeAtLine", () => {
  const lines = DEFAULT_GRAPH_SKILL.split("\n");
  const lineOf = (text: string) => lines.findIndex((line) => line.includes(text)) + 1;

  it("maps the frontmatter entry and the prompt section of a node", () => {
    const ranges = nodeLineRanges(DEFAULT_GRAPH_SKILL).get("verifier")!;
    expect(ranges).toHaveLength(2);
    expect(ranges[0].start).toBe(lineOf("- id: verifier"));
    expect(ranges[1].start).toBe(lineOf("## @node: verifier"));
    expect(lines[ranges[1].end - 1]).toBe("{{workers.output}}");
  });

  it("finds the node under a cursor line", () => {
    expect(nodeAtLine(DEFAULT_GRAPH_SKILL, lineOf("max_retries: 1"))).toBe("verifier");
    expect(nodeAtLine(DEFAULT_GRAPH_SKILL, lineOf("Return findings with exact citations."))).toBe("worker_research");
    expect(nodeAtLine(DEFAULT_GRAPH_SKILL, lineOf("edges:"))).toBeNull();
    expect(nodeAtLine(DEFAULT_GRAPH_SKILL, lineOf("subtask_json:"))).toBeNull();
    expect(nodeAtLine(DEFAULT_GRAPH_SKILL, 1)).toBeNull();
  });
});

describe("share links", () => {
  it("round-trips a graph through the URL hash", () => {
    const hash = encodeShareHash({ source: DEFAULT_GRAPH_SKILL });
    expect(hash.startsWith("#g=")).toBe(true);
    expect(decodeShareHash(hash)).toEqual({ source: DEFAULT_GRAPH_SKILL });
  });

  it("rejects malformed or empty hashes", () => {
    expect(decodeShareHash("")).toBeNull();
    expect(decodeShareHash("#graph=not-valid")).toBeNull();
    expect(decodeShareHash("#data=abc")).toBeNull();
  });
});
