import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSession, appendMessage } from '../src/sessions/store.js';
import { getSessionStats } from '../src/sessions/stats.js';

describe('getSessionStats', () => {
  it('aggregates session and message counts', async () => {
    const root = path.join(os.tmpdir(), `rocketclaw2-stats-${Date.now()}`);
    const session = await createSession('Stats Session', root);
    await appendMessage(session.id, 'user', 'hello', root);
    await appendMessage(session.id, 'assistant', 'hi', root);
    const stats = await getSessionStats(root);
    expect(stats.sessionCount).toBe(1);
    expect(stats.messageCount).toBe(2);
    expect(stats.userMessages).toBe(1);
    expect(stats.assistantMessages).toBe(1);
    await fs.rm(root, { recursive: true, force: true });
  });
});
