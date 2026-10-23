"""Writes the tokenizer parity fixture: pairs of texts with the ids and segment ids the Hugging Face tokenizer gives
them, which src/app/graph/lib/semanticTokenizer.ts must reproduce token for token (spec §9). The tokenizer is built
from models/sg-sem/vocab.txt plus the special tokens, the way the connector builds its own, and checked against a
training run's saved tokenizer when one is given.

    python -X utf8 -m sgsem.fixture --vocab ../../models/sg-sem/vocab.txt --out ../../src/app/graph/lib/__tests__/fixtures/semanticTokenizer.json \
        --data gold/examples.jsonl tryout/examples.jsonl [--check runs/msmarco-6/tokenizer]
"""
from __future__ import annotations

import argparse
import json
import random

from . import SPECIAL_TOKENS

MAX_LEN = 384

# Strings a WordPiece port gets wrong first: accents, unicode punctuation and spaces, control characters, CJK,
# emoji, very long words, special tokens in odd places and look-alikes that must not match.
TRICKY = [
    "",
    " ",
    "[H4] [GATE] Résumé of the café's naïve coördination — façade über straße.",
    "[H4] [GATE] Tabs\tand\nnewlines\r\nand  double  spaces and em space.",
    "[H4] [GATE] Control\u0000chars\u0007here​zero-width﻿bom�.",
    "[H4] [GATE] Quotes “smart” ‘single’ «guillemets» … ellipsis – en — em • bullet ¿ ¡ § ¶ ©",
    "[H4] [GATE] 中文字符混合 English words 日本語 한국어 text.",
    "[H4] [GATE] Emoji 🙂 and 👍🏽 and flags 🇵🇰 stay.",
    "[H4] [GATE] " + "a" * 120 + " and " + "supercalifragilisticexpialidocious" * 4,
    "[H4] [GATE] [h4] [gate] [Gate] [GATE][H4] [SEP] [CLS] [UNK] [PAD] [MASK] [SEN]x x[SEN]",
    "[H4] [GATE] Numbers 3.50, 1,000,000, 12/31/2026, 95%, $5.75, 10GB, v2.1.0, 1e-5, -3.",
    "[H4] [GATE] snake_case camelCase kebab-case path/to/file.ts {{step.output}} <tag> a&b c|d ~e `f`",
    "[H4] [GATE] URLs https://www.devscratchpad.tech/graph/mcp?x=1&y=2#frag and mail a.b@c.de",
    "[H4] [GATE] ÀÉÎÕÜ àéîõü ÇÑ çñ ß ø Ø å Å æ Æ œ Œ ł Ł đ Đ",
    "[H4] [GATE] Greek αβγ Cyrillic абв Arabic العربية Hebrew עברית Hindi हिन्दी Thai ไทย",
    "[H4] [GATE] Math ∑ ∏ √ ∞ ≠ ≤ ≥ ± × ÷ ° µ ½ ² ³",
    "[H4] [GATE] Every claim has a source.[INPUT] no space before the token and after[INPUT]",
    "[H4] [GATE] Trailing spaces   ",
    "   [H4] [GATE] Leading spaces",
    "[INPUT] none",
    "[INPUT] itinerary · Worker · A day-by-day plan; every item has a cost. [INPUT] goal · Your request · what to do",
    "[H2] [TASK] Add up the scores of every criterion and give the essay a final grade out of 100.",
    "[CANDIDATE] score · Worker · One score per criterion, with the quotes behind it.",
    "İstanbul DŽEMAL ǅ ﬁ ﬂ ﬀ ①②③ Ⅻ ㎞ ㍿",
    "x" * 2000,
    ("word " * 500).strip(),
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vocab", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--data", nargs="*", default=[], help="examples.jsonl files to sample pairs from")
    parser.add_argument("--per-file", type=int, default=120)
    parser.add_argument("--check", help="a run's tokenizer directory; the fixture must match it too")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    from transformers import AutoTokenizer, BertTokenizerFast

    tokenizer = BertTokenizerFast(vocab_file=args.vocab, do_lower_case=True)
    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})

    pairs: list[tuple[str, str]] = [(a, "") for a in TRICKY] + [(a, b) for a in TRICKY[:8] for b in TRICKY[19:22]]
    rng = random.Random(args.seed)
    for path in args.data:
        with open(path, encoding="utf-8") as handle:
            rows = [json.loads(line) for line in handle if line.strip()]
        rng.shuffle(rows)
        pairs += [(row["text_a"], row["text_b"]) for row in rows[: args.per_file]]

    checker = AutoTokenizer.from_pretrained(args.check) if args.check else None
    out = []
    for a, b in pairs:
        enc = tokenizer(a, b or None, truncation="longest_first", max_length=MAX_LEN)
        if checker is not None:
            other = checker(a, b or None, truncation="longest_first", max_length=MAX_LEN)
            assert other["input_ids"] == enc["input_ids"] and other["token_type_ids"] == enc["token_type_ids"], (a[:60], b[:60])
        out.append({"a": a, "b": b, "ids": enc["input_ids"], "types": enc["token_type_ids"]})
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(out, handle, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out)} pairs → {args.out}" + (" (matches the run's tokenizer)" if checker is not None else ""))


if __name__ == "__main__":
    main()
