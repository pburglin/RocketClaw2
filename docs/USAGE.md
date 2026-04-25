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

## Built-in agentic skill patterns (roadmap)
RocketClaw2 v0.2.0 is being expanded to include guided built-in skills for common high-value autonomy patterns. These skills are meant to reduce setup friction, provide opinionated defaults, and teach operators how to use each workflow well.

Planned built-in skills:
- **Ralph Loop** — verify-and-fix loops for code, configs, and operator tasks
- **Karpathian Loop** — metric-driven iterative improvement and evaluation cycles
- **World Model** — explicit context modeling for plans, constraints, and situational awareness
- **Second Brain** — personal data ingestion, retrieval, summarization, and memory hygiene
- **Multi-Agent Teams** — orchestrated specialist agents with scoped roles and handoffs
- **Evaluator-Optimizer** — paired producer/evaluator loops for refinement and quality scoring

Most developed built-in skill docs right now:
- `docs/skills-roadmap/RALPH-LOOP.md`
- `docs/skills-roadmap/KARPATHIAN-LOOP.md`
- `docs/skills-roadmap/SECOND-BRAIN.md`
- `docs/skills-roadmap/SECOND-BRAIN-DEMO.md`
- `docs/skills-roadmap/EVALUATOR-OPTIMIZER.md`
- `docs/skills-roadmap/MULTI-AGENT-TEAMS.md`
- `docs/skills-roadmap/WORLD-MODEL.md`

Each pattern is expected to ship with:
- setup guidance
- recommended command flows
- guardrails and anti-patterns
- demo scenarios in `docs/DEMOS.md`

`docs/skills-roadmap/BUILT-IN-SKILLS.md` also now includes a practical playbook for using these patterns together to continuously improve RocketClaw2 itself.

## Current limitations
- chat responses are still rule-based and intentionally simple
- retrieval is now stronger than plain substring matching, unified recall suppresses identical duplicate hits, top results get a light diversity rebalance, and recall ranking blends lexical relevance with salience and recency, but matching is still lexical and does not yet use embeddings or semantic similarity
- dreaming currently plans and promotes memory, but does not yet rewrite or prune episodic history
- messaging is plugin-based, with WhatsApp as the first concrete target in the roadmap
- built-in skill packs for advanced autonomy patterns are still being documented and productized
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

## Second Brain operator flow

- `rocketclaw2 session-create --title "Second Brain Demo"`
- `rocketclaw2 dream --summary`
- `rocketclaw2 dream-run --dry-run`
- `rocketclaw2 remember`
- `rocketclaw2 recall --query "WhatsApp updates"`
- `rocketclaw2 memory-list --summary`

Recommended use:
- capture stable preferences and repeated constraints in sessions first
- inspect promotion candidates before writing long-term memory
- prefer durable facts over temporary status updates

## Governed messaging execution

- `rocketclaw2 message-run --channel whatsapp --text "hello" --approve`

## Ralph loop

- `rocketclaw2 ralph-loop --command "npm test" --until exit-0 --max-iterations 5`
- `rocketclaw2 ralph-loop --command "printf DONE" --until stdout-includes --match-text "DONE" --max-iterations 2`

## Ralph loop presets

- `rocketclaw2 ralph-loop --preset validate --max-iterations 5`
- `rocketclaw2 ralph-loop --preset build --max-iterations 5`
- `rocketclaw2 ralph-loop --preset lint --max-iterations 5`
- `rocketclaw2 ralph-loop --preset docs --max-iterations 5`
- `rocketclaw2 ralph-loop --preset pack --max-iterations 5`

Preset intent:
- `validate` — quick test-driven verify-and-fix loops
- `build` — compilation and packaging readiness
- `lint` — static correctness / typecheck cleanup
- `docs` — lightweight documentation-quality gate flows
- `pack` — release-style package verification

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

`doctor` now checks runtime readiness too, including whether WhatsApp session mode has actually been bootstrapped, whether self-chat-only session mode has a configured `ownPhoneNumber`, and whether the workspace has any real session activity yet.

## Recommended next actions

- `rocketclaw2 next-actions`
- `rocketclaw2 next-actions --json`

`next-actions` now considers runtime state too, not just static config. For example, it can point out missing WhatsApp session bootstrap when session mode is enabled, prompt for `ownPhoneNumber` when self-chat-only identity is incomplete, or suggest creating a first session when none exist yet.

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
- `rocketclaw2 --no-stream --llm-api-key "$API_KEY" llm-query --prompt "Say hello"`


