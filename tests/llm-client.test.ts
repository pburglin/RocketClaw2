import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runLlmQuery } from '../src/llm/client.js';

describe('runLlmQuery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws clearly when no api key is configured', async () => {
    const config = loadConfig({});
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('No LLM API key configured');
  });

  it('returns model content when the provider responds successfully', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi there' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello');
    expect(text).toBe('hi there');
  });

  it('extracts text when message content is returned as structured parts', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: [{ type: 'text', text: 'part one' }, { type: 'output_text', text: 'part two' }] } }],
      }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello');
    expect(text).toContain('part one');
    expect(text).toContain('part two');
  });

  it('extracts text from responses-style output_text payloads', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: 'hello from responses api' }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello');
    expect(text).toBe('hello from responses api');
  });

  it('surfaces wrapped provider timeout payloads clearly', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: 'Provider returned error', code: 524 } }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('LLM provider timed out');
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('--llm-api-key "$API_KEY"');
  });
});
