import { describe, expect, it } from 'vitest';
import { filterIterationEntries } from '../src/harness/iteration-store.js';

describe('filterIterationEntries', () => {
  const entries = [
    {
      iteration: 1,
      timestamp: 't1',
      guidance: 'first',
      filesCreated: ['a.ts'],
      filesModified: [],
      validationPassed: false,
      validationStdout: '',
      validationStderr: 'boom',
    },
    {
      iteration: 2,
      timestamp: 't2',
      guidance: 'second',
      filesCreated: [],
      filesModified: ['a.ts'],
      validationPassed: true,
      validationStdout: 'ok',
      validationStderr: '',
    },
  ];

  it('returns only the latest iteration when requested', () => {
    expect(filterIterationEntries(entries, { latest: true })).toEqual([entries[1]]);
  });

  it('returns only failed iterations when requested', () => {
    expect(filterIterationEntries(entries, { failedOnly: true })).toEqual([entries[0]]);
  });

  it('returns a specific iteration when requested', () => {
    expect(filterIterationEntries(entries, { iteration: 2 })).toEqual([entries[1]]);
  });

  it('composes specific iteration and failed-only filters', () => {
    expect(filterIterationEntries(entries, { iteration: 2, failedOnly: true })).toEqual([]);
  });
});
