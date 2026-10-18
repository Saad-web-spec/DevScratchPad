/**
 * Canvas layout and the topology helpers around it: edges that skip layers get a lane of their own
 * instead of crossing cards, group aliases mean the nodes feeding a step, and the serializer writes
 * each edge once and in order.
 */
import { describe, expect, it } from "vitest";
import { BLUEPRINTS, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  ROUTE_LANE,
  addEdge,
  addNode,
  computeLayers,
  connectableSources,
  layoutGraph,
  parseGraphSkill,
  promptInputs,
  resolveGroup,
  serializeGraphSkill,
  updateNode,
  validateGraph,
  type GraphNode,
  type LayoutDirection,
  type SkillGraph,
} from "../graphSkill";
import { buildSubagent } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((node) => node.id === id) as GraphNode;

/** True when a lane through the column at `p` touches the card at `card`. */
function laneHitsCard(p: { x: number; y: number }, card: { x: number; y: number }, direction: LayoutDirection): boolean {
  const half = ROUTE_LANE / 2;
  if (direction === "LR") return p.x + NODE_WIDTH / 2 > card.x && p.x - NODE_WIDTH / 2 < card.x + NODE_WIDTH && p.y + half > card.y && p.y - half < card.y + NODE_HEIGHT;
  return p.y + NODE_HEIGHT / 2 > card.y && p.y - NODE_HEIGHT / 2 < card.y + NODE_HEIGHT && p.x + half > card.x && p.x - half < card.x + NODE_WIDTH;
}

describe("layer-skipping edges", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);

  it("get one lane in every column they pass", () => {
    const layers = computeLayers(ship);
    const layout = layoutGraph(ship);
    expect([...layout.routes.keys()].sort()).toEqual(["diff->gate", "gate->publish"]);
    for (const [key, lanes] of layout.routes) {
      const [from, to] = key.split("->");
      expect(lanes).toHaveLength((layers.get(to) as number) - (layers.get(from) as number) - 1);
    }
  });

  it.each(BLUEPRINTS.flatMap((blueprint) => (["LR", "TB"] as const).map((direction) => [blueprint.id, direction, blueprint.source] as const)))(
    "%s (%s): no lane runs through a card",
    (_id, direction, source) => {
      const layout = layoutGraph(load(source), direction);
      for (const lanes of layout.routes.values()) {
        for (const lane of lanes) for (const card of layout.positions.values()) expect(laneHitsCard(lane, card, direction)).toBe(false);
      }
    }
  );

  it("make room inside the layout's bounds", () => {
    for (const direction of ["LR", "TB"] as const) {
      const layout = layoutGraph(ship, direction);
      for (const lane of [...layout.routes.values()].flat()) {
        expect(lane.x).toBeGreaterThanOrEqual(0);
        expect(lane.y).toBeGreaterThanOrEqual(0);
        expect(lane.x).toBeLessThanOrEqual(layout.width);
        expect(lane.y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it("keep short edges unrouted and centre a lone card on its neighbours", () => {
    const layout = layoutGraph(ship);
    expect(layout.routes.has("goal->plan")).toBe(false);
    const centre = (id: string) => (layout.positions.get(id) as { y: number }).y + NODE_HEIGHT / 2;
    // diff fans out to the two reviewers (and the gate's lane), so it sits level between the reviewers.
    expect(centre("diff")).toBeGreaterThan(Math.min(centre("review_correctness"), centre("review_security")));
    expect(centre("diff")).toBeLessThan(Math.max(centre("review_correctness"), centre("review_security")));
  });
});

describe("group aliases mean the nodes feeding the step", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);
  // implement, review_correctness and review_security are all workers; the gate reads only the reviews.
  const gate = updateNode(ship, "gate", { prompt: "Diff:\n{{diff.output}}\n\nReviews:\n{{workers.output}}" });

  it("resolves to the direct predecessors of that type first", () => {
    expect(resolveGroup(gate, "workers", nodeOf(gate, "gate")).map((n) => n.id)).toEqual(["review_correctness", "review_security"]);
    expect(resolveGroup(gate, "workers").map((n) => n.id)).toEqual(["implement", "review_correctness", "review_security"]);
    expect(validateGraph(gate)).toEqual([]);
    expect(buildSubagent(gate, nodeOf(gate, "gate"))).toContain("the outputs of the workers (`review_correctness`, `review_security`, in your task message)");
  });

  it("falls back to upstream nodes of the type, then flags a group that only runs after the step", () => {
    const publish = updateNode(ship, "publish", { prompt: "Summarise {{workers.output}}, then open the pull request." });
    expect(resolveGroup(publish, "workers", nodeOf(publish, "publish")).map((n) => n.id)).toEqual(["implement", "review_correctness", "review_security"]);
    // review_security has no worker edge, but implement is upstream of it.
    const reviewer = updateNode(ship, "review_security", { prompt: "Review {{diff.output}} against {{workers.output}}." });
    expect(resolveGroup(reviewer, "workers", nodeOf(reviewer, "review_security")).map((n) => n.id)).toEqual(["implement"]);
    const early = updateNode(ship, "plan", { prompt: "Plan {{goal}} using {{workers.output}}." });
    expect(validateGraph(early).some((issue) => issue.code === "ref-not-upstream" && issue.nodeId === "plan")).toBe(true);
  });

  it("offers the alias in Insert input whenever several nodes of a type feed the step", () => {
    expect(promptInputs(ship, nodeOf(ship, "gate")).map((input) => input.ref)).toContain("{{workers.output}}");
  });

  it("never treats {{inputs}} as the group of input nodes", () => {
    expect(resolveGroup(ship, "inputs")).toEqual([]);
    expect(resolveGroup(ship, "goal")).toEqual([]);
  });
});

describe("serializeGraphSkill edges", () => {
  it("writes a repeated edge once", () => {
    const base = load(SHIP_CHANGE_GRAPH_SKILL);
    const doubled = { ...base, edges: [...base.edges, { from: "goal", to: "plan" }] };
    const again = load(serializeGraphSkill(doubled));
    expect(again.edges.filter((edge) => edge.from === "goal" && edge.to === "plan")).toHaveLength(1);
    expect(again.edges).toHaveLength(base.edges.length);
  });

  it("keeps each source's target order when sources share targets", () => {
    let graph = load(SHIP_CHANGE_GRAPH_SKILL);
    const extra = addNode(graph, "worker", "goal");
    graph = addEdge(addEdge(extra.graph, extra.id, "review_security"), extra.id, "review_correctness");
    graph = addEdge(addEdge(graph, "plan", "review_correctness"), "plan", "review_security");
    const again = load(serializeGraphSkill(graph));
    const targets = (from: string) => again.edges.filter((edge) => edge.from === from && edge.to.startsWith("review_")).map((edge) => edge.to);
    expect(targets(extra.id)).toEqual(["review_security", "review_correctness"]);
    expect(targets("plan")).toEqual(["review_correctness", "review_security"]);
  });
});

describe("connectableSources (Inspector: Connect from…)", () => {
  const ship = load(SHIP_CHANGE_GRAPH_SKILL);
  const ids = (id: string) => connectableSources(ship, id).map((node) => node.id);

  it("offers every step before or beside the node that does not feed it yet", () => {
    expect(ids("review_security")).toEqual(["goal", "plan", "implement", "review_correctness"]);
  });

  it("never offers the node itself or anything after it, which would make a cycle", () => {
    expect(ids("plan")).toEqual([]);
    expect(ids("diff")).not.toContain("gate");
  });

  it("offers nothing for the input, which cannot receive edges", () => {
    expect(ids("goal")).toEqual([]);
  });
});
