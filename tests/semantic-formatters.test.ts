import { describe, expect, it } from 'vitest';
import { formatSemanticMemoryFiltered, formatSemanticMemorySummary } from '../src/memory/semantic-formatters.js';

describe('semantic memory formatters', () => {
  it('formats semantic memory summaries and filtered lists', () => {
    const entries = [
      { id: '1', text: 'remember a preference', salience: 50, createdAt: 't1', tags: ['preference'] },
      { id: '2', text: 'remember architecture', salience: 80, createdAt: 't2', tags: ['architecture'] },
    ];
    expect(formatSemanticMemorySummary(entries)).toContain('Semantic entries: 2');
    expect(formatSemanticMemoryFiltered(entries)).toContain('remember architecture');
  });
});
