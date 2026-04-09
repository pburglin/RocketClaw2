import { describe, expect, it } from 'vitest';
import { describeApprovalNextStep, formatApprovals, formatApprovalSummary } from '../src/approval/formatters.js';

describe('approval next-step hints', () => {
  it('adds next-step hints to approval views', () => {
    const item = { id: '1', kind: 'message-send' as const, target: 'whatsapp', detail: 'Send report', status: 'pending' as const, createdAt: 't1' };
    expect(describeApprovalNextStep(item)).toContain('Resolve approval');
    expect(formatApprovals([item])).toContain('next:');
    expect(formatApprovalSummary([item])).toContain('Pending next steps');
  });

  it('shows exact harness-run commands for harness-plan approvals', () => {
    const pending = { id: '1', kind: 'harness-plan' as const, target: 'run-123', detail: 'Review plan', status: 'pending' as const, createdAt: 't1' };
    const approved = { id: '2', kind: 'harness-plan' as const, target: 'run-456', detail: 'Review plan', status: 'approved' as const, createdAt: 't2' };
    expect(describeApprovalNextStep(pending)).toBe('Resolve approval, then run: rocketclaw2 harness-run --id run-123 --require-approved-plan');
    expect(describeApprovalNextStep(approved)).toBe('Run: rocketclaw2 harness-run --id run-456 --require-approved-plan');
  });
});
