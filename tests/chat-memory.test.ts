import { describe, expect, it } from 'vitest';
import { addSemanticMemory } from '../src/memory/semantic-store.js';
import { recallMemory } from '../src/memory/recall.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

describe('memory-aware chat primitives', () => {
  it('can surface semantic memory for a matching query', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-chat-memory-${Date.now()}`);
    await addSemanticMemory({ text: 'Pedro prefers WhatsApp updates', salience: 55, tags: ['preference'] }, root);
    const hits = await recallMemory('WhatsApp', root);
    expect(hits.some((hit) => hit.kind === 'semantic')).toBe(true);
    await fs.rm(root, { recursive: true, force: true });
  });
});
