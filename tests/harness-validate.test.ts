import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun } from '../src/harness/store.js';
import { replayHarnessValidation } from '../src/harness/coding-harness.js';

describe('harness-validate', () => {
  it('replays validation and returns passed=true when validateCommand succeeds', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-hv-ok-${Date.now()}`);
    const workspace = path.join(root, 'ws');
    await fs.mkdir(workspace, { recursive: true });

    const { runId } = await saveHarnessRun({
      ok: true,
      workspace,
      task: 'create a hello.txt file',
      iterations: 1,
      lastGuidance: 'Create a greeting.\n\n```hello.txt\nHello, world!\n```',
      lastValidationStdout: '',
      lastValidationStderr: '',
      validateCommand: 'test "$(cat hello.txt)" = "Hello, world!"',
    }, root);

    const result = await replayHarnessValidation(runId, root);
    expect(result.passed).toBe(true);
    expect(result.codeBlocksApplied).toBe(1);
    expect(result.error).toBeUndefined();

    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns passed=false when validateCommand fails', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-hv-fail-${Date.now()}`);
    const workspace = path.join(root, 'ws');
    await fs.mkdir(workspace, { recursive: true });

    const { runId } = await saveHarnessRun({
      ok: false,
      workspace,
      task: 'impossible task',
      iterations: 3,
      lastGuidance: '```README.md\nThis will not work.\n```',
      lastValidationStdout: '',
      lastValidationStderr: 'validation failed',
      validateCommand: 'exit 1',
    }, root);

    const result = await replayHarnessValidation(runId, root);
    expect(result.passed).toBe(false);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns an error when run is not found', async () => {
    const result = await replayHarnessValidation('does-not-exist');
    expect(result.passed).toBe(false);
    expect(result.error).toContain('Run not found');
  });
});
