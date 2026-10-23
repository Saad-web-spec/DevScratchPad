"""Runs the text-model requests the data pipeline writes (round1 / round2), on a Colab GPU.

Reads <name>.requests.jsonl, appends one {"id", "text"} line per answer to <name>.outputs.jsonl, and
skips ids already answered, so a disconnected runtime picks up where it stopped. No API: the model
runs here, in the notebook.

    python -m sgsem.generate --requests data/round2.requests.jsonl --outputs data/round2.outputs.jsonl
"""
from __future__ import annotations

import argparse
import json
import os
import re
import time
from collections import defaultdict
from itertools import zip_longest

DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct"


def read_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def load_model(name: str):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    tokenizer = AutoTokenizer.from_pretrained(name, padding_side="left")
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    memory_gb = torch.cuda.get_device_properties(0).total_memory / 1e9 if torch.cuda.is_available() else 0
    # fp16 needs ~2.1 GB per billion parameters plus room for the batch: a 7B model fits an L4 or A100 whole, a 14B
    # model (~30 GB) an A100 only; otherwise 4-bit (a T4 holds 7B that way, an L4 14B).
    size = re.search(r"(\d+(?:\.\d+)?)B", name, re.IGNORECASE)
    needed_gb = 2.1 * float(size.group(1)) + 6 if size else 20
    if memory_gb >= needed_gb:
        model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float16, device_map="auto")
        mode = "fp16"
    else:
        quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
        model = AutoModelForCausalLM.from_pretrained(name, quantization_config=quant, device_map="auto")
        mode = "4-bit"
    model.eval()
    print(f"loaded {name} ({mode}, GPU memory {memory_gb:.1f} GB)")
    return tokenizer, model


def run(requests_path: str, outputs_path: str, model_name: str = DEFAULT_MODEL, batch_size: int = 16, limit: int | None = None) -> None:
    import torch

    if not os.path.exists(requests_path):
        raise SystemExit(f"{requests_path} does not exist: the pipeline step that writes it did not run.")
    requests = read_jsonl(requests_path)
    # Answers to a changed prompt have an old id (the pipeline adds a prompt hash), so they are not counted.
    done = {row["id"] for row in read_jsonl(outputs_path)} & {row["id"] for row in requests}
    todo = [row for row in requests if row["id"] not in done]
    if limit is not None:
        # A quick look takes turns across kinds and styles, and within each across graphs, so every kind gets
        # answers to review, not just the first graph's checker answers.
        def take_turns(rows: list[dict], key) -> list[dict]:
            groups: dict = defaultdict(list)
            for row in rows:
                groups[key(row)].append(row)
            return [row for turn in zip_longest(*groups.values()) for row in turn if row is not None]

        queues: dict[tuple, list[dict]] = defaultdict(list)
        for row in todo:
            queues[(row["kind"], row["meta"].get("style", ""))].append(row)
        spread = [take_turns(rows, lambda row: row["meta"].get("seed") or row["meta"].get("topic") or row["id"]) for rows in queues.values()]
        todo = [row for turn in zip_longest(*spread) for row in turn if row is not None][:limit]
    print(f"{len(done)} already answered, {len(todo)} to go")
    if not todo:
        return
    tokenizer, model = load_model(model_name)

    def prompt(row: dict) -> str:
        messages = [{"role": "system", "content": row["system"]}, {"role": "user", "content": row["user"]}]
        return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

    # Batches share a sampling setting and similar prompt lengths, so padding stays small.
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for row in todo:
        groups[(row["temperature"], row["max_new_tokens"])].append(row)
    started, answered = time.time(), 0
    with open(outputs_path, "a", encoding="utf-8") as out:
        for (temperature, max_new), rows in groups.items():
            rows.sort(key=lambda row: len(row["user"]))
            for start in range(0, len(rows), batch_size):
                batch = rows[start : start + batch_size]
                encoded = tokenizer([prompt(row) for row in batch], return_tensors="pt", padding=True).to(model.device)
                with torch.no_grad():
                    generated = model.generate(
                        **encoded,
                        max_new_tokens=max_new,
                        do_sample=True,
                        temperature=temperature,
                        top_p=0.95,
                        pad_token_id=tokenizer.pad_token_id,
                    )
                new_tokens = generated[:, encoded["input_ids"].shape[1] :]
                for row, text in zip(batch, tokenizer.batch_decode(new_tokens, skip_special_tokens=True)):
                    out.write(json.dumps({"id": row["id"], "text": text.strip()}, ensure_ascii=False) + "\n")
                out.flush()
                answered += len(batch)
                elapsed = time.time() - started
                print(f"{answered}/{len(todo)} answered · {elapsed / 60:.1f} min · ~{(len(todo) - answered) * elapsed / answered / 60:.0f} min left", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--requests", required=True)
    parser.add_argument("--outputs", required=True)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--limit", type=int, default=None, help="answer only this many (a quick look before the full run)")
    args = parser.parse_args()
    run(args.requests, args.outputs, args.model, args.batch_size, args.limit)


if __name__ == "__main__":
    main()
