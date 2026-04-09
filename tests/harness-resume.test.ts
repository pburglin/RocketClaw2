import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveHarnessRun } from '../src/harness/store.js';
import { harnessResume } from '../src/harness/coding-harness.js';

describe('harnessResume', () => {
  it('throws when run is not found', async () => {
    await expect(harnessResume({} as any, 'no-such-id')).rejects.toThrow('Run not found');
  });

  it('throws when run is missing required fields', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-resume-bad-${Date.now()}`);
    const { runId } = await saveHarnessRun({
      ok: false,
      workspace: '',
      task: 'task',
      iterations: 1,
      lastGuidance: '',
      lastValidationStdout: '',
      lastValidationStderr: '',
      validateCommand: '',
    }, root);

    await expect(harnessResume({} as any, runId, root)).rejects.toThrow('cannot resume');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('re-applies code blocks from the previous run before calling LLM', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-resume-files-${Date.now()}`);
    const workspace = path.join(root, 'ws');
    await fs.mkdir(workspace, { recursive: true });

    const { runId } = await saveHarnessRun({
      ok: false,
      workspace,
      task: 'task',
      iterations: 1,
      lastGuidance: '```hello.txt\nHello, world!\n```',
      lastValidationStdout: '',
      lastValidationStderr: 'not equal',
      validateCommand: 'cat hello.txt',
    }, root);

    // harnessResume re-applies code blocks before LLM call, so the file should exist after call (even if LLM subsequently fails)
    try {
      await harnessResume({} as any, runId, root);
    } catch {
      // LLM error expected without a real API key
    }

    const content = await fs.readFile(path.join(workspace, 'hello.txt'), 'utf8');
    expect(content).toBe('Hello, world!');

    await fs.rm(root, { recursive: true, force: true });
  });
});
