import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun } from '../src/harness/store.js';

describe('saveHarnessRun', () => {
  it('writes a persistent harness run artifact', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-harness-${Date.now()}`);
    const saved = await saveHarnessRun({
      ok: true,
      workspace: '/tmp/demo',
      task: 'demo task',
      iterations: 1,
      lastGuidance: 'do the thing',
      lastValidationStdout: 'ok',
      lastValidationStderr: '',
      validateCommand: 'echo done',
    }, root);
    const raw = await fs.readFile(saved.path, 'utf8');
    expect(raw).toContain('demo task');
    await fs.rm(root, { recursive: true, force: true });
  });
});
