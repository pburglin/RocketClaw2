import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { importSkill, updateImportedSkill } from '../src/skills/runtime.js';

describe('skill update metadata', () => {
  it('tracks update count and last action', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-skillmeta-${Date.now()}`);
    const imported = await importSkill('https://github.com/example/demo-skill.git', root);
    expect(imported.updateCount).toBe(0);
    const updated = await updateImportedSkill(imported.id, root);
    expect(updated.updateCount).toBe(1);
    expect(updated.lastAction).toBe('updated');
    await fs.rm(root, { recursive: true, force: true });
  });
});
