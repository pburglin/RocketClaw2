import { describe, expect, it } from 'vitest';
import { scoreMessageSalience } from '../src/memory/salience.js';

describe('scoreMessageSalience', () => {
  it('scores durable user preferences and decisions higher', () => {
    const high = scoreMessageSalience({
      id: '1',
      role: 'user',
      text: 'Important decision: remember this preference and plan for later',
      createdAt: new Date().toISOString(),
    });
    const low = scoreMessageSalience({
      id: '2',
      role: 'assistant',
      text: 'ok',
      createdAt: new Date().toISOString(),
    });
    expect(high).toBeGreaterThan(low);
  });
});
