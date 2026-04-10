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

## Recommended next actions

- `rocketclaw2 next-actions`
- `rocketclaw2 next-actions --json`

## Workspace status

- `rocketclaw2 workspace-status`
- `rocketclaw2 workspace-status --json`

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
