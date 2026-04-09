import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { addSemanticMemory, loadSemanticMemory } from '../src/memory/semantic-store.js';

describe('semantic memory store', () => {
  it('persists curated semantic memory entries', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-semantic-${Date.now()}`);
    await addSemanticMemory({ text: 'remember this durable fact', salience: 42, tags: ['user'] }, root);
    const entries = await loadSemanticMemory(root);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.text).toContain('durable fact');
    await fs.rm(root, { recursive: true, force: true });
  });
});
