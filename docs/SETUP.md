# Setup

## Prerequisites
- Node.js 22+
- npm 10+

## Bootstrap
```bash
npm install
npm run build
npm run verify:build
npm test
```

## First local run
```bash
node dist/src/cli.js doctor
node dist/src/cli.js init --profile default
node dist/src/cli.js recall-profile
node dist/src/cli.js session-create --title "First Session"
node dist/src/cli.js session-list
```

## Recall scoring config
`init` now writes default recall scoring weights into `config.yaml`.

You can inspect and tune the active profile with:
```bash
node dist/src/cli.js recall-profile
node dist/src/cli.js recall-explain
node dist/src/cli.js recall-set --path sessionSalienceMultiplier --value 4
node dist/src/cli.js doctor
node dist/src/cli.js config-show
```

This is the current tuning surface for:
- session salience weighting
- duplicate semantic-memory preference
- diversity penalty

## Local CLI install
To make `rocketclaw2` available as a shell command from this checkout:
```bash
npm install
npm run build
npm link
rocketclaw2 --help
```

`npm run build` now also fixes executable permissions on `dist/src/cli.js`, so linked CLI installs work without a manual `chmod +x` step.

Packaging now also runs build verification automatically through `prepack`, so `npm pack` and publish-style workflows re-check the canonical CLI entrypoint before shipping.

GitHub Actions CI also runs `npm ci`, `npm run lint`, `npm run build`, `npm run verify:build`, `npm test`, and `npm run verify:pack` on every push and pull request.

CI additionally creates an `npm pack --ignore-scripts` tarball and uploads it as a workflow artifact for direct inspection.

Published package contents are now constrained through the `files` manifest in `package.json`, so the npm tarball ships runtime build output from `dist/src/**` plus docs instead of raw source, test trees, or compiled test artifacts.

Production compilation now uses `tsconfig.build.json` so `npm run build` emits only runtime code, while `npm run lint` still typechecks both `src/` and `tests/` through the main `tsconfig.json`.

If publishing is enabled later, `prepublishOnly` now re-runs build and pack verification so publish-time flows inherit the same safeguards as CI and prepack.

There is also now a tag-triggered GitHub Actions release workflow for `v*` tags. It reruns lint, build, tests, build verification, and pack verification, uploads the `.tgz` artifact, and publishes only when `NPM_TOKEN` is present.

If you do not want to link globally, run commands with:
```bash
node dist/src/cli.js doctor
```
- session recency decay
- semantic recency decay

Example `config.yaml` tuning:
```yaml
profile: default
recallScoring:
  sessionSalienceMultiplier: 4
  duplicateSemanticPriorityBonus: 120
  diversityPenaltyPerBucketHit: 12
  sessionRecency:
    within1Day: 20
    within7Days: 10
    within30Days: 0
    within90Days: -12
    older: -24
  semanticRecency:
    within1Day: 8
    within7Days: 5
    within30Days: 0
    within180Days: -2
    older: -4
```

## Development commands
```bash
npm run dev -- doctor
npm run dev -- session-list
npm run lint
npm run verify:build
npm test
```

## Local state
RocketClaw2 currently uses local file-backed persistence for sessions and semantic memory. That makes the project easy to run locally without external services while the higher-level runtime behavior evolves.

## Environment and integrations
There is no required `.env` file for the current local-first workflow.

Future provider and messaging integrations may introduce optional environment variables, but the current session, memory, recall, and chat features work without them.

## Validation status
Current baseline validation:
- `npm run build` ✅
- `npm test` ✅

## Guided setup

Run:
```bash
rocketclaw2 setup-wizard
```

This prints the current runtime posture and recommended next configuration actions.

## Built-in skill setup roadmap

RocketClaw2 v0.2.0 is adding built-in setup guidance for reusable agentic patterns.

First planned guided skill packs:
- Ralph Loop
- Second Brain
- Evaluator-Optimizer
- Multi-Agent Teams
- World Model
- Karpathian Loop

Start with these references:
- `docs/skills-roadmap/BUILT-IN-SKILLS.md`
- `docs/skills-roadmap/RALPH-LOOP.md`
- `docs/skills-roadmap/KARPATHIAN-LOOP.md`
- `docs/skills-roadmap/SECOND-BRAIN.md`
- `docs/skills-roadmap/SECOND-BRAIN-DEMO.md`
- `docs/skills-roadmap/EVALUATOR-OPTIMIZER.md`
- `docs/skills-roadmap/MULTI-AGENT-TEAMS.md`
- `docs/skills-roadmap/WORLD-MODEL.md`

The intent is for future setup flows to help users enable these patterns with sane defaults instead of manual prompt engineering.

## Second Brain quick start
For the most practical built-in memory workflow, start here:
```bash
node dist/src/cli.js session-create --title "Second Brain Demo"
node dist/src/cli.js dream --summary
node dist/src/cli.js dream-run --dry-run
node dist/src/cli.js remember
node dist/src/cli.js recall --query "preference"
```

This is the current closest thing to a built-in personal-RAG onboarding path in RocketClaw2.

## Readiness check

After setup, run:
```bash
rocketclaw2 doctor
```

This checks whether the current runtime posture is ready for use and highlights potential configuration issues.

## Temporary LLM overrides

For one-off sessions, you can override persisted LLM settings from the CLI without changing saved config.

## Importing skills

Skills can be imported later from source URLs and tracked locally by RocketClaw2.

## LLM API key setup

RocketClaw2 now makes LLM setup more explicit. You can:

1. Persist values in `config.yaml`, including:
```yaml
llm:
  baseUrl: https://api.openai.com/v1
  model: gpt-4o-mini
  apiKey: YOUR_API_KEY_HERE
```

2. Or use session-only CLI overrides:
```bash
rocketclaw2 --llm-base-url "https://api.openai.com/v1" --llm-api-key "$API_KEY" doctor
```

3. Or let the wizard ask you interactively:
```bash
rocketclaw2 setup-wizard --interactive
```


RocketClaw2 stores autonomous coding run artifacts under its local data directory in `harness-runs/`.


## Simple WhatsApp session profile

RocketClaw2 now supports a persisted local WhatsApp session profile:
- `rocketclaw2 whatsapp-session --set-token <token> --phone-number +15551234567`
- `rocketclaw2 whatsapp-session`
- `rocketclaw2 whatsapp-session --clear`

When you provide `--phone-number`, RocketClaw2 now also syncs that value into `messaging.whatsapp.ownPhoneNumber`, which helps self-chat-only session mode become ready in one step.

This is a simple bootstrap/session-storage step, not a full native WhatsApp protocol client yet.


## WhatsApp QR bootstrap

You can now use a simple QR bootstrap flow for WhatsApp session authorization:
- Generate: `rocketclaw2 whatsapp-qr`
- Authorize: `rocketclaw2 whatsapp-qr --authorize <token> --phone-number +15551234567`

When you provide `--phone-number`, the QR authorization flow now also syncs that value into `messaging.whatsapp.ownPhoneNumber`, just like the direct session bootstrap path, and the CLI confirms that sync in its success output.

This is a lightweight bootstrap model that stores the authorized session locally.


## Runtime-backed WhatsApp session mode

When `messaging.whatsapp.mode` is `session`, RocketClaw2 expects a saved local WhatsApp session profile. If none is configured, sends now fail clearly instead of silently falling back to mock semantics.


## Native WhatsApp transport foundation

RocketClaw2 now includes a native WhatsApp transport foundation layer. By default, inbound handling should be treated as self-chat-only unless explicitly configured otherwise.
