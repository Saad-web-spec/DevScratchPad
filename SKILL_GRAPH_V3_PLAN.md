# Skill Graph: connector and tool analysis, and the plan for loops, learning and a run referee

> **Status**: built 2026-10-22 (phases 1–4; phase 0 deploy and submission, and C loop script, not done). §6 decided with the recommendations: A and B both built, `until: gate` kept, ledgers kept across runs by default. B changed in one way: the run object holds no outputs and no compressed token, see §2 B "As built". · **Date**: 2026-10-22 · **Scope**: `src/app/graph/lib/` (parser, checker, compiler, draft, connector), `/graph/studio`, `/graph/guide`, `/graph/connector`
> **Reads with**: `SKILL_GRAPH_V2_RFC.md` (what `/2` added and why), `SKILL_GRAPH_CONNECTOR_SUBMISSION.md` (directory listing)

## 1. Where it stands

### What works

- **Layering is right.** `mcp/route.ts` (HTTP: origin, size, version) → `mcpProtocol.ts` (JSON-RPC, testable) → `graphConnector.ts` (tools, prompts) → the same checker, dry run and compiler the studio uses. 289 graph tests pass; the live endpoint answers `tools/list`.
- **Privacy holds.** Stateless, nothing stored, tool names only in logs, every tool `readOnlyHint: true`. Share links and kit downloads carry the graph in the URL hash.
- **The tool set covers one honest loop**: draft from an outline → check → dry-run with a sample → studio link for the user → compile → pick the graph up again later from a link. Two real Claude test rounds closed the drafting gaps (splitters vs. data, verifiers passing work on, keyed refs).
- **The format already has the building blocks of a loop**: `check:` (a command that must pass), `gate` + `on_fail: retry` + `max_retries` + `retry_target`, fan-out, probing, and `experience:` (lessons written after a run by a reflect step, fed back next run).

### What limits it

| # | Limit | Effect on Claude using the connector |
| - | --- | --- |
| 1 | **Create-only.** No tool edits a graph; every change is a full `source` round trip (3–15k characters each way). | Claude rewrites YAML by hand for a one-field change, makes format mistakes, and pays for the whole file on every turn. |
| 2 | **`draft_graph` cannot express a loop.** It has `gate`, `keys` and `on_fail`, but no `check` command, `max_retries`, `retry_target`, `probe_hints` or `experience`. | The most useful pattern in the blueprints ("implement, loop on `npm test`") cannot be drafted; Claude must hand-edit the source after drafting. |
| 3 | **A step cannot iterate on itself.** The only loops are retries triggered by a gate or check, which re-run a step with "previous answer + error" and keep no ledger between tries. The graph forbids cycles outright. | Open-ended work (work through a list until every item is done, refine until a measure passes) has no honest expression; authors fake it with `max_retries`. |
| 4 | **Learning never passes through the connector.** `EXPERIENCE.md` is written by the kit after a run; only the studio can bake or discard lessons. | A Claude Code user who runs a kit for a week has lessons they cannot fold back into the graph from Claude. |
| 5 | **The connector compiles but never referees a run.** In claude.ai there is no Claude Code, so a graph is just a file; in Claude Code the orchestrator follows a 7k-character SKILL.md and drifts (skips a contract check, forgets a retry count). | The thing the graph promises (contracts checked, gates parsed, retries counted) is enforced by prose, not by code. |
| 6 | **Plain-text results only.** No `structuredContent` / `outputSchema`, no MCP resources. | Claude re-parses prose to find error codes and stage lists; Claude Code users cannot `@`-mention the format or a blueprint. |
| 7 | **Ops.** `SERVER_INFO.version` is still `1.0.0` after three releases; directory submission, firewall bypass check and the icon domain are open (TASK.md 2026-10-20/21). | Reconnect behaviour and the listing depend on these. |

Items 3 and 5 are the two meanings of "a self loop in the MCP", and both are worth building; item 1 is the cheapest large win.

