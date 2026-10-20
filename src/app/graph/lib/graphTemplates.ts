/** Starter documents and blueprints for the graph studio. */
import { serializeGraphSkill, type GraphNode, type SkillGraph } from "./graphSkill";

/** The parallel audit blueprint: split, fan out to 4 workers, verify in a fresh context, merge. */
export const DEFAULT_GRAPH_SKILL = `---
name: parallel-system-audit
description: Splits a goal into 4 parallel workers, verifies with fresh context, and synthesizes.
spec: skill-graph/1
topology:
  nodes:
    - id: goal
      type: input
      label: 1. GOAL
    - id: splitter
      type: orchestrator
      label: 2. SPLIT
      model: sonnet
      tools: [Read]
    - id: worker_research
      type: worker
      label: "3. WORKER 1: Research"
      model: haiku
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
    - id: worker_compare
      type: worker
      label: "3. WORKER 2: Compare"
      model: haiku
      tools: [Read, Grep, Glob, WebSearch]
    - id: worker_check
      type: worker
      label: "3. WORKER 3: Check"
      model: haiku
      tools: [Read, Grep, Glob, Bash]
    - id: worker_gaps
      type: worker
      label: "3. WORKER 4: Find Gaps"
      model: haiku
      tools: [Read, Grep, Glob]
    - id: verifier
      type: verifier
      label: 4. VERIFIER (Fresh Context)
      isolated_context: true
      model: opus
      tools: [Read, Grep, Glob]
      gate: Every kept claim cites concrete evidence and no two workers contradict each other.
      on_fail: retry
      max_retries: 1
    - id: merger
      type: synthesizer
      label: 5 & 6. MERGE & FINAL ANSWER
      model: sonnet
      tools: [Read]
  edges:
    - from: goal
      to: splitter
    - from: splitter
      to:
        - worker_research
        - worker_compare
        - worker_check
        - worker_gaps
      contract: subtask_json
    - from:
        - worker_research
        - worker_compare
        - worker_check
        - worker_gaps
      to: verifier
      contract: findings_array
    - from: verifier
      to: merger
      contract: verified_payload
contracts:
  subtask_json:
    format: json
    description: One key per worker id; each value is that worker's task in one or two sentences.
  findings_array:
    format: markdown
    description: A numbered list of findings, each with its evidence (file, line, quote or URL) and a confidence of high, medium or low.
  verified_payload:
    format: markdown
    description: Only the claims that passed verification, then a short list of rejected claims with the reason.
---

# Node Prompts & Edge Contracts

## @node: splitter
You are the Orchestrator. Take the user's goal and break it into 4 distinct tasks.

The goal:
{{goal}}

Output strictly as JSON with keys: \`worker_research\`, \`worker_compare\`, \`worker_check\`, \`worker_gaps\`.

## @node: worker_research
Focus ONLY on deep research for: {{splitter.worker_research}}
Return findings with exact citations.

## @node: worker_compare
Focus ONLY on comparing alternatives and trade-offs for: {{splitter.worker_compare}}

## @node: worker_check
Focus ONLY on checking technical constraints and correctness for: {{splitter.worker_check}}

## @node: worker_gaps
Focus ONLY on finding missing edge cases and blind spots for: {{splitter.worker_gaps}}

## @node: verifier
**CRITICAL: FRESH CONTEXT MODE.**
You only see the raw outputs from the 4 workers. You do NOT see their reasoning chain.
Audit every claim below for hallucinations, bias, or weak evidence. Reject unverified claims.

Original goal: {{goal}}

Worker outputs:
{{workers.output}}

## @node: merger
Combine the verified findings below into one clear, actionable report.

{{verifier.output}}
`;

/** A minimal three-node graph for starting from scratch. */
export const BLANK_GRAPH_SKILL = `---
name: my-skill-graph
description: Describe what this skill graph does.
spec: skill-graph/1
topology:
  nodes:
    - id: goal
      type: input
      label: GOAL
    - id: work
      type: worker
      label: WORK
    - id: answer
      type: synthesizer
      label: ANSWER
  edges:
    - from: goal
      to: work
    - from: work
      to: answer
---

# Node Prompts & Edge Contracts

## @node: work
Do the work this goal asks for, and return what you did and what you found:

{{goal}}

## @node: answer
Turn the work below into a clear final answer.

{{work.output}}
`;

