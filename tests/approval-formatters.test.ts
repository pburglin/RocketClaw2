import { describe, expect, it } from 'vitest';
import { formatApprovals, formatApprovalSummary } from '../src/approval/formatters.js';

describe('approval formatters', () => {
  it('formats approval lists and summaries for operators', () => {
    const items = [
      { id: '1', kind: 'tool-write' as const, target: 'file-management', detail: 'Need write', status: 'pending' as const, createdAt: 't1' },
      { id: '2', kind: 'message-send' as const, target: 'whatsapp', detail: 'Need send', status: 'approved' as const, createdAt: 't2' },
    ];
    expect(formatApprovals(items)).toContain('file-management');
    expect(formatApprovalSummary(items)).toContain('Pending: 1');
  });
});
