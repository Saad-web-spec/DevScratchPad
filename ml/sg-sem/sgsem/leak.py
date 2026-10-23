"""Checks whether one side of an H2 pair gives the label away on the generated rows.

A sound H2 head has to compare the task text (A) with the input list (B). If A alone, B alone or the 16
graph facts alone predict the label, the model can pass the generated test without ever comparing them,
and fails on hand-written graphs where that cue is absent (what the gold set showed for minilm-3).

Prints, per label and row kind (cut = positive; replaced = positive with the cut input's place taken by an unrelated
step, so the list is as long as the drafted twin's; kept = the same A with the input still there; dropped = the same
input list with the mention gone; drafted = the same task words with every input and heading block, as the gold
negatives are built; as written = every step unchanged): the count, the share of task texts with no {{reference}} at all, the mean number of heading
blocks in A and of input lines in B. Then, when scikit-learn is installed, fits a bag-of-words classifier
on the train split from each side alone and reports the test AUROC of positives against each negative kind
(a built kind against the positives that have a twin of that kind), for all positives and then per positive kind:
replaced vs drafted is the pair that differs only in the words (msmarco-1, with cut rows only, read the list's length).

    python -m sgsem.leak --data /content/drive/MyDrive/sg-sem/data/examples.jsonl
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict

import numpy as np

from .data import load_examples

REFERENCE = re.compile(r"\{\{[^}]+\}\}")
HEADING_BLOCK = re.compile(r"[A-Z][A-Z0-9 _'/-]*: \{\{[^}]+\}\}")
INPUT_LINE = re.compile(r"\[INPUT\] ")


def kind_of(row: dict) -> str:
    note = row.get("note", "")
    for kind in ("cut", "replaced", "kept", "drafted", "dropped"):
        if note.startswith(kind + " "):
            return kind
    return "as written" if note.startswith("as written") else note or "other"


def auroc(scores: np.ndarray, labels: np.ndarray) -> float:
    """Rank AUROC without a dependency: the share of (positive, negative) pairs the positive outscores."""
    positives, negatives = scores[labels == 1], scores[labels == 0]
    if len(positives) == 0 or len(negatives) == 0:
        return float("nan")
    order = np.argsort(np.concatenate([positives, negatives]), kind="mergesort")
    ranks = np.empty(len(order))
    ranks[order] = np.arange(1, len(order) + 1)
    return float((ranks[: len(positives)].sum() - len(positives) * (len(positives) + 1) / 2) / (len(positives) * len(negatives)))


def describe(rows: list[dict]) -> None:
    groups: dict[tuple[int, str], list[dict]] = defaultdict(list)
    for row in rows:
        groups[(row["label"], kind_of(row))].append(row)
    print(f"{'label':<6}{'kind':<12}{'rows':>6}{'no {{ref}} in A':>17}{'blocks in A':>13}{'lines in B':>12}{'A words':>9}")
    for (label, kind), group in sorted(groups.items()):
        no_ref = np.mean([not REFERENCE.search(r["text_a"]) for r in group])
        blocks = np.mean([len(HEADING_BLOCK.findall(r["text_a"])) for r in group])
        lines = np.mean([len(INPUT_LINE.findall(r["text_b"])) for r in group])
        words = np.mean([len(r["text_a"].split()) for r in group])
        print(f"{label:<6}{kind:<12}{len(group):>6}{no_ref:>17.2f}{blocks:>13.2f}{lines:>12.2f}{words:>9.0f}")
    without = [r for r in rows if not REFERENCE.search(r["text_a"])]
    if without:
        print(f"rows whose A has no reference at all: {len(without)}, of them positive: {np.mean([r['label'] for r in without]):.2f}")


def classify(train: list[dict], test: list[dict]) -> None:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
    except ImportError:
        print("scikit-learn is not installed: skipping the one-side classifiers (pip install scikit-learn)")
        return
    labels = np.array([r["label"] for r in train])
    sides = {
        "text A only": lambda rows: [r["text_a"] for r in rows],
        "text B only": lambda rows: [r["text_b"] for r in rows],
        "facts only": None,
    }
    test_labels = np.array([r["label"] for r in test])
    kinds = np.array([kind_of(r) for r in test])
    negatives = [k for k in ("kept", "drafted", "dropped", "as written") if ((kinds == k) & (test_labels == 0)).any()]
    cut_of = lambda row: (row["seed"], row.get("node", ""), row.get("note", "").split(" ")[1] if " " in row.get("note", "") else "")
    built = {k: {cut_of(r) for r in test if kind_of(r) == k} for k in ("kept", "drafted", "dropped")}
    twins = {k: np.array([cut_of(r) in keys for r in test]) for k, keys in built.items() if keys}
    scored: dict[str, np.ndarray] = {}
    for name, pick in sides.items():
        if pick is None:
            model = LogisticRegression(max_iter=2000, class_weight="balanced").fit(np.array([r["features"] for r in train]), labels)
            scored[name] = model.predict_proba(np.array([r["features"] for r in test]))[:, 1]
        else:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
            model = LogisticRegression(max_iter=2000, class_weight="balanced").fit(vectorizer.fit_transform(pick(train)), labels)
            scored[name] = model.predict_proba(vectorizer.transform(pick(test)))[:, 1]
    print(f"\ntest AUROC of a train-split classifier that sees one side only (0.5 = the side carries nothing, near 1 = the label is in that side alone):")
    positive_kinds = [k for k in ("cut", "replaced") if ((kinds == k) & (test_labels == 1)).any()]
    for positive in [None, *(positive_kinds if len(positive_kinds) > 1 else [])]:
        print(f"{('positives: ' + positive) if positive else 'all positives':<18}" + "".join(f"{'vs ' + k:>15}" for k in negatives) + f"{'vs all':>15}")
        for name, scores in scored.items():
            cells = []
            chosen = (test_labels == 1) & ((kinds == positive) if positive else True)
            for negative in negatives:
                # Built negatives are compared with the positives that have a twin of that kind (same seed, step and cut input), so
                # positives of another origin (phrase-mode starters, single-input cuts) do not read as a leak; as written: all.
                keep = chosen & (twins[negative] if negative in twins else True) | (kinds == negative)
                cells.append(auroc(scores[keep], test_labels[keep]))
            keep = chosen | (test_labels == 0)
            cells.append(auroc(scores[keep], test_labels[keep]))
            print(f"{name:<18}" + "".join(f"{c:>15.2f}" for c in cells))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", required=True, help="examples.jsonl (the generated set, with its train/dev/test splits)")
    parser.add_argument("--head", default="h2")
    args = parser.parse_args()
    rows = [r for r in load_examples(args.data) if r["head"] == args.head]
    print(f"{args.head}: {len(rows)} rows")
    describe(rows)
    train = [r for r in rows if r.get("split") == "train"]
    test = [r for r in rows if r.get("split") == "test"]
    if train and test and any(r["label"] == 1 for r in test):
        classify(train, test)
    else:
        print("no train/test splits with positives in this file: the one-side classifiers need the generated set")


if __name__ == "__main__":
    main()
