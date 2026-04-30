# Second Brain Demo

This demo shows the intended RocketClaw2 operator flow for turning raw session history into durable personal memory.

## Goal
Capture a preference or recurring fact, promote it into semantic memory, and retrieve it later through recall.

## Demo flow
```bash
node dist/src/cli.js session-create --title "Second Brain Demo"
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates"
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates during work hours"
node dist/src/cli.js dream --summary
node dist/src/cli.js dream-run --dry-run
node dist/src/cli.js remember
node dist/src/cli.js memory-list --query "WhatsApp" --limit 3
node dist/src/cli.js memory-list --summary
node dist/src/cli.js recall --query "WhatsApp updates" --kind semantic --limit 3
```

## What this demonstrates
- capturing raw episodic memory in normal session history
- inspecting consolidation candidates before promotion
- promoting durable personal context into semantic memory
- using recall as a practical personal-RAG workflow

## Good operator habits
- promote stable preferences, constraints, and repeated facts
- avoid promoting temporary or highly sensitive details
- use `dream --summary` or `dream-run --dry-run` before bulk promotion
- periodically review semantic memory with `memory-list --summary`

## Follow-up extensions
- add tags for preference, project, people, and scheduling context
- build ingestion flows for notes, logs, or imported artifacts
- introduce pruning and summarization passes for stale memory later
