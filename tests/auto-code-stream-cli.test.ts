import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function stripAnsi(text: string) {
  return text
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/\r/g, '\n');
}

async function runCli(args: string[], env: NodeJS.ProcessEnv) {
  try {
    const result = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', ...args], {
      cwd: process.cwd(),
      env,
      maxBuffer: 1024 * 1024 * 8,
    });
    return { stdout: result.stdout, stderr: result.stderr, code: 0 };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', code: err.code ?? 1 };
  }
}

describe('auto-code CLI streaming', () => {
  it('streams plan generation text without requiring --verbose', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-stream-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      const { stdout, stderr, code } = await runCli([
        '--llm-mode', 'mock',
        'auto-code',
        '--workspace', workspace,
        '--task', 'Draft a plan',
        '--validate', 'npm test',
        '--no-auto-approve',
      ], {
        ...process.env,
        RC2_MOCK_LLM_INITIAL_DELAY_MS: '0',
        RC2_MOCK_LLM_CHUNK_DELAY_MS: '0',
      });

      expect(code).toBe(1);
      expect(stdout).toContain('Files to touch');
      expect(stderr).toContain('Streaming model output (plan generation)');
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);

  it('keeps waiting-status lines separate from streamed content', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-status-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      const { stdout, stderr, code } = await runCli([
        '--llm-mode', 'mock',
        'auto-code',
        '--workspace', workspace,
        '--task', 'Draft a plan',
        '--validate', 'npm test',
        '--no-auto-approve',
      ], {
        ...process.env,
        RC2_LLM_WAIT_UPDATE_MS: '30',
        RC2_MOCK_LLM_INITIAL_DELAY_MS: '120',
        RC2_MOCK_LLM_CHUNK_DELAY_MS: '60',
        RC2_MOCK_LLM_CHUNK_SIZE: '12',
      });

      const stderrLines = stripAnsi(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
      const mixedLine = stderrLines.find((line) => line.includes('AI is thinking') && (line.includes('Summary') || line.includes('Files to touch') || line.includes('Validation') || line.includes('Risks')));

      expect(code).toBe(1);
      expect(stderrLines.some((line) => line.includes('AI is thinking'))).toBe(true);
      expect(stdout).toContain('Summary');
      expect(stdout).toContain('Files to touch');
      expect(mixedLine).toBeUndefined();
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);

  it('keeps waiting-status lines separate from streamed content in verbose mode too', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-verbose-status-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      const { stdout, stderr, code } = await runCli([
        '--llm-mode', 'mock',
        'auto-code',
        '--workspace', workspace,
        '--task', 'Draft a plan',
        '--validate', 'npm test',
        '--no-auto-approve',
        '--verbose',
      ], {
        ...process.env,
        RC2_LLM_WAIT_UPDATE_MS: '30',
        RC2_MOCK_LLM_INITIAL_DELAY_MS: '120',
        RC2_MOCK_LLM_CHUNK_DELAY_MS: '60',
        RC2_MOCK_LLM_CHUNK_SIZE: '12',
      });

      const stderrLines = stripAnsi(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
      const mixedLine = stderrLines.find((line) => line.includes('AI is thinking') && (line.includes('Summary') || line.includes('Files to touch') || line.includes('Validation') || line.includes('Risks')));

      expect(code).toBe(1);
      expect(stdout).toContain('LLM REQUEST');
      expect(stderrLines.some((line) => line.includes('AI is thinking'))).toBe(true);
      expect(stdout).toContain('Summary');
      expect(stdout).toContain('Files to touch');
      expect(mixedLine).toBeUndefined();
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }, 20000);
});
