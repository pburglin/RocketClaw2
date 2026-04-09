import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApprovalRequest } from '../src/approval/store.js';
import { approveAndDescribeNextStep } from '../src/approval/runtime.js';

describe('approveAndDescribeNextStep', () => {
  it('approves a request and returns a next-step hint', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-approval-run-${Date.now()}`);
    const item = await createApprovalRequest({ kind: 'tool-write', target: 'file-management', detail: 'Need write access' }, root);
    const result = await approveAndDescribeNextStep(item.id, root);
    expect(result.status).toBe('approved');
    expect(result.nextStep).toContain('Re-run');
    await fs.rm(root, { recursive: true, force: true });
  });
});
