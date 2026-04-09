import { CORE_TOOL_CATALOG, type ToolAccessLevel } from './catalog.js';

export function describeOverrideWarning(toolId: string, access: ToolAccessLevel): string {
  const tool = CORE_TOOL_CATALOG.find((item) => item.id === toolId);
  if (!tool) return 'Unknown tool.';
  return [
    `Tool: ${tool.label}`,
    `Risk: ${tool.risk}`,
    `Default access: ${tool.defaultAccess}`,
    `Recommended access: ${tool.recommendedAccess}`,
    `Requested access: ${access}`,
    tool.requiresApprovalForWrite
      ? 'Recommendation: keep write actions gated by human approval unless you accept the risk.'
      : 'Recommendation: this tool can usually remain enabled with standard safeguards.',
  ].join('\n');
}
