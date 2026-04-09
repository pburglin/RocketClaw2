import { describe, expect, it } from 'vitest';
import { formatToolPolicies, formatToolPolicySummary } from '../src/tools/formatters.js';

describe('tool policy formatters', () => {
  it('formats tool policy lists and summaries for operators', () => {
    const policies = [
      { toolId: 'file-management', access: 'read-only' as const, approvedOverride: false },
      { toolId: 'database-connectors', access: 'guarded-write' as const, approvedOverride: true },
    ];
    expect(formatToolPolicies(policies)).toContain('file-management');
    expect(formatToolPolicySummary(policies)).toContain('Overrides approved: 1');
  });
});
