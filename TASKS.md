# RocketClaw2 Tasks

## In Progress
- Build interactive runtime, retrieval, and memory workflows on top of the TypeScript foundation.
- Expand messaging plugins and channel integrations, starting with WhatsApp.
- Keep docs, demos, diagrams, and roadmap aligned with shipped functionality.
- Build a native WhatsApp transport subsystem with self-chat-only default behavior. ✅ COMPLETE

### Native WhatsApp Transport Subtasks ✅ (All Complete)
1. Transport interface + native WhatsApp runtime module ✅
2. QR pairing/login and credential/session persistence ✅
3. Inbound message subscription / receive loop ✅
4. Self-chat-only filter by default ✅
5. Outbound send and reply through the native session ✅
6. Docs, tests, and packaging/release validation ✅

## Next
- Evolve chat into a smarter terminal UI/TUI experience.
- Add setup wizard, diagnostics, and demo assets.
- Create GitHub repo and push initial implementation. ✅
- Improve retrieval quality with salience scoring and semantic summaries. ✅
- Add dreaming-style consolidation jobs for episodic-to-semantic memory promotion. ✅

## Later
- Expand adapters, richer runtime behaviors, and testing matrix.
- Add more channels only if there is real user demand.

## Roadmap Ideas
- Tiered persistent memory with episodic and semantic stores ✅ (done)
- Dreaming-style background consolidation and pruning ✅ (done)
- Salience scoring for retrieval optimization ✅ (done)
- Scheduled memory maintenance jobs
- Plugin-based messaging with WhatsApp first, future Slack/Discord/iMessage if needed ✅ (WhatsApp done)
- Smart CLI and terminal UI roadmap with future multi-channel support
- Retrieval and recall workflows over persisted sessions ✅ (done)

### 🚀 Agentic Excellence (New v0.2.0 Focus)
- **Built-in Agentic Skills**: Streamlined setup for autonomous patterns:
    - **Ralph Loop**: Built-in "verify-and-fix" autonomous loops.
    - **Karpathian Loop**: Iterative data-driven self-improvement workflows.
    - **World Model**: Context-aware reasoning modules.
    - **Second Brain**: Integrated personal data RAG.
    - **Multi-Agent Teams**: Orchestration patterns for collaborative agents.
    - **Evaluator-Optimizer**: Self-correcting implementation flows.
- **Guided Setup**: Skill-based wizards to walk users through pattern configuration and usage.

- Add salience scoring and a first-pass consolidation planner for dreaming-style memory optimization. ✅ (done)

- Add curated semantic memory storage and a first promotion flow from consolidation candidates. ✅ (done)

- Add unified recall across both episodic session memory and curated semantic memory. ✅ (done)

- Feed recalled semantic and episodic memory back into the interactive chat/runtime flow. ✅ (done)

- Improve CLI operator ergonomics with human-readable inspection views before a full TUI. ✅ (done)

- Add lightweight filtering and aggregate session stats to improve terminal operator workflows. ✅ (done)

- Build configurable tool catalog and access policy model with safe defaults and explicit override posture. ✅ (done)

- Add memory decay strategy so stale episodic details lose salience unless reinforced.
- Add handoff artifact generation for context resets and long-running work.
- Add plan mode artifacts for implementation tasks.
- Add sub-agent orchestration briefs with least-privilege context isolation.
- Add closed-loop quality gates and critic/self-reflection fix loops. ✅ (done)
- Add vector retrieval / embedding compaction in a future memory phase.
- Add heartbeat-style background verification workflows.

- Add persistent tool policy editing commands with explicit acknowledgement for risky overrides. ✅ (done)

- Add explicit WhatsApp integration configuration and delivery modes as the first concrete channel path. ✅ (done)

- Enforce configured governance in runtime behavior, not just config metadata. ✅ (done)

- Improve governance ergonomics with filtered policy inspection and aggregate summaries. ✅ (done)

- Add a config inspection command so operators can view the resolved persisted runtime configuration. ✅ (done)

- Add messaging integration summaries for operator inspection. ✅ (done)

- Add governed tool execution flow so runtime actions are checked against policy and approval requirements. ✅ (done)

- Improve recall inspection with filtered and summarized operator views. ✅ (done)

- Add explicit yolo mode with warnings and auto-approval behavior for users who intentionally opt into riskier execution. ✅ (done)

- Add a unified system/operator summary command for quick runtime posture inspection. ✅ (done)

- Add default WhatsApp recipient fallback and cleaner send-result operator UX. ✅ (done)

- Improve semantic memory inspection with filters and summary views. ✅ (done)

- Add governed messaging execution flow so channel sends can follow explicit approval semantics. ✅ (done)

