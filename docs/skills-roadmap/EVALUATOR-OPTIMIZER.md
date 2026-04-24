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
rocketclaw2 harness-show --id <plan-id> --plan
rocketclaw2 harness-approve --id <plan-id>
rocketclaw2 harness-run --id <plan-id> --require-approved-plan
rocketclaw2 harness-show --id <run-id> --full
```

Recommended posture:
- use `auto-code --no-auto-approve` as the fast path to create a reviewable artifact
- then continue through explicit inspection, approval, and execution
- fall back to raw `harness-plan` when you want lower-level control over the planning phase

## Current RocketClaw2 fit
Today, the closest implementation surface is the harness + critic flow:
- generate a plan or implementation attempt
- validate it
- inspect critic feedback
- iterate or resume with better guidance

## Good defaults
- define review criteria before generating output
- keep revision loops short and inspectable
- prefer explicit acceptance over silent retries

## Demo ideas
- auto-code plan artifact → critique → approve → execute for a feature implementation
- draft a message or doc, score it, then revise once before approval
