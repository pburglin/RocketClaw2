import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('system-summary CLI', () => {
  it('prints the summary without unrelated strict-mode guard failures', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', '--llm-retry-count', '11', 'system-summary'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('Profile:');
    expect(stdout).toContain('retryCount=11');
  }, 15000);
});
