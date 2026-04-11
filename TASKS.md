# RocketClaw2 Tasks

## In Progress
- Build interactive runtime, retrieval, and memory workflows on top of the TypeScript foundation.
- Expand messaging plugins and channel integrations, starting with WhatsApp.
- Keep docs, demos, diagrams, and roadmap aligned with shipped functionality.
- Build a native WhatsApp transport subsystem with self-chat-only default behavior.

### Native WhatsApp Transport Subtasks
1. Transport interface + native WhatsApp runtime module
2. QR pairing/login and credential/session persistence
3. Inbound message subscription / receive loop
4. Self-chat-only filter by default
5. Outbound send and reply through the native session
6. Docs, tests, and packaging/release validation

## Next
- Improve retrieval quality with salience scoring and semantic summaries.
- Add dreaming-style consolidation jobs for episodic-to-semantic memory promotion.
- Evolve chat into a smarter terminal UI/TUI experience.
- Add setup wizard, diagnostics, and demo assets.
- Create GitHub repo and push initial implementation.

## Later
- Expand adapters, richer runtime behaviors, and testing matrix.
- Add more channels only if there is real user demand.

## Roadmap Ideas
- Tiered persistent memory with episodic and semantic stores
- Dreaming-style background consolidation and pruning
- Salience scoring for retrieval optimization
- Scheduled memory maintenance jobs
- Plugin-based messaging with WhatsApp first, future Slack/Discord/iMessage if needed
- Smart CLI and terminal UI roadmap with future multi-channel support
- Retrieval and recall workflows over persisted sessions

- Add salience scoring and a first-pass consolidation planner for dreaming-style memory optimization.

- Add curated semantic memory storage and a first promotion flow from consolidation candidates.

- Add unified recall across both episodic session memory and curated semantic memory.

- Feed recalled semantic and episodic memory back into the interactive chat/runtime flow.

- Improve CLI operator ergonomics with human-readable inspection views before a full TUI.

- Add lightweight filtering and aggregate session stats to improve terminal operator workflows.

- Build configurable tool catalog and access policy model with safe defaults and explicit override posture.

- Add memory decay strategy so stale episodic details lose salience unless reinforced.
- Add handoff artifact generation for context resets and long-running work.
- Add plan mode artifacts for implementation tasks.
- Add sub-agent orchestration briefs with least-privilege context isolation.
- Add closed-loop quality gates and critic/self-reflection fix loops.
- Add vector retrieval / embedding compaction in a future memory phase.
- Add heartbeat-style background verification workflows.

- Add persistent tool policy editing commands with explicit acknowledgement for risky overrides.

- Add explicit WhatsApp integration configuration and delivery modes as the first concrete channel path.

- Enforce configured governance in runtime behavior, not just config metadata.

- Improve governance ergonomics with filtered policy inspection and aggregate summaries.

- Add a config inspection command so operators can view the resolved persisted runtime configuration.

- Add messaging integration summaries for operator inspection.

- Add governed tool execution flow so runtime actions are checked against policy and approval requirements.

- Improve recall inspection with filtered and summarized operator views.

- Add explicit yolo mode with warnings and auto-approval behavior for users who intentionally opt into riskier execution.

- Add a unified system/operator summary command for quick runtime posture inspection.

- Add default WhatsApp recipient fallback and cleaner send-result operator UX.

- Improve semantic memory inspection with filters and summary views.

- Add governed messaging execution flow so channel sends can follow explicit approval semantics.

- Add Ralph loop support so RocketClaw2 can repeat work until validation or a user-provided condition succeeds.

- Add validation-oriented Ralph loop presets and better loop result summaries.

- Add a persistent approval request workflow for richer human-in-the-loop execution paths.

- Auto-create approval requests from governed runtime flows when approval is required but not supplied.

- Improve approval queue inspection with filters and aggregate summaries.

- Add approval-aware execution helpers so operators can move from approval to rerun more smoothly.

- Add next-step hints directly into approval queue views for better operator flow.

- Add an actionable pending-approval view for faster operator review.

- Add a guided setup helper to improve first-run and operator onboarding.

- Expand doctor into a more useful readiness diagnostic for config, messaging, approvals, and governance posture.

- Add a command that turns current runtime posture into recommended operator next steps.

- Add a compact workspace status command that summarizes runtime state in one place.

- Support session-scoped LLM URL/API key/model overrides from CLI parameters.

- Add local skill management commands for import/list/update/remove with persisted source URL metadata.

- Improve skill inspection with source-aware filtering and aggregate summaries.

- Improve skill update reporting with metadata like last action and update count.

- Improve setup wizard with interactive questions for LLM and messaging access details.

- Add a real LLM query command using configured or session-overridden LLM access details.

- Improve llm-query failure diagnostics for auth, endpoint, and model mismatch cases.

- Add a lightweight LLM connectivity/auth test command separate from full prompt execution.

- Add a compact LLM status command that shows readiness and session override state.

- Make chat use the configured LLM with recalled memory context, with fallback behavior only when no LLM is configured.

- Polish chat UX so Ctrl+C exits cleanly without a raw stack trace.

- Add a first-class iterative task loop for LLM-guided development with validation retries.

- Add an autonomous coding harness command with workspace selection, LLM guidance, validation, and result reporting.

- Add persistent run artifacts for autonomous harness executions so runs are auditable and resumable.

- Add list/show commands for persisted autonomous harness runs.
- Add `recall-reset` so operators can restore recall scoring fields to defaults without manual YAML editing.

- Add workspace-aware prompting and partial patch support for autonomous harness runs.
- Add full artifact inspection mode for persisted harness runs.

- Add per-iteration artifacts for full autonomous harness auditing.

- Add critic/self-reflection support so autonomous harness iterations can react to validation failures more intelligently.

- Improve harness inspection so a single run view includes per-iteration details.

- Improve harness operator UX with iteration-focused inspection views.

- Add explicit plan-gated execution so approved plans can be run directly as autonomous coding runs.

- Preserve source-plan lineage in executed harness run artifacts and views.

- Add strict execution mode that enforces approved-plan execution for autonomous harness runs.

- Add real inbound WhatsApp listener/runtime support instead of mock-only integration posture.

- Bridge inbound WhatsApp events into persistent sessions so messages can drive runtime behavior.

- Add inbound WhatsApp action dispatch so messages can trigger runtime actions/events.

- Add outbound auto-reply for dispatched inbound WhatsApp actions.

- Improve harness UX with live progress milestones during iterations.

- Guard harness validation against long-running commands that would otherwise hang the CLI.

- Add a simple persisted WhatsApp session/bootstrap model as a stepping stone toward fuller native integration.

- Add QR-based WhatsApp authorization bootstrap for local session setup.

- Make WhatsApp session mode use real persisted runtime state instead of mock-like fallback behavior.

- Add native WhatsApp transport foundation with self-chat-only default policy.

- Add native inbound receive loop with self-chat-only enforcement before session bridge/dispatch.
