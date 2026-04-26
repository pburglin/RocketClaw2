import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('harness-plan verbose CLI', () => {
  it('streams plan text in verbose mode by default with mock llm mode', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-harness-plan-verbose-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
        'src/cli.ts',
        '--llm-mode', 'mock',
        'harness-plan',
        '--workspace', workspace,
        '--task', 'Draft a plan',
        '--validate', 'npm test',
        '--verbose',
      ], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          RC2_MOCK_LLM_INITIAL_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_DELAY_MS: '0',
          RC2_MOCK_LLM_CHUNK_SIZE: '12',
        },
      });

      expect(stdout).toContain('Summary');
      expect(stdout).toContain('LLM REQUEST');
      expect(stdout).toContain('LLM STREAM');
      expect(stdout).toContain('Files to touch');
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);
});
