# Second Brain Demo

This demo shows the intended RocketClaw2 operator flow for turning raw session history into durable personal memory.

## Goal
Capture a preference or recurring fact, promote it into semantic memory, and retrieve it later through recall.

## Demo flow
```bash
rocketclaw2 session-create --title "Second Brain Demo"
rocketclaw2 session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates"
rocketclaw2 session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates during work hours"
rocketclaw2 dream --summary
rocketclaw2 dream-run --dry-run
rocketclaw2 remember
rocketclaw2 memory-list --summary
rocketclaw2 recall --query "WhatsApp updates"
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
