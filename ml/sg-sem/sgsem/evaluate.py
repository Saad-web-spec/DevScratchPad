"""Scores a trained sg-sem run on a labelled file it never trained on: the gold set (spec §8.2). Writes to --out:

  metrics.json     per head: precision and recall at the run's thresholds (what the connector would do),
                   at 0.5, AUROC, sentence / span F1, the rules baseline, and whether the 0.9 bar holds
  errors.md        the examples the model gets most wrong, per head

    python -m sgsem.evaluate --run runs/minilm-1 --data gold/examples.jsonl --out runs/minilm-1/gold

The thresholds and temperatures come from the run's sgsem.json and are not refitted here: the gold set
measures the model as it would ship, it does not tune it.
"""
from __future__ import annotations

import argparse
import json
import os

import numpy as np
import torch
from torch.utils.data import DataLoader

from . import HEADS
from .data import HeadDataset, by_head_and_split, collate, load_examples
from .model import SgSem
from .train import PRECISION_BAR, head_metrics, predict, rules_baseline, write_errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, help="a training run directory (best.pt, tokenizer/, sgsem.json)")
    parser.add_argument("--data", required=True, help="examples.jsonl to score; every example is used whatever its split")
    parser.add_argument("--out", required=True)
    parser.add_argument("--batch", type=int, default=32)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    with open(os.path.join(args.run, "sgsem.json"), encoding="utf-8") as handle:
        settings = json.load(handle)
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(os.path.join(args.run, "tokenizer"))
    model = SgSem(settings["base"], settings["vocab_size"]).to(device)
    model.load_state_dict(torch.load(os.path.join(args.run, "best.pt"), map_location=device, weights_only=True))

    examples = load_examples(args.data)
    rows = {head: [e for split in splits.values() for e in split] for head, splits in by_head_and_split(examples).items()}
    rows = {head: rows[head] for head in HEADS if rows.get(head)}
    print("examples:", {head: len(r) for head, r in rows.items()}, flush=True)

    results, metrics = {}, {}
    for head, head_rows in rows.items():
        loader = DataLoader(HeadDataset(head_rows, tokenizer, settings["max_len"]), batch_size=args.batch, shuffle=False, collate_fn=lambda items: collate(items, tokenizer.pad_token_id))
        results[head] = predict(model, loader, device)
        temperature = settings["temperatures"].get(head, 1.0)
        threshold = settings["thresholds"].get(head)
        metrics[head] = head_metrics(head, results[head], temperature, threshold)
        if threshold is None:
            metrics[head]["note"] = "the run set no threshold for this head (it did not reach the bar on dev)"
    shipping = {head: (m.get("threshold") is not None and m.get("precision_at_threshold", 0) >= PRECISION_BAR) for head, m in metrics.items()}
    report = {"run": args.run, "data": args.data, "metrics": metrics, "rules_baseline": rules_baseline(examples), "meets_bar": shipping}
    with open(os.path.join(args.out, "metrics.json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    write_errors(os.path.join(args.out, "errors.md"), rows, results, {head: settings["temperatures"].get(head, 1.0) for head in rows})
    for head, m in metrics.items():
        print(head, json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()}))
    print("meets the 0.9 precision bar on this data:", shipping)
    print("rules baseline:", json.dumps(report["rules_baseline"]))


if __name__ == "__main__":
    main()
