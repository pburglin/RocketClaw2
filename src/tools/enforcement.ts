import type { AppConfig } from '../config/load-config.js';

export function getToolPolicy(config: AppConfig, toolId: string) {
  return config.tools.find((tool) => tool.toolId === toolId) ?? null;
}

export function assertToolAccess(config: AppConfig, toolId: string, desired: 'read' | 'write'): void {
  const policy = getToolPolicy(config, toolId);
  if (!policy) {
    throw new Error(`Tool policy not found: ${toolId}`);
  }

  if (policy.access === 'disabled') {
    throw new Error(`Tool ${toolId} is disabled`);
  }

  if (desired === 'write' && policy.access === 'read-only') {
    throw new Error(`Tool ${toolId} is read-only`);
  }

  if (desired === 'write' && policy.access === 'guarded-write' && !policy.approvedOverride) {
    throw new Error(`Tool ${toolId} requires explicit approved override for write access`);
  }
}
