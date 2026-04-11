# Usage

RocketClaw2 currently ships a runnable CLI with persistent sessions, retrieval, semantic memory promotion, a minimal interactive chat shell, and operator-friendly inspection commands.

## Core commands
- `rocketclaw2 init`
- `rocketclaw2 doctor`
- `rocketclaw2 config-show`
- `rocketclaw2 run`
- `rocketclaw2 roadmap`
- `rocketclaw2 channels`
- `rocketclaw2 send`

`doctor` now includes the active recall-scoring profile from persisted config, so runtime diagnostics reflect the current memory-ranking behavior. Use `config-show` when you want the full resolved app config instead of just diagnostics, and `recall-explain` when you want plain-English guidance for what the recall weights do.

## Session commands
- `rocketclaw2 session-create --title "Demo Session"`
- `rocketclaw2 session-list`
- `rocketclaw2 session-list --title-contains demo`
- `rocketclaw2 session-show --id <session-id>`
- `rocketclaw2 session-show --id <session-id> --summary`
- `rocketclaw2 session-show --id <session-id> --limit 5`
- `rocketclaw2 session-append --id <session-id> --role user --text "hello"`
- `rocketclaw2 session-stats`

## Memory commands
- `rocketclaw2 search --query "alpha"`
- `rocketclaw2 recall --query "alpha"`
- `rocketclaw2 recall-profile`
- `rocketclaw2 recall-explain`
- `rocketclaw2 recall-paths`
- `rocketclaw2 recall-reset` (reset all recall scoring fields to defaults)
- `rocketclaw2 recall-reset --path sessionSalienceMultiplier` (reset a specific field)
- `rocketclaw2 recall-set --path sessionSalienceMultiplier --value 4`
- `rocketclaw2 recall-diff` (show delta vs. defaults)

`recall-set` now validates values against lightweight safety ranges so extreme tuning mistakes are rejected early.
- `rocketclaw2 dream`
- `rocketclaw2 remember`
- `rocketclaw2 memory-list`
- `rocketclaw2 memory-plan`

## Interactive chat
- `rocketclaw2 chat --title "My Session"`
- `rocketclaw2 chat --session-id <existing-session-id>`

The current chat shell is intentionally minimal. It appends user and assistant turns into the persistent session store, runs unified recall against both session history and curated semantic memory, and responds differently when the user asks explicit memory questions versus normal chat input.

## Output modes
Most inspection commands support a human-readable default format plus raw structured output when `--json` is provided.

`session-show` now also supports `--summary` for a compact overview and `--limit <n>` to control how many recent messages appear in human-readable transcript mode.

Examples:
```bash
rocketclaw2 session-list
rocketclaw2 session-list --json
rocketclaw2 session-stats
rocketclaw2 memory-list --json
```

## Example workflow
```bash
npm run build
npm test
node dist/src/cli.js session-create --title "Demo"
node dist/src/cli.js session-list
node dist/src/cli.js session-append --id <session-id> --role user --text "Pedro prefers WhatsApp"
node dist/src/cli.js recall-profile
node dist/src/cli.js search --query WhatsApp
node dist/src/cli.js dream
node dist/src/cli.js remember
node dist/src/cli.js recall --query WhatsApp
node dist/src/cli.js chat --session-id <session-id>
```

## Current limitations
- chat responses are still rule-based and intentionally simple
- retrieval is now stronger than plain substring matching, unified recall suppresses identical duplicate hits, top results get a light diversity rebalance, and recall ranking blends lexical relevance with salience and recency, but matching is still lexical and does not yet use embeddings or semantic similarity
- dreaming currently plans and promotes memory, but does not yet rewrite or prune episodic history
- messaging is plugin-based, with WhatsApp as the first concrete target in the roadmap
- the richer TUI is still future work, but the formatter layer now supports more usable terminal inspection flows

## Messaging inspection

- `rocketclaw2 messaging-summary`
- `rocketclaw2 whatsapp-config`

## Governed tool execution

- `rocketclaw2 tool-run --tool file-management --action read`
- `rocketclaw2 tool-run --tool file-management --action write --approve`

## Recall inspection

- `rocketclaw2 recall --query "alpha"`
- `rocketclaw2 recall --query "alpha" --kind semantic`
- `rocketclaw2 recall --query "alpha" --summary`

