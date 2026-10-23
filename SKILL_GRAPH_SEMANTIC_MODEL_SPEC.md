# sg-sem: the Skill Graph semantic checker model (design spec)

> **Status**: design only, nothing built · **Date**: 2026-10-22 · **Reads with**: `SKILL_GRAPH_SEMANTIC_CHECKS_PLAN.md` (why and where; this file is the how)
> **Numbers marked ~ are estimates** to be replaced by measurements in phases 3–4.

## 0. Where it runs: the backend only

- **Server side, inside the MCP connector's route** (`src/app/graph/mcp/route.ts` → `lib/graphSemantic.ts`). The model file is loaded by the serverless function that already answers Claude; it adds checks to `validate_graph`, `draft_graph`, `edit_graph`, `dry_run_graph`, `run_graph` and `advance_run`.
- **Nothing on the frontend.** The studio, the guide, the landing page and every other page are unchanged: no model download in the browser, no new page, no new UI. `validateGraph` (the synchronous checker the studio uses) is not touched.
- **No new API route.** ADR-001 allows exactly one route that receives user payloads, the connector, and the model lives inside it. The studio does not call the server to validate; it keeps validating in the browser as it does today.
- **The site keeps working without it.** If the model file is missing, fails to load or runs over its time budget, every tool answers exactly as it does now. The model only adds warnings and the H1 question.

## 1. What it is

`sg-sem` is a small text model built for one job: reading Skill Graph files and run answers the way our checker reads them, and judging the four things the checker cannot (plan §2):

| Head | Name in the plan | Question it answers |
| - | - | - |
| H1 | M1 verdict consistency | A verifier answered `GATE: PASS`. Does its own text still report an open problem? Which sentences? |
| H2 | M2 missing input | Does this step's task need what another step returns, one it does not read and none of its inputs carries? Which words of the task name it? (Asked once per such step.) |
| H3 | M3 contract mismatch | Does a contract's description agree with what the steps after it read? |
| H4 | M4 gate checkability | Can a checker decide this gate from the inputs it gets? |

It is "ours" in three ways that matter, and not in one way that would not:

- **Ours:** the input format (§4) is built from our graph objects by our own serializer, with special tokens for our concepts (step, gate, contract, verdict). It takes graph facts as numeric features next to the text (§5). Its training data comes from our starters, our checker and our mutation tools (§7), and its outputs map onto our checker's issue codes (§6).
- **Not from scratch:** the language understanding comes from a pretrained encoder. Training one from zero needs billions of words to learn English; a few tens of thousands of our examples cannot teach that. We fine-tune, which is how every useful small model of this kind is built.

## 2. Architecture

```
              text (our serializer, §4)                 graph facts (§5)
                        │                                      │
             WordPiece tokens, ≤ 384                   16 numbers, scaled 0–1
                        │                                      │
        ┌───────────────┴───────────────┐                      │
        │  pretrained encoder, 12 layers │                      │
        │  hidden 384 (MiniLM-L12-H384)  │                      │
        └───┬───────────────┬────────────┘                      │
            │ [CLS] vector  │ token vectors                     │
            │               │                                   │
   concat(CLS, features) ───┼───────────────────────────────────┘
            │               │
   ┌────────┼──────────┬────┴─────────────┬──────────────────┐
   ▼        ▼          ▼                  ▼                  ▼
  H1 doc  H1 sentence  H2 doc + span      H3 doc             H4 3-class
  (1)     (per [SEN])  (1 + start/end)    (1)                (checkable/partly/no)
```

