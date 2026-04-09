import { describe, expect, it } from 'vitest';
import { explainLlmError } from '../src/llm/errors.js';

describe('explainLlmError', () => {
  it('produces a friendly auth failure explanation', () => {
    const text = explainLlmError(401, '{"error":{"message":"User not found."}}');
    expect(text).toContain('LLM authentication failed');
    expect(text).toContain('wrong API key');
    expect(text).toContain('Retry with explicit session overrides');
  });
});
