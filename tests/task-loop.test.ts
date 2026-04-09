import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runTaskLoop } from '../src/loops/task-loop.js';

describe('runTaskLoop', () => {
  it('can succeed when validation passes on the first iteration', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Try validating now.' } }] }),
    } as Response);

    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo-model' } });
    const result = await runTaskLoop(config, { task: 'Make tests pass', validateCommand: 'true', maxIterations: 2 });
    expect(result.ok).toBe(true);
    mockFetch.mockRestore();
  });
});