/**
 * A code change that runs without babysitting: the edit loops on the test suite until it passes, a
 * command (not a model) collects the diff, two read-only reviewers work in parallel, a fresh-context
 * gate sends back only what failed, and a person approves just once, before the step that cannot be undone.
 */
export const SHIP_CHANGE_GRAPH_SKILL = `---
name: ship-a-change
description: Implements a change in a loop on the test suite, reviews the diff in parallel, gates it in a fresh context, and opens a pull request after one approval.
spec: skill-graph/1
experience:
  max_lessons: 20
topology:
  nodes:
    - id: goal
      type: input
      label: CHANGE REQUEST
    - id: plan
      type: orchestrator
      label: PLAN
      model: sonnet
      tools: [Read, Grep, Glob]
    - id: implement
      type: worker
      label: IMPLEMENT (loops on tests)
      model: sonnet
      tools: [Read, Grep, Glob, Edit, Write, Bash]
      check: npm test
      on_fail: retry
      max_retries: 2
      risk: wide
    - id: diff
      type: code
      label: COLLECT DIFF
      run: git diff --stat && git diff
    - id: review_correctness
      type: worker
      label: "REVIEW: Correctness"
      isolated_context: true
      model: haiku
      tools: [Read, Grep, Glob]
    - id: review_security
      type: worker
      label: "REVIEW: Security"
      isolated_context: true
      model: haiku
      tools: [Read, Grep, Glob]
    - id: gate
      type: verifier
      label: GATE (Fresh Context)
      isolated_context: true
      model: opus
      tools: [Read, Grep, Glob]
      gate: No blocking finding is left open, and every finding cites a line of the diff.
      on_fail: retry
      max_retries: 2
      retry_target: implement
    - id: approve
      type: approval
      label: APPROVE PULL REQUEST
    - id: publish
      type: agent
      label: OPEN PULL REQUEST
      model: haiku
      tools: [Bash]
      risk: irreversible
      on_fail: stop
  edges:
    - from: goal
      to: plan
    - from: plan
      to: implement
      contract: change_plan
    - from: implement
      to: diff
    - from: diff
      to:
        - review_correctness
        - review_security
        - gate
      contract: diff_text
    - from:
        - review_correctness
        - review_security
      to: gate
      contract: review_findings
    - from: gate
      to:
        - approve
        - publish
      contract: verdict
    - from: approve
      to: publish
contracts:
  change_plan:
    format: markdown
    description: The files to change, what changes in each, and the tests that prove it.
  diff_text:
    format: text
    description: The output of git diff, unchanged.
  review_findings:
    format: markdown
    description: A numbered list; each finding cites a file and line of the diff and says blocking or minor.
  verdict:
    format: markdown
    description: PASS or FAIL, the findings kept with their evidence, and a three-line summary of the change.
---

# Node Prompts & Edge Contracts

## @node: plan
Read the code this request touches and write a short plan: the files to change, what changes in each, and the tests to add or update.

The request:
{{goal}}

## @node: implement
Implement this plan. Change only the files it names; add or update the tests it lists.

{{plan.output}}

Return a short summary of what you changed.

## @node: review_correctness
Review ONLY correctness: logic errors, missed edge cases, broken contracts and tests that do not test the change.

{{diff.output}}

## @node: review_security
Review ONLY security: injection, missing authorization, secrets, unsafe input handling.

{{diff.output}}

## @node: gate
You see only the diff and the two reviews, not how the change was made. Keep the findings that the diff supports, drop the rest, and decide whether anything blocking is left.

Diff:
{{diff.output}}

Reviews:
{{review_correctness.output}}

{{review_security.output}}

## @node: approve
Show the verdict and the diff summary, then ask: open a pull request with this change?

## @node: publish
The user approved: {{approve.output}}

Commit the change on a new branch, push it, and open a pull request. Use the summary in this verdict as its description:
{{gate.output}}
`;

