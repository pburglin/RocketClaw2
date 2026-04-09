import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { buildSystemSummary, formatSystemSummary } from '../src/config/system-summary.js';

describe('system summary', () => {
  it('builds a unified operator summary', () => {
    const config = loadConfig({});
    const summary = buildSystemSummary(config);
    expect(summary.tools.total).toBeGreaterThan(0);
    expect(formatSystemSummary(summary)).toContain('Profile:');
  });
});
