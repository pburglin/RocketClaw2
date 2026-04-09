import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/load-config.js';
import { runToolWithPolicy } from '../src/tools/runtime.js';

describe('runToolWithPolicy', () => {
  it('allows a safe read execution for file management', async () => {
    const config = loadConfig({
      tools: [
        { toolId: 'file-management', access: 'read-only', approvedOverride: false },
      ],
      messaging: { whatsapp: { enabled: true, mode: 'mock' } },
    });
    const result = await runToolWithPolicy(config, { toolId: 'file-management', action: 'read' });
    expect(result.ok).toBe(true);
  });

  it('blocks write execution without approval when tool requires it', async () => {
    const config = loadConfig({
      tools: [
        { toolId: 'file-management', access: 'full-access', approvedOverride: true },
      ],
      messaging: { whatsapp: { enabled: true, mode: 'mock' } },
    });
    await expect(runToolWithPolicy(config, { toolId: 'file-management', action: 'write', approved: false })).rejects.toThrow();
  });
});
