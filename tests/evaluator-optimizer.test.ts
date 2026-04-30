import { describe, expect, it } from 'vitest';
import { formatEvaluatorOptimizerReport } from '../src/skills/evaluator-optimizer.js';

describe('evaluator-optimizer', () => {
  it('formats explicit criteria and revision summaries', () => {
    const text = formatEvaluatorOptimizerReport({
      runId: 'run-123',
      kind: 'run',
      workspace: '/tmp/demo',
      task: 'Draft a feature plan',
      validateCommand: 'npm test',
      approvalStatus: 'approved',
      ok: false,
      sourceHandoffId: 'handoff-7',
      sourceHandoffChain: ['handoff-1', 'handoff-4', 'handoff-7'],
      latestSavedDecision: 'needs-review',
      latestSavedAt: '2026-04-29T14:45:00.000Z',
      criteria: [
        { criterion: 'Validation passes cleanly', status: 'failed', evidence: 'Latest validation did not pass for `npm test`.' },
        { criterion: 'No unresolved critic insight remains', status: 'failed', evidence: 'Latest critic insight: missing package.json' },
      ],
      revisionSummary: {
        totalIterations: 2,
        failedIterations: 1,
        passedIterations: 1,
        filesCreated: 1,
        filesModified: 2,
        latestCriticInsight: 'missing package.json',
        latestGuidance: 'create package.json',
      },
      recommendedNextStep: 'Inspect failed iterations with `rocketclaw2 harness-iterations --id run-123 --failed-only` and resume if the critic direction is still useful.',
    });

    expect(text).toContain('RocketClaw2 Evaluator-Optimizer');
    expect(text).toContain('Latest saved decision: needs-review');
    expect(text).toContain('Source handoff: handoff-7');
    expect(text).toContain('Source handoff chain: handoff-1 -> handoff-4 -> handoff-7');
    expect(text).toContain('Criteria:');
    expect(text).toContain('Revision summary:');
    expect(text).toContain('Recommended next step:');
  });
});
