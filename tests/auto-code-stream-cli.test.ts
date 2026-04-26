import { describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripAnsi(text: string) {
  return text
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/\r/g, '\n');
}

function startMockLlmServer(options: { chunkDelayMs?: number } = {}) {
  const requests: Array<Record<string, unknown>> = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', async () => {
      const parsed = JSON.parse(body);
      requests.push(parsed);
      if (parsed.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write('data: {"choices":[{"delta":{"content":"Summary\\n\\n"}}]}\n\n');
        if (options.chunkDelayMs) {
          await sleep(options.chunkDelayMs);
        }
        res.write('data: {"choices":[{"delta":{"content":"Files to touch\\n- package.json\\n\\nValidation\\n- npm test\\n\\nRisks\\n- none"}}]}\n\n');
        res.end('data: [DONE]\n\n');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: 'Summary\n\nFiles to touch\n- package.json\n\nValidation\n- npm test\n\nRisks\n- none' } }] }));
    });
  });

  return new Promise<{ server: ReturnType<typeof createServer>; baseUrl: string; requests: Array<Record<string, unknown>> }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}`, requests });
    });
  });
}

describe('auto-code CLI streaming', () => {
  it('streams plan generation text without requiring --verbose', async () => {
    const { server, baseUrl, requests } = await startMockLlmServer();
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-stream-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      let stdout = '';
      let stderr = '';
      try {
        await execFileAsync('./node_modules/.bin/tsx', [
          'src/cli.ts',
          '--llm-base-url', baseUrl,
          '--llm-api-key', 'demo-key',
          '--llm-model', 'demo-model',
          'auto-code',
          '--workspace', workspace,
          '--task', 'Draft a plan',
          '--validate', 'npm test',
          '--no-auto-approve',
        ], {
          cwd: process.cwd(),
          env: { ...process.env },
        });
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string };
        stdout = err.stdout ?? '';
        stderr = err.stderr ?? '';
      }

      expect(stdout).toContain('Files to touch');
      expect(stderr).toContain('Streaming model output (plan generation)');
      expect(stderr).toContain('Files to touch');
      expect(requests.some((request) => request.stream === true)).toBe(true);
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }, 20000);

  it('keeps waiting-status lines separate from streamed content', async () => {
    const { server, baseUrl } = await startMockLlmServer({ chunkDelayMs: 120 });
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-status-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      let stderr = '';
      try {
        await execFileAsync('./node_modules/.bin/tsx', [
          'src/cli.ts',
          '--llm-base-url', baseUrl,
          '--llm-api-key', 'demo-key',
          '--llm-model', 'demo-model',
          'auto-code',
          '--workspace', workspace,
          '--task', 'Draft a plan',
          '--validate', 'npm test',
          '--no-auto-approve',
        ], {
          cwd: process.cwd(),
          env: { ...process.env, RC2_LLM_WAIT_UPDATE_MS: '30' },
        });
      } catch (error) {
        stderr = (error as { stderr?: string }).stderr ?? '';
      }

      const lines = stripAnsi(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
      const mixedLine = lines.find((line) => line.includes('AI is thinking') && (line.includes('Summary') || line.includes('Files to touch') || line.includes('Validation') || line.includes('Risks')));

      expect(lines.some((line) => line.includes('AI is thinking'))).toBe(true);
      expect(lines.some((line) => line === 'Summary' || line.includes('Files to touch'))).toBe(true);
      expect(mixedLine).toBeUndefined();
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }, 20000);

  it('keeps waiting-status lines separate from streamed content in verbose mode too', async () => {
    const { server, baseUrl } = await startMockLlmServer({ chunkDelayMs: 120 });
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'rocketclaw2-auto-code-verbose-status-'));
    try {
      await fs.writeFile(path.join(workspace, 'package.json'), '{"name":"demo"}\n', 'utf8');

      let stderr = '';
      try {
        await execFileAsync('./node_modules/.bin/tsx', [
          'src/cli.ts',
          '--llm-base-url', baseUrl,
          '--llm-api-key', 'demo-key',
          '--llm-model', 'demo-model',
          'auto-code',
          '--workspace', workspace,
          '--task', 'Draft a plan',
          '--validate', 'npm test',
          '--no-auto-approve',
          '--verbose',
        ], {
          cwd: process.cwd(),
          env: { ...process.env, RC2_LLM_WAIT_UPDATE_MS: '30' },
        });
      } catch (error) {
        stderr = (error as { stderr?: string }).stderr ?? '';
      }

      const lines = stripAnsi(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
      const mixedLine = lines.find((line) => line.includes('AI is thinking') && (line.includes('Summary') || line.includes('Files to touch') || line.includes('Validation') || line.includes('Risks')));

      expect(lines.some((line) => line.includes('LLM REQUEST'))).toBe(true);
      expect(lines.some((line) => line.includes('AI is thinking'))).toBe(true);
      expect(lines.some((line) => line === 'Summary' || line.includes('Files to touch'))).toBe(true);
      expect(mixedLine).toBeUndefined();
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }, 20000);
});
