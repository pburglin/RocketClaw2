import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun } from '../src/harness/store.js';
import { runCodingHarnessFromPlan } from '../src/harness/coding-harness.js';

describe('runCodingHarnessFromPlan', () => {
  it('rejects non-plan artifacts', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-run-plan-${Date.now()}`);
    const saved = await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'demo',
      iterations: 1,
      lastGuidance: '',
      lastValidationStdout: '',
      lastValidationStderr: '',
      validateCommand: 'npm test',
    }, root);
    await expect(runCodingHarnessFromPlan({} as any, saved.runId, root)).rejects.toThrow('not a plan');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('rejects unapproved plans', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-run-plan-draft-${Date.now()}`);
    const saved = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      approvalStatus: 'draft',
      workspace: '/tmp/demo',
      task: 'demo',
      validateCommand: 'npm test',
      planText: 'Summary',
    }, root);
    await expect(runCodingHarnessFromPlan({} as any, saved.runId, root)).rejects.toThrow('not approved');
    await fs.rm(root, { recursive: true, force: true });
  });
});
