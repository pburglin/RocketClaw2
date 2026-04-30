import { describe, expect, it } from 'vitest';
import { describeHarnessNextStep, formatHarnessGuidanceView, formatHarnessLineageView, formatHarnessPlanView, formatHarnessValidationView } from '../src/harness/formatters.js';

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
    expect(text).toContain('Next: Re-validate if needed');
  });

  it('formats a plan-only view', () => {
    const text = formatHarnessPlanView({ runId: 'plan-1', kind: 'plan', approvalStatus: 'draft', sourceHandoffId: 'handoff-3', sourceHandoffChain: ['handoff-1', 'handoff-3'], evaluationDecision: 'needs-review', validateCommand: 'npm test', planText: 'Summary\n- do thing' });
    expect(text).toContain('Approval: draft');
    expect(text).toContain('Source handoff: handoff-3');
    expect(text).toContain('Source handoff chain: handoff-1 -> handoff-3');
    expect(text).toContain('Evaluation decision: needs-review');
    expect(text).toContain('Next: Approve plan: rocketclaw2 harness-approve --id plan-1');
    expect(text).toContain('Summary');
  });

  it('describes next steps for failed runs and approved plans', () => {
    expect(describeHarnessNextStep({ runId: 'run-1', ok: false })).toContain('harness-resume --id run-1');
    expect(describeHarnessNextStep({ runId: 'plan-2', kind: 'plan', approvalStatus: 'approved' })).toContain('harness-run --id plan-2 --require-approved-plan');
  });

  it('formats a lineage view', () => {
    const text = formatHarnessLineageView({ runId: 'run-3', executedPlanId: 'plan-9', resumedFrom: 'run-2', approvalRequestId: 'apr-1', approvalStatus: 'approved', sourceHandoffId: 'handoff-7', sourceHandoffChain: ['handoff-1', 'handoff-4', 'handoff-7'], evaluationDecision: 'accepted', evaluationNote: 'Looks good after review.', evaluationHistory: [{ decision: 'needs-review' }, { decision: 'accepted' }], evaluatedAt: '2026-04-29T14:45:00.000Z', ok: false });
    expect(text).toContain('Executed plan: plan-9');
    expect(text).toContain('Resumed from: run-2');
    expect(text).toContain('Approval request: apr-1');
    expect(text).toContain('Source handoff: handoff-7');
    expect(text).toContain('Source handoff chain: handoff-1 -> handoff-4 -> handoff-7');
    expect(text).toContain('Evaluation decision: accepted');
    expect(text).toContain('Evaluation note: Looks good after review.');
    expect(text).toContain('Evaluation history entries: 2');
  });
});
