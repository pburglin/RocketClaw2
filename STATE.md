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
- `session-show` now supports compact overview mode and adjustable transcript length, so longer sessions can be inspected without dumping the default last-10 transcript every time.
- `workspace-status` now surfaces richer operator signals, including WhatsApp mode/default recipient/session activity plus total message count and latest session update.
- `next-actions` is now runtime-aware, surfacing operational gaps like missing WhatsApp session bootstrap in session mode and the lack of any created sessions, not just static config warnings.
- `doctor` now includes runtime readiness checks for WhatsApp session bootstrap and real session activity, so it can flag incomplete setup beyond static config validity.

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
- `harness-chain` now provides a consolidated operator view of a root artifact, its related plan, and recursive resume descendants.
- Chain views now include per-node iteration counts and latest pass/fail summaries for quicker health inspection.
- `harness-chain` now surfaces latest stderr/stdout and critic hints per node, so failure cause is visible without a separate iteration inspection call.
- `harness-chain --summary` now provides a compact overview for quick operator scanning.
- Chain views now include direct drill-down commands for root, plan, and resume nodes so operators can jump straight into focused inspection.

- Full harness inspection now embeds per-iteration details directly in `harness-show --full` output.

- Harness inspection now includes first-class iteration-level views for latest-only, failed-only, specific-iteration, and guidance-inclusive inspection.

- RocketClaw2 now supports plan-gated harness execution via `harness-run-plan`, so approved plans can directly drive autonomous runs.

- Executed harness runs now carry explicit source-plan lineage, so inspection can show which approved plan drove a given autonomous run.

- `harness-run` now supports a strict `--require-approved-plan` mode that forces the governed plan -> approval -> execution path.

- RocketClaw2 now includes a local WhatsApp webhook listener and inbox persistence path for inbound events, not just outbound mock/webhook send configuration.

- Inbound WhatsApp events now automatically bridge into persistent sessions, creating or reusing `WhatsApp <sender>` session records and appending user messages.

- Inbound WhatsApp messages can now trigger a first safe action surface, including workspace status and next-actions dispatch.

- Inbound WhatsApp commands now support an end-to-end action-response loop, including automatic outbound replies through the configured WhatsApp plugin.

- `harness-run` now emits concise live progress milestones during execution, including iteration start, guidance retrieval, file application, validation start, and validation result.

- Harness validation now uses a timeout by default, preventing long-running commands like dev servers from wedging the CLI indefinitely.

