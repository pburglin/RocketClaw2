import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { saveIterationEntry, loadIterationEntries } from '../src/harness/iteration-store.js';

describe('harness iteration store', () => {
  it('saves and loads iteration entries', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-iter-${Date.now()}`);
    const runId = 'test-run-1';
    await saveIterationEntry(runId, {
      iteration: 1,
      timestamp: new Date().toISOString(),
      guidance: 'Create index.js',
      filesCreated: ['index.js'],
      filesModified: [],
      validationPassed: false,
      validationStdout: 'no test runner yet',
      validationStderr: '',
    }, root);
    const entries = await loadIterationEntries(runId, root);
    expect(entries).toHaveLength(1);
    expect(entries[0].iteration).toBe(1);
    expect(entries[0].filesCreated).toContain('index.js');
    await fs.rm(root, { recursive: true, force: true });
  });
});
