import { describe, expect, it } from 'vitest';
import { formatHarnessRunSummary, formatHarnessRuns } from '../src/harness/list-formatters.js';

describe('formatHarnessRuns', () => {
  it('formats persisted harness run summaries', () => {
    const text = formatHarnessRuns([{ runId: 'abc', ok: true, workspace: '/tmp/demo', task: 'demo task' }]);
    expect(text).toContain('abc');
    expect(text).toContain('demo task');
    expect(text).toContain('next=Re-validate if needed');
  });

  it('formats aggregate harness artifact summaries', () => {
    const text = formatHarnessRunSummary([
      { runId: 'p1', kind: 'plan', ok: true, approvalStatus: 'draft', workspace: '/tmp/demo', task: 'draft plan' },
      { runId: 'p2', kind: 'plan', ok: true, approvalStatus: 'approved', workspace: '/tmp/demo', task: 'approved plan' },
      { runId: 'r1', ok: false, workspace: '/tmp/demo', task: 'failed run' },
    ]);
    expect(text).toContain('Plans: 2');
    expect(text).toContain('Approved plans: 1');
    expect(text).toContain('Failed runs: 1');
  });
});
