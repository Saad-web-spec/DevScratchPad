/**
 * The Skill Graph connector's tools: what Claude can do with the studio through MCP.
 *
 * Every tool is read-only and stateless. A graph comes in as `graph.skill.md` text, is checked or
 * compiled in memory, and goes back as text or as a studio link with the graph in the URL hash.
 * Nothing is stored or logged, so this module has no I/O; the route handler only moves JSON.
 */
import { DRAFT_INPUT_ID, DRAFT_MAX_ITEMS, DRAFT_STEP_TYPES, MAX_DRAFT_STEPS, draftGraph } from "./graphDraft";
import { EDIT_OPERATIONS, MAX_EDIT_OPERATIONS, STEP_FIELDS, editGraph } from "./graphEdit";
import { buildCursorRule, buildExportKit, buildSingleFileSkill, handOff, toSlug } from "./graphExport";
import { MAX_LESSONS_SOURCE, bakeLesson, isOrphanLesson, parseLessons, serializeLessons } from "./graphLessons";
import { buildPlan } from "./graphPlan";
import { graphFormatReference } from "./graphReference";
import { advanceRun, startRun, type RunAnswer } from "./graphRun";
import { MAX_HASH_LENGTH, SHARE_URL_SOFT_LIMIT, decodeShareHash, encodeShareHash } from "./graphShare";
import { dryRunGraph } from "./graphSimulate";
import {
  DEFAULT_MAX_ITERATIONS,
  LOOP_ITERATIONS_CAP,
  LOOP_UNTILS,
  MAX_SOURCE_LENGTH,
  PROBE_MAX,
  PROBE_MIN,
  findOrphanSections,
  parseGraphSkill,
  runsWithoutSubagent,
  serializeGraphSkill,
  validateGraph,
  type GraphIssue,
  type SkillGraph,
} from "./graphSkill";
import { BLUEPRINTS } from "./graphTemplates";

export interface ToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface ConnectorTool {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
  /** Shape of `structuredContent` on every result that is not an error (MCP 2025-06-18 and later). */
  outputSchema?: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  annotations: ToolAnnotations;
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  /** The same answer as data, matching the tool's outputSchema. Clients that predate it read the text. */
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface ConnectorContext {
  /** Absolute URL of the studio page, e.g. https://www.devscratchpad.tech/graph/studio. */
  studioUrl: string;
  /** Absolute URL of the kit download page, e.g. https://www.devscratchpad.tech/graph/download. */
  downloadUrl?: string;
}

/** None of the tools change anything anywhere, so every one is annotated the same way. */
function readOnly(title: string): ToolAnnotations {
  return { title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
}

const SOURCE_PROPERTY = {
  type: "string",
  description: "The full graph.skill.md text: YAML frontmatter with topology and contracts, then one ## @node: <id> section per step.",
  maxLength: MAX_SOURCE_LENGTH,
};

export const COMPILE_TARGETS = ["claude_code_kit", "single_skill", "cursor_rule"] as const;
type CompileTarget = (typeof COMPILE_TARGETS)[number];

/**
 * Most of a compiled answer that still arrives whole. Claude's clients cut a tool result past roughly
 * 100,000 characters without saying so; a large kit (100+ steps) is bigger, so its files are sent whole
 * up to this budget and the rest are named with the download link, instead of arriving cut mid-file.
 */
export const MAX_COMPILE_RESULT_CHARS = 80_000;

const ISSUE_SCHEMA = {
  type: "object",
  properties: { code: { type: "string" }, step: { type: "string" }, message: { type: "string" } },
  required: ["code", "message"],
};

/** What the checker found, as data: shared by validate_graph, draft_graph, edit_graph and bake_lessons. */
const CHECK_OUTPUT = {
  valid: { type: "boolean", description: "True when the graph has no errors and can be compiled." },
  fatal: { type: "string", description: "Set when the file could not be read at all." },
  errors: { type: "array", items: ISSUE_SCHEMA },
  warnings: { type: "array", items: ISSUE_SCHEMA },
  stages: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Step ids per stage, in run order; steps in one stage run in parallel." },
};

const SOURCE_OUTPUT = {
  source: { type: "string", description: "The graph.skill.md text." },
  studio_link: { type: "string", description: "A link that opens the graph in the studio; absent when the graph is too large for a link." },
};

const RUN_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    status: { type: "string", enum: ["running", "reflecting", "done", "stopped"] },
    run: { type: "object", description: "The run object to pass to advance_run; absent once the run is over." },
    tasks: { type: "array", items: { type: "object", properties: { id: { type: "string" }, step: { type: "string" }, kind: { type: "string" } }, required: ["id", "step", "kind"] } },
    stop_reason: { type: "string" },
  },
  required: ["status", "tasks"],
};

const EXPERIENCE_PROPERTY = {
  type: "string",
  description: "The skill's EXPERIENCE.md (lessons from earlier runs), as written by its reflect step.",
  maxLength: MAX_LESSONS_SOURCE,
};

