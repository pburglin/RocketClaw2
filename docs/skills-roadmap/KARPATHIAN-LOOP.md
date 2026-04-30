# Karpathian Loop

## What it is
Karpathian Loop is RocketClaw2's built-in pattern for metric-driven improvement over time: run something, measure it, compare it to prior runs, then choose the next adjustment deliberately.

## Use it when
- one-shot validation is not enough to tell whether things are getting better
- you have telemetry, diagnostics, eval scores, or operator scorecards to compare
- the right next step depends on trends, not just the latest failure
- you want slower, more intentional improvement loops instead of blind retrying

## Avoid it when
- success is already binary and a validator can decide pass/fail
- there is no trustworthy signal to measure
- the loop would optimize vanity metrics instead of real outcomes
- you need immediate local repair rather than trend-based improvement

## Core signals
Useful Karpathian Loop signals in RocketClaw2 include:
- `telemetry` summaries and per-command performance
- `doctor` readiness warnings
- `next-actions` recommendations
- harness validation pass/fail history
- handoff-derived harness artifact volume, so delegated/team-launched work can be tracked over time
- operator-defined quality scorecards for plans, docs, or demos

## Current RocketClaw2 fit
RocketClaw2 already has several building blocks for this pattern:
- `telemetry`
- `doctor`
- `next-actions`
- harness artifacts and iteration history
- approval and governance checkpoints for high-risk changes

What is still emerging is deeper operator productization beyond the new scorecard surface — especially persistent baselines, explicit operator-written scorecards, and richer trend history.

## Operator flow
```bash
rocketclaw2 karpathian-loop --period 7
rocketclaw2 telemetry --period 7 --perf
rocketclaw2 doctor
rocketclaw2 next-actions
rocketclaw2 harness-list --summary
rocketclaw2 harness-iterations --id <run-id> --failed-only
```

`rocketclaw2 karpathian-loop` is the new first-class scorecard surface: it compares the current window against the previous one, highlights improving/regressing signals, and suggests the next focus area. It now also surfaces whether handoff-launched harness work is increasing or shrinking over time.

## Good defaults
- pick 1-3 metrics that matter before changing anything
- compare against a recent baseline, not an idealized future state
- make one meaningful change per loop when possible
- record what improved, regressed, and stayed unclear
- stop when the signal is noisy or the metric stops representing user value

## Demo ideas
- use telemetry + doctor output to choose the next CLI ergonomics fix
- compare harness failure patterns across runs before changing prompts or validation limits
- review operator scorecards for docs/demo quality before refining roadmap assets
