"""Fine-tunes sg-sem on examples.jsonl (spec §8). Writes to --out:

  best.pt          weights of the best epoch on the dev split
  last.pt          everything needed to resume after a Colab disconnect
  tokenizer/       the base tokenizer with our special tokens
  sgsem.json       base model, vocabulary size, temperatures and thresholds per head
  metrics.json     dev and test metrics, and the rules baseline
  errors.md        the dev examples the model gets most wrong, per head, for error analysis

    python -m sgsem.train --data data/examples.jsonl --out runs/minilm-1
"""
from __future__ import annotations

import argparse
import json
import math
import os
import random
import time

import numpy as np
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader

from . import H4_LABELS, HEAD_CLASSES, HEADS
from .data import IGNORE, HeadDataset, balance, by_head_and_split, collate, load_examples, make_tokenizer
from .model import SgSem

PRECISION_BAR = 0.9
DEFAULT_BASE = "microsoft/MiniLM-L12-H384-uncased"


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def to_device(batch: dict, device: torch.device) -> dict:
    return {key: (value.to(device) if isinstance(value, torch.Tensor) else value) for key, value in batch.items()}


def run_model(model: SgSem, batch: dict):
    return model(batch["input_ids"], batch["attention_mask"], batch["token_type_ids"], batch["features"])


def batch_loss(outputs, batch: dict, class_weights: dict[str, torch.Tensor]) -> torch.Tensor:
    head = batch["head"]
    logits = outputs[HEADS.index(head)].float()
    loss = F.cross_entropy(logits, batch["label"], weight=class_weights.get(head))
    if head == "h1":
        mask = batch["sentence_labels"] != IGNORE
        if mask.any():
            loss = loss + F.binary_cross_entropy_with_logits(outputs[4].float()[mask], batch["sentence_labels"][mask].float())
    if head == "h2":
        has_span = batch["span"][:, 0] != IGNORE
        if has_span.any():
            span_logits = outputs[5].float()[has_span]
            pad = batch["attention_mask"][has_span] == 0
            start = span_logits[..., 0].masked_fill(pad, -1e4)
            end = span_logits[..., 1].masked_fill(pad, -1e4)
            spans = batch["span"][has_span]
            loss = loss + 0.5 * (F.cross_entropy(start, spans[:, 0]) + F.cross_entropy(end, spans[:, 1]))
    return loss


# ------------------------------------------------------------------ metrics


def auroc(scores: np.ndarray, labels: np.ndarray) -> float:
    positives, negatives = scores[labels == 1], scores[labels == 0]
    if len(positives) == 0 or len(negatives) == 0:
        return float("nan")
    order = np.argsort(np.concatenate([positives, negatives]))
    ranks = np.empty(len(order))
    ranks[order] = np.arange(1, len(order) + 1)
    return float((ranks[: len(positives)].sum() - len(positives) * (len(positives) + 1) / 2) / (len(positives) * len(negatives)))