- Add Ralph loop support so RocketClaw2 can repeat work until validation or a user-provided condition succeeds. ✅ (done)

- Add validation-oriented Ralph loop presets and better loop result summaries. ✅ (done)

- Add a persistent approval request workflow for richer human-in-the-loop execution paths. ✅ (done)

- Auto-create approval requests from governed runtime flows when approval is required but not supplied. ✅ (done)

- Improve approval queue inspection with filters and aggregate summaries. ✅ (done)

- Add approval-aware execution helpers so operators can move from approval to rerun more smoothly. ✅ (done)

- Add next-step hints directly into approval queue views for better operator flow. ✅ (done)

- Add an actionable pending-approval view for faster operator review. ✅ (done)

- Add a guided setup helper to improve first-run and operator onboarding. ✅ (done)

- Expand doctor into a more useful readiness diagnostic for config, messaging, approvals, and governance posture. ✅ (done)

- Add a command that turns current runtime posture into recommended operator next steps. ✅ (done)

- Add a compact workspace status command that summarizes runtime state in one place. ✅ (done)

- Support session-scoped LLM URL/API key/model overrides from CLI parameters. ✅ (done)

- Add local skill management commands for import/list/update/remove with persisted source URL metadata. ✅ (done)

- Improve skill inspection with source-aware filtering and aggregate summaries. ✅ (done)

- Improve skill update reporting with metadata like last action and update count. ✅ (done)

- Improve setup wizard with interactive questions for LLM and messaging access details. ✅ (done)

- Add a real LLM query command using configured or session-overridden LLM access details. ✅ (done)

- Improve llm-query failure diagnostics for auth, endpoint, and model mismatch cases. ✅ (done)

- Add a lightweight LLM connectivity/auth test command separate from full prompt execution. ✅ (done)

- Add a compact LLM status command that shows readiness and session override state. ✅ (done)

- Make chat use the configured LLM with recalled memory context, with fallback behavior only when no LLM is configured. ✅ (done)

- Polish chat UX so Ctrl+C exits cleanly without a raw stack trace. ✅ (done)

- Add a first-class iterative task loop for LLM-guided development with validation retries. ✅ (done)

- Add an autonomous coding harness command with workspace selection, LLM guidance, validation, and result reporting. ✅ (done)

- Add persistent run artifacts for autonomous harness executions so runs are auditable and resumable. ✅ (done)

- Add list/show commands for persisted autonomous harness runs. ✅ (done)
- Add `recall-reset` so operators can restore recall scoring fields to defaults without manual YAML editing. ✅ (done)

- Add workspace-aware prompting and partial patch support for autonomous harness runs. ✅ (done)
- Add full artifact inspection mode for persisted harness runs. ✅ (done)

- Add per-iteration artifacts for full autonomous harness auditing. ✅ (done)

- Add critic/self-reflection support so autonomous harness iterations can react to validation failures more intelligently. ✅ (done)

- Improve harness inspection so a single run view includes per-iteration details. ✅ (done)

- Improve harness operator UX with iteration-focused inspection views. ✅ (done)

- Add explicit plan-gated execution so approved plans can be run directly as autonomous coding runs. ✅ (done)

- Preserve source-plan lineage in executed harness run artifacts and views. ✅ (done)

- Add strict execution mode that enforces approved-plan execution for autonomous harness runs. ✅ (done)

- Add real inbound WhatsApp listener/runtime support instead of mock-only integration posture. ✅ (done)

- Bridge inbound WhatsApp events into persistent sessions so messages can drive runtime behavior. ✅ (done)

- Add inbound WhatsApp action dispatch so messages can trigger runtime actions/events. ✅ (done)

- Add outbound auto-reply for dispatched inbound WhatsApp actions. ✅ (done)

- Improve harness UX with live progress milestones during iterations. ✅ (done)

- Guard harness validation against long-running commands that would otherwise hang the CLI. ✅ (done)

- Add a simple persisted WhatsApp session/bootstrap model as a stepping stone toward fuller native integration. ✅ (done)

- Add QR-based WhatsApp authorization bootstrap for local session setup. ✅ (done)

- Make WhatsApp session mode use real persisted runtime state instead of mock-like fallback behavior. ✅ (done)

- Add native WhatsApp transport foundation with self-chat-only default policy. ✅ (done)

- Add native inbound receive loop with self-chat-only enforcement before session bridge/dispatch. ✅ (done)

- Make native session mode the default inbound listener path for WhatsApp events. ✅ (done)
## Added Features
- RocketMoto.us CLI tool for scraping motorcycle routes and generating submissions (in custom-skills/rocketmoto-cli/)
