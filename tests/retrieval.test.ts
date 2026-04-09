import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage } from '../src/sessions/store.js';
import { searchSessionMemory } from '../src/memory/retrieval.js';

describe('searchSessionMemory', () => {
  it('finds persisted messages by text query', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-retrieval-${Date.now()}`);
    const session = await createSession('Retrieval Test', root);
    await appendMessage(session.id, 'user', 'alpha memory note', root);
    await appendMessage(session.id, 'assistant', 'I heard: alpha memory note', root);

    const hits = await searchSessionMemory('alpha', root);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.sessionTitle).toBe('Retrieval Test');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('matches partial token overlap instead of requiring exact substring order', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-retrieval-tokens-${Date.now()}`);
    const session = await createSession('Token Retrieval Test', root);
    await appendMessage(session.id, 'user', 'Pedro prefers WhatsApp updates in the morning', root);

    const hits = await searchSessionMemory('WhatsApp Pedro', root);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.text).toContain('Pedro prefers WhatsApp updates');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('ranks stronger phrase matches ahead of weaker token-only matches', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-retrieval-ranking-${Date.now()}`);
    const session = await createSession('Ranking Retrieval Test', root);
    await appendMessage(session.id, 'user', 'alpha beta gamma', root);
    await appendMessage(session.id, 'assistant', 'gamma alpha', root);

    const hits = await searchSessionMemory('alpha beta', root);
    expect(hits[0]?.text).toBe('alpha beta gamma');
    expect(hits[0]?.score).toBeGreaterThan(hits[1]?.score ?? 0);
    await fs.rm(root, { recursive: true, force: true });
  });
});