| Part | Choice | Size |
| --- | --- | --- |
| Encoder | **`cross-encoder/ms-marco-MiniLM-L12-v2`** (default): the `microsoft/MiniLM-L12-H384-uncased` network after training on ~500k MS MARCO text pairs, so it starts out able to judge whether one text is supported by another (five runs from the raw checkpoint, which never saw a text pair, left H2 at chance on the gold set); bake-off against `microsoft/deberta-v3-xsmall` in phase 3 | ~33M params vs ~71M (most of DeBERTa's is a 128k-word vocabulary) |
| Feature projection | 16 → 64, GELU | ~1k |
| Each doc head | Linear(384+64 → 128) → GELU → Linear(128 → k) | ~65k each |
| H1 sentence head | Linear(384 → 1) on each `[SEN]` marker token | ~400 |
| H2 span head | Linear(384 → 2) on every token (start, end), as in extractive QA | ~800 |
| Total | | **~33.3M** (MiniLM) |

**Why MiniLM by default.** It is a BERT-architecture model, so it exports to ONNX without surprises, quantizes well to int8, and uses a plain WordPiece vocabulary (30,522 words) that we can tokenize in ~100 lines of TypeScript with no dependency (§9). DeBERTa-v3 is usually stronger at sentence-pair judgement, but it is twice the size, its attention is slower per token, and its SentencePiece tokenizer needs a library. It ships only if it beats MiniLM on the gold set by a clear margin (≥ 3 points of F1 at the shipping threshold).

**Why one model, not four.** One file, one load, one cold start. The four tasks share most of what they need: reading a task, an input description and a verdict in the same vocabulary. Sharing also lets the small tasks (H3, H4) borrow from the large ones.

## 3. Sequence budget

| Head | Typical length (tokens) | Cap | Over the cap |
| --- | --- | --- | --- |
| H1 | 150–900 (verifier answers run long) | 384 | keep the gate, then the **last** 300 tokens of the answer body: the verdict and its reasons sit at the end |
| H2 | 100–300 | 384 | cut each input's description to its first 40 tokens, then the task's middle |
| H3 | 40–150 | 256 | |
| H4 | 40–200 | 256 | |

384 rather than 512 keeps CPU latency down (attention cost grows with the square of the length); the cap is revisited if the gold set shows answers cut off before their reasons.

## 4. Input formats (exact)

All four are written by **one TypeScript module, `lib/semanticInput.ts`**, used both by the data export script (training) and by the connector (inference). That one rule removes the most common way small models fail in production: training text and live text differing in small ways.

Special tokens added to the vocabulary (their embeddings are learned in fine-tuning):
`[H1] [H2] [H3] [H4]` (which question), `[GATE] [TASK] [INPUT] [CONTRACT] [READS] [VERDICT] [SEN] [CANDIDATE]` (`[CANDIDATE]` from input version 2).

**H1 — verdict consistency.** Built from `parseVerdict` (graphRun.ts): the work above the verdict line, and the lines after it.

```
[H1] [GATE] Every kept claim has a source that says it, and no kept claim is contradicted by a more reliable or more recent source.
[SEP] [SEN] Claim 1 holds: the NIH page states a half-life of about five hours. [SEN] Claim 2 cites a blog post from 2014 that I could not open. [SEN] Claim 3 holds. [VERDICT] PASS
```

The body is split into sentences (and list items); each gets a `[SEN]` marker. Labels: document = consistent / inconsistent; each `[SEN]` = "reports an open problem" or not. Above, sentence 2 is an open problem, so a PASS is inconsistent. The marked sentence becomes the quote in the referee's question (§6).

**H2 — missing input.** One pair per *candidate*: every other step with an output that the step does not read and that does not run after it (`edgeCandidates`; the request is none, every step can quote it). Built from the node, the candidate, its predecessors, `jsonKeysFor` and the contract descriptions: the same facts `handOff()` uses for the "Sees" lines. The candidate's line says what it returns the same way whether or not a step reads it (its contract's description, else the `Return …` paragraph of its task), so a cut input, often left with no reader, does not look different.

```
[H2] [TASK] Add up the scores of every criterion and give the essay a final grade out of 100.
[SEP] [CANDIDATE] score · Worker · One score per criterion, with the quotes behind it.
[INPUT] essay · Your request · the user's essay and rubric
[INPUT] line_edits · Worker · A numbered list of line edits, each quoting the sentence and giving the better version.
```

Labels: pair = the task needs what the candidate returns and no input carries it / not; span = the words of the task that name it ("the scores of every criterion"). A step is flagged when any of its pairs is; the warning quotes the span and names the candidate. Through input version 1 the pair was the task against the inputs alone: the model had to notice data that appears nowhere in its input, and after five data fixes it still caught 1 of 28 gold cuts at its threshold (msmarco-3, gold AUROC 0.74). With the candidate written out it compares two texts it can see, the judgement its MS MARCO pre-training is for.

**H3 — contract vs readers.** Built from the contract, the edges that carry it and `nodeRefs` of the steps after them.

