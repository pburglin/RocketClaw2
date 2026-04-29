# Demos

## 1. First-run initialization
```bash
npm install
npm run build
npm test
rocketclaw2 doctor
rocketclaw2 init --profile default
```

What this demonstrates:
- TypeScript build and test baseline
- runtime diagnostics entrypoint
- local-first initialization flow

## 2. Persistent session workflow
```bash
rocketclaw2 session-create --title "Demo Session"
rocketclaw2 session-list
rocketclaw2 session-show --id <session-id>
rocketclaw2 session-append --id <session-id> --role user --text "Pedro prefers WhatsApp updates"
rocketclaw2 session-stats
```

What this demonstrates:
- persistent file-backed sessions
- human-readable operator inspection
- aggregate stats for terminal workflows

## 3. Retrieval and semantic memory workflow
```bash
rocketclaw2 search --query WhatsApp
rocketclaw2 dream
rocketclaw2 dream-run --dry-run
rocketclaw2 dream-run
rocketclaw2 memory-list
rocketclaw2 recall --query WhatsApp
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
rocketclaw2 chat --title "Interactive Demo"
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
rocketclaw2 whatsapp-config --mode session --self-chat-only true
rocketclaw2 whatsapp-session --set-token demo-token --phone-number +15551234567
rocketclaw2 messaging-summary
rocketclaw2 workspace-status
rocketclaw2 doctor
rocketclaw2 next-actions
rocketclaw2 whatsapp-outbox
```

What this demonstrates:
- native-session bootstrap with self-chat-only posture
- automatic syncing of `ownPhoneNumber` from session bootstrap
- operator inspection of messaging safety and session readiness
- compact outbound native-session history inspection

## 6. Operator JSON mode
```bash
rocketclaw2 session-list --json
rocketclaw2 session-stats --json
rocketclaw2 memory-list --json
rocketclaw2 messaging-summary --json
rocketclaw2 workspace-status --json
```

What this demonstrates:
- scriptable inspection output
- parity between machine-readable and human-readable operator flows
- combined messaging config plus persisted session-state inspection

## 7. Ralph Loop demo
```bash
rocketclaw2 ralph-loop --preset validate --max-iterations 5
rocketclaw2 ralph-loop --preset lint --max-iterations 5
rocketclaw2 ralph-loop --preset pack --max-iterations 3
rocketclaw2 ralph-loop --command "npm test" --until exit-0 --max-iterations 5
```

What this demonstrates:
- autonomous verify-and-fix loops
- preset-driven operator ergonomics
- common workflows for validate, lint, and release verification
- how RocketClaw2 can keep iterating until a validation condition is satisfied

## 8. Evaluator-Optimizer demo
```bash
rocketclaw2 auto-code --workspace . --task "Draft a small feature plan" --validate "npm run build" --max-iterations 5 --no-auto-approve
rocketclaw2 harness-show --id <plan-id> --plan
rocketclaw2 harness-approve --id <plan-id>
rocketclaw2 harness-run --id <plan-id> --require-approved-plan
rocketclaw2 harness-show --id <run-id> --full
rocketclaw2 harness-iterations --id <run-id> --latest --guidance
```

What this demonstrates:
- producer/evaluator style autonomous refinement
- using `auto-code` as the fast path to create a governed plan artifact
- explicit plan-review-run governance
- inspection of guidance, critic feedback, and validation outcomes
- a visible revise-after-critique workflow instead of opaque retries

## 9. Second Brain demo
```bash
rocketclaw2 session-create --title "Second Brain Demo"
rocketclaw2 session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates"
rocketclaw2 session-append --id <session-id> --role user --text "Pedro prefers short WhatsApp updates during work hours"
rocketclaw2 dream --summary
rocketclaw2 dream-run --dry-run
rocketclaw2 remember
rocketclaw2 recall --query "WhatsApp updates"
rocketclaw2 memory-list --summary
```

What this demonstrates:
- ingesting personal context into episodic memory
- previewing consolidation candidates before promotion
- promotion into curated semantic memory
- practical personal-RAG style retrieval for future sessions

## 10. Multi-Agent Teams roadmap demo
```bash
rocketclaw2 team-role-template --role pm --goal "Define acceptance criteria and implementation plan"
rocketclaw2 team-role-template --role architect --goal "Design the implementation approach"
rocketclaw2 team-role-template --role reviewer --from-handoff-id <handoff-id>
rocketclaw2 auto-code --workspace . --task "Define acceptance criteria and implementation plan" --validate "npm run build" --max-iterations 5 --no-auto-approve
rocketclaw2 harness-show --id <plan-id> --plan
rocketclaw2 next-actions
rocketclaw2 workspace-status
```

What this demonstrates:
- first-class scoped brief templates for specialist-role workflows
- ability to turn a saved handoff directly into a reviewer/QA brief
- using `auto-code` as the fast path to create a reviewable planning artifact
- runtime posture inspection before delegating work to future specialist agents

## 11. World Model roadmap demo
```bash
rocketclaw2 world-model
rocketclaw2 handoff-create --preset qa --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-create --preset reviewer --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-create --owner qa --notes "Verify before merge" --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-list
rocketclaw2 handoff-show --id <handoff-id>
rocketclaw2 system-summary
rocketclaw2 next-actions
rocketclaw2 workspace-status
```

What this demonstrates:
- a first-class world-model snapshot for planning and handoff
- persisted handoff artifacts for later review or delegation
- role-aware PM / architect / implementer / QA handoff presets for faster delegation
- explicit owner/notes/linked-artifact context for cleaner multi-step handoffs
- runtime posture inspection before taking action
- the base layer that future context-modeling workflows will build on

## 12. Karpathian Loop roadmap demo
```bash
rocketclaw2 telemetry
rocketclaw2 doctor
rocketclaw2 next-actions
```

What this demonstrates:
- metric- and diagnostics-driven improvement loops
- using system signals to decide what to improve next
- the foundation for future data-driven self-improvement workflows

## 13. RocketClaw2 continuous self-improvement demo
```bash
rocketclaw2 system-summary
rocketclaw2 workspace-status
rocketclaw2 next-actions
rocketclaw2 telemetry --period 7 --perf
rocketclaw2 auto-code --workspace . --task "Implement the next highest-value RocketClaw2 improvement" --validate "npm run build" --max-iterations 5 --no-auto-approve
rocketclaw2 harness-show --id <plan-id> --plan
rocketclaw2 harness-approve --id <plan-id>
rocketclaw2 harness-run --id <plan-id> --require-approved-plan
```

What this demonstrates:
- using World Model commands to orient before acting
- using Karpathian signals to choose the next improvement target
- using `auto-code` as the fast path to create a governed improvement plan
- continuing through explicit review/approval before execution
- treating RocketClaw2 itself as a system that can improve through its own skill patterns
