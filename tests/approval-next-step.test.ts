import { describe, expect, it } from 'vitest';
import { describeApprovalNextStep, formatApprovals, formatApprovalSummary } from '../src/approval/formatters.js';

describe('approval next-step hints', () => {
  it('adds next-step hints to approval views', () => {
    const item = { id: '1', kind: 'message-send' as const, target: 'whatsapp', detail: 'Send report', status: 'pending' as const, createdAt: 't1' };
    expect(describeApprovalNextStep(item)).toContain('Resolve approval');
    expect(formatApprovals([item])).toContain('next:');
    expect(formatApprovalSummary([item])).toContain('Pending next steps');
  });
});