```
[H3] [CONTRACT] candidates_json · json · An array of candidates, each with a name and a CV summary.
[SEP] [READS] judge_correctness reads {{parse_candidates.judge_correctness}} · judge_clarity reads {{parse_candidates.judge_clarity}} · required: none
```

Label: agrees / contradicts. (This is the real case from the 2026-10-21 Claude test in MEMORY.md.)

**H4 — gate checkability.**

```
[H4] [GATE] The result is excellent and the user will be happy.
[SEP] [INPUT] itinerary · Worker · A day-by-day plan; every item has a cost with its source or an estimate mark, and the plan ends with the total.
```

Label: checkable / partly / not checkable from these inputs.

## 5. Graph features (the part text alone cannot see)

Sixteen numbers per example, computed by the same module from the graph object, scaled to 0–1. They let a small model use facts we already know exactly instead of guessing them from text.

| # | Feature | # | Feature |
| - | --- | - | --- |
| 1 | step type (one of 8, as index/7) | 9 | number of inputs (÷10, capped) |
| 2 | fresh context (0/1) | 10 | inputs that are JSON (share) |
| 3 | has gate (0/1) | 11 | the input is the user's request only (0/1) |
| 4 | gate word count (÷40) | 12 | contract format json/markdown/text (index/2) |
| 5 | on_fail retry (0/1) | 13 | required keys on the contract (÷10) |
| 6 | repeats for each (0/1) | 14 | keys the readers read that are not required (÷10) |
| 7 | loop (0/1) | 15 | steps after this one (÷10) |
| 8 | prompt word count (÷400) | 16 | verifier answer: verdict line found and parsed (0/1) |

Ablation in phase 3: text only vs text + features. If the features do not help a head, they are dropped for it.

## 6. Outputs, and what the connector does with them

Each head ends in a probability, calibrated per head by temperature scaling on the dev split, and compared with a threshold chosen on the dev split for **precision ≥ 0.9** (plan §5).

| Head | Above the threshold | Message (example) |
| --- | --- | --- |
| H1 | the referee asks once for the verdict again, quoting the flagged sentences; the run is not failed on the model's word | "Check the facts said PASS, but it also wrote: 'Claim 2 cites a blog post from 2014 that I could not open.' Confirm the verdict (PASS or FAIL) with that in mind." |
| H2 | warning `semantic-missing-input` | "step `grade`: its task needs 'the scores of every criterion', which `score` returns and none of its inputs (essay, line_edits) carries (0.94). Add an edge from `score`, or say where it comes from." |
| H3 | warning `semantic-contract-mismatch` | "contract `candidates_json` describes an array of candidates, but `judge_correctness` and `judge_clarity` read keys of an object (0.91)." |
| H4 | warning `semantic-gate-uncheckable` (replaces `gate-vague` when the model is loaded) | "The gate of `budget_check` cannot be decided from its inputs: it judges how the user will feel (0.88). Say what must be true, e.g. 'the total is within the budget'." |

The confidence is shown, so Claude and the user can weigh the warning. H1 never fails a run by itself: a second "PASS" after the quote is accepted, and the exchange goes into the failure log, so a reflect step can learn from it.

## 7. Training data

**No user data, ever.** The connector stores nothing, so there is none to use, and the model card says so. All data is made in two places: a Node script that uses our real library code, and a Colab notebook.

### 7.1 From our code: `scripts/semantic/export-examples.mjs`

It runs our TypeScript library (vite-node, like the tests) on seed graphs and writes JSONL:

- **Seeds.** The 14 starters, plus ~300 graphs drafted with `draftGraph` from outlines the local LLM writes (§7.2) across everyday and code topics. Only seeds the checker passes with zero errors are kept.
- **Mutations**, each a list of `editGraph` operations, so every mutant is a valid file the checker still reads:

