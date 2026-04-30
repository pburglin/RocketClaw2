import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('built-in-skills CLI', () => {
  it('prints the roadmap summary and supports filtering to one skill', async () => {
    const summary = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'built-in-skills'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(summary.stdout).toContain('RocketClaw2 Built-in Skills');
    expect(summary.stdout).toContain('Recommended implementation order:');

    const detail = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'built-in-skills', '--skill', 'world-model'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(detail.stdout).toContain('World Model');
    expect(detail.stdout).not.toContain('Recommended implementation order:');
  }, 15000);
});
