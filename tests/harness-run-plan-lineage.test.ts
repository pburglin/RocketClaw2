import { describe, expect, it } from 'vitest';
import { formatCodingHarnessResult } from '../src/harness/formatters.js';

describe('harness run plan lineage formatting', () => {
  it('shows executed plan id when present', () => {
    const text = formatCodingHarnessResult({
      ok: true,
      workspace: '/tmp/demo',
      task: 'ship feature',
      iterations: 1,
      lastGuidance: 'done',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      validateCommand: 'npm test',
      runId: 'run-123',
      executedPlanId: 'plan-456',
      sourceHandoffId: 'handoff-9',
      artifactPath: '/tmp/run-123.json',
    });
    expect(text).toContain('Executed plan: plan-456');
    expect(text).toContain('Source handoff: handoff-9');
  });
});
