import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, DEFAULT_GRAPH_SKILL } from "../graphTemplates";
import {
  SPEC_VERSION,
  addEdge,
  addNode,
  analyzeIsolation,
  computeLayers,
  contractFormat,
  executionWaves,
  findOrphanSections,
  layoutGraph,
  parseGraphSkill,
  removeNode,
  renameContract,
  renameNode,
  serializeGraphSkill,
  topologicalOrder,
  updateContract,
  updateNode,
  validateGraph,
  wantsJsonOutput,
  type SkillGraph,
} from "../graphSkill";
import { buildExportKit, buildSubagent, loadBudget, toSlug } from "../graphExport";

function load(source = DEFAULT_GRAPH_SKILL): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const node = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id)!;

describe("parseGraphSkill", () => {
  it("reads nodes, expanded edges and prompts from the default blueprint", () => {
    const graph = load();
    expect(graph.name).toBe("parallel-system-audit");
    expect(graph.nodes).toHaveLength(8);
    // 1 (goal) + 4 (fan-out) + 4 (fan-in) + 1 (verifier -> merger)
    expect(graph.edges).toHaveLength(10);
    expect(node(graph, "verifier").isolatedContext).toBe(true);
    expect(node(graph, "worker_gaps").prompt).toContain("{{splitter.worker_gaps}}");
    expect(graph.edges.find((e) => e.from === "splitter")?.contract).toBe("subtask_json");
  });

  it("reads contracts and agent settings", () => {
    const graph = load();
    expect(graph.contracts.subtask_json.format).toBe("json");
    expect(graph.contracts.findings_array.description).toMatch(/evidence/);
    const verifier = node(graph, "verifier");
    expect(verifier).toMatchObject({ model: "opus", tools: ["Read", "Grep", "Glob"], onFail: "retry", maxRetries: 1 });
    expect(verifier.gate).toMatch(/evidence/);
    expect(node(graph, "worker_research").tools).toContain("WebSearch");
  });

  it("reports a missing frontmatter and invalid YAML as fatal", () => {
    expect(parseGraphSkill("# no frontmatter").fatal).toMatch(/frontmatter/i);
    expect(parseGraphSkill("---\nname: [oops\n---\n").fatal).toMatch(/YAML/);
  });

  it("does not treat a heading inside a code fence as a node section", () => {
    const source = `${BLANK_GRAPH_SKILL}\n\`\`\`md\n## @node: ghost\nnot a node\n\`\`\`\n`;
    const graph = load(source);
    expect(findOrphanSections(source, graph)).toEqual([]);
    expect(node(graph, "answer").prompt).toContain("not a node");
  });

  it("accepts a contract written as a plain string", () => {
    const graph = load(BLANK_GRAPH_SKILL.replace("topology:", "contracts:\n  notes: Short notes\ntopology:"));
    expect(graph.contracts.notes).toEqual({ format: "markdown", description: "Short notes" });
  });
});

describe("serializeGraphSkill", () => {
  it("round-trips the default blueprint without losing anything", () => {
    const first = load();
    const second = load(serializeGraphSkill(first));
    expect(second.nodes).toEqual(first.nodes);
    expect(second.edges).toEqual(first.edges);
    expect(second.contracts).toEqual(first.contracts);
    expect(second.name).toBe(first.name);
  });

  it("writes the spec version, compact edges and contracts", () => {
    const text = serializeGraphSkill(load());
    expect(text).toContain(`spec: ${SPEC_VERSION}`);
    expect(text).toMatch(/from: splitter\s+to:\s+- worker_research/);
    expect(text.match(/contract: findings_array/g)).toHaveLength(1);
    expect(text).toMatch(/contracts:\s+subtask_json:\s+format: json/);
  });

  it("keeps unknown frontmatter keys", () => {
    const source = BLANK_GRAPH_SKILL.replace("description:", "license: MIT\ndescription:");
    expect(serializeGraphSkill(load(source))).toContain("license: MIT");
  });
});

