# RFC: Skill Graph `skill-graph/2`

> **Status**: Draft for review · **Date**: 2026-10-18 · **Scope**: `src/app/graph/lib/` (parser, validator, compiler), `/graph` studio, `/graph/guide`
> **Covers**: audit items 3.2 (file handoffs), 3.3 (retry targets, per-step readiness), 3.4 (`foreach` fan-out, checked contracts)

## 1. Summary

`skill-graph/1` describes a fixed graph: every step runs once per stage, outputs travel inline through the orchestrator, and a failed gate re-runs the steps it names. Four extensions are proposed. Two of them only **add optional fields** and can ship inside `skill-graph/1`, as `code`, `approval`, `check` and `risk` did. The other two **change what a step's output is** (a file path, a list), so they define `skill-graph/2`.

| # | Feature | New syntax | Changes output meaning? | Ships as |
| - | --- | --- | --- | --- |
| A | Retry target | `retry_target: <ancestor id>` on a gated or checked step | No | `/1`, additive |
| B | Checked contracts | `required: [keys]` and `check: <command>` on a contract | No | `/1`, additive |
| C | File handoffs | `handoff: file` on the graph or on a node | Yes: downstream steps read a path | `/2` |
| D | Map fan-out | `foreach: <node>.<key>` on a model step | Yes: the output is a list | `/2` |

Recommended order: **A → B → (decide on C) → D**.

## 2. What already exists

- Gates end with `GATE: PASS` / `GATE: FAIL` plus `- <node id>: … | redo: …` lines. Since the 2026-10-18 audit fixes, a gate is told which upstream steps it may name, and the plan re-runs every step between a re-run step and the gate.
- `code` steps already exchange data through files: the orchestrator saves each referenced output to `.skill-graph/<slug>/<id>.md|json` and the command reads the path (`payloadPath`, `compileRun`).
- Contracts have only `format` (`json` / `markdown` / `text`) and `description`. The orchestrator checks a payload against its contract by reading it (handoff rule 2).
- `spec:` is read and ignored (`parseGraphSkill`: `void _spec`). Unknown **top-level** frontmatter keys survive a canvas edit (`extraFrontmatter`). Unknown **node** keys do not: a node is rebuilt from known fields, so any new node field has to be added to the parser and serializer, or a canvas edit deletes it.
- Agents never read `graph.skill.md`. They run the compiled `SKILL.md`, subagent files and `.mdc`. A spec change therefore affects the studio and the compiler only, and kits exported earlier keep running.

## 3. Proposals

### A. Retry target (`retry_target`)

**Problem.** A gate judges what it is handed, often a diff or reviews. The current fix lets it name any upstream step, and it is told which ones edit files. The author still cannot say where a failed loop should restart, and an unreadable verdict leaves the orchestrator guessing.

**Syntax.**

```yaml
- id: gate
  type: verifier
  gate: No blocking finding is left open.
  on_fail: retry
  retry_target: implement   # optional; must be an ancestor
```

**Compiled behaviour.**
- The gate's "Steps you can name" list is limited to `retry_target` and the steps between it and the gate.
- On `GATE: FAIL`, the plan re-runs the named steps, or `retry_target` when the verdict names none, then every step on the path to the gate, then the gate. This is capped by `max_retries`, as today.
- The same field works on a step with `check:` and on a `code` step with `on_fail: retry` (today they re-run their direct predecessors).

**Validation.**
- Error `retry-target-unknown` when the id is missing or not an ancestor.
- Error when an `irreversible` step lies on the retry path.
- Warning when an `approval` lies on it, since the user would be asked again.

**Size.** S. Parser, serializer, `nodeInstructions`, `verificationLines`, Inspector select (ancestors only), guide row, tests.

### B. Checked contracts (`required`, `check`)

**Problem.** "Check every payload against its contract" is a model judgement. A splitter that drops a key passes silently until a worker gets nothing.

**Syntax.**

```yaml
contracts:
  subtask_json:
    format: json
    required: [worker_research, worker_compare]          # top-level keys that must exist
    check: node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" {{payload}}
```

**Compiled behaviour.** Before the next stage, the orchestrator saves the payload to its `.skill-graph/` path. It then runs the check with Bash: `{{payload}}` becomes the path, and `required` becomes a generated check. If the check fails, the producer re-runs once with the error, then the run stops (handoff rule 2).

