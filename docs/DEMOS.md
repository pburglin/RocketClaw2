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

## 7. Ralph Loop demo
```bash
node dist/src/cli.js ralph-loop --preset validate --max-iterations 5
node dist/src/cli.js ralph-loop --preset lint --max-iterations 5
node dist/src/cli.js ralph-loop --preset pack --max-iterations 3
node dist/src/cli.js ralph-loop --command "npm test" --until exit-0 --max-iterations 5
```

What this demonstrates:
- autonomous verify-and-fix loops
- preset-driven operator ergonomics
- common workflows for validate, lint, and release verification
- how RocketClaw2 can keep iterating until a validation condition is satisfied

## 8. Evaluator-Optimizer demo
```bash
node dist/src/cli.js auto-code --workspace . --task "Draft a small feature plan" --validate "npm run build" --max-iterations 5 --no-auto-approve
node dist/src/cli.js harness-show --id <plan-id> --plan
node dist/src/cli.js harness-approve --id <plan-id>
node dist/src/cli.js harness-run --id <plan-id> --require-approved-plan
node dist/src/cli.js harness-show --id <run-id> --full
node dist/src/cli.js harness-iterations --id <run-id> --latest --guidance
```

What this demonstrates:
- producer/evaluator style autonomous refinement
- using `auto-code` as the fast path to create a governed plan artifact
- explicit plan-review-run governance
- inspection of guidance, critic feedback, and validation outcomes
- a visible revise-after-critique workflow instead of opaque retries

## 9. Second Brain demo
```bash
node dist/src/cli.js session-create --title "Second Brain Demo"
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates"
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates during work hours"
node dist/src/cli.js dream --summary
node dist/src/cli.js dream-run --dry-run
node dist/src/cli.js remember
node dist/src/cli.js recall --query "WhatsApp updates"
node dist/src/cli.js memory-list --summary
```

What this demonstrates:
- ingesting personal context into episodic memory
- previewing consolidation candidates before promotion
- promotion into curated semantic memory
- practical personal-RAG style retrieval for future sessions

## 10. Multi-Agent Teams roadmap demo
```bash
node dist/src/cli.js auto-code --workspace . --task "Define acceptance criteria and implementation plan" --validate "npm run build" --max-iterations 5 --no-auto-approve
node dist/src/cli.js harness-show --id <plan-id> --plan
node dist/src/cli.js next-actions
node dist/src/cli.js workspace-status
```

What this demonstrates:
- the current operator-facing building blocks for specialist-role workflows
- using `auto-code` as the fast path to create a reviewable planning artifact
- runtime posture inspection before delegating work to future specialist agents

## 11. World Model roadmap demo
```bash
node dist/src/cli.js world-model
node dist/src/cli.js system-summary
node dist/src/cli.js next-actions
node dist/src/cli.js workspace-status
```

What this demonstrates:
- a first-class world-model snapshot for planning and handoff
- runtime posture inspection before taking action
- the base layer that future context-modeling workflows will build on

## 12. Karpathian Loop roadmap demo
```bash
node dist/src/cli.js telemetry
node dist/src/cli.js doctor
node dist/src/cli.js next-actions
```

What this demonstrates:
- metric- and diagnostics-driven improvement loops
- using system signals to decide what to improve next
- the foundation for future data-driven self-improvement workflows

## 13. RocketClaw2 continuous self-improvement demo
```bash
node dist/src/cli.js system-summary
node dist/src/cli.js workspace-status
node dist/src/cli.js next-actions
node dist/src/cli.js telemetry --period 7 --perf
node dist/src/cli.js auto-code --workspace . --task "Implement the next highest-value RocketClaw2 improvement" --validate "npm run build" --max-iterations 5 --no-auto-approve
node dist/src/cli.js harness-show --id <plan-id> --plan
node dist/src/cli.js harness-approve --id <plan-id>
node dist/src/cli.js harness-run --id <plan-id> --require-approved-plan
```

What this demonstrates:
- using World Model commands to orient before acting
- using Karpathian signals to choose the next improvement target
- using `auto-code` as the fast path to create a governed improvement plan
- continuing through explicit review/approval before execution
- treating RocketClaw2 itself as a system that can improve through its own skill patterns
