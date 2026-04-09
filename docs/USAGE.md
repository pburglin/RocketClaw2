# Usage

RocketClaw2 currently ships a runnable CLI with persistent sessions, retrieval, semantic memory promotion, a minimal interactive chat shell, and operator-friendly inspection commands.

## Core commands
- `rocketclaw2 init`
- `rocketclaw2 doctor`
- `rocketclaw2 config-show`
- `rocketclaw2 run`
- `rocketclaw2 roadmap`
- `rocketclaw2 channels`
- `rocketclaw2 send`

`doctor` now includes the active recall-scoring profile from persisted config, so runtime diagnostics reflect the current memory-ranking behavior. Use `config-show` when you want the full resolved app config instead of just diagnostics, and `recall-explain` when you want plain-English guidance for what the recall weights do.

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
- `rocketclaw2 recall-explain`
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

## Messaging inspection

- `rocketclaw2 messaging-summary`
- `rocketclaw2 whatsapp-config`

## Governed tool execution

- `rocketclaw2 tool-run --tool file-management --action read`
- `rocketclaw2 tool-run --tool file-management --action write --approve`

## Recall inspection

- `rocketclaw2 recall --query "alpha"`
- `rocketclaw2 recall --query "alpha" --kind semantic`
- `rocketclaw2 recall --query "alpha" --summary`

## Yolo mode

- `rocketclaw2 yolo-config`
- `rocketclaw2 yolo-config --enabled true --warn true`

## System summary

- `rocketclaw2 system-summary`
- `rocketclaw2 system-summary --json`

## Messaging send ergonomics

- `rocketclaw2 send --channel whatsapp --text "hello"`
- `rocketclaw2 send --channel whatsapp --to "+15551234567" --text "hello"`
- `rocketclaw2 send --channel whatsapp --text "hello" --json`

## Semantic memory inspection

- `rocketclaw2 memory-list`
- `rocketclaw2 memory-list --tag preference`
- `rocketclaw2 memory-list --min-salience 40 --summary`

## Governed messaging execution

- `rocketclaw2 message-run --channel whatsapp --text "hello" --approve`

## Ralph loop

- `rocketclaw2 ralph-loop --command "npm test" --until exit-0 --max-iterations 5`
- `rocketclaw2 ralph-loop --command "node script.js" --until stdout-includes --match-text "DONE" --max-iterations 10`

## Ralph loop presets

- `rocketclaw2 ralph-loop --preset validate --max-iterations 5`
- `rocketclaw2 ralph-loop --preset build --max-iterations 5`

## Approval workflow

- `rocketclaw2 approval-create --kind message-send --target whatsapp --detail "Send daily report"`
- `rocketclaw2 approval-list`
- `rocketclaw2 approval-list --status pending`
- `rocketclaw2 approval-resolve --id <approval-id> --status approved`


Note: approval requests may now be created automatically when governed execution is attempted without required approval.

## Approval inspection

- `rocketclaw2 approval-list --status pending --kind message-send`
- `rocketclaw2 approval-list --summary`
