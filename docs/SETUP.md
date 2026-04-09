# Setup

## Prerequisites
- Node.js 22+
- npm 10+

## Bootstrap
```bash
npm install
npm run build
npm test
```

## First local run
```bash
node dist/cli.js doctor
node dist/cli.js init --profile default
node dist/cli.js recall-profile
node dist/cli.js session-create --title "First Session"
node dist/cli.js session-list
```

## Recall scoring config
`init` now writes default recall scoring weights into `config.yaml`.

You can inspect the active profile with:
```bash
node dist/cli.js recall-profile
node dist/cli.js recall-explain
node dist/cli.js doctor
node dist/cli.js config-show
```

This is the current tuning surface for:
- session salience weighting
- duplicate semantic-memory preference
- diversity penalty
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
