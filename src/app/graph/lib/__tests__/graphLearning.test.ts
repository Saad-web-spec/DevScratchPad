/**
 * Retry targets, checked contracts and the experience file: where a failed loop restarts, contracts a
 * program checks, and lessons a skill keeps between runs and the studio bakes into prompts.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLANK_GRAPH_SKILL, SHIP_CHANGE_GRAPH_SKILL } from "../graphTemplates";
import { addNode, parseGraphSkill, removeNode, renameNode, retryPath, serializeGraphSkill, updateContract, updateNode, validateGraph, type GraphNode, type SkillGraph } from "../graphSkill";
import { contractChecks, experiencePath, nodeInstructions, previewNodeContext, requiredKeysCommand } from "../graphPlan";
import { SKILL_GRAPH_GITIGNORE, buildClaudeOrchestrator, buildExportKit, buildReflectSubagent, buildSingleFileSkill } from "../graphExport";
import { BAKED_HEADING, bakeLesson, isOrphanLesson, parseLessons, serializeLessons } from "../graphLessons";

function load(source: string): SkillGraph {
  const { graph, fatal } = parseGraphSkill(source);
  if (!graph) throw new Error(fatal ?? "parse failed");
  return graph;
}

const nodeOf = (graph: SkillGraph, id: string) => graph.nodes.find((n) => n.id === id) as GraphNode;
const codes = (graph: SkillGraph) => validateGraph(graph).map((issue) => issue.code);
const ship = load(SHIP_CHANGE_GRAPH_SKILL);
/** The template without learning or a retry target, as a base for each case. */
const plain = updateNode({ ...ship, experience: undefined }, "gate", { retryTarget: undefined });

describe("retry_target", () => {
  it("parses, saves and survives a round trip", () => {
    expect(nodeOf(ship, "gate").retryTarget).toBe("implement");
    expect(serializeGraphSkill(ship)).toContain("retry_target: implement");
    expect(load(serializeGraphSkill(ship)).nodes).toEqual(ship.nodes);
  });

  it("re-runs the target and every step between it and the node", () => {
    expect(retryPath(ship, nodeOf(ship, "gate"))?.map((n) => n.id)).toEqual(["implement", "diff", "review_correctness", "review_security"]);
    expect(retryPath(plain, nodeOf(plain, "gate"))).toBeNull();
  });

  it("follows a rename and is cleared when its node is removed", () => {
    expect(nodeOf(renameNode(ship, "implement", "build"), "gate").retryTarget).toBe("build");
    expect(nodeOf(removeNode(ship, "implement"), "gate").retryTarget).toBeUndefined();
  });

  it("rejects a target that is missing, downstream or not a model step", () => {
    expect(codes(updateNode(plain, "gate", { retryTarget: "nope" }))).toContain("retry-target-unknown");
    expect(codes(updateNode(plain, "implement", { retryTarget: "gate" }))).toContain("retry-target-unknown");
    expect(codes(updateNode(plain, "gate", { retryTarget: "diff" }))).toContain("retry-target-not-model");
    expect(codes(ship)).not.toContain("retry-target-unknown");
  });

  it("refuses to re-run an irreversible step and warns before asking for approval again", () => {
    const risky = updateNode(updateNode(plain, "review_security", { risk: "irreversible" }), "gate", { retryTarget: "implement" });
    expect(codes(risky)).toContain("retry-path-irreversible");
    const asksAgain = updateNode(plain, "publish", { gate: "Opened.", onFail: "retry", retryTarget: "implement" });
    expect(codes(asksAgain)).toContain("retry-path-approval");
  });

  it("warns when the node never retries", () => {
    expect(codes(updateNode(plain, "gate", { retryTarget: "implement", onFail: "stop" }))).toContain("retry-target-unused");
  });

  it("tells the gate which steps it may name, and what to re-run when it names none", () => {
    const gate = nodeInstructions(ship, nodeOf(ship, "gate")).join("\n");
    expect(gate).toContain("Steps you can name: `implement` (edits files), `review_correctness`, `review_security`.");
    expect(buildClaudeOrchestrator(ship)).toContain("If it names no step, or none you can read, re-run IMPLEMENT (loops on tests) (`implement`).");
  });

  it("restarts a failed check and a failed command at the target", () => {
    const checked = updateNode(plain, "review_security", { check: "npm audit", onFail: "retry", retryTarget: "implement" });
    expect(buildClaudeOrchestrator(checked)).toContain(
      "If the check fails: re-run IMPLEMENT (loops on tests) (`implement`), then COLLECT DIFF (`diff`) in that order, handing the first its previous output"
    );
    const command = updateNode(plain, "diff", { onFail: "retry", retryTarget: "plan" });
    expect(buildClaudeOrchestrator(command)).toContain("If it exits non-zero: re-run PLAN (`plan`), then IMPLEMENT (loops on tests) (`implement`) in that order");
  });
});

