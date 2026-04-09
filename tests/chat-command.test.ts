import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage, loadSession } from '../src/sessions/store.js';

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
});