- RocketClaw2 now includes a persisted local WhatsApp session profile model, allowing local token/session bootstrap storage as a stepping stone toward fuller native integration.
- WhatsApp session inspection now has a readable operator view with masked token and last-used timestamp, and session-mode sends now update persisted `lastUsedAt` state so runtime activity is visible.
- Inbound WhatsApp dispatch now supports `doctor`, `sessions`, `session <id-or-title>`, `approvals`, `memory`, `tools`, and `help` in addition to status/next-actions, and the dispatcher now evaluates commands against the active runtime root so chat replies reflect the correct local state.
- WhatsApp session-mode sends now flow through the native-session transport helper instead of returning a plain synthetic echo detail, making session transport behavior more realistic while still local and file-backed.
- Native-session sends now persist to a local WhatsApp native outbox, giving session-mode transport an inspectable outbound history trail.
- The CLI now exposes that transport history with `whatsapp-outbox`, so outbound native-session behavior can be inspected without reading raw state files.
- Session-mode WhatsApp sends now enforce self-chat-only policy by default on outbound traffic too, with explicit config override required for external recipients.
- `whatsapp-config` and the config helper now expose `selfChatOnly` and `ownPhoneNumber`, so native-session enforcement and identity can be configured through first-class operator flows.
- Governed messaging approval creation now respects the provided runtime root, so approval artifacts no longer leak into the default global state when RocketClaw2 is exercised from alternate roots.
- Messaging summary output now surfaces native-session safety posture, including self-chat-only mode and configured own phone number, so operators can verify WhatsApp enforcement settings at a glance.
- `messaging-summary --json` now includes `sessionState.whatsapp`, bringing machine-readable operator output up to parity with the human-readable session-readiness view.
- `workspace-status` now also surfaces WhatsApp self-chat-only mode and configured own phone number, keeping the top-level dashboard aligned with the newer native-session safety model.
- `doctor` and `next-actions` now explicitly flag missing `ownPhoneNumber` when self-chat-only WhatsApp session mode is enabled, closing an underconfiguration gap in native-session readiness guidance.
- WhatsApp chat dispatch now includes a `messaging` command that returns the same human-readable messaging summary and safety posture operators can already inspect from the CLI.
- `whatsapp-session --set-token --phone-number ...` now also syncs `messaging.whatsapp.ownPhoneNumber`, reducing duplicate setup steps for self-chat-only native session mode.
- The QR authorization bootstrap path now mirrors that behavior, syncing `ownPhoneNumber` into config when a phone number is provided during authorization.
- Demo docs now include a first-class WhatsApp native-session/operator workflow, covering bootstrap, safety posture inspection, readiness checks, and native outbox inspection.
- The QR bootstrap CLI now explicitly reports when authorization also synced `ownPhoneNumber` into config, matching the direct session bootstrap UX.
- Build hygiene now clears `dist/` before TypeScript compilation so stale legacy CLI artifacts do not shadow the real `dist/src/cli.js` entrypoint, and demo docs now use the canonical built path.
- Release verification now includes a dedicated `verify:build` script that checks the published bin target, confirms stale `dist/cli.js` is absent, and asserts the built CLI help still exposes key modern commands.
- Packaging workflows now enforce that safeguard automatically through `prepack`, so `npm pack` and publish-style flows cannot bypass build verification.
- GitHub Actions CI now enforces the same core quality gate on every push and pull request by running install, lint, build, build verification, tests, and packed-artifact verification on Node 22.
- The npm package manifest now explicitly whitelists built artifacts and docs, and `verify:pack` checks that the dry-run tarball includes the canonical CLI while excluding raw `src/` and `tests/` trees.
- CI now also creates the packed `.tgz` artifact and uploads it, making the exact publishable package inspectable from every run instead of relying only on log output.
- Package whitelisting is now narrowed to `dist/src/**` plus docs, and pack verification rejects compiled test output like `dist/tests/**` so the published tarball stays runtime-only.
- TypeScript config is now split so production builds compile only `src/**` via `tsconfig.build.json`, while full-project typechecking still covers tests through the main `tsconfig.json`.
- Publish-time protection now includes a `prepublishOnly` guard that re-runs build and tarball verification, so future npm publish flows cannot bypass the packaging checks.
- RocketClaw2 now includes a dedicated tag-triggered release workflow that re-runs the full quality gate, uploads the verified package artifact, and only attempts npm publish when `NPM_TOKEN` is configured.

- RocketClaw2 now includes a simple QR-based WhatsApp authorization bootstrap flow for local session setup.

- WhatsApp `session` mode now requires a persisted local session profile and no longer silently behaves like mock transport.

- RocketClaw2 now includes a native WhatsApp transport foundation layer with runtime session readiness checks, self-chat-only default filtering, and a native-session send abstraction.
- Native WhatsApp transport is now being developed as an explicit subsystem with staged subtasks: transport interface, QR/session auth, inbound receive loop, self-chat-only filtering, outbound native send/reply, and docs/tests/packaging hardening.

- RocketClaw2 now includes a native WhatsApp inbound receive processor that enforces self-chat-only policy before session bridging and action dispatch.

- When WhatsApp is in `session` mode, the inbound listener now routes events through the native inbound processor by default, enforcing self-chat-only policy before session bridge/dispatch.
