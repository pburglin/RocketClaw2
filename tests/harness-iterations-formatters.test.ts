import { describe, expect, it } from 'vitest';
import { formatHarnessIterations } from '../src/harness/formatters.js';

describe('formatHarnessIterations', () => {
  it('formats iteration entries without guidance by default', () => {
    const text = formatHarnessIterations([
      {
        iteration: 2,
        timestamp: '2026-04-09T17:00:00.000Z',
        guidance: 'create file',
        criticInsight: 'missing package.json',
        filesCreated: ['package.json'],
        filesModified: ['index.js'],
        validationPassed: false,
        validationStdout: '',
        validationStderr: 'npm ERR',
      },
    ]);
    expect(text).toContain('Iteration 2 | passed=false | created=1 | modified=1');
    expect(text).toContain('critic: missing package.json');
    expect(text).not.toContain('guidance: create file');
  });

  it('includes guidance when requested', () => {
    const text = formatHarnessIterations([
      {
        iteration: 1,
        timestamp: '2026-04-09T17:00:00.000Z',
        guidance: 'write index.js',
        filesCreated: ['index.js'],
        filesModified: [],
        validationPassed: true,
        validationStdout: 'ok',
        validationStderr: '',
      },
    ], { includeGuidance: true });
    expect(text).toContain('guidance: write index.js');
  });
});