describe("validateGraph", () => {
  const codes = (graph: SkillGraph) => validateGraph(graph).map((issue) => issue.code);

  it("accepts every shipped graph with no issues", () => {
    expect(validateGraph(load())).toEqual([]);
    expect(validateGraph(load(BLANK_GRAPH_SKILL))).toEqual([]);
  });

  it("detects cycles", () => {
    const graph = addEdge(load(), "merger", "splitter");
    expect(topologicalOrder(graph)).toBeNull();
    expect(codes(graph)).toContain("cycle");
  });

  it("detects edges to unknown nodes, missing prompts and unknown references", () => {
    const graph = load();
    graph.edges.push({ from: "worker_gaps", to: "nowhere" });
    node(graph, "merger").prompt = "";
    node(graph, "worker_check").prompt = "Use {{ghost.output}}";
    expect(codes(graph)).toEqual(expect.arrayContaining(["edge-unknown-node", "missing-prompt", "unknown-ref"]));
  });

  it("rejects references to nodes that are not upstream", () => {
    const graph = load();
    node(graph, "worker_check").prompt = "Compare with {{worker_compare.output}}";
    expect(codes(graph)).toContain("ref-not-upstream");
  });

  it("warns when an isolated node reads outside its incoming edges", () => {
    const graph = load();
    node(graph, "verifier").prompt += "\nPlan: {{splitter.output}}";
    expect(validateGraph(graph).find((i) => i.code === "isolation-leak")?.severity).toBe("warning");
    expect(analyzeIsolation(graph, node(graph, "verifier")).biasPercent).toBe(50);
  });

  it("reports 0% bias for the default verifier", () => {
    const graph = load();
    expect(analyzeIsolation(graph, node(graph, "verifier")).biasPercent).toBe(0);
  });

  it("warns about undefined contracts, unknown tools, empty tool lists and retry without a gate", () => {
    let graph = load();
    graph = { ...graph, edges: graph.edges.map((e) => (e.to === "merger" ? { ...e, contract: "mystery" } : e)) };
    graph = updateNode(graph, "worker_gaps", { tools: ["Read", "Teleport"] });
    graph = updateNode(graph, "merger", { tools: [] });
    graph = updateNode(graph, "worker_check", { onFail: "retry" });
    expect(codes(graph)).toEqual(expect.arrayContaining(["contract-undefined", "unknown-tool", "empty-tools", "retry-without-gate"]));
    expect(validateGraph(updateNode(load(), "worker_gaps", { tools: ["mcp__github__search"] }))).toEqual([]);
  });

  it("flags a text node feeding a JSON contract", () => {
    const graph = updateNode(load(), "splitter", { outputFormat: "text" });
    expect(codes(graph)).toContain("format-mismatch");
  });
});

describe("contracts", () => {
  it("decide JSON output and can be renamed everywhere", () => {
    const graph = load();
    expect(wantsJsonOutput(graph, node(graph, "splitter"))).toBe(true);
    expect(wantsJsonOutput(graph, node(graph, "worker_research"))).toBe(false);
    const renamed = renameContract(graph, "findings_array", "findings");
    expect(renamed.contracts.findings).toBeDefined();
    expect(renamed.edges.filter((e) => e.contract === "findings")).toHaveLength(4);
    expect(validateGraph(renamed)).toEqual([]);
  });

  it("treats an undefined contract named *json* as JSON", () => {
    const graph = updateContract(load(), "subtask_json", null);
    expect(contractFormat(graph, "subtask_json")).toBe("json");
  });
});

describe("graph editing", () => {
  it("adds a node connected to the selected one and removes it with its edges", () => {
    const graph = load(BLANK_GRAPH_SKILL);
    const { graph: next, id } = addNode(graph, "verifier", "work");
    expect(next.edges.some((e) => e.from === "work" && e.to === id)).toBe(true);
    expect(node(next, id)).toMatchObject({ isolatedContext: true, onFail: "retry", tools: ["Read", "Grep", "Glob"] });
    const removed = removeNode(next, id);
    expect(removed.nodes.some((n) => n.id === id)).toBe(false);
    expect(removed.edges.some((e) => e.to === id || e.from === id)).toBe(false);
  });

  it("renames a node in edges and in {{references}}", () => {
    const next = renameNode(load(), "splitter", "planner");
    expect(node(next, "worker_research").prompt).toContain("{{planner.worker_research}}");
    expect(next.edges.some((e) => e.from === "planner")).toBe(true);
    expect(validateGraph(next)).toEqual([]);
  });
});

