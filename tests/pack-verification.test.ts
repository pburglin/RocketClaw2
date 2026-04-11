import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const LONG_TIMEOUT_MS = 30000;

describe('pack verification script', () => {
  it('passes against the current package dry-run artifact', async () => {
    const { stdout } = await execFileAsync('node', ['scripts/verify-pack.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    expect(stdout).toContain('Pack verification passed');
  }, LONG_TIMEOUT_MS);

  it('production build no longer emits dist/tests output', async () => {
    const { stdout } = await execFileAsync('npm', ['run', 'build'], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    expect(stdout).not.toContain('error');

    const { stdout: findStdout } = await execFileAsync('find', ['dist', '-path', '*/tests/*', '-type', 'f'], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    expect(findStdout.trim()).toBe('');
  }, LONG_TIMEOUT_MS);
});
