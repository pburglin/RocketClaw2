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

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model', retryCount: 0 } });
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('LLM provider timed out');
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('--llm-api-key "$API_KEY"');
  });

  it('emits trace events for verbose inspection', async () => {
    const traces: Array<Record<string, unknown>> = [];
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'hi there' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello', { channel: 'cli', label: 'unit test', onTrace: (event) => traces.push(event as unknown as Record<string, unknown>) });

    expect(text).toBe('hi there');
    expect(traces).toHaveLength(2);
    expect(traces[0]).toMatchObject({ phase: 'request', label: 'unit test', model: 'demo-model' });
    expect(traces[1]).toMatchObject({ phase: 'response', label: 'unit test', responseStatus: 200, extractedText: 'hi there' });
  });

  it('retries server-side payload errors before succeeding', async () => {
    const traces: Array<Record<string, unknown>> = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ error: { message: 'Provider returned error', code: 502 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'recovered response' } }] }),
      } as Response);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: (...args: any[]) => void) => {
      fn();
      return 0 as any;
    }) as any);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model', retryCount: 3 } });
    const text = await runLlmQuery(config, 'hello', { channel: 'cli', label: 'retry test', onTrace: (event) => traces.push(event as unknown as Record<string, unknown>) });

    expect(text).toBe('recovered response');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(traces.some((event) => event.phase === 'retry' && event.backoffMs === 1000)).toBe(true);
  });

  it('does not retry server-side errors when retryCount is zero', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'bad gateway',
    } as Response);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: (...args: any[]) => void) => {
      fn();
      return 0 as any;
    }) as any);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model', retryCount: 0 } });
    await expect(runLlmQuery(config, 'hello')).rejects.toThrow('LLM query failed (502)');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('can stream incremental response tokens when requested', async () => {
    const streamedChunks: string[] = [];
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"world"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue(new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    }));

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const text = await runLlmQuery(config, 'hello', {
      stream: true,
      onToken: (chunk) => streamedChunks.push(chunk),
    });

    expect(text).toBe('Hello world');
    expect(streamedChunks).toEqual(['Hello ', 'world']);
  });
});
