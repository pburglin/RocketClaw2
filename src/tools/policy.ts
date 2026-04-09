import { z } from 'zod';
import { CORE_TOOL_CATALOG, ToolAccessLevelSchema } from './catalog.js';

export const ToolPolicySchema = z.object({
  toolId: z.string(),
  access: ToolAccessLevelSchema,
  approvedOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
});

export type ToolPolicy = z.infer<typeof ToolPolicySchema>;

export function buildDefaultToolPolicies(): ToolPolicy[] {
  return CORE_TOOL_CATALOG.map((tool) => ({
    toolId: tool.id,
    access: tool.defaultAccess,
    approvedOverride: false,
  }));
}

export function describeToolRiskPosture() {
  return CORE_TOOL_CATALOG.map((tool) => ({
    id: tool.id,
    label: tool.label,
    risk: tool.risk,
    recommendedAccess: tool.recommendedAccess,
    defaultAccess: tool.defaultAccess,
    requiresApprovalForWrite: tool.requiresApprovalForWrite,
    recommendation:
      tool.defaultAccess === tool.recommendedAccess
        ? 'Default matches recommended safe posture.'
        : `Default is intentionally stricter than recommended. User may override after reviewing risk.`,
  }));
}
