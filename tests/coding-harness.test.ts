import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runCodingHarness } from '../src/harness/coding-harness.js';

describe('runCodingHarness', () => {
  it('can complete when validation succeeds', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Try the validation now.' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const result = await runCodingHarness(config, {
      workspace: process.cwd(),
      task: 'Make validation pass',
      validateCommand: 'true',
      maxIterations: 2,
    });
    expect(result.ok).toBe(true);
    mockFetch.mockRestore();
  });
});