export const CONNECTOR_TOOLS: readonly ConnectorTool[] = [
  {
    name: "get_graph_format",
    title: "Get the graph skill format",
    description:
      "Returns the Skill Graph file format (graph.skill.md): node types, node fields, edges and contracts, prompt references, the rules the checker enforces, design guidance and a complete example. Use it before writing or editing a graph skill.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: readOnly("Get the graph skill format"),
  },
  {
    name: "list_graph_templates",
    title: "List starter graphs",
    description: "Lists the starter graphs (blueprints) in Skill Graph, each with an id, a title and a one-line summary. Use it to find a starting point close to the workflow the user wants.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: readOnly("List starter graphs"),
  },
  {
    name: "get_graph_template",
    title: "Get a starter graph",
    description: "Returns the full graph.skill.md source of one starter graph, by the id that list_graph_templates gives.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "The starter graph's id, e.g. ship-a-change.", enum: BLUEPRINTS.map((blueprint) => blueprint.id) } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: readOnly("Get a starter graph"),
  },
  {
    name: "draft_graph",
    title: "Draft a graph from an outline",
    description:
      "Writes a graph.skill.md from a plain outline of the workflow: a name, what it is for, and its steps, each with what it does and which steps it reads from. Fills in the format: the input node, edges, contracts, prompts that reference their inputs, read-only tools and model tiers, and on request fan-out (foreach), probing and file handoffs. Returns the source, the checker's result, what it filled in and what each step receives. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short skill name, e.g. receipt-scanner.", maxLength: 64 },
        description: { type: "string", description: "What the skill does and when to use it, in a sentence.", maxLength: 600 },
        input_label: { type: "string", description: "What the user hands in, e.g. RECEIPT PHOTO OR TEXT. Defaults to REQUEST.", maxLength: 80 },
        steps: {
          type: "array",
          minItems: 1,
          maxItems: MAX_DRAFT_STEPS,
          description: `The steps. A step with no after reads the user's request (the input "${DRAFT_INPUT_ID}"); steps that read the same steps run in parallel.`,
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique id: a letter, then letters, digits, _ or -. E.g. extract_items.", maxLength: 64 },
              type: {
                type: "string",
                enum: [...DRAFT_STEP_TYPES],
                description:
                  "orchestrator splits work (feeding several steps, it hands each its own task), worker does one task, verifier checks work in a fresh context against a gate, synthesizer merges results, agent is a general step, code runs a shell command without a model, approval asks the user.",
              },
              task: { type: "string", description: "What the step does, as instructions to its agent. For code: the shell command. For approval: what to ask the user.", maxLength: 4000 },
              label: { type: "string", description: "Display name on the canvas. Defaults to the id.", maxLength: 80 },
              after: { type: "array", items: { type: "string" }, description: "Ids of the steps whose output this step reads. Empty or missing: it reads the request." },
              returns: { type: "string", description: "What the step hands back, e.g. 'a JSON object with merchant, date, total and items'. Becomes the contract on its outgoing edges.", maxLength: 600 },
              format: { type: "string", enum: ["json", "markdown", "text"], description: "Format of what it returns. Defaults to json when keys are given, else markdown." },
              keys: { type: "array", items: { type: "string" }, description: "JSON only: top-level keys a valid output must have; a command checks them on every run." },
              gate: { type: "string", description: "Verifiers: what must be true for the work to pass, e.g. 'every total equals the sum of its items'.", maxLength: 600 },
              on_fail: { type: "string", enum: ["retry", "stop"], description: "When the gate or command fails: re-run the work before it, or stop. Verifiers default to retry once." },
              tools: { type: "array", items: { type: "string" }, description: "Claude Code tools the step may use, e.g. Read, Grep, WebSearch, WebFetch, Edit, Bash. Defaults to Read, Grep, Glob." },
              model: { type: "string", description: "haiku, sonnet, opus or fable. Defaults: verifier opus, other model steps sonnet." },
              fresh_context: { type: "boolean", description: "Run in a fresh context that sees only its inputs. Defaults to true for verifiers." },
              risk: { type: "string", enum: ["contained", "wide", "irreversible"], description: "Blast radius. Irreversible steps need an approval step before them." },
              split: {
                type: "boolean",
                description:
                  "Orchestrators feeding several steps: true hands each its own task (JSON keyed by step id); false hands all of them the same output. Defaults to true unless the step has keys or returns.",
              },
              foreach: {
                type: "string",
                description: "Fan-out: run this step once per entry of a JSON list, written <step>.<key> (or <step> when its whole output is the list). The step must be in after; each run reads its entry.",
                maxLength: 130,
              },
              max_items: { type: "integer", minimum: 1, maximum: 1000, description: `Fan-out only: stop and ask instead of starting more runs than this. Defaults to ${DRAFT_MAX_ITEMS}.` },
              probe: {
                type: "integer",
                minimum: PROBE_MIN,
                maximum: PROBE_MAX,
                description: `Run ${PROBE_MIN} to ${PROBE_MAX} candidates of this step side by side and let a fresh-context judge keep the best. Only for steps that read (plans, reviews, research), not ones that edit.`,
              },
              probe_hints: { type: "array", items: { type: "string" }, description: "Probed steps: one approach per candidate, in order, e.g. 'The smallest change that works.'" },
              check: { type: "string", description: "Model steps: a shell command that must exit 0 once the step is done, e.g. npm test.", maxLength: 400 },
              loop: {
                type: "object",
                description: "Run the step again on its own output until something holds: until check (its check exits 0), gate (its own gate passes) or done (it says it is finished). Each iteration leaves notes in a ledger file the next iteration and the next run read.",
                properties: {
                  until: { type: "string", enum: [...LOOP_UNTILS] },
                  max_iterations: { type: "integer", minimum: 1, maximum: LOOP_ITERATIONS_CAP, description: `Defaults to ${DEFAULT_MAX_ITERATIONS}.` },
                  ledger: { type: "boolean", description: "Keep the notes file between iterations and runs. Defaults to true." },
                },
                required: ["until"],
                additionalProperties: false,
              },
              max_retries: { type: "integer", minimum: 0, maximum: 3, description: "How many times a failed gate or check re-runs the work. Defaults to 1." },
              retry_target: { type: "string", description: "Where a failed gate or check restarts: the id of a model step before this one." },
            },
            required: ["id", "type", "task"],
            additionalProperties: false,
          },
        },
        handoff: { type: "string", enum: ["inline", "file"], description: "How outputs reach the next steps: inline (pasted into their task, the default) or file (saved to files they read; for large outputs)." },
        experience: { type: "boolean", description: "Learn from runs: failed checks, gates and loop iterations become lessons in EXPERIENCE.md that later runs hand to each step." },
      },
      required: ["name", "description", "steps"],
      additionalProperties: false,
    },
    outputSchema: { type: "object", properties: { ...CHECK_OUTPUT, ...SOURCE_OUTPUT, notes: { type: "array", items: { type: "string" } } }, required: ["valid", "errors", "warnings", "stages", "source"] },
    annotations: readOnly("Draft a graph from an outline"),
  },
  {
    name: "validate_graph",
    title: "Check a graph",
    description:
      "Checks a graph.skill.md with the Skill Graph checker. Returns the errors (which block compiling) and warnings, each with how to fix it, and the stage plan: which steps run in which order and which run in parallel. Besides the wiring, it flags weak prompts: a verifier without a gate, a vague gate, a prompt that never says what to return or never names its inputs, a key a step reads that its source's contract does not require, a contract that describes a different payload than its steps read, and a step that reads only a verifier that never hands on the work it checked. It cannot tell whether a step's task needs data it does not get; dry_run_graph shows what each step sees. Nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY }, required: ["source"], additionalProperties: false },
    outputSchema: { type: "object", properties: CHECK_OUTPUT, required: ["valid", "errors", "warnings", "stages"] },
    annotations: readOnly("Check a graph"),
  },
  {
    name: "dry_run_graph",
    title: "Dry-run a graph",
    description:
      "Walks a graph's plan with a sample request, without running a model: for each step, what it receives, its prompt with every input filled in (Sees), what it must return, what checks it, where a failure sends the run, and any problem the checker finds at that step. Read each step's Sees lines to confirm it gets the data its task needs; the checker only proves the wiring. Use it to test a graph before installing it. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        sample: { type: "string", description: "A sample request, as a user would give it, e.g. 'Scan this receipt: Coffee 3.50, Bagel 2.25, total 5.75'.", maxLength: 4000 },
      },
      required: ["source"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: { errors: { type: "integer" }, warnings: { type: "integer" }, subagent_calls: { type: "integer", description: "Subagent calls on a run where every check passes first time." } },
      required: ["errors", "warnings", "subagent_calls"],
    },
    annotations: readOnly("Dry-run a graph"),
  },
  {
    name: "compile_graph",
    title: "Compile a graph into agent files",
    description:
      "Compiles a graph.skill.md that has no errors into the files an agent runs. claude_code_kit (default): the orchestrating SKILL.md, one Claude Code subagent per model step, the graph source, a Cursor rule and a README. single_skill: one self-orchestrating SKILL.md for agents without subagents. cursor_rule: a Cursor rule. Returns each file's path and content, and for the kit a link that downloads every file as one .zip; nothing is written or stored. Returns the checker's errors instead if the graph has any.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        target: { type: "string", enum: [...COMPILE_TARGETS], description: "What to produce. Defaults to claude_code_kit.", default: "claude_code_kit" },
      },
      required: ["source"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, included: { type: "boolean", description: "False when the file did not fit in this answer." } }, required: ["path", "included"] } },
        download_link: { type: "string" },
        studio_link: { type: "string" },
      },
      required: ["files"],
    },
    annotations: readOnly("Compile a graph into agent files"),
  },
  {
    name: "open_graph_in_studio",
    title: "Get a studio link for a graph",
    description:
      "Returns a link that opens a graph.skill.md in the Skill Graph studio (devscratchpad.tech/graph/studio), where the user sees it as a graph, walks through the plan, edits it and exports it. The graph is compressed into the part of the link after #, which browsers do not send to a server, so nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY }, required: ["source"], additionalProperties: false },
    annotations: readOnly("Get a studio link for a graph"),
  },
  {
    name: "read_studio_link",
    title: "Read a graph from a studio link",
    description:
      "Turns a Skill Graph studio link (from open_graph_in_studio, draft_graph or the studio's Share) back into its graph.skill.md, with the checker's result, so a graph can be picked up again in a later chat. The graph is inside the link itself, after the #; nothing is stored anywhere.",
    inputSchema: {
      type: "object",
      properties: { link: { type: "string", description: "The studio link, or just the part from # on (#g=…).", maxLength: MAX_HASH_LENGTH + 512 } },
      required: ["link"],
      additionalProperties: false,
    },
    annotations: readOnly("Read a graph from a studio link"),
  },
  {
    name: "edit_graph",
    title: "Edit a graph",
    description:
      "Changes a graph.skill.md by operations instead of a rewrite: set_step (set or clear fields on a step, or add one with type and after), remove_step, rename_step (updates every reference), set_prompt, connect and disconnect (with an optional contract), set_contract, remove_contract, and set_skill (name, description, handoff, experience). Operations apply in order, all or nothing. Returns the new source, what each operation did, the checker's result and a studio link. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        operations: {
          type: "array",
          minItems: 1,
          maxItems: MAX_EDIT_OPERATIONS,
          description:
            'Edits, in order. Examples: {"op":"set_step","id":"implement","fields":{"check":"npm test","loop":{"until":"check","max_iterations":4}}}; {"op":"set_step","id":"lint","fields":{"type":"code","run":"npm run lint"},"after":["implement"]}; {"op":"connect","from":"plan","to":"review","contract":"plan_json"}; {"op":"set_step","id":"review","fields":{"model":null}} clears model.',
          items: {
            type: "object",
            properties: {
              op: { type: "string", enum: [...EDIT_OPERATIONS] },
              id: { type: "string", description: "The step (set_step, remove_step, rename_step, set_prompt)." },
              to: { type: "string", description: "rename_step: the new id. connect, disconnect: the step the edge goes to." },
              from: { type: "string", description: "connect, disconnect: the step the edge comes from." },
              fields: { type: "object", description: `set_step: fields to set, in the file's names (${STEP_FIELDS.join(", ")}, prompt); null clears one.` },
              after: { type: "array", items: { type: "string" }, description: "set_step: steps to connect into this one." },
              prompt: { type: "string", description: "set_prompt: the step's new prompt." },
              contract: { type: "string", description: "connect: the contract the edge carries." },
              name: { type: "string", description: "set_contract, remove_contract: the contract. set_skill: the skill's name." },
              format: { type: "string", enum: ["json", "markdown", "text"], description: "set_contract." },
              description: { type: "string", description: "set_contract: a valid payload in one line. set_skill: what the skill does." },
              required: { type: "array", items: { type: "string" }, description: "set_contract: top-level keys a JSON payload must have." },
              check: { type: "string", description: "set_contract: a command with {{payload}} that must exit 0." },
              on: { type: "array", items: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] }, description: "set_contract: edges to put it on." },
              handoff: { type: "string", enum: ["inline", "file"], description: "set_skill." },
              experience: { type: "boolean", description: "set_skill: learn from runs (true) or not (false)." },
            },
            required: ["op"],
          },
        },
      },
      required: ["source", "operations"],
      additionalProperties: false,
    },
    outputSchema: { type: "object", properties: { ...CHECK_OUTPUT, ...SOURCE_OUTPUT, applied: { type: "array", items: { type: "string" } } }, required: ["valid", "errors", "warnings", "stages", "source", "applied"] },
    annotations: readOnly("Edit a graph"),
  },
  {
    name: "review_lessons",
    title: "Review a skill's lessons",
    description:
      "Reads a skill's EXPERIENCE.md (the lessons its reflect step wrote from failed checks, gates and loop iterations) against its graph: each lesson with its step, rule, evidence and how often it was given and helped, plus lessons whose step no longer exists and lessons the next run would prune. Nothing is stored.",
    inputSchema: { type: "object", properties: { source: SOURCE_PROPERTY, experience: EXPERIENCE_PROPERTY }, required: ["source", "experience"], additionalProperties: false },
    outputSchema: {
      type: "object",
      properties: {
        lessons: {
          type: "array",
          items: {
            type: "object",
            properties: { number: { type: "integer" }, step: { type: "string" }, rule: { type: "string" }, evidence: { type: "string" }, seen: { type: "integer" }, helped: { type: "integer" }, status: { type: "string", enum: ["active", "orphan", "pruned_next"] } },
            required: ["number", "step", "rule", "seen", "helped", "status"],
          },
        },
      },
      required: ["lessons"],
    },
    annotations: readOnly("Review a skill's lessons"),
  },
  {
    name: "bake_lessons",
    title: "Bake lessons into a graph",
    description:
      "Makes chosen lessons permanent: appends each one's rule to its step's prompt in the graph.skill.md (under 'Learned from earlier runs:') and removes it from EXPERIENCE.md. Returns the new source, the trimmed EXPERIENCE.md text, the checker's result and a studio link. Nothing is stored or written.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        experience: EXPERIENCE_PROPERTY,
        lessons: { type: "array", minItems: 1, items: { type: "integer", minimum: 1 }, description: "The numbers of the lessons to bake in (the n of [Ln])." },
        discard: { type: "array", items: { type: "integer", minimum: 1 }, description: "Lesson numbers to remove from the file without baking them in." },
      },
      required: ["source", "experience", "lessons"],
      additionalProperties: false,
    },
    outputSchema: { type: "object", properties: { ...CHECK_OUTPUT, ...SOURCE_OUTPUT, experience: { type: "string" }, baked: { type: "array", items: { type: "integer" } } }, required: ["valid", "errors", "warnings", "stages", "source", "experience", "baked"] },
    annotations: readOnly("Bake lessons into a graph"),
  },
  {
    name: "start_run",
    title: "Start a refereed run",
    description:
      "Starts a run of a graph that a referee keeps on the rails: it returns the first tasks (each step's instructions and where each of its inputs is) and a run object. advance_run takes the answers. The referee checks every answer in code (JSON contract keys, GATE verdicts, loop markers, command exit codes), counts retries and loop iterations, expands fan-out lists, keeps the failure log and the loop notes, and stops a run that runs out of tries. It runs no model and no command itself, and stores nothing: the run object carries the state.",
    inputSchema: {
      type: "object",
      properties: {
        source: SOURCE_PROPERTY,
        request: { type: "string", description: "The user's request the graph runs on.", maxLength: 20_000 },
        experience: EXPERIENCE_PROPERTY,
      },
      required: ["source", "request"],
      additionalProperties: false,
    },
    outputSchema: RUN_OUTPUT_SCHEMA,
    annotations: readOnly("Start a refereed run"),
  },
  {
    name: "advance_run",
    title: "Report answers to a refereed run",
    description:
      "Takes the answers to a run's open tasks, checks each one, and returns what happens next: the next tasks, a retry with the reason, the next loop iteration, an approval to ask, or the end of the run with the final answer, the loop notes to append to each ledger file and, with learning on, the new EXPERIENCE.md task. With no outputs, it lists the open tasks again. Nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        run: { type: "object", description: "The run object from the last start_run or advance_run answer, unchanged." },
        outputs: {
          type: "array",
          maxItems: 100,
          description: "One entry per finished task.",
          items: {
            type: "object",
            properties: {
              task: { type: "string", description: "The task id." },
              output: { type: "string", description: "The step's whole answer, unchanged; for commands and checks, their last lines of output." },
              exit_code: { type: "integer", description: "Commands and checks: the exit code." },
              approved: { type: "boolean", description: "Approvals: true only on the user's explicit yes." },
            },
            required: ["task"],
            additionalProperties: false,
          },
        },
      },
      required: ["run"],
      additionalProperties: false,
    },
    outputSchema: RUN_OUTPUT_SCHEMA,
    annotations: readOnly("Report answers to a refereed run"),
  },
];

