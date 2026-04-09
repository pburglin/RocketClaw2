import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun } from '../src/harness/store.js';
import { saveIterationEntry, loadIterationEntries } from '../src/harness/iteration-store.js';

describe('harness full inspection data', () => {
  it('loads per-iteration entries for a run id', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-show-full-${Date.now()}`);
    const saved = await saveHarnessRun({
      ok: false,
      workspace: '/tmp/demo',
      task: 'demo task',
      iterations: 2,
      lastGuidance: 'retry please',
      lastValidationStdout: '',
      lastValidationStderr: 'boom',
      validateCommand: 'npm test',
      runId: 'demo-run-1',
    }, root, 'demo-run-1');

    await saveIterationEntry(saved.runId, {
      iteration: 1,
      timestamp: new Date().toISOString(),
      guidance: 'create package.json',
      criticInsight: 'missing package.json',
      filesCreated: ['package.json'],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'npm ERR',
    }, root);

    const iterations = await loadIterationEntries(saved.runId, root);
    expect(iterations).toHaveLength(1);
    expect(iterations[0].criticInsight).toBe('missing package.json');

    await fs.rm(root, { recursive: true, force: true });
  });
});
