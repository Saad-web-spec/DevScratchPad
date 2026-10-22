"""Finds which text cue the H2 head reads, on the gold cut positives (the ones minilm-3 called "kept" at 1.0).

Every gold positive is scored as written and with one thing changed at a time:

  no heading blocks   the other inputs' `NAME: {{ref}}` blocks are removed from the task text
  B = request only    the input list is replaced by the step's request line, as a first step reads
  mention removed     the plain-word phrase naming the cut data (the gold span) becomes "the data"
  as-written control  the same step with the edge still in place (the gold negative), for reference

The column whose mean p(cut) moves is the cue. The run's temperature is applied; the 16 graph facts stay
those of the step, so the text is the only thing that changes between columns.

    python -m sgsem.probe --run runs/minilm-3 --data gold/examples.jsonl
    python -m sgsem.probe --data gold/examples.jsonl --dry-run      # prints the variants, loads no model
"""
from __future__ import annotations

import argparse
import json
import os
import re

from .data import load_examples

HEADING_BLOCK = re.compile(r" [A-Z][A-Z0-9 _'/-]*: \{\{[^}]+\}\}")  # an all-caps heading naming an input
INPUT_LINE = re.compile(r"\[INPUT\] [^\[]*")
COLUMNS = ["as is", "no heading blocks", "B = request only", "mention removed", "as-written control"]


def input_lines(text_b: str) -> list[str]:
    return [line.strip() for line in INPUT_LINE.findall(text_b)]


def request_line_of(rows: list[dict], seed: str) -> str:
    """The step's request input line, taken from any step of the same graph that reads only the request."""
    for row in rows:
        if row["seed"] != seed:
            continue
        lines = input_lines(row["text_b"])
        if len(lines) == 1 and " · Your request · " in lines[0]:
            return lines[0]
    return "[INPUT] none"


def as_written_of(rows: list[dict], positive: dict) -> dict | None:
    """The gold negative of the same step: the same inputs plus the one that was cut."""
    mine = set(input_lines(positive["text_b"]))
    for row in rows:
        if row["seed"] != positive["seed"] or row["label"] != 0:
            continue
        theirs = set(input_lines(row["text_b"]))
        if mine < theirs and len(theirs) == len(mine) + 1 and HEADING_BLOCK.sub("", row["text_a"]) == HEADING_BLOCK.sub("", positive["text_a"]):
            return row
    return None


def variants(rows: list[dict], positive: dict) -> dict[str, tuple[str, str]]:
    a, b = positive["text_a"], positive["text_b"]
    out = {"as is": (a, b), "no heading blocks": (HEADING_BLOCK.sub("", a), b), "B = request only": (a, request_line_of(rows, positive["seed"]))}
    if positive.get("span"):
        start, end = positive["span"]
        out["mention removed"] = (re.sub(r" {2,}", " ", a[:start] + "the data" + a[end:]), b)
    control = as_written_of(rows, positive)
    if control:
        out["as-written control"] = (control["text_a"], control["text_b"])
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run", help="a training run directory (best.pt, tokenizer/, sgsem.json)")
    parser.add_argument("--data", required=True, help="examples.jsonl with the gold H2 rows")
    parser.add_argument("--head", default="h2")
    parser.add_argument("--dry-run", action="store_true", help="print the variants and load no model")
    args = parser.parse_args()
    if not args.run and not args.dry_run:
        parser.error("--run is required unless --dry-run")

    rows = [row for row in load_examples(args.data) if row["head"] == args.head]
    positives = [row for row in rows if row["label"] == 1]
    print(f"{args.head}: {len(rows)} gold rows, {len(positives)} positives", flush=True)

    probes: list[dict] = []  # one scored example per (positive, column)
    for index, positive in enumerate(positives):
        for column, (text_a, text_b) in variants(rows, positive).items():
            probes.append({**{k: positive[k] for k in ("head", "seed", "features")}, "label": 1, "text_a": text_a, "text_b": text_b, "positive": index, "column": column, "note": positive.get("note", "")})

    if args.dry_run:
        for probe in probes[: len(COLUMNS) * 2]:
            print(f"--- #{probe['positive']} {probe['note']} · {probe['column']}\n  A: {probe['text_a']}\n  B: {probe['text_b']}")
        missing = {column: sum(1 for p in positives if column not in variants(rows, p)) for column in COLUMNS}
        print("positives without a variant:", {k: v for k, v in missing.items() if v})
        return

    import numpy as np
    import torch
    from torch.utils.data import DataLoader
    from transformers import AutoTokenizer

    from .data import HeadDataset, collate
    from .model import SgSem
    from .train import predict

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    with open(os.path.join(args.run, "sgsem.json"), encoding="utf-8") as handle:
        settings = json.load(handle)
    tokenizer = AutoTokenizer.from_pretrained(os.path.join(args.run, "tokenizer"))
    model = SgSem(settings["base"], settings["vocab_size"]).to(device)
    model.load_state_dict(torch.load(os.path.join(args.run, "best.pt"), map_location=device, weights_only=True))
    loader = DataLoader(HeadDataset(probes, tokenizer, settings["max_len"]), batch_size=32, shuffle=False, collate_fn=lambda items: collate(items, tokenizer.pad_token_id))
    logits = predict(model, loader, device)["logits"] / settings["temperatures"].get(args.head, 1.0)
    p_cut = (np.exp(logits) / np.exp(logits).sum(-1, keepdims=True))[:, 1]
    assert len(p_cut) == len(probes)

    table: dict[int, dict[str, float]] = {}
    for probe, p in zip(probes, p_cut):
        table.setdefault(probe["positive"], {})[probe["column"]] = float(p)
    width = max(len(c) for c in COLUMNS)
    print("\np(cut) per gold positive; the threshold the run fitted is", settings["thresholds"].get(args.head))
    print(" " * 34 + " ".join(c.rjust(width) for c in COLUMNS))
    for index, positive in enumerate(positives):
        cells = [f"{table[index][c]:.2f}".rjust(width) if c in table[index] else "-".rjust(width) for c in COLUMNS]
        print(f"{positive['seed'][:18]:<18} {positive.get('note', '')[:15]:<15} " + " ".join(cells))
    print("\nmean p(cut) per column (as is should be high for a working head; the column that drops or jumps is the cue):")
    for column in COLUMNS:
        values = [table[i][column] for i in table if column in table[i]]
        if values:
            print(f"  {column:<{width}}  mean {np.mean(values):.2f}  at or above 0.5: {sum(v >= 0.5 for v in values)}/{len(values)}")


if __name__ == "__main__":
    main()
