import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApprovalRequest, loadApprovals, resolveApprovalRequest } from '../src/approval/store.js';

describe('approval workflow', () => {
  it('creates and resolves persistent approval requests', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-approval-${Date.now()}`);
    const item = await createApprovalRequest({ kind: 'message-send', target: 'whatsapp', detail: 'Send daily report' }, root);
    const loaded = await loadApprovals(root);
    expect(loaded).toHaveLength(1);
    const resolved = await resolveApprovalRequest(item.id, 'approved', root);
    expect(resolved.status).toBe('approved');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('supports harness-plan approval requests', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-approval-harness-${Date.now()}`);
    const item = await createApprovalRequest({ kind: 'harness-plan', target: 'run-123', detail: 'Review harness plan' }, root);
    expect(item.kind).toBe('harness-plan');
    const resolved = await resolveApprovalRequest(item.id, 'approved', root);
    expect(resolved.status).toBe('approved');
    await fs.rm(root, { recursive: true, force: true });
  });
});
