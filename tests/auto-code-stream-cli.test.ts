import { describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function startMockLlmServer() {
  const requests: Array<Record<string, unknown>> = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      requests.push(parsed);
      if (parsed.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write('data: {"choices":[{"delta":{"content":"Summary\\n\\n"}}]}\n\n');
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

      expect(stdout).toBe('');
      expect(stderr).toContain('Streaming model output (plan generation)');
      expect(stderr).toContain('Files to touch');
      expect(requests.some((request) => request.stream === true)).toBe(true);
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }, 20000);
});
