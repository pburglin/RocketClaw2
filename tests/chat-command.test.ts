import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage, loadSession } from '../src/sessions/store.js';
import { buildAssistantReply } from '../src/commands/chat.js';

describe('session chat flow primitives', () => {
  const root = path.join(os.tmpdir(), `rocketclaw2-chat-${Date.now()}`);

  it('persists a simple user/assistant exchange', async () => {
    const session = await createSession('Chat Test', root);
    await appendMessage(session.id, 'user', 'hello', root);
    await appendMessage(session.id, 'assistant', 'I heard: hello', root);
    const loaded = await loadSession(session.id, root);
    expect(loaded?.messages).toHaveLength(2);
    expect(loaded?.messages[1]?.text).toBe('I heard: hello');
    await fs.rm(root, { recursive: true, force: true });
  });

  it('answers memory questions with recalled context instead of echoing', () => {
    const reply = buildAssistantReply('What do you remember about messaging?', [
      {
        kind: 'semantic',
        id: 'm1',
        text: 'Pedro prefers WhatsApp updates',
        createdAt: '2026-01-01T00:00:00.000Z',
        salience: 55,
        score: 75,
        tags: ['preference'],
      },
    ]);

    expect(reply).toContain("Here's what I found in memory:");
    expect(reply).toContain('Pedro prefers WhatsApp updates');
    expect(reply).not.toContain('Echo:');
  });

  it('returns a graceful fallback when asked about memory with no hits', () => {
    const reply = buildAssistantReply('What do you remember about Pedro?', []);
    expect(reply).toBe("I couldn't find anything relevant in memory yet.");
  });
});
