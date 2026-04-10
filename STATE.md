# RocketClaw2 State

## Objective
Create a Node.js successor to RocketClaw with modern runtime ergonomics, strong modularity, and production-friendly documentation.

## Current Status
- Project scaffold created.
- Initial audit of legacy RocketClaw started.
- TypeScript package bootstrap completed.
- Minimal CLI (`doctor`, `run`) and starter test are working.

## Decisions So Far
- Language: Node.js with TypeScript.
- Repo name: RocketClaw2.
- Delivery should include setup, usage, demos, Mermaid diagrams, screenshots, and GitHub publishing.

## Latest Validation
- `npm run build` ✅
- `npm test` ✅
- CLI/session/memory/operator docs updated to reflect the current implemented feature set ✅

## New Decisions
- RocketClaw2 will use local file-backed state/config first, with tiered memory as a core roadmap item.
- Memory optimization will follow a dreaming-inspired model: summarize, promote, prune, and re-index.

- Messaging interfaces will be plugin-based, with WhatsApp implemented first and other channels added later based on demand.
- Smart CLI/TUI is now a first-class roadmap item, not just a convenience feature.

- Persistent file-backed sessions are now part of the implementation baseline.

- A minimal interactive chat shell now exists and uses the persistent session layer.

- Basic retrieval over persisted sessions is now implemented as the first memory recall layer.
- Session retrieval now ranks exact and phrase matches highest, with token-overlap fallback for out-of-order lexical recall.

- A first-pass salience scorer and consolidation planner now exist as the beginning of executable dreaming behavior.

- Curated semantic memory storage now exists, and `remember` can promote high-salience candidates into it.

- Unified recall now spans both persisted sessions and curated semantic memory.
- Semantic recall now uses the same phrase-first and token-overlap lexical scoring approach as session retrieval.
- Unified recall now deduplicates identical cross-store hits, preferring the stronger or more curated result to reduce noisy memory output.
- Unified recall now applies a light diversity penalty so top results are less likely to be dominated by one session or one memory bucket.
- Session recall ranking now blends lexical match strength with message salience so durable user facts can outrank shallow matches.
- Recall ranking now includes a recency adjustment so newer relevant episodic details can outrank stale ones unless older memories are substantially stronger.
- Recall now uses different recency decay profiles for episodic session memory versus curated semantic memory, so long-term curated knowledge fades more gently.
- Recall scoring weights are now configurable through app config instead of being fully hardcoded.
- Recall now loads persisted scoring config from disk during normal runtime, so ranking behavior can be tuned without passing in-process overrides.
- The CLI now includes `recall-profile` so operators can inspect the active recall-scoring settings from persisted config.
- `doctor` runtime diagnostics now include the active recall-scoring profile, and setup docs include a concrete `config.yaml` tuning example.
- The CLI now includes `config-show` so operators can inspect the full resolved persisted app config, not just recall-specific diagnostics.
- The CLI now includes `recall-explain` for human-readable explanations of recall scoring fields and their effect on ranking behavior.
- The CLI now includes `recall-set` so operators can tune persisted recall scoring values by dot path without manually editing YAML.
- Recall tuning now exposes valid dot paths and returns clearer invalid-path errors, reducing guesswork when editing scoring values.
- Recall tuning now rejects obviously extreme values with lightweight numeric range guardrails before they can distort ranking behavior.
- Recall tuning error output now shows the allowed range and a suggestion when values are out of bounds.
- `recall-reset` command now lets operators restore one or all recall scoring fields to defaults without manual YAML editing.
- `recall-diff` command now shows delta between current recall scoring values and defaults, making tuned fields visible at a glance.

- Interactive chat now consults unified recall and can surface remembered context in replies.
- Interactive chat now treats explicit memory questions differently from normal chat, returning memory-focused answers instead of pure echo output.

- CLI operator ergonomics improved with human-readable session and memory inspection output.

- Operator CLI now includes session stats and title filtering for faster inspection workflows.

- RocketClaw2 now has a configurable core tool catalog and access policy model with safe defaults and risk posture descriptions.

- RocketClaw2 roadmap now explicitly incorporates advanced concepts from modern agent systems: episodic vs semantic memory, memory decay, vector retrieval, context resets/handoffs, parent-child orchestration, and closed-loop validation.

- Tool policies are now configurable through CLI commands, with explicit risk acknowledgement required for risky access overrides.

- WhatsApp integration now has explicit config, delivery mode selection, and default recipient support.

- RocketClaw2 now begins enforcing policy in runtime behavior, including WhatsApp enablement and tool access checks.

- Governance CLI now includes filtered tool-policy views and aggregate access summaries for operator inspection.

- Messaging governance/operator UX now includes a readable messaging summary command.

- RocketClaw2 now includes a governed tool execution flow (`tool-run`) that enforces policy and approval requirements.

- Recall inspection now supports filtered and summarized operator views for terminal workflows.

