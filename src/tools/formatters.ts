import type { ToolPolicy } from './policy.js';
import { CORE_TOOL_CATALOG } from './catalog.js';

export function formatToolPolicies(policies: ToolPolicy[]): string {
  if (policies.length === 0) return 'No tool policies configured.';
  return policies
    .map((policy) => {
      const tool = CORE_TOOL_CATALOG.find((item) => item.id === policy.toolId);
      const label = tool?.label ?? policy.toolId;
      const risk = tool?.risk ?? 'unknown';
      return `${policy.toolId} | ${label} | risk=${risk} | access=${policy.access} | override=${policy.approvedOverride ? 'yes' : 'no'}`;
    })
    .join('\n');
}

export function formatToolPolicySummary(policies: ToolPolicy[]): string {
  const summary = {
    disabled: 0,
    readOnly: 0,
    guardedWrite: 0,
    fullAccess: 0,
    overridden: 0,
  };

  for (const policy of policies) {
    if (policy.access === 'disabled') summary.disabled += 1;
    if (policy.access === 'read-only') summary.readOnly += 1;
    if (policy.access === 'guarded-write') summary.guardedWrite += 1;
    if (policy.access === 'full-access') summary.fullAccess += 1;
    if (policy.approvedOverride) summary.overridden += 1;
  }

  return [
    `Disabled: ${summary.disabled}`,
    `Read-only: ${summary.readOnly}`,
    `Guarded-write: ${summary.guardedWrite}`,
    `Full-access: ${summary.fullAccess}`,
    `Overrides approved: ${summary.overridden}`,
  ].join('\n');
}
