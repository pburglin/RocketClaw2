import type { AppConfig } from '../config/load-config.js';
import { CORE_TOOL_CATALOG } from './catalog.js';
import { assertToolAccess, getToolPolicy } from './enforcement.js';
import { createApprovalRequest } from '../approval/store.js';

export type ToolExecutionRequest = {
  toolId: string;
  action: 'read' | 'write';
  approved?: boolean;
};

export type ToolExecutionResult = {
  ok: boolean;
  toolId: string;
  action: 'read' | 'write';
  detail: string;
};

export async function runToolWithPolicy(config: AppConfig, request: ToolExecutionRequest): Promise<ToolExecutionResult> {
  const tool = CORE_TOOL_CATALOG.find((item) => item.id === request.toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${request.toolId}`);
  }

  assertToolAccess(config, request.toolId, request.action);
  const policy = getToolPolicy(config, request.toolId);

  if (request.action === 'write' && tool.requiresApprovalForWrite && !request.approved) {
    if (config.yolo.enabled) {
      if (config.yolo.warn) {
        console.warn(`[YOLO WARNING] Auto-approving write execution for ${request.toolId}. This bypasses normal approval safeguards.`);
      }
    } else {
      const approval = await createApprovalRequest({
        kind: 'tool-write',
        target: request.toolId,
        detail: `Approval required for ${request.toolId} ${request.action} action`,
      });
      throw new Error(`Tool ${request.toolId} requires explicit approval for write execution. Approval request created: ${approval.id}`);
    }
  }

  return {
    ok: true,
    toolId: request.toolId,
    action: request.action,
    detail: `Simulated ${request.action} execution allowed for ${tool.label} with policy ${policy?.access}`,
  };
}
