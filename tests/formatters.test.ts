import { describe, expect, it } from 'vitest';
import { formatSessionSummary, formatSessionDetail, formatSemanticMemory } from '../src/tui/formatters.js';

describe('operator formatters', () => {
  it('formats sessions and semantic memory for human-readable CLI output', () => {
    const summary = formatSessionSummary([
      { id: 's1', title: 'Demo', createdAt: 't1', updatedAt: 't2', messages: [] },
    ]);
    const detail = formatSessionDetail({
      id: 's1',
      title: 'Demo',
      createdAt: 't1',
      updatedAt: 't2',
      messages: [{ id: 'm1', role: 'user', text: 'hello', createdAt: 't3' }],
    });
    const memory = formatSemanticMemory([
      { id: 'm1', text: 'remember this', salience: 42, createdAt: 't1', tags: ['user'] },
    ]);

    expect(summary).toContain('Demo');
    expect(detail).toContain('[user] hello');
    expect(memory).toContain('remember this');
  });
});