| Mutation | Produces |
| --- | --- |
| `disconnect` an edge into a step. A starter's inline `{{ref}}` becomes plain words written by the LLM, and the heading block goes. A drafted step's outline task is rewritten by the LLM to name every input in plain words inside its sentences (*weave*, §7.2; the words naming the cut input marked in square brackets), and the outline is drafted again without the edge, the way the gold cuts are built | H2 positive; span = the words naming the cut input. Hard negatives: the same prompt with the edge kept (*kept*: same text A); the woven task drafted with every input and heading block (*drafted*: how a gold negative is built); the rewrite without that mention, the edge cut (*dropped*: same input list and graph facts), so neither side alone carries the label. A second positive per answer puts an unrelated step of the same outline in the cut input's place (*replaced*: as many inputs and facts as the drafted twin, and the task still names data no input carries), so the length of the list carries no label either. minilm-3 read the input list and facts alone; minilm-4, trained on a sentence appended for the purpose, missed every mention woven into a hand-written task; minilm-5 asked for the mention as a separate field and 9 in 10 answers were unusable; msmarco-1, with every full-list row a negative, read the length of the list. From msmarco-3 every input of every step is woven (no per-graph cap), and a second batch of outlines in shapes where steps read two or three inputs (over the round-1 topics and 30 more, none a gold topic) is asked only H2 jobs, so the other heads' data is unchanged. From msmarco-4 (input version 2) every version of a step is written as one pair per candidate step: the cut input's pair is the positive, the step's other candidates are negatives (*other*), the dropped twin is the cut's very pair with the mention gone, and kept / drafted versions, which still read the input, have only negative pairs; the same text-model answers, no new calls |
| `set_contract` with a description taken from another contract | H3 positive |
| change a JSON producer's keys while its readers keep theirs, `required` left empty | H3 positive |
| `set_step` gate ← a gate from the "not checkable" pool | H4 negative |
| none (the seed itself) | negatives for H2/H3, positives for H4 |

- **The checker as a filter.** Each mutant is run through `validateGraph`. A mutant the rules already flag (for example `ref-not-upstream`) is dropped from training: the model should learn what the rules miss, not repeat them.
- **Split by seed.** Every mutant of one seed goes to the same split (train / dev / test), so the model cannot pass the test by recognising a graph it trained on.

### 7.2 On Colab: `ml/sg-sem/generate.ipynb`

A local open-weights model (Qwen2.5-7B-Instruct or Llama-3.1-8B-Instruct, 4-bit with bitsandbytes, run in the notebook; not an API) writes the text the mutations need:

| For | It writes | Count (~) |
| --- | --- | --- |
| seeds | step outlines for 300 workflows across 30 topics | 300 |
| H1 | verifier answers to real seed steps, in 4 kinds: honest PASS, honest FAIL, PASS with a buried open problem, PASS with no evidence. Sentence labels come with each | 12k |
| H2 | plain-word rewrites of a removed `{{ref}}` ("the scores" for `{{score.output}}`) | 6k |
| H4 | gates on a scale from precise to empty, for real seed inputs | 5k |
| all | paraphrases of prompts and gates (terse, chatty, non-native English) | ×2 |

Each generated example carries the label it was asked for. Label noise from the generator is real; it is caught by a second pass where the same local model judges a sample, and by the gold set (§8).

### 7.3 Record format (JSONL, one line per example)

```json
{"head":"h1","seed":"research-and-fact-check","split":"train","text_a":"…","text_b":"…","features":[0.43,1,1,0.55,1,0,0,0.31,0.2,0,0,0.5,0,0,0.1,1],"label":1,"sentences":[0,1,0],"span":null,"source":"llm:qwen2.5-7b"}
```

Target sizes: H1 12k, H2 8k, H3 5k, H4 6k (train), plus 10% dev and 10% test, all split by seed.

## 8. Training and evaluation

### 8.1 Recipe (`ml/sg-sem/train.ipynb`, Colab T4 or L4)

| Setting | Value |
| --- | --- |
| Framework | PyTorch + Hugging Face `transformers`, mixed precision (fp16) |
| Optimiser | AdamW, lr 5e-5 encoder / 1e-3 heads, weight decay 0.01, 6% warm-up, linear decay |
| Batch | 32 (gradient accumulation if the GPU is short of memory) |
| Epochs | 10 (4 through minilm-5; the H2 loss was still falling), early stop on dev macro-F1 |
| Task sampling | each batch from one head, heads drawn with probability ∝ √(examples), so small heads are not drowned out |
| Feature dropout | H2 only: the 16 graph facts of 30% of training rows are zeroed, so the head cannot answer from the facts alone (msmarco-1: facts alone separated cut from drafted at 0.91) |
| Losses | H1 doc: cross-entropy; H1 sentences: binary cross-entropy (masked to `[SEN]` tokens); H2: cross-entropy + span start/end cross-entropy (×0.5); H3: cross-entropy; H4: 3-class cross-entropy with class weights |
| Seeds | 3 runs per configuration; report mean ± spread |
| Time | ~40–90 minutes per run on a T4 (estimate) |

