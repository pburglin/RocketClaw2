import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadHarnessRunnableInput, saveHarnessRun } from '../src/harness/store.js';

describe('loadHarnessRunnableInput', () => {
  it('loads runnable input from a saved plan artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-runnable-plan-${Date.now()}`);
    const saved = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      workspace: '/tmp/demo',
      task: 'ship feature',
      validateCommand: 'npm test',
      planText: 'Summary\n- do work',
    }, root);

    const result = await loadHarnessRunnableInput(saved.runId, root);
    expect(result).toEqual({ workspace: '/tmp/demo', task: 'ship feature', validateCommand: 'npm test' });
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns null when artifact is incomplete', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-runnable-bad-${Date.now()}`);
    const saved = await saveHarnessRun({
      kind: 'plan',
      ok: true,
      workspace: '',
      task: 'ship feature',
      validateCommand: 'npm test',
      planText: 'Summary',
    }, root);

    const result = await loadHarnessRunnableInput(saved.runId, root);
    expect(result).toBeNull();
    await fs.rm(root, { recursive: true, force: true });
  });
});