/**
 * Fan-out over a list the graph only learns at run time: one fresh-context review per changed file,
 * outputs handed on by file so a large review set is not re-typed into every later step.
 */
export const REVIEW_EACH_FILE_GRAPH_SKILL = `---
name: review-each-file
description: Lists the files a change touches, reviews each one in its own fresh-context run, merges the findings and gates them before reporting.
spec: skill-graph/2
handoff: file
topology:
  nodes:
    - id: goal
      type: input
      label: CHANGE TO REVIEW
    - id: scope
      type: orchestrator
      label: LIST THE FILES
      model: sonnet
      tools: [Read, Grep, Glob, "Bash(git diff:*)"]
      output_format: json
    - id: review_file
      type: worker
      label: REVIEW EACH FILE
      isolated_context: true
      model: haiku
      tools: [Read, Grep, Glob]
      foreach: scope.files
      max_parallel: 6
      max_items: 40
    - id: merge
      type: synthesizer
      label: MERGE FINDINGS
      model: sonnet
      tools: [Read]
    - id: gate
      type: verifier
      label: GATE (Fresh Context)
      isolated_context: true
      model: opus
      tools: [Read, Grep, Glob]
      gate: Every blocking finding names a file and line that exist, and no finding is listed twice.
      on_fail: retry
      max_retries: 1
      retry_target: merge
  edges:
    - from: goal
      to: scope
    - from: scope
      to: review_file
      contract: file_list
    - from: review_file
      to: merge
      contract: file_reviews
    - from: merge
      to: gate
      contract: findings
contracts:
  file_list:
    format: json
    description: "{ files: the changed paths to review, focus: one sentence on what the change is for }"
    required: [files, focus]
  file_reviews:
    format: json
    description: One entry per file, in file order; each lists its findings with line, severity and evidence.
  findings:
    format: markdown
    description: Findings grouped by severity (blocking, should fix, nit); each names the file and line.
---

# Node Prompts & Edge Contracts

## @node: scope
Find the files this change touches (run git diff --name-only for the range the user gives, or against the main branch). Leave out generated files, lockfiles and binaries.

The change:
{{goal}}

Return JSON: {"files": [the paths], "focus": "one sentence on what the change is for"}.

## @node: review_file
Review this one file as part of a change whose purpose is: {{scope.focus}}

File: {{item}}

Read the file and its diff. Report only real problems in this file: bugs, missed edge cases, security issues, and code that does not do what the change is for. For each give the line, a severity (blocking, should fix, nit) and the evidence. If the file is fine, say so in one line.

## @node: merge
Merge these per-file reviews into one list. Drop duplicates, group by severity (blocking first), and keep the file, line and evidence of each finding.

{{review_file.output}}

## @node: gate
You see only the merged findings, not how they were produced. Open each file and line a blocking finding names and check that it exists and says what the finding claims.

{{merge.output}}
`;

/* ------------------------------------------------------------------ blueprints */

interface FanOutSpec {
  name: string;
  description: string;
  goalLabel: string;
  splitter: string;
  workers: { id: string; label: string; focus: string }[];
  verifier: string;
  gate: string;
  merger: string;
  findingsContract: string;
  verifiedContract: string;
  /** Tools for the workers (the verifier is always read-only). */
  workerTools: string[];
  /** What each worker returns; defaults to evidence-backed findings. */
  workerReturn?: string;
  /** How the verifier filters the worker outputs; defaults to dropping claims without evidence. */
  verifierRule?: string;
  /** The contract descriptions on the worker and verifier edges. */
  findingsDescription?: string;
  verifiedDescription?: string;
}

