import { describe, expect, it } from 'vitest';
import { CORE_TOOL_CATALOG } from '../src/tools/catalog.js';
import { buildDefaultToolPolicies, describeToolRiskPosture } from '../src/tools/policy.js';
import { loadConfig } from '../src/config/load-config.js';

describe('tool policy model', () => {
  it('provides safe defaults for the core tool catalog', () => {
    const policies = buildDefaultToolPolicies();
    expect(policies).toHaveLength(CORE_TOOL_CATALOG.length);
    expect(policies.some((policy) => policy.access === 'disabled')).toBe(true);
  });

  it('loads config with default tool policies', () => {
    const config = loadConfig({});
    expect(config.tools.length).toBe(CORE_TOOL_CATALOG.length);
  });

  it('describes risk posture for user review and overrides', () => {
    const posture = describeToolRiskPosture();
    expect(posture.some((item) => item.requiresApprovalForWrite)).toBe(true);
  });
});