## Yolo mode

- `rocketclaw2 yolo-config`
- `rocketclaw2 yolo-config --enabled true --warn true`

## System summary

- `rocketclaw2 system-summary`
- `rocketclaw2 system-summary --json`

## Messaging send ergonomics

- `rocketclaw2 send --channel whatsapp --text "hello"`
- `rocketclaw2 send --channel whatsapp --to "+15551234567" --text "hello"`
- `rocketclaw2 send --channel whatsapp --text "hello" --json`

## Semantic memory inspection

- `rocketclaw2 memory-list`
- `rocketclaw2 memory-list --tag preference`
- `rocketclaw2 memory-list --min-salience 40 --summary`

## Governed messaging execution

- `rocketclaw2 message-run --channel whatsapp --text "hello" --approve`

## Ralph loop

- `rocketclaw2 ralph-loop --command "npm test" --until exit-0 --max-iterations 5`
- `rocketclaw2 ralph-loop --command "printf DONE" --until stdout-includes --match-text "DONE" --max-iterations 2`

## Ralph loop presets

- `rocketclaw2 ralph-loop --preset validate --max-iterations 5`
- `rocketclaw2 ralph-loop --preset build --max-iterations 5`

## Approval workflow

- `rocketclaw2 approval-create --kind message-send --target whatsapp --detail "Send daily report"`
- `rocketclaw2 approval-list`
- `rocketclaw2 approval-list --status pending`
- `rocketclaw2 approval-resolve --id <approval-id> --status approved`


Note: approval requests may now be created automatically when governed execution is attempted without required approval.

## Approval inspection

- `rocketclaw2 approval-list --status pending --kind message-send`
- `rocketclaw2 approval-list --summary`

- `rocketclaw2 approval-approve-run --id <approval-id>`


Approval list and summary views now surface recommended next steps directly in the terminal output.

- `rocketclaw2 approval-pending`

## Setup wizard

- `rocketclaw2 setup-wizard`

## Doctor

- `rocketclaw2 doctor`
- `rocketclaw2 doctor --json`

`doctor` now checks runtime readiness too, including whether WhatsApp session mode has actually been bootstrapped and whether the workspace has any real session activity yet.

## Recommended next actions

- `rocketclaw2 next-actions`
- `rocketclaw2 next-actions --json`

`next-actions` now considers runtime state too, not just static config. For example, it can point out missing WhatsApp session bootstrap when session mode is enabled, or suggest creating a first session when none exist yet.

## Workspace status

- `rocketclaw2 workspace-status`
- `rocketclaw2 workspace-status --json`

`workspace-status` now includes richer messaging and session signals, including WhatsApp mode/default recipient/session state plus total message count and latest session activity.

## Session-scoped LLM overrides

- `rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" doctor`
- `rocketclaw2 --llm-model "custom-model" system-summary`

## Skill management

- `rocketclaw2 skill-import --url "https://github.com/example/demo-skill.git"`
- `rocketclaw2 skill-list`
- `rocketclaw2 skill-update --id demo-skill`
- `rocketclaw2 skill-update`
- `rocketclaw2 skill-remove --id demo-skill`

## Skill inspection

- `rocketclaw2 skill-list --source-contains github.com`
- `rocketclaw2 skill-list --summary`
- `rocketclaw2 skill-summary`


Imported skill listings now show update-related metadata such as last action and update count.

## Interactive setup

- `rocketclaw2 setup-wizard --interactive`

## Real LLM query

- `rocketclaw2 --llm-api-key "$API_KEY" llm-query --prompt "Say hello"`
- `rocketclaw2 --llm-base-url "https://example.com/v1" --llm-api-key "$API_KEY" --llm-model "custom-model" llm-query --prompt "Say hello"`


LLM query errors now explain likely causes such as wrong API key, wrong provider URL, or model mismatch, and suggest an explicit retry command.

## LLM connectivity test

- `rocketclaw2 --llm-api-key "$API_KEY" llm-test`

## LLM status

- `rocketclaw2 llm-status`
- `rocketclaw2 --llm-api-key "$API_KEY" llm-status`


Chat now uses the configured LLM when available, instead of only echoing or listing memory snippets.


