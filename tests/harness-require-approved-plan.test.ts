import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

describe('harness-run require-approved-plan mode', () => {
  it('rejects direct harness-run when strict mode is requested', async () => {
    const cli = path.join(process.cwd(), 'dist', 'src', 'cli.js');
    await expect(execFileAsync('node', [cli, 'harness-run', '--workspace', '/tmp/rc2', '--task', 'demo', '--validate', 'npm test', '--require-approved-plan'])).rejects.toThrow('require-approved-plan mode');
  });
});
