# Skill Graph connector: directory submission kit

Everything the Anthropic developer portal asks for, ready to paste. Submit at https://claude.ai/directory/manage → **Submit new** → **MCP connector** (needs a paid Claude plan).

Official references: [Submit a connector](https://claude.com/docs/connectors/building/submission) · [Review criteria](https://claude.com/docs/connectors/building/review-criteria) · [Testing](https://claude.com/docs/connectors/building/testing)

## Before you open the portal

- [ ] Deployed: `https://www.devscratchpad.tech/graph/mcp` answers `initialize` (see "Smoke test" below)
- [ ] Vercel firewall lets Anthropic through: Bot Protection on **Log**, and a bypass rule for `/graph/mcp` like the existing ones for `/api/raw` and `llms.txt`
- [ ] Tested as a custom connector in Claude (Customize → Connectors → Add custom connector) and every tool called once from a chat
- [ ] Tested with MCP Inspector: `npx @modelcontextprotocol/inspector --cli https://www.devscratchpad.tech/graph/mcp --transport http --method tools/list`
- [ ] `support@devscratchpad.tech` receives mail

## 1. Connection

- Server URL: `https://www.devscratchpad.tech/graph/mcp`
- Users connect to: **one URL**

## 2. Tools

Eight tools, all `readOnlyHint: true`, `destructiveHint: false`, each with a `title`:

| Tool | Title |
| --- | --- |
| get_graph_format | Get the graph skill format |
| list_graph_templates | List starter graphs |
| get_graph_template | Get a starter graph |
| draft_graph | Draft a graph from an outline |
| validate_graph | Check a graph |
| dry_run_graph | Dry-run a graph |
| compile_graph | Compile a graph into agent files |
| open_graph_in_studio | Get a studio link for a graph |

One prompt: `design_workflow` ("Design a workflow for my project").

## 3. Listing

- **Name** (≤100): Skill Graph
- **One-liner** (≤200): Describe your project and Claude designs a multi-agent workflow, checks it, and compiles it into Claude Code subagents or a Cursor rule.
- **Description** (≤2000):

  > Skill Graph turns a project description into a multi-agent workflow your agent can run. Tell Claude what you are building or what task you want automated, and it designs the workflow as a graph skill: the steps, which ones run in parallel, what each step hands the next, which steps check the work in a fresh context, and where a test or your approval decides whether work goes on.
  >
  > Skill Graph checks the graph the way a compiler checks code: cycles, missing inputs, references to steps that have not run yet, steps that can edit files running side by side, irreversible work without an approval. It also flags weak prompts: a verifier without pass criteria, a step that never says what it returns. Claude fixes what it finds until the graph is valid, then dry-runs it with a sample request to see what each step receives and hands on.
  >
  > You get back a link that opens the graph in the Skill Graph studio, where you can see it on a canvas, walk through the plan stage by stage, change steps and export. When you are happy with it, Claude compiles it into files: an orchestrating SKILL.md with one Claude Code subagent per step (each with its own tools and model), a single self-orchestrating SKILL.md, or a Cursor rule. In Claude Code, Claude saves them straight into your repository.
  >
  > Start from ten starter graphs (parallel audit, ship a change, review each file, PR review, RFC discovery, bug triage, research report, write an article, analyze a dataset, design an app), from an outline of the steps, or from scratch. No account, no API key: every tool only reads, and nothing you send is stored.

- **Categories** (1–5): Developer tools, Productivity (choose the closest names the portal offers)
- **Documentation URL**: https://www.devscratchpad.tech/graph/connector
- **Privacy policy URL**: https://www.devscratchpad.tech/graph/privacy
- **Support contact**: support@devscratchpad.tech
- **Icon**: `public/skill-graph-icon.png` (512×512 PNG), also served at https://www.devscratchpad.tech/skill-graph-icon.png and declared in `serverInfo.icons`. Note: as a *custom* connector, Claude ignores `serverInfo.icons` and shows Google's favicon for the apex domain (devscratchpad.tech = the DevScratchpad `</>` mark); see anthropics/claude-ai-mcp#152 and #838. Upload this icon in the portal so the directory listing uses it.
- **Slug** (permanent): `skill-graph`

## 4. Use cases

- **Primary use cases**:
  1. Plan a multi-agent workflow for a new project before starting it (e.g. implement a feature, run the tests until they pass, ask before opening the PR).
  2. Build a review workflow: parallel specialist reviewers, then a fresh-context verifier that filters false positives.
  3. Turn an existing starter graph into Claude Code subagent files and install them in a repository.
- **What users need before connecting**: nothing. No account, no plan with us, no API key.
- **Reads or writes data**: reads only. No tool changes anything on our side or in the user's accounts.

## 5. Company

- Company name: DevScratchpad
- Website: https://www.devscratchpad.tech
- Primary contact: (your name), support@devscratchpad.tech

## 6. Authentication

- **No authentication.** Every tool is intentionally public and stateless: it checks or compiles the graph text it is given and returns the result. There are no user accounts or user data to protect.

## 7. Data handling

- Underlying API: **our own** (the Skill Graph checker and compiler, the same code that runs in the browser studio).
- Personal health data: **no**. Sponsored content: **no**.

## 8. Test & launch

- **Test account**: none needed (no authentication).
- **Reviewer instructions**:
  1. Add `https://www.devscratchpad.tech/graph/mcp` as a custom connector named Skill Graph. There is no sign-in.
  2. In a chat with the connector on, ask: "Use Skill Graph to design a workflow for reviewing pull requests: security, performance and test coverage in parallel, then a fresh-context verifier. Check it and give me the studio link."
  3. Expected: Claude calls get_graph_format, likely list_graph_templates and get_graph_template (pr-review-graph), then validate_graph until it reports "Valid", then open_graph_in_studio. The link opens the graph at devscratchpad.tech/graph.
  4. Ask: "Compile it into Claude Code files." Expected: compile_graph returns the orchestrating SKILL.md, one subagent file per step, the graph source, a Cursor rule and a README.
  5. Error path: ask Claude to compile a graph with a cycle; compile_graph returns the checker's errors with how to fix them.
- **Confirm**: every tool was run through MCP Inspector and as a custom connector in Claude.

## 9. Compliance notes

- Directory guidelines: followed (read-only tools, accurate descriptions, no instructions to call other tools or services).
- First-party API: yes, our own code.
- Financial transactions: none. AI media generation: none.
- Prompt injection: tool descriptions only describe what each tool does. Graphs Claude receives from get_graph_template are our own starter content.
- Conversation data: the connector receives only tool inputs; it never asks for or receives chat history, memory or files, and stores nothing.
- Public documentation: https://www.devscratchpad.tech/graph/connector

## Smoke test

```bash
curl -s https://www.devscratchpad.tech/graph/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}'
```

Expect a JSON result with `"serverInfo":{"name":"skill-graph",...}`.