In chat mode, press Ctrl+C or type `/exit` to leave cleanly.

## Iterative task loop

- `rocketclaw2 --llm-api-key "$API_KEY" task-loop --task "Make the failing tests pass" --validate "npm test" --max-iterations 5`
- `rocketclaw2 --llm-api-key "$API_KEY" task-loop --task "Fix lint errors" --validate "npm run build" --max-iterations 5`

## Autonomous coding harness

- `rocketclaw2 --llm-api-key "$API_KEY" harness-plan --workspace /path/to/repo --task "Make tests pass" --validate "npm test" --request-approval`
- `rocketclaw2 --llm-api-key "$API_KEY" harness-run --workspace /path/to/repo --task "Make tests pass" --validate "npm test" --max-iterations 5`
- `rocketclaw2 --llm-api-key "$API_KEY" harness-run --workspace /path/to/repo --task "Fix build issues" --validate "npm run build" --max-iterations 5`


Each `harness-run` now writes a persistent JSON artifact under the RocketClaw2 data directory so runs can be inspected later.

## Harness run inspection

- `rocketclaw2 harness-list`
- `rocketclaw2 harness-list --kind plan --approval draft`
- `rocketclaw2 harness-list --kind run --ok false`
- `rocketclaw2 harness-list --summary`
- `rocketclaw2 harness-show --id <run-id>`
- `rocketclaw2 harness-show --id <run-id> --guidance`
- `rocketclaw2 harness-show --id <run-id> --validation`
- `rocketclaw2 harness-show --id <run-id> --plan`
- `rocketclaw2 harness-show --id <run-id> --lineage`
- `rocketclaw2 harness-chain --id <run-id>`
- `rocketclaw2 harness-chain --id <run-id> --summary`
- `rocketclaw2 harness-iterations --id <run-id>`
- `rocketclaw2 harness-iterations --id <run-id> --latest`
- `rocketclaw2 harness-iterations --id <run-id> --failed-only`
- `rocketclaw2 harness-iterations --id <run-id> --iteration 2`
- `rocketclaw2 harness-iterations --id <run-id> --latest --guidance`
- `rocketclaw2 harness-plan --workspace <path> --task "..." --validate "<cmd>" --request-approval` — generate a reviewable plan and optionally enqueue approval
- `rocketclaw2 harness-approve --id <plan-id>` — mark a saved plan as approved
- `rocketclaw2 harness-run --id <plan-id> --require-approved-plan` — execute a reviewed and approved plan artifact
- `rocketclaw2 harness-validate --id <run-id>` — re-apply saved code blocks and re-run the validate command
- `rocketclaw2 harness-resume --id <run-id>` — resume a failed run with one fresh iteration

## Autonomous coding harness

The `harness-run` command implements a full coding loop:

1. Sends the task to the LLM with workspace context
2. Parses fenced code blocks from the response and writes them to the workspace
3. Runs the validation command
4. Repeats on failure until validation passes or max iterations is reached

Code block format: ```filename.ext followed by file content, ending with ```


## Advanced harness behavior

`harness-run` now:
- reads existing workspace files before each iteration
- includes workspace context in the LLM prompt
- supports partial file edits using `PATCH:filename` fenced blocks

`harness-show --id <run-id> --full` prints the complete saved artifact, including the full last LLM guidance.


## Per-iteration artifacts

Each iteration now produces a JSON entry under `harness-runs/<run-id>/iteration-NNN.json` with:
- files created and modified
- validation stdout/stderr
- full LLM guidance for that iteration

This makes every run fully inspectable after the fact.


## Critic/self-reflection

`harness-run` now performs a critic step after failed validation. The critic summarizes the most likely root cause and suggested corrective direction, and that insight is included in the next prompt iteration.


## Full run inspection

Use `rocketclaw2 harness-show --id <run-id> --full` to inspect:
- saved run metadata
- latest guidance
- per-iteration file changes
- critic insights
- per-iteration validation results


## Iteration-focused inspection

Use `rocketclaw2 harness-iterations --id <run-id>` to inspect run history at the iteration level. Helpful flags:
- `--latest`
- `--failed-only`
- `--iteration <n>`
- `--guidance`


## Plan-gated autonomous execution