describe("checked contracts", () => {
  const graph = updateContract(plain, "change_plan", { format: "json", description: "The plan.", required: ["files", "steps"], check: "node validate.mjs {{payload}}" });

  it("parses, saves and survives a round trip", () => {
    const again = load(serializeGraphSkill(graph));
    expect(again.contracts.change_plan).toEqual({ format: "json", description: "The plan.", required: ["files", "steps"], check: "node validate.mjs {{payload}}" });
  });

  it("puts the generated key check, then the contract's own check, on the producing step", () => {
    const [check] = contractChecks(graph, nodeOf(graph, "plan"));
    expect(check.path).toBe(".skill-graph/ship-a-change/plan.json");
    expect(check.commands[0]).toMatch(/^node -e ".*" \.skill-graph\/ship-a-change\/plan\.json$/);
    expect(check.commands[1]).toBe("node validate.mjs .skill-graph/ship-a-change/plan.json");
    const skill = buildClaudeOrchestrator(graph);
    expect(skill).toContain("Contract check (`change_plan`): save its output to `.skill-graph/ship-a-change/plan.json`");
    expect(skill).toContain("If a contract check fails: re-run this step once with its previous answer and the error output.");
  });

  it("generates a key check that really passes and fails in the shell", () => {
    const dir = mkdtempSync(join(tmpdir(), "skill-graph-"));
    const run = (payload: string) => {
      const file = join(dir, "payload.json");
      writeFileSync(file, payload);
      try {
        execSync(requiredKeysCommand(["files", "steps"], JSON.stringify(file)), { stdio: "pipe" });
        return "pass";
      } catch (error) {
        return String((error as { stderr?: Buffer }).stderr ?? "");
      }
    };
    expect(run('{"files": [], "steps": []}')).toBe("pass");
    expect(run('{"files": []}')).toContain("Missing keys: steps");
    expect(run("[1, 2]")).toContain("Missing keys: files, steps");
    expect(run("not json")).not.toBe("pass");
  });

  it("flags keys on a non-JSON contract, unsafe key names and a check that ignores the payload", () => {
    expect(codes(updateContract(plain, "diff_text", { format: "text", description: "", required: ["a"] }))).toContain("required-not-json");
    expect(codes(updateContract(plain, "change_plan", { format: "json", description: "", required: ["a'; rm -rf ~"] }))).toContain("contract-bad-key");
    expect(codes(updateContract(plain, "change_plan", { format: "json", description: "", check: "npm test" }))).toContain("contract-check-no-payload");
    expect(codes(graph).filter((code) => code.startsWith("contract-") || code === "required-not-json")).toEqual([]);
  });
});

