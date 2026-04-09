import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadAppConfig, setToolPolicy } from '../src/tools/config-store.js';

describe('tool config store', () => {
  it('persists tool policy overrides', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-toolcfg-${Date.now()}`);
    const before = await loadAppConfig(root);
    expect(before.tools.length).toBeGreaterThan(0);
    const after = await setToolPolicy('file-management', { access: 'guarded-write', approvedOverride: true }, root);
    const fileTool = after.tools.find((tool) => tool.toolId === 'file-management');
    expect(fileTool?.access).toBe('guarded-write');
    await fs.rm(root, { recursive: true, force: true });
  });
});