Use `rocketclaw2 harness-run-plan --id <approved-plan-id>` to execute a previously approved plan artifact as the basis for an autonomous coding run.


## Plan lineage

Runs created through `harness-run-plan` now retain source-plan lineage via `executedPlanId`, and normal run formatting surfaces that lineage during inspection.


## Strict execution control

If you want to forbid direct autonomous execution, use:
`rocketclaw2 harness-run ... --require-approved-plan`

This will fail fast and instruct the operator to use:
1. `harness-plan`
2. `harness-approve`
3. `harness-run-plan`


## Live WhatsApp listener

Start a local inbound webhook listener:
- `rocketclaw2 whatsapp-listen --port 8787`

Inspect received inbound events:
- `rocketclaw2 whatsapp-inbox`
- `rocketclaw2 whatsapp-inbox --json`
- `rocketclaw2 whatsapp-outbox`
- `rocketclaw2 whatsapp-outbox --json`


## WhatsApp event-to-session bridge

Inbound WhatsApp webhook events now:
- persist to the WhatsApp inbox log
- create or reuse a session titled `WhatsApp <sender>`
- append the inbound text as a user message


## WhatsApp-triggered actions

When sent through the inbound webhook listener, these message texts now trigger runtime actions:
- `status`
- `workspace-status`
- `next`
- `next-actions`


## WhatsApp action-response loop

When an inbound WhatsApp message matches a supported dispatcher command, RocketClaw2 now:
1. persists the event
2. bridges it into a session
3. dispatches a runtime action
4. sends a WhatsApp reply back to the sender


## Interactive harness progress

`harness-run` now emits concise progress points during each iteration so operators can see live execution progress instead of waiting only for the final report.


## Safe validation commands

Prefer short-lived validation commands such as `npm test` or `npm run build`.

`harness-run` now applies a default validation timeout and supports:
- `--validate-timeout-ms <n>`

This prevents long-running commands like `npm run dev` from hanging the CLI forever.


## WhatsApp session profile

Use `rocketclaw2 whatsapp-session` to inspect or manage the local persisted WhatsApp session profile used by RocketClaw2.

By default this now prints a readable status summary with masked token and last-used time. Add `--json` when you want the raw stored profile.

You can also configure native-session behavior directly with:
- `rocketclaw2 whatsapp-config --mode session --own-phone-number +15551234567`
- `rocketclaw2 whatsapp-config --self-chat-only true`
- `rocketclaw2 whatsapp-config --self-chat-only false` (only if you intentionally want external outbound sends)


## WhatsApp QR authorization

RocketClaw2 includes `whatsapp-qr` for generating and authorizing a simple QR bootstrap token used for local session setup.

Inbound WhatsApp command dispatch now supports `status`, `doctor`, `next-actions`, `sessions`, `session <id-or-title>`, `approvals`, `memory`, `tools`, and `help`, so basic operator triage can happen directly from a chat thread.

WhatsApp `session` mode now routes sends through the native-session transport helper, so the runtime reflects the persisted session identity more realistically than the earlier plain stub response.

By default, session-mode sends remain self-chat-only. External recipients are rejected unless `selfChatOnly` is explicitly disabled in config.

Those native-session sends are also persisted to a local WhatsApp native outbox, giving session-mode transport an inspectable outbound trail via `rocketclaw2 whatsapp-outbox`.


## Runtime-backed session behavior

WhatsApp `session` mode now depends on a persisted local session profile. Configure the session first with `whatsapp-session` or `whatsapp-qr`, then use session mode for runtime sends/replies.


## Native WhatsApp foundation

RocketClaw2 now has a native WhatsApp foundation layer that uses the persisted session profile and enforces self-chat-only policy by default.


## Native transport foundation

RocketClaw2 now includes an explicit native message transport interface plus a WhatsApp native transport implementation scaffold as the basis for fuller native integration.


## Native inbound receive loop

The native WhatsApp subsystem now has an inbound receive processor that:
- evaluates self-chat-only policy first
- only then bridges accepted events into sessions
- then runs dispatcher logic


## Native-default inbound routing

When `messaging.whatsapp.mode` is `session`, `whatsapp-listen` now uses the native inbound processor path by default. This means self-chat-only filtering happens before messages are bridged into sessions or dispatched.
