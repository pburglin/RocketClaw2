import { describe, expect, it } from 'vitest';
import { formatPendingApprovalActions } from '../src/approval/formatters.js';

describe('formatPendingApprovalActions', () => {
  it('shows only pending actionable approvals', () => {
    const text = formatPendingApprovalActions([
      { id: '1', kind: 'tool-write' as const, target: 'file-management', detail: 'Need write', status: 'pending' as const, createdAt: 't1' },
      { id: '2', kind: 'message-send' as const, target: 'whatsapp', detail: 'Need send', status: 'approved' as const, createdAt: 't2' },
    ]);
    expect(text).toContain('file-management');
    expect(text).not.toContain('whatsapp');
  });
});