LLM query errors now explain likely causes such as wrong API key, wrong provider URL, or model mismatch, and suggest an explicit retry command.

Server-side LLM failures now retry by default up to 3 times with exponential backoff, capped at 5 minutes between attempts. Use `--llm-retry-count <n>` when you want to disable retries (`0`) or keep retrying much longer.

## LLM connectivity test

- `rocketclaw2 --llm-api-key "$API_KEY" llm-test`

## LLM status

Use `llm-status` to inspect the active base URL, model, server-error retry count, API-key readiness, and whether session overrides are active.

- `rocketclaw2 llm-status`
- `rocketclaw2 --llm-api-key "$API_KEY" llm-status`
- `rocketclaw2 --llm-retry-count 0 llm-status`

## LLM performance stats

RocketClaw2 now tracks session-friendly LLM performance telemetry, including successful responses, errors, average response time, average tokens per response, and effective completion tokens/second.

- `rocketclaw2 llm-stats`
- `rocketclaw2 llm-stats --channel cli`
- `rocketclaw2 llm-stats --session-id <session-id>`
- interactive `chat` also supports `/llm` for the current chat session

Token counts use provider-reported usage when available and fall back to a rough estimate when the provider omits usage fields.

## LLM troubleshooting quick path

When `auto-code`, `harness-run`, or `chat` fails in a way that looks LLM-related, use this order:

1. inspect active config and overrides:
   - `rocketclaw2 --llm-base-url "$BASE_URL" --llm-api-key "$API_KEY" --llm-model "$MODEL" llm-status`
2. verify connectivity/auth first:
   - `rocketclaw2 --llm-base-url "$BASE_URL" --llm-api-key "$API_KEY" --llm-model "$MODEL" llm-test`
3. verify raw text generation before autonomous flows:
   - `rocketclaw2 --llm-base-url "$BASE_URL" --llm-api-key "$API_KEY" --llm-model "$MODEL" llm-query --prompt "Reply with exactly: LLM_OK"`
4. only then retry `auto-code` or `harness-run`

Notes:
- RocketClaw2 now accepts both plain string completions and newer structured text-part responses from OpenAI-compatible providers.
- Server-side LLM failures now retry by default up to 3 times with exponential backoff, capped at 5 minutes between attempts.
- Use `--llm-retry-count <n>` to override that retry budget for the current CLI session.
- If `llm-query` works with `gpt-4o-mini` but not with your selected model, suspect model/provider compatibility rather than the harness itself.
- If the provider is not compatible with `/chat/completions`, use a matching base URL or provider shim.

Chat now uses the configured LLM when available, instead of only echoing or listing memory snippets.


In chat mode, press Ctrl+C or type `/exit` to leave cleanly.

## Iterative task loop

- `rocketclaw2 --llm-api-key "$API_KEY" task-loop --task "Make the failing tests pass" --validate "npm test" --max-iterations 5`
- `rocketclaw2 --llm-api-key "$API_KEY" task-loop --task "Fix lint errors" --validate "npm run build" --max-iterations 5`

## Autonomous coding harness

Recommended paths:
- use `auto-code` when you want the fastest operator experience
- use `auto-code --no-auto-approve` when you want a fast plan-creation step followed by explicit review/approval
- use raw `harness-plan` / `harness-run` commands when you want lower-level control over each phase

Commands:
- `rocketclaw2 --llm-api-key "$API_KEY" auto-code --workspace /path/to/repo --task "Make tests pass" --validate "npm test" --max-iterations 5`
- `rocketclaw2 --llm-api-key "$API_KEY" auto-code --workspace /path/to/repo --task "Draft the plan only" --validate "npm run build" --max-iterations 5 --no-auto-approve`
- `rocketclaw2 --llm-api-key "$API_KEY" harness-plan --workspace /path/to/repo --task "Make tests pass" --validate "npm test" --request-approval`
- `rocketclaw2 --llm-api-key "$API_KEY" harness-run --workspace /path/to/repo --task "Make tests pass" --validate "npm test" --max-iterations 5`
- `rocketclaw2 --llm-api-key "$API_KEY" harness-run --workspace /path/to/repo --task "Fix build issues" --validate "npm run build" --max-iterations 5`

