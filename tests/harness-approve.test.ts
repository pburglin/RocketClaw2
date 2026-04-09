import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { approveHarnessPlan, loadHarnessRunnableInput, saveHarnessRun } from '../src/harness/store.js';

describe('approveHarnessPlan', () => {
  it('marks a draft plan as approved', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-harness-approve-${Date.now()}`);
    const saved = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'ship feature',
      validateCommand: 'npm test',
      planText: 'Summary',
    }, root);

    const updated = await approveHarnessPlan(saved.runId, root);
    expect(updated.approvalStatus).toBe('approved');
    expect(typeof updated.approvedAt).toBe('string');

    const runnable = await loadHarnessRunnableInput(saved.runId, root);
    expect(runnable?.approvalStatus).toBe('approved');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects approving a non-plan artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-harness-approve-bad-${Date.now()}`);
    const saved = await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'ship feature',
      iterations: 1,
      lastGuidance: '',
      lastValidationStdout: '',
      lastValidationStderr: '',
      validateCommand: 'npm test',
    }, root);

    await expect(approveHarnessPlan(saved.runId, root)).rejects.toThrow('not a plan');
    await fs.rm(root, { recursive: true, force: true });
  });
});
