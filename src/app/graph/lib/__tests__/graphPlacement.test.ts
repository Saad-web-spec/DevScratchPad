/**
 * Hand-placed cards: dragging a card pins the layout, positions round-trip through `layout:` in the
 * frontmatter, follow renames and removals, and new cards find a free spot next to their source.
 */
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import {
  LAYOUT_GRID,
  NODE_HEIGHT,
  NODE_WIDTH,
  addNode,
  canvasLayout,
  clearPositions,
  layoutGraph,
  moveNode,
  parseGraphSkill,
  removeNode,
  renameNode,
  serializeGraphSkill,
  type SkillGraph,
} from "../graphSkill";
import { buildClaudeOrchestrator } from "../graphExport";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const ship = load(SHIP_CHANGE_GRAPH_SKILL);
const onScreen = layoutGraph(ship).positions;
const moved = moveNode(ship, "gate", { x: 1203, y: -77 }, onScreen);

describe("moving a card", () => {
  it("pins every card where it was and snaps the moved one to the grid", () => {
    expect(Object.keys(moved.positions ?? {})).toEqual(ship.nodes.map((node) => node.id));
    expect(moved.positions?.gate).toEqual({ x: 1200, y: -80 });
    expect(moved.positions?.plan).toEqual({ x: Math.round((onScreen.get("plan") as { x: number }).x), y: Math.round((onScreen.get("plan") as { y: number }).y) });
    expect((moved.positions?.gate.x ?? 0) % LAYOUT_GRID).toBe(0);
  });

  it("is drawn where it was put, with edges leaving from the side that faces their target", () => {
    const layout = canvasLayout(moved);
    expect(layout.manual).toBe(true);
    expect(layout.positions.get("gate")).toEqual({ x: 1200, y: -80 });
    expect(layout.minY).toBe(-80);
    expect(layout.routes.size).toBe(0);
    expect(canvasLayout(ship).manual).toBe(false);
  });

  it("round-trips through the frontmatter as one line per card, after everything else", () => {
    const source = serializeGraphSkill(moved);
    expect(source).toContain("layout:\n  positions:\n");
    expect(source).toContain("    gate: 1200, -80\n");
    expect(source.indexOf("layout:")).toBeGreaterThan(source.indexOf("contracts:"));
    expect(load(source).positions).toEqual(moved.positions);
    // The agent never sees it: the compiled skill is the same with or without a placement.
    expect(buildClaudeOrchestrator(load(source))).toBe(buildClaudeOrchestrator(ship));
  });

  it("ignores malformed or out-of-range positions and accepts a [x, y] pair", () => {
    const source = SHIP_CHANGE_GRAPH_SKILL.replace("\n---\n", "\nlayout:\n  positions:\n    plan: [10, 20]\n    gate: lots\n    diff: 1e9, 0\n    \"bad id\": 1, 2\n---\n");
    expect(load(source).positions).toEqual({ plan: { x: 10, y: 20 } });
  });

  it("follows a rename, forgets a removed card and clears with tidy", () => {
    expect(renameNode(moved, "gate", "verify").positions?.verify).toEqual({ x: 1200, y: -80 });
    expect(renameNode(moved, "gate", "verify").positions?.gate).toBeUndefined();
    expect(removeNode(moved, "gate").positions?.gate).toBeUndefined();
    expect(clearPositions(moved).positions).toBeUndefined();
    expect(serializeGraphSkill(clearPositions(moved))).not.toContain("layout:");
  });
});

describe("a new card on a hand-placed canvas", () => {
  it("goes to the right of the step it connects from, below any card already there", () => {
    const { graph, id } = addNode(moved, "worker", "plan");
    const layout = canvasLayout(graph);
    const plan = layout.positions.get("plan") as { x: number; y: number };
    const placed = layout.positions.get(id) as { x: number; y: number };
    expect(placed.x).toBeGreaterThan(plan.x + NODE_WIDTH);
    for (const [other, position] of layout.positions) {
      if (other === id) continue;
      const apart = Math.abs(position.x - placed.x) >= NODE_WIDTH || Math.abs(position.y - placed.y) >= NODE_HEIGHT;
      expect(apart).toBe(true);
    }
  });

  it("goes below everything when it connects to nothing", () => {
    const blank = load(BLANK_GRAPH_SKILL);
    const pinned = moveNode(blank, blank.nodes[0].id, { x: 0, y: 0 }, layoutGraph(blank).positions);
    const { graph, id } = addNode(pinned, "worker");
    const layout = canvasLayout(graph);
    const lowest = Math.max(...pinned.nodes.map((node) => (layout.positions.get(node.id) as { y: number }).y));
    expect((layout.positions.get(id) as { y: number }).y).toBeGreaterThan(lowest);
  });
});
