import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runLlmQuery } from '../src/llm/client.js';

describe('runLlmQuery', () => {
  it('throws clearly when no api key is configured', async () => {
    const config = loadConfig({});
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('No LLM API key configured');
  });

  it('returns model content when the provider responds successfully', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi there' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello');
    expect(text).toBe('hi there');
    mockFetch.mockRestore();
  });
});
