import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const execFileAsync = promisify(execFile);

describe('harness-run require-approved-plan mode', () => {
  it('rejects direct harness-run when strict mode is requested', async () => {
    const cli = path.join(process.cwd(), 'dist', 'src', 'cli.js');
    try {
      await execFileAsync('node', [cli, 'harness-run', '--workspace', '/tmp/rc2', '--task', 'demo', '--validate', 'npm test', '--require-approved-plan']);
      throw new Error('expected harness-run strict mode to fail');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      expect(msg).toContain('require-approved-plan');
      expect(msg).toContain('auto-code --no-auto-approve');
      expect(msg).toContain('harness-run --id <plan-id>');
    }
  });

  it('accepts --id in strict mode and fails only on plan approval state', async () => {
    const cli = path.join(process.cwd(), 'dist', 'src', 'cli.js');
    const homeRoot = path.join(os.tmpdir(), `rocketclaw2-harness-run-approved-plan-home-${Date.now()}`);
    const appRoot = path.join(homeRoot, '.rocketclaw2');
    await fs.mkdir(path.join(appRoot, 'harness-runs'), { recursive: true });
    await fs.writeFile(
      path.join(appRoot, 'harness-runs', 'plan-1.json'),
      JSON.stringify({
        runId: 'plan-1',
        kind: 'plan',
        ok: true,
        approvalStatus: 'draft',
        workspace: '/tmp/rc2',
        task: 'demo',
        validateCommand: 'npm test',
        planText: 'Summary',
      }, null, 2),
    );

    try {
      await execFileAsync('node', [cli, 'harness-run', '--id', 'plan-1', '--require-approved-plan'], {
        env: { ...process.env, HOME: homeRoot },
      });
      throw new Error('expected harness-run with draft plan to fail');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      expect(msg).toContain('Harness plan plan-1 is not approved');
    }

    try {
      await execFileAsync('node', [cli, 'harness-run', '-', '-id', 'plan-1', '--require-approved-plan'], {
        env: { ...process.env, HOME: homeRoot },
      });
      throw new Error('expected harness-run with malformed pasted option to fail on plan approval state');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      expect(msg).toContain('Harness plan plan-1 is not approved');
      expect(msg).not.toContain('unknown option');
    }

    await fs.rm(homeRoot, { recursive: true, force: true });
  });
});
