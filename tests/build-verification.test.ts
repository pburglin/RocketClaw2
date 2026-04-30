import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';

const execFileAsync = promisify(execFile);

describe('build verification script', () => {
  it('passes after a real build and checks the canonical CLI entrypoint', async () => {
    const root = process.cwd();
    const builtCliPath = path.join(root, 'dist', 'src', 'cli.js');

    try {
      await fs.access(builtCliPath);
    } catch {
      const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      await execFileAsync(npmCommand, ['run', 'build'], { cwd: root, env: { ...process.env } });
    }

    const { stdout } = await execFileAsync('node', ['scripts/verify-build.mjs'], {
      cwd: root,
      env: { ...process.env },
    });

    const mode = (await fs.stat(builtCliPath)).mode & 0o777;
    expect(mode & 0o111).not.toBe(0);
    expect(stdout).toContain('Build verification passed');
  }, 20000);
});
