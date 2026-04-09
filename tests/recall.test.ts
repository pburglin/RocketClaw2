import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage } from '../src/sessions/store.js';
import { addSemanticMemory } from '../src/memory/semantic-store.js';
import { recallMemory } from '../src/memory/recall.js';
import { loadConfig } from '../src/config/load-config.js';

describe('recallMemory', () => {
  it('returns hits from sessions and semantic memory together', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-${Date.now()}`);
    const session = await createSession('Recall Test', root);
    await appendMessage(session.id, 'user', 'alpha from session', root);
    await addSemanticMemory({ text: 'alpha from semantic memory', salience: 50, tags: ['memory'] }, root);

    const hits = await recallMemory('alpha', root);
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.some((hit) => hit.kind === 'session')).toBe(true);
    expect(hits.some((hit) => hit.kind === 'semantic')).toBe(true);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('finds semantic memory from out-of-order token matches', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-semantic-${Date.now()}`);
    await addSemanticMemory({ text: 'Pedro prefers WhatsApp updates', salience: 40, tags: ['preference'] }, root);

    const hits = await recallMemory('WhatsApp Pedro', root);
    expect(hits.some((hit) => hit.kind === 'semantic' && hit.text.includes('Pedro prefers WhatsApp updates'))).toBe(true);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('can match semantic memory by tags using the same lexical scoring path', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-tags-${Date.now()}`);
    await addSemanticMemory({ text: 'Morning briefing preference', salience: 35, tags: ['whatsapp', 'briefing'] }, root);

    const hits = await recallMemory('briefing whatsapp', root);
    expect(hits.some((hit) => hit.kind === 'semantic')).toBe(true);

    await fs.rm(root, { recursive: true, force: true });
  });

  it('deduplicates identical semantic and session hits to reduce noisy recall output', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-dedupe-${Date.now()}`);
    const session = await createSession('Recall Dedupe Test', root);
    await appendMessage(session.id, 'user', 'Pedro prefers WhatsApp updates', root);
    await addSemanticMemory({ text: 'Pedro prefers WhatsApp updates', salience: 80, tags: ['preference'] }, root);

    const hits = await recallMemory('WhatsApp Pedro', root);
    const matchingHits = hits.filter((hit) => hit.text === 'Pedro prefers WhatsApp updates');
    expect(matchingHits).toHaveLength(1);
    expect(matchingHits[0]?.kind).toBe('semantic');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('applies a light diversity penalty so one session does not dominate the top results', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-diversity-${Date.now()}`);
    const sessionA = await createSession('Session A', root);
    const sessionB = await createSession('Session B', root);

    await appendMessage(sessionA.id, 'user', 'alpha shared first', root);
    await appendMessage(sessionA.id, 'assistant', 'alpha shared second', root);
    await appendMessage(sessionB.id, 'user', 'alpha different session', root);

    const hits = await recallMemory('alpha', root);
    expect(hits[0]?.kind).toBe('session');
    expect(hits[1]?.kind).toBe('session');
    if (hits[0]?.kind === 'session' && hits[1]?.kind === 'session') {
      expect(hits[0].sessionId).not.toBe(hits[1].sessionId);
    }

    await fs.rm(root, { recursive: true, force: true });
  });

  it('boosts salient session memories so durable user facts can outrank shallow lexical matches', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-salience-${Date.now()}`);
    const session = await createSession('Recall Salience Test', root);

    await appendMessage(session.id, 'assistant', 'alpha', root);
    await appendMessage(session.id, 'user', 'Important decision: alpha is Pedro\'s preferred WhatsApp briefing channel for later', root);

    const hits = await recallMemory('alpha', root);
    expect(hits[0]?.kind).toBe('session');
    expect(hits[0]?.text).toContain('Important decision');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('applies recency balancing so newer relevant episodic memories can outrank older ones', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-04-08T17:18:00.000Z'));
      const root = path.join(os.tmpdir(), `rocketclaw2-recall-recency-${Date.now()}`);
      const session = await createSession('Recall Recency Test', root);

      await appendMessage(session.id, 'user', 'alpha old note', root);
      vi.setSystemTime(new Date('2026-04-08T17:18:00.000Z'));
      await appendMessage(session.id, 'user', 'alpha recent note', root);

      const sessionPath = path.join(root, 'sessions', `${session.id}.json`);
      const raw = JSON.parse(await fs.readFile(sessionPath, 'utf8')) as { messages: Array<{ text: string; createdAt: string }>; updatedAt: string };
      raw.messages[0]!.createdAt = '2025-12-01T00:00:00.000Z';
      raw.updatedAt = raw.messages[1]!.createdAt;
      await fs.writeFile(sessionPath, JSON.stringify(raw, null, 2));

      const hits = await recallMemory('alpha', root);
      expect(hits[0]?.text).toBe('alpha recent note');

      await fs.rm(root, { recursive: true, force: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies gentler recency decay to semantic memory than to episodic session memory', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-04-08T19:18:00.000Z'));
      const root = path.join(os.tmpdir(), `rocketclaw2-recall-recency-profiles-${Date.now()}`);
      const session = await createSession('Recall Semantic Recency Test', root);
      await appendMessage(session.id, 'user', 'alpha session note', root);
      await addSemanticMemory({ text: 'alpha semantic note', salience: 55, tags: ['memory'] }, root);

      const sessionPath = path.join(root, 'sessions', `${session.id}.json`);
      const rawSession = JSON.parse(await fs.readFile(sessionPath, 'utf8')) as { messages: Array<{ createdAt: string }>; updatedAt: string };
      rawSession.messages[0]!.createdAt = '2025-10-01T00:00:00.000Z';
      rawSession.updatedAt = rawSession.messages[0]!.createdAt;
      await fs.writeFile(sessionPath, JSON.stringify(rawSession, null, 2));

      const semanticPath = path.join(root, 'memory', 'semantic-memory.json');
      const rawSemantic = JSON.parse(await fs.readFile(semanticPath, 'utf8')) as Array<{ createdAt: string }>;
      rawSemantic[0]!.createdAt = '2025-10-01T00:00:00.000Z';
      await fs.writeFile(semanticPath, JSON.stringify(rawSemantic, null, 2));

      const hits = await recallMemory('alpha', root);
      expect(hits[0]?.kind).toBe('semantic');
      expect(hits[0]?.text).toBe('alpha semantic note');

      await fs.rm(root, { recursive: true, force: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports configurable recall scoring weights', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-config-${Date.now()}`);
    const session = await createSession('Recall Config Test', root);

    await appendMessage(session.id, 'assistant', 'alpha', root);
    await appendMessage(session.id, 'user', 'Important decision: alpha is the preferred channel', root);

    const defaultHits = await recallMemory('alpha', root);
    expect(defaultHits[0]?.text).toContain('Important decision');

    const customScoring = loadConfig({
      recallScoring: {
        sessionSalienceMultiplier: 0,
        diversityPenaltyPerBucketHit: 0,
        duplicateSemanticPriorityBonus: 100,
      },
    }).recallScoring;

    const customHits = await recallMemory('alpha', root, customScoring);
    expect(customHits[0]?.text).toBe('alpha');

    await fs.rm(root, { recursive: true, force: true });
  });

  it('uses persisted recall scoring config from disk when no override is provided', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-recall-disk-config-${Date.now()}`);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'config.yaml'),
      `recallScoring:\n  sessionSalienceMultiplier: 0\n  diversityPenaltyPerBucketHit: 0\n`,
    );

    const session = await createSession('Recall Disk Config Test', root);
    await appendMessage(session.id, 'assistant', 'alpha', root);
    await appendMessage(session.id, 'user', 'Important decision: alpha is the preferred channel', root);

    const hits = await recallMemory('alpha', root);
    expect(hits[0]?.text).toBe('alpha');

    await fs.rm(root, { recursive: true, force: true });
  });
});
