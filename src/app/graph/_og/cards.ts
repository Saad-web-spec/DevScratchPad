import type { ShareCardProps } from "./shareImage";

export const GRAPH_CARD_ALT = "Skill Graph: design multi-agent skills as a graph and compile them into Claude Code subagents and Cursor rules";
export const GRAPH_CARD: ShareCardProps = {
  title: ["Design multi-agent", "skills as a graph"],
  highlight: "graph",
  subtitle: "Then compile it for Claude Code and Cursor.",
  url: "devscratchpad.tech/graph",
};

export const GUIDE_CARD_ALT = "The Skill Graph guide: build a multi-agent skill step by step, from nodes and contracts to export";
export const GUIDE_CARD: ShareCardProps = {
  eyebrow: "Guide",
  title: ["Build a multi-agent", "skill, step by step"],
  highlight: "step by step",
  subtitle: "From the first node to a skill your agent runs.",
  url: "devscratchpad.tech/graph/guide",
  numbered: true,
};
