# World Model

## What it is
World Model is RocketClaw2's built-in pattern for maintaining an explicit picture of the current situation: user goals, environment state, constraints, risks, and likely next actions.

## Use it when
- the task spans multiple steps or sessions
- the runtime needs situational awareness before acting
- constraints and environment state materially affect decisions
- handoffs or planning quality matter more than speed alone

## Avoid it when
- the task is a tiny one-shot action
- there is no meaningful environment state to track
- maintaining structured context would cost more than it helps

## Core artifacts
A useful RocketClaw2 world model should capture:
- active goal
- current environment posture
- important constraints
- known risks or blockers
- recommended next actions
- relevant memory or session context

## Current RocketClaw2 fit
RocketClaw2 now has a first world-model snapshot command plus persisted handoff artifacts and the underlying building blocks:
- `world-model`
- `handoff-create`
- `handoff-list`
- `handoff-show`
- `system-summary`
- `workspace-status`
- `next-actions`
- session memory and semantic memory
- approval and governance state

## Operator flow
```bash
rocketclaw2 world-model
rocketclaw2 handoff-create --preset qa --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-create --preset reviewer --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-create --owner qa --notes "Verify before merge" --related-harness-id <run-id> --related-approval-id <approval-id>
rocketclaw2 handoff-list
rocketclaw2 handoff-show --id <handoff-id>
rocketclaw2 system-summary
rocketclaw2 workspace-status
rocketclaw2 next-actions
rocketclaw2 recall --query "current priorities"
```

## Good defaults
- refresh posture before major actions
- separate stable constraints from temporary blockers
- keep next actions short and specific
- use the world model to improve handoffs, not to generate busywork
- use role-aware presets when you want a quick PM / architect / implementer / QA handoff scaffold
- add owner/notes/linked artifacts when the handoff needs to survive delegation across people or runs

## Demo ideas
- inspect runtime posture before launching a complex workflow
- build a concise state snapshot before handing work to specialist agents
- use `world-model` as the default handoff artifact before a multi-step roadmap change