## 2. The self loop: three layers, each a loop with a file

### A. `loop:` on a step (format, compiled everywhere)

A step may iterate on itself until a condition holds, with a ledger file that survives iterations **and runs**. This is the Ralph-style loop ("run again with the same prompt and a progress file until done"), written into the graph instead of a shell script around the agent.

```yaml
- id: implement
  type: worker
  check: npm test
  loop:
    until: check          # check | gate | done
    max_iterations: 6     # default 3, warn past 10
    ledger: true          # default true: .skill-graph/<slug>/implement.loop.md
```

- `until: check`: iterate until the step's `check:` command exits 0. Needs `check:`.
- `until: gate`: iterate until the step's own `gate` passes (the step ends with `GATE: PASS`). Needs `gate:`. This is a self-judging loop; for a fresh-context judge, keep using a separate verifier with `on_fail: retry`.
- `until: done`: iterate until the step ends with a `LOOP: DONE` line (open-ended work). The compiler appends the marker instructions to the prompt, so the author writes the task only.
- **The ledger.** After every iteration the orchestrator appends the step's `## Loop note` (what it did, what failed, what is left; the compiler asks for this block) and the last 40 lines of the check output to `.skill-graph/<slug>/<id>.loop.md`. The next iteration receives its inputs, the ledger and the last check output. The file stays after the run and is handed to the first iteration of the next run, so the loop remembers across runs; `.skill-graph/.gitignore` re-includes `*.loop.md` the same way it does `EXPERIENCE.md`. `ledger: false` keeps only the previous answer, as retries do today.
- **References**: `{{loop.iteration}}`, `{{loop.ledger}}`, `{{loop.last_output}}` are allowed only inside a loop step.
- **Not a cycle.** `loop:` is a node field, not a self-edge, so the DAG rules, stages and `buildPlan` do not change; the loop is a detail of how one step runs, like `foreach`. Additive, stays `skill-graph/2`.
- **Loop vs. retry.** A retry is triggered by someone else's verdict and re-runs a path. A loop is the step's own control flow, has an explicit `until`, an iteration cap and a ledger. A loop step can still be retried by a downstream gate; the retry restarts the loop at iteration 1 with the ledger intact.

**Validation** (`graphSkill.ts`): `loop-needs-check` (until check without `check:`), `loop-needs-gate`, `loop-iterations` (warn > 10), `loop-irreversible` (error), `loop-probe` (error: probing runs candidates once), `loop-approval`/`loop-code` (error: only model steps loop), `loop-ref-outside` (a `{{loop.*}}` reference outside a loop step).

**Compiled plan** (`graphExport.ts`, `graphPlan.ts`): under the step, "Iterate: hand it …, the ledger and the last check output; when it returns, append its Loop note to `…loop.md`, run `npm test`; exit 0 ends the loop, otherwise iterate again, at most 6 times; then stop and show the user the ledger." The experience failure log records each failed iteration, so `reflect` can learn from loops.

**Dry run** (`graphSimulate.ts`): shows iteration 1, then one line "iterations 2–6 also see the ledger and the last check output".

**Studio**: a `↻ ≤6` badge on the card and a Loop section in the Inspector (until, max, ledger). The canvas needs no new edge.

**Draft** (`graphDraft.ts`, `draft_graph` schema): `check` (string) and `loop: {until, max_iterations}` on a step; `max_retries`, `retry_target`, `probe_hints` and a top-level `experience: true` while the schema is open, so everything the format has can be drafted.

Size: M. The blueprint `ship-a-change` moves its `implement` step to `loop: {until: check}` once this ships.

### B. A run referee over MCP (`start_run` / `advance_run`)

The connector cannot run models (ADR: no keys, no model calls), but it can **referee**: Claude does each step, hands the outputs back, and the server does what the SKILL.md asks the orchestrator to do in prose today, in code: check payloads against contracts (`required` keys, JSON validity), parse `GATE:` verdicts and redo lines, count retries and loop iterations, expand `foreach` lists, keep the failure log, and return the next stage's tasks. This is the literal self loop in the MCP: Claude calls `advance_run` until it answers "done".

