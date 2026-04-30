import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun, loadHarnessRun } from '../src/harness/store.js';
import { saveEvaluationDecision } from '../src/skills/evaluator-store.js';

describe('evaluator decision persistence', () => {
  it('persists latest evaluation plus history on the harness artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-evaluator-store-${Date.now()}`);
    await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'Draft a feature plan',
      iterations: 1,
      lastGuidance: 'retry',
      lastValidationStdout: '',
      lastValidationStderr: 'boom',
      validateCommand: 'npm test',
      sourceHandoffId: 'handoff-3',
      sourceHandoffChain: ['handoff-1', 'handoff-3'],
      runId: 'run-1',
    }, root, 'run-1');

    await saveEvaluationDecision('run-1', {
      savedAt: '2026-04-29T14:45:00.000Z',
      decision: 'needs-review',
      note: 'Still missing acceptance criteria clarity.',
      criteria: [
        { criterion: 'Validation passes cleanly', status: 'failed', evidence: 'Latest validation did not pass for `npm test`.' },
      ],
      recommendedNextStep: 'Inspect failed iterations before another run.',
      revisionSummary: {
        totalIterations: 1,
        failedIterations: 1,
        passedIterations: 0,
        filesCreated: 0,
        filesModified: 1,
      },
    }, root);

    const saved = await loadHarnessRun('run-1', root);
    expect(saved?.evaluationDecision).toBe('needs-review');
    expect((saved?.evaluationHistory as unknown[])?.length).toBe(1);
    expect((saved?.latestEvaluation as Record<string, unknown>)?.note).toBe('Still missing acceptance criteria clarity.');
    expect((saved?.latestEvaluation as Record<string, unknown>)?.sourceHandoffId).toBe('handoff-3');
    expect((saved?.latestEvaluation as Record<string, unknown>)?.sourceHandoffChain).toEqual(['handoff-1', 'handoff-3']);

    await fs.rm(root, { recursive: true, force: true });
  });
});