### 8.2 The gold set (decides what ships)

- 300–500 examples per head, **written and labelled by people**, never by the generator: graphs drafted by hand for realistic tasks, verifier answers written by hand or taken from our own Claude test runs (with your consent, our own chats only).
- Labelled by you, or drafted by me and checked by you (plan §8 decision 2).

### 8.3 Metrics and the bar

| Head | Metric | Ship when, on the gold set |
| --- | --- | --- |
| H1 | precision / recall of "inconsistent PASS"; sentence-level F1 of the quoted sentences | precision ≥ 0.90, and recall above the rules' baseline (which is 0: no rule exists) |
| H2 | precision / recall per step (a step is flagged when any of its candidate pairs is); span overlap (token F1); share of caught steps whose top pair is the right step | precision ≥ 0.90; span F1 ≥ 0.6 so the quote makes sense |
| H3 | precision / recall | precision ≥ 0.90 |
| H4 | precision of "not checkable"; macro-F1 over 3 classes | beats `gate-vague` (word count) on macro-F1, precision ≥ 0.90 on "not checkable" |

Every binary bar is read at the run's own threshold and also needs recall ≥ 0.3: a head that is right on the one case it flags is not a pass (msmarco-2 caught 1 of 28 gold H2 cuts at precision 1.0). `sgsem.train.meets_bar` applies this table.

Ablations reported: MiniLM vs DeBERTa-v3-xsmall; text only vs text + features; 384 vs 512 tokens; with vs without the checker filter in §7.1. A head that misses its bar does not ship; the others still can.

## 9. Export and runtime on our site

**Export (`ml/sg-sem/export.ipynb`).** PyTorch → ONNX (opset 17) with Hugging Face `optimum`, all heads as outputs of one graph, dynamic sequence length; then dynamic int8 quantisation (`onnxruntime.quantization.quantize_dynamic`). The int8 model is checked against fp32 on the dev split: any head losing more than 1 point of F1 stays fp32 for that layer.

| Artifact | Size (~) |
| --- | --- |
| `sg-sem-1.int8.onnx` (MiniLM) | ~35 MB |
| `vocab.txt` + special tokens | ~0.25 MB |
| `sg-sem-1.json`: version, thresholds, temperatures, feature scaling, SHA-256 of the model | ~1 KB |

**Runtime: `onnxruntime-web` (WebAssembly) in the Node route, not `onnxruntime-node`.** Measured on npm today: `onnxruntime-node` 1.30.0 unpacks to **301 MB** (native builds for every platform), over Vercel's **250 MB** function limit before our code is counted. `onnxruntime-web` 1.30.0 unpacks to 145 MB, but a run needs one `.wasm` file from it. With `outputFileTracingIncludes` / `Excludes` in `next.config.ts` the function ships only that file. Phase 4 measures the real function size before anything is merged.

**Tokenizer: our own.** WordPiece (lower-case, basic split, greedy longest match over `vocab.txt`) in ~100 lines of TypeScript in `lib/semanticTokenizer.ts`, tested token-for-token against the Hugging Face tokenizer on 10k strings from the training data. No tokenizer package, so no new dependency there.

**Inference module: `lib/graphSemantic.ts`.**

```ts
export interface SemanticFinding { head: "h1" | "h2" | "h3" | "h4"; code: string; step?: string; score: number; quote?: string; message: string }
export async function semanticGraphChecks(graph: SkillGraph): Promise<SemanticFinding[]>          // H2, H3, H4
export async function semanticVerdictCheck(graph: SkillGraph, node: GraphNode, answer: string): Promise<SemanticFinding | null> // H1
```

- Loaded once per function instance (module-level promise), single-threaded (`numThreads = 1`), so the same input always gives the same scores, and the tools stay idempotent.
- A 1.5 s time budget per tool call; if the model is not loaded or runs over, the tool answers exactly as it does today and says nothing about it.
- Batching: all steps of a graph go through in one batch per head.
- `validateGraph` stays synchronous and model-free; the studio and its tests are untouched.

**Budgets to meet in phase 4** (measured on a Vercel preview deploy):

| Budget | Target |
| --- | --- |
| Function size added | ≤ 60 MB |
| Cold start added | ≤ 2 s |
| p95 per tool call, 20-step graph | ≤ 300 ms warm |
| Memory | ≤ 300 MB added |