```
start_run(source, request)            → { run, tasks: [{step, prompt, expects, hand: {...}}], stage: 1 }
advance_run(run, outputs: [{step, output}])
                                      → { run, tasks: [...], stage: n }
                                      | { run, ask: "approve …", step }           # approval
                                      | { run, done: true, answer, experience }   # the new EXPERIENCE.md text
                                      | { run, stopped: "…", ledger }
```

- **No storage.** `run` is the whole run state (graph, outputs so far, counters, failure log) as a DEFLATE+base64url token, like share links, capped (1 MB raw; past it the tool says to continue in Claude Code with the compiled kit). The server keeps nothing between calls.
- **What it enforces that prose does not**: a payload that misses a `required` key is sent back for one re-run with the exact error; a verdict that names a step not on the gate's allowed list is refused with the allowed list; a loop past `max_iterations` stops; a `foreach` with more items than `max_items` asks instead of starting.
- **What it cannot give**: real fresh contexts in claude.ai (every step runs in one chat). The tool result says so, and the task for a fresh-context step is marked "answer from this task only". In Claude Code, the host can still start a subagent per task, and the orchestrator then follows tool answers instead of a long prose plan.
- **Annotations**: stays `readOnlyHint: true` and `idempotentHint: true`: the same `(run, outputs)` always gives the same answer, and nothing anywhere changes. Directory reviewers read these; the description must say what it returns, not tell Claude how to behave.
- **Learning**: `done` returns the reflect step's input (failure log, lessons given) **and** the updated `EXPERIENCE.md` text computed from the hard signals, so a claude.ai user can keep it in a Project file and pass it to the next `start_run` as `experience`. That is the "file" of the loop for users without a repo.

**As built.** A DEFLATE token holding every output would be tens of thousands of base64 characters, and Claude has to retype the run on every call; one wrong character breaks it. So the run object is plain JSON (about 1–4k characters) with no outputs in it: done steps, open tasks, counters, loop notes, verdict reasons and small fan-out items, plus the graph as its `#g=` studio-link hash. Each task names its inputs by task id ("`### plan`: the output of task `plan/judge` after its `---` line"), and the referee checks each answer when it is reported. Contract `check:` commands and step `check:` commands come back as command tasks with an exit code. A `reflect` task ends a run with learning on, and the end of a run prints the loop notes to append to each ledger.

Size: L. New `graphRun.ts` (pure state machine over `buildPlan`, `contractChecks`, `retryPath`, the loop rules from A), token codec next to `graphShare.ts`, two tools, tests that drive every blueprint through a scripted run (pass, gate fail → retry, loop until check, approval declined, fan-out). The `design_workflow` prompt gains a sibling `run_workflow`.

### C. Loop script export (small, optional)

`compile_graph` target `loop_script`: `.skill-graph/<slug>/loop.ps1` and `loop.sh` that call `claude -p "/<slug> <goal>"` again until the loop ledger or `EXPERIENCE.md` says done, for unattended runs. Twenty lines each, no new spec. Worth it only after A, because it needs a durable ledger to read.

## 3. The connector beyond loops

### `edit_graph` (closes limit 1)

One tool with a list of operations, applied in order to a `source`, returning the new source, the checker's result and a studio link; nothing stored.

```
edit_graph(source, operations: [
  { op: "set_step",   id, fields: { tools, model, gate, check, loop, … } },   # create when missing
  { op: "remove_step", id },
  { op: "set_prompt", id, prompt },
  { op: "connect",    from, to, contract? },
  { op: "disconnect", from, to },
  { op: "set_contract", name, format, description, required?, check? },
  { op: "set_skill",  name?, description?, handoff?, experience? }
])
```

It reuses the studio's node/edge editors in `graphSkill.ts` (`removeNode`, `renameNode`, edge helpers), so the serializer, not Claude, writes YAML. Steps become additive: Claude drafts, then applies two or three operations per turn with a few hundred characters instead of the whole file.

