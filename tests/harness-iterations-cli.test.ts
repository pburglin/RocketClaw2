import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { saveIterationEntry } from '../src/harness/iteration-store.js';

const execFileAsync = promisify(execFile);

describe('harness-iterations CLI filters', () => {
  it('supports latest, failed-only, and iteration filters', async () => {
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-iter-cli-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    const runId = 'run-iter-cli';
    await fs.mkdir(appRoot, { recursive: true });

    await saveIterationEntry(runId, {
      iteration: 1,
      timestamp: 't1',
      guidance: 'first',
      filesCreated: ['a.ts'],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'boom',
    }, appRoot);
    await saveIterationEntry(runId, {
      iteration: 2,
      timestamp: 't2',
      guidance: 'second',
      filesCreated: [],
      filesModified: ['a.ts'],
      validationPassed: true,
      validationStdout: 'ok',
      validationStderr: '',
    }, appRoot);

    const latest = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'harness-iterations', '--id', runId, '--latest'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });
    expect(latest.stdout).toContain('Iteration 2 | passed=true');
    expect(latest.stdout).not.toContain('Iteration 1 | passed=false');

    const failedOnly = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'harness-iterations', '--id', runId, '--failed-only'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });
    expect(failedOnly.stdout).toContain('Iteration 1 | passed=false');
    expect(failedOnly.stdout).not.toContain('Iteration 2 | passed=true');

    const specific = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'harness-iterations', '--id', runId, '--iteration', '2'], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: homeRoot },
    });
    expect(specific.stdout).toContain('Iteration 2 | passed=true');
    expect(specific.stdout).not.toContain('Iteration 1 | passed=false');

    await fs.rm(homeRoot, { recursive: true, force: true });
  }, 15000);
});