def prf(predicted: np.ndarray, labels: np.ndarray, positive: int = 1) -> tuple[float, float, float]:
    tp = int(((predicted == positive) & (labels == positive)).sum())
    fp = int(((predicted == positive) & (labels != positive)).sum())
    fn = int(((predicted != positive) & (labels == positive)).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def fit_temperature(logits: np.ndarray, labels: np.ndarray) -> float:
    """The temperature that makes the probabilities honest on dev (lowest log loss), by grid search."""
    best, best_loss = 1.0, float("inf")
    for temperature in np.linspace(0.5, 5.0, 46):
        loss = float(F.cross_entropy(torch.tensor(logits / temperature), torch.tensor(labels)).item())
        if loss < best_loss:
            best, best_loss = float(temperature), loss
    return best


def threshold_for_precision(scores: np.ndarray, labels: np.ndarray, bar: float = PRECISION_BAR) -> tuple[float | None, float]:
    """The lowest threshold whose flags are right at least `bar` of the time; None when no threshold is."""
    best: tuple[float | None, float] = (None, 0.0)
    for threshold in sorted(set(np.round(scores, 4).tolist())):
        predicted = (scores >= threshold).astype(int)
        precision, recall, _ = prf(predicted, labels)
        if predicted.sum() >= 5 and precision >= bar and recall > best[1]:
            best = (float(threshold), recall)
    return best


@torch.no_grad()
def predict(model: SgSem, loader: DataLoader, device: torch.device) -> dict:
    model.eval()
    logits, labels, sentence_scores, sentence_labels, span_hits = [], [], [], [], []
    for batch in loader:
        batch = to_device(batch, device)
        outputs = run_model(model, batch)
        head = batch["head"]
        logits.append(outputs[HEADS.index(head)].float().cpu().numpy())
        labels.append(batch["label"].cpu().numpy())
        if head == "h1":
            mask = batch["sentence_labels"] != IGNORE
            sentence_scores.append(torch.sigmoid(outputs[4].float()[mask]).cpu().numpy())
            sentence_labels.append(batch["sentence_labels"][mask].cpu().numpy())
        if head == "h2":
            has_span = batch["span"][:, 0] != IGNORE
            if has_span.any():
                pad = batch["attention_mask"][has_span] == 0
                span_logits = outputs[5].float()[has_span]
                start = span_logits[..., 0].masked_fill(pad, -1e4).argmax(-1)
                end = span_logits[..., 1].masked_fill(pad, -1e4).argmax(-1)
                for (s, e), (gs, ge) in zip(torch.stack([start, end], -1).tolist(), batch["span"][has_span].tolist()):
                    overlap = max(0, min(e, ge) - max(s, gs) + 1)
                    predicted_len, gold_len = max(1, e - s + 1), ge - gs + 1
                    span_hits.append(0.0 if overlap == 0 else 2 * overlap / (predicted_len + gold_len))
    out = {"logits": np.concatenate(logits), "labels": np.concatenate(labels)}
    if sentence_scores:
        out["sentence_scores"], out["sentence_labels"] = np.concatenate(sentence_scores), np.concatenate(sentence_labels)
    if span_hits:
        out["span_f1"] = float(np.mean(span_hits))
    return out


def head_metrics(head: str, result: dict, temperature: float | None = None, threshold: float | None = None) -> dict:
    logits, labels = result["logits"], result["labels"]
    temperature = temperature if temperature is not None else fit_temperature(logits, labels)
    probs = torch.softmax(torch.tensor(logits / temperature), -1).numpy()
    metrics: dict = {"n": int(len(labels)), "temperature": temperature}
    if HEAD_CLASSES[head] == 2:
        scores = probs[:, 1]
        precision, recall, f1 = prf((scores >= 0.5).astype(int), labels)
        metrics.update(precision_at_05=precision, recall_at_05=recall, f1_at_05=f1, auroc=auroc(scores, labels))
        if threshold is None:
            threshold, _ = threshold_for_precision(scores, labels)
        metrics["threshold"] = threshold
        if threshold is not None:
            precision, recall, _ = prf((scores >= threshold).astype(int), labels)
            metrics.update(precision_at_threshold=precision, recall_at_threshold=recall)
        metrics["score"] = f1
    else:
        predicted = probs.argmax(-1)
        f1s = [prf(predicted, labels, positive=c)[2] for c in range(3)]
        not_class = H4_LABELS.index("not")
        precision, recall, _ = prf(predicted, labels, positive=not_class)
        metrics.update(macro_f1=float(np.mean(f1s)), not_precision=precision, not_recall=recall)
        if threshold is None:
            threshold, _ = threshold_for_precision(probs[:, not_class], (labels == not_class).astype(int))
        metrics["threshold"] = threshold
        metrics["score"] = float(np.mean(f1s))
    if "sentence_scores" in result:
        metrics["sentence_f1"] = prf((result["sentence_scores"] >= 0.5).astype(int), result["sentence_labels"].astype(int))[2]
    if "span_f1" in result:
        metrics["span_f1"] = result["span_f1"]
    return metrics


def rules_baseline(examples: list[dict]) -> dict:
    """What the checker's rules do today: H4 only (gate-vague = fewer than 4 words); H1-H3 have no rule."""
    h4 = [e for e in examples if e["head"] == "h4"]
    if not h4:
        return {}
    labels = np.array([e["label"] for e in h4])
    words = np.array([len(e["text_a"].replace("[H4] [GATE] ", "").split()) for e in h4])
    predicted = np.where(words < 4, H4_LABELS.index("not"), H4_LABELS.index("checkable"))
    f1s = [prf(predicted, labels, positive=c)[2] for c in range(3)]
    precision, recall, _ = prf(predicted, labels, positive=H4_LABELS.index("not"))
    return {"h4": {"macro_f1": float(np.mean(f1s)), "not_precision": precision, "not_recall": recall}, "h1": "no rule (recall 0)", "h2": "no rule", "h3": "no rule"}


def write_errors(path: str, examples: dict[str, list[dict]], results: dict[str, dict], temperatures: dict[str, float]) -> None:
    lines = ["# Dev examples the model gets most wrong", ""]
    for head, rows in examples.items():
        result = results[head]
        probs = torch.softmax(torch.tensor(result["logits"] / temperatures[head]), -1).numpy()
        labels = result["labels"]
        confidence_wrong = 1 - probs[np.arange(len(labels)), labels]
        lines.append(f"## {head}")
        for index in np.argsort(-confidence_wrong)[:12]:
            row = rows[index]
            lines += [f"- label {labels[index]}, predicted {probs[index].round(2).tolist()} · {row.get('note', '')} · {row['seed']}", f"  - A: {row['text_a'][:300]}", f"  - B: {row['text_b'][:400]}"]
        lines.append("")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


# ------------------------------------------------------------------ training


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--base", default=DEFAULT_BASE)
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch", type=int, default=32)
    parser.add_argument("--lr", type=float, default=5e-5)
    parser.add_argument("--head-lr", type=float, default=1e-3)
    parser.add_argument("--max-len", type=int, default=384)
    parser.add_argument("--seed", type=int, default=13)
    parser.add_argument("--max-steps", type=int, default=None, help="stop early (a smoke test)")
    parser.add_argument("--no-features", action="store_true", help="ablation: zero the graph facts")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    examples = load_examples(args.data)
    if args.no_features:
        for example in examples:
            example["features"] = [0.0] * len(example["features"])
    grouped = by_head_and_split(examples)
    tokenizer = make_tokenizer(args.base)
    tokenizer.save_pretrained(os.path.join(args.out, "tokenizer"))
    pad_id = tokenizer.pad_token_id

    def loader(rows: list[dict], shuffle: bool) -> DataLoader:
        return DataLoader(HeadDataset(rows, tokenizer, args.max_len), batch_size=args.batch, shuffle=shuffle, collate_fn=lambda items: collate(items, pad_id))

    heads = [head for head in HEADS if grouped.get(head, {}).get("train")]
    train_rows = {head: balance(grouped[head]["train"], args.seed) for head in heads}
    train = {head: loader(rows, True) for head, rows in train_rows.items()}
    dev_rows = {head: grouped[head].get("dev", []) for head in heads}
    dev = {head: loader(rows, False) for head, rows in dev_rows.items() if rows}
    test = {head: loader(grouped[head].get("test", []), False) for head in heads if grouped[head].get("test")}
    print("train examples:", {head: len(rows) for head, rows in train_rows.items()}, "dev:", {h: len(r) for h, r in dev_rows.items()}, flush=True)

    # H4's classes are uneven by design; weight them so "partly" is not ignored.
    class_weights = {}
    if "h4" in train_rows:
        counts = np.bincount([e["label"] for e in train_rows["h4"]], minlength=3).astype(float)
        class_weights["h4"] = torch.tensor(counts.sum() / (3 * np.maximum(counts, 1)), dtype=torch.float32, device=device)

    model = SgSem(args.base, len(tokenizer)).to(device)
    encoder_params = list(model.encoder.parameters())
    encoder_ids = {id(p) for p in encoder_params}
    other_params = [p for p in model.parameters() if id(p) not in encoder_ids]
    optimizer = torch.optim.AdamW([{"params": encoder_params, "lr": args.lr}, {"params": other_params, "lr": args.head_lr}], weight_decay=0.01)
    steps_per_epoch = math.ceil(sum(len(rows) for rows in train_rows.values()) / args.batch)
    total_steps = args.max_steps or steps_per_epoch * args.epochs
    from transformers import get_linear_schedule_with_warmup

    scheduler = get_linear_schedule_with_warmup(optimizer, int(0.06 * total_steps), total_steps)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")

    start_epoch, best_score, step = 0, -1.0, 0
    last_path = os.path.join(args.out, "last.pt")
    if os.path.exists(last_path):
        state = torch.load(last_path, map_location=device, weights_only=False)
        model.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        scheduler.load_state_dict(state["scheduler"])
        scaler.load_state_dict(state["scaler"])
        start_epoch, best_score, step = state["epoch"] + 1, state["best_score"], state["step"]
        print(f"resumed after epoch {state['epoch'] + 1}, best dev score {best_score:.3f}", flush=True)

    # Heads are drawn with probability ∝ √(examples), so the small ones are not drowned out.
    weights = np.array([math.sqrt(len(train_rows[head])) for head in heads])
    weights = weights / weights.sum()
    sampler = random.Random(args.seed)
    started = time.time()
    for epoch in range(start_epoch, args.epochs):
        model.train()
        iterators = {head: iter(train[head]) for head in heads}
        running = {head: [] for head in heads}
        for _ in range(steps_per_epoch):
            if args.max_steps and step >= args.max_steps:
                break
            head = sampler.choices(heads, weights=weights.tolist())[0]
            try:
                batch = next(iterators[head])
            except StopIteration:
                iterators[head] = iter(train[head])
                batch = next(iterators[head])
            batch = to_device(batch, device)
            with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=device.type == "cuda"):
                outputs = run_model(model, batch)
            loss = batch_loss(outputs, batch, class_weights)
            optimizer.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            running[head].append(float(loss.item()))
            step += 1
            if step % 50 == 0:
                means = {h: round(float(np.mean(v[-50:])), 3) for h, v in running.items() if v}
                print(f"epoch {epoch + 1} step {step}/{total_steps} loss {means} · {(time.time() - started) / 60:.1f} min", flush=True)

        results = {head: predict(model, dev[head], device) for head in dev}
        metrics = {head: head_metrics(head, result) for head, result in results.items()}
        score = float(np.mean([m["score"] for m in metrics.values()])) if metrics else 0.0
        print(f"epoch {epoch + 1} dev:", json.dumps({h: {k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()} for h, m in metrics.items()}), flush=True)
        if score > best_score:
            best_score = score
            torch.save(model.state_dict(), os.path.join(args.out, "best.pt"))
            print(f"new best dev score {score:.3f}", flush=True)
        torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(), "scheduler": scheduler.state_dict(), "scaler": scaler.state_dict(), "epoch": epoch, "best_score": best_score, "step": step}, last_path)
        if args.max_steps and step >= args.max_steps:
            break

    # Final: the best epoch, calibrated and thresholded on dev, then measured once on test.
    model.load_state_dict(torch.load(os.path.join(args.out, "best.pt"), map_location=device, weights_only=True))
    dev_results = {head: predict(model, dev[head], device) for head in dev}
    dev_metrics = {head: head_metrics(head, result) for head, result in dev_results.items()}
    temperatures = {head: m["temperature"] for head, m in dev_metrics.items()}
    thresholds = {head: m["threshold"] for head, m in dev_metrics.items()}
    test_metrics = {head: head_metrics(head, predict(model, test[head], device), temperatures[head], thresholds[head]) for head in test if head in temperatures}
    shipping = {head: (m.get("threshold") is not None and m.get("precision_at_threshold", m.get("not_precision", 0)) >= PRECISION_BAR) for head, m in test_metrics.items()}
    report = {
        "base": args.base,
        "max_len": args.max_len,
        "no_features": args.no_features,
        "dev": dev_metrics,
        "test": test_metrics,
        "rules_baseline_test": rules_baseline([e for e in examples if e["split"] == "test"]),
        "meets_bar_on_test": shipping,
        "minutes": round((time.time() - started) / 60, 1),
    }
    with open(os.path.join(args.out, "metrics.json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    with open(os.path.join(args.out, "sgsem.json"), "w", encoding="utf-8") as handle:
        json.dump({"base": args.base, "vocab_size": len(tokenizer), "max_len": args.max_len, "temperatures": temperatures, "thresholds": thresholds, "heads": HEADS}, handle, indent=2)
    write_errors(os.path.join(args.out, "errors.md"), {head: dev_rows[head] for head in dev}, dev_results, temperatures)
    print("test:", json.dumps({h: {k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()} for h, m in test_metrics.items()}))
    print("meets the 0.9 precision bar on test:", shipping)


if __name__ == "__main__":
    main()
