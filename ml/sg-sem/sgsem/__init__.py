"""sg-sem: the Skill Graph semantic checker model. See SKILL_GRAPH_SEMANTIC_MODEL_SPEC.md at the repo root."""

# Must match SEM_SPECIAL_TOKENS in src/app/graph/lib/semanticInput.ts, in the same order.
SPECIAL_TOKENS = ["[H1]", "[H2]", "[H3]", "[H4]", "[GATE]", "[TASK]", "[INPUT]", "[CONTRACT]", "[READS]", "[VERDICT]", "[SEN]", "[CANDIDATE]"]
FEATURE_COUNT = 16
HEADS = ["h1", "h2", "h3", "h4"]
HEAD_CLASSES = {"h1": 2, "h2": 2, "h3": 2, "h4": 3}
H4_LABELS = ["checkable", "partly", "not"]
