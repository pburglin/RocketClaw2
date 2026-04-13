# Changelog

All notable changes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-13

### Added

#### Core Runtime
- TypeScript CLI scaffold with commander-based command structure
- Persistent file-backed state, config, and session management
- LLM status, test, and query commands with configurable auth
- Guided setup wizard with interactive LLM/messaging configuration

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