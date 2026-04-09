import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deleteImportedSkill, importSkill, updateImportedSkill } from '../src/skills/runtime.js';
import { loadImportedSkills } from '../src/skills/store.js';

describe('skill registry', () => {
  it('imports, lists, updates, and removes skills with source metadata', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-skills-${Date.now()}`);
    const skill = await importSkill('https://github.com/example/demo-skill.git', root);
    expect(skill.sourceUrl).toContain('github.com');
    const listed = await loadImportedSkills(root);
    expect(listed).toHaveLength(1);
    const updated = await updateImportedSkill(skill.id, root);
    expect(updated.updatedAt >= updated.installedAt).toBe(true);
    const removed = await deleteImportedSkill(skill.id, root);
    expect(removed).toBe(true);
    await fs.rm(root, { recursive: true, force: true });
  });
});
