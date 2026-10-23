# Skill Graph: where a trained model helps validation, and how to build one

> **Status**: plan only, nothing built · **Date**: 2026-10-22 · **Scope**: the checker (`validateGraph` in `graphSkill.ts`), the run referee (`graphRun.ts`, `graphChatRun.ts`) and the connector (`graphConnector.ts`)
> **Constraint**: no API calls and no keys (ADR-001, the connector ADR). A model must run inside our own code, trained by us (Google Colab), and the connector must stay stateless and store nothing.

## 1. How validation works today

There are two layers, and both are deterministic code.

**Design time: the checker (`validateGraph`), about 80 rules.**

- **~75 structural rules** prove the graph is wired: cycles, unknown references, keys a step reads that its source never returns, loops without a check, fan-out without a cap, irreversible steps without an approval, parallel steps that both edit files, retry targets, and so on. These are exact. A model would make them worse, so they stay as they are.
- **5 text rules** judge prompts, and they are shallow:

| Rule | How it decides today | What it misses |
| --- | --- | --- |
| `gate-vague` | fewer than 4 words | "The work is good and high quality overall" passes; "totals add up" (3 words) fails |
| `prompt-no-output` | a list of words like *return, list, json* | "Give me your thoughts" passes; a precise prompt without those words fails |
| `prompt-too-short` | fewer than 6 words | length is not clarity |
| `prompt-no-inputs` | no `{{ref}}` in the prompt | a prompt can name its input in words |
| `reads-only-review` | a regex of words like *forward, keep, reject* in the verifier's prompt | any phrasing outside the list |

**Run time: the referee.** It checks that JSON parses and has the contract's required keys, that a `GATE: PASS/FAIL` line is there, that a loop said `LOOP: DONE`, and that commands exited 0. It counts retries and decides what runs next. It does **not** look at what an answer says.

**What the tools already admit they cannot do** (from the tool descriptions and MEMORY.md, 2026-10-21):

