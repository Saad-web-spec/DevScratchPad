import json, sys

def md(text): return {"cell_type": "markdown", "metadata": {}, "source": text.strip("\n").splitlines(True)}
def code(text): return {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": text.strip("\n").splitlines(True)}

cells = [
md("""
# sg-sem: build the data and train the model

The Skill Graph semantic checker (see `SKILL_GRAPH_SEMANTIC_MODEL_SPEC.md` in the repo). This notebook runs on a **Colab GPU** through the VS Code Colab extension:

1. clones the repo and runs our own graph library (Node) to build seed graphs and text jobs,
2. runs an open model **on this GPU** (no API) to write outlines, checker answers, plain-word phrases and gates,
3. assembles the labelled examples, split by graph,
4. fine-tunes the model and reports dev and test metrics against the 0.9 precision bar.

**Run it with `QUICK_LOOK = True` first** (about 10 minutes): it writes a few answers per round so their quality can be checked. Then set it to `False` and run all again; finished answers are kept, so nothing is redone.

Save the notebook when it finishes: its outputs are what gets reviewed.
"""),
code("""
REPO = "https://github.com/Saad-web-spec/DevScratchPad.git"
BRANCH = "sg-sem"  # the branch with the sg-sem code
GENERATOR = "Qwen/Qwen2.5-7B-Instruct"   # writes the text; runs here on the GPU
BASE = "nreimers/MiniLM-L12-H384-uncased"  # the encoder sg-sem is fine-tuned from
QUICK_LOOK = True                          # True: a few answers per round, to check quality first
TRAIN = not QUICK_LOOK                     # training waits for the full data
RUN = "minilm-1"
"""),
md("## 1. Storage and setup"),
code("""
import os, shutil, subprocess
try:
    from google.colab import drive
    drive.mount("/content/drive")
    ROOT = "/content/drive/MyDrive/sg-sem"
except Exception as error:  # the VS Code extension may not support Drive mounting
    print("Google Drive not mounted:", error)
    print("Data stays on this runtime only: if it disconnects, the run starts again.")
    ROOT = "/content/sg-sem"
DATA = f"{ROOT}/data-quick" if QUICK_LOOK else f"{ROOT}/data"
RUNS = f"{ROOT}/runs"
os.makedirs(DATA, exist_ok=True); os.makedirs(RUNS, exist_ok=True)
print("data:", DATA)
"""),
code("""
!nvidia-smi --query-gpu=name,memory.total --format=csv
CODE = "/content/DevScratchPad"
if not os.path.exists(CODE):
    !git clone --depth 1 -b {BRANCH} {REPO} {CODE}
else:
    !git -C {CODE} pull --ff-only
!git -C {CODE} log --oneline -1
node = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip() if shutil.which("node") else ""
if not node.startswith(("v20", "v22", "v24")):
    !curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1 && apt-get install -y nodejs > /dev/null 2>&1
!node --version
%cd {CODE}
!npm ci --ignore-scripts --no-audit --no-fund --loglevel=error
!pip install -q -r ml/sg-sem/requirements.txt
PIPE = "npx vite-node scripts/semantic/pipeline.ts"
LIMIT = "--limit 24" if QUICK_LOOK else ""
"""),
md("## 2. Round 1: workflow outlines → seed graphs"),
code("""
!{PIPE} round1 --out {DATA}
!cd ml/sg-sem && python -m sgsem.generate --requests {DATA}/round1.requests.jsonl --outputs {DATA}/round1.outputs.jsonl --model {GENERATOR} {LIMIT}
"""),
md("## 3. Round 2: checker answers, plain-word inputs, gates"),
code("""
!{PIPE} round2 --out {DATA}
!cd ml/sg-sem && python -m sgsem.generate --requests {DATA}/round2.requests.jsonl --outputs {DATA}/round2.outputs.jsonl --model {GENERATOR} {LIMIT}
"""),
md("## 4. Assemble the labelled examples"),
code("""
!{PIPE} assemble --out {DATA}
print(open(f"{DATA}/stats.json").read())
"""),
code("""
# For review: raw answers of the text model, two per kind, and the assembled samples.
import json, collections
requests = {json.loads(l)["id"]: json.loads(l) for l in open(f"{DATA}/round2.requests.jsonl")}
shown = collections.Counter()
for line in open(f"{DATA}/round2.outputs.jsonl"):
    row = json.loads(line); kind = requests[row["id"]]["kind"]
    if shown[kind] < 2:
        shown[kind] += 1
        print(f"--- {kind} {requests[row['id']]['meta']}")
        print(row["text"][:1200])
        print()
print(open(f"{DATA}/samples.md").read()[:8000])
"""),
md("## 5. Train (runs when `QUICK_LOOK = False`)"),
code("""
if TRAIN:
    !cd ml/sg-sem && python -m sgsem.train --data {DATA}/examples.jsonl --out {RUNS}/{RUN} --base {BASE}
else:
    print("QUICK_LOOK is on: training waits for the full data.")
"""),
code("""
if TRAIN:
    report = json.load(open(f"{RUNS}/{RUN}/metrics.json"))
    print(json.dumps({k: report[k] for k in ["test", "rules_baseline_test", "meets_bar_on_test", "minutes"]}, indent=1))
    print(open(f"{RUNS}/{RUN}/errors.md").read()[:6000])
"""),
]

nb = {"cells": cells, "metadata": {"kernelspec": {"display_name": "Python 3", "name": "python3"}, "language_info": {"name": "python"}, "accelerator": "GPU", "colab": {"provenance": []}}, "nbformat": 4, "nbformat_minor": 5}
for i, c in enumerate(nb["cells"]): c["id"] = f"cell-{i}"
json.dump(nb, open(sys.argv[1], "w", encoding="utf-8"), indent=1)
print("ok", len(cells), "cells")