/** Prompts the user can pick in Claude to start from their project. */
export const CONNECTOR_PROMPTS = [
  {
    name: "design_workflow",
    title: "Design a workflow for my project",
    description: "Plan a multi-agent workflow for a project or task, check it, and open it in the Skill Graph studio.",
    arguments: [{ name: "project", description: "What the project or task is, in a sentence or two.", required: true }],
  },
  {
    name: "run_workflow",
    title: "Run a workflow step by step",
    description: "Run a graph skill on a request with the referee checking every step: contracts, gates, loops and retries.",
    arguments: [
      { name: "graph", description: "A Skill Graph studio link, or a starter graph id such as ship-a-change.", required: true },
      { name: "request", description: "What the workflow should do this time.", required: true },
    ],
  },
] as const;

export function promptMessage(name: string, args: Record<string, unknown>): string | null {
  if (name === "run_workflow") {
    const graph = typeof args.graph === "string" && args.graph.trim() ? args.graph.trim() : "(a studio link or starter graph id)";
    const request = typeof args.request === "string" && args.request.trim() ? args.request.trim() : "(what to do)";
    return [
      "Run this Skill Graph workflow with its referee:",
      "",
      `Graph: ${graph}`,
      `Request: ${request}`,
      "",
      "Get the graph's source (read_studio_link for a link, get_graph_template for a starter id), then start_run with it and the request. Do each task the referee gives, as it says, and report every answer with advance_run until the run is done or stopped. Ask me at each approval. At the end, give me the final answer, and the ledger notes and lessons file to save.",
    ].join("\n");
  }
  if (name !== "design_workflow") return null;
  const project = typeof args.project === "string" && args.project.trim() ? args.project.trim() : "(describe the project here)";
  return [
    "Design a multi-agent workflow for this project with Skill Graph:",
    "",
    project,
    "",
    "Start from the closest starter graph if one fits, or draft one from an outline of the steps. Check it until it has no errors or warnings, and dry-run it with a realistic sample request; read what each step sees and fix any step that does not get the data its task needs. Then give me the studio link, explain the stages in a few lines, and tell me how to install the compiled files.",
  ].join("\n");
}

