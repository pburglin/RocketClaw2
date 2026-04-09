# Demos

## 1. First-run initialization
```bash
npm install
npm run build
npm test
node dist/cli.js doctor
node dist/cli.js init --profile default
```

What this demonstrates:
- TypeScript build and test baseline
- runtime diagnostics entrypoint
- local-first initialization flow

## 2. Persistent session workflow
```bash
node dist/cli.js session-create --title "Demo Session"
node dist/cli.js session-list
node dist/cli.js session-show --id <session-id>
node dist/cli.js session-append --id <session-id> --role user --text "Pedro prefers WhatsApp updates"
node dist/cli.js session-stats
```

What this demonstrates:
- persistent file-backed sessions
- human-readable operator inspection
- aggregate stats for terminal workflows

## 3. Retrieval and semantic memory workflow
```bash
node dist/cli.js search --query WhatsApp
node dist/cli.js dream
node dist/cli.js remember
node dist/cli.js memory-list
node dist/cli.js recall --query WhatsApp
```

What this demonstrates:
- episodic search over saved session messages
- first-pass dreaming/consolidation planning
- promotion into curated semantic memory
- unified recall across session and semantic memory

## 4. Interactive chat with memory-aware replies
```bash
node dist/cli.js chat --title "Interactive Demo"
```

Suggested prompt during the session:
- `Pedro prefers WhatsApp for updates`
- `What do you remember about messaging?`

What this demonstrates:
- live session persistence
- recall-assisted responses
- a minimal but working runtime shell for future TUI evolution

## 5. Operator JSON mode
```bash
node dist/cli.js session-list --json
node dist/cli.js session-stats --json
node dist/cli.js memory-list --json
```

What this demonstrates:
- scriptable inspection output
- parity between machine-readable and human-readable operator flows
