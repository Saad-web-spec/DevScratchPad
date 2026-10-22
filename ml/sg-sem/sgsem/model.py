"""The sg-sem network: one pretrained encoder, the 16 graph facts, and four heads (spec §2).

forward() always computes every head, so the exported ONNX graph has one fixed set of outputs; the
connector reads the ones it needs.
"""
from __future__ import annotations

import torch
from torch import nn

from . import FEATURE_COUNT, HEAD_CLASSES


class SgSem(nn.Module):
    def __init__(self, base: str, vocab_size: int):
        super().__init__()
        from transformers import AutoModel

        self.encoder = AutoModel.from_pretrained(base)
        self.encoder.resize_token_embeddings(vocab_size)
        # DeBERTa-v3 has no segment embeddings; BERT-style models (MiniLM) do.
        self.uses_token_types = getattr(self.encoder.config, "type_vocab_size", 0) > 0
        hidden = self.encoder.config.hidden_size
        self.features = nn.Sequential(nn.Linear(FEATURE_COUNT, 64), nn.GELU())

        def head(classes: int) -> nn.Module:
            return nn.Sequential(nn.Dropout(0.1), nn.Linear(hidden + 64, 128), nn.GELU(), nn.Linear(128, classes))

        self.heads = nn.ModuleDict({name: head(classes) for name, classes in HEAD_CLASSES.items()})
        self.sentence = nn.Linear(hidden, 1)  # H1: does this [SEN] report an open problem?
        self.span = nn.Linear(hidden, 2)  # H2: start / end of the words that name the missing data

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor, token_type_ids: torch.Tensor, features: torch.Tensor):
        kwargs = {"input_ids": input_ids, "attention_mask": attention_mask}
        if self.uses_token_types:
            kwargs["token_type_ids"] = token_type_ids
        tokens = self.encoder(**kwargs).last_hidden_state
        joined = torch.cat([tokens[:, 0], self.features(features)], dim=-1)
        return (
            self.heads["h1"](joined),
            self.heads["h2"](joined),
            self.heads["h3"](joined),
            self.heads["h4"](joined),
            self.sentence(tokens).squeeze(-1),
            self.span(tokens),
        )


OUTPUT_NAMES = ["h1", "h2", "h3", "h4", "h1_sentences", "h2_span"]
