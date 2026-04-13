# Demos

## 1. First-run initialization
```bash
npm install
npm run build
npm test
node dist/src/cli.js doctor
node dist/src/cli.js init --profile default
```

What this demonstrates:
- TypeScript build and test baseline
- runtime diagnostics entrypoint
- local-first initialization flow

## 2. Persistent session workflow
```bash
node dist/src/cli.js session-create --title "Demo Session"
node dist/src/cli.js session-list
node dist/src/cli.js session-show --id <session-id>
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers WhatsApp updates"
node dist/src/cli.js session-stats
```

What this demonstrates:
- persistent file-backed sessions
- human-readable operator inspection
- aggregate stats for terminal workflows

## 3. Retrieval and semantic memory workflow
```bash
node dist/src/cli.js search --query WhatsApp
node dist/src/cli.js dream
node dist/src/cli.js dream-run --dry-run
node dist/src/cli.js dream-run
node dist/src/cli.js memory-list
node dist/src/cli.js recall --query WhatsApp
```

What this demonstrates:
- episodic search over saved session messages
- first-pass dreaming/consolidation planning
- dry-run preview before executing promotion loop
- execution of the full dreaming loop (promote salience >= 30 candidates)
- promotion into curated semantic memory
- unified recall across session and semantic memory

## 4. Interactive chat with memory-aware replies
```bash
node dist/src/cli.js chat --title "Interactive Demo"
```

Suggested prompt during the session:
- `Pedro prefers WhatsApp for updates`
- `What do you remember about messaging?`
- `/help` — show available commands
- `/mem` — show recalled memory for the last user message

What this demonstrates:
- colored readline UI with session branding banner
- live session persistence
- recall-assisted responses with memory context
- built-in commands for introspection
- a minimal but working runtime shell for future TUI evolution

## 5. WhatsApp native-session operator workflow
```bash
node dist/src/cli.js whatsapp-config --mode session --self-chat-only true
node dist/src/cli.js whatsapp-session --set-token demo-token --phone-number +15551234567
node dist/src/cli.js messaging-summary
node dist/src/cli.js workspace-status
node dist/src/cli.js doctor
node dist/src/cli.js next-actions
node dist/src/cli.js whatsapp-outbox
```

What this demonstrates:
- native-session bootstrap with self-chat-only posture
- automatic syncing of `ownPhoneNumber` from session bootstrap
- operator inspection of messaging safety and session readiness
- compact outbound native-session history inspection

## 6. Operator JSON mode
```bash
node dist/src/cli.js session-list --json
node dist/src/cli.js session-stats --json
node dist/src/cli.js memory-list --json
node dist/src/cli.js messaging-summary --json
node dist/src/cli.js workspace-status --json
```

What this demonstrates:
- scriptable inspection output
- parity between machine-readable and human-readable operator flows
- combined messaging config plus persisted session-state inspection
