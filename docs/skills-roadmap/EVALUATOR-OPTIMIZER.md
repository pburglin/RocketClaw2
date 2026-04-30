# Evaluator-Optimizer

## What it is
Evaluator-Optimizer is RocketClaw2's built-in pattern for pairing generation with critique and revision.

## Use it when
- one-pass output quality is too inconsistent
- you can describe explicit scoring criteria
- refinement is safer than immediate autonomous execution
- you want a visible quality loop for plans, code, docs, or messages

## Avoid it when
- success is binary and already covered by a simple validator
- critique cost is higher than the value of refinement
- the task is urgent and low-risk enough for single-pass output

## Setup
Recommended prerequisites:
- clear scoring criteria
- a reviewable artifact or candidate output
- a bounded revision loop
- an inspection command for operator review

## Operator flow
```bash
rocketclaw2 auto-code --workspace . --task "Draft a feature plan" --validate "npm run build" --max-iterations 5 --no-auto-approve
rocketclaw2 evaluator-optimizer --id <plan-id> --criterion "Plan is reviewable and approved"
rocketclaw2 harness-approve --id <plan-id>
rocketclaw2 harness-run --id <plan-id> --require-approved-plan
rocketclaw2 evaluator-optimizer --id <run-id> --criterion "Validation passes cleanly" --criterion "No unresolved critic insight remains"
```

Recommended posture:
- use `auto-code --no-auto-approve` as the fast path to create a reviewable artifact
- then continue through explicit inspection, approval, and execution
- persist evaluator outcomes with `--decision accepted|rejected|needs-review` when the judgment should remain attached to the artifact
- persisted evaluator history now snapshots source handoff lineage too, so later review can still see which delegated workflow produced the artifact
- fall back to raw `harness-plan` when you want lower-level control over the planning phase

## Current RocketClaw2 fit
RocketClaw2 now has a first-class evaluator summary surface on top of the harness + critic flow:
- generate a plan or implementation attempt
- evaluate it against explicit criteria with `evaluator-optimizer`
- inspect critic feedback, revision history, and any source handoff lineage that launched the artifact
- iterate or resume with better guidance

## Good defaults
- define review criteria before generating output
- keep revision loops short and inspectable
- prefer explicit acceptance over silent retries
- use `evaluator-optimizer --json` when you want to feed evaluation state into another tool or wrapper
- use the included source handoff lineage fields to connect evaluator output back to the team/workflow seed that started the work
- use `--decision` plus `--note` when the evaluation itself is an important durable review artifact

## Demo ideas
- auto-code plan artifact → critique → approve → execute for a feature implementation
- draft a message or doc, score it, then revise once before approval