`auto-code --no-auto-approve` now creates a real saved plan artifact and prints the exact review/approve/run commands to continue through the governed path.

If autonomous coding fails before any files are written, start with `llm-status` and an override-based `llm-query` check so you can separate provider/config problems from harness behavior. Use `llm-test` only when you specifically want the compact connectivity/auth smoke test.

## Evaluator-Optimizer operator flow

- `rocketclaw2 auto-code --workspace . --task "Draft a feature plan" --validate "npm run build" --max-iterations 5 --no-auto-approve`
- `rocketclaw2 harness-show --id <plan-id> --plan`
- `rocketclaw2 harness-approve --id <plan-id>`
- `rocketclaw2 harness-run --id <plan-id> --require-approved-plan`
- `rocketclaw2 harness-show --id <run-id> --full`
- `rocketclaw2 harness-iterations --id <run-id> --latest --guidance`

Recommended use:
- define explicit review criteria first
- use `auto-code --no-auto-approve` as the fast path to create a reviewable plan artifact
- inspect critic/evaluator feedback before another run
- use this pattern when quality improves through review, not just raw retries

## Multi-Agent Teams operator pattern

Recommended role split:
- PM/Product → scope + acceptance criteria
- Architect → design + risks
- Implementer → execution
- Reviewer/QA → validation + final gaps

Current RocketClaw2 building blocks for this pattern:
- `rocketclaw2 team-role-template --role pm --goal "Clarify scope and acceptance criteria"`
- `rocketclaw2 team-role-template --role architect --goal "Design the approach"`
- `rocketclaw2 team-role-template --role reviewer --from-handoff-id <handoff-id>`
- `rocketclaw2 auto-code --no-auto-approve`
- `rocketclaw2 harness-show --id <plan-id-or-run-id> --plan`
- `rocketclaw2 harness-run --id <plan-id> --require-approved-plan`
- `rocketclaw2 harness-iterations --id <run-id> --latest --guidance`
- `rocketclaw2 approval-list`
- `rocketclaw2 next-actions`

Recommended use:
- start with `team-role-template` to stamp a narrow brief before delegating work
- use `--from-handoff-id` when you want to turn an existing saved handoff directly into a role brief
- keep role briefs small and explicit
- pass artifacts forward between roles
- always end with reviewer/QA validation

## World Model operator pattern

Current RocketClaw2 building blocks for this pattern:
- `rocketclaw2 world-model`
- `rocketclaw2 handoff-create`
- `rocketclaw2 handoff-create --preset qa --related-harness-id <run-id> --related-approval-id <approval-id>`
- `rocketclaw2 handoff-create --preset reviewer --related-harness-id <run-id> --related-approval-id <approval-id>`
- `rocketclaw2 handoff-create --owner qa --notes "Verify before merge" --related-harness-id <run-id> --related-approval-id <approval-id>`
- `rocketclaw2 handoff-list`
- `rocketclaw2 handoff-show --id <handoff-id>`
- `rocketclaw2 system-summary`
- `rocketclaw2 workspace-status`
- `rocketclaw2 next-actions`
- `rocketclaw2 recall --query ...`
- `rocketclaw2 doctor`

Recommended use:
- start with `rocketclaw2 world-model` when you want one planning/handoff snapshot instead of stitching together multiple commands
- run `rocketclaw2 handoff-create` when that snapshot should become a durable artifact for later review or role handoff
- use `--preset pm|architect|implementer|reviewer|qa` to stamp a role-aware owner + default handoff notes quickly
- attach `--owner`, `--notes`, and related harness/approval ids when you want the handoff to carry explicit delegation context instead of just posture
- `handoff-show` now also suggests concrete follow-up commands from linked approval/harness state, so reviewers know the next operational move immediately
- refresh posture before major actions
- keep track of goals, constraints, blockers, and next actions
- use this pattern to improve planning and handoffs across longer tasks


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
- `rocketclaw2 auto-code --workspace <path> --task "..." --validate "<cmd>" --max-iterations 5 --no-auto-approve` — fast path to create a saved plan artifact and print the next review commands
- `rocketclaw2 harness-plan --workspace <path> --task "..." --validate "<cmd>" --request-approval` — lower-level plan creation path when you want tighter manual control
- `rocketclaw2 harness-approve --id <plan-id>` — mark a saved plan as approved
- `rocketclaw2 harness-run --id <plan-id> --require-approved-plan` — execute a reviewed and approved plan artifact
- `rocketclaw2 harness-validate --id <run-id>` — re-apply saved code blocks and re-run the validate command
- `rocketclaw2 harness-resume --id <run-id>` — resume a failed run with one fresh iteration