describe("layout and waves", () => {
  it("puts the four workers in one layer and gives every node a position", () => {
    const graph = load();
    const layers = computeLayers(graph);
    expect(["worker_research", "worker_compare", "worker_check", "worker_gaps"].map((id) => layers.get(id))).toEqual([2, 2, 2, 2]);
    expect(layers.get("merger")).toBe(4);
    expect(executionWaves(graph).map((wave) => wave.length)).toEqual([1, 1, 4, 1, 1]);
    expect(layoutGraph(graph).positions.size).toBe(8);
  });

  it("flows top to bottom in TB mode, with the four workers side by side", () => {
    const graph = load();
    const lr = layoutGraph(graph, "LR");
    const tb = layoutGraph(graph, "TB");
    expect(tb.direction).toBe("TB");
    expect(lr.width).toBeGreaterThan(lr.height);
    const workers = ["worker_research", "worker_compare", "worker_check", "worker_gaps"].map((id) => tb.positions.get(id)!);
    expect(new Set(workers.map((p) => p.y)).size).toBe(1);
    expect(tb.positions.get("merger")!.y).toBeGreaterThan(tb.positions.get("verifier")!.y);
  });
});

describe("buildExportKit", () => {
  const files = buildExportKit(load());
  const file = (suffix: string) => files.find((f) => f.path.endsWith(suffix))!.content;

  it("produces a Claude Code skill, one subagent per node, a Cursor rule and the graph source", () => {
    const paths = files.map((f) => f.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        ".claude/skills/parallel-system-audit/SKILL.md",
        ".claude/skills/parallel-system-audit/graph.skill.md",
        ".claude/agents/parallel-system-audit-worker-research.md",
        ".cursor/rules/parallel-system-audit.mdc",
        "README.md",
      ])
    );
    expect(paths.filter((p) => p.startsWith(".claude/agents/"))).toHaveLength(7);
  });

  it("writes the plan with parallel stages, hand-offs, contracts, gate handling and handoff rules", () => {
    const skill = file("/SKILL.md");
    expect(skill).toContain("### Stage 2 · 4 steps in parallel");
    expect(skill).toContain("only the `worker_research` value from the JSON of SPLIT (`splitter`)");
    expect(skill).toMatch(/VERIFIER \(Fresh Context\)\*\* \(`verifier`\) → subagent `parallel-system-audit-verifier` · fresh context/);
    expect(skill).toContain("On `GATE: FAIL`: re-run only the steps it names, handing each its previous output and its line of the verdict; keep every other output (at most 1 time)");
    expect(skill).toContain("| `subtask_json` | json |");
    expect(skill).toContain("## Handoff rules");
    expect(skill).not.toContain("{{");
  });

  it("gives each subagent its tools, model, contract and gate", () => {
    const verifier = file("-verifier.md");
    expect(verifier).toContain("name: parallel-system-audit-verifier");
    expect(verifier).toContain("tools: Read, Grep, Glob");
    expect(verifier).toContain("model: opus");
    expect(verifier).toContain("Gate: Every kept claim cites concrete evidence");
    expect(verifier).toContain("`GATE: PASS`");
    expect(verifier).toContain("You start with a fresh context.");
    expect(verifier).not.toContain("{{");
    const splitter = file("-splitter.md");
    expect(splitter).toContain("a single JSON object with these keys (`worker_research`, `worker_compare`, `worker_check`, `worker_gaps`)");
    expect(splitter).toContain("`subtask_json` contract (json)");
  });

  it("omits tools and model when a node inherits them", () => {
    const graph = load(BLANK_GRAPH_SKILL);
    const text = buildSubagent(graph, node(graph, "work"));
    expect(text).not.toMatch(/^tools:/m);
    expect(text).not.toMatch(/^model:/m);
  });

  it("loads less up front than a flat skill", () => {
    const budget = loadBudget(load());
    expect(budget.upFront).toBeLessThan(budget.flat);
    expect(budget.perNode).toHaveLength(7);
  });

  it("slugifies names for Claude Code", () => {
    expect(toSlug("My Skill_Graph!")).toBe("my-skill-graph");
    expect(toSlug("***")).toBe("skill-graph");
  });
});