export const SERVER_INSTRUCTIONS =
  "Skill Graph designs multi-agent workflows as graph skills (graph.skill.md), compiles them into Claude Code subagents or Cursor rules, and referees runs of them. Design: list_graph_templates and get_graph_template for a starting point, or draft_graph from an outline of the steps (get_graph_format documents the full format, including loop: for steps that repeat until a check passes); edit_graph changes a graph by operations instead of a rewrite; validate_graph until it has no errors; dry_run_graph with a sample request, reading each step's Sees lines to confirm it gets the data its task needs (the checker proves wiring, not that); open_graph_in_studio for the user to review; compile_graph for the files to install. Run: start_run returns the first tasks and a run object, and advance_run takes each answer, checks it in code (contracts, gate verdicts, loop markers, exit codes) and returns what is next, until the run is done or stopped. Learn: review_lessons and bake_lessons work on the EXPERIENCE.md a skill writes after its runs. read_studio_link turns a studio link back into the source. All tools are read-only and nothing is stored: the studio link, the graph.skill.md file and the run object are the saved copies. The same reference text is also available as resources (skill-graph://format, skill-graph://templates/<id>).";

/** Read-only documents for clients that list resources (Claude Code lets the user @-mention them). */
export const CONNECTOR_RESOURCES = [
  { uri: "skill-graph://format", name: "graph-format", title: "Graph skill format", description: "The graph.skill.md format: node types, fields, loops, contracts, references and the checker's rules.", mimeType: "text/markdown" },
  ...BLUEPRINTS.map((blueprint) => ({
    uri: `skill-graph://templates/${blueprint.id}`,
    name: `template-${blueprint.id}`,
    title: `Starter graph: ${blueprint.title}`,
    description: `${blueprint.hint}.`,
    mimeType: "text/markdown",
  })),
];