describe("experience file", () => {
  it("reads every way of turning it on, and clamps the lesson cap", () => {
    const withExperience = (value: string) => load(BLANK_GRAPH_SKILL.replace("spec: skill-graph/1", `spec: skill-graph/1\nexperience:${value}`)).experience;
    expect(withExperience("")).toEqual({ maxLessons: 20 });
    expect(withExperience(" true")).toEqual({ maxLessons: 20 });
    expect(withExperience("\n  max_lessons: 500")).toEqual({ maxLessons: 50 });
    expect(withExperience(" false")).toBeUndefined();
    expect(load(BLANK_GRAPH_SKILL).experience).toBeUndefined();
    expect(load(serializeGraphSkill(ship)).experience).toEqual({ maxLessons: 20 });
  });

  it("loads lessons before stage 1 and runs the reflect step after the last stage", () => {
    const skill = buildClaudeOrchestrator(ship);
    expect(skill).toContain("### Before stage 1 · lessons");
    expect(skill).toContain("Read `.skill-graph/ship-a-change/EXPERIENCE.md` if it exists");
    expect(skill).toContain("keep a failure log");
    expect(skill).toContain("**Reflect** → subagent `ship-a-change-reflect` · fresh context");
    expect(skill.indexOf("### After the last stage · learn")).toBeLessThan(skill.indexOf("## Final answer"));
    // Fresh-context steps get only their "Hand it" line, so the lessons must be on it.
    expect(skill).toContain(
      "Hand it: the output of COLLECT DIFF (`diff`); the output of REVIEW: Correctness (`review_correctness`); the output of REVIEW: Security (`review_security`); its lessons from earlier runs, if any. Nothing else"
    );
    expect(buildClaudeOrchestrator(plain)).not.toContain("lessons");
  });

  it("compiles a read-only reflect agent that learns from hard signals only", () => {
    const reflect = buildReflectSubagent(ship);
    expect(reflect).toContain("tools: Read\nmodel: haiku");
    expect(reflect).toContain("Never write one from your own reading of the outputs.");
    expect(reflect).toContain("Keep at most 20 lessons.");
    expect(reflect).toContain("Use one of these ids: `plan`, `implement`, `review_correctness`, `review_security`, `gate`, `publish`.");
    expect(buildSingleFileSkill(ship)).toContain("### Reflect (`reflect`)");
  });

  it("ships the ignore file that keeps the lessons and drops the payloads", () => {
    const kit = buildExportKit(ship);
    expect(kit.find((file) => file.path === ".skill-graph/.gitignore")?.content).toBe(SKILL_GRAPH_GITIGNORE);
    expect(SKILL_GRAPH_GITIGNORE).toContain("/*/*\n!/*/EXPERIENCE.md");
    expect(kit.find((file) => file.path === "README.md")?.content).toContain("## Learning from runs");
    expect(buildExportKit(plain).some((file) => file.path.startsWith(".skill-graph/"))).toBe(false);
  });

  it("tells each step about its lessons and shows them in the preview", () => {
    expect(nodeInstructions(ship, nodeOf(ship, "implement")).join("\n")).toContain("Lessons are advice");
    expect(previewNodeContext(ship, nodeOf(ship, "implement")).user).toContain(`### Lessons from earlier runs\n⟨lessons for implement from ${experiencePath(ship)}, if any⟩`);
    expect(nodeInstructions(plain, nodeOf(plain, "implement")).join("\n")).not.toContain("Lessons");
  });

  it("reserves the names it uses, and warns when nothing could ever fail", () => {
    const { graph: named } = addNode(ship, "worker");
    expect(codes(renameNode(named, nodeOf(named, "worker").id, "Experience"))).toContain("experience-id-reserved");
    expect(codes(renameNode(named, nodeOf(named, "worker").id, "reflect"))).toContain("experience-id-reserved");
    const blank = { ...load(BLANK_GRAPH_SKILL), experience: { maxLessons: 20 } };
    expect(codes(blank)).toContain("experience-no-signal");
    expect(codes(ship)).not.toContain("experience-no-signal");
  });
});

describe("lessons in the studio", () => {
  const file = [
    "# Lessons: ship-a-change",
    "",
    "- [L3] implement: Run `npm run lint` before returning. Unused imports fail the gate.",
    '  evidence: gate FAIL "unused import in src/foo.ts" · seen 3 · helped 2',
    "- [L4] diff: Something about a command step.",
    "- [L7] gone: A step that was removed.",
    "  evidence: check failed · seen 1 · helped 0",
    "Some text the agent added.",
    "",
  ].join("\n");
  const lessons = parseLessons(file);

  it("reads lessons with their evidence and counters, and skips other lines", () => {
    expect(lessons).toHaveLength(3);
    expect(lessons[0]).toEqual({ number: 3, step: "implement", rule: "Run `npm run lint` before returning. Unused imports fail the gate.", evidence: 'gate FAIL "unused import in src/foo.ts"', seen: 3, helped: 2 });
    expect(lessons[1]).toMatchObject({ number: 4, step: "diff", evidence: "", seen: 0, helped: 0 });
  });

  it("writes the same lessons back", () => {
    expect(parseLessons(serializeLessons(ship, lessons))).toEqual(lessons.map((lesson) => ({ ...lesson, evidence: lesson.evidence || "-" })));
  });

  it("marks lessons for missing or non-model steps", () => {
    expect(lessons.map((lesson) => isOrphanLesson(ship, lesson))).toEqual([false, true, true]);
  });

  it("bakes a rule into its step's prompt once, under one heading", () => {
    const baked = bakeLesson(ship, lessons[0]);
    const prompt = nodeOf(baked, "implement").prompt;
    expect(prompt.endsWith(`${BAKED_HEADING}\n- Run \`npm run lint\` before returning. Unused imports fail the gate.`)).toBe(true);
    expect(bakeLesson(baked, lessons[0])).toEqual(baked);
    const second = bakeLesson(baked, { ...lessons[0], number: 9, rule: "Keep the diff small." });
    expect(nodeOf(second, "implement").prompt.split(BAKED_HEADING)).toHaveLength(2);
    expect(load(serializeGraphSkill(second)).nodes).toEqual(second.nodes);
  });

  it("keeps a baked rule from reading as a reference to another step", () => {
    const baked = bakeLesson(ship, { ...lessons[0], rule: "Use {{plan.output}} as the source." });
    expect(nodeOf(baked, "implement").prompt).toContain("Use { {plan.output} } as the source.");
    expect(codes(baked)).not.toContain("unknown-ref");
  });
});
