import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runLlmQuery } from '../src/llm/client.js';

describe('chat llm integration primitives', () => {
  it('can use the llm client to answer with memory-aware prompting', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Pedro prefers WhatsApp for updates.' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'Memory context:\nPedro prefers WhatsApp for updates.\n\nUser message:\nWhat do you remember about messaging?');
    expect(text).toContain('WhatsApp');
    mockFetch.mockRestore();
  });
});
