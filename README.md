# awesome-agent-infra

An opinionated, machine-readable map of small open-source tools for building, debugging, observing, handing off, and securing AI-agent workflows.

**[Open the interactive Agent Infra Map →](https://jovial-liu.github.io/agent-infra-map/)** — search all 22 tools, filter by category, and copy commands or complete recipes from the browser.

The filter is simple: every entry should be useful from a terminal, produce a portable artifact when practical, state its safety model, and be easy to try without signing up for a service.

Describe the problem and get a ranked starting point—without installing anything permanently:

```console
$ npx --yes github:jovial-liu/awesome-agent-infra#v1 find "stale green tests"
stillgreen  [verification]  keyword: stale, keyword: green, keyword: test, category: verification
  Prove that a command passed on the exact Git worktree you still have
  https://github.com/jovial-liu/stillgreen
  try: npx --yes github:jovial-liu/stillgreen#v1 --help
```

The zero-dependency `agent-infra` CLI also supports `list`, `show`, `categories`, ordered `recipes`, and `--json` for agent workflows.

## The map

| Category | Project | What it does | Artifact |
| --- | --- | --- | --- |
| Configuration | [envstitch](https://github.com/jovial-liu/envstitch) | Maps env vars across a polyglot repository | SARIF / `.env.example` |
| Documentation | [mdpulse](https://github.com/jovial-liu/mdpulse) | Executes Markdown contracts and link checks | JUnit / SARIF |
| Debugging | [errorparcel](https://github.com/jovial-liu/errorparcel) | Packages a sanitized reproducible failure | Markdown / JSON |
| Debugging | [termframe](https://github.com/jovial-liu/termframe) | Captures terminal output as a portable frame | SVG / HTML |
| Review | [diffstory](https://github.com/jovial-liu/diffstory) | Turns a Git diff into an offline PR story | HTML / Markdown |
| Security | [actionmap](https://github.com/jovial-liu/actionmap) | Maps risky GitHub Actions execution paths | HTML / SARIF |
| Handoff | [agentbrief](https://github.com/jovial-liu/agentbrief) | Makes a bounded, redacted worktree handoff | Markdown / JSON |
| Observability | [agentflight](https://github.com/jovial-liu/agentflight) | Records commands and worktree deltas | HTML / JSON |
| Observability | [traceproof](https://github.com/jovial-liu/traceproof) | Proves tool calls and results form a complete, coherent trace | JSON / Markdown / HTML / SARIF |
| Reliability | [falsegreen](https://github.com/jovial-liu/falsegreen) | Finds swallowed failures that make automation look green | JSON / Markdown / HTML / SARIF |
| Reliability | [hookmatrix](https://github.com/jovial-liu/hookmatrix) | Proves which Git hooks are active in every worktree | JSON / Markdown / HTML / SARIF |
| Protocol | [mcpdoctor](https://github.com/jovial-liu/mcpdoctor) | Smoke-tests MCP stdio servers | HTML / SARIF |
| Security | [promptshield](https://github.com/jovial-liu/promptshield) | Scans agent-readable files for injection signals | SARIF / HTML |
| Release | [packguard](https://github.com/jovial-liu/packguard) | Preflights the exact npm tarball | HTML / SARIF |
| Authorization | [toolgate](https://github.com/jovial-liu/toolgate) | Unit-tests AI tool-call policy | JSON / Markdown / HTML |
| Optimization | [prompttax](https://github.com/jovial-liu/prompttax) | Measures instruction and MCP schema context costs | JSON / Markdown / HTML |
| Privacy | [ignorematrix](https://github.com/jovial-liu/ignorematrix) | Finds cross-assistant sensitive-path policy gaps | JSON / Markdown / HTML |
| Evaluation | [commitcase](https://github.com/jovial-liu/commitcase) | Turns bug-fix commits into coding-agent eval cases | JSON / Markdown / Patch |
| Composition | [toolclash](https://github.com/jovial-liu/toolclash) | Finds cross-server MCP tool collisions | JSON / Markdown / HTML |
| Verification | [stillgreen](https://github.com/jovial-liu/stillgreen) | Proves a command passed on the exact worktree still present | JSON receipt |
| Testing | [mcpstub](https://github.com/jovial-liu/mcpstub) | Generates deterministic modern/legacy MCP fixture servers | JSON fixture / JSONL calls |
| Compatibility | [clidrift](https://github.com/jovial-liu/clidrift) | Detects breaking command and option drift from CLI help | JSON / Markdown |

The same list is available as [`catalog.json`](catalog.json) for tools and scripts, and powers the separate [interactive map](https://github.com/jovial-liu/agent-infra-map).

## Search from the terminal

```bash
npx --yes github:jovial-liu/awesome-agent-infra#v1 find "MCP tool collision"
npx --yes github:jovial-liu/awesome-agent-infra#v1 show mcpdoctor
npx --yes github:jovial-liu/awesome-agent-infra#v1 list --category security
npx --yes github:jovial-liu/awesome-agent-infra#v1 find "safe handoff" --json
```

Search is deterministic and offline after installation. It uses the catalog's human-reviewed categories and keywords; no query is uploaded and no model call is made.

## Run a recipe

Single tools solve narrow problems; recipes put them in a defensible order:

```console
$ npx --yes github:jovial-liu/awesome-agent-infra#v1 recipe mcp-release
Review, compose, and fixture-test MCP servers

1. mcpdoctor — Negotiate each server and snapshot its advertised contract
2. toolclash — Find collisions before combining multiple tool catalogs
3. mcpstub — Turn the reviewed contract into a deterministic client fixture
```

Available recipes cover secure agent handoff, MCP release, npm/CLI release, context hygiene, agent-run review, coding-agent evaluation, GitHub CI trust, and worktree proof. Use `recipes --json` or `recipe <name> --json` when another agent will consume the workflow.

## Pick a starting point

```text
I need to understand a failing command       → errorparcel, termframe
I need to hand work to another agent         → agentbrief
I need to see what an agent actually did     → agentflight
I need to verify an agent tool trace          → traceproof
I need to find CI failures that pass anyway   → falsegreen
I need to prove hooks work in agent worktrees → hookmatrix
I need to review an MCP server first         → mcpdoctor
I need to scan repo instructions for attacks  → promptshield
I need to test what an agent may do           → toolgate
I need to measure context before coding       → prompttax
I need to compare assistant privacy policies  → ignorematrix
I need evals from my own repository history   → commitcase
I need to combine MCP servers safely          → toolclash
I need proof the delivered tree is still green → stillgreen
I need to test an MCP client offline            → mcpstub
I need to prevent breaking CLI changes          → clidrift
I need a reviewable PR artifact              → diffstory
I need to know what npm will publish         → packguard
```

All listed commands are examples; inspect each repository's current README and permissions before running it on sensitive code.

## Design principles

- Local-first by default: no telemetry or hidden upload in the catalog itself.
- Portable outputs: Markdown, JSON, HTML, SVG, SARIF, or other files that survive a chat window.
- Small interfaces: one command should demonstrate the value.
- Honest safety language: static findings are review prompts, not magic proof.
- Machine-readable metadata: the list should be useful to humans and agents.

## Contributing

Run:

```bash
npm run validate
npm test
```

Then add one complete entry to `catalog.json` and the matching README table row. Explain why it belongs and what it does with workspace data.

MIT licensed.
