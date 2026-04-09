import { describe, expect, it } from 'vitest';
import { formatHarnessGuidanceView, formatHarnessPlanView, formatHarnessValidationView } from '../src/harness/formatters.js';

describe('harness show formatters', () => {
  it('formats a guidance-only view', () => {
    const text = formatHarnessGuidanceView({ runId: 'run-1', lastGuidance: 'apply patch' });
    expect(text).toContain('run-1');
    expect(text).toContain('apply patch');
  });

  it('formats a validation-only view', () => {
    const text = formatHarnessValidationView({ runId: 'run-2', lastValidationStdout: 'ok', lastValidationStderr: '', validateCommand: 'npm test', iterations: 2, ok: true });
    expect(text).toContain('Validation stdout: ok');
    expect(text).toContain('Validate command: npm test');
  });

  it('formats a plan-only view', () => {
    const text = formatHarnessPlanView({ runId: 'plan-1', approvalStatus: 'draft', validateCommand: 'npm test', planText: 'Summary\n- do thing' });
    expect(text).toContain('Approval: draft');
    expect(text).toContain('Summary');
  });
});
