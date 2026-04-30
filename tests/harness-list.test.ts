import { describe, expect, it } from 'vitest';
import { formatHarnessRunSummary, formatHarnessRuns } from '../src/harness/list-formatters.js';

describe('formatHarnessRuns', () => {
  it('formats persisted harness run summaries', () => {
    const text = formatHarnessRuns([{ runId: 'abc', ok: true, evaluationDecision: 'accepted', sourceHandoffId: 'handoff-2', workspace: '/tmp/demo', task: 'demo task' }]);
    expect(text).toContain('abc');
    expect(text).toContain('demo task');
    expect(text).toContain('plan=n/a');
    expect(text).toContain('evaluation=accepted');
    expect(text).toContain('resumedFrom=n/a');
    expect(text).toContain('sourceHandoff=handoff-2');
    expect(text).toContain('next=Re-validate if needed');
  });

  it('formats aggregate harness artifact summaries', () => {
    const text = formatHarnessRunSummary([
      { runId: 'p1', kind: 'plan', ok: true, approvalStatus: 'draft', evaluationDecision: 'needs-review', sourceHandoffId: 'handoff-1', workspace: '/tmp/demo', task: 'draft plan' },
      { runId: 'p2', kind: 'plan', ok: true, approvalStatus: 'approved', evaluationDecision: 'accepted', workspace: '/tmp/demo', task: 'approved plan' },
      { runId: 'r1', ok: false, evaluationDecision: 'rejected', sourceHandoffId: 'handoff-3', workspace: '/tmp/demo', task: 'failed run' },
    ]);
    expect(text).toContain('Total artifacts: 3');
    expect(text).toContain('Plans: 2');
    expect(text).toContain('Approved plans: 1');
    expect(text).toContain('Failed runs: 1');
    expect(text).toContain('Accepted evaluations: 1');
    expect(text).toContain('Rejected evaluations: 1');
    expect(text).toContain('Needs-review evaluations: 1');
    expect(text).toContain('Handoff-derived artifacts: 2');
  });
});
