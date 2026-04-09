import { describe, expect, it } from 'vitest';
import { formatHarnessRuns } from '../src/harness/list-formatters.js';

describe('formatHarnessRuns', () => {
  it('formats persisted harness run summaries', () => {
    const text = formatHarnessRuns([{ runId: 'abc', ok: true, workspace: '/tmp/demo', task: 'demo task' }]);
    expect(text).toContain('abc');
    expect(text).toContain('demo task');
  });
});
