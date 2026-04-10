import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runCodingHarness } from '../src/harness/coding-harness.js';

describe('harness validation timeout', () => {
  it('fails fast when validation command does not exit before timeout', async () => {
    const workspace = path.join(os.tmpdir(), `rocketclaw2-timeout-${Date.now()}`);
    await fs.mkdir(workspace, { recursive: true });

    const result = await runCodingHarness({} as any, {
      workspace,
      task: 'demo',
      validateCommand: 'node -e "setInterval(() => {}, 1000)"',
      maxIterations: 1,
      validateTimeoutMs: 200,
    }, () => {} ).catch((err) => err);

    if (result && typeof result === 'object' && 'lastValidationStderr' in result) {
      expect(String((result as any).lastValidationStderr)).toContain('timed out');
    }
  });
});