- Yolo mode now exists as an explicit risky override mode with warning logs and auto-approval behavior.

- RocketClaw2 now includes `system-summary` for unified operator inspection of runtime posture.

- Messaging send flow now supports default WhatsApp recipient fallback and human-readable send summaries.

- Semantic memory inspection now supports tag filtering, salience filtering, and summary output.

- RocketClaw2 now includes a governed messaging execution flow (`message-run`) with approval-aware behavior.

- Ralph loop support now exists for repeating a command until an explicit success condition is met.

- Ralph loop now supports validation-oriented presets and human-readable result summaries.

- RocketClaw2 now includes a persistent approval request workflow with list and resolve operations.

- Governed tool and messaging flows can now auto-create approval requests when approval is missing.

- Approval inspection now supports filtering by kind and summary output for operator workflows.

- Approval workflow now includes a helper that approves a request and returns the recommended next execution step.

- Approval queue views now include next-step hints for smoother operator workflows.

- Approval workflow now includes a pending-only actionable queue view.

- RocketClaw2 now includes a guided setup helper for onboarding and operator next steps.

- RocketClaw2 doctor now reports readiness across config, messaging, approvals, and governance posture.

- RocketClaw2 now includes a command for recommending operator next steps from current runtime posture.

- RocketClaw2 now includes `workspace-status` for a compact dashboard-like operator view.

- RocketClaw2 now supports session-scoped LLM URL/API key/model overrides from CLI parameters.

- RocketClaw2 now includes local skill management commands with persisted source URL metadata for imported skills.

- Skill inspection now supports source-aware filtering and aggregate summary output.

- Skill registry now tracks update count and last action for imported skills.

- Setup wizard now supports interactive questions for LLM and messaging access details, and config writing now explains where to place llm.apiKey.

- RocketClaw2 now includes a real LLM query command that uses configured or session-overridden LLM settings.

- llm-query now returns friendlier diagnostics for common auth/provider/config failures.

- RocketClaw2 now includes a lightweight LLM connectivity/auth test command (`llm-test`).

- RocketClaw2 now includes a compact LLM status command for readiness and override inspection.

- Chat now uses the configured LLM with recalled memory context when LLM access is available, and falls back only when no LLM is configured.

- Chat now handles Ctrl+C gracefully and exits with a clean message.

- RocketClaw2 now includes a first-class iterative task loop for LLM-guided development with validation retries.

- RocketClaw2 now includes an initial autonomous coding harness command with workspace/task/validation flow.

- Autonomous harness runs now write persistent artifacts for later inspection.

- RocketClaw2 now includes list/show commands for persisted autonomous harness runs.
- `harness-validate` now re-applies code blocks from a saved artifact and re-runs validation for offline re-verification.

- Autonomous harness runs are now workspace-aware: they read existing files before each iteration and support partial patch-style edits via stored LLM guidance.
- `harness-show` now supports `--full` for full artifact inspection.

- Per-iteration harness artifacts now track created/modified files, validation output, and LLM guidance for every loop iteration.

- Autonomous harness runs now include critic/self-reflection after validation failures, feeding root-cause hints into subsequent iterations.
- RocketClaw2 now includes `harness-plan`, a pre-execution review gate that saves a plan artifact without writing files.
- Approved harness plans can now be executed directly via `harness-run-plan --id <plan-id>`.
- Harness plans now carry explicit approval state (`draft` or `approved`), and operators can enforce approval before execution.
- Harness plan approvals can now be linked into the shared approval queue for unified operator review.
- Harness artifact inspection now supports filtering by artifact kind, approval state, and success/failure posture, plus compact summaries.
- `harness-show` now supports focused plan, guidance, and validation views instead of only raw artifact JSON.
- Operators can now inspect full step-by-step loop history with `harness-iterations --id <run-id>`.
- Iteration inspection now supports latest-only, failed-only, and per-iteration filtering for long harness runs.
- Iteration inspection can now optionally include stored guidance text, keeping default output compact while preserving detailed step context on demand.
- Harness artifacts now expose recommended operator next steps directly in list and focused views, including approve, run, resume, and re-validate actions.
- Harness inspection now exposes lineage between plans, executed runs, resumed runs, and approval requests.

- Full harness inspection now embeds per-iteration details directly in `harness-show --full` output.

- Harness inspection now includes first-class iteration-level views for latest-only, failed-only, specific-iteration, and guidance-inclusive inspection.

- RocketClaw2 now supports plan-gated harness execution via `harness-run-plan`, so approved plans can directly drive autonomous runs.

- Executed harness runs now carry explicit source-plan lineage, so inspection can show which approved plan drove a given autonomous run.

- `harness-run` now supports a strict `--require-approved-plan` mode that forces the governed plan -> approval -> execution path.

- RocketClaw2 now includes a local WhatsApp webhook listener and inbox persistence path for inbound events, not just outbound mock/webhook send configuration.
