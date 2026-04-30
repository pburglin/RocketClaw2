import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function hasScriptCommand() {
  try {
    await execFileAsync('script', ['-q', '/dev/null', 'true']);
    return true;
  } catch {
    return false;
  }
}

function stripTerminalNoise(text: string) {
  return text
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\r/g, '\n');
}

describe('auto-code PTY footer rendering', () => {
  it('keeps streamed mock LLM text contiguous while showing waiting status in a real PTY', async () => {
    if (!(await hasScriptCommand())) {
      return;
    }

    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-pty-'));
    const transcriptPath = path.join(os.tmpdir(), `rocketclaw2-auto-code-pty-${Date.now()}.log`);
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');
      const command = [
        'env',
        'RC2_NO_ANIMATION=1',
        'RC2_LLM_WAIT_UPDATE_MS=30',
        'RC2_MOCK_LLM_INITIAL_DELAY_MS=200',
        'RC2_MOCK_LLM_CHUNK_DELAY_MS=80',
        'RC2_MOCK_LLM_CHUNK_SIZE=10',
        './node_modules/.bin/tsx',
        'src/cli.ts',
        '--llm-mode',
        'mock',
        'auto-code',
        '--workspace',
        workspace,
        '--task',
        'Draft a plan',
        '--validate',
        'npm test',
        '--no-auto-approve',
      ].join(' ');

      try {
        await execFileAsync('script', ['-q', transcriptPath, 'bash', '-lc', `cd ${process.cwd()} && ${command}`], {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 8,
        });
      } catch {
        // auto-code --no-auto-approve exits non-zero; transcript still captures the session
      }

      const raw = await fs.readFile(transcriptPath, 'utf8');
      const visible = stripTerminalNoise(raw);
      expect(visible).toContain('Streaming model output');
      expect(visible).toContain('AI is thinking');
      expect(visible).toContain('Summary\n\nFiles to touch\n- package.json\n\nValidation\n- npm test\n\nRisks\n- none');
      expect(visible).not.toContain('F[s');
      expect(visible).not.toContain('uiles to to');
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
      await fs.rm(transcriptPath, { force: true });
    }
  }, 30000);
});
