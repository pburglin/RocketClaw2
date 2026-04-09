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
