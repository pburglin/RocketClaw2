import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
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
      requests.push(JSON.parse(body));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: 'LLM_OK\nsecond line' } }] }));
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

describe('LLM CLI overrides', () => {
  afterEach(() => {
    // no-op placeholder to keep vitest happy if future cleanup hooks are added
  });

  it('lets llm-test and llm-query use explicit session overrides', async () => {
    const { server, baseUrl, requests } = await startMockLlmServer();
    try {
      const llmTest = await execFileAsync('./node_modules/.bin/tsx', [
        'src/cli.ts',
        '--llm-base-url', baseUrl,
        '--llm-api-key', 'demo-key',
        '--llm-model', 'demo-model',
        'llm-test',
      ], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      expect(llmTest.stdout).toContain('"ok": true');
      expect(llmTest.stdout).toContain('"model": "demo-model"');

      const llmQuery = await execFileAsync('./node_modules/.bin/tsx', [
        'src/cli.ts',
        '--llm-base-url', baseUrl,
        '--llm-api-key', 'demo-key',
        '--llm-model', 'demo-model',
        'llm-query',
        '--prompt', 'First line\nSecond line',
        '--verbose',
        '--timestamps',
      ], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      expect(llmQuery.stdout).toContain('LLM_OK');
      expect(llmQuery.stderr).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
      expect(llmQuery.stderr).toContain('Prompt text');
      expect(llmQuery.stderr).toContain('First line\nSecond line');
      expect(llmQuery.stderr).not.toContain('First line\\nSecond line');
      expect(requests).toHaveLength(2);
      expect(requests[1]?.messages).toEqual([{ role: 'user', content: 'First line\nSecond line' }]);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }, 20000);
});
