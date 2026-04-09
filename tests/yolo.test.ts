import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runToolWithPolicy } from '../src/tools/runtime.js';

describe('yolo mode', () => {
  it('auto-approves guarded write execution when yolo mode is enabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = loadConfig({
      yolo: { enabled: true, warn: true },
      tools: [{ toolId: 'file-management', access: 'full-access', approvedOverride: true }],
      messaging: { whatsapp: { enabled: true, mode: 'mock' } },
    });
    const result = runToolWithPolicy(config, { toolId: 'file-management', action: 'write', approved: false });
    expect(result.ok).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