/** The text of a resource, or null for an unknown URI. */
export function readConnectorResource(uri: string): string | null {
  if (uri === "skill-graph://format") return graphFormatReference();
  const match = /^skill-graph:\/\/templates\/([a-z0-9-]+)$/.exec(uri);
  return match ? (BLUEPRINTS.find((blueprint) => blueprint.id === match[1])?.source ?? null) : null;
}

/* ------------------------------------------------------------------ helpers */

function text(value: string, isError = false): ToolResult {
  return isError ? { content: [{ type: "text", text: value }], isError: true } : { content: [{ type: "text", text: value }] };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Reads the `source` argument, or explains what is wrong with it. */
function readSource(args: Record<string, unknown>): { source: string } | { error: string } {
  const source = args.source;
  if (typeof source !== "string" || source.trim() === "") return { error: "source is required: pass the full graph.skill.md text. get_graph_format describes it." };
  if (source.length > MAX_SOURCE_LENGTH) return { error: `source is too large (${source.length.toLocaleString("en-US")} characters; the limit is ${MAX_SOURCE_LENGTH.toLocaleString("en-US")}).` };
  return { source };
}

interface Checked {
  graph: SkillGraph | null;
  fatal: string | null;
  errors: GraphIssue[];
  warnings: GraphIssue[];
}

/** The same checks the studio runs: the validator plus prompt sections that match no node. */
function check(source: string): Checked {
  const parsed = parseGraphSkill(source);
  if (!parsed.graph) return { graph: null, fatal: parsed.fatal, errors: [], warnings: [] };
  const orphans = findOrphanSections(source, parsed.graph).map(
    (id): GraphIssue => ({ severity: "warning", code: "orphan-section", message: `"## @node: ${id}" matches no node, so its prompt is ignored. Fix the id, or add a node "${id}".` })
  );
  const issues = [...validateGraph(parsed.graph), ...orphans];
  return { graph: parsed.graph, fatal: null, errors: issues.filter((issue) => issue.severity === "error"), warnings: issues.filter((issue) => issue.severity === "warning") };
}

function issueLines(issues: GraphIssue[]): string[] {
  return issues.map((issue) => `- [${issue.code}]${issue.nodeId ? ` step ${issue.nodeId}:` : ""} ${issue.message}`);
}

function planLines(graph: SkillGraph): { lines: string[]; stages: number; subagents: number } {
  const plan = buildPlan(graph);
  const subagents = plan.reduce((sum, stage) => sum + stage.nodes.filter((node) => !runsWithoutSubagent(node.type)).length, 0);
  const lines = plan.map((stage) => {
    const steps = stage.nodes.map((node) => `${node.id} (${[node.type, node.model].filter(Boolean).join(", ")})`).join(", ");
    return `${stage.number}. ${steps}${stage.nodes.length > 1 ? " — in parallel" : ""}`;
  });
  return { lines, stages: plan.length, subagents };
}

/** A studio link with the graph compressed into the hash, or null when it is too large for one. */
function studioLink(source: string, context: ConnectorContext): string | null {
  const hash = encodeShareHash({ source });
  return hash.length > MAX_HASH_LENGTH ? null : `${context.studioUrl}${hash}`;
}

/** A link to the page that builds the kit's .zip in the browser from the graph after the #. */
function downloadLink(source: string, context: ConnectorContext): string | null {
  if (!context.downloadUrl) return null;
  const hash = encodeShareHash({ source });
  return hash.length > MAX_HASH_LENGTH ? null : `${context.downloadUrl}${hash}`;
}

/** The link as Markdown with a short label, so a chat shows a few words instead of thousands of characters. */
function markdownLink(url: string, graph: SkillGraph | null): string {
  const name = (graph?.name || "the graph").replace(/[[\]]/g, "");
  return `[Open ${name} in Skill Graph](${url})`;
}

function issueData(issues: GraphIssue[]): Record<string, string>[] {
  return issues.map((issue) => ({ code: issue.code, ...(issue.nodeId ? { step: issue.nodeId } : {}), message: issue.message }));
}

/** The checker's result as data, for `structuredContent`. */
function checkData(result: Checked): Record<string, unknown> {
  return {
    valid: result.graph !== null && result.errors.length === 0,
    ...(result.fatal ? { fatal: result.fatal } : {}),
    errors: issueData(result.errors),
    warnings: issueData(result.warnings),
    stages: result.graph ? buildPlan(result.graph).map((stage) => stage.nodes.map((node) => node.id)) : [],
  };
}

function withData(result: ToolResult, data: Record<string, unknown>): ToolResult {
  return { ...result, structuredContent: data };
}

function fatalMessage(fatal: string | null): string {
  return `The file could not be read: ${fatal ?? "unknown problem"}. It must start with --- and valid YAML frontmatter, and close it with another ---.`;
}

/* ------------------------------------------------------------------ tools */

function validateTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const result = check(input.source);
  if (!result.graph) return withData(text(fatalMessage(result.fatal)), checkData(result));

  const { lines, stages, subagents } = planLines(result.graph);
  const counts = `${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}`;
  const summary =
    result.errors.length === 0
      ? `Valid: ${plural(stages, "stage")}, ${plural(subagents, "subagent")} (${counts}). It can be compiled.`
      : `Not valid yet (${counts}). Errors block compiling; fix them and check again.`;
  return withData(text(
    [
      summary,
      ...(result.errors.length ? ["", "Errors:", ...issueLines(result.errors)] : []),
      ...(result.warnings.length ? ["", "Warnings:", ...issueLines(result.warnings)] : []),
      "",
      "Plan (stages run in order; steps in one stage run at the same time):",
      ...(lines.length ? lines : ["(no steps after the input yet)"]),
    ].join("\n")
  ), checkData(result));
}

function compileTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const target = args.target ?? "claude_code_kit";
  if (typeof target !== "string" || !(COMPILE_TARGETS as readonly string[]).includes(target)) {
    return text(`target must be one of ${COMPILE_TARGETS.join(", ")}.`, true);
  }
  const result = check(input.source);
  if (!result.graph) return text(fatalMessage(result.fatal), true);
  if (result.errors.length > 0) {
    return text([`The graph has ${plural(result.errors.length, "error")}, so it cannot be compiled yet:`, ...issueLines(result.errors)].join("\n"), true);
  }

  const graph = result.graph;
  const slug = toSlug(graph.name);
  const files =
    (target as CompileTarget) === "single_skill"
      ? [{ path: `.claude/skills/${slug}/SKILL.md`, content: buildSingleFileSkill(graph) }]
      : (target as CompileTarget) === "cursor_rule"
        ? [{ path: `.cursor/rules/${slug}.mdc`, content: buildCursorRule(graph) }]
        : buildExportKit(graph);
  const url = studioLink(input.source, context);
  const zip = target === "claude_code_kit" ? downloadLink(input.source, context) : null;
  // Files are sent whole, in kit order (SKILL.md and the graph first), until the budget runs out.
  const sent: typeof files = [];
  let used = 0;
  for (const file of files) {
    if (sent.length > 0 && used + file.content.length > MAX_COMPILE_RESULT_CHARS) break;
    sent.push(file);
    used += file.content.length;
  }
  const omitted = files.slice(sent.length);
  const intro = [
    `Compiled "${graph.name || slug}" into ${plural(files.length, "file")}. Save each one at its path, relative to the repository root:`,
    ...files.map((file) => `- ${file.path}`),
    "",
    target === "cursor_rule" ? "Cursor picks the rule up from .cursor/rules/." : `Then ask Claude Code to use the ${slug} skill, or invoke it by name.`,
    "",
    zip
      ? `To download every file as one .zip: [Download the ${(graph.name || slug).replace(/[[\]]/g, "")} kit](${zip}). The page lists what the kit can run before the download, and builds the .zip in the browser.${url ? ` To see or edit it first: ${markdownLink(url, graph)}.` : ""}`
      : url
        ? `To download every file at once: ${markdownLink(url, graph)}, then Export → Claude Code + Cursor kit (.zip). In the studio, Export also copies the single-file SKILL.md.`
        : "To download every file at once, save graph.skill.md, open it in the studio (devscratchpad.tech/graph/studio, Open file) and choose Export → Claude Code + Cursor kit (.zip).",
    ...(omitted.length > 0
      ? [
          "",
          `This answer holds the first ${plural(sent.length, "file")} in full; the other ${plural(omitted.length, "file")} (${omitted.map((file) => file.path).join(", ")}) would not fit in one tool result. Get them from the .zip download${zip ? "" : " in the studio"}, or compile with target single_skill for one file.`,
        ]
      : []),
  ].join("\n");
  return {
    content: [{ type: "text", text: intro }, ...sent.map((file) => ({ type: "text" as const, text: `File: ${file.path}\n\n${file.content}` }))],
    structuredContent: {
      files: files.map((file, index) => ({ path: file.path, included: index < sent.length })),
      ...(zip ? { download_link: zip } : {}),
      ...(url ? { studio_link: url } : {}),
    },
  };
}

function openTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const url = studioLink(input.source, context);
  if (!url) {
    return text("This graph is too large to fit in a link. Use compile_graph for the files, or save the source as graph.skill.md and open it in the studio with Open file.", true);
  }
  const result = check(input.source);
  const status = !result.graph
    ? "The studio will show why the file cannot be read."
    : result.errors.length > 0
      ? `The graph still has ${plural(result.errors.length, "error")}; the studio lists them under Issues.`
      : "The graph is valid.";
  return text(
    [
      `Studio link: ${markdownLink(url, result.graph)}`,
      "",
      status,
      "Opening it shows the graph on a canvas with its plan. If that browser already has a graph, the studio keeps it under Recent graphs (the clock above the Markdown), so nothing is lost.",
      "To keep the graph without the link, save the source as graph.skill.md; the studio opens it with Open file.",
      ...(url.length > SHARE_URL_SOFT_LIMIT ? ["The link is long; some chat apps may cut it off, so open it directly in a browser."] : []),
    ].join("\n")
  );
}

function draftTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const draft = draftGraph(args);
  if ("error" in draft) return text(`${draft.error} draft_graph's input schema describes each field.`, true);
  const result = check(draft.source);
  if (!result.graph) return text(fatalMessage(result.fatal), true);
  const { lines, stages, subagents } = planLines(result.graph);
  const url = studioLink(draft.source, context);
  const counts = `${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}`;
  const data = { ...checkData(result), source: draft.source, notes: draft.notes, ...(url ? { studio_link: url } : {}) };
  return withData(text(
    [
      result.errors.length === 0
        ? `Drafted "${result.graph.name}": ${plural(stages, "stage")}, ${plural(subagents, "subagent")} (${counts}).`
        : `Drafted "${result.graph.name}", but it is not valid yet (${counts}). Fix the outline, or edit the source, and check again.`,
      ...(result.errors.length ? ["", "Errors:", ...issueLines(result.errors)] : []),
      ...(result.warnings.length ? ["", "Warnings:", ...issueLines(result.warnings)] : []),
      ...(draft.notes.length ? ["", "Filled in or worth a look (check these):", ...draft.notes.map((note) => `- ${note}`)] : []),
      "",
      "Plan:",
      ...lines,
      "",
      "Check before installing: each step gets only this. Confirm it is what its task needs (e.g. a step that totals scores must receive the scores), and that every {{step}} or {{step.key}} in a prompt is something that step returns. Then dry_run_graph with a realistic sample.",
      ...buildPlan(result.graph).flatMap((stage) => stage.nodes.map((node) => `- ${node.id}: ${handOff(result.graph as SkillGraph, node).join("; ")}`)),
      ...(url ? ["", `Studio link: ${markdownLink(url, result.graph)}`] : []),
      "",
      "Source (graph.skill.md):",
      "",
      draft.source,
    ].join("\n")
  ), data);
}

function dryRunTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const parsed = parseGraphSkill(input.source);
  if (!parsed.graph) return text(fatalMessage(parsed.fatal), true);
  const sample = typeof args.sample === "string" ? args.sample.slice(0, 4000) : "";
  const run = dryRunGraph(parsed.graph, sample);
  return withData(text(run.text), { errors: run.errors, warnings: run.warnings, subagent_calls: run.subagentCalls });
}

/** The checker's result and the plan after a change, then the new source: what edit_graph and bake_lessons return. */
function changedGraphText(head: string[], source: string, context: ConnectorContext): { text: string; data: Record<string, unknown> } {
  const result = check(source);
  const url = studioLink(source, context);
  const counts = `${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}`;
  const plan = result.graph ? planLines(result.graph).lines : [];
  return {
    text: [
      ...head,
      "",
      !result.graph ? fatalMessage(result.fatal) : result.errors.length === 0 ? `The graph is valid (${counts}).` : `The graph is not valid yet (${counts}).`,
      ...(result.errors.length ? ["", "Errors:", ...issueLines(result.errors)] : []),
      ...(result.warnings.length ? ["", "Warnings:", ...issueLines(result.warnings)] : []),
      ...(plan.length ? ["", "Plan:", ...plan] : []),
      ...(url ? ["", `Studio link: ${markdownLink(url, result.graph)}`] : []),
      "",
      "Source (graph.skill.md):",
      "",
      source,
    ].join("\n"),
    data: { ...checkData(result), source, ...(url ? { studio_link: url } : {}) },
  };
}

function editTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const edited = editGraph(input.source, args.operations);
  if ("error" in edited) return text(edited.error, true);
  const answer = changedGraphText([`Applied ${plural(edited.applied.length, "operation")}:`, ...edited.applied.map((line) => `- ${line}`)], edited.source, context);
  return withData(text(answer.text), { ...answer.data, applied: edited.applied });
}

/** Reads the `experience` argument and the graph it belongs to. */
function readLessonsInput(args: Record<string, unknown>): { graph: SkillGraph; source: string; experience: string } | { error: string } {
  const input = readSource(args);
  if ("error" in input) return input;
  const experience = args.experience;
  if (typeof experience !== "string" || experience.trim() === "") return { error: "experience is required: the skill's EXPERIENCE.md text." };
  if (experience.length > MAX_LESSONS_SOURCE) return { error: `experience is too large to be a lessons file (over ${MAX_LESSONS_SOURCE.toLocaleString("en-US")} characters).` };
  const parsed = parseGraphSkill(input.source);
  if (!parsed.graph) return { error: fatalMessage(parsed.fatal) };
  return { graph: parsed.graph, source: input.source, experience };
}

function reviewLessonsTool(args: Record<string, unknown>): ToolResult {
  const input = readLessonsInput(args);
  if ("error" in input) return text(input.error, true);
  const lessons = parseLessons(input.experience);
  if (lessons.length === 0) return withData(text("No lessons in this file. Lessons look like `- [L3] implement: <rule>` with an `evidence:` line under them."), { lessons: [] });
  const status = (lesson: (typeof lessons)[number]) => (isOrphanLesson(input.graph, lesson) ? "orphan" : lesson.seen >= 5 && lesson.helped === 0 ? "pruned_next" : "active");
  const byStep = new Map<string, typeof lessons>();
  for (const lesson of lessons) byStep.set(lesson.step, [...(byStep.get(lesson.step) ?? []), lesson]);
  const lines = [`${plural(lessons.length, "lesson")} for "${input.graph.name}":`];
  for (const [step, list] of byStep) {
    lines.push("", `${step}${isOrphanLesson(input.graph, list[0]) ? " (no longer a model step of the graph; the next run drops these)" : ""}:`);
    for (const lesson of list) {
      const note = status(lesson) === "pruned_next" ? " · given 5+ times without helping; the next run removes it" : "";
      lines.push(`- [L${lesson.number}] ${lesson.rule}`, `  evidence: ${lesson.evidence || "-"} · seen ${lesson.seen} · helped ${lesson.helped}${note}`);
    }
  }
  lines.push("", "bake_lessons makes a lesson permanent: its rule goes into the step's prompt, and it leaves the file.");
  return withData(text(lines.join("\n")), {
    lessons: lessons.map((lesson) => ({ number: lesson.number, step: lesson.step, rule: lesson.rule, evidence: lesson.evidence, seen: lesson.seen, helped: lesson.helped, status: status(lesson) })),
  });
}

