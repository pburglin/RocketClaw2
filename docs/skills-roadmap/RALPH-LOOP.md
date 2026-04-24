# Ralph Loop

## What it is
Ralph Loop is RocketClaw2's built-in verify-and-fix workflow for bounded autonomous iteration.

## Use it when
- a task has a clear validation command
- success can be measured repeatedly
- retrying with feedback is likely to work
- you want transparent autonomy with visible iteration limits

## Avoid it when
- there is no reliable validator
- the action is destructive or externally irreversible
- each retry is expensive or dangerous
- the task needs strategic redesign instead of local fixes

## Setup
Recommended prerequisites:
- working LLM configuration
- a stable validation command
- explicit max iteration count
- artifact capture enabled for inspection

## Operator flow
```bash
rocketclaw2 ralph-loop --preset validate --max-iterations 5
rocketclaw2 ralph-loop --preset lint --max-iterations 5
rocketclaw2 ralph-loop --preset pack --max-iterations 3
rocketclaw2 ralph-loop --command "npm test" --until exit-0 --max-iterations 5
```

## Current preset roadmap
- `validate` → repeat until tests pass
- `build` → repeat until project build passes
- `lint` → repeat until lint/typecheck passes
- `docs` → repeat until the documentation quality gate passes
- `pack` → repeat until package verification passes

## Good defaults
- keep validation commands fast
- prefer small iteration caps first
- inspect failure summaries before raising limits
- use `pack` near release time, not for every inner-loop edit

## Demo ideas
- fix a failing test loop
- repeatedly validate docs/build output until clean
