"""Tries a trained sg-sem run on real graphs and prints the H2 and H4 warnings the connector would add, at the run's
own temperatures and thresholds (spec §6). Rows come from scripts/semantic/tryout.ts (starters and your own graph
files, unlabelled) or from gold/examples.jsonl (labelled: each step is marked caught, missed or a false alarm).

    npx vite-node scripts/semantic/tryout.ts [my-graph.md ...]
    python -X utf8 -m sgsem.tryout --run runs/msmarco-6 --data tryout/examples.jsonl gold/examples.jsonl
"""
from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict

import torch

from . import FEATURE_COUNT, H4_LABELS
from .data import load_examples
from .model import SgSem


@torch.no_grad()
def score(model: SgSem, tokenizer, rows: list[dict], max_len: int, batch: int) -> list[dict]:
    """Per row: the head's logits and, for H2, the words of the task the span head points at."""
    out = []
    for start in range(0, len(rows), batch):
        chunk = rows[start : start + batch]
        enc = tokenizer([r["text_a"] for r in chunk], [r["text_b"] for r in chunk], truncation="longest_first", max_length=max_len, padding=True, return_offsets_mapping=True, return_tensors="pt")
        features = torch.tensor([[float(v) for v in r["features"]][:FEATURE_COUNT] for r in chunk])
        token_types = enc.get("token_type_ids", torch.zeros_like(enc["input_ids"]))
        h1, h2, h3, h4, _, span = model(enc["input_ids"], enc["attention_mask"], token_types, features)
        for i, row in enumerate(chunk):
            item = {"logits": (h2 if row["head"] == "h2" else h4)[i]}
            if row["head"] == "h2":
                # The span is read inside text A only, as in training.
                in_a = torch.tensor([s == 0 for s in enc.sequence_ids(i)])
                first = int(span[i, :, 0].masked_fill(~in_a, -1e4).argmax())
                last = int(span[i, :, 1].masked_fill(~in_a, -1e4).argmax())
                offsets = enc["offset_mapping"][i]
                item["quote"] = row["text_a"][int(offsets[first][0]) : int(offsets[last][1])] if last >= first else ""
            out.append(item)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, help="a training run directory (best.pt, tokenizer/, sgsem.json)")
    parser.add_argument("--data", required=True, nargs="+", help="examples.jsonl files with h2 / h4 rows")
    parser.add_argument("--batch", type=int, default=32)
    args = parser.parse_args()

    with open(os.path.join(args.run, "sgsem.json"), encoding="utf-8") as handle:
        settings = json.load(handle)
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(os.path.join(args.run, "tokenizer"))
    model = SgSem(settings["base"], settings["vocab_size"])
    model.load_state_dict(torch.load(os.path.join(args.run, "best.pt"), map_location="cpu", weights_only=True))
    model.eval()
    temperature, threshold = settings["temperatures"], settings["thresholds"]
    print(f"run {args.run}: H2 warns at >= {threshold['h2']:.3f}, H4 at p(not) >= {threshold['h4']:.3f}")

    for path in args.data:
        rows = [r for r in load_examples(path) if r["head"] in ("h2", "h4")]
        results = score(model, tokenizer, rows, settings["max_len"], args.batch)
        tally = defaultdict(int)
        by_graph: dict[str, list[tuple[dict, dict]]] = defaultdict(list)
        for row, result in zip(rows, results):
            by_graph[row["seed"]].append((row, result))
        print(f"\n######## {path}")
        for seed, items in by_graph.items():
            print(f"\n== {seed}")
            # H2: one warning per step version, from its highest-scoring candidate.
            steps: dict[str, list[tuple[dict, dict, float]]] = defaultdict(list)
            for row, result in items:
                if row["head"] == "h2":
                    p = float(torch.softmax(result["logits"] / temperature["h2"], -1)[1])
                    steps[row.get("group") or row["node"]].append((row, result, p))
            for group, pairs in steps.items():
                row, result, p = max(pairs, key=lambda t: t[2])
                labelled = "label" in row and row.get("split") == "gold"
                positive = labelled and any(r["label"] == 1 for r, _, _ in pairs)
                flagged = p >= threshold["h2"]
                if labelled:
                    outcome = ("caught" if flagged else "MISSED") if positive else ("FALSE ALARM" if flagged else "quiet, right")
                    tally[f"h2 {outcome}"] += 1
                    if not positive and not flagged:
                        continue
                    print(f"  H2 [{outcome}] {group}: top candidate {row['candidate']} ({p:.2f})")
                elif flagged:
                    tally["h2 warning"] += 1
                    print(f"  H2 warning: step `{row['node']}`: its task needs \"{result['quote']}\", which `{row['candidate']}` returns and none of its inputs carries ({p:.2f}). Add an edge from `{row['candidate']}`.")
                else:
                    tally["h2 quiet"] += 1
                if flagged:
                    continue
                if not labelled and p >= 0.5:
                    print(f"  H2 (below the warning line) {row['node']} ← {row['candidate']} {p:.2f}: \"{result['quote']}\"")
            # H4: one verdict per gate.
            for row, result in items:
                if row["head"] != "h4":
                    continue
                probs = torch.softmax(result["logits"] / temperature["h4"], -1)
                label = H4_LABELS[int(probs.argmax())]
                warn = float(probs[H4_LABELS.index("not")]) >= threshold["h4"]
                gate = row["text_a"].replace("[H4] [GATE] ", "")
                if "label" in row and row.get("split") == "gold":
                    truth = H4_LABELS[row["label"]]
                    outcome = ("caught" if warn else "MISSED") if truth == "not" else ("FALSE ALARM" if warn else "quiet, right")
                    tally[f"h4 {outcome}"] += 1
                    if outcome != "quiet, right" or label != truth:
                        print(f"  H4 [{outcome}] reads \"{label}\", is \"{truth}\": {gate}")
                else:
                    tally["h4 warning" if warn else f"h4 {label}"] += 1
                    print(f"  H4 {'warning: cannot be decided from its inputs' if warn else label} ({float(probs.max()):.2f}): {gate}")
        print(f"\ntotals for {path}: {dict(sorted(tally.items()))}")


if __name__ == "__main__":
    main()