function bakeLessonsTool(args: Record<string, unknown>, context: ConnectorContext): ToolResult {
  const input = readLessonsInput(args);
  if ("error" in input) return text(input.error, true);
  const numbers = (value: unknown) => (Array.isArray(value) ? value.filter((n): n is number => typeof n === "number" && Number.isInteger(n)) : []);
  const bake = numbers(args.lessons);
  const discard = numbers(args.discard);
  if (bake.length === 0) return text("lessons is required: the numbers of the lessons to bake in (the n of [Ln]).", true);
  const lessons = parseLessons(input.experience);
  const unknown = [...bake, ...discard].filter((n) => !lessons.some((lesson) => lesson.number === n));
  if (unknown.length > 0) return text(`No lesson ${unknown.map((n) => `L${n}`).join(", ")} in this file. review_lessons lists them.`, true);
  let graph = input.graph;
  const baked: number[] = [];
  const skipped: string[] = [];
  for (const lesson of lessons.filter((item) => bake.includes(item.number))) {
    if (isOrphanLesson(graph, lesson)) {
      skipped.push(`L${lesson.number} (its step ${lesson.step} is not a model step of the graph)`);
      continue;
    }
    graph = bakeLesson(graph, lesson);
    baked.push(lesson.number);
  }
  const removed = new Set([...baked, ...discard]);
  const trimmed = serializeLessons(graph, lessons.filter((lesson) => !removed.has(lesson.number)));
  const source = serializeGraphSkill(graph);
  const answer = changedGraphText(
    [
      baked.length > 0 ? `Baked ${baked.map((n) => `L${n}`).join(", ")} into the prompts of their steps.` : "Nothing was baked in.",
      ...(discard.length > 0 ? [`Discarded ${discard.map((n) => `L${n}`).join(", ")}.`] : []),
      ...(skipped.length > 0 ? [`Skipped ${skipped.join("; ")}.`] : []),
      "",
      `Replace EXPERIENCE.md with this (${plural(lessons.length - removed.size, "lesson")} left):`,
      "",
      "```md",
      trimmed.trimEnd(),
      "```",
    ],
    source,
    context
  );
  return withData(text(answer.text), { ...answer.data, experience: trimmed, baked });
}

function runResult(result: RunAnswer | { error: string }): ToolResult {
  if ("error" in result) return text(result.error, true);
  const over = result.state.status === "done" || result.state.status === "stopped";
  return withData(text(result.text), {
    status: result.state.status,
    ...(over ? {} : { run: result.state }),
    tasks: result.tasks,
    ...(result.state.stopReason ? { stop_reason: result.state.stopReason } : {}),
  });
}

function startRunTool(args: Record<string, unknown>): ToolResult {
  const input = readSource(args);
  if ("error" in input) return text(input.error, true);
  const request = typeof args.request === "string" ? args.request.slice(0, 20_000) : "";
  if (request.trim() === "") return text("request is required: what the user wants the workflow to do this time.", true);
  const experience = typeof args.experience === "string" ? args.experience.slice(0, MAX_LESSONS_SOURCE) : undefined;
  return runResult(startRun(input.source, request, experience));
}

function advanceRunTool(args: Record<string, unknown>): ToolResult {
  return runResult(advanceRun(args.run, args.outputs ?? []));
}

function readLinkTool(args: Record<string, unknown>): ToolResult {
  const link = args.link;
  if (typeof link !== "string" || link.trim() === "") return text("link is required: a Skill Graph studio link, or the part from # on.", true);
  if (link.length > MAX_HASH_LENGTH + 512) return text("This link is too long to be a Skill Graph link.", true);
  const hash = link.slice(link.indexOf("#"));
  const shared = link.includes("#") ? decodeShareHash(hash.trim()) : null;
  if (!shared) return text("This is not a Skill Graph link, or it was cut off: the graph lives in the part after #g= (or #graph=), and the whole link is needed.", true);
  const result = check(shared.source);
  const status = !result.graph
    ? fatalMessage(result.fatal)
    : result.errors.length > 0
      ? `"${result.graph.name}" (${plural(result.errors.length, "error")}, ${plural(result.warnings.length, "warning")}); validate_graph lists them.`
      : `"${result.graph.name}" is valid (${plural(result.warnings.length, "warning")}).`;
  return text([status, "", "Source (graph.skill.md):", "", shared.source].join("\n"));
}

/** Runs a tool. Returns null for a tool that does not exist, so the caller can answer with a protocol error. */
export function callConnectorTool(name: string, rawArgs: unknown, context: ConnectorContext): ToolResult | null {
  const args = typeof rawArgs === "object" && rawArgs !== null && !Array.isArray(rawArgs) ? (rawArgs as Record<string, unknown>) : {};
  switch (name) {
    case "get_graph_format":
      return text(graphFormatReference());
    case "list_graph_templates":
      return text(
        [
          "Starter graphs (pass the id to get_graph_template):",
          ...BLUEPRINTS.map((blueprint) => {
            const steps = parseGraphSkill(blueprint.source).graph?.nodes.length ?? 0;
            return `- ${blueprint.id}: ${blueprint.title}, ${plural(steps, "step")}. ${blueprint.hint}.`;
          }),
        ].join("\n")
      );
    case "get_graph_template": {
      const blueprint = BLUEPRINTS.find((item) => item.id === args.id);
      if (!blueprint) return text(`Unknown starter graph id. Use one of: ${BLUEPRINTS.map((item) => item.id).join(", ")}.`, true);
      return text(`${blueprint.title}: ${blueprint.hint}.\n\n${blueprint.source}`);
    }
    case "draft_graph":
      return draftTool(args, context);
    case "validate_graph":
      return validateTool(args);
    case "dry_run_graph":
      return dryRunTool(args);
    case "compile_graph":
      return compileTool(args, context);
    case "open_graph_in_studio":
      return openTool(args, context);
    case "read_studio_link":
      return readLinkTool(args);
    case "edit_graph":
      return editTool(args, context);
    case "review_lessons":
      return reviewLessonsTool(args);
    case "bake_lessons":
      return bakeLessonsTool(args, context);
    case "start_run":
      return startRunTool(args);
    case "advance_run":
      return advanceRunTool(args);
    default:
      return null;
  }
}
