"""Turns examples.jsonl (written by scripts/semantic/pipeline.ts) into tensors for the four heads.

Truncation follows the spec: H1 keeps the END of the verifier answer (its reasons and verdict sit
there), so text_b is cut from the left; the other heads cut the longer side from the right. The
connector's TypeScript tokenizer must truncate the same way.
"""
from __future__ import annotations

import json
import random

import torch
from torch.utils.data import Dataset

from . import FEATURE_COUNT, SPECIAL_TOKENS

IGNORE = -100


def load_examples(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def make_tokenizer(base: str):
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(base, use_fast=True)
    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    return tokenizer


def encode(example: dict, tokenizer, max_len: int) -> dict:
    head = example["head"]
    if head == "h1":
        tokenizer.truncation_side = "left"
        enc = tokenizer(example["text_a"], example["text_b"], truncation="only_second", max_length=max_len, return_offsets_mapping=True)
        tokenizer.truncation_side = "right"
    else:
        enc = tokenizer(example["text_a"], example["text_b"], truncation="longest_first", max_length=max_len, return_offsets_mapping=True)
    ids = enc["input_ids"]
    item = {
        "head": head,
        "input_ids": ids,
        "attention_mask": enc["attention_mask"],
        "token_type_ids": enc.get("token_type_ids", [0] * len(ids)),
        "features": [float(v) for v in example["features"]][:FEATURE_COUNT],
        "label": int(example["label"]),
        "sentence_labels": [IGNORE] * len(ids),
        "span": (IGNORE, IGNORE),
    }
    if head == "h1":
        sen = tokenizer.convert_tokens_to_ids("[SEN]")
        positions = [i for i, token in enumerate(ids) if token == sen]
        labels = example.get("sentences") or []
        # Left truncation drops the first sentences: the markers found are the last ones.
        kept = labels[len(labels) - len(positions) :] if positions else []
        for position, label in zip(positions, kept):
            item["sentence_labels"][position] = int(label)
    if head == "h2" and example.get("span"):
        start_char, end_char = example["span"]
        sequence = enc.sequence_ids()
        start = end = IGNORE
        for i, (offset, seq) in enumerate(zip(enc["offset_mapping"], sequence)):
            if seq != 0:
                continue
            if start == IGNORE and offset[0] <= start_char < offset[1]:
                start = i
            if offset[0] < end_char <= offset[1]:
                end = i
        if start != IGNORE and end != IGNORE and end >= start:
            item["span"] = (start, end)
    return item


class HeadDataset(Dataset):
    def __init__(self, examples: list[dict], tokenizer, max_len: int):
        self.items = [encode(example, tokenizer, max_len) for example in examples]

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int) -> dict:
        return self.items[index]


def collate(items: list[dict], pad_id: int) -> dict:
    width = max(len(item["input_ids"]) for item in items)

    def pad(values, fill):
        return values + [fill] * (width - len(values))

    return {
        "head": items[0]["head"],
        "input_ids": torch.tensor([pad(i["input_ids"], pad_id) for i in items]),
        "attention_mask": torch.tensor([pad(i["attention_mask"], 0) for i in items]),
        "token_type_ids": torch.tensor([pad(i["token_type_ids"], 0) for i in items]),
        "features": torch.tensor([i["features"] for i in items], dtype=torch.float32),
        "label": torch.tensor([i["label"] for i in items]),
        "sentence_labels": torch.tensor([pad(i["sentence_labels"], IGNORE) for i in items]),
        "span": torch.tensor([i["span"] for i in items]),
    }


def by_head_and_split(examples: list[dict]) -> dict[str, dict[str, list[dict]]]:
    out: dict[str, dict[str, list[dict]]] = {}
    for example in examples:
        out.setdefault(example["head"], {}).setdefault(example["split"], []).append(example)
    return out


def balance(examples: list[dict], seed: int, max_ratio: float = 3.0) -> list[dict]:
    """Caps the largest class at max_ratio times the smallest, so a head is not trained mostly on one answer."""
    by_label: dict[int, list[dict]] = {}
    for example in examples:
        by_label.setdefault(int(example["label"]), []).append(example)
    if len(by_label) < 2:
        return examples
    smallest = min(len(rows) for rows in by_label.values())
    rng = random.Random(seed)
    out: list[dict] = []
    for rows in by_label.values():
        rows = rows[:]
        rng.shuffle(rows)
        # Steps as written are the easy negatives: they go first, so the built hard negatives (kept, drafted, dropped) stay.
        rows.sort(key=lambda example: str(example.get("note", "")).startswith("as written"))
        out.extend(rows[: int(smallest * max_ratio)])
    rng.shuffle(out)
    return out
