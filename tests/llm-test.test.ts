import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runLlmTest } from '../src/llm/test.js';

describe('runLlmTest', () => {
  it('returns ok when the model replies with LLM_OK', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'LLM_OK' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const result = await runLlmTest(config);
    expect(result.ok).toBe(true);
    mockFetch.mockRestore();
  });
});
