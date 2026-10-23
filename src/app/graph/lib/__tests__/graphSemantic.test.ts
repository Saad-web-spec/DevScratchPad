/**
 * The gate model in the connector: the real int8 model in models/sg-sem, run the way the route runs it.
 * These are the gates the model was shown to read right before it shipped (MEMORY.md, msmarco-6): a judgement
 * of how someone will feel is flagged; a starter's own gate and a short checkable one are not.
 */
import { describe, expect, it, vi } from "vitest";
import { callConnectorTool, checkedSource } from "../graphConnector";
import { gateVerdicts, type GateVerdict } from "../graphSemantic";
import { handleBodyWithChecks } from "../mcpProtocol";
import { encodeShareHash } from "../graphShare";
import { parseGraphSkill } from "../graphSkill";
import { SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";

const context = { studioUrl: "https://www.devscratchpad.tech/graph/studio" };
const STARTER_GATE = "No blocking finding is left open, and every finding cites a line of the diff.";
const VAGUE = "The user will be happy with the result and find it useful.";
const SHORT_BUT_CHECKABLE = "All tests pass.";

function withGate(gate: string): string {
  const source = SHIP_CHANGE_GRAPH_SKILL.replace(STARTER_GATE, gate);
  expect(source).not.toBe(SHIP_CHANGE_GRAPH_SKILL);
  return source;
}

function warnings(result: ReturnType<typeof callConnectorTool>): string[] {
  const data = result?.structuredContent as { warnings: { code: string; step?: string }[] } | undefined;
  return (data?.warnings ?? []).map((warning) => `${warning.code}:${warning.step ?? ""}`);
}

describe("gate verdicts from the model", () => {
  it("flags a gate that judges how someone will feel, and not a starter's gate or a short checkable one", async () => {
    const verdicts = await gateVerdicts([withGate(VAGUE), SHIP_CHANGE_GRAPH_SKILL, withGate(SHORT_BUT_CHECKABLE)], 20_000, 20_000);
    expect(verdicts).not.toBeNull();
    const byGate = new Map((verdicts as GateVerdict[]).map((verdict) => [verdict.gate, verdict]));
    expect(byGate.get(VAGUE)).toMatchObject({ step: "gate", label: "not", flagged: true });
    expect(byGate.get(STARTER_GATE)).toMatchObject({ step: "gate", flagged: false });
    expect(byGate.get(SHORT_BUT_CHECKABLE)).toMatchObject({ step: "gate", flagged: false });
    for (const verdict of byGate.values()) expect(verdict.score).toBeGreaterThanOrEqual(0);
  }, 30_000);

  it("gives up within the budget rather than hold a tool call", async () => {
    expect(await gateVerdicts([SHIP_CHANGE_GRAPH_SKILL], 0)).toSatisfy((value: GateVerdict[] | null) => value === null || value.length === 0);
  });

  it("on a cold instance answers at once without the model, and has it for the next call; initialize warms it first", async () => {
    vi.resetModules();
    const cold = await import("../graphSemantic");
    const started = Date.now();
    expect(await cold.gateVerdicts([withGate(VAGUE)])).toBeNull();
    expect(Date.now() - started).toBeLessThan(500);
    expect(await cold.gateVerdicts([withGate(VAGUE)], 20_000)).toMatchObject([{ flagged: true }]);

    vi.resetModules();
    const protocol = await import("../mcpProtocol");
    const semantic = await import("../graphSemantic");
    const kept: Promise<void>[] = [];
    await protocol.handleBodyWithChecks({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, context, (work) => kept.push(work));
    expect(kept).toHaveLength(1);
    await kept[0];
    // Loaded by the time the route's after() lets the function go: the first check needs no wait.
    expect(await semantic.gateVerdicts([withGate(VAGUE)], 50)).toMatchObject([{ flagged: true }]);
    await protocol.handleBodyWithChecks({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_graph_format", arguments: {} } }, context, (work) => kept.push(work));
    expect(kept).toHaveLength(1);
    await protocol.handleBodyWithChecks({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "validate_graph", arguments: { source: withGate(VAGUE) } } }, context, (work) => kept.push(work));
    expect(kept).toHaveLength(2);
  }, 60_000);

  it("names the graph each tool checks: as given, drafted, edited or decoded from a link", () => {
    expect(checkedSource("validate_graph", { source: SHIP_CHANGE_GRAPH_SKILL })).toBe(SHIP_CHANGE_GRAPH_SKILL);
    expect(checkedSource("validate_graph", { source: "" })).toBeNull();
    expect(checkedSource("get_graph_format", {})).toBeNull();
    const edited = checkedSource("edit_graph", { source: SHIP_CHANGE_GRAPH_SKILL, operations: [{ op: "set_step", id: "gate", fields: { gate: VAGUE } }] });
    expect(edited).toContain(VAGUE);
    expect(parseGraphSkill(edited ?? "").graph?.nodes.find((node) => node.id === "gate")?.gate).toBe(VAGUE);
    const drafted = checkedSource("draft_graph", { name: "x", description: "Does x.", steps: [{ id: "a", type: "worker", task: "Do the thing and return a list." }, { id: "b", type: "verifier", reads: ["a"], task: "Check the list and say PASS or FAIL.", gate: VAGUE }] });
    expect(drafted).toContain(VAGUE);
    expect(checkedSource("read_studio_link", { link: `https://www.devscratchpad.tech/graph/studio${encodeShareHash({ source: SHIP_CHANGE_GRAPH_SKILL })}` })).toBe(SHIP_CHANGE_GRAPH_SKILL);
  });
});

describe("the connector with gate verdicts", () => {
  const vague = withGate(VAGUE);

  it("replaces gate-vague with the model's warning for a gate it scored, and keeps the rules for one it did not", () => {
    const short = withGate(SHORT_BUT_CHECKABLE);
    expect(warnings(callConnectorTool("validate_graph", { source: short }, context))).toContain("gate-vague:gate");
    const scored = { ...context, gateVerdicts: [{ step: "gate", gate: SHORT_BUT_CHECKABLE, label: "checkable" as const, score: 0.02, flagged: false }] };
    expect(warnings(callConnectorTool("validate_graph", { source: short }, scored))).not.toContain("gate-vague:gate");
    const flagged = { ...context, gateVerdicts: [{ step: "gate", gate: VAGUE, label: "not" as const, score: 0.97, flagged: true }] };
    const result = callConnectorTool("validate_graph", { source: vague }, flagged);
    expect(warnings(result)).toContain("semantic-gate-uncheckable:gate");
    expect(result?.content[0].text).toContain("confidence 0.97");
    // A verdict for another gate text is not applied.
    expect(warnings(callConnectorTool("validate_graph", { source: short }, flagged))).toContain("gate-vague:gate");
  });

  it("scores the graph before the tool runs, end to end", async () => {
    const response = await handleBodyWithChecks({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "validate_graph", arguments: { source: vague } } }, context);
    const result = (response as { result: { content: { text: string }[]; structuredContent: { warnings: { code: string }[] } } }).result;
    expect(result.structuredContent.warnings.map((warning) => warning.code)).toContain("semantic-gate-uncheckable");
    expect(result.content[0].text).toContain("[semantic-gate-uncheckable] step gate:");
    const drafted = await handleBodyWithChecks(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "draft_graph", arguments: { name: "x", description: "Does x.", steps: [{ id: "a", type: "worker", task: "Do the thing and return a list." }, { id: "b", type: "verifier", reads: ["a"], task: "Check the list and say PASS or FAIL.", gate: VAGUE }] } } },
      context
    );
    expect(JSON.stringify(drafted)).toContain("semantic-gate-uncheckable");
  }, 30_000);
});
