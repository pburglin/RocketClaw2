import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { appendMessage, createSession, listSessions, loadSession } from '../src/sessions/store.js';

describe('session store', () => {
  const root = path.join(os.tmpdir(), `rocketclaw2-test-${Date.now()}`);

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('creates, lists, loads, and appends to sessions', async () => {
    const session = await createSession('Test Session', root);
    expect(session.title).toBe('Test Session');

    const listed = await listSessions(root);
    expect(listed).toHaveLength(1);

    const updated = await appendMessage(session.id, 'user', 'hello', root);
    expect(updated.messages).toHaveLength(1);

    const loaded = await loadSession(session.id, root);
    expect(loaded?.messages[0]?.text).toBe('hello');
  });
});
