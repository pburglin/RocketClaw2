import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { buildLlmStatus, formatLlmStatus } from '../src/llm/status.js';

describe('llm status', () => {
  it('builds an operator-friendly llm readiness view', () => {
    const config = loadConfig({ llm: { baseUrl: 'https://example.com/v1', apiKey: 'secret', model: 'demo' } });
    const status = buildLlmStatus(config, true);
    expect(status.readyForQuery).toBe(true);
    expect(formatLlmStatus(status)).toContain('Session overrides active: yes');
  });
});
