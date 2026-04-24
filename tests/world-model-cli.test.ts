import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('world-model CLI', () => {
  it('prints the world-model snapshot', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', 'world-model'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('RocketClaw2 World Model');
    expect(stdout).toContain('Active goal:');
  }, 15000);
});
