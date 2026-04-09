# Usage

RocketClaw2 currently ships a runnable CLI with persistent sessions, retrieval, semantic memory promotion, a minimal interactive chat shell, and operator-friendly inspection commands.

## Core commands
- `rocketclaw2 init`
- `rocketclaw2 doctor`
- `rocketclaw2 run`
- `rocketclaw2 roadmap`
- `rocketclaw2 channels`
- `rocketclaw2 send`

`doctor` now includes the active recall-scoring profile from persisted config, so runtime diagnostics reflect the current memory-ranking behavior.

## Session commands
- `rocketclaw2 session-create --title "Demo Session"`
- `rocketclaw2 session-list`
- `rocketclaw2 session-list --title-contains demo`
- `rocketclaw2 session-show --id <session-id>`
- `rocketclaw2 session-append --id <session-id> --role user --text "hello"`
- `rocketclaw2 session-stats`

## Memory commands
- `rocketclaw2 search --query "alpha"`
- `rocketclaw2 recall --query "alpha"`
- `rocketclaw2 recall-profile`
- `rocketclaw2 dream`
- `rocketclaw2 remember`
- `rocketclaw2 memory-list`
- `rocketclaw2 memory-plan`

## Interactive chat
- `rocketclaw2 chat --title "My Session"`
- `rocketclaw2 chat --session-id <existing-session-id>`

The current chat shell is intentionally minimal. It appends user and assistant turns into the persistent session store, runs unified recall against both session history and curated semantic memory, and responds differently when the user asks explicit memory questions versus normal chat input.

## Output modes
Most inspection commands support a human-readable default format plus raw structured output when `--json` is provided.

Examples:
```bash
rocketclaw2 session-list
rocketclaw2 session-list --json
rocketclaw2 session-stats
rocketclaw2 memory-list --json
```

## Example workflow
```bash
npm run build
npm test
node dist/cli.js session-create --title "Demo"
node dist/cli.js session-list
node dist/cli.js session-append --id <session-id> --role user --text "Pedro prefers WhatsApp"
node dist/cli.js recall-profile
node dist/cli.js search --query WhatsApp
node dist/cli.js dream
node dist/cli.js remember
node dist/cli.js recall --query WhatsApp
node dist/cli.js chat --session-id <session-id>
```

## Current limitations
- chat responses are still rule-based and intentionally simple
- retrieval is now stronger than plain substring matching, unified recall suppresses identical duplicate hits, top results get a light diversity rebalance, and recall ranking blends lexical relevance with salience and recency, but matching is still lexical and does not yet use embeddings or semantic similarity
- dreaming currently plans and promotes memory, but does not yet rewrite or prune episodic history
- messaging is plugin-based, with WhatsApp as the first concrete target in the roadmap
- the richer TUI is still future work, but the formatter layer now supports more usable terminal inspection flows