## Autonomous coding harness

The `harness-run` command implements a full coding loop:

1. Sends the task to the LLM together with a compact relative file inventory of the workspace
2. Lets the model explicitly request a small set of file contents via a fenced `REQUEST_FILES` block when it needs deeper context
3. Parses fenced code blocks from the response and writes them to the workspace
4. Runs the validation command
5. Repeats on failure until validation passes or max iterations is reached

Code block format: ```filename.ext followed by file content, ending with ```


## Advanced harness behavior

`harness-run` now:
- scans the workspace before each iteration
- sends relative file paths by default instead of dumping full file contents into the initial prompt
- supports an explicit `REQUEST_FILES` round-trip so the model can pull only the files it actually needs
- supports partial file edits using `PATCH:filename` fenced blocks
- supports `--verbose` for formatted raw LLM request/response inspection on stderr
- supports global `--timestamps` to prefix human-readable progress / verbose log lines with the current time

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

Use `rocketclaw2 harness-run --id <approved-plan-id> --require-approved-plan` to execute a previously approved plan artifact as the basis for an autonomous coding run.


## Plan lineage

Runs created through the approved-plan execution path now retain source-plan lineage via `executedPlanId`, and normal run formatting surfaces that lineage during inspection.


## Strict execution control

If you want to forbid direct autonomous execution, use:
`rocketclaw2 harness-run --id <plan-id> --require-approved-plan`

This governed path is:
1. `harness-plan`
2. `harness-approve`
3. `harness-run --id <plan-id> --require-approved-plan`


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

Long LLM requests now also emit periodic `AI is thinking... (<elapsed>s elapsed, press Ctrl+C to cancel)` updates, which helps slow provider/model combinations feel less frozen.

`llm-query` and interactive `chat` now stream model text by default when the provider supports streaming, so you can see the answer arrive gradually instead of waiting for the full body. Use global `--no-stream` when you want the older buffered behavior.

By default, `harness-plan`, `harness-run`, `harness-run-plan`, `auto-code`, and `llm-query` now stream model text as it arrives; use global `--no-stream` if you want buffered behavior instead. When you want deeper troubleshooting, add `--verbose` to those commands to also print formatted raw LLM requests, responses, and extracted text on stderr. Add global `--timestamps` if you also want every human-readable log entry prefixed with time.

## Safe validation commands

Prefer short-lived validation commands such as `npm test` or `npm run build`.

RocketClaw2 now defaults to no local validation timeout. If you want a local guardrail for long-running commands like `npm run dev`, pass:
- `--validate-timeout-ms <n>`

Otherwise let the command run and use Ctrl+C when you intentionally want to stop it.


## WhatsApp session profile

Use `rocketclaw2 whatsapp-session` to inspect or manage the local persisted WhatsApp session profile used by RocketClaw2.

By default this now prints a readable status summary with masked token and last-used time. Add `--json` when you want the raw stored profile.

You can also configure native-session behavior directly with:
- `rocketclaw2 whatsapp-config --mode session --own-phone-number +15551234567`
- `rocketclaw2 whatsapp-config --self-chat-only true`
- `rocketclaw2 whatsapp-config --self-chat-only false` (only if you intentionally want external outbound sends)

Use `rocketclaw2 messaging-summary` for a quick human-readable check of the active WhatsApp safety posture, including self-chat-only state, configured own phone number, and session readiness.

`rocketclaw2 messaging-summary --json` now also includes `sessionState.whatsapp`, so scriptable checks can see both configured messaging settings and the persisted WhatsApp session profile in one response.

`rocketclaw2 workspace-status` now surfaces the same WhatsApp safety posture at the top-level dashboard view, so operators can verify session-mode enforcement without switching commands.


## WhatsApp QR authorization

RocketClaw2 includes `whatsapp-qr` for generating and authorizing a simple QR bootstrap token used for local session setup.

Inbound WhatsApp command dispatch now supports `status`, `doctor`, `next-actions`, `sessions`, `session <id-or-title>`, `approvals`, `memory`, `tools`, `messaging`, and `help`, so basic operator triage can happen directly from a chat thread.

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
