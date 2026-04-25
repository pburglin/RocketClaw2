# Changelog

All notable changes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-24

### Added

#### Autonomous coding + LLM operator ergonomics
- `world-model` command and related roadmap/workflow documentation
- clearer LLM troubleshooting flows across README and usage docs
- better parsing for structured LLM response content and wrapped provider error payloads
- `auto-code` recovery steps for model/provider/auth/timeout-style failures
- live autonomous-coding progress updates for planning/execution phases
- periodic `AI is thinking... (<elapsed>s elapsed, press Ctrl+C to cancel)` feedback during slow model calls
- retry-budget visibility in `llm-status`, `system-summary`, and `world-model`, including CLI override awareness
- persisted handoff artifacts via `handoff-create`, `handoff-list`, and `handoff-show` for world-model-based planning and delegation
- handoff metadata for owner/notes plus optional linked harness and approval lineage
- handoff views now suggest concrete follow-up commands derived from linked approval/harness state
- role-aware handoff presets for PM, architect, implementer, and QA delegation flows
- first-class `team-role-template` command for scoped PM / architect / implementer / reviewer briefs
- aligned handoff preset vocabulary so `reviewer` now works alongside `qa`
- `team-role-template` can now derive a scoped brief directly from a saved handoff artifact
- harness planning/execution logs now show the same animated LLM wait state, use `AI is thinking...`, support optional `--timestamps`, and color/marker-code success vs error output more clearly
- verbose LLM inspection now preserves human-readable multiline prompt content instead of collapsing it into escaped `\\n` sequences
- autonomous-coding timeout recovery steps now favor more actionable override-based LLM checks
- `llm-query` and interactive `chat` now stream model text by default when supported, with global `--no-stream` to fall back to buffered output
- added `llm-stats` plus chat `/llm` to track session-friendly LLM performance metrics like successes, errors, response time, tokens/second, and tokens/response

### Changed
- default local harness validation timeout is now disabled unless `--validate-timeout-ms` is explicitly provided
- governed autonomous-coding guidance now consistently prefers `auto-code --no-auto-approve` before lower-level harness-plan flows
- recovery commands now include more copy/paste-ready LLM override flags

### Fixed
- misleading “no message content” failures for structured provider responses
- wrapped provider timeout payloads such as code `524` now surface as timeout diagnostics instead of generic content failures
- stricter harness and plan-gated guidance now better matches the preferred operator workflow

## [0.1.0] - 2026-04-13

### Added

#### Core Runtime
- TypeScript CLI scaffold with commander-based command structure
- Persistent file-backed state, config, and session management
- LLM status, test, and query commands with configurable auth
- Guided setup wizard with interactive LLM/messaging configuration

#### Governance (added)
- `approval-resolve-all --status` — bulk resolve all pending approvals
- `approval-purge --days N` — auto-purge pending approvals older than N days

#### Memory System
- Unified recall across episodic session memory and curated semantic memory
- Keyword-aware salience scoring with 7 high-value pattern categories
- Recency decay (24h half-life) for session messages
- Configurable recall scoring weights via `recall-set` / `recall-reset`
- `dream` command — build consolidation plan from persisted sessions
- `dream-run` command — execute full dreaming loop (promote salience ≥ 30 candidates)
- `remember` and `dream` preview and execution workflow
- Semantic memory storage with tag/salience filtering

#### Session Management
- Persistent file-backed sessions with create/append/list/show/stats
- Session-scoped LLM overrides via `--llm-base-url`, `--llm-api-key`, `--llm-model`
- Human-readable and JSON inspection modes for all session commands

#### Coding Harness
- Autonomous coding harness with workspace/task/validation flow
- Plan-gated execution (`harness-plan` → `harness-approve` → `harness-run-plan`)
- Per-iteration artifacts with file tracking, validation output, LLM guidance
- Critic/self-reflection after validation failures
- `harness-chain` lineage view across plans, runs, and resumes
- Strict `--require-approved-plan` mode for governed execution

#### Messaging (WhatsApp)
- Native WhatsApp transport with QR-based authorization bootstrap
- Inbound receive loop with session bridging and action dispatch
- Self-chat-only policy enforced on both inbound and outbound traffic
- Local WhatsApp session profile persistence (`whatsapp-session`)
- Native outbox inspection (`whatsapp-outbox`)
- `messaging-summary` with native-session safety posture

#### Governance
- Configurable tool catalog with safe defaults and risk posture descriptions
- Persistent tool policy editing with explicit `--ack-risk` acknowledgement
- Governed tool execution flow (`tool-run`) with policy and approval checks
- Yolo mode for explicit risky override with warning logs
- Persistent approval request workflow with list/resolve/approve-and-continue
- Approval queue with next-step hints and pending-only view

#### Operator UX
- `doctor` — runtime diagnostics across config, messaging, approvals, governance
- `next-actions` — runtime-aware operator next-step recommendations
- `workspace-status` — compact dashboard of runtime state
- `system-summary` — unified operator posture view
- `recall-explain` / `recall-diff` / `recall-profile` — recall scoring inspection tools
- Session stats with title filtering
- Colored chat UI with session banner, `/help`, `/mem` commands

### Changed
- Build now clears `dist/` before recompilation to prevent stale artifacts
- TypeScript config split: production builds only `src/**`, full typecheck includes tests
- Package manifest narrowed to `dist/src/**` + docs, excluding tests from published tarball

### Fixed
- `scoreMessageSalience` export missing from `salience.ts` (was called but not exported)
- Duplicate `getRecencyWeight` declaration in `salience.ts`
- Session recall salience scoring calibrated to not swamp semantic entries in dedup logic

### Security
- Session-mode WhatsApp traffic enforces self-chat-only by default
- Risky tool access overrides require explicit `--ack-risk` acknowledgement
- Yolo mode logs warnings before auto-approving governed actions

### Infrastructure
- GitHub Actions CI: install → lint → build → build verification → tests → pack verification
- `prepack` and `prepublishOnly` guards prevent bypassing build verification
- Tag-triggered release workflow with npm publish (requires `NPM_TOKEN`)