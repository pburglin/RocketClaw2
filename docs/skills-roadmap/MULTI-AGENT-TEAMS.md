# Multi-Agent Teams

## What it is
Multi-Agent Teams is RocketClaw2's built-in pattern for breaking complex work into specialist roles with explicit handoffs and review loops.

## Use it when
- the task naturally separates into planning, implementation, and review
- one agent doing everything would create prompt sprawl or weak quality control
- different specialists should own different artifacts or decisions
- you want visible handoffs instead of hidden internal chain-of-thought

## Avoid it when
- the task is small enough for one good pass
- extra coordination would cost more than it saves
- the task is too ambiguous to benefit from role boundaries yet

## Recommended starter roles
- **Product / PM** — clarify scope, acceptance criteria, and priorities
- **Architect** — design approach, interfaces, constraints, and risks
- **Implementer** — make the scoped change
- **Reviewer / QA** — validate against criteria and surface gaps

## Setup
Recommended prerequisites:
- a shared task definition
- clear ownership boundaries
- explicit acceptance criteria
- a review checkpoint before final merge or send

## Operator flow
1. define the shared goal
2. assign scoped briefs to each role
3. produce handoff artifacts between roles
4. run review/QA before final acceptance
5. summarize open risks and next actions

## Current RocketClaw2 fit
RocketClaw2 already has partial building blocks for this pattern:
- scoped role templates via `team-role-template`
- `team-role-template --from-handoff-id <handoff-id>` to derive role briefs from saved handoff context
- harness planning
- approval gates
- iteration history
- critic-style review feedback
- session and memory artifacts for handoff context

## Good defaults
- keep role scope narrow
- require explicit handoff outputs
- avoid having multiple agents modify the same artifact blindly
- always end with reviewer or QA validation

## Demo ideas
- PM creates acceptance criteria with `team-role-template`, implementer changes code, reviewer validates
- architect writes migration plan, implementer executes, QA checks results
