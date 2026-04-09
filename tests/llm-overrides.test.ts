import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { applySessionOverrides } from '../src/config/session-overrides.js';

describe('session-scoped llm overrides', () => {
  it('applies CLI LLM overrides without mutating the base config object', () => {
    const base = loadConfig({});
    const next = applySessionOverrides(base, {
      llmBaseUrl: 'https://example.com/v1',
      llmApiKey: 'secret',
      llmModel: 'custom-model',
    });
    expect(next.llm.baseUrl).toBe('https://example.com/v1');
    expect(next.llm.apiKey).toBe('secret');
    expect(next.llm.model).toBe('custom-model');
    expect(base.llm.baseUrl).not.toBe('https://example.com/v1');
  });
});
