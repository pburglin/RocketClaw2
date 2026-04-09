import { describe, expect, it } from 'vitest';
import { formatRecallHits, formatRecallSummary } from '../src/memory/formatters.js';

describe('recall formatters', () => {
  it('formats recall results for operator workflows', () => {
    const hits = [
      { kind: 'semantic' as const, id: '1', text: 'remember this', createdAt: 't1', salience: 40, score: 60, tags: ['memory'] },
      { kind: 'session' as const, sessionId: 's1', sessionTitle: 'Demo', messageId: 'm1', role: 'user' as const, text: 'hello', createdAt: 't2', score: 50 },
    ];
    expect(formatRecallHits(hits)).toContain('semantic');
    expect(formatRecallSummary(hits)).toContain('Total hits: 2');
  });
});