## 10. Privacy, versioning, licences

- **Privacy.** Inference runs in memory inside the existing request, like every other check; nothing is stored or logged (the route logs tool names only). The model is never trained on user graphs or answers. The connector's privacy page gets one line saying a local model checks text and sends nothing anywhere.
- **Versioning.** The model is `sg-sem-<n>`. Its manifest carries the SHA-256 of the file, its thresholds and the date. `SERVER_INFO.version` bumps whenever the model changes, since warnings change.
- **Licences.** MiniLM-L12-H384: MIT; the ms-marco cross-encoder checkpoint of it: Apache-2.0. DeBERTa-v3-xsmall: MIT. Qwen2.5-7B-Instruct: Apache-2.0; Llama-3.1: Llama community licence, which permits this use but must be credited. Generated data and the trained weights are ours; the model card lists the sources.

## 10b. How training runs on your Colab

Claude Code cannot log in to Colab or run its cells, and should not be given remote access to a Colab machine (tunnels and remote proxies are restricted by Colab's terms). The loop that works uses Google's official **Colab extension for VS Code**: the notebooks live in this repo, VS Code runs them on a Colab GPU, and their outputs are saved back into the `.ipynb` files here, where Claude Code can read them.

1. **One-time setup (you).** Install the *Google Colab* extension in VS Code (it also needs the *Jupyter* extension), and sign in with the Google account that has your Colab compute.
2. **Claude Code writes** `ml/sg-sem/*.ipynb` and `scripts/semantic/export-examples.mjs` in the repo.
3. **You open a notebook** in VS Code, choose *Select Kernel → Colab → New Colab Server* with a GPU (T4 or L4), and press *Run All*.
4. **The notebook fetches what it needs itself:** it clones this repo at the commit under test, installs Node and runs `export-examples.mjs` there (so the training data comes from our exact library code), installs the Python packages and mounts your Google Drive for the generated data and the checkpoints.
5. **Outputs come back into the notebook file** (metrics tables, ablations, sample errors). Claude Code reads them and changes the notebooks for the next run.
6. **The finished model** (`sg-sem-1.int8.onnx`, `vocab.txt`, `sg-sem-1.json`) is saved to Drive; you download it, or the notebook attaches it to a GitHub release (needs a GitHub token in Colab Secrets). Where it is kept for the site is plan §8 decision 3.

Colab runtimes stop after idle time or a session limit, so every notebook checkpoints to Drive after each epoch and resumes from the last checkpoint.

## 11. Repository layout

```
ml/sg-sem/
  README.md              model card: what it does, data, metrics on the gold set, limits
  generate.ipynb         local LLM: seeds, verifier answers, rewrites, gates, paraphrases
  train.ipynb            fine-tuning, calibration, thresholds, ablations
  export.ipynb           ONNX, int8, parity check fp32 vs int8
  gold/                  hand-labelled JSONL (small, committed)
scripts/semantic/
  export-examples.mjs    seeds + mutations through our own library → JSONL
src/app/graph/lib/
  semanticInput.ts       the one serializer (training and inference)
  semanticTokenizer.ts   WordPiece
  graphSemantic.ts       loading, inference, findings
  __tests__/graphSemantic.test.ts
public or build-time download:
  sg-sem-1.int8.onnx, vocab.txt, sg-sem-1.json   (decision: plan §8 question 3)
```

Large data stays out of git: generated JSONL lives on Google Drive next to the notebooks; only the gold set and the manifest are committed.

## 12. Risks

| Risk | What we do |
| --- | --- |
| The model learns the generator's style, not the task | gold set written by people; paraphrase pass; split by seed; report gold vs test gap |
| False flags annoy users | precision bar 0.90; warnings only; H1 asks rather than fails; confidence shown |
| Bundle over the Vercel limit | WASM runtime with file tracing; measure in phase 4 before merging |
| Cold starts get slower | load lazily on the first semantic call, not at import; time budget with silent fallback |
| Verifier answers longer than 384 tokens hide the problem early in the text | keep the end (where reasons are); measure on gold how often the flagged sentence is cut; raise the cap if needed |
| The model drifts from the format as the format grows | the serializer is shared code with tests; a format change that alters serialized text fails a snapshot test until the model is retrained or the change is mapped |
