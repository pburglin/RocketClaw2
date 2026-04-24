# Built-in Skills Roadmap

RocketClaw2 v0.2.0 is expanding from a runtime shell into a guided operator platform with built-in skills for popular agentic patterns.

## Goals
- make advanced autonomy patterns usable without custom prompt engineering
- provide opinionated setup guidance and safe defaults
- teach operators when to use each pattern and when not to
- bundle demos so new users can try each pattern quickly

## Planned built-in skills

### 1. Ralph Loop
**Purpose:** verify-and-fix loops for code, configs, and operator tasks.

**Operator value:**
- repeat until build/test/validation passes
- make autonomous retries feel predictable instead of magical
- offer bounded self-correction with visible iteration counts

**Expected product surface:**
- presets for build, test, lint, docs, migration validation
- clear stop conditions
- iteration transcript and summary output

### 2. Karpathian Loop
**Purpose:** metric-driven iterative self-improvement based on observed outcomes.

**Operator value:**
- compare runs over time
- use telemetry, diagnostics, and eval scores to decide what to improve next
- support slower, deliberate improvement loops instead of one-shot retries

**Expected product surface:**
- run/eval/adjust cycle
- scorecards and change summaries
- prompts that explicitly ask what improved and what regressed

### 3. World Model
**Purpose:** maintain a structured model of user context, environment, constraints, and task state.

**Operator value:**
- improve planning quality
- reduce repeated re-explanation of goals and constraints
- give future agents a more stable representation of the situation they are working in

**Expected product surface:**
- explicit context cards
- environment + constraint summaries
- handoff artifacts for long-running work

### 4. Second Brain
**Purpose:** personal data ingestion, retrieval, summarization, and memory curation.

**Operator value:**
- turn notes, sessions, and personal facts into useful recall
- bridge episodic memory and curated durable memory
- create practical personal-RAG workflows for everyday use

**Expected product surface:**
- ingestion flows
- promotion/collapse/summarization flows
- retrieval demos around real personal context

### 5. Multi-Agent Teams
**Purpose:** coordinate specialized sub-agents with scoped roles and review loops.

**Operator value:**
- split complex work into smaller owned tracks
- reduce prompt sprawl by using role-specific briefs
- make handoffs and quality review explicit

**Expected product surface:**
- templates for PM / architect / implementer / reviewer roles
- scoped sub-agent briefs
- review-and-merge orchestration guidance

### 6. Evaluator-Optimizer
**Purpose:** pair generation with critique and refinement.

**Operator value:**
- improve quality for plans, code, docs, and messages
- avoid single-pass low-quality outputs
- create visible critique loops instead of silent retries

**Expected product surface:**
- producer/evaluator role split
- criteria-driven scoring
- revision history and final acceptance summary

## Current doc coverage
- `RALPH-LOOP.md`
- `SECOND-BRAIN.md`
- `SECOND-BRAIN-DEMO.md`
- `EVALUATOR-OPTIMIZER.md`
- `MULTI-AGENT-TEAMS.md`
- `WORLD-MODEL.md`
- `KARPATHIAN-LOOP.md`

## Current maturity snapshot

### Ralph Loop
- Runtime support: available now
- Roadmap/setup doc: yes
- Demo coverage: yes
- Suggested next step: add richer presets and operator-friendly reporting around common validation workflows

### Karpathian Loop
- Runtime support: partial building blocks only (`telemetry`, `doctor`, `next-actions`, harness history)
- Roadmap/setup doc: yes
- Demo coverage: yes (roadmap demo)
- Suggested next step: turn signals into a first-class compare/improve workflow with explicit scorecards

### World Model
- Runtime support: partial building blocks only (`system-summary`, `workspace-status`, `next-actions`, recall)
- Roadmap/setup doc: yes
- Demo coverage: yes (roadmap demo)
- Suggested next step: define a durable handoff/context artifact instead of relying on separate operator commands

### Second Brain
- Runtime support: available now across session memory, dreaming, promotion, and recall
- Roadmap/setup doc: yes
- Demo coverage: yes
- Suggested next step: add more guided onboarding so this feels like a product flow instead of a loose command set

### Multi-Agent Teams
- Runtime support: partial building blocks only (plans, approvals, harness inspection, specialist-role guidance)
- Roadmap/setup doc: yes
- Demo coverage: yes (roadmap demo)
- Suggested next step: add scoped role templates and clearer orchestration handoff artifacts

### Evaluator-Optimizer
- Runtime support: available in partial form via harness plan/critic/review loops
- Roadmap/setup doc: yes
- Demo coverage: yes
- Suggested next step: make evaluator criteria and revision summaries explicit instead of implicit in harness runs

## Recommended implementation order
1. Ralph Loop
2. Second Brain
3. Evaluator-Optimizer
4. Multi-Agent Teams
5. World Model
6. Karpathian Loop

This order favors patterns that already map onto existing RocketClaw2 capabilities.

## How to use these skills to continuously improve RocketClaw2 itself

Yes — this is one of the strongest uses of the v0.2.0 skill set.

A practical continuous-improvement loop for RocketClaw2 looks like this:

1. **World Model**
   - inspect current posture with `system-summary`, `workspace-status`, and `next-actions`
   - capture the active goal, blockers, and constraints before changing anything

2. **Karpathian Loop**
   - review `telemetry`, `doctor`, and recent harness failures
   - pick the next improvement target based on real signals, not hunches

3. **Multi-Agent Teams**
   - split the work into PM/architect/implementer/reviewer style responsibilities
   - keep role briefs small and explicit

4. **Evaluator-Optimizer**
   - generate a plan or implementation attempt
   - critique it against explicit acceptance criteria
   - revise before treating it as done

5. **Ralph Loop**
   - run bounded verify-and-fix loops for build/test/lint/docs gates
   - stop when validation passes or the loop stops teaching you anything useful

6. **Second Brain**
   - preserve durable lessons, repeated failure patterns, and operator preferences
   - promote insights that should shape future runs instead of relearning them every time

### Recommended operator cadence
- daily: World Model + Karpathian Loop to choose the next highest-value fix
- per change: Multi-Agent Teams + Evaluator-Optimizer for scoped execution and review
- before merge/release: Ralph Loop for validation
- periodically: Second Brain to retain lessons and prevent repeated mistakes

### What this should improve over time
- faster prioritization
- fewer blind retries
- clearer handoffs
- better auditability of why a change happened
- stronger reuse of lessons from prior runs

This is the difference between having a bag of agentic features and having an actual improvement system.

## Documentation standard for every built-in skill
Each skill should ship with:
- what it is for
- when to use it
- when not to use it
- setup requirements
- operator command flows
- safety/guardrails
- one quick demo
- one realistic end-to-end demo
