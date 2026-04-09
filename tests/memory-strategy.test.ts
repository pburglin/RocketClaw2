import { describe, expect, it } from 'vitest';
import { getMemoryStrategy } from '../src/memory/strategy.js';

describe('getMemoryStrategy', () => {
  it('includes dreaming loop steps', () => {
    const strategy = getMemoryStrategy();
    expect(strategy.dreamingLoop.length).toBeGreaterThan(2);
    expect(strategy.tiers.map((tier) => tier.name)).toContain('semantic-memory');
  });
});