/** goal -> splitter -> N parallel workers -> fresh-context verifier -> synthesizer. */
function fanOutBlueprint(spec: FanOutSpec): string {
  const workerIds = spec.workers.map((worker) => worker.id);
  const nodes: GraphNode[] = [
    { id: "goal", type: "input", label: spec.goalLabel, isolatedContext: false, prompt: "" },
    {
      id: "splitter",
      type: "orchestrator",
      label: "SPLIT",
      isolatedContext: false,
      model: "sonnet",
      tools: ["Read"],
      prompt: `${spec.splitter}\n\nInput:\n{{goal}}\n\nOutput strictly as JSON with one key per worker: ${workerIds.map((id) => `\`${id}\``).join(", ")}. Each value is the exact task for that worker.`,
    },
    ...spec.workers.map<GraphNode>((worker) => ({
      id: worker.id,
      type: "worker",
      label: worker.label,
      isolatedContext: false,
      model: "haiku",
      tools: spec.workerTools,
      prompt: `${worker.focus}\n\nYour task: {{splitter.${worker.id}}}\n\n${spec.workerReturn ?? "Return findings as a numbered list. For each one give the evidence (file, line, quote or source) and a confidence of high, medium or low."}`,
    })),
    {
      id: "verifier",
      type: "verifier",
      label: "VERIFIER (Fresh Context)",
      isolatedContext: true,
      model: "opus",
      tools: ["Read", "Grep", "Glob"],
      gate: spec.gate,
      onFail: "retry",
      maxRetries: 1,
      prompt: `${spec.verifier}\n\nYou only see the raw worker outputs below, not their reasoning. ${spec.verifierRule ?? "Drop any claim without concrete evidence, merge duplicates, and mark what you rejected and why."}\n\nOriginal input: {{goal}}\n\nWorker outputs:\n{{workers.output}}`,
    },
    { id: "merger", type: "synthesizer", label: "FINAL ANSWER", isolatedContext: false, model: "sonnet", tools: ["Read"], prompt: `${spec.merger}\n\n{{verifier.output}}` },
  ];
  const graph: SkillGraph = {
    name: spec.name,
    description: spec.description,
    nodes,
    edges: [
      { from: "goal", to: "splitter" },
      ...workerIds.map((id) => ({ from: "splitter", to: id, contract: "subtask_json" })),
      ...workerIds.map((id) => ({ from: id, to: "verifier", contract: spec.findingsContract })),
      { from: "verifier", to: "merger", contract: spec.verifiedContract },
    ],
    contracts: {
      subtask_json: { format: "json", description: "One key per worker id; each value is that worker's task." },
      [spec.findingsContract]: { format: "markdown", description: spec.findingsDescription ?? "A numbered list; every item has its evidence and a confidence of high, medium or low." },
      [spec.verifiedContract]: { format: "markdown", description: spec.verifiedDescription ?? "Only the items that passed verification, then the rejected ones with the reason." },
    },
    preamble: "# Node Prompts & Edge Contracts",
    extraFrontmatter: {},
  };
  return serializeGraphSkill(graph);
}

export interface Blueprint {
  id: string;
  title: string;
  hint: string;
  source: string;
}

export const BLUEPRINTS: readonly Blueprint[] = [
  {
    id: "parallel-system-audit",
    title: "Parallel audit",
    hint: "Research, compare, check and find gaps, then verify in a fresh context",
    source: DEFAULT_GRAPH_SKILL,
  },
  {
    id: "ship-a-change",
    title: "Ship a change",
    hint: "Edit until tests pass, review the diff in parallel, approve once before the PR",
    source: SHIP_CHANGE_GRAPH_SKILL,
  },
  {
    id: "review-each-file",
    title: "Review each file",
    hint: "One fresh-context review per changed file, however many there are, then merge and gate",
    source: REVIEW_EACH_FILE_GRAPH_SKILL,
  },
  {
    id: "pr-review-graph",
    title: "PR review",
    hint: "Security, performance, architecture and test coverage reviewers",
    source: fanOutBlueprint({
      name: "pr-review-graph",
      description: "Reviews a pull request with four parallel specialists, filters false positives in a fresh context, and writes prioritized PR comments.",
      goalLabel: "PULL REQUEST (diff or link)",
      splitter: "You are the review lead. Read the pull request and give each reviewer the files and concerns that matter for their specialty.",
      workers: [
        { id: "review_security", label: "Security & Auth", focus: "Review ONLY for security: injection, authn/authz gaps, secrets, unsafe deserialization, SSRF, missing input validation." },
        { id: "review_performance", label: "Performance & Memory", focus: "Review ONLY for performance: N+1 queries, unbounded loops or payloads, leaks, blocking calls on hot paths, missing caching." },
        { id: "review_architecture", label: "Architecture & Style", focus: "Review ONLY for architecture: layering violations, duplicated logic, naming, consistency with existing patterns in the codebase." },
        { id: "review_tests", label: "Test Coverage", focus: "Review ONLY test coverage: untested branches, missing edge cases, brittle or meaningless assertions." },
      ],
      verifier: "You are an independent auditor. Re-check each finding against the diff itself and remove false positives.",
      gate: "Every kept finding points at a file and line in the diff.",
      workerTools: ["Read", "Grep", "Glob", "Bash"],
      merger: "Write the final review as prioritized PR comments (blocking, should fix, nit). Each comment names the file and line and says what to change.",
      findingsContract: "review_findings",
      verifiedContract: "verified_findings",
    }),
  },
  {
    id: "rfc-discovery-graph",
    title: "RFC discovery",
    hint: "Feasibility, prior art, interface design and failure modes",
    source: fanOutBlueprint({
      name: "rfc-discovery-graph",
      description: "Explores a proposal from four angles in parallel, red-teams unstated assumptions in a fresh context, and drafts an RFC.",
      goalLabel: "PROPOSAL",
      splitter: "You are the RFC editor. Turn the proposal into four focused research questions.",
      workers: [
        { id: "feasibility", label: "Feasibility Study", focus: "Assess ONLY feasibility: effort, dependencies, migration path and the hardest technical risk." },
        { id: "prior_art", label: "Prior Art", focus: "Survey ONLY prior art: existing tools, competitors and published approaches, with what each gets right and wrong." },
        { id: "interface_design", label: "Interface / DX", focus: "Design ONLY the interface: API or CLI shape, configuration, error messages and the first five minutes of use." },
        { id: "failure_modes", label: "Failure Modes", focus: "Find ONLY failure modes: what breaks at scale, under bad input, during partial rollout or rollback." },
      ],
      verifier: "You are a red-team reviewer. List the unstated assumptions behind each claim and reject claims that rest on them.",
      gate: "No kept claim rests on an unstated assumption.",
      workerTools: ["Read", "Grep", "Glob", "WebSearch", "WebFetch"],
      merger: "Write a production RFC in Markdown: Summary, Motivation, Proposal, Alternatives considered, Risks, Open questions.",
      findingsContract: "research_notes",
      verifiedContract: "verified_notes",
    }),
  },
  {
    id: "bug-triaging-graph",
    title: "Bug triage",
    hint: "Stack trace, logs, recent commits and a minimal repro",
    source: fanOutBlueprint({
      name: "bug-triaging-graph",
      description: "Triages a bug report with four parallel investigators, re-checks the evidence in a fresh context, and writes a root-cause diagnosis with a test plan.",
      goalLabel: "BUG REPORT",
      splitter: "You are the triage lead. Split the bug report into four investigation tasks.",
      workers: [
        { id: "stack_trace", label: "Stack Trace Analyzer", focus: "Analyze ONLY the stack trace and error: the failing frame, the inputs that reach it, and why it throws." },
        { id: "logs_metrics", label: "Log / Metric Correlator", focus: "Correlate ONLY logs and metrics: when it started, what changed at that time, and which users or requests are affected." },
        { id: "commits", label: "Commit Inspector", focus: "Inspect ONLY recent commits and config changes that touch the failing path, and rank them by likelihood." },
        { id: "repro", label: "Minimal Repro Builder", focus: "Build ONLY a minimal reproduction: the smallest steps or script that trigger the bug." },
      ],
      verifier: "You are an independent debugger. Check that the evidence actually connects each hypothesis to the symptom; reject the rest.",
      gate: "At least one hypothesis is connected to the symptom by evidence, and the repro reproduces it.",
      workerTools: ["Read", "Grep", "Glob", "Bash"],
      merger: "Write the diagnosis: root cause, evidence, fix, and a test plan that reproduces the bug before the fix and passes after it.",
      findingsContract: "hypotheses",
      verifiedContract: "root_cause",
    }),
  },
  {
    id: "research-report",
    title: "Research report",
    hint: "Sources, figures, counterpoints and open questions, fact-checked in a fresh context",
    source: fanOutBlueprint({
      name: "research-report",
      description: "Researches a question from four angles in parallel, fact-checks every claim against its source in a fresh context, and writes a sourced report.",
      goalLabel: "RESEARCH QUESTION",
      splitter: "You are the research lead. Turn the question into four research tasks, one per angle, each saying what to look for and how recent it must be.",
      workers: [
        { id: "sources", label: "Primary Sources", focus: "Find ONLY primary sources: official documents, papers, datasets and first-hand accounts, with what each one says." },
        { id: "figures", label: "Figures & Data", focus: "Collect ONLY figures: statistics, dates, prices and measurements, each with where it comes from and how recent it is." },
        { id: "counterpoints", label: "Counterpoints", focus: "Look ONLY for disagreement: credible sources that contradict the obvious answer, and the reasons they give." },
        { id: "open_questions", label: "Open Questions", focus: "Find ONLY what is unknown or disputed: gaps in the evidence and claims that nobody has checked." },
      ],
      workerReturn: "Return findings as a numbered list. For each one give the source (title and URL), what it says in a short quote, and a confidence of high, medium or low.",
      verifier: "You are a fact-checker. Check each claim against the source it cites; reject claims whose source does not say it or is not named.",
      gate: "Every kept claim names a source that says it, and every figure has a date.",
      workerTools: ["Read", "WebSearch", "WebFetch"],
      merger: "Write the research report in Markdown: the answer in two sentences, Key findings with their sources, Where sources disagree, Open questions, and a list of Sources.",
      findingsContract: "research_findings",
      verifiedContract: "checked_findings",
      findingsDescription: "A numbered list of claims; every claim has its source, a short quote and a confidence of high, medium or low.",
      verifiedDescription: "Only the claims a cited source supports, then the rejected claims with the reason.",
    }),
  },
  {
    id: "write-an-article",
    title: "Write an article",
    hint: "Angle, outline, facts and reader in parallel, then an editor check before the draft",
    source: fanOutBlueprint({
      name: "write-an-article",
      description: "Plans an article, post or newsletter from four angles in parallel, has an editor check the notes in a fresh context, and writes the draft.",
      goalLabel: "BRIEF (topic, audience, length, voice)",
      splitter: "You are the managing editor. Read the brief and give each writer the part of the piece they prepare, with the audience and length in mind.",
      workers: [
        { id: "angle", label: "Angle & Headline", focus: "Work ONLY on the angle: three possible headlines with a hook for each, and which one fits the audience best and why." },
        { id: "outline", label: "Outline", focus: "Write ONLY the outline: the sections in order, the point of each one, and where examples go." },
        { id: "facts", label: "Facts & Quotes", focus: "Gather ONLY the facts the piece needs: claims, figures and quotes, each with its source." },
        { id: "reader", label: "Reader", focus: "Think ONLY about the reader: what they already know, the questions they will ask, and the jargon to avoid." },
      ],
      workerReturn: 'Return your notes as a numbered list. Mark each note with the source it rests on, or with "opinion" when it rests on none.',
      verifier: "You are the editor. Check each note for accuracy and for fit with the brief.",
      verifierRule: "Cut every factual note without a source and every note off the brief, merge duplicates, and list what you cut and why.",
      gate: "Every fact kept has a source, and the angle and outline match the brief's audience and length.",
      workerTools: ["Read", "WebSearch", "WebFetch"],
      merger:
        "Write the piece from the approved notes: the headline, a hook paragraph, the sections of the outline, and a closing line. Use only facts from the notes, in the voice and length the brief asks for.",
      findingsContract: "content_notes",
      verifiedContract: "approved_notes",
      findingsDescription: "A numbered list of notes, each marked with its source or as opinion.",
      verifiedDescription: "The notes that passed the edit, then the cut ones with the reason.",
    }),
  },
  {
    id: "analyze-a-dataset",
    title: "Analyze a dataset",
    hint: "Profile, clean, analyze and sanity-check a table in parallel, then re-check every figure",
    source: fanOutBlueprint({
      name: "analyze-a-dataset",
      description: "Analyzes a CSV or table: profiling, cleaning rules, answers and sanity checks run in parallel, every figure is re-checked in a fresh context, then a data report.",
      goalLabel: "DATA FILE + QUESTIONS",
      splitter: "You are the analysis lead. Read the file path and the questions, and give each analyst their part of the work on that file.",
      workers: [
        { id: "profile", label: "Profile", focus: "Profile ONLY the data: columns, types, row count, missing values, duplicates and outliers. Compute every figure; never estimate it." },
        { id: "cleaning", label: "Cleaning Rules", focus: "Propose ONLY cleaning rules: how to fix types, missing values, duplicates and bad rows, with how many rows each rule touches." },
        { id: "analysis", label: "Analysis", focus: "Answer ONLY the questions in the task with the data: each figure, and the command or formula that produced it." },
        { id: "sanity", label: "Sanity Checks", focus: "Check ONLY whether the data can be trusted: totals that should add up, impossible values, and gaps in time or coverage." },
      ],
      workerReturn:
        "Return findings as a numbered list. For each one give the figure, how you got it (the command, formula or rows it rests on) and a confidence of high, medium or low. Never change the data file.",
      verifier: "You are a data reviewer. Spot-check each figure against the file itself; reject figures you cannot trace back to the data.",
      gate: "Every kept figure says how it was computed and matches the data on a spot check.",
      workerTools: ["Read", "Grep", "Glob", "Bash"],
      merger: "Write the data report: the answers with their figures, the cleaning steps to apply in order, and the caveats a reader must know.",
      findingsContract: "data_findings",
      verifiedContract: "checked_figures",
      findingsDescription: "A numbered list; every figure has how it was computed and a confidence of high, medium or low.",
      verifiedDescription: "Only the figures that matched the data on a spot check, then the rejected ones with the reason.",
    }),
  },
  {
    id: "design-an-app",
    title: "Design an app",
    hint: "Users, features, screens and data model in parallel, then a product review before the spec",
    source: fanOutBlueprint({
      name: "design-an-app",
      description: "Designs an app from an idea: users, scope, screens and data model in parallel, a fresh-context product review that makes them fit together, then a product spec.",
      goalLabel: "APP IDEA",
      splitter: "You are the product lead. Read the idea and give each designer their part of the app, with the constraints the idea states.",
      workers: [
        { id: "users", label: "Users & Stories", focus: "Work ONLY on users: who they are, the jobs they need the app for, and the three most important user stories." },
        { id: "features", label: "Features & Scope", focus: "Scope ONLY the features: the smallest useful first version, what waits for later, and why." },
        { id: "screens", label: "Screens & Flows", focus: "Design ONLY the screens and flows: each screen, what it shows, and how the user moves between them, with empty and error states." },
        { id: "data_model", label: "Data Model", focus: "Design ONLY the data: entities, fields and relationships, and the outside services the app needs." },
      ],
      workerReturn: "Return your proposals as a numbered list. For each one give the user need it serves and a confidence of high, medium or low.",
      verifier: "You are a product reviewer. Check that the proposals fit together: every screen serves a user story, every feature has a screen, and the data model holds what the screens show.",
      verifierRule: "Cut proposals that serve no stated user need, settle conflicts between them, and list what you cut and why.",
      gate: "Every first-version feature maps to a user story, a screen and the data it needs.",
      workerTools: ["Read", "WebSearch"],
      merger: "Write the product spec in Markdown: Problem, Users and stories, First version scope, Screens and flows, Data model, Open questions.",
      findingsContract: "design_proposals",
      verifiedContract: "approved_design",
      findingsDescription: "A numbered list of proposals, each with the user need it serves and a confidence of high, medium or low.",
      verifiedDescription: "The proposals that fit together, then the cut ones with the reason.",
    }),
  },
];
