import { describe, expect, it } from 'vitest';
import { formatHarnessIterations } from '../src/harness/formatters.js';

describe('formatHarnessIterations', () => {
  it('formats iteration history for operators', () => {
    const text = formatHarnessIterations([
      {
        iteration: 1,
        timestamp: 't1',
        guidance: 'Create file',
        filesCreated: ['index.js'],
        filesModified: [],
        validationPassed: false,
        validationStdout: '',
        validationStderr: 'missing test',
        criticInsight: 'Add a test runner',
      },
      {
        iteration: 2,
        timestamp: 't2',
        guidance: 'Fix validation',
        filesCreated: [],
        filesModified: ['package.json'],
        validationPassed: true,
        validationStdout: 'ok',
        validationStderr: '',
      },
    ]);

    expect(text).toContain('Iteration 1 | passed=false');
    expect(text).toContain('critic: Add a test runner');
    expect(text).toContain('Iteration 2 | passed=true');
  });
});
