import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConfig } from '../src/config/load-config.js';
import { buildLlmStatus, formatLlmStatus } from '../src/llm/status.js';

const execFileAsync = promisify(execFile);

describe('llm status', () => {
  it('builds an operator-friendly llm readiness view', () => {
    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo', retryCount: 7 } });
    const status = buildLlmStatus(config, true);
    expect(status.readyForQuery).toBe(true);
    expect(status.retryCount).toBe(7);
    expect(formatLlmStatus(status)).toContain('Server-error retry count: 7');
    expect(formatLlmStatus(status)).toContain('Session overrides active: yes');
  });

  it('treats mock mode as ready without requiring an api key in the config object', () => {
    const config = loadConfig({ llm: { mode: 'mock', baseUrl: 'https://example.com/v1', model: 'demo', retryCount: 3 } });
    const status = buildLlmStatus(config, true);
    expect(status.mode).toBe('mock');
    expect(status.apiKeyConfigured).toBe(false);
    expect(status.readyForQuery).toBe(true);
  });

  it('prints retry count from CLI overrides', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', ['src/cli.ts', '--llm-retry-count', '13', 'llm-status'], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('LLM Status');
    expect(stdout).toContain('Server-error retry count: 13');
  }, 15000);

  it('reports readiness when explicit CLI overrides include an API key', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      '--llm-base-url', 'https://example.com/v1',
      '--llm-api-key', 'demo-key',
      '--llm-model', 'demo-model',
      'llm-status',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('Base URL: https://example.com/v1');
    expect(stdout).toContain('Model: demo-model');
    expect(stdout).toContain('API key configured: yes');
    expect(stdout).toContain('Ready for query: yes');
  }, 15000);

  it('treats mock mode as ready in the CLI output', async () => {
    const { stdout } = await execFileAsync('./node_modules/.bin/tsx', [
      'src/cli.ts',
      '--llm-mode', 'mock',
      '--llm-model', 'demo-model',
      'llm-status',
    ], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    expect(stdout).toContain('Mode: mock');
    expect(stdout).toContain('Model: demo-model');
    expect(stdout).toContain('Ready for query: yes');
  }, 15000);
});