**Open point.** The generated check for `required` needs a runtime. `jq` is often missing on Windows. `node` is present wherever the user runs JS tooling, but not everywhere. Proposal: generate a `node -e` one-liner, and let `check:` override it.

**Size.** S–M. Contract editor fields, plan lines, validation (`required` only on `json` contracts), tests.

### C. File handoffs (`handoff: file`), decision needed

**Problem as stated in the audit.** Large outputs passed inline cost tokens and can be silently shortened.

**What a file handoff actually saves.** In Claude Code, a subagent's final answer comes back into the orchestrator's context whatever we do. The real costs are different:
1. The orchestrator re-types each payload into every consumer's task. That is output tokens, once per consumer, and a chance to paraphrase despite rule 1.
2. The orchestrator's context grows with every result.

Two designs, with different trade-offs:

| | C1: orchestrator writes the file | C2: the step writes its own file |
| --- | --- | --- |
| How | The orchestrator saves each result to `.skill-graph/<slug>/<id>.md` (as for `code` steps); consumers get the path and `Read` it | Each step writes its output to its file and returns only the path and a three-line summary |
| Saves | Re-typing for 2+ consumers; no paraphrasing | Re-typing **and** orchestrator context |
| Costs | One write per producer; context still grows | Every step needs write access; the read-only blueprints lose that property |
| Risk | Low | `writesFiles` would flag every step and `parallel-writers` would fire everywhere unless `.skill-graph/` writes are exempt. Whether scoped `Write(.skill-graph/**)` in a subagent's `tools:` actually limits writes needs to be checked against current Claude Code before relying on it |

**Recommendation.** Ship C1 as `handoff: file` (graph-wide, overridable per node). Revisit C2 only if C1 is not enough on real graphs.

**Size.** M (C1).

### D. Map fan-out (`foreach`)

**Problem.** A fixed set of four workers cannot follow a variable list: changed files in a PR, packages in a monorepo, failing tests.

**Syntax.**

```yaml
- id: review_file
  type: worker
  foreach: plan.files        # a JSON array in plan's output
  max_parallel: 6            # optional, default 4, capped at 16
```

**Compiled behaviour.**
- The plan stage reads "up to 6 at a time, one per item of `files`".
- Each run gets one item as `{{item}}`.
- The step's output becomes a JSON array of the runs' outputs, in item order. Downstream `{{review_file.output}}` receives the array.
- One subagent file serves every run.

**Validation.**
- The source must be a direct predecessor whose output is JSON.
- `{{item}}` is allowed only in `foreach` steps.
- Warning when there is no cap on items. An optional `max_items` stops the run with a message instead of fanning out to 500 runs.
- `foreach` steps cannot be `irreversible`.

**Studio.** The canvas draws a stacked card with "× N". The walkthrough shows the stage as "N runs".

**Size.** L. This is the only change that needs list-shaped outputs throughout handoff, preview and contracts.

### E. Per-step readiness (no spec change)

The plan could add "Start as soon as `a` and `b` finish" to each step, so a step whose inputs are ready does not wait for its whole stage. This needs no new syntax. Whether it helps depends on the host: when one message starts several subagents, Claude Code returns all their results together, so steps started in the same message cannot be released early. **Proposal:** add the line as guidance only, and measure before relying on it.

## 4. Versioning and migration

- The parser accepts `skill-graph/1` and `skill-graph/2`. An unknown version is a warning (this closes the open TASK.md item), not an error.
- The serializer writes `skill-graph/2` only when a `/2` field (`handoff`, `foreach`) is present, so graphs that don't use them stay `/1` and old files diff cleanly.
- Exported kits need no migration: agents read compiled files, not the spec.
- Share links carry the source text, so a `/2` link opened in an older open tab loses the new fields on its next canvas edit. This is acceptable for a site that deploys atomically; note it in the guide.

## 5. Decisions needed

1. Ship A and B now as additive `/1` fields? (Recommended.)
2. File handoffs: C1 (orchestrator writes), C2 (steps write), or neither for now?
3. `foreach`: build it, and is a default of 4 parallel runs (cap 16) right?
4. Generated contract checks: `node -e` by default, or only an explicit `check:` command?