### Lessons through the connector (closes limit 4)

- `review_lessons(source, experience)`: parses an `EXPERIENCE.md`, lists lessons per step with seen/helped, orphans, and which ones the file would prune next.
- `bake_lessons(source, experience, lessons: [numbers])`: appends the chosen rules to their steps' prompts (`bakeLesson`), returns the new source and the trimmed file text. Same code as the studio's bake-in.

### Structured results and resources (closes limit 6)

- `validate_graph`, `dry_run_graph` and `compile_graph` add `structuredContent` (`{ valid, errors[], warnings[], stages[] }`, `{ steps[] }`, `{ files[] }`) with `outputSchema`, keeping the text for clients that ignore it. Protocol 2025-06-18 and later.
- Resources: `skill-graph://format` and `skill-graph://templates/<id>` over `resources/list` and `resources/read`, so Claude Code users can `@`-mention them. Claude.ai ignores resources; nothing breaks.

### Ops (closes limit 7)

- Bump `SERVER_INFO.version` on every tool change (clients cache `tools/list` per version).
- Finish TASK.md 2026-10-20/21: firewall bypass for `/graph/mcp`, MCP Inspector run, directory submission; the icon stays blocked on a separate domain.
- Add a per-IP soft limit only if the Vercel logs show abuse; the body cap and the 500k parser cap already bound cost.

## 4. Order and sizes

| Phase | What | Size | Why this order |
| - | --- | --- | --- |
| 0 | Ops: version bump, deploy, Inspector run, submit | S | Everything after lands on a reconnect anyway. |
| 1 | `edit_graph`; `draft_graph` gains `check`, `max_retries`, `retry_target`, `probe_hints`, `experience` | M | Cheapest big win; A and B both need the draft fields. |
| 2 | **A: `loop:` with the ledger file**, in checker, compiler, dry run, studio, draft, guide | M | The self loop the format lacks; compiled into every kit, no runtime needed. |
| 3 | Lessons tools (`review_lessons`, `bake_lessons`); structured results; resources | S–M | Completes the learning loop through the connector. |
| 4 | **B: `start_run` / `advance_run`** | L | The self loop in the MCP itself; reuses A's rules and phase 1's fields. |
| 5 | C: loop script target | S | Optional; after A. |

## 5. Rules that must hold through all of it

- **Frozen share dictionaries**: new YAML keys (`loop`, `ledger`) are not in dictionary 0; links of graphs that use them get a little longer. Never edit `graphShareDictionary.ts`; append a dictionary only if measured links justify it.
- **Kit audit**: any new orchestrator text (`nodeInstructions`, loop lines) keeps a "never", an "untrusted" and an "approved/confirm" phrase, or agent files drop below 85 in `graphAudit.test.ts`.
- **Node fields round-trip**: a new node field must be added to the parser **and** the serializer, or a canvas edit deletes it (RFC §2).
- **Fresh-context steps get only their "Hand it" line** (handoff rule 4): the ledger and the last check output must be on that line for loop steps.
- **Tool descriptions describe, they do not instruct** (directory review criteria); every tool keeps `title`, `readOnlyHint: true`, `destructiveHint: false`.
- **Results under ~80k characters**: `advance_run` returns tasks for one stage at a time and names, not repeats, large earlier outputs.
- **ADR-001 stays**: `start_run`/`advance_run` process in memory and return everything they need to remember inside the `run` token; log tool names only.

## 6. Decisions to confirm

1. A before B (recommended): the ledger file is useful in every kit today, while B only helps people who run graphs from a chat.
2. `until: gate` as a self-judging loop: keep it (cheap, honest about not being fresh-context) or leave only `check` and `done`?
3. Ledger durability across runs by default (`ledger: true`), or only across iterations unless asked?
4. B's `run` token cap at 1 MB raw, with "continue in Claude Code" past it?