1. *"It cannot tell whether a step's task needs data it does not get"* (validate_graph's description). The dry run's "Sees" lines are the only backstop, and they depend on Claude reading them.
2. *"The checker cannot read prose: a contract description that contradicts the keys is undetectable unless `required` is set."*
3. A Markdown or text contract ("a numbered list, each claim with its source and date") is never checked at all. Only JSON contracts are.
4. A verifier's `GATE: PASS` is taken on trust. In a chat run, the verifier is the same Claude that wrote the work, so a rubber stamp is likely and nothing notices it.

## 2. Where genuine model intelligence is needed, and where it is not

The test for each candidate: is it a judgement about **meaning** that rules cannot make, can we get **training labels without user data** (we store nothing, so there is none), and is the cost of a **wrong flag** low?

### Worth a model

| # | Where | The question | Why rules fail | Labels from |
| - | --- | --- | --- | --- |
| **M1** | run time, after a verifier answers | Is the verdict consistent with what the verifier wrote? (`GATE: PASS` after listing three problems; a PASS with no evidence at all) | Contradiction is about meaning: "no issues remain" vs "the date is still missing" | synthetic verifier outputs with flipped verdicts |
| **M2** | design time, per step | Does this step's task need information that none of its inputs carries? ("total the scores" when no input holds scores) | The task names data in words; inputs are described in words too | graph mutations: remove an edge or a key from a working starter; the label is free |
| **M3** | design time, per contract | Does the contract's description match what the steps after it read? (description says "an array of candidates", steps read `.judge_correctness`) | Description is prose; reads are keys | graph mutations: swap descriptions between contracts |
| **M4** | design time, per gate | Can a checker actually decide this gate from its inputs? ("every total equals the sum of its items" yes; "the result is excellent" no) | Checkability is not word count | a few hundred gates, paraphrased and labelled |

M1 is the most valuable. It runs on every checked step of every chat run, and it addresses the one weakness the chat runner cannot fix by design: the checker and the worker are the same model.

### Better done with deterministic code first (no model)

- **Markdown contract shape (gap 3).** Most descriptions name a structure: "numbered list", "each with its source", "a table", "ends with the total". A small parser that turns those phrases into checks (count list items, require a link per item, require a table) closes most of this gap exactly, and it explains itself. The model is only for what remains after it, if anything.
- **Prompt-quality rules.** Wider word lists and phrase patterns improve `prompt-no-output` and `prompt-no-inputs` cheaply. They do not justify a model on their own; M4 can absorb them later.

### Not worth a model (honest)

- **Anything structural.** Exact rules beat any model there.
- **Judging answer quality** ("is this research good?"). A 20–70M parameter model judging Claude's work would be wrong more often than Claude is. It adds noise, not intelligence.
- **Fact-checking claims against sources.** The connector does not fetch web pages (`openWorldHint: false`, no outbound calls), so it never sees the sources. An entailment model with nothing to entail against has nothing to do.
- **Drafting or editing graphs.** Claude writes the outline and the format is filled in by code. A small model has no role here.
- **An LSTM.** Without pretraining it needs far more data than we can generate, and pretrained small transformers are better at the same size and speed.

## 3. The model

**One shared encoder, four small heads**, one per task (M1–M4), with the task name as an input prefix. One file to ship, one load, one cold start.

| Choice | Pick | Why |
| --- | --- | --- |
| Base | `deberta-v3-xsmall` (~70M params, of which ~22M backbone), or `MiniLM-L12` (~33M) if latency is tight | Both are pretrained on natural-language inference style tasks and strong at sentence-pair judgement (premise vs hypothesis = task vs inputs, verdict vs body). BERT-base (110M) is slower for little gain here |
| Input | `[task] text A [SEP] text B`, max 512 tokens; long verifier answers are cut to their last 512 tokens, where the verdict and the reasons sit | |
| Output | a probability per task; a flag only above a threshold set on the gold set (§5) | |
| Export | ONNX, int8 quantised: ~25–70 MB | fits a Vercel function (250 MB unzipped limit) |
| Runtime | `onnxruntime-node` (or `@huggingface/transformers`, which wraps it) in the connector's route; `intraOpNumThreads: 1` | Same weights and one thread give the same answer for the same input, so tools stay idempotent |
| Cost | ~1–2 s added to a cold start (loading the model), ~10–60 ms per pair on CPU | to be measured in phase 4 |

The studio could load the same file in the browser later (transformers.js, WASM), but that is not in this plan: the scope is the connector.

## 4. Training data without user data

We never see users' graphs or answers, so all training data is made by us.

1. **Graph mutations (M2, M3), labels for free.** Start from the 14 starters plus a few hundred drafted graphs. Apply one mutation at a time: delete an edge, drop a required key, swap two contract descriptions, rename what a prompt asks for. Each mutation yields a "broken" example, and the original a "fine" one. Run the existing checker on each mutant and discard those it already catches, so the model learns only what the rules miss.
2. **Text from an open model run on Colab (M1, M4).** Run an open-weights instruct model locally in the notebook (for example Qwen2.5-7B-Instruct or Llama-3.1-8B-Instruct in 4-bit on a T4 or L4). It is not an API: it runs on your Colab GPU. Use it to write verifier answers with consistent and inconsistent verdicts across the topics of the starters, and gates that range from precise to empty. Ask for each example with its intended label, then filter (§5 gold set catches label noise).
3. **Paraphrase for variety.** The same local model rewrites prompts and gates in different styles (terse, chatty, non-native English), so the model does not learn the phrasing of our starters.
4. **Size.** About 5–10k examples per task is enough to fine-tune a pretrained small encoder; generating them takes a few Colab sessions.

## 5. How we know it works (the bar to ship)

- **A gold set we label by hand**, 300–500 examples per task, never produced by the generator: real-looking graphs and answers, labelled by you (or by me and reviewed by you). It is the only honest measure, because a model trained and tested on one generator's text learns that generator.
- **Baseline first.** Run today's rules on the gold set and record their precision and recall. The model ships for a task only if it beats the rules there.
- **Precision before recall.** A flag that is wrong one time in five teaches users to ignore all flags. Ship a task only at **precision ≥ 0.9** on the gold set, at whatever recall that gives.
- **Advisory, never blocking.** Model findings are warnings with their own codes (`semantic-*`) and a confidence, never errors, and never a referee decision on their own (§6).
- **Fallback.** If the model fails to load or times out, the tools answer exactly as today.

## 6. Where it plugs in

`validateGraph` stays synchronous, pure and model-free: the studio and the tests rely on it. The model sits in one new async module, `lib/graphSemantic.ts`, called only by the connector:

| Tool | Adds |
| --- | --- |
| `validate_graph`, `draft_graph`, `edit_graph` | M2, M3, M4 as warnings under the checker's own, e.g. `[semantic-missing-input] step total: its task needs the scores, and no input carries them (confidence 0.93)` |
| `dry_run_graph` | the same M2 note on the step's "Sees" line |
| `run_graph`, `advance_run` | M1 after a verifier's answer. **Proposed behaviour** (your call, §8): an inconsistent PASS is not failed; the referee asks for the verdict again once, quoting the sentences that contradict it, and logs it for the reflect step |

## 7. Phases

| Phase | What | Needs Colab | Ships to users |
| - | --- | - | - |
| 0 | Gold set (~300 per task) and baseline of today's rules on it | no | no |
| 1 | Deterministic Markdown-contract shape checks (§2), measured on the gold set | no | yes (exact, explainable) |
| 2 | Data generation: graph mutations + local open model on Colab | yes | no |
| 3 | Fine-tune the shared encoder with four heads; pick thresholds on a held-out split, then report on gold | yes | no |
| 4 | ONNX int8 export; measure size, cold start and p95 latency on a Vercel preview deploy | no | no |
| 5 | `graphSemantic.ts`, warnings in the connector for the tasks that met the bar, behind a server flag | no | yes |
| 6 | M1 in the referee, if phase 5 holds up | no | yes |

Do phase 0 and 1 before any training: they set the bar, and phase 1 may close part of the gap without a model.

## 8. Decisions for you

1. **M1 behaviour.** When a PASS contradicts its own text: ask for the verdict again once (recommended), only show a note, or fail the gate?
2. **Gold set labelling.** Will you label it, or should I draft labels for you to review? It must not come from the training generator.
3. **Dependency.** The connector would gain one npm dependency (`onnxruntime-node`) and a ~25–70 MB model file. Host the file in the repo (Git LFS) or download it at build time from a release?
4. **Order.** Start with M1 (run time, most value) or M2 (design time, easiest labels)?
